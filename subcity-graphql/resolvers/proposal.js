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
} = require("../shared");
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

  const god = (ctx || {}).god || false;

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

  if (!god && !syndicateHasChannel(syndicate, channel_id)) {

    // If the channel is not a member of the syndicate...

    throw new Error("No such member channel.");
  }

  if (!god && identicalProposalAlreadyExists(await getProposalsByIdArray(syndicate), data)) {

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
    proposal_id: proposal_id,
    created_at: new Date().getTime(),
    expires: expires.toISOString(),
    proposal_status: "pending",
    profile_url: `${process.env.DATA_HOST}/${process.env.S3_BUCKET_OUT}/syndicates/${syndicate_id}/proposals/${proposal_id}/profile.jpeg`,
    creator: channel_id,
    // approvals: [channel_id],
    approvals: DynamoDB.createSet(["__DEFAULT__"]),
    rejections: DynamoDB.createSet(["__DEFAULT__"])
  };

  // Obtain proposal object.

  const proposal = omit(merge(data, toMerge), "channel_id");

  // Create the proposal in DynamoDB...

  const a = DynamoDB.put({
    TableName: process.env.DYNAMODB_TABLE_PROPOSALS,
    Item: proposal
  }).promise();

  // ...and append "proposal_id" to its parent syndicate.

  const b = DynamoDB.update({
    TableName: process.env.DYNAMODB_TABLE_SYNDICATES,
    Key: { syndicate_id },
    UpdateExpression: `ADD proposals :proposal_id`,
    ExpressionAttributeValues: { ":proposal_id": DynamoDB.createSet([proposal_id]) }
  }).promise();

  return Promise.all([a,b]).then(() => proposal);
};


