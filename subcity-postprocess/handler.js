const AWS = require("aws-sdk");
const sharp = require("sharp");

const S3_BUCKET_IN = new AWS.S3({
	s3ForcePathStyle: true,
	endpoint: process.env.DATA_HOST,
  params: {
  	apiVersion: "2006-03-01",
    Bucket: process.env.S3_BUCKET_IN
  }
});

const S3_BUCKET_OUT = new AWS.S3({
	s3ForcePathStyle: true,
	endpoint: process.env.DATA_HOST,
  params: {
  	apiVersion: "2006-03-01",
    Bucket: process.env.S3_BUCKET_OUT
  }
});


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

	try {

    // Get the new image, determine the aspect ratio, and give it to Sharp.

    const size = /profile/.test(key) ? [600,600] : [1200,502];
		const response = await S3_BUCKET_IN.getObject({ Key: key }).promise();
		const sharpified = await sharp(response.Body)
                            .resize(size[0], size[1])
                            .crop(sharp.strategy.entropy)
                            .sharpen()
                            .toFormat("jpeg")
                            .toBuffer();
    key = key.replace(/\.[a-z0-9]+$/gi, "\.jpeg");

    // Move the sharpified image to the "out" bucket and delete the old image file.

    console.log(`[S3:OUT] PUT ${key}`);
    await S3_BUCKET_OUT.putObject({
      Body: sharpified,
      Key: key,
      ACL: "public-read"
    }).promise();
    console.log(`[S3:IN] DELETE ${key}`);
    await S3_BUCKET_IN.deleteObject({ Key: key }).promise();

    callback(null, { statusCode: 200 });

  } catch(error) {
		console.error(error.message);
    callback(error.message);
	}
}

async function processPayloadFile(key, callback) {

  try {

    // Get any "payload" items in the channel's folder...

    const params = {
      Bucket: process.env.S3_BUCKET_OUT,

      // Remove filename.

      Prefix: key.replace(/\/[^\/]+$/i, "")
    };
    const { Contents: objects } = await S3_BUCKET_OUT.listObjects(params).promise();

    // ...and delete them.

    await Promise.all(objects.map(({ Key }) => {
      console.log(`[S3:OUT] DELETE ${Key}`);
      return S3_BUCKET_OUT.deleteObject({ Key }).promise();
    }));

    // Then move the new "payload" file into place.

    const { Body } = await S3_BUCKET_IN.getObject({ Key: key }).promise();
    console.log(`[S3:OUT] PUT ${key}`);
    await S3_BUCKET_OUT.putObject({ Body, Key: key }).promise();

    // Delete the old file.

    console.log(`[S3:IN] DELETE ${key}`);
    await S3_BUCKET_IN.deleteObject({ Key: key }).promise();

    callback(null, { statusCode: 200 });

  } catch(error) {
    console.error(error.message);
    callback(error.message);
  }
}