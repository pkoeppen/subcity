const {
  chunk,
  flatten,
  includes,
  isEmpty,
  merge,
  omit
} = require("lodash");
const {
  promisify,
  generateID,
  DynamoDB,
  buildDynamoDBQuery,
  S3,
  sanitize,
  parseMarkdown,
  curateSets,
  stripeUtilities: {
    createStripePlan,
    handleSubscriptionRateChange
  }
} = require("../shared");
const {
  getChannelById
} = require("./channel");


///////////////////////////////////////////////////
///////////////////// QUERIES /////////////////////
///////////////////////////////////////////////////


const getSyndicateById = (root, args, ctx, ast) => {

  const { syndicate_id } = args;

  const params = {
    TableName: process.env.DYNAMODB_TABLE_SYNDICATES,
    Key: { syndicate_id },
  };
  
  return DynamoDB.get(params).promise()
  .then(({ Item: syndicate }) => {
    if (syndicate) {
      syndicate = curateSets(syndicate);
      syndicate.earnings_month = syndicate.subscribers.length * syndicate.subscription_rate;
      syndicate.description = parseMarkdown(syndicate.description, true);
      return syndicate;
    } else {
      throw new Error();
    }
  })
  .catch(error => {
    console.error(error);
    throw new Error("Error fetching syndicate.");
  });
};


const getSyndicateBySlug = (root, args, ctx, ast) => {

  const channel_id    = (root || {}).channel_id ||
                        (args || {}).channel_id;
  const subscriber_id = args.subscriber_id;
  const slug          = args.slug;
  const is_private    = ctx.private && args.settings;

  const params = {
    TableName: process.env.DYNAMODB_TABLE_SYNDICATES,
    FilterExpression: "slug = :slug",
    ExpressionAttributeValues: { ":slug": slug }
  };

  return DynamoDB.scan(params).promise()
  .then(({ Items: syndicates }) => {

    if (!syndicates) {
      throw new Error("(!) No syndicates found.");
    }

    const syndicate = curateSets(syndicates[0]);

    if (is_private) {
      
      if (Object.keys(syndicate.channels).indexOf(channel_id) < 0) {

        // If requesting channel is not a member of the syndicate...

        throw new Error("(!) No such member channel.");
      }

      // Mangle some data for presentation.

      syndicate.description     = parseMarkdown(syndicate.description, true);
      syndicate.earnings_cut    = syndicate.channels[channel_id].earnings_cut;
      syndicate.projected_month = syndicate.subscribers.length * syndicate.subscription_rate; // TODO: subtract fees
      syndicate.projected_cut   = syndicate.projected_month / Object.keys(syndicate.channels).length;

    } else {
      syndicate.description = parseMarkdown(syndicate.description);
      delete syndicate.earnings_total;
    }

    if (subscriber_id) {

      // Attach "is_subscribed" to accurately display the "subscribe"
      // or "unsubscribe" button on the front end.

      syndicate.is_subscribed = includes(syndicate.subscribers, subscriber_id);
    }

    syndicate.channels = Object.keys(syndicate.channels);

    return syndicate;
  })
  .catch(error => {
    const message = error.message.startsWith("(!)")
                    ? error.message.replace("(!)", "")
                    : "Error fetching syndicate.";
    console.error(error);
    throw new Error(message);
  });
};


const getSyndicatesByIdArray = (root, args, ctx, ast) => {

  const { syndicates } = root;
  
  if (!syndicates || !syndicates.length) { return []; }

  const chunked = chunk(syndicates, 100).map(chunk => {
    const params = {
      RequestItems: {
        [process.env.DYNAMODB_TABLE_SYNDICATES]: {
          Keys: chunk.map(syndicate_id => ({ syndicate_id }))
        }
      }
    };
    return DynamoDB.batchGet(params).promise();
  });

  return Promise.all(chunked).then(results => {
    return flatten(results.map(({ Responses }) => Responses[process.env.DYNAMODB_TABLE_SYNDICATES]))
    .map(syndicate => curateSets(syndicate));
  })
  .catch(error => {
    console.error(error);
    throw new Error("Error fetching syndicates.");
  });
};


const getInvitationsByIdArray = (root, args, ctx, ast) => {

  // A little workaround to return an array of SyndicateType objects.

  root.syndicates = root.invitations;
  return getSyndicatesByIdArray(root, args);
};


const getSyndicatesByRange = (root, args, ctx, ast) => {

  // TODO: Stuff

  const params = {
    TableName: process.env.DYNAMODB_TABLE_SYNDICATES,
    // Limit: 50,
  };

  return DynamoDB.scan(params).promise()
  .then(({ Items }) => (Items || []))
  .catch(error => {
    console.error(error);
    throw new Error("Error fetching syndicates.");
  });;


  // var channels = [];
  // while (true) {

  //   // Scan channels in chunks of length "params.range" until either
  //   // "channels" is full, or there are no more channels to scan.

  //   let { Items, LastEvaluatedKey: { channel_id } = {}} = await DynamoDB.scan(params).promise();

  //   // Attach new channels to "channels" array.

  //   channels = channels.concat(Items);
  //   if (channels.length === options.range || !channel_id) {

  //     // "channels" array is full, or we're out of channels.

  //     break;
  //   }

  //   // Start from the last scanned channel.

  //   params.ExclusiveStartKey = { channel_id };
  // }

  // return channels.slice(0, options.range);
};


