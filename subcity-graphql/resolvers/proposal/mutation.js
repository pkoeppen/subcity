const chunk = require("lodash/chunk");
const has = require("lodash/has");
const includes = require("lodash/includes");
const isEqual = require("lodash/isEqual");
const sortBy = require("lodash/sortBy");

const {
  buildQuery,
  clearS3ByPrefix,
  createStripePlan,
  deletePlans,
  deleteProduct,
  deleteStripePlan,
  DynamoDB,
  purgeByProductID,
  moveKey,
  queryAll,
  sanitize,
  scanAll,
  transferSubscription
} = require("../../shared");


module.exports = {
  castVote,
  createProposal
};


////////////////////////////////////////////////////////////
//////////////////////// FUNCTIONS /////////////////////////
////////////////////////////////////////////////////////////


async function castVote (channel_id, data) {

  data = sanitize(data);

  const {
    syndicate_id,
    time_created,
    vote
  } = data;

  const [
    { Item:  proposal    },
    { Items: memberships }
  ] = await Promise.all([

    DynamoDB.get({
      TableName: process.env.DYNAMODB_TABLE_PROPOSALS,
      Key: {
        syndicate_id,
        time_created
      }
    }).promise(),

    DynamoDB.query({
      TableName: process.env.DYNAMODB_TABLE_MEMBERSHIPS,
      IndexName: `${process.env.DYNAMODB_TABLE_MEMBERSHIPS}-GSI`,
      KeyConditionExpression: "syndicate_id = :syndicate_id",
      ExpressionAttributeValues: { ":syndicate_id": syndicate_id }
    }).promise(),
  ]);

  // Checks.

  if (!includes(memberships.map(({ channel_id: id }) => id), channel_id)) {

    throw new Error("! No such member channel.");
  }

  if (has(proposal.votes, channel_id)) {

    throw new Error("! Vote already submitted.");
  }

  if (proposal.stage !== "pending") {

    throw new Error("! Voting has closed.");
  }

  // Tasks.

  const tasks = [];

  var UpdateExpression = "SET #votes.#channel_id = :vote";
  var ExpressionAttributeNames = {
    "#votes": "votes",
    "#channel_id": channel_id
  };
  var ExpressionAttributeValues = {
    ":vote": vote
  };

  const approved = (vote === true) && approvalTriggered(proposal, memberships);
  const rejected = (vote === false) && rejectionTriggered(proposal, memberships);

  if (approved) {
    UpdateExpression += ", stage = :stage";
    ExpressionAttributeValues[":stage"] = "approved";
    tasks.push(handleApproval(proposal));
  }

  if (rejected) {
    UpdateExpression += ", stage = :stage";
    ExpressionAttributeValues[":stage"] = "rejected";
    tasks.push(handleRejection(proposal));
  }

  const update = DynamoDB.update({
    TableName: process.env.DYNAMODB_TABLE_PROPOSALS,
    Key: { syndicate_id, time_created },
    UpdateExpression,
    ExpressionAttributeNames,
    ExpressionAttributeValues
  }).promise()

  tasks.push(update);

  // TODO: Return redirect URL for slug changes.

  return Promise.all(tasks)
  .then(() => ({ time_created }));
}


async function createProposal (channel_id, data, bounce=true) {

  data = sanitize(data);

  if (data.type !== "update") {

    // Disallow simultaneous updates with (slave|master|join|dissolve).

    delete data.new_profile;
    delete data.updates;
  }

  // Checks.

  if (data.type === "update" && (!data.updates && !data.new_profile)) {

    throw new Error("! Updates object missing.");
  }

  if (data.type === "slave" && !data.slave_id) {

    throw new Error("! Slave syndicate ID missing.");
  }

  if (data.type === "join" && !data.channel_id) {

    throw new Error("! Channel ID missing.");
  }

  if (bounce && !await syndicateHasChannel(data.syndicate_id, channel_id)) {

    throw new Error("! No such member channel.");
  }

  if (await identicalProposalExists(data.syndicate_id, data)) {

    throw new Error("! Identical proposal already exists.");
  }

  // Tasks.

  const tasks = [];

  if ((data.updates || {}).slug) {

    if (await assertSlugAvailable(data.updates.slug)) {
      tasks.push(createReservedSlug(data.syndicate_id, data.updates.slug));
    } else {
      throw new Error("! Slug unavailable.");
    }
  }

  const proposal = Object.assign({
    stage: "pending",
    time_created: Date.now(),
    votes: {}
  }, data);

  console.log(`[DynamoDB:PROPOSALS] Creating proposal ${data.syndicate_id}:${proposal.time_created}`);
  const put = DynamoDB.put({
    TableName: process.env.DYNAMODB_TABLE_PROPOSALS,
    Item: proposal
  }).promise();

  tasks.push(put);

  return Promise.all(tasks)
  .then(() => proposal);
};


