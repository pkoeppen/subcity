const mime = require("mime-types");
const sanitizeFilename = require("sanitize-filename");
const {
  promisify,
  DynamoDB,
  S3
} = require("../../shared");


///////////////////////////////////////////////////


const getUploadURL = (root, args) => {

  const { data } = args;

  if (!data.mime_type.length ||
      !data.upload_type.length ||
      !data.filename.length) {
    throw new Error("Invalid or missing input.");
  }

  // DO NOT change the order of these. The "getProposalUploadKey" function looks
  // for both a "syndicate_id" and "proposal_id" field before falling/failing back
  // to "getSyndicateUploadKey", which only looks for a "syndicate_id" field.

  const key = getReleaseUploadKey(data) ||
              getProposalUploadKey(data) ||
              getSyndicateUploadKey(data) ||
              getChannelUploadKey(data);

  if (!key) { throw new Error("Invalid or missing input."); }

  const params = {
    Bucket: process.env.S3_BUCKET_IN,
    Key: key,
    ContentType: "image/jpeg"
  };

  // This needs to use the "promisify" shim - Doesn't have a promise() method.

  return promisify(callback => S3.getSignedUrl("putObject", params, callback));
};


////////////////////////////////////////////////////


module.exports = {
  getUploadURL
};


////////////////////////////////////////////////////


const allowedImageExtensions = [
  "jpeg",
  "png",
  "tif"
];

const rollback = {

  async deleteRelease(channel_id, release_id) {
    const result = await require("./release").delete({ channel_id, release_id });
    return result;
  },

  async deleteProposal(syndicate_id, proposal_id) {
    const result = await require("./proposal").delete({ syndicate_id, proposal_id });
    return result;
  }
};


function getFilename(mime_type, upload_type, filename) {

  // Disallow long filenames.

  if (filename.length > 200) { return false; }

  if (upload_type === "payloadFile") {

    // Remove spaces and sanitize the filename.

    return sanitizeFilename(filename.replace(/\s/g, "_"));
  } else if (upload_type === "profileImage" || upload_type === "bannerImage") {

    // If it's a profile/banner image upload, build the correct JPG/PNG filename.
    
    const ext = mime.extension(mime_type);
    return (ext && allowedImageExtensions.indexOf(ext) >= 0) ? `${upload_type.replace(/image/gi, "")}.${ext}` : null;
  } else {
    return false;
  }
}

function getReleaseUploadKey({ channel_id, release_id, mime_type, upload_type, filename }) {

  if (!release_id) {
    return false;
  }

  // Sanitizes the filename and asserts that the channel
  // actually possesses the release in question.

  filename = getFilename(mime_type, upload_type, filename);

  if (!channelHasRelease(channel_id, release_id)) {
    throw new Error("No such release.");
  }
  if (!filename) {
    rollback.deleteRelease(channel_id, release_id);
    throw new Error("Invalid or missing input.")
  }

  return (upload_type === "payloadFile"
          ? `channels/${channel_id}/releases/${release_id}/payload/${filename}`
          : `channels/${channel_id}/releases/${release_id}/${filename}`);
}

function getProposalUploadKey({ channel_id, syndicate_id, proposal_id, mime_type, upload_type, filename }) {

  if (!syndicate_id || !proposal_id) {
    return false;
  }

  // Sanitizes the filename and asserts that the syndicate
  // actually possesses both the channel and proposal in question.

  filename = getFilename(mime_type, upload_type, filename);

  if (!syndicateHasChannel(syndicate_id, channel_id) || !syndicateHasProposal(syndicate_id, proposal_id)) {
    throw new Error("No such channel or proposal in syndicate.");
  }
  if (!filename) {
    rollback.deleteProposal(syndicate_id, proposal_id);
    throw new Error("Invalid or missing input.")
  }

  return (upload_type === "payloadFile"
          ? `syndicates/${syndicate_id}/proposals/${proposal_id}/payload/${filename}`
          : `syndicates/${syndicate_id}/proposals/${proposal_id}/${filename}`);
}

function getSyndicateUploadKey({ channel_id, syndicate_id, mime_type, upload_type, filename }) {

  if (!syndicate_id) {
    return false;
  }

  // Sanitizes the filename and asserts that the syndicate
  // actually possesses the channel in question.

  // TODO: Add rollback.

  filename = getFilename(mime_type, upload_type, filename);

  if (!syndicateHasChannel(syndicate_id, channel_id, true)) {
    throw new Error("No such channel in syndicate.");
  }
  if (!filename) {
    throw new Error("Invalid or missing input.")
  }

  return (upload_type === "payloadFile"
          ? `syndicates/${syndicate_id}/payload/${filename}`
          : `syndicates/${syndicate_id}/${filename}`);
}


function getChannelUploadKey({ channel_id, mime_type, upload_type, filename }) {

  // Sanitizes the filename. (No rollback for channels.)

  filename = getFilename(mime_type, upload_type, filename);

  if (!filename) {
    throw new Error("Invalid or missing input.")
  }

  return (upload_type === "payloadFile"
          ? `channels/${channel_id}/payload/${filename}`
          : `channels/${channel_id}/${filename}`);
}


async function channelHasRelease(channel_id, release_id) {
  const params = {
    TableName: process.env.DYNAMODB_TABLE_CHANNELS,
    Key: { channel_id },
  };
  const result = await new Promise((resolve, reject) => {
    DynamoDB.get(params, (error, data) => {
      if (error || !data.Item) {
        resolve(false);
      } else if (data.Item.releases.values.indexOf(release_id < 0)) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
  return result;
}


async function syndicateHasChannel(syndicate_id, channel_id, assertNewSyndicate=false) {

  // If "assertNewSyndicate" is true, REJECT if the syndicate also has more than one
  // member channel. (Brand new syndicates will only ever have one channel.)

  const params = {
    TableName: process.env.DYNAMODB_TABLE_SYNDICATES,
    Key: { syndicate_id },
  };
  const result = await new Promise((resolve, reject) => {
    DynamoDB.get(params, (error, data) => {
      if (error || !data.Item) {
        resolve(false);
      } else if ((assertNewSyndicate && data.Item.channels.length > 1) || 
                 data.Item.channels.values.indexOf(channel_id < 0)) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
  return result;
}


async function syndicateHasProposal(syndicate_id, proposal_id) {
  const params = {
    TableName: process.env.DYNAMODB_TABLE_SYNDICATES,
    Key: { syndicate_id },
  };
  const { Item } = await DynamoDB.get(params).promise();
  return (Item && Item.proposals.values.indexOf(proposal_id > -1));
  
  // const result = await new Promise((resolve, reject) => {
  //   DynamoDB.get(params, (error, data) => {
  //     if (error || !data.Item) {
  //       resolve(false);
  //     } else if (data.Item.proposals.values.indexOf(proposal_id < 0)) {
  //       resolve(false);
  //     } else {
  //       resolve(true);
  //     }
  //   });
  // });
  // return result;
}