require("dotenv").config({ path: `${__dirname}/.env` });
const fs = require("fs");
const request = require("request");
const stripe = require("stripe")(process.env.STRIPE_KEY_PRIVATE);
const { DynamoDB } = require("../shared");
const {
  onboarding: {
    handleChannelSignup,
    handleSubscriberSignup
  },
  subscriber: {
    modifySubscription
  },
  channel: {
    updateChannel
  },
  syndicate: {
    createSyndicate
  },
  proposal: {
    createProposal
  },
  release: {
    createRelease
  },
  upload: {
    getUploadURL
  }
} = require("../resolvers");


const TEST_PROFILE_1 = `test_profile_1.jpg`;
const TEST_PROFILE_2 = `test_profile_2.jpg`;
const TEST_PROFILE_3 = `test_profile_3.jpg`;
const TEST_BANNER_1  = `test_banner_1.jpg`;
const TEST_BANNER_2  = `test_banner_2.jpg`;
const TEST_PAYLOAD_1 = `test_payload_1.jpg`;
const TEST_PAYLOAD_2 = `test_payload_2.jpg`;


////////////////////////////////////////////////////
/////////////////////// SEED ///////////////////////
////////////////////////////////////////////////////


async function seed(iteration) {
  
  const channel    = await seedChannel(iteration);
  const subscriber = await seedSubscriber(iteration, channel.channel_id);
  const syndicate  = await seedSyndicate(iteration, channel.channel_id);
  const release    = await seedRelease(iteration, channel.channel_id);
  const proposal   = await seedProposal(iteration, channel.channel_id, syndicate.syndicate_id);

  // CHANNEL UPLOADS
  //
  // Upload profile image.
  //
  await uploadFile(iteration, {
    channel_id: channel.channel_id,
    upload_type: "profileImage",
    filename: TEST_PROFILE_1,
    mime_type: "image/jpeg"
  });
  //
  // Upload payload file.
  //
  await uploadFile(iteration, {
    channel_id: channel.channel_id,
    upload_type: "payloadFile",
    filename: TEST_PAYLOAD_1,
    mime_type: "image/jpeg"
  });

  // RELEASE UPLOADS
  //
  // Upload profile image.
  //
  await uploadFile(iteration, {
    channel_id: channel.channel_id,
    release_id: release.release_id,
    upload_type: "profileImage",
    filename: TEST_PROFILE_3,
    mime_type: "image/jpeg",
  });
  //
  // Upload banner image.
  //
  await uploadFile(iteration, {
    channel_id: channel.channel_id,
    release_id: release.release_id,
    upload_type: "bannerImage",
    filename: TEST_BANNER_1,
    mime_type: "image/jpeg",
  });
  //
  // Upload payload file.
  //
  await uploadFile(iteration, {
    channel_id: channel.channel_id,
    release_id: release.release_id,
    upload_type: "payloadFile",
    filename: TEST_PAYLOAD_2,
    mime_type: "image/jpeg",
  });

  // SYNDICATE UPLOADS
  //
  // Upload profile image.
  //
  await uploadFile(iteration, {
    channel_id: channel.channel_id,
    syndicate_id: syndicate.syndicate_id,
    upload_type: "profileImage",
    filename: TEST_PROFILE_2,
    mime_type: "image/jpeg",
  });
  //
  // Upload payload file.
  //
  await uploadFile(iteration, {
    channel_id: channel.channel_id,
    syndicate_id: syndicate.syndicate_id,
    upload_type: "payloadFile",
    filename: TEST_PAYLOAD_2,
    mime_type: "image/jpeg",
  });

  // PROPOSAL UPLOADS
  //
  // Upload profile image.
  //
  await uploadFile(iteration, {
    channel_id: channel.channel_id,
    syndicate_id: syndicate.syndicate_id,
    proposal_id: proposal.proposal_id,
    upload_type: "profileImage",
    filename: TEST_PROFILE_3,
    mime_type: "image/jpeg",
  });
  //
  // Upload payload file.
  //
  await uploadFile(iteration, {
    channel_id: channel.channel_id,
    syndicate_id: syndicate.syndicate_id,
    proposal_id: proposal.proposal_id,
    upload_type: "payloadFile",
    filename: TEST_PAYLOAD_1,
    mime_type: "image/jpeg",
  });
};