////////////////////////////////////////////////////////////
///////////////////////// HELPERS //////////////////////////
////////////////////////////////////////////////////////////


function applyUpdatesToSyndicate (proposal) {

  const {
    new_profile,
    syndicate_id,
    time_created,
    updates: {
      slug,
      tiers,
      ...updates
    }
  } = proposal;

  updates.time_updated = Date.now();

  const tasks = [];

  if (slug) {
    tasks.push(handleReservedSlugAssignment(syndicate_id, slug));
  }

  if (tiers) {
    tasks.push(handleSyndicateTiersUpdate(syndicate_id, tiers));
  }

  if (updates.payload) {
    let from = `syndicates/${syndicate_id}/proposals/${time_created}/payload/${updates.payload}`;
    let to   = `syndicates/${syndicate_id}/payload/${updates.payload}`;
    tasks.push(moveKey(from, to));
  }

  if (new_profile) {
    let from = `syndicates/${syndicate_id}/proposals/${time_created}/profile.jpeg`;
    let to   = `syndicates/${syndicate_id}/profile.jpeg`;
    tasks.push(moveKey(from, to));
  }

  tasks.push(writeSyndicateUpdates(syndicate_id, updates));

  return Promise.all(tasks);
}


function approvalTriggered (proposal, memberships) {

  let votes = Object.values(proposal.votes).filter(vote => vote).length + 1;
  let total = Object.keys(memberships).length;

  return (votes / total >= (2 / 3));
}


function assertSlugAvailable (slug) {

  const params = {
    TableName: process.env.DYNAMODB_TABLE_SLUGS,
    Key: { slug }
  };

  return DynamoDB.get(params).promise()
  .then(({ Item: slug }) => !slug);
}


function channelAlreadyVoted (syndicate_id, time_created, channel_id) {

  const params = {
    TableName: process.env.DYNAMODB_TABLE_PROPOSALS,
    Key: {
      syndicate_id,
      time_created
    }
  };

  return DynamoDB.get(params).promise()
  .then(({ Item: proposal }) => has(proposal.votes, channel_id));
}


async function convertReservedSlug (slug, syndicate_id) {

  return DynamoDB.update({
    TableName: process.env.DYNAMODB_TABLE_SLUGS,
    Key: { slug },
    UpdateExpression: `SET syndicate_id = :syndicate_id REMOVE reserved`,
    ExpressionAttributeValues: {
      ":syndicate_id": syndicate_id
    }
  }).promise();
}


function createInvitation (proposal) {

  const {
    channel_id,
    syndicate_id
  } = proposal;

  const invitation = {
    channel_id,
    syndicate_id,
    time_created: Date.now()
  };

  const params = {
    TableName: process.env.DYNAMODB_TABLE_INVITATIONS,
    Item: invitation
  };

  return DynamoDB.put(params).promise();
}


function createReservedSlug (syndicate_id, slug) {

  const params = {
    TableName: process.env.DYNAMODB_TABLE_SLUGS,
    Item: {
      reserved: syndicate_id,
      slug
    }
  };

  console.log(`[DynamoDB:SLUGS] creating reserved slug ${slug} for syndicate ${syndicate_id}`);
  return DynamoDB.put(params).promise();
}


function createSlaveProposal ({ slave_id, syndicate_id }) {

  const proposal = {
    master_id: syndicate_id,
    syndicate_id: slave_id,
    type: "master"
  };

  return createProposal(null, proposal, false);
}


