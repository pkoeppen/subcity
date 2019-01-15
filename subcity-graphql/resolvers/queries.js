const flattenDeep = require("lodash/flattenDeep");
const intersectionBy = require("lodash/intersectionBy");

const {
  DynamoDB,
  getStripeAccountSettings,
  getStripeSources,
  queryAll,
  scanAll,
} = require("../shared");

module.exports = {
  assertOfferExists,
  determineSlugType,
  getAllChannels,
  getAllSubscriptionsByChannelID,
  getSubscriptionsBySubscriberID,
  getAllSyndicates,
  getChannelByID,
  getChannelBySlug,
  getChannelsBySyndicateID,
  getInvitationsByChannelID,
  getMembershipsBySyndicateID,
  getPayoutSettings,
  getProposalsBySyndicateID,
  getReleasesByChannelID,
  getSlugBySlug,
  getSources,
  getSubscriberByID,
  getSubscribersByChannelID,
  getSubscriptionByChannelID,
  getSubscriptionBySyndicateID,
  getSubscriptionsByChannelID,
  getSubscriptionsBySyndicateID,
  getSyndicateByID,
  getSyndicateBySlug,
  getSyndicatesByChannelID,
};


////////////////////////////////////////////////////////////
//////////////////////// FUNCTIONS /////////////////////////
////////////////////////////////////////////////////////////


function assertOfferExists (offer_id) {

  // Assert signup offer exists.
  
  return getSignupOffer(offer_id)
  .then(offer => {
    if (!offer) {
      throw new Error("![404] No such signup offer.")
    } else {
      return true;
    }
  });
}


async function determineSlugType (slug) {

  const {
    channel_id,
    syndicate_id
  } = await getSlugBySlug(slug);

  if (channel_id) return "channel";
  if (syndicate_id) return "syndicate";
}


function getAllChannels () {

  return scanAll({
    TableName: process.env.DYNAMODB_TABLE_CHANNELS,
    FilterExpression: "unlisted = :unlisted AND time_updated <> :zero",
    ExpressionAttributeValues: { ":unlisted": false, ":zero": 0 }
  });
}


async function getAllSubscriptionsByChannelID (channel_id) {

  // Get all direct channel subscriptions.

  const _0 = queryAll({
    TableName: process.env.DYNAMODB_TABLE_SUBSCRIPTIONS,
    IndexName: `${process.env.DYNAMODB_TABLE_SUBSCRIPTIONS}-GSI-1`,
    KeyConditionExpression: "channel_id = :channel_id",
    ExpressionAttributeValues: { ":channel_id": channel_id }
  });

  // Get all syndicates of which the channel is a member.

  const memberships = await getMembershipsByChannelID(channel_id);

  // Get all subscriptions to those syndicates.

  const _1 = Promise.all(memberships.map(({ syndicate_id }) => {
    return queryAll({
      TableName: process.env.DYNAMODB_TABLE_SUBSCRIPTIONS,
      IndexName: `${process.env.DYNAMODB_TABLE_SUBSCRIPTIONS}-GSI-2`,
      KeyConditionExpression: "syndicate_id = :syndicate_id",
      ExpressionAttributeValues: { ":syndicate_id": syndicate_id }
    });
  }));

  return flattenDeep(await Promise.all([_0,_1]));
}


function getAllSyndicates () {

  return scanAll({
    TableName: process.env.DYNAMODB_TABLE_SYNDICATES,
    FilterExpression: "unlisted = :unlisted",
    ExpressionAttributeValues: { ":unlisted": false }
  });
}


function getChannelByID (channel_id) {

  if (!channel_id) { return null; }

  return DynamoDB.get({
    TableName: process.env.DYNAMODB_TABLE_CHANNELS,
    Key: { channel_id }
  })
  .promise()
  .then(({ Item }) => Item);
}


async function getChannelBySlug (slug) {

  const {
    channel_id
  } = await getSlugBySlug(slug);

  return getChannelByID(channel_id)
  .then(channel => {
    if (!channel) {
      throw new Error("![404] Channel not found.");
    } else {
      return channel;
    }
  });
}


