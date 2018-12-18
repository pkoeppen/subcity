const {
  chunk,
  flatten,
  includes,
  merge,
  omit,
  pick,
  isEmpty
} = require("lodash");

const {
  promisify,
  generateID,
  DynamoDB,
  buildDynamoDBQuery,
  sanitize,
  parseMarkdown,
  curateSets,
  stripeUtilities
} = require("../../shared");

const {
  getSyndicateById,
  updateSyndicate
} = require("./syndicate");


///////////////////////////////////////////////////
///////////////////// QUERIES /////////////////////
///////////////////////////////////////////////////


const getProposalById = (root, args) => {

  const {
    syndicate_id,
    proposal_id
  } = args;

  const params = {
    TableName: process.env.DYNAMODB_TABLE_PROPOSALS,
    Key: { syndicate_id, proposal_id },
  };

  return DynamoDB.get(params).promise()
  .then(({ Item: proposal }) => {

    if (proposal) {
      proposal = checkExpired(proposal);
      proposal = curateSets(proposal);
      return proposal;

    } else {
      throw new Error("Proposal not found.");
    }

  });
}


const getProposalsByIdArray = (root, args) => {

  const {
    syndicate_id,
    proposals
  } = root;

  if (!proposals || !proposals.length) { return []; }

  const chunked = chunk(proposals, 100).map(chunk => {

    const params = {
      RequestItems: {
        [process.env.DYNAMODB_TABLE_PROPOSALS]: {
          Keys: chunk.map(proposal_id => ({ syndicate_id, proposal_id }))
        }
      }
    };

    return DynamoDB.batchGet(params).promise();
  });

  return Promise.all(chunked).then(results => {

    const proposals = flatten(results.map(({ Responses }) => Responses[process.env.DYNAMODB_TABLE_PROPOSALS]));

    return proposals.map(proposal => {

      if (proposal.description) {
        proposal.description = parseMarkdown(proposal.description);
      }

      proposal = checkExpired(proposal);
      proposal = curateSets(proposal);
      return proposal;
    });

  });
};


///////////////////////////////////////////////////
//////////////////// MUTATIONS ////////////////////
///////////////////////////////////////////////////


const createProposal = async (root, args, ctx, ast) => {

  var data = sanitize(args.data);

  // Disallow simultaneous changes to syndicate data (title, slug, etc.)
  // in conjunction with "action" proposals (invitations, mergers, dissolutions).

  if (data.action) {
    data = pick(data, [
      "channel_id",
      "_channel_id",
      "syndicate_id",
      "_syndicate_id",
      "action"
    ]);
  } else {
    data = omit(data, [
      "_channel_id",
      "_syndicate_id",
      "action"
    ]);
  }

  const { channel_id, syndicate_id } = data;
  const syndicate = await getSyndicateById(null, { syndicate_id });

  if (!syndicateHasChannel(syndicate, channel_id)) {

    // If the channel is not a member of the syndicate...

    throw new Error("No such member channel.");
  }

  if (identicalProposalAlreadyExists(await getProposalsByIdArray(syndicate), data)) {

    // If an identical proposal has already been submitted...

    throw new Error("Identical proposal already exists.");
  }

  // TODO: Add a check to limit the number of proposals any one channel can have at a time.


  // TODO: Change this expires bullshit.

  const proposal_id = generateID();
  var created = new Date();
  var expires = new Date();

  // Set expiry to 24 hours.

  expires.setDate(created.getDate() + 1);

  const toMerge = {
    proposal_id,
    time_created: Date.now(),
    status: "pending",
    channel_id,
    votes: {}
  };

  // Obtain proposal object.

  const proposal = omit(merge(data, toMerge), "channel_id");

  // Create the proposal in DynamoDB.

  return DynamoDB.put({
    TableName: process.env.DYNAMODB_TABLE_PROPOSALS,
    Item: proposal
  }).promise().then(() => proposal);
};