async function deleteInvitationsBySyndicateID (syndicate_id) {

  const params = {
    TableName: process.env.DYNAMODB_TABLE_INVITATIONS,
    IndexName: `${process.env.DYNAMODB_TABLE_INVITATIONS}-GSI`,
    KeyConditionExpression: "syndicate_id = :syndicate_id",
    ExpressionAttributeValues: {
      ":syndicate_id": syndicate_id
    }
  };

  const invitations = await queryAll(params);

  console.log(`[DynamoDB:INVITATIONS] Deleting all invitations from syndicate ${syndicate_id}`);
  const chunked = chunk(invitations, 25).map(chunk => {
    const requests = chunk.map(({ channel_id }) => ({
      DeleteRequest: {
        Key: {
          channel_id,
          syndicate_id
        }
      }
    }));
    const params = {
      RequestItems: {
        [process.env.DYNAMODB_TABLE_INVITATIONS]: requests
      }
    };
    return DynamoDB.batchWrite(params).promise();
  });

  return Promise.all(chunked);
}


async function deleteMembershipsBySyndicateID (syndicate_id) {

  const params = {
    TableName: process.env.DYNAMODB_TABLE_MEMBERSHIPS,
    IndexName: `${process.env.DYNAMODB_TABLE_MEMBERSHIPS}-GSI`,
    KeyConditionExpression: "syndicate_id = :syndicate_id",
    ExpressionAttributeValues: {
      ":syndicate_id": syndicate_id
    }
  };

  const memberships = await queryAll(params);

  console.log(`[DynamoDB:MEMBERSHIPS] Deleting all memberships for syndicate ${syndicate_id}`);
  const chunked = chunk(memberships, 25).map(chunk => {
    const requests = chunk.map(({ channel_id }) => ({
      DeleteRequest: {
        Key: {
          channel_id,
          syndicate_id
        }
      }
    }));
    const params = {
      RequestItems: {
        [process.env.DYNAMODB_TABLE_MEMBERSHIPS]: requests
      }
    };
    return DynamoDB.batchWrite(params).promise();
  });

  return Promise.all(chunked);
}


