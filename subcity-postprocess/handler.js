const AWS   = require("aws-sdk");
const sharp = require("sharp");

AWS.config.update({
  region: "us-east-1"
});

const S3 = new AWS.S3({
  signatureVersion: "v4",
  s3ForcePathStyle: true,
  endpoint: process.env.DATA_HOST
});


/*

TODO:

Add a hook in here that updates the (channel|release|syndicate)'s
payload field in DynamoDB.

*/


////////////////////////////////////////////////////
///////////////////// EXPORTS //////////////////////
////////////////////////////////////////////////////


module.exports.postprocess = (event, context, callback) => {

  for (let i in event.Records) {
    let { key } = event.Records[i].s3.object;

    // Check if the uploaded file is a payload file.

    if (/payload/.test(key)) {
      processPayloadFile(key, callback);
      continue;
    } else {
      processImageFile(key, callback);
    }
  }
};


////////////////////////////////////////////////////
//////////////////// FUNCTIONS /////////////////////
////////////////////////////////////////////////////


async function processImageFile(key, callback) {

  console.log(`[postprocess] Processing image file ${key}`);

  try {

    // Get the new image, determine the aspect ratio, and give it to Sharp.

    const size       = /profile/.test(key) ? [600,600] : [1200,502];
    const { Body }   = await S3.getObject({ Bucket: process.env.S3_BUCKET_IN, Key: key }).promise();
    const sharpified = await sharp(Body)
                            .resize(size[0], size[1])
                            .crop(sharp.strategy.entropy)
                            .sharpen()
                            .toFormat("jpeg")
                            .toBuffer();

    key = key.replace(/\.[a-z0-9]+$/gi, "\.jpeg");

    // Move the sharpified image to the "out" bucket and delete the old image file.

    console.log(`[S3:OUT] PUT ${key}`);
    await S3.putObject({
      Bucket: process.env.S3_BUCKET_OUT,
      Body: sharpified,
      Key: key,
      ACL: "public-read"
    }).promise();

    console.log(`[S3:IN] DELETE ${key}`);
    await S3.deleteObject({
      Bucket: process.env.S3_BUCKET_IN,
      Key: key
    }).promise();

    callback(null, { statusCode: 200 });

  } catch(error) {
    console.error(error.message);
    callback(error.message);
  }
}

async function processPayloadFile(key, callback) {

  console.log(`[postprocess] Processing payload file ${key}`);

  try {

    // Get the payload file folder.

    const prefix = key.replace(/\/[^\/]+$/i, "");
    const acl    = /(releases|proposals)/.test(prefix) ? "private" : "public-read";

    await clearObjects(process.env.S3_BUCKET_OUT, prefix);
    await transferPayload(key, acl);
    await clearObjects(process.env.S3_BUCKET_IN, prefix);

    callback(null, { statusCode: 200 });

  } catch(error) {
    console.error(error);
    callback(error.message);
  }
}


async function transferPayload(Key, ACL) {

  // Move the new payload file into place.

  const { Body } = await S3.getObject({ Bucket: process.env.S3_BUCKET_IN, Key }).promise();

  console.log(`[S3:OUT] PUT ${Key}`);
  return S3.putObject({ Bucket: process.env.S3_BUCKET_OUT, Body, Key, ACL }).promise();
}


async function clearObjects(Bucket, Prefix) {

  // Get objects...

  const { Contents: objects } = await S3.listObjects({ Bucket, Prefix }).promise();

  // ...and delete them.

  return Promise.all(objects.map(({ Key }) => {
    console.log(`[S3:${Bucket}] DELETE ${Key}`);
    return S3.deleteObject({ Bucket, Key }).promise();
  }));
}