const submitProposalVote = async (root, args, ctx, ast) => {

  const { data } = args;

  var a = b = c = Promise.resolve();

  const {
    channel_id,
    syndicate_id,
    proposal_id,
    motion
  } = data;

  const [
    proposal,
    syndicate
  ] = await Promise.all([
    getProposalById(null, { syndicate_id, proposal_id }),
    getSyndicateById(null, { syndicate_id })
  ]);

  if (!syndicateHasChannel(syndicate, channel_id)) {
    throw new Error("No such member channel.");
  }

  if (channelAlreadyVoted(proposal, channel_id)) {
    throw new Error("Vote already submitted for this proposal.");
  }

  if (proposal.status !== "pending") {
    throw new Error("Voting has closed.");
  }

  // Add the vote to the proposal.

  var UpdateExpression = `SET #votes.#channel_id :vote_object`;

  var ExpressionAttributeNames = {
    "#votes": "votes",
    "#channel_id": channel_id
  };

  var ExpressionAttributeValues = {
    ":vote_object": {
      motion,
      time_created: Date.now()
    }
  };

  const approved = (motion === true) && approvalTriggered(proposal, syndicate);
  const rejected = (motion === false) && rejectionTriggered(proposal, syndicate);

  if (approved) {

    // The proposal has accumulated enough approvals to
    // trigger its application to the parent syndicate.

    UpdateExpression += " SET status = :status";
    ExpressionAttributeValues[":status"] = "approved";

    if (proposal.action) {

      // Handle mergers, invites, and dissolutions.

      switch(proposal.action) {

        case "merge_request":
          b = handleMergeRequest(syndicate, proposal);
          break;

        case "merge_approval":
          b = handleMergeApproval(syndicate, proposal);
          break;

        case "invite":
          b = handleInvite(syndicate, proposal);
          break;

        case "dissolve":
          b = handleDissolve(syndicate);
          break;

        default:
          throw new Error("Invalid action type.");
      }

    } else {

      // Otherwise, apply proposal changes to syndicate as usual.

      c = updateSyndicate(proposal);
    }

  } else if (rejected) {

    // TODO: Trigger rejection if it is now impossible to accumulate enough votes to trigger an approval.

    // The proposal has accumulated enough rejections
    // to trigger a dormant "rejected" status.

    UpdateExpression += " SET status = :status";
    ExpressionAttributeValues[":status"] = "rejected";
  }

  // Update the proposal itself.

  console.log(`[DynamoDB:PROPOSALS] Updating proposal ${syndicate_id}:${proposal_id} (${UpdateExpression})`);
  a = DynamoDB.update({
    TableName: process.env.DYNAMODB_TABLE_PROPOSALS,
    Key: { syndicate_id, proposal_id },
    UpdateExpression,
    ExpressionAttributeNames,
    ExpressionAttributeValues
  }).promise();

  // Attach the new slug to the return object, if there is one and if the proposal
  // has been approved; will be used to redirect the client to a new settings page.

  const returnable = Object.assign({ proposal_id }, (proposal.slug && approved) ? { slug: proposal.slug } : null);

  return Promise.all([a,b,c])
  .then(() => returnable)
  .catch(error => {
    console.error(error);
    throw new Error("Error submitting proposal vote.");
  });
};


const deleteProposal = data => {

  const { syndicate_id, proposal_id } = data;

  return DynamoDB.delete({
    TableName: process.env.DYNAMODB_TABLE_PROPOSALS,
    Key: {
      syndicate_id,
      proposal_id
    }
  }).promise().then(() => true);
};


////////////////////////////////////////////////////
///////////////////// EXPORTS //////////////////////
////////////////////////////////////////////////////


module.exports = {
  getProposalById,
  getProposalsByIdArray,
  createProposal,
  deleteProposal, 
  submitProposalVote
};


////////////////////////////////////////////////////
//////////////////// FUNCTIONS /////////////////////
////////////////////////////////////////////////////


const MAJORITY_RATIO = (2 / 3);


function checkExpired(proposal) {

  const {
    syndicate_id,
    proposal_id,
    time_created,
    status
  } = proposal;

  // If the status is already at an end state... [approved | rejected | expired]

  if (status !== "pending") { return proposal; }

  var expires = new Date(time_created);
  expires.setMonth(expires.getMonth + 1);

  if (Date.now() > expires) {

    // Proposal has expired - change status and hot-return proposal.

    status = "expired";

    console.log(`[DynamoDB:PROPOSALS] Updating proposal ${syndicate_id}:${proposal_id} to EXPIRED`);
    DynamoDB.update({
      TableName: process.env.DYNAMODB_TABLE_PROPOSALS,
      Key: {
        syndicate_id,
        proposal_id
      },
      UpdateExpression: `SET status = :status`,
      ExpressionAttributeValues: { ":status": "expired" }
    });
  }

  return proposal;
}


function syndicateHasChannel(syndicate, channel_id) {
  const channels = Object.keys(syndicate.channels);
  return (channels.indexOf(channel_id) >= 0);
}


function channelAlreadyVoted(proposal, channel_id) {
  return (Object.keys(proposal.votes).indexOf(channel_id) >= 0);
}


