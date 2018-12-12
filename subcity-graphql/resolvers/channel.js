const stripe = require("stripe")(process.env.STRIPE_KEY_PRIVATE);
const {
  promisify,
  sanitize,
  DynamoDB,
  S3,
  buildDynamoDBQuery,
  getIDHash,
  parseDescription,
  curateSets,
  stripeUtilities
} = require("../shared");
const {
  chunk,
  flatten,
  includes,
  intersection
} = require("lodash");
const {
  getSubscriberById
} = require("./subscriber");


///////////////////////////////////////////////////
///////////////////// QUERIES /////////////////////
///////////////////////////////////////////////////


const getChannelById = async (root, args, ctx, ast) => {
  const params2 = {
      Bucket: process.env.S3_BUCKET_OUT,

      // Remove filename.

      //Prefix: "channels/1DbsTgA6NFF4hd0H/payload"
    };

    const foo = await S3.listObjects(params2).promise().catch(error => console.log(error));
    console.log(foo)

  // Always private, called from the channel settings page.

  const channel_id = args.channel_id || root.creator;

  if (!channel_id) { return null; }
  
  const params = {
    TableName: process.env.DYNAMODB_TABLE_CHANNELS,
    Key: { channel_id }
  };

  return DynamoDB.get(params).promise()
  .then(({ Item: channel }) => {
    if (channel) {
      channel = curateSets(channel);
      channel.earnings_month = channel.subscribers.length * channel.subscription_rate;
      channel.description = parseDescription(channel.description, true);
      return channel;
    } else {
      throw new Error();
    }
  })
  .catch(error => {
    console.error(error);
    return new Error("Error fetching channel.");
  });
};


const getChannelBySlug = (root, args, ctx, ast) => {

  // Called only from a public channel page, but accessible from within
  // both the public and private API. It also exists within the private
  // API to allow the attachment of a channel or subscriber id field.

  const {
    channel_id,
    subscriber_id,
    slug
  } = args;

  const params = {
    TableName: process.env.DYNAMODB_TABLE_CHANNELS,
    FilterExpression: "slug = :slug",
    ExpressionAttributeValues: { ":slug": slug }
  };

  return DynamoDB.scan(params).promise()
  .then(async ({ Items: channels }) => {

    const channel = curateSets(channels[0]);

    if (!channel) {
      throw new Error();
    } else {

      // Delete sensitive fields.

      delete channel.plan_id;
      delete channel.earnings_month;
      delete channel.earnings_total;
      delete channel.subscriber_count;
      delete channel.subscriber_pays;
      delete channel.is_unlisted;

      // Deserialize the channel description.

      channel.description = parseDescription(channel.description);

      if (subscriber_id) {

        // Attach "is_subscribed" to accurately display the "subscribe"
        // or "unsubscribe" button on the front end.

        const { syndicates: subscriber_syndicates } = await getSubscriberById(null, { subscriber_id });

        channel.is_subscribed                = includes(channel.subscribers, subscriber_id);
        channel.subscribed_through_syndicate = intersection(channel.syndicates, subscriber_syndicates).length > 0;
      }

      return channel;
    }
  })
  .catch(error => {
    console.error(error);
    throw new Error("Error fetching channel.");
  });
};


const getChannelsByIdArray = (root, args, ctx, ast) => {

  // Returns channel objects based on an array of supplied IDs.

  const { channels } = root;

  if (!channels || !channels.length) { return []; }

  const chunked = chunk(channels, 100).map(chunk => {
    const params = {
      RequestItems: {
        [process.env.DYNAMODB_TABLE_CHANNELS]: {
          Keys: chunk.map(channel_id => ({ channel_id }))
        }
      }
    };
    return DynamoDB.batchGet(params).promise();
  });

  return Promise.all(chunked)
  .then(results => {
    return flatten(results.map(({ Responses }) => Responses[process.env.DYNAMODB_TABLE_CHANNELS]))
    .map(channel => curateSets(channel));
  })
  .catch(error => {
    console.error(error);
    throw new Error("Error fetching channels.");
  });;
};


const getApprovalsByIdArray = (root, args, ctx, ast) => {

  // A little workaround to return an array of SyndicateType objects.

  root.channels = root.approvals;
  return getChannelsByIdArray(root, args);
};


const getRejectionsByIdArray = (root, args, ctx, ast)=> {

  // See above.

  root.channels = root.rejections;
  return getChannelsByIdArray(root, args);
};


