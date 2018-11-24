const stripe = require("stripe")(process.env.STRIPE_KEY_PRIVATE);
const {
  curateSets,
  DynamoDB
} = require("../shared");
const { getSyndicateById } = require("./syndicate");


///////////////////////////////////////////////////
///////////////////// QUERIES /////////////////////
///////////////////////////////////////////////////


const getSubscriberById = (root, args) => {

  const { subscriber_id } = args;

  // Always private, called from the subscriber's settings dashboard.

  const params = {
    TableName: process.env.DYNAMODB_TABLE_SUBSCRIBERS,
    Key: { subscriber_id },
  };
  
  return DynamoDB.get(params).promise()
  .then(({ Item: subscriber }) => {
    if (subscriber) {
      subscriber = curateSets(subscriber);
      return subscriber;
    } else {
      throw new Error("Subscriber not found.");
    }
  });
};


///////////////////////////////////////////////////
//////////////////// MUTATIONS ////////////////////
///////////////////////////////////////////////////


const createSubscriber = ({ subscriber_id }) => {

  // Creates a new subscriber in DynamoDB.

  const subscriber = {
    subscriber_id,
    created_at: new Date().getTime(),
    channels: DynamoDB.createSet(["__DEFAULT__"]),
    syndicates: DynamoDB.createSet(["__DEFAULT__"])
  };
  const params = {
    TableName: process.env.DYNAMODB_TABLE_SUBSCRIBERS,
    Item: subscriber
  };

  return DynamoDB.put(params).promise()
  .then(() => ({ subscriber_id }));
};


const modifySubscription = async (root, args) => {

  // Subscribes or unsubscribes a user to a particular channel or syndicate,
  // updating both Stripe and DynamoDB to reflect the changes.

  const { data } = args;

  // subscribeToChannel()
  // unsubscribeFromChannel()
  // subscribeToSyndicate()
  // unsubscribeFromSyndicate()

  if (data._channel_id) {
    return handleModifySubscriptionChannel(data)
    .then(() => true)
    .catch(error => {
      console.error(error);
      throw new Error("Error modifying channel subscription.");
    });
  }

  if (data._syndicate_id) {
    return handleModifySubscriptionSyndicate(data)
    .then(() => true)
    .catch(error => {
      console.error(error);
      throw new Error("Error modifying syndicate subscription.");
    });
  }
};


////////////////////////////////////////////////////
///////////////////// EXPORTS //////////////////////
////////////////////////////////////////////////////


module.exports = {
  getSubscriberById,
  createSubscriber,
  modifySubscription
};


////////////////////////////////////////////////////
//////////////////// FUNCTIONS /////////////////////
////////////////////////////////////////////////////


async function handleModifySubscriptionChannel(data) {

  var a = b = Promise.resolve();

  const {
    subscriber_id,
    _channel_id,
    subscribe
  } = data;

  const params = {
    TableName: process.env.DYNAMODB_TABLE_CHANNELS,
    Key: { channel_id: _channel_id }
  };

  const {
    subscribers,
    plan_id
  } = await DynamoDB.get(params).promise().then(({ Item: channel }) => {

    // This is basically just getChannelById, but re-written here because otherwise
    // we have circular dependency issue between this file (subscriber.js) and channel.js,
    // which makes use of getSubscriberById, which is exported from this file.

    if (channel) {
      channel = curateSets(channel);
      return channel;
    } else {
      throw new Error();
    }
  });
  
  if (subscribe) {

    // if (subscribe) -> Create subscription.

    if (subscribers.indexOf(subscriber_id) > -1) {
      throw new Error("Already subscribed.");
    }

    // Add subscription to Stripe user.

    console.log(`${"[Stripe] ".padEnd(30, ".")} Creating new subscription for subscriber ${subscriber_id}`);
    const { id: subscription_id } = await stripe.subscriptions.create({
      customer: `cus_${subscriber_id}`,
      items: [{ plan: plan_id }]
    });

    // Add subscriber to channel's subscriber array.

    console.log(`${"[DynamoDB:CHANNELS] ".padEnd(30, ".")} Appending subscriber ${subscriber_id} to channel ${_channel_id}`);
    a = DynamoDB.update({
      TableName: process.env.DYNAMODB_TABLE_CHANNELS,
      Key: { channel_id: _channel_id },
      UpdateExpression: `ADD subscribers :subscriber_id`,
      ExpressionAttributeValues: { ":subscriber_id": DynamoDB.createSet([subscriber_id]) }
    }).promise();

    // Add channel to subscriber's channel array.

    console.log(`${"[DynamoDB:SUBSCRIBERS]".padEnd(30, ".")} Appending channel ${_channel_id} to subscriber ${subscriber_id}`);
    b = DynamoDB.update({
      TableName: process.env.DYNAMODB_TABLE_SUBSCRIBERS,
      Key: { subscriber_id },
      UpdateExpression: `ADD channels :channel_id`,
      ExpressionAttributeValues: { ":channel_id": DynamoDB.createSet([_channel_id]) }
    }).promise();

  } else {

    // else -> Delete subscription.

    const { subscriptions: { data: subscriptions }} = await stripe.customers.retrieve(`cus_${subscriber_id}`);

    // Obtain the correct subscription_id to be cancelled.

    var subscription_id;
    for (var i = 0; i < subscriptions.length; i++) {
      const product_id = subscriptions[i].plan.product;
      if (product_id === `prod_channel_${_channel_id}`) {
        subscription_id = subscriptions[i].id;
        break;
      } else if (i === subscriptions.length - 1) {
        throw new Error("Subscription not found.");
      }
    }

    // Cancel the subscription.

    console.log(`${"[Stripe] ".padEnd(30, ".")} Cancelling subscription ${subscription_id}`);
    await stripe.subscriptions.del(subscription_id);

    // Remove subscriber from channel's subscriber array.

    console.log(`${"[DynamoDB:CHANNELS] ".padEnd(30, ".")} Removing subscriber ${subscriber_id} from channel ${_channel_id}`);
    a = DynamoDB.update({
      TableName: process.env.DYNAMODB_TABLE_CHANNELS,
      Key: { channel_id: _channel_id },
      UpdateExpression: `DELETE subscribers :subscriber_id`,
      ExpressionAttributeValues: { ":subscriber_id": DynamoDB.createSet([subscriber_id]) }
    }).promise();

    // Remove channel from subscriber's channel array.

    console.log(`${"[DynamoDB:SUBSCRIBERS]".padEnd(30, ".")} Removing channel ${_channel_id} from subscriber ${subscriber_id}`);
    b = DynamoDB.update({
      TableName: process.env.DYNAMODB_TABLE_SUBSCRIBERS,
      Key: { subscriber_id },
      UpdateExpression: `DELETE channels :channel_id`,
      ExpressionAttributeValues: { ":channel_id": DynamoDB.createSet([_channel_id]) }
    }).promise();
  }

  return Promise.all([a,b]);
}