function identicalProposalAlreadyExists(proposals, data) {

  data = omit(data, ["channel_id", "syndicate_id"]);
  const keys = Object.keys(data);

  for (let i = 0; i < proposals.length; i++) {
    if (keys.length === keys.map(key => (proposals[i][key] === data[key])).filter(x => x).length) {
      return true;
    }
  }

  return false;
}


function approvalTriggered(proposal, syndicate) {

  let count    = 1;
  let channels = Object.keys(syndicate.channels).length;

  Object.values(proposal.votes).map(({ motion }) => {
    if (motion === true) {
      count++;
    }
  });

  return (count / channels >= MAJORITY_RATIO);
}


function rejectionTriggered(proposal, syndicate) {

  let count    = 1;
  let channels = Object.keys(syndicate.channels).length;

  Object.values(proposal.votes).map(({ motion }) => {
    if (motion === false) {
      count++;
    }
  });

  return (count / channels >= MAJORITY_RATIO);
}


function handleMergeRequest(syndicate, proposal) {
  
  // Submits a proposal to the slave syndicate to merge into the master syndicate.
  // Takes place from within the master syndicate, unlike handleMergeApproval.

  const {
    syndicate_id: master_syndicate_id
  } = syndicate;

  const {
    _syndicate_id: slave_syndicate_id
  } = proposal;

  const data = {
    action:        "merge_approval",
    syndicate_id:  slave_syndicate_id,
    _syndicate_id: master_syndicate_id
  };

  return createProposal(null, { data });
}


async function handleMergeApproval(syndicate, proposal) {

  // Enacts proposal to merge the slave syndicate into the master syndicate.
  // Triggered within the slave syndicate, unlike handleMergeRequest.

  const {
    syndicate_id: slave_syndicate_id
  } = syndicate;

  const {
    _syndicate_id: master_syndicate_id
  } = proposal;

  // Transfer all Stripe subscriptions to the master syndicate.

  const _0 = DynamoDB.get({
    TableName: process.env.DYNAMODB_TABLE_SYNDICATES,
    Key: {
      syndicate_id: master_syndicate_id
    }
  }).promise()
  .then(({ Item: { plan_id: new_plan_id } }) => {
    const product_id = `prod_syndicate_${slave_syndicate_id}`;
    return stripeUtilities.handleSubscriptionTransfer(product_id, new_plan_id, true);
  });

  // Convert all slave syndicate memberships to master syndicate.

  const _1 = DynamoDB.query({
    TableName: process.env.DYNAMODB_TABLE_MEMBERSHIPS,
    IndexName: `${process.env.DYNAMODB_TABLE_MEMBERSHIPS}-GSI`,
    KeyConditionExpression: "syndicate_id = :syndicate_id",
    ExpressionAttributeValues: {
      ":syndicate_id": slave_syndicate_id
    }
  }).promise()
  .then(({ Items: memberships }) => {

    memberships.map(({ channel_id }) => {

      console.log(`${"[DynamoDB:MEMBERSHIPS] ".padEnd(30, ".")} Converting membership for channel ${channel_id} to syndicate ${master_syndicate_id}`);
      return DynamoDB.update({
        TableName: process.env.DYNAMODB_TABLE_MEMBERSHIPS,
        Key: {
          channel_id,
          syndicate_id: slave_syndicate_id
        },
        UpdateExpression: `SET syndicate_id :syndicate_id`,
        ExpressionAttributeValues: {
          ":syndicate_id": master_syndicate_id
        }
      }).promise()
      .catch(error => {

        // Channel is a member of both syndicates already. Delete slave membership.

        console.log(`${"[DynamoDB:MEMBERSHIPS] ".padEnd(30, ".")} Deleting membership for channel ${channel_id} in syndicate ${slave_syndicate_id}`);
        return DynamoDB.delete({
          TableName: process.env.DYNAMODB_TABLE_SYNDICATES,
          Key: {
            channel_id,
            syndicate_id: slave_syndicate_id
          }
        }).promise();
      });
    });
  });

  // Convert all slave syndicate subscriptions to master syndicate.

  const _2 = DynamoDB.query({
    TableName: process.env.DYNAMODB_TABLE_SUBSCRIPTIONS,
    IndexName: `${process.env.DYNAMODB_TABLE_SUBSCRIPTIONS}-GSI-2`,
    KeyConditionExpression: "syndicate_id = :syndicate_id",
    ExpressionAttributeValues: {
      ":syndicate_id": slave_syndicate_id
    }
  }).promise()
  .then(({ Items: subscriptions }) => {

    return Promise.all(subscriptions.map(subscription => {
      const {
        subscriber_id,
        subscription_id
      } = subscription;

      console.log(`${"[DynamoDB:SUBSCRIPTIONS] ".padEnd(30, ".")} Updating subscription ${subscription_id} to syndicate ${master_syndicate_id}`);
      return DynamoDB.update({
        TableName: process.env.DYNAMODB_TABLE_SUBSCRIPTIONS,
        Key: {
          subscriber_id,
          syndicate_id
        },
        UpdateExpression: "SET syndicate_id = :syndicate_id",
        ExpressionAttributeValues: {
          ":syndicate_id": master_syndicate_id
        }
      }).promise();

    }));
  });

  // Delete all slave syndicate proposals.

  const _3 = DynamoDB.query({
    TableName: process.env.DYNAMODB_TABLE_PROPOSALS,
    KeyConditionExpression: "syndicate_id = :syndicate_id",
    ExpressionAttributeValues: {
      ":syndicate_id": slave_syndicate_id
    }
  }).promise()
  .then(({ Items: proposals }) => {

    console.log(`${"[DynamoDB:PROPOSALS] ".padEnd(30, ".")} Batch deleting all proposals for syndicate ${slave_syndicate_id}`);
    const chunked = chunk(proposals, 25).map(chunk => {
      const requests = chunk.map(proposal_id => ({
        DeleteRequest: {
          Key: {
            proposal_id
          }
        }
      }));
      const params = {
        RequestItems: {
          [process.env.DYNAMODB_TABLE_PROPOSALS]: requests
        }
      };
      return DynamoDB.batchWrite(params).promise();
    });

    return Promise.all(chunked);
  });

  // Delete the slave syndicate itself.

  console.log(`${"[DynamoDB:SYNDICATES] ".padEnd(30, ".")} Deleting syndicate ${slave_syndicate_id}`);
  const _4 = DynamoDB.delete({
    TableName: process.env.DYNAMODB_TABLE_SYNDICATES,
    Key: {
      syndicate_id: slave_syndicate_id
    },
  }).promise();

  // Delete syndicate media from S3.
  // TODO.

  // Execute.

  return Promise.all([_0,_1,_2,_3,_4]);
}