async function getChannelsBySyndicateID (syndicate_id) {

  const memberships = await queryAll({
    TableName: process.env.DYNAMODB_TABLE_MEMBERSHIPS,
    IndexName: `${process.env.DYNAMODB_TABLE_MEMBERSHIPS}-GSI`,
    KeyConditionExpression: "syndicate_id = :syndicate_id",
    ExpressionAttributeValues: { ":syndicate_id": syndicate_id }
  });

  return Promise.all(memberships.map(({ channel_id }) => getChannelByID(channel_id)));
}


function getInvitationsByChannelID (channel_id) {

  return queryAll({
    TableName: process.env.DYNAMODB_TABLE_INVITATIONS,
    KeyConditionExpression: "channel_id = :channel_id",
    ExpressionAttributeValues: { ":channel_id": channel_id }
  })
}


function getMembershipsByChannelID (channel_id) {

  return queryAll({
    TableName: process.env.DYNAMODB_TABLE_MEMBERSHIPS,
    KeyConditionExpression: "channel_id = :channel_id",
    ExpressionAttributeValues: { ":channel_id": channel_id }
  });
}


function getMembershipsBySyndicateID (syndicate_id) {

  return queryAll({
    TableName: process.env.DYNAMODB_TABLE_MEMBERSHIPS,
    IndexName: `${process.env.DYNAMODB_TABLE_MEMBERSHIPS}-GSI`,
    KeyConditionExpression: "syndicate_id = :syndicate_id",
    ExpressionAttributeValues: { ":syndicate_id": syndicate_id }
  });
}


function getPayoutSettings (channel_id) {

  return getStripeAccountSettings(`acct_${channel_id}`);
}


async function getProposalsBySyndicateID (syndicate_id, channel_id) {

  await syndicateHasChannel(syndicate_id, channel_id);

  return queryAll({
    TableName: process.env.DYNAMODB_TABLE_PROPOSALS,
    KeyConditionExpression: "syndicate_id = :syndicate_id",
    ExpressionAttributeValues: { ":syndicate_id": syndicate_id },
    ScanIndexForward: false
  });
}


function getReleasesByChannelID (channel_id) {

  return queryAll({
    TableName: process.env.DYNAMODB_TABLE_RELEASES,
    KeyConditionExpression: "channel_id = :channel_id",
    ExpressionAttributeValues: { ":channel_id": channel_id },
    ScanIndexForward: false
  });
}


function getSlugBySlug (slug) {

  return DynamoDB.get({
    TableName: process.env.DYNAMODB_TABLE_SLUGS,
    Key: { slug }
  })
  .promise()
  .then(({ Item }) => Item);
}


function getSources (subscriber_id) {

  return getStripeSources(`cus_${subscriber_id}`);
}


function getSubscriberByID (subscriber_id) {

  return DynamoDB.get({
    TableName: process.env.DYNAMODB_TABLE_SUBSCRIBERS,
    Key: { subscriber_id }
  })
  .promise()
  .then(({ Item }) => Item);
}


function getSubscribersByChannelID (channel_id) {

  return getSubscriptionsByChannelID(channel_id)
  .then(subscriptions => {
    return Promise.all(subscriptions.map(({ subscriber_id }) => {
      return getSubscriberByID(subscriber_id);
    }));
  });
}


async function getSubscriptionByChannelID (subscriber_id, channel_id) {

  const subscriptions = await queryAll({
    TableName: process.env.DYNAMODB_TABLE_SUBSCRIPTIONS,
    KeyConditionExpression: "subscriber_id = :subscriber_id",
    ExpressionAttributeValues: { ":subscriber_id": subscriber_id }
  });

  if (!subscriptions.length) return null;

  const direct_subscription = subscriptions.find(({ channel_id: id }) => id === channel_id);

  if (direct_subscription) return direct_subscription;

  // Intersect list of syndicate IDs to channel's memberships to determine
  // whether subscription to channel is superceded by subscription to syndicate.

  const syndicate_subscriptions = subscriptions.filter(({ syndicate_id }) => !!syndicate_id);
  const memberships = await getMembershipsByChannelID(channel_id);

  const matches = intersectionBy(syndicate_subscriptions, memberships, ({ syndicate_id }) => syndicate_id);

  if (matches.length) {
    return matches[0];
  }
}