async function handleModifySubscriptionSyndicate(data) {

  var a = b = Promise.resolve();

  const {
    subscriber_id,
    _syndicate_id,
    subscribe
  } = data;

  const {
    subscribers,
    plan_id
  } = await getSyndicateById(null, { syndicate_id: _syndicate_id });
  
  if (subscribe) {

    // if (subscribe) -> Create subscription.

    if (subscribers.indexOf(subscriber_id) > -1) {
      throw new Error("Already subscribed.");
    }

    // Add subscription to Stripe user.

    console.log(`${"[Stripe] ".padEnd(30, ".")} Creating new subscription for subscriber ${subscriber_id}`);
    const { id: subscription_id } = await stripe.subscriptions.create({
      customer: `cus_${subscriber_id}`,
      items: [{ plan: plan_id }]
    });

    // Add subscriber to syndicate's subscriber array.

    console.log(`${"[DynamoDB:SYNDICATES] ".padEnd(30, ".")} Appending subscriber ${subscriber_id} to syndicate ${_syndicate_id}`);
    a = DynamoDB.update({
      TableName: process.env.DYNAMODB_TABLE_SYNDICATES,
      Key: { syndicate_id: _syndicate_id },
      UpdateExpression: `ADD subscribers :subscriber_id`,
      ExpressionAttributeValues: { ":subscriber_id": DynamoDB.createSet([subscriber_id]) }
    }).promise();

    // Add syndicate to subscriber's syndicate array.

    console.log(`${"[DynamoDB:SUBSCRIBERS]".padEnd(30, ".")} Appending syndicate ${_syndicate_id} to subscriber ${subscriber_id}`);
    b = DynamoDB.update({
      TableName: process.env.DYNAMODB_TABLE_SUBSCRIBERS,
      Key: { subscriber_id },
      UpdateExpression: `ADD syndicates :syndicate_id`,
      ExpressionAttributeValues: { ":syndicate_id": DynamoDB.createSet([_syndicate_id]) }
    }).promise();

  } else {

    // else -> Delete subscription.

    const { subscriptions: { data: subscriptions }} = await stripe.customers.retrieve(`cus_${subscriber_id}`);

    // Obtain the correct subscription_id to be cancelled.

    var subscription_id;
    for (var i = 0; i < subscriptions.length; i++) {
      const product_id = subscriptions[i].plan.product;
      if (product_id === `prod_syndicate_${_syndicate_id}`) {
        subscription_id = subscriptions[i].id;
        break;
      } else if (i === subscriptions.length - 1) {
        throw new Error("Subscription not found.");
      }
    }

    // Cancel the subscription.

    console.log(`${"[Stripe] ".padEnd(30, ".")} Cancelling subscription ${subscription_id}`);
    await stripe.subscriptions.del(subscription_id);

    // Remove subscriber from syndicate's subscriber array.

    console.log(`${"[DynamoDB:SYNDICATES] ".padEnd(30, ".")} Removing subscriber ${subscriber_id} from syndicate ${_syndicate_id}`);
    a = DynamoDB.update({
      TableName: process.env.DYNAMODB_TABLE_SYNDICATES,
      Key: { syndicate_id: _syndicate_id },
      UpdateExpression: `DELETE subscribers :subscriber_id`,
      ExpressionAttributeValues: { ":subscriber_id": DynamoDB.createSet([subscriber_id]) }
    }).promise();

    // Remove syndicate from subscriber's syndicate array.

    console.log(`${"[DynamoDB:SUBSCRIBERS]".padEnd(30, ".")} Removing syndicate ${_syndicate_id} from subscriber ${subscriber_id}`);
    b = DynamoDB.update({
      TableName: process.env.DYNAMODB_TABLE_SUBSCRIBERS,
      Key: { subscriber_id },
      UpdateExpression: `DELETE syndicates :syndicate_id`,
      ExpressionAttributeValues: { ":syndicate_id": DynamoDB.createSet([_syndicate_id]) }
    }).promise();
  }

  return Promise.all([a,b]);
}