function handleInvite(syndicate, proposal) {

  const {
    syndicate_id,
    channels
  } = syndicate;
  
  const {
    _channel_id: channel_id
  } = proposal;

  if (includes(Object.keys(channels), channel_id)) {

    // If the channel to be invited is already a member of the syndicate...
    // (i.e., if someone technically inclined is being tricky...)

    throw new Error("Channel is already a member.");
  }

  const invitation = syndicate_id;

  console.log(`[DynamoDB:CHANNELS] Adding invitation from syndicate ${syndicate_id} to channel ${channel_id}`);
  return DynamoDB.update({
    TableName: process.env.DYNAMODB_TABLE_CHANNELS,
    Key: { channel_id },
    UpdateExpression: "ADD invitations :invitation",
    ExpressionAttributeValues: { ":invitation": DynamoDB.createSet([invitation]) },

    // This expression avoids accidental creation.

    ConditionExpression: "attribute_exists(channel_id)"
  }).promise();
}


function handleDissolve({ syndicate_id, channels, proposals }) {

  // Remove syndicate from all member channels.

  const a = Promise.all(Object.keys(channels).map(channel_id => {
    console.log(`[DynamoDB:CHANNELS] Dissolve: Removing syndicate ${syndicate_id} from channel ${channel_id}`);
    return DynamoDB.update({
      TableName: process.env.DYNAMODB_TABLE_CHANNELS,
      Key: { channel_id },
      UpdateExpression: `DELETE syndicates :syndicate_id`,
      ExpressionAttributeValues: { ":syndicate_id": DynamoDB.createSet([syndicate_id]) }
    }).promise();
  }));

  // Delete all proposals from proposal table.

  const b = Promise.all(proposals.map(proposal_id => {
    console.log(`[DynamoDB:PROPOSALS] Dissolve: Deleting proposal ${syndicate_id}:${proposal_id}`);
    return DynamoDB.delete({
      TableName: process.env.DYNAMODB_TABLE_PROPOSALS,
      Key: {
        syndicate_id,
        proposal_id
      },
    }).promise();
  }));

  // Delete the syndicate itself.

  console.log(`[DynamoDB:SYNDICATES] Dissolve: Permanently deleting syndicate ${syndicate_id}`);
  const c = DynamoDB.delete({
    TableName: process.env.DYNAMODB_TABLE_SYNDICATES,
    Key: { syndicate_id },
  }).promise();

  // Purge Stripe stuff.

  const product_id = `prod_syndicate_${syndicate_id}`;
  const d = stripeUtilities.purgeByProductID(product_id);

  return Promise.all([a,b,c,d]);
}