async function getSubscriptionBySyndicateID (subscriber_id, syndicate_id) {

  const subscriptions = await queryAll({
    TableName: process.env.DYNAMODB_TABLE_SUBSCRIPTIONS,
    IndexName: `${process.env.DYNAMODB_TABLE_SUBSCRIPTIONS}-GSI-2`,
    KeyConditionExpression: "subscriber_id = :subscriber_id AND syndicate_id = :syndicate_id",
    ExpressionAttributeValues: {
      ":subscriber_id": subscriber_id,
      ":syndicate_id": syndicate_id,
    }
  });

  if (subscriptions.length) {
    return subscriptions[0];
  }
}


function getSubscriptionsBySubscriberID (subscriber_id) {

  return queryAll({
    TableName: process.env.DYNAMODB_TABLE_SUBSCRIPTIONS,
    KeyConditionExpression: "subscriber_id = :subscriber_id",
    ExpressionAttributeValues: { ":subscriber_id": subscriber_id }
  });
}


function getSubscriptionsByChannelID (channel_id) {

  return queryAll({
    TableName: process.env.DYNAMODB_TABLE_SUBSCRIPTIONS,
    IndexName: `${process.env.DYNAMODB_TABLE_SUBSCRIPTIONS}-GSI-1`,
    KeyConditionExpression: "channel_id = :channel_id",
    ExpressionAttributeValues: { ":channel_id": channel_id }
  });
}


async function getSubscriptionsBySyndicateID (syndicate_id, channel_id) {

  await syndicateHasChannel(syndicate_id, channel_id);

  return queryAll({
    TableName: process.env.DYNAMODB_TABLE_SUBSCRIPTIONS,
    IndexName: `${process.env.DYNAMODB_TABLE_SUBSCRIPTIONS}-GSI-2`,
    KeyConditionExpression: "syndicate_id = :syndicate_id",
    ExpressionAttributeValues: { ":syndicate_id": syndicate_id }
  });
}


function getSyndicateByID (syndicate_id) {

  return DynamoDB.get({
    TableName: process.env.DYNAMODB_TABLE_SYNDICATES,
    Key: { syndicate_id }
  })
  .promise()
  .then(({ Item }) => Item);
}


async function getSyndicateBySlug (slug) {

  const {
    syndicate_id
  } = await getSlugBySlug(slug);

  return getSyndicateByID(syndicate_id)
  .then(syndicate => {
    if (!syndicate) {
      throw new Error("![404] Syndicate not found.");
    } else {
      return syndicate;
    }
  });
}


async function getSyndicatesByChannelID (channel_id) {

  const memberships = await queryAll({
    TableName: process.env.DYNAMODB_TABLE_MEMBERSHIPS,
    KeyConditionExpression: "channel_id = :channel_id",
    ExpressionAttributeValues: { ":channel_id": channel_id }
  });

  return Promise.all(memberships.map(({ syndicate_id }) => getSyndicateByID(syndicate_id)));
}


////////////////////////////////////////////////////////////
///////////////////////// HELPERS //////////////////////////
////////////////////////////////////////////////////////////


function getSignupOffer (offer_id) {

  // Get signup offer.

  const params = {
    TableName: process.env.DYNAMODB_TABLE_OFFERS,
    Key: { offer_id },
  };

  return DynamoDB.get(params)
  .promise().then(({ Item: offer }) => offer);
};


async function syndicateHasChannel (syndicate_id, channel_id) {

  const memberships = await queryAll({
    TableName: process.env.DYNAMODB_TABLE_MEMBERSHIPS,
    KeyConditionExpression: "channel_id = :channel_id AND syndicate_id = :syndicate_id",
    ExpressionAttributeValues: {
      ":channel_id": channel_id,
      ":syndicate_id": syndicate_id,
    }
  });

  if (!memberships.length) {
    throw new Error("![403] No such member channel.");
  }
}
