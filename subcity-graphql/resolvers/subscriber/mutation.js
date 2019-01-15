const chunk = require("lodash/chunk");
const intersectionBy = require("lodash/intersectionBy");

const {
  buildQuery,
  createAuth0User,
  createStripeCustomer,
  createStripeSource,
  createStripeSubscription,
  deleteAuth0User,
  deleteStripeCustomer,
  deleteStripeSource,
  deleteStripeSubscription,
  DynamoDB,
  updatePassword,
  queryAll,
  sanitize,
  setDefaultStripeSource
} = require("../../shared");


module.exports = {
  createSource,
  createSubscription,
  deleteAllSubscriptions,
  deleteSource,
  deleteSubscription,
  deleteSubscriber,
  initializeSubscriber,
  setDefaultSource,
  updateSubscriber,
  writeSubscriberUpdates
};


////////////////////////////////////////////////////////////
//////////////////////// FUNCTIONS /////////////////////////
////////////////////////////////////////////////////////////


function createSource (subscriber_id, token) {

  return createStripeSource(`cus_${subscriber_id}`, token)
  .then(() => true);
}


function createSubscription (subscriber_id, data) {

  data = sanitize(data);

  const {
    channel_id,
    extra,
    syndicate_id,
    tier
  } = data;

  if (channel_id) {
    return subscribeToChannel(subscriber_id, channel_id, tier, extra);

  } else if (syndicate_id) {
    return subscribeToSyndicate(subscriber_id, syndicate_id, tier, extra);

  } else {
    throw new Error("! Channel or syndicate ID missing.");
  }
}


function deleteAllSubscriptions (subscriber_id) {

  return deleteSubscriptionsBySubscriberID(subscriber_id)
  .then(() => true);
}


function deleteSource (subscriber_id, source_id) {

  return deleteStripeSource(`cus_${subscriber_id}`, source_id)
  .then(() => true);
}


function deleteSubscriber (subscriber_id) {

  if (!subscriber_id) { return; }

  const tasks = [

    // Stripe

    deleteStripeCustomer(`cus_${subscriber_id}`),

    // Auth0

    deleteAuth0User(`auth0|cus_${subscriber_id}`),

    // DynamoDB

    deleteMessagesBySubscriberID(subscriber_id),
    deleteSubscriptionsBySubscriberID(subscriber_id),
    deleteSubscriberBySubscriberID(subscriber_id),
  ];

  return Promise.all(tasks)
  .then(() => true);
}


async function deleteSubscription (subscriber_id, subscription_id) {

  const params = {
    TableName: process.env.DYNAMODB_TABLE_SUBSCRIPTIONS,
    Key: {
      subscriber_id,
      subscription_id
    }
  };

  // Wait for Stripe deletion to succeed.

  await deleteStripeSubscription(`sub_${subscription_id}`);

  console.log(`[DynamoDB:SUBSCRIPTIONS] Deleting subscription ${subscription_id}`);
  return DynamoDB.delete(params).promise()
  .then(() => true);
}


async function initializeSubscriber (data) {

  var subscriber_id;

  try {

    const {
      id: stripe_id
    } = await createStripeCustomer({ source: data.token_id });
    subscriber_id = stripe_id.replace(/^cus_/g, "");

    // Create the Auth0 user and DynamoDB subscriber object.

    const seed = {
      email: data.email,
      subscriber_id
    };
    
    await Promise.all([
      createSubscriber(seed),
      createAuth0User(Object.assign({ user_id: stripe_id, role: "subscriber" }, data))
    ]);

    return { subscriber_id };

  } catch (error) {

    // Rollback.

    deleteSubscriber(subscriber_id);
    throw error;
  }
}


function setDefaultSource (subscriber_id, source_id) {

  return setDefaultStripeSource(`cus_${subscriber_id}`, source_id)
  .then(() => true);
}


function updateSubscriber (subscriber_id, { email, password, ...data }) {

  // TODO: Sanitize address input

  data = sanitize(data);
  data.time_updated = Date.now();

  const tasks = [];

  if (email) {

    // Send confirmation email link

  }

  if (password) {
    tasks.push(updatePassword(`auth0|cus_${subscriber_id}`, password));
  }

  tasks.push(writeSubscriberUpdates(subscriber_id, data));

  return Promise.all(tasks)
  .then(() => ({ subscriber_id }));
};


function writeSubscriberUpdates (subscriber_id, updates) {

  // Writes subscriber updates to DynamoDB.

  const { ExpressionAttributeValues, UpdateExpression } = buildQuery(updates);

  console.log(`[DynamoDB:SUBSCRIPTIONS] Updating subscriber ${subscriber_id}`);
  return DynamoDB.update({
    TableName: process.env.DYNAMODB_TABLE_SUBSCRIBERS,
    Key: { subscriber_id },
    UpdateExpression,
    ExpressionAttributeValues
  }).promise();
}


////////////////////////////////////////////////////////////
///////////////////////// HELPERS //////////////////////////
////////////////////////////////////////////////////////////


function createSubscriber (seed) {

  const subscriber = Object.assign({
    address: null,
    alias: null,
    time_created: Date.now(),
    time_updated: 0
  }, seed);

  console.log(`[DynamoDB:SUBSCRIBERS] Creating new subscriber ${seed.subscriber_id}`);
  return DynamoDB.put({
    TableName: process.env.DYNAMODB_TABLE_SUBSCRIBERS,
    Item: subscriber
  }).promise();
}


