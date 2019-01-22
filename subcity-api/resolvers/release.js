const {
  clearS3ByPrefix,
  DynamoDB,
  buildQuery,
  sanitize
} = require("../shared");

const {
  getChannelByID,
  getReleasesByChannelID,
} = require("./queries");


module.exports = {
  createRelease,
  deleteRelease,
  updateRelease
};


////////////////////////////////////////////////////////////
//////////////////////// FUNCTIONS /////////////////////////
////////////////////////////////////////////////////////////


function deleteRelease (channel_id, time_created) {

  const tasks = [
    deleteReleaseByChannelID(channel_id, time_created),
    clearS3ByPrefix(`channels/${channel_id}/releases/${time_created}`)
  ];

  return Promise.all(tasks)
  .then(() => true);
}


async function createRelease (channel_id, data) {

  data = sanitize(data);

  const [
    {
      funding,
      tiers,
      time_updated,
    },
    releases,
  ] = await Promise.all([
    getChannelByID(channel_id),
    getReleasesByChannelID(channel_id),
  ]);

  if (!time_updated) {
    throw new Error("![400] Channel must be published before creating releases.");
  }

  if (releases.map(({ slug }) => slug).indexOf(data.slug) >= 0) {
    throw new Error(`![400] Release with slug "${data.slug}" already exists.`);
  }

  const release = Object.assign({
    channel_id,
    time_created: Date.now(),
    time_updated: 0
  }, data);

  const tasks = [
    DynamoDB.put({
      TableName: process.env.DYNAMODB_TABLE_RELEASES,
      Item: release
    }).promise()
  ];

  if (funding === "per_release") {
    tasks.push(chargeSubscribers(channel_id, tiers));
  }

  return Promise.all(tasks)
  .then(() => release);
}


function updateRelease (channel_id, time_created, data) {

  data = sanitize(data);
  data.time_updated = Date.now();

  const { ExpressionAttributeValues, UpdateExpression } = buildQuery(data);

  const params = {
    TableName: process.env.DYNAMODB_TABLE_RELEASES,
    Key: {
      channel_id,
      time_created
    },
    UpdateExpression,
    ExpressionAttributeValues
  };

  return DynamoDB.update(params).promise()
  .then(() => ({ time_created }));
};


////////////////////////////////////////////////////////////
///////////////////////// HELPERS //////////////////////////
////////////////////////////////////////////////////////////


async function chargeSubscribers (channel_id, tiers) {

  const {
    Items: subscriptions
  } = await DynamoDB.query({
    TableName: process.env.DYNAMODB_TABLE_SUBSCRIPTIONS,
    IndexName: `${process.env.DYNAMODB_TABLE_SUBSCRIPTIONS}-GSI-1`,
    KeyConditionExpression: "channel_id = :channel_id",
    ExpressionAttributeValues: {
      ":channel_id": channel_id
    }
  }).promise();

  return Promise.all(subscriptions.map(subscription => {

    const {
      extra,
      subscriber_id,
      tier
    } = subscription;

    const amount = tiers[`_${tier}`].rate + extra;

    return createStripeCharge(`cus_${subscriber_id}`, amount, `Per-release charge for channel ${channel_id}`);
  }));
}


function deleteReleaseByChannelID (channel_id, time_created) {

  const params = {
    TableName: process.env.DYNAMODB_TABLE_RELEASES,
    Key: {
      channel_id,
      time_created
    },
  };

  console.log(`[DynamoDB:RELEASES] Deleting release ${channel_id}:${time_created}`);
  return DynamoDB.delete(params).promise();
}
