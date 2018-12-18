const {
  chunk,
  flatten,
  merge
} = require("lodash");
const {
  promisify,
  generateID,
  DynamoDB,
  S3,
  buildDynamoDBQuery,
  parseMarkdown,
  sanitize
} = require("../../shared");


///////////////////////////////////////////////////
///////////////////// QUERIES /////////////////////
///////////////////////////////////////////////////


const getReleaseById = (root, args) => {

  // TODO: Do I need this?
  return null;
  //

  const { release_id } = args;

  // Get one release by its ID.

  const params = {
    TableName: process.env.DYNAMODB_TABLE_RELEASES,
    Key: { release_id },
  };
  return DynamoDB.get(params).promise()
  .then(({ Item: release }) => {
    if (release) {
      release.description = parseMarkdown(release, true);
      return release;
    } else {
      throw new Error("Release not found.");
    }
  });
};


const getReleaseBySlug = (root, args, ctx, ast) => {

  // _channel_id (with underscore) is the ID of the channel being viewed.

  const {
    channel_id: _channel_id,
    releases
  } = root;

  const {
    slug
  } = args;

  // channel_id (without underscore) is the channel currently logged in.

  const {
    channel_id,
    subscriber_id
  } = ctx;

  var params = {
    TableName: process.env.DYNAMODB_TABLE_RELEASES,
    KeyConditionExpression: "channel_id = :channel_id",
    FilterExpression: "slug = :slug",
    ExpressionAttributeValues: {
      ":channel_id": _channel_id,
      ":slug": slug
    }
  };

  return DynamoDB.query(params).promise()
  .then(async ({ Items: releases }) => {

    const release = releases[0];

    if (!release) {
      throw new Error();
    } else {

      if (subscriber_id) {

        // Check if subscriber has this release in their purchase collection.

        params = {
          TableName: process.env.DYNAMODB_TABLE_PURCHASES,
          KeyConditionExpression: "subscriber_id = :subscriber_id",
          FilterExpression: "channel_id = :channel_id",
          ExpressionAttributeValues: {
            ":subscriber_id": subscriber_id,
            ":channel_id": _channel_id
          }
        };

        const { Items: purchases } = await DynamoDB.query(params).promise()
        
        for (let i = 0; i < purchases.length; i++) {

          let purchase = purchases[i];
          let params = {
            Key: `channels/${_channel_id}/releases/${release.release_id}/payload/${release.payload_url}`,
            Bucket: process.env.S3_BUCKET_OUT,
            Expires: 3600
          };

          if (purchase.release_id === release.release_id) {
            
            // Purchased on its own.

            release.download_url = await promisify(callback => S3.getSignedUrl("getObject", params, callback));
            break;
          } else if (purchase.start_time < release.created_at && release.created_at < purchase.end_time) {
            
            // Purchased as part of a subscription.

            release.download_url = await promisify(callback => S3.getSignedUrl("getObject", params, callback));
            break;
          }
        }
      }

      else if (channel_id && channel_id === _channel_id) {

        // Check if the channel logged in is also the channel being viewed.

        release.download_url = "https://google.com/";
      }

      // Deserialize the release description.

      release.description = parseMarkdown(release.description);
      return release;
    }
  })
  .catch(error => {
    console.error(error);
    throw new Error("Error fetching release.");
  });
};


const getReleasesByChannelId = channel_id => {

  // TODO: Do I need this?
  return null;
  //

  const params = {
    TableName: process.env.DYNAMODB_TABLE_RELEASES,
    KeyConditionExpression : "channel_id = :channel_id",
    ExpressionAttributeValues : { ":channel_id" : channel_id }
  };
  return DynamoDB.query(params).promise()
  .then(({ Items }) => (Items || []));
};


const getReleasesByIdArray = (root, args) => {

  const {
    channel_id,
    releases
  } = root;

  // Get multiple releases by an array of IDs.

  if (!releases || !releases.length) { return []; }

  const chunked = chunk(releases, 100).map(chunk => {
    const params = {
      RequestItems: {
        [process.env.DYNAMODB_TABLE_RELEASES]: {
          Keys: chunk.map(release_id => ({ release_id, channel_id }))
        }
      }
    };
    return DynamoDB.batchGet(params).promise();
  });

  return Promise.all(chunked).then(results => {
    return flatten(results.map(({ Responses }) => Responses[process.env.DYNAMODB_TABLE_RELEASES]))
    .map(release => {
      release.description = parseMarkdown(release.description, true);
      return release;
    });
  });
}


///////////////////////////////////////////////////
//////////////////// MUTATIONS ////////////////////
///////////////////////////////////////////////////


const createRelease = (root, args) => {

  const data = sanitize(args.data);

  // Create a new release.

  const { channel_id } = data;
  const release_id = generateID();
  const release = merge(data, {
    release_id: release_id,
    created_at: new Date().getTime(),
    profile_url: `${process.env.DATA_HOST}/${process.env.S3_BUCKET_OUT}/channels/${data.channel_id}/releases/${release_id}/profile.jpeg`,
    banner_url: `${process.env.DATA_HOST}/${process.env.S3_BUCKET_OUT}/channels/${data.channel_id}/releases/${release_id}/banner.jpeg`,
    likes: 0,
    dislikes: 0
  });

  // Create the release in DynamoDB...

  const a = DynamoDB.put({
    TableName: process.env.DYNAMODB_TABLE_RELEASES,
    Item: release
  }).promise();

  // ...and append "release_id" to its parent channel.

  const b = DynamoDB.update({
    TableName: process.env.DYNAMODB_TABLE_CHANNELS,
    Key: { channel_id },
    UpdateExpression: `ADD releases :release_id`,
    ExpressionAttributeValues: { ":release_id": DynamoDB.createSet([release.release_id]) }
  }).promise();

  return Promise.all([a,b]).then(values => release);
};


const updateRelease = (root, args) => {

  const data = sanitize(args.data);
  const { release_id, channel_id } = data;
  const { expressionAttributeValues, updateExpression } = buildDynamoDBQuery(data);

  const params = {
    TableName: process.env.DYNAMODB_TABLE_RELEASES,
    Key: { channel_id, release_id },
    UpdateExpression: `SET ${updateExpression}`,
    ExpressionAttributeValues: expressionAttributeValues,
    ConditionExpression: "attribute_exists(release_id)" // Avoid accidental creation.
  };

  return DynamoDB.update(params).promise()
  .then(() => ({ release_id }));
};


const deleteRelease = (root, args) => {

  const { data } = args;

  // TODO: Remove from channel also
  
  const { channel_id, release_id } = data;
  const params = {
    TableName: process.env.DYNAMODB_TABLE_RELEASES,
    Key: { channel_id, release_id },
  };

  return DynamoDB.delete(params).then(() => ({ release_id }));
};


////////////////////////////////////////////////////
///////////////////// EXPORTS //////////////////////
////////////////////////////////////////////////////


module.exports = {
  getReleaseById,
  getReleaseBySlug,
  getReleasesByChannelId,
  getReleasesByIdArray,
  createRelease,
  updateRelease,
  deleteRelease
};