function deleteSubscriberBySubscriberID (subscriber_id) {

  const params = {
    TableName: process.env.DYNAMODB_TABLE_SUBSCRIBERS,
    Key: { subscriber_id },
  };

  console.log(`[DynamoDB:SUBSCRIBERS] Deleting subscriber ${subscriber_id}`);
  return DynamoDB.delete(params).promise();
}


function deleteMessagesBySubscriberID (subscriber_id) {
  
}


async function deleteSubscriptionsBySubscriberID (subscriber_id) {

  const params = {
    TableName: process.env.DYNAMODB_TABLE_SUBSCRIPTIONS,
    KeyConditionExpression: "subscriber_id = :subscriber_id",
    ExpressionAttributeValues: {
      ":subscriber_id": subscriber_id
    }
  };

  const subscriptions = await queryAll(params);

  console.log(`[DynamoDB:SUBSCRIPTIONS] Deleting all subscriptions for subscriber ${subscriber_id}`);
  const chunked = chunk(subscriptions, 25).map(chunk => {
    const requests = chunk.map(({ channel_id }) => ({
      DeleteRequest: {
        Key: {
          channel_id,
          subscriber_id
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


async function subscribeToChannel (subscriber_id, channel_id, tier, extra) {

  const [
    {
      Item: {
        funding,
        plan_id
      }
    },
    {
      Items: existing_subscriptions
    }
  ] = await Promise.all([

    DynamoDB.get({
      TableName: process.env.DYNAMODB_TABLE_CHANNELS,
      Key: { channel_id }
    }).promise(),

    DynamoDB.query({
      TableName: process.env.DYNAMODB_TABLE_SUBSCRIPTIONS,
      IndexName: `${process.env.DYNAMODB_TABLE_SUBSCRIPTIONS}-GSI-1`,
      KeyConditionExpression: "channel_id = :channel_id AND subscriber_id = :subscriber_id",
      ExpressionAttributeValues: {
        ":channel_id": channel_id,
        ":subscriber_id": subscriber_id
      }
    }).promise()
  ]);

  if (existing_subscriptions.length) {
    throw new Error("! Already subscribed.");
  }

  const active = funding === "per_month";

  // Create Stripe subscription.

  const {
    id: stripe_id
  } = await createStripeSubscription(`cus_${subscriber_id}`, plan_id, tier, extra, active);

  const subscription_id = stripe_id.replace(/^sub_/g, "");

  const subscription = {
    channel_id,
    extra,
    subscriber_id,
    subscription_id,
    tier,
    time_created: Date.now()
  };

  // Create DynamoDB subscription.

  console.log(`[DynamoDB:SUBSCRIPTIONS] Creating subscription ${subscriber_id}:${subscription_id}`);
  return DynamoDB.put({
    TableName: process.env.DYNAMODB_TABLE_SUBSCRIPTIONS,
    Item: subscription
  }).promise()
  .then(() => ({ subscription_id }));
}


async function subscribeToSyndicate (subscriber_id, syndicate_id, tier, extra) {

  const [
    {
      Item: {
        plan_id
      }
    },
    {
      Items: subscriptions
    }
  ] = await Promise.all([

    DynamoDB.get({
      TableName: process.env.DYNAMODB_TABLE_SYNDICATES,
      Key: { syndicate_id }
    }).promise(),

    DynamoDB.query({
      TableName: process.env.DYNAMODB_TABLE_SUBSCRIPTIONS,
      KeyConditionExpression: "subscriber_id = :subscriber_id",
      ExpressionAttributeValues: {
        ":subscriber_id": subscriber_id
      }
    }).promise()
  ]);

  if (subscriptions.filter(({ syndicate_id: id }) => (id === syndicate_id)).length) {
    throw new Error("! Already subscribed.");
  }

  // Create Stripe subscription.

  const {
    id: stripe_id
  } = await createStripeSubscription(`cus_${subscriber_id}`, plan_id, tier, extra);

  const subscription_id = stripe_id.replace(/^sub_/g, "");

  const subscription = {
    extra,
    subscriber_id,
    subscription_id,
    syndicate_id,
    tier,
    time_created: Date.now()
  };

  console.log(`[DynamoDB:SUBSCRIPTIONS] Creating subscription ${subscriber_id}:${subscription_id}`);
  return Promise.all([

    // Remove channel subscriptions covered by new syndicate subscription.

    resolveCoverage(syndicate_id, subscriber_id, subscriptions),

    // Create subscription in DynamoDB.

    DynamoDB.put({
      TableName: process.env.DYNAMODB_TABLE_SUBSCRIPTIONS,
      Item: subscription
    }).promise()
  ])
  .then(() => ({ subscription_id }));
}


async function resolveCoverage (syndicate_id, subscriber_id, subscriptions) {

  // This method deletes all channel subscriptions already covered under the syndicate.

  const {
    Items: channels
  } = await DynamoDB.query({
    TableName: process.env.DYNAMODB_TABLE_MEMBERSHIPS,
    IndexName: `${process.env.DYNAMODB_TABLE_MEMBERSHIPS}-GSI`,
    KeyConditionExpression: "syndicate_id = :syndicate_id",
    ExpressionAttributeValues: {
      ":syndicate_id": syndicate_id
    }
  }).promise();

  // Produces an array of subscriptions intersected with "channel_id" from the channels array.

  const covered = intersectionBy(subscriptions, channels, ({ channel_id }) => channel_id);

  return Promise.all(covered.map(({ subscriber_id, subscription_id }) => deleteSubscription(subscriber_id, subscription_id)));
}
