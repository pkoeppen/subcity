const AWS = require("aws-sdk");
AWS.config.update({
	region: "us-east-1"
});


const DynamoDB = new AWS.DynamoDB.DocumentClient();

const S3 = new AWS.S3({
  apiVersion: "2006-03-01",
  signatureVersion: "v4",
  s3ForcePathStyle: true,
  endpoint: process.env.DATA_HOST
});


module.exports = {
  clearS3ByPrefix,
  DynamoDB,
  moveKey,
  queryAll,
  S3
};


function clearS3ByPrefix(prefix) {

  // Clears keys from both S3 buckets.

  const _0 = new Promise(async (resolve, reject) => {

    let objects = [];
    let has_more = true;

    while (has_more) {

      const {
        Contents,
        IsTruncated
      } = await S3.listObjects({
        Bucket: process.env.S3_BUCKET_IN,
        Prefix: prefix
      }).promise();

      objects = objects.concat(Contents);
      has_more = IsTruncated;
    }

    Promise.all(objects.map(({ Key }) => {

      console.log(`[S3:IN] Deleting ${Key}`);
      return S3.deleteObject({
        Bucket: process.env.S3_BUCKET_IN,
        Key
      }).promise();

    })).then(resolve);
  });

  const _1 = new Promise(async (resolve, reject) => {

    let objects = [];
    let has_more = true;

    while (has_more) {

      const {
        Contents,
        IsTruncated
      } = await S3.listObjects({
        Bucket: process.env.S3_BUCKET_OUT,
        Prefix: prefix
      }).promise();

      objects = objects.concat(Contents);
      has_more = IsTruncated;
    }

    Promise.all(objects.map(({ Key }) => {

      console.log(`[S3:OUT] Deleting ${Key}`);
      return S3.deleteObject({
        Bucket: process.env.S3_BUCKET_OUT,
        Key
      }).promise();

    })).then(resolve);
  });

  return Promise.all([_0,_1]);
}


async function moveKey (from, to) {

  try {

    const { Body } = await S3.getObject({ Bucket: process.env.S3_BUCKET_OUT, Key: from }).promise()

    // Move into IN bucket so that the postprocess function will
    // automatically transfer and delete any existing files.

    return await S3.putObject({ Body, Bucket: process.env.S3_BUCKET_IN, Key: to }).promise()

  } catch (error) {
    console.error(`[moveKey] ${error.message || error}`);
  }
}


async function queryAll (params) {

  var items = [];
  var has_more = true;

  while (has_more) {

    var {
      Items: buffer,
      LastEvaluatedKey
    } = await DynamoDB.query(params).promise();

    items = items.concat(buffer);

    if (LastEvaluatedKey) {
      params.ExclusiveStartKey = LastEvaluatedKey;
    } else {
      has_more = false;
    }
  }

  return items;
}