const submitProposalVote = async (root, args, ctx, ast) => {

  const { data } = args;
  var a = b = c = Promise.resolve();

  const {
    channel_id,
    syndicate_id,
    proposal_id,
    vote
  } = data;

  const [
    proposal,
    syndicate
  ] = await Promise.all([
    getProposalById(null, { syndicate_id, proposal_id }),
    getSyndicateById(null, { syndicate_id })
  ]);

  if (!syndicateHasChannel(syndicate, channel_id)) {

    // If the channel is not a member of the syndicate...

    throw new Error("No such member channel.");
  }

  if (proposalHasChannel(proposal, channel_id)) {

    // If the channel has already submitted a vote for this proposal...

    throw new Error("Vote already submitted for this proposal.");
  }

  if (proposal.proposal_status !== "pending") {

    // If voting has already come to an end...

    throw new Error("Voting has closed.");
  }

  // Determine whether to add the channel's vote to the "approvals" or "rejections" slot.

  const slot = (vote === true ? "approvals" : "rejections");

  var proposalUpdateExpression = `ADD ${slot} :channel_id`;
  var proposalExpressionAttributeValues = { ":channel_id": DynamoDB.createSet([channel_id]) };

  const approved = (vote === true) && approvalTriggered(proposal, syndicate);
  const rejected = (vote === false) && rejectionTriggered(proposal, syndicate);

  if (approved) {

    // The proposal has accumulated enough approvals to
    // trigger its application to the parent syndicate.

    proposalUpdateExpression += " SET proposal_status = :proposal_status";
    proposalExpressionAttributeValues[":proposal_status"] = "approved";

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

    proposalUpdateExpression += " SET proposal_status = :proposal_status";
    proposalExpressionAttributeValues[":proposal_status"] = "rejected";
  }

  // Update the proposal itself.

  console.log(`[DynamoDB:PROPOSALS] Updating proposal ${syndicate_id}:${proposal_id} (${proposalUpdateExpression})`);
  a = DynamoDB.update({
    TableName: process.env.DYNAMODB_TABLE_PROPOSALS,
    Key: { syndicate_id, proposal_id },
    UpdateExpression: proposalUpdateExpression,
    ExpressionAttributeValues: proposalExpressionAttributeValues
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

  // TODO: Remove from syndicate also

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
    expires,
    proposal_status
  } = proposal;

  // If the status is already at an end state... [approved | rejected | expired]

  if (proposal_status !== "pending") { return proposal; }

  const now = new Date().getTime();
  const expiry = new Date(expires).getTime();

  if (now > expiry) {

    // Proposal has expired - change status and hot-return proposal.

    propsal_status = "expired";
    console.log(`[DynamoDB:PROPOSALS] Updating proposal ${syndicate_id}:${proposal_id} to EXPIRED`);
    DynamoDB.update({
      TableName: process.env.DYNAMODB_TABLE_PROPOSALS,
      Key: { syndicate_id, proposal_id },
      UpdateExpression: `SET proposal_status = :proposal_status`,
      ExpressionAttributeValues: { ":proposal_status": "expired" }
    });
  }

  return proposal;
}


function syndicateHasChannel(syndicate, channel_id) {
  const channels = Object.keys(syndicate.channels);
  return (channels.indexOf(channel_id) >= 0);
}


function proposalHasChannel(proposal, channel_id) {
  return (proposal.approvals.concat(proposal.rejections).indexOf(channel_id) >= 0);
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
  const approvalsCount = proposal.approvals.length + 1;
  const channelsCount = Object.keys(syndicate.channels).length;
  return (approvalsCount / channelsCount >= MAJORITY_RATIO);
}


function rejectionTriggered(proposal, syndicate) {
  const rejectionsCount = proposal.rejections.length + 1;
  const channelsCount = Object.keys(syndicate.channels).length;
  return (rejectionsCount / channelsCount >= MAJORITY_RATIO);
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

  return createProposal(null, { data }, { god: true });
}


async function handleMergeApproval(syndicate, proposal) {

  // Enacts proposal to merge the slave syndicate into the master syndicate.
  // Takes place within the slave syndicate, unlike handleMergeRequest.

  const {
    syndicate_id: slave_syndicate_id,
    channels,
    proposals
  } = syndicate;

  const {
    _syndicate_id: master_syndicate_id
  } = proposal;

  const {
    plan_id: new_plan_id
  } = await getSyndicateById(null, { syndicate_id: master_syndicate_id });

  // Transfer all existing subscriptions to the new master syndicate.

  const product_id = `prod_syndicate_${slave_syndicate_id}`;
  const a = stripeUtilities.handleSubscriptionTransfer(product_id, new_plan_id, true);

  // Add all slave syndicate channels to master syndicate.

  const b = Object.keys(channels).map(channel_id => {
    console.log(`${"[DynamoDB:SYNDICATES] ".padEnd(30, ".")} Adding channel ${channel_id} to syndicate ${master_syndicate_id}`);
    return DynamoDB.update({
      TableName: process.env.DYNAMODB_TABLE_SYNDICATES,
      Key: {
        syndicate_id: master_syndicate_id
      },
      UpdateExpression: `ADD channels :channel_id`,
      ExpressionAttributeValues: { ":channel_id": DynamoDB.createSet([channel_id]) }
    }).promise();
  });

  // Remove slave syndicate from all slave syndicate channels.

  const c = Object.keys(channels).map(channel_id => {
    console.log(`${"[DynamoDB:CHANNELS] ".padEnd(30, ".")} Removing syndicate ${slave_syndicate_id} from channel ${channel_id}`);
    return DynamoDB.update({
      TableName: process.env.DYNAMODB_TABLE_CHANNELS,
      Key: { channel_id },
      UpdateExpression: `DELETE syndicates :slave_syndicate_id`,
      ExpressionAttributeValues: { ":slave_syndicate_id": DynamoDB.createSet([slave_syndicate_id]) }
    }).promise();
  });

  // Add master syndicate to all slave syndicate channels.

  const d = Object.keys(channels).map(channel_id => {
    console.log(`${"[DynamoDB:CHANNELS] ".padEnd(30, ".")} Adding syndicate ${master_syndicate_id} to channel ${channel_id}`);
    return DynamoDB.update({
      TableName: process.env.DYNAMODB_TABLE_CHANNELS,
      Key: { channel_id },
      UpdateExpression: `ADD syndicates :master_syndicate_id`,
      ExpressionAttributeValues: { ":master_syndicate_id": DynamoDB.createSet([master_syndicate_id]) }
    }).promise();
  });

  // Delete all slave syndicate proposals.

  const e = proposals.map(proposal_id => {
    console.log(`${"[DynamoDB:PROPOSALS] ".padEnd(30, ".")} Deleting proposal ${slave_syndicate_id}:${proposal_id}`);
    return DynamoDB.delete({
      TableName: process.env.DYNAMODB_TABLE_PROPOSALS,
      Key: {
        syndicate_id: slave_syndicate_id,
        proposal_id
      }
    }).promise();
  });

  // Delete the slave syndicate itself.

  console.log(`${"[DynamoDB:SYNDICATES] ".padEnd(30, ".")} Permanently deleting syndicate ${slave_syndicate_id}`);
  const f = DynamoDB.delete({
    TableName: process.env.DYNAMODB_TABLE_SYNDICATES,
    Key: {
      syndicate_id: slave_syndicate_id
    },
  }).promise();

  return Promise.all(flatten([a,b,c,d,e,f]));
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