///////////////////////////////////////////////////
//////////////////// MUTATIONS ////////////////////
///////////////////////////////////////////////////


const createSyndicate = async (root, args, ctx, ast) => {

  // Creates a new syndicate in DynamoDB with an associated Stripe plan.

  const data = sanitize(args.data);
  const {
    channel_id,
    subscription_rate
  } = data;
  const syndicate_id = generateID();

  // Create Stripe subscription plan for syndicate.

  const planOptions = {
    amount: subscription_rate,
    interval: "month",
    product: {
      id: `prod_syndicate_${syndicate_id}`,
      name: `prod_syndicate_${syndicate_id}`
    },
    currency: "usd", // TODO: Modify this
  };

  var plan_id;
  try {
    ({ id: plan_id } = await createStripePlan(planOptions));
  } catch(error) {
    console.error(error);
    throw new Error("Error creating syndicate.");
  }

  // Initial settings, to be combined with custom data in the "data" variable.

  const toMerge = {
    syndicate_id,
    plan_id,
    currency: "usd",
    created_at: new Date().getTime(),
    profile_url: `${process.env.DATA_HOST}/${process.env.S3_BUCKET_OUT}/syndicates/${syndicate_id}/profile.jpeg`,
    earnings_total: 0,
    subscriber_count: 0,
    channels: {
      [channel_id]: {
        earnings_cut: 0,
        member_since: new Date().getTime()
      }
    },
    proposals: DynamoDB.createSet(["__DEFAULT__"]),
    subscribers: DynamoDB.createSet(["__DEFAULT__"])
  };

  // Merge the objects, omitting "channel_id".

  const syndicate = omit(merge(data, toMerge), "channel_id");

  // Create the syndicate in DynamoDB...

  const a = DynamoDB.put({
    TableName: process.env.DYNAMODB_TABLE_SYNDICATES,
    Item: syndicate
  }).promise();

  // ...and add the syndicate to the channel that created it.

  const b = DynamoDB.update({
    TableName: process.env.DYNAMODB_TABLE_CHANNELS,
    Key: { channel_id },
    UpdateExpression: "ADD syndicates :syndicate_id",
    ExpressionAttributeValues: { ":syndicate_id": DynamoDB.createSet([syndicate_id]) }
  }).promise();

  return Promise.all([a,b])
  .then(values => syndicate)
  .catch(error => {
    console.error(error);
    throw new Error("Error creating syndicate.");
  });
};


const updateSyndicate = async (proposal) => {

  // Applies all changes contained within the proposal to its parent syndicate.

  var a = b = c = Promise.resolve();
  const {
    syndicate_id,
    proposal_id,
    new_profile
  } = proposal;

  // Get rid of all fields not applicable to SyndicateType.

  const updates = omit(proposal, [
    "proposal_id",
    "syndicate_id",
    "profile_url",
    "action",
    "creator",
    "created",
    "expires",
    "proposal_status",
    "rejections",
    "approvals",
    "new_profile"
  ]);

  if (updates.subscription_rate) {

    // Update plan subscription rate in Stripe.

    try {
      const syndicate   = await getSyndicateById(null, proposal);
      const new_plan_id = await handleSubscriptionRateChange("syndicate", syndicate, updates.subscription_rate);

      // Set "data.plan_id" so it gets written into the DynamoDB UpdateExpression.

      updates.plan_id = new_plan_id;
    } catch(error) {
      console.error(error);
      throw new Error("Error updating subscription rate.");
    } 
  }

  if (updates.payload_url) {

    // If the syndicate's payload file is to be updated, remove all current
    // payload files from the syndicate and replace them with the new file.

    const fromKey = `syndicates/${syndicate_id}/proposals/${proposal_id}/payload/${updates.payload_url}`; // <- change
    const toKey   = `syndicates/${syndicate_id}/payload/${updates.payload_url}`;

    a = S3.getObject({ Bucket: process.env.S3_BUCKET_OUT, Key: fromKey }).promise()
    .then(({ Body }) => {

      // Put the file in the IN bucket so that the "uploads" handler
      // will transfer and delete all existing files automatically.

      return S3.putObject({ Body, Bucket: process.env.S3_BUCKET_IN, Key: toKey }).promise();
    });
  }

  if (new_profile) {

    // If the syndicate's profile is to be updated, grab the temporary
    // proposal image and move it into the syndicate's image file slot.

    const fromKey = `syndicates/${syndicate_id}/proposals/${proposal_id}/profile.jpeg`; // <- change
    const toKey   = `syndicates/${syndicate_id}/profile.jpeg`;

    b = S3.getObject({ Bucket: process.env.S3_BUCKET_OUT, Key: fromKey }).promise()
    .then(({ Body }) => {
      return S3.putObject({ Body, Bucket: process.env.S3_BUCKET_IN, Key: toKey }).promise();
    });
  }

  // Apply changes to the syndicate in DynamoDB.

  if (!isEmpty(updates)) {
    const { updateExpression, expressionAttributeValues } = buildDynamoDBQuery(updates);
    c = DynamoDB.update({
      TableName: process.env.DYNAMODB_TABLE_SYNDICATES,
      Key: { syndicate_id },
      UpdateExpression: `SET ${updateExpression}`,
      ExpressionAttributeValues: expressionAttributeValues
    }).promise();
  }

  return Promise.all([a,b,c]);
};