async function deleteProposalsBySyndicateID (syndicate_id) {

  const params = {
    TableName: process.env.DYNAMODB_TABLE_PROPOSALS
  };

  const proposals = (await scanAll(params)).filter(proposal => {

    const {
      master_id,
      slave_id,
      syndicate_id: _syndicate_id
    } = proposal;

    return (master_id === syndicate_id ||
            slave_id === syndicate_id ||
            _syndicate_id === syndicate_id);
  });

  console.log(`[DynamoDB:PROPOSALS] Deleting all proposals for syndicate ${syndicate_id}`);
  const chunked = chunk(proposals, 25).map(chunk => {
    const requests = chunk.map(({ time_created }) => ({
      DeleteRequest: {
        Key: {
          syndicate_id,
          time_created
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
}


function deleteMessagesBySyndicateID (syndicate_id) {

}


async function deleteReservedSlug (slug, syndicate_id) {

  const { reserved } = await getSlug(slug);

  if (reserved === syndicate_id) {
    return DynamoDB.delete({
      TableName: process.env.DYNAMODB_TABLE_SLUGS,
      Key: { slug }
    }).promise()

  } else {
    throw new Error("! Slug reservation mismatch.");
  }
}


function deleteSlug (slug) {

  const params = {
    TableName: process.env.DYNAMODB_TABLE_SLUGS,
    Key: { slug }
  };

  console.log(`[DynamoDB:SLUGS] Deleting slug ${slug}`);
  return DynamoDB.delete(params).promise();
}


async function deleteSlugsBySyndicateID (syndicate_id) {

  const params = {
    TableName: process.env.DYNAMODB_TABLE_SLUGS,
    IndexName: `${process.env.DYNAMODB_TABLE_SLUGS}-GSI-2`,
    KeyConditionExpression: "syndicate_id = :syndicate_id",
    ExpressionAttributeValues: {
      ":syndicate_id": syndicate_id
    }
  };

  const slugs = await queryAll(params);

  console.log(`[DynamoDB:SLUGS] Deleting all slugs for syndicate ${syndicate_id}`);
  const chunked = chunk(slugs, 25).map(chunk => {
    const requests = chunk.map(({ slug }) => ({
      DeleteRequest: {
        Key: {
          slug
        }
      }
    }));
    const params = {
      RequestItems: {
        [process.env.DYNAMODB_TABLE_SLUGS]: requests
      }
    };
    return DynamoDB.batchWrite(params).promise();
  });

  return Promise.all(chunked);
}


async function deleteSubscriptionsBySyndicateID (syndicate_id) {

  const params = {
    TableName: process.env.DYNAMODB_TABLE_SUBSCRIPTIONS,
    IndexName: `${process.env.DYNAMODB_TABLE_SUBSCRIPTIONS}-GSI-2`,
    KeyConditionExpression: "syndicate_id = :syndicate_id",
    ExpressionAttributeValues: {
      ":syndicate_id": syndicate_id
    }
  };

  const subscriptions = await queryAll(params);

  console.log(`[DynamoDB:SUBSCRIPTIONS] Deleting all subscriptions for syndicate ${syndicate_id}`);
  const chunked = chunk(subscriptions, 25).map(chunk => {
    const requests = chunk.map(({ subscriber_id, subscription_id }) => ({
      DeleteRequest: {
        Key: {
          subscriber_id,
          subscription_id
        }
      }
    }));
    const params = {
      RequestItems: {
        [process.env.DYNAMODB_TABLE_SUBSCRIPTIONS]: requests
      }
    };
    return DynamoDB.batchWrite(params).promise();
  });

  return Promise.all(chunked);
}


function deleteSyndicateBySyndicateID (syndicate_id) {

  const params = {
    TableName: process.env.DYNAMODB_TABLE_SYNDICATES,
    Key: { syndicate_id },
  };

  console.log(`[DynamoDB:SYNDICATES] Deleting syndicate ${syndicate_id}`);
  return DynamoDB.delete(params).promise();
}


function dissolveSyndicate (syndicate_id) {

  // TODO: Delete all proposals in OTHER syndicates by slave_id/master_id.

  const tasks = [
    clearS3ByPrefix(`syndicates/${syndicate_id}`),
    deleteInvitationsBySyndicateID(syndicate_id),
    deleteSyndicateBySyndicateID(syndicate_id),
    deleteMembershipsBySyndicateID(syndicate_id),
    deleteMessagesBySyndicateID(syndicate_id),
    deleteProposalsBySyndicateID(syndicate_id),
    deleteSlugsBySyndicateID(syndicate_id),
    deleteSubscriptionsBySyndicateID(syndicate_id),
    purgeByProductID(`prod_syndicate_${syndicate_id}`)
  ];

  return Promise.all(tasks);
}


function getSlug (slug) {

  const params = {
    TableName: process.env.DYNAMODB_TABLE_SLUGS,
    Key: { slug }
  };

  return DynamoDB.get(params).promise()
  .then(({ Item }) => Item);
}


function getSlugBySyndicateID (syndicate_id) {

  const params = {
    TableName: process.env.DYNAMODB_TABLE_SLUGS,
    IndexName: `${process.env.DYNAMODB_TABLE_SLUGS}-GSI-2`,
    KeyConditionExpression: "syndicate_id = :syndicate_id",
    ExpressionAttributeValues: {
        ":syndicate_id": syndicate_id
    }
  };

  return DynamoDB.query(params)
  .promise().then(({ Items: slugs }) => {

    if (slugs.length) {
      return slugs[0];
    }
  });
};


function handleApproval (proposal) {

  switch (proposal.type) {
    case "update":
      return applyUpdatesToSyndicate(proposal);

    case "slave":
      return createSlaveProposal(proposal);

    case "master":
      return mergeIntoMasterSyndicate(proposal);

    case "join":
      return createInvitation(proposal);
      //return addChannelToSyndicate(proposal);
  
    case "dissolve":
      return dissolveSyndicate(proposal.syndicate_id);

    default:
      throw new Error("! Unsupported proposal type.");
  }
}


function handleRejection (proposal) {
  
}


async function handleReservedSlugAssignment (syndicate_id, slug) {

  const { reserved } = await getSlug(slug);

  if (reserved === syndicate_id) {

    const old_slug = await getSlugBySyndicateID(syndicate_id);

    return Promise.all([
      deleteSlug(old_slug.slug),
      convertReservedSlug(slug, syndicate_id)
    ]);

  } else {
    throw new Error("! Slug reservation mismatch.");
  }
}


async function handleSyndicateTiersUpdate (syndicate_id, new_tiers) {

  const {
    Item: {
      plan_id: old_plan_id,
      tiers: old_tiers
    }
  } = await DynamoDB.get({
    TableName: process.env.DYNAMODB_TABLE_SYNDICATES,
    Key: { syndicate_id }
  }).promise();

  // Check if a rate change is actually happening. Do not make any
  // calls to Stripe if none of the tiers' rates are being updated.

  if (new_tiers._1.rate === old_tiers._1.rate &&
      new_tiers._2.rate === old_tiers._2.rate &&
      new_tiers._3.rate === old_tiers._3.rate) {

    new_tiers._1.rate = old_tiers._1.rate;
    new_tiers._2.rate = old_tiers._2.rate;
    new_tiers._3.rate = old_tiers._3.rate;

    return writeSyndicateTiersUpdate(syndicate_id, new_tiers);
  }

  const tiers = sortBy(Object.keys(new_tiers).map(key => {
    const tier = key.slice(-1).replace("3", "inf");
    return {
      up_to: tier,
      flat_amount: new_tiers[key].rate
    };
  }), ["up_to"]);

  const plan = {
    billing_scheme: "tiered",
    currency: "usd",
    interval: "month",
    product: `prod_syndicate_${syndicate_id}`,
    tiers,
    tiers_mode: "volume"
  };

  // Update Stripe tiers.

  const [
    { id: new_plan_id }
  ] = await Promise.all([
    createStripePlan(plan),
    deleteStripePlan(old_plan_id)
  ]);

  // Write rate changes to DynamoDB.

  return writeSyndicateTiersUpdate(syndicate_id, new_tiers, new_plan_id);
}


function identicalProposalExists (syndicate_id, data) {

  const params = {
    TableName: process.env.DYNAMODB_TABLE_PROPOSALS,
    KeyConditionExpression: "syndicate_id = :syndicate_id",
    ExpressionAttributeValues: {
      ":syndicate_id": syndicate_id
    }
  };

  return DynamoDB.query(params).promise()
  .then(({ Items: proposals }) => {

    for (var i = 0; i < proposals.length; i++) {

      var proposal = proposals[i];

      switch (data.type) {

        case "update":
          if (isEqual(data.updates, proposal.updates) &&
              data.new_profile === proposal.new_profile) {
            return true;
          }
          break;

        case "slave":
          if (data.slave_id === proposal.slave_id) {
            return true;
          }
          break;

        case "master":
          if (data.master_id === proposal.master_id) {
            return true;
          }
          break;

        case "join":
          if (data.channel_id === proposal.channel_id) {
            return true;
          }
          break;

        case "dissolve":
          if (proposal.type === "dissolve") {
            return true;
          }
          break;
          
        default:
          throw new Error("! Unsupported proposal type.");
      }
    }

    return false;
  });
}


async function mergeIntoMasterSyndicate (proposal) {

  const {
    syndicate_id: slave_id
  } = proposal;

  const {
    master_id
  } = proposal;

  const {
    Item: {
      plan_id
    }
  } = await DynamoDB.get({
    TableName: process.env.DYNAMODB_TABLE_SYNDICATES,
    Key: { syndicate_id: master_id }
  }).promise();

  // 0 - Convert all slave syndicate subscriptions to master syndicate.

  const _0 = queryAll({
    TableName: process.env.DYNAMODB_TABLE_SUBSCRIPTIONS,
    IndexName: `${process.env.DYNAMODB_TABLE_SUBSCRIPTIONS}-GSI-2`,
    KeyConditionExpression: "syndicate_id = :syndicate_id",
    ExpressionAttributeValues: { ":syndicate_id": slave_id }
  })

  .then(subs_slave => {

    return Promise.all(subs_slave.map(async subscription => {

      const {
        subscriber_id,
        subscription_id
      } = subscription;

      // Check if subscriber is already subscribed to master syndicate.

      const {
        Items: subs_master
      } = await DynamoDB.query({
        TableName: process.env.DYNAMODB_TABLE_SUBSCRIPTIONS,
        IndexName: `${process.env.DYNAMODB_TABLE_SUBSCRIPTIONS}-GSI-2`,
        KeyConditionExpression: "subscriber_id = :subscriber_id AND syndicate_id = :syndicate_id",
        ExpressionAttributeValues: {
          ":subscriber_id": subscriber_id,
          ":syndicate_id": master_id
        }
      }).promise();

      if (subs_master.length) {

        // If so, skip conversion. purgeByProductID() will delete slave subscriptions.

        return Promise.resolve();
      } else {

        // Else, transfer subscriptions to master syndicate.

        return convertSubscription(subscriber_id, subscription_id, master_id, plan_id).catch(e => console.log("fuck\n\n\n\n\n",e));
      }
    }));
  });

  // 1 - Create new memberships for master syndicate.

  const _1 = queryAll({
    TableName: process.env.DYNAMODB_TABLE_MEMBERSHIPS,
    IndexName: `${process.env.DYNAMODB_TABLE_MEMBERSHIPS}-GSI`,
    KeyConditionExpression: "syndicate_id = :syndicate_id",
    ExpressionAttributeValues: { ":syndicate_id": slave_id }
  })

  .then(memberships => {

    return Promise.all(memberships.map(({ channel_id, time_created }) => {

      const membership = {
        channel_id,
        syndicate_id: master_id,
        time_created
      };

      console.log(`[DynamoDB:MEMBERSHIPS] Creating membership ${channel_id}:${master_id}`);
      return DynamoDB.put({
        TableName: process.env.DYNAMODB_TABLE_MEMBERSHIPS,
        Item: membership
      }).promise()
    }));
  });

  // Execute.

  return Promise.all([_0,_1])
  .then(() => dissolveSyndicate(slave_id));
}


function convertSubscription (subscriber_id, subscription_id, master_id, plan_id) {

  console.log(`[DynamoDB:SUBSCRIPTIONS] Converting subscription ${subscriber_id}:${subscription_id} to master syndicate ${master_id}`);
  const _0 = DynamoDB.update({
    TableName: process.env.DYNAMODB_TABLE_SUBSCRIPTIONS,
    Key: {
      subscriber_id,
      subscription_id
    },
    UpdateExpression: "SET syndicate_id = :syndicate_id",
    ExpressionAttributeValues: {
      ":syndicate_id": master_id
    }
  }).promise();

  const _1 = transferSubscription(`sub_${subscription_id}`, plan_id);

  return Promise.all([_0,_1]);
}


function rejectionTriggered (proposal, memberships) {

  let votes = Object.values(proposal.votes).filter(vote => !vote).length + 1;
  let total = Object.keys(memberships).length;

  return (votes / total >= (2 / 3));
}


function syndicateHasChannel (syndicate_id, channel_id) {

  const params = {
    TableName: process.env.DYNAMODB_TABLE_MEMBERSHIPS,
    Key: {
      syndicate_id,
      channel_id
    }
  };

  return DynamoDB.get(params).promise()
  .then(({ Item: membership }) => !!membership);
}

// function assertSyndicateHasChannel (syndicate_id, channel_id) {

//   const params = {
//     TableName: process.env.DYNAMODB_TABLE_MEMBERSHIPS,
//     Key: {
//       syndicate_id,
//       channel_id
//     }
//   };

//   return DynamoDB.get(params).promise()
//   .then(({ Item: membership }) => {

//     if (!membership) {
//       throw new Error("! No such member channel.");
//     }
//   });
// }


function writeSyndicateUpdates (syndicate_id, updates) {

  // Writes syndicate updates to DynamoDB.

  const { ExpressionAttributeValues, UpdateExpression } = buildQuery(updates);

  console.log(`[DynamoDB:SYNDICATES] Updating syndicate ${syndicate_id}`);
  return DynamoDB.update({
    TableName: process.env.DYNAMODB_TABLE_SYNDICATES,
    Key: { syndicate_id },
    UpdateExpression,
    ExpressionAttributeValues
  }).promise();
}


function writeSyndicateTiersUpdate (syndicate_id, tiers, plan_id) {

  const UpdateExpression = "SET tiers = :tiers" + (plan_id ? ", plan_id = :plan_id" : "");
  const ExpressionAttributeValues = {
    ":tiers": tiers,
    ...(plan_id && { ":plan_id": plan_id })
  };

  console.log(`[DynamoDB:SYNDICATES] Updating tiers for syndicate ${syndicate_id}`);
  return DynamoDB.update({
    TableName: process.env.DYNAMODB_TABLE_SYNDICATES,
    Key: { syndicate_id },
    UpdateExpression,
    ExpressionAttributeValues
  }).promise();
}
