const mime = require("mime-types");
const sanitizeFilename = require("sanitize-filename");
const {
  DynamoDB,
  promisify,
  S3
} = require("../../shared");


module.exports = {
  getUploadURL
};


async function getUploadURL (channel_id, data) {

  const {
    time_created,
    syndicate_id
  } = data;

  var Key, ContentType;

  if (time_created && syndicate_id) {
    Key = await getProposalUploadKey({ channel_id, ...data });

  } else if (time_created && !syndicate_id) {
    Key = await getReleaseUploadKey({ channel_id, ...data });

  } else if (!time_created && syndicate_id) {
    Key = await getSyndicateUploadKey({ channel_id, ...data });
    
  } else {
    Key = await getChannelUploadKey({ channel_id, ...data });
  }

  const params = {
    Bucket: process.env.S3_BUCKET_IN,
    Key,
    // ContentType: "image/jpeg"
  };

  // This needs to use the "promisify" shim.

  return promisify(callback => S3.getSignedUrl("putObject", params, callback));
};


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


function getFilename(filename, mime_type, upload_type) {

  // Disallow long filenames.

  if (filename.length > 200) {
    throw new Error("! Filename cannot be more than 200 characters long.");
  }

  if (upload_type === "payloadFile") {

    // Remove spaces and sanitize the filename.

    return sanitizeFilename(filename.replace(/\s/g, "_"));

  } else if (upload_type === "profileImage" || upload_type === "bannerImage") {

    // If it's a profile/banner image upload, build the correct JPG/PNG filename.
    
    const ext = mime.extension(mime_type);

    if (!ext || allowedImageExtensions.indexOf(ext) < 0) {
      throw new Error("! Invalid mime type.");
    }

    return `${upload_type.replace(/image/gi, "")}.${ext}`;

  } else {
    throw new Error("! Invalid input.");
  }
}


async function getReleaseUploadKey({ channel_id, time_created, mime_type, upload_type, filename }) {

  filename = getFilename(filename, mime_type, upload_type);

  const checks = [
    channelHasRelease(channel_id, time_created)
  ];

  try {
    await Promise.all(checks);
    return (upload_type === "payloadFile"
          ? `channels/${channel_id}/releases/${time_created}/payload/${filename}`
          : `channels/${channel_id}/releases/${time_created}/${filename}`);
  } catch(error) {
    throw error;
  }
}


async function getProposalUploadKey({ channel_id, syndicate_id, time_created, mime_type, upload_type, filename }) {

  filename = getFilename(filename, mime_type, upload_type);

  const checks = [
    syndicateHasChannel(syndicate_id, channel_id),
    syndicateHasProposal(syndicate_id, time_created)
  ];

  try {
    await Promise.all(checks);
    return (upload_type === "payloadFile"
          ? `syndicates/${syndicate_id}/proposals/${proposal_id}/payload/${filename}`
          : `syndicates/${syndicate_id}/proposals/${proposal_id}/${filename}`);
  } catch(error) {
    throw error;
  }
}


async function getSyndicateUploadKey({ channel_id, syndicate_id, mime_type, upload_type, filename }) {

  filename = getFilename(filename, mime_type, upload_type);

  await Promise.all([
    syndicateHasChannel(syndicate_id, channel_id, true),
  ]);

  return (upload_type === "payloadFile"
          ? `syndicates/${syndicate_id}/payload/${filename}`
          : `syndicates/${syndicate_id}/${filename}`);
}


async function getChannelUploadKey({ channel_id, mime_type, upload_type, filename }) {

  // Sanitizes the filename. (No rollback for channels.)

  filename = getFilename(filename, mime_type, upload_type);

  return (upload_type === "payloadFile"
          ? `channels/${channel_id}/payload/${filename}`
          : `channels/${channel_id}/${filename}`);
}


async function channelHasRelease(channel_id, time_created) {

  const params = {
    TableName: process.env.DYNAMODB_TABLE_RELEASES,
    KeyConditionExpression: "channel_id = :channel_id AND time_created = :time_created",
    ExpressionAttributeValues: {
      ":channel_id": channel_id,
      ":time_created": time_created
    }
  };

  const {
    Items: releases
  } = await DynamoDB.query(params).promise();

  if (releases.length !== 1) {
    throw new Error("! No such release.");
  }
}


async function syndicateHasChannel(syndicate_id, channel_id, assertSoleMember=false) {

  const params = {
    TableName: process.env.DYNAMODB_TABLE_MEMBERSHIPS,
    IndexName: `${process.env.DYNAMODB_TABLE_MEMBERSHIPS}-GSI`,
    KeyConditionExpression: "syndicate_id = :syndicate_id",
    ExpressionAttributeValues: {
      ":syndicate_id": syndicate_id
    }
  };

  const {
    Items: memberships
  } = await DynamoDB.query(params).promise();

  if (assertSoleMember) {

    if (memberships.length !== 1 || memberships[0].channel_id !== channel_id) {
      throw new Error("! No such member channel or not sole member.");
    }

  } else {

    const channels = memberships.map(({ channel_id }) => channel_id);
    if (channels.indexOf(channel_id) < 0) {
      throw new Error("! No such member channel.");
    }
  }
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