const leaveSyndicate = (root, args, ctx, ast) => {

  // Removes channel from syndicate's member channels, and vice versa.

  const { channel_id, syndicate_id } = args.data;

  const a = DynamoDB.update({
    TableName: process.env.DYNAMODB_TABLE_SYNDICATES,
    Key: { syndicate_id },
    UpdateExpression: "DELETE channels :channel_id",
    ExpressionAttributeValues: { ":channel_id": DynamoDB.createSet([channel_id]) }
  }).promise();

  const b = DynamoDB.update({
    TableName: process.env.DYNAMODB_TABLE_CHANNELS,
    Key: { channel_id },
    UpdateExpression: "DELETE syndicates :syndicate_id",
    ExpressionAttributeValues: { ":syndicate_id": DynamoDB.createSet([syndicate_id]) }
  }).promise();

  return Promise.all([a,b])
  .then(values => syndicate_id)
  .catch(error => {
    console.error(error);
    throw new Error("Error leaving syndicate.");
  });
};


const respondToSyndicateInvite = async (root, args, ctx, ast) => {

  // Submits a channel's decision to accept or decline the syndicate's invitation.

  var a = b = c = Promise.resolve();

  const {
    channel_id,
    syndicate_id,
    approved
  } = args.data;

  // Get the channel.

  const params = {
    TableName: process.env.DYNAMODB_TABLE_CHANNELS,
    Key: { channel_id }
  };

  let {
    Item: channel
  } = await DynamoDB.get(params).promise();
  channel = curateSets(channel);

  if (!channelHasInvite(channel, syndicate_id)) {

    // If channel has not received an invite to join this syndicate...

    throw new Error("Channel has not been invited to syndicate.");
  }

  if (approved) {

    // Add syndicate to channel.

    a = DynamoDB.update({
      TableName: process.env.DYNAMODB_TABLE_CHANNELS,
      Key: { channel_id },
      UpdateExpression: "ADD syndicates :syndicate_id",
      ExpressionAttributeValues: { ":syndicate_id": DynamoDB.createSet([syndicate_id]) }
    }).promise();

    // Add channel to syndicate.

    b = DynamoDB.update({
      TableName: process.env.DYNAMODB_TABLE_SYNDICATES,
      Key: { syndicate_id },
      UpdateExpression: "SET #channels.#channel_id = :channel_object",
      ExpressionAttributeNames: {
        "#channels": "channels",
        "#channel_id": channel_id
      },
      ExpressionAttributeValues: {
        ":channel_id": {
          earnings_cut: 0,
          member_since: Date.now()
        }
      }
    }).promise();
  }

  const invitation = syndicate_id;

  c = DynamoDB.update({
    TableName: process.env.DYNAMODB_TABLE_CHANNELS,
    Key: { channel_id },
    UpdateExpression: "DELETE invitations :invitation",
    ExpressionAttributeValues: { ":invitation": DynamoDB.createSet([invitation]) }
  }).promise();

  return Promise.all([a,b,c])
  .then(() => ({ syndicate_id }))
  .catch(error => {
    console.error(error);
    throw new Error("Error responding to invite.");
  });
};


const deleteSyndicate = (root, args, ctx, ast) => {

  //
  // TODO
  //

  const params = {
    TableName: process.env.DYNAMODB_TABLE_SYNDICATES,
    Key: { syndicate_id },
  };

  return DynamoDB.delete(params).promise()
  .then(() => ({ syndicate_id }))
};


////////////////////////////////////////////////////
///////////////////// EXPORTS //////////////////////
////////////////////////////////////////////////////


module.exports = {
  getSyndicateById,
  getSyndicateBySlug,
  getSyndicatesByIdArray,
  getInvitationsByIdArray,
  getSyndicatesByRange,
  createSyndicate,
  updateSyndicate,
  deleteSyndicate,
  leaveSyndicate,
  respondToSyndicateInvite
};


////////////////////////////////////////////////////
//////////////////// FUNCTIONS /////////////////////
////////////////////////////////////////////////////


function channelHasInvite(channel, syndicate_id) {

  // Determines whether the channel has actually received
  // an invite to join the syndicate in question.

  return includes(channel.invitations, syndicate_id);
}