const getChannelsByRange = (root, args, ctx, ast) => {

  // TODO: Stuff

  const params = {
    TableName: process.env.DYNAMODB_TABLE_CHANNELS,
    FilterExpression : "updated_at <> :zero",
    ExpressionAttributeValues : { ":zero" : 0 },
    // Limit: 50,
  };

  return DynamoDB.scan(params).promise()
  .then(({ Items }) => (Items || []))
  .catch(error => {
    console.error(error);
    throw new Error("Error fetching channels.");
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


const getChannelPaymentSettings = (root, args, ctx, ast) => {

  // Fetch Stripe account settings and transmogrify it
  // to fit the ChannelPaymentSettings GraphQL type.

  const { channel_id } = args;
  
  return stripe.accounts.retrieve(`acct_${channel_id}`)
  .then(account => {

    // Add leading zeroes to date.

    var { year, month, day } = account.legal_entity.dob;
    month = ("0" + month).slice(-2);
    day = ("0" + day).slice(-2);

    // Mangle the data into a form GraphQL will accept.

    const paymentSettingsObject = {
      first_name: account.legal_entity.first_name,
      last_name: account.legal_entity.last_name,
      country: account.country,
      city: account.legal_entity.address.city,
      line1: account.legal_entity.address.line1,
      postal_code: account.legal_entity.address.postal_code,
      state: account.legal_entity.address.state,
      dob: `${year}-${month}-${day}`,
      bank_name: account.external_accounts.data[0].bank_name,
      routing_number: account.external_accounts.data[0].routing_number,
      account_number_last4: account.external_accounts.data[0].last4,
      payout_interval: account.payout_schedule.interval,
      payout_anchor: account.payout_schedule.monthly_anchor || account.payout_schedule.weekly_anchor || null
    };

    return paymentSettingsObject;
  })
  .catch(error => {
    console.error(error);
    throw new Error("Error fetching payment settings.");
  });
};


///////////////////////////////////////////////////
//////////////////// MUTATIONS ////////////////////
///////////////////////////////////////////////////


const createChannel = ({ channel_id, currency, plan_id }) => {

  // This method is only accessible through ChannelSignupMutation.

  const channel = {
    channel_id: channel_id,
    created_at: new Date().getTime(),
    updated_at: null,
    profile_url: `${process.env.DATA_HOST}/${process.env.S3_BUCKET_OUT}/channels/${channel_id}/profile.jpeg`,
    payload_url: null,
    earnings_total: 0,
    currency: currency,
    plan_id: plan_id,
    slug: null,
    title: null,
    description: null,
    is_nsfw: false,
    is_unlisted: false,
    subscription_rate: 499,
    subscriber_pays: false,
    releases: DynamoDB.createSet(["__DEFAULT__"]),
    syndicates: DynamoDB.createSet(["__DEFAULT__"]),
    subscribers: DynamoDB.createSet(["__DEFAULT__"]),
    invitations: DynamoDB.createSet(["__DEFAULT__"])
  };

  console.log(`${"[DynamoDB:CHANNELS] ".padEnd(30, ".")} Creating new channel ${channel_id}`);
  return DynamoDB.put({
    TableName: process.env.DYNAMODB_TABLE_CHANNELS,
    Item: channel
  })
  .promise()
  .then(() => ({ channel_id }))
  .catch(error => {
    console.error(error);
    throw new Error("Error creating channel.");
  });
};


const updateChannel = async (root, args, ctx, ast) => {

  const data = sanitize(args.data);
  data.updated_at = new Date().toISOString();

  if (data.subscription_rate) {
    try {
      const channel     = await getChannelById(null, data);
      const new_plan_id = await stripeUtilities.handleSubscriptionRateChange("channel", channel, Math.floor(data.subscription_rate));

      // Set "data.plan_id" so it gets written into the DynamoDB UpdateExpression.

      data.plan_id = new_plan_id;
    } catch(error) {
      console.error(error);
      throw new Error("Error updating subscription rate.");
    } 
  }

  // Build the query string for DynamoDB.

  const { expressionAttributeValues, updateExpression } = buildDynamoDBQuery(data);

  return DynamoDB.update({
    TableName: process.env.DYNAMODB_TABLE_CHANNELS,
    Key: { channel_id: data.channel_id },
    UpdateExpression: `SET ${updateExpression}`,
    ExpressionAttributeValues: expressionAttributeValues,

    // This expression avoids accidental creation.

    ConditionExpression: "attribute_exists(channel_id)"
  })
  .promise()
  .then(() => ({ channel_id: data.channel_id }))
  .catch(error => {
    console.log(error)
    throw new Error("Error updating channel.");
  });
};


const updateChannelPaymentSettings = async (root, args, ctx, ast) => {

  const { data } = args;

  // If a new account number is provided, build the external_account object.

  let external_account;
  if (data.account_number) {
    external_account = {
      object: "bank_account",
      country: data.country,
      currency: await stripeUtilities.getDefaultCurrency(data.country),
      account_number: data.account_number,
      ...(!!data.routing_number && { routing_number: data.routing_number })
    };
  }

  // Always build the legal_entity object.

  const { year, month, day } = stripeUtilities.parseDate(data.dob);
  const legal_entity = {
    first_name: data.first_name,
    last_name: data.last_name,
    address: {
      city: data.city,
      line1: data.line1,
      postal_code: data.postal_code,
      state: data.state
    },
    dob: {
      day: day,
      month: month,
      year: year
    },
    type: "individual",

    // If a new personal ID number is provided, include the following fields.

    ...(!!data.personal_id_number && { personal_id_number: data.personal_id_number }),
    ...(!!data.personal_id_number && data.country === "US" && { ssn_last_4: stripeUtilities.getSSNLast4(data) })
  };

  // Build the final Stripe account object.

  const stripeAccountObject = {
    legal_entity,
    ...(!!external_account && { external_account }),
  };

  // Update the account.

  return stripe.accounts.update(`acct_${data.channel_id}`, stripeAccountObject)
  .then(account => true)
  .catch(error => {
    throw new Error("Error updating payment settings.");
  });
};


////////////////////////////////////////////////////
///////////////////// EXPORTS //////////////////////
////////////////////////////////////////////////////


module.exports = {
  getChannelById,
  getChannelBySlug,
  getChannelsByIdArray,
  getApprovalsByIdArray,
  getRejectionsByIdArray,
  getChannelsByRange,
  getChannelPaymentSettings,
  createChannel,
  updateChannel,
  updateChannelPaymentSettings
};