async function seedChannel(iteration) {
  console.log(`Seeding channel (${iteration}) `.padEnd(30, "."));
  var data = {
    token_id: "1",
    email: `channel-${iteration}@foo.com`,
    password: "Umami1408",
    country: "US",
    first_name: "Peter",
    last_name: "Koeppen",
    city: "Fort Wayne",
    line1: "3717 Burrwood Terrace",
    postal_code: "46815",
    state: "Indiana",
    dob: "1993-05-31",
    routing_number: "110000000",
    account_number: "000123456789",
    personal_id_number: "999999999",
  };
  const channel = await handleChannelSignup(null, ({ data }), ({ sourceIp: "127.0.0.1" }));

  data = {
    channel_id: channel.channel_id,
    title: `Killer Channel ${iteration}`,
    slug: `killer-channel-${iteration}`,
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit do.",
    payload_url: "test_payload_1.jpg"
  };
  await updateChannel(null, { data });

  return channel;
}


async function seedSubscriber(iteration, channel_id) {
  console.log(`Seeding subscriber (${iteration}) `.padEnd(30, "."));
  const { id } = await stripe.tokens.create({
    card: {
      "number": "4242424242424242",
      "exp_month": 12,
      "exp_year": 2019,
      "cvc": "123"
    }
  });
  var data = {
    email: `subscriber-${iteration}@foo.com`,
    password: "Umami1408",
    token_id: id
  };
  const subscriber = await handleSubscriberSignup(null, { data });

  data = {
    subscriber_id: subscriber.subscriber_id,
    _channel_id: channel_id,
    subscribe: true
  };

  // Subscribe to channel.

  await modifySubscription(null, { data });

  return subscriber;
}


async function seedSyndicate(iteration, channel_id) {
  console.log(`Seeding syndicate (${iteration}) `.padEnd(30, "."));
  const data = {
    channel_id,
    title: `Killer Syndicate ${iteration}`,
    slug: `killer-syndicate-${iteration}`,
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit do.",
    payload_url: null,
    is_nsfw: false,
    is_unlisted: false,
    subscriber_pays: false,
    subscription_rate: 9999
  };
  const syndicate = await createSyndicate(null, { data });
  return syndicate;
}


async function seedProposal(iteration, channel_id, syndicate_id) {
  console.log(`Seeding proposal (${iteration}) `.padEnd(30, "."));
  const data = {
    channel_id,
    syndicate_id,
    title: "Killer Proposal",
    slug: "killer-proposal",
    description: "_Some other description._",
    is_nsfw: true,
    is_unlisted: true,
    subscriber_pays: true,
    subscription_rate: 999,
    payload_url: "",
    new_profile: true
  };
  const proposal = await createProposal(null, { data });
  return proposal;
}


async function seedRelease(iteration, channel_id) {
  console.log(`Seeding release (${iteration}) `.padEnd(30, "."));
  const data = {
    channel_id,
    title: "Killer Release",
    slug: "killer-release",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit do.",
    payload_url: null
  };
  const release = await createRelease(null, { data });
  return release;
}


async function uploadFile(iteration, params) {
  const {
    channel_id,
    release_id,
    syndicate_id,
    proposal_id,
    upload_type,
    filename,
    mime_type
  } = params;
  const data = {
    channel_id,
    upload_type,
    filename,
    mime_type,
    ...(release_id && { release_id }),
    ...((syndicate_id && proposal_id) && { syndicate_id, proposal_id }),
    ...(syndicate_id && { syndicate_id })
  };
  const url = await getUploadURL(null, { data });
  
  fs.createReadStream(`${__dirname}/${filename}`)
  .pipe(request.put(url, (error, response, body) => {
    if (error || response.statusCode !== 200) {
      throw new Error(error || `${(upload_type+" ("+iteration+") ").padEnd(30, ".")} Upload failed.`);
    } else {
      console.log(`${(upload_type+" ("+iteration+") ").padEnd(30, ".")} Upload successful.`);
    }
  }));
}


module.exports = seed;