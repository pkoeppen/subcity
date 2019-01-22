const chunk = require("lodash/chunk");
const sortBy = require("lodash/sortBy");
const {
  buildQuery,
  clearS3ByPrefix,
  createAuth0User,
  createStripeAccount,
  createStripeAccountObject,
  createStripePlan,
  deleteStripePlan,
  deleteStripeSubscription,
  deactivateSubscriptionsByProductID,
  deleteAuth0User,
  deleteStripeAccount,
  deleteStripeProduct,
  DynamoDB,
  findAuth0UsersByEmail,
  generateID,
  getDefaultCurrency,
  parseDate,
  purgeByProductID,
  queryAll,
  reactivateSubscriptionsByProductID,
  SES,
  sanitize,
  scanAll,
  updateAuth0Email,
  updateAuth0Password,
  updateStripeAccount
} = require("../shared");
const {
  getChannelByID,
} = require("./queries");


module.exports = {
  answerInvitation,
  deleteChannel,
  initializeChannel,
  sendEmailInvite,
  updateChannel,
  updateChannelEmail,
  updateChannelPassword,
  updatePayoutSettings,
  writeChannelUpdates
};


////////////////////////////////////////////////////////////
//////////////////////// FUNCTIONS /////////////////////////
////////////////////////////////////////////////////////////


async function answerInvitation (channel_id, syndicate_id, decision) {

  const {
    Item: invitation
  } = await DynamoDB.get({
    TableName: process.env.DYNAMODB_TABLE_INVITATIONS,
    Key: {
      channel_id,
      syndicate_id
    }
  }).promise();

  const tasks = [];

  if (invitation) {

    if (decision === true) {
      tasks.push(addChannelToSyndicate(channel_id, syndicate_id));
      tasks.push(deleteInvitation(channel_id, syndicate_id));
    }

    if (decision === false) {
      tasks.push(deleteInvitation(channel_id, syndicate_id));
    }

  } else {
    
    throw new Error("![400] No such invitation.");
  }

  return Promise.all(tasks)
  .then(() => decision);
}


function updateChannelEmail (channel_id, email, password, new_email) {

  // Resolves a client token with which to update Vuex store.

  return updateAuth0Email(`auth0|acct_${channel_id}`, email, password, new_email)
  .then(() => true);
}


function updateChannelPassword (channel_id, data) {

  return updateAuth0Password(`auth0|acct_${channel_id}`, data)
  .then(() => true);
}


function deleteChannel (channel_id) {

  if (!channel_id) { return; }

  const tasks = [

    // Stripe

    purgeByProductID(`prod_channel_${channel_id}`),
    deleteStripeAccount(`acct_${channel_id}`),

    // Auth0

    deleteAuth0User(`auth0|acct_${channel_id}`),

    // DynamoDB

    deleteProposalsByChannelID(channel_id),
    deleteMembershipsByChannelID(channel_id),
    deleteSlugsByChannelID(channel_id),
    deleteSubscriptionsByChannelID(channel_id),
    deleteChannelByChannelID(channel_id),

    // S3

    clearS3ByPrefix(`channels/${channel_id}`)
  ];

  return Promise.all(tasks)
  .then(() => true);
}


async function initializeChannel (data) {

  if (!await assertOfferValid(data.offer_id)) {
    throw new Error("![400] Signup offer invalid.");
  }

  var channel_id;

  try {

    const stripeAccountObject = await createStripeAccountObject(data);
    const { id: stripe_id }   = await createStripeAccount(stripeAccountObject);
    channel_id                = stripe_id.replace(/^acct_/g, "");

    const plan = {
      billing_scheme: "tiered",
      interval: "month",
      product: {
        id:   `prod_channel_${channel_id}`,
        name: `prod_channel_${channel_id}`
      },
      currency: "usd",
      tiers: [
        {
          flat_amount: 499,
          up_to: 1
        },
        {
          flat_amount: 499,
          up_to: 2
        },
        {
          flat_amount: 499,
          up_to: "inf"
        },
      ],
      tiers_mode: "volume"
    };

    const [
      { id: plan_id }
    ] = await Promise.all([
      createStripePlan(plan),
      createAuth0User(Object.assign({ user_id: stripe_id, role: "channel" }, data))
    ]);

    // Create the channel and delete the signup offer.

    const seed = {
      channel_id,
      plan_id,
      slug: channel_id
    };
    
    await Promise.all([
      createChannel(seed),
      createSlugByChannelID(channel_id, channel_id),
      deleteSignupOffer(data.offer_id)
    ]);

    return { channel_id };

  } catch (error) {

    // Rollback.

    deleteChannel(channel_id);
    throw error;
  }
}


async function sendEmailInvite (channel_id, email) {

  const {
    invites
  } = await getChannelByID(channel_id);

  if (invites.length > 5) {
    throw new Error("![400] Invite limit exceeded.");
  }

  // Check that email does not belong to an existing user.

  const users = await findAuth0UsersByEmail(email.toLowerCase());

  if (users.length) {
    throw new Error("![400] Email is already a member.");
  }

  // Create offer in database.

  const offer_id = generateID();

  await DynamoDB.put({
    TableName: process.env.DYNAMODB_TABLE_OFFERS,
    Item: {
      email,
      offer_id,
    },
  }).promise();

  // Send invitation email.

  const html = `
    <img src="https://s3.amazonaws.com/subcity-static/logo_alpha.svg" width="150"/>
    <h1>You're in.</h1>
    <a href="https://sub.city/initialize/${offer_id}">Click here</a> to initialize your channel.
  `;

  const text = `
    You're in.\n\n
    Navigate to the following link to initialize your channel.\n
    https://sub.city/initialize/${offer_id}
  `;

  const params = {
    Destination: {
      ToAddresses: [
        email
      ]
    },
    Message: {
      Body: {
        Html: {
         Charset: "UTF-8",
         Data: html
        },
        Text: {
         Charset: "UTF-8",
         Data: text
        }
       },
       Subject: {
        Charset: 'UTF-8',
        Data: 'Test email'
       }
      },
    Source: 'noreply@sub.city',
  };

  await SES.sendEmail(params).promise();

  console.log(`[DynamoDB:CHANNELS] Writing invited email to ${channel_id}`);
  return DynamoDB.update({
    TableName: process.env.DYNAMODB_TABLE_CHANNELS,
    Key: { channel_id },
    UpdateExpression: "SET invites = list_append(invites, :email)",
    ExpressionAttributeValues: {
      ":email": [email]
    }
  })
  .promise()
  .then(() => true);
}


function updateChannel (channel_id, _data) {

  const {
    slug,
    tiers,
    ...data
  } = sanitize(_data);
  
  data.time_updated = Date.now();

  const tasks = [];

  if (slug) {
    tasks.push(handleChannelSlugAssignment(channel_id, slug));
  }

  if (tiers) {
    tasks.push(handleChannelTiersUpdate(channel_id, tiers));
  }

  if (data.funding) {
    tasks.push(handleFundingUpdate(channel_id, data.funding));
  }

  tasks.push(writeChannelUpdates(channel_id, data));

  return Promise.all(tasks)
  .then(() => ({ channel_id }));
};


async function updatePayoutSettings (channel_id, data) {

  const {
    account_number,
    city,
    country,
    dob,
    first_name,
    last_name,
    line1,
    //payout_anchor, TODO
    //payout_interval, TODO
    personal_id_number,
    postal_code,
    routing_number,
    state
  } = data;

  // If a new account number is provided, build the external_account object.

  let external_account;
  if (account_number) {
    external_account = {
      object: "bank_account",
      country,
      currency: await getDefaultCurrency(country),
      account_number,
      ...(!!routing_number && { routing_number })
    };
  }

  // Always build the legal_entity object.

  const { year, month, day } = parseDate(dob);
  const legal_entity = {
    first_name: first_name,
    last_name: last_name,
    address: {
      city,
      line1,
      postal_code,
      state
    },
    dob: {
      day,
      month,
      year
    },
    type: "individual",

    // If a new personal ID number is provided, include the following fields.

    ...(!!personal_id_number && { personal_id_number }),
    ...(!!personal_id_number && country === "US" && { ssn_last_4: personal_id_number.slice(-4) })
  };

  // Build the final Stripe account object.

  const stripeAccountObject = {
    legal_entity,
    ...(!!external_account && { external_account }),
  };

  // Update the account.

  return updateStripeAccount(`acct_${channel_id}`, stripeAccountObject)
  .then(account => true);
};


function writeChannelUpdates (channel_id, updates) {

  // Writes channel updates to DynamoDB.

  const { ExpressionAttributeValues, UpdateExpression } = buildQuery(updates);

  console.log(`[DynamoDB:CHANNELS] Updating channel ${channel_id}`);
  return DynamoDB.update({
    TableName: process.env.DYNAMODB_TABLE_CHANNELS,
    Key: { channel_id },
    UpdateExpression,
    ExpressionAttributeValues
  }).promise();
}


////////////////////////////////////////////////////////////
///////////////////////// HELPERS //////////////////////////
////////////////////////////////////////////////////////////


function addChannelToSyndicate (channel_id, syndicate_id) {

  // Add channel membership.

  const _0 = createMembership(channel_id, syndicate_id);

  // Delete channel subscription if subscriber is already
  // subscribed to the syndicate the channel is joining.

  const _1 = DynamoDB.query({
    TableName: process.env.DYNAMODB_TABLE_SUBSCRIPTIONS,
    IndexName: `${process.env.DYNAMODB_TABLE_SUBSCRIPTIONS}-GSI-1`,
    KeyConditionExpression: "channel_id = :channel_id",
    ExpressionAttributeValues: { ":channel_id": channel_id }
  }).promise()

  .then(({ Items: subs_channel }) => {

    return Promise.all(subs_channel.map(async subscription => {

      const {
        subscriber_id,
        subscription_id
      } = subscription;

      // Check if subscribed to parent syndicate.

      const subscribed = await DynamoDB.query({
        TableName: process.env.DYNAMODB_TABLE_SUBSCRIPTIONS,
        IndexName: `${process.env.DYNAMODB_TABLE_SUBSCRIPTIONS}-GSI-2`,
        KeyConditionExpression: "subscriber_id = :subscriber_id AND syndicate_id = :syndicate_id",
        ExpressionAttributeValues: {
          ":subscriber_id": subscriber_id,
          ":syndicate_id": syndicate_id
        }
      }).promise()
      .then(({ Items: subs_syndicate }) => (subs_syndicate.length > 0));

      if (subscribed) {

        // Delete channel subscription from both Stripe and DynamoDB.

        return deleteSubscription(subscriber_id, subscription_id);
      }
    }));
  });

  return Promise.all([_0,_1]);
}


function assertSlugAvailable (slug) {

  const params = {
    TableName: process.env.DYNAMODB_TABLE_SLUGS,
    Key: { slug }
  };

  return DynamoDB.get(params).promise()
  .then(({ Item: slug }) => !slug);
}


function assertOfferValid (offer_id) {

  // Assert signup offer is valid.
  
  return getSignupOffer(offer_id)
  .then(offer => !!offer);
}


function createChannel (seed) {

  const channel = Object.assign({
    description: {
      raw: null,
      rendered: null
    },
    funding: "per_month",
    invites: [],
    links: {
      _1: {
        title: null,
        url: null
      },
      _2: {
        title: null,
        url: null
      },
      _3: {
        title: null,
        url: null
      }
    },
    payload: null,
    tiers: {
      _1: {
        active: true,
        title: null,
        description: {
          raw: null,
          rendered: null
        },
        rate: 499
      },
      _2: {
        active: false,
        title: null,
        description: {
          raw: null,
          rendered: null
        },
        rate: 499
      },
      _3: {
        active: false,
        title: null,
        description: {
          raw: null,
          rendered: null
        },
        rate: 499
      }
    },
    time_created: Date.now(),
    time_updated: 0,
    title: null,
    unlisted: false
  }, seed);

  console.log(`[DynamoDB:CHANNELS] Creating new channel ${seed.channel_id}`);
  return DynamoDB.put({
    TableName: process.env.DYNAMODB_TABLE_CHANNELS,
    Item: channel
  }).promise();
}


function createMembership (channel_id, syndicate_id) {

  const membership = {
    channel_id,
    syndicate_id,
    time_created: Date.now()
  };

  console.log(`[DynamoDB:MEMBERSHIPS] Creating membership ${syndicate_id}:${channel_id}`);
  return DynamoDB.put({
    TableName: process.env.DYNAMODB_TABLE_MEMBERSHIPS,
    Item: membership
  }).promise();
}


function createSlugByChannelID (channel_id, slug) {

  const params = {
    TableName: process.env.DYNAMODB_TABLE_SLUGS,
    Item: {
      channel_id,
      slug
    }
  };

  console.log(`[DynamoDB:SLUGS] Creating slug ${slug}`);
  return DynamoDB.put(params).promise();
}


function deleteChannelByChannelID (channel_id) {

  const params = {
    TableName: process.env.DYNAMODB_TABLE_CHANNELS,
    Key: { channel_id },
  };

  console.log(`[DynamoDB:CHANNELS] Deleting channel ${channel_id}`);
  return DynamoDB.delete(params).promise();
}


function deleteInvitation (channel_id, syndicate_id) {

  const params = {
    TableName: process.env.DYNAMODB_TABLE_INVITATIONS,
    Key: {
      channel_id,
      syndicate_id
    },
  };

  console.log(`[DynamoDB:INVITATIONS] Deleting invitation ${channel_id}:${syndicate_id}`);
  return DynamoDB.delete(params).promise();
}


async function deleteMembershipsByChannelID (channel_id) {

  const params = {
    TableName: process.env.DYNAMODB_TABLE_MEMBERSHIPS,
    KeyConditionExpression: "channel_id = :channel_id",
    ExpressionAttributeValues: {
      ":channel_id": channel_id
    }
  };

  const memberships = await queryAll(params);

  console.log(`[DynamoDB:MEMBERSHIPS] Deleting all memberships for channel ${channel_id}`);
  const chunked = chunk(memberships, 25).map(chunk => {
    const requests = chunk.map(({ syndicate_id }) => ({
      DeleteRequest: {
        Key: {
          channel_id,
          syndicate_id
        }
      }
    }));
    const params = {
      RequestItems: {
        [process.env.DYNAMODB_TABLE_MEMBERSHIPS]: requests
      }
    };
    return DynamoDB.batchWrite(params).promise();
  });

  return Promise.all(chunked);
}


async function deleteProposalsByChannelID (channel_id) {

  const params = {
    TableName: process.env.DYNAMODB_TABLE_PROPOSALS
  };

  const proposals = (await scanAll(params)).filter(proposal => {

    const {
      channel_id: _channel_id
    } = proposal;

    return (_channel_id === channel_id);
  });

  console.log(`[DynamoDB:PROPOSALS] Deleting all proposals referencing channel ${channel_id}`);
  const chunked = chunk(proposals, 25).map(chunk => {
    const requests = chunk.map(({ syndicate_id, time_created }) => ({
      DeleteRequest: {
        Key: {
          syndicate_id,
          time_created
        }
      }
    }));
    const params = {
      RequestItems: {
        [process.env.DYNAMODB_TABLE_PROPOSALS]: requests
      }
    };
    return DynamoDB.batchWrite(params).promise();
  });

  return Promise.all(chunked);
}


function deleteSignupOffer (offer_id) {

  const params = {
    TableName: process.env.DYNAMODB_TABLE_OFFERS,
    Key: { offer_id },
  };

  console.log(`[DynamoDB:OFFERS] Deleting offer ${offer_id}`);
  return DynamoDB.delete(params).promise();
};


function deleteSlug (slug) {

  const params = {
    TableName: process.env.DYNAMODB_TABLE_SLUGS,
    Key: { slug }
  };

  console.log(`[DynamoDB:SLUGS] Deleting slug ${slug}`);
  return DynamoDB.delete(params).promise();
}


async function deleteSlugsByChannelID (channel_id) {

  const params = {
    TableName: process.env.DYNAMODB_TABLE_SLUGS,
    IndexName: `${process.env.DYNAMODB_TABLE_SLUGS}-GSI-1`,
    KeyConditionExpression: "channel_id = :channel_id",
    ExpressionAttributeValues: {
      ":channel_id": channel_id
    }
  };

  const slugs = await queryAll(params);

  console.log(`[DynamoDB:SLUGS] Deleting all slugs for channel ${channel_id}`);
  const chunked = chunk(slugs, 25).map(chunk => {
    const requests = chunk.map(({ slug }) => ({
      DeleteRequest: {
        Key: {
          slug
        }
      }
    }));
    const params = {
      RequestItems: {
        [process.env.DYNAMODB_TABLE_SLUGS]: requests
      }
    };
    return DynamoDB.batchWrite(params).promise();
  });

  return Promise.all(chunked);
}


function deleteSubscription (subscriber_id, subscription_id) {

  console.log(`[DynamoDB:SUBSCRIPTIONS] Deleting subscription ${subscription_id}`);
  const _0 = DynamoDB.delete({
    TableName: process.env.DYNAMODB_TABLE_SUBSCRIPTIONS,
    Key: {
      subscriber_id,
      subscription_id
    }
  }).promise();

  const _1 = deleteStripeSubscription(`sub_${subscription_id}`);

  return Promise.all([_0,_1]);
}


async function deleteSubscriptionsByChannelID (channel_id) {

  const params = {
    TableName: process.env.DYNAMODB_TABLE_SUBSCRIPTIONS,
    IndexName: `${process.env.DYNAMODB_TABLE_SUBSCRIPTIONS}-GSI-1`,
    KeyConditionExpression: "channel_id = :channel_id",
    ExpressionAttributeValues: {
      ":channel_id": channel_id
    }
  };

  const subscriptions = await queryAll(params);

  console.log(`[DynamoDB:SUBSCRIPTIONS] Deleting all subscriptions for channel ${channel_id}`);
  const chunked = chunk(subscriptions, 25).map(chunk => {
    const requests = chunk.map(({ subscriber_id, subscription_id }) => ({
      DeleteRequest: {
        Key: {
          subscriber_id,
          subscription_id
        }
      }
    }));
    const params = {
      RequestItems: {
        [process.env.DYNAMODB_TABLE_SUBSCRIPTIONS]: requests
      }
    };
    return DynamoDB.batchWrite(params).promise();
  });

  return Promise.all(chunked);
}


function getSignupOffer (offer_id) {

  const params = {
    TableName: process.env.DYNAMODB_TABLE_OFFERS,
    Key: { offer_id },
  };

  return DynamoDB.get(params)
  .promise().then(({ Item: offer }) => offer);
};


function getSlugByChannelID (channel_id) {

  const params = {
    TableName: process.env.DYNAMODB_TABLE_SLUGS,
    IndexName: `${process.env.DYNAMODB_TABLE_SLUGS}-GSI-1`,
    KeyConditionExpression: "channel_id = :channel_id",
    ExpressionAttributeValues: {
        ":channel_id": channel_id
    }
  };

  return DynamoDB.query(params)
  .promise().then(({ Items: slugs }) => {

    if (slugs.length) {
      return slugs[0];
    }
  });
};


async function handleChannelSlugAssignment (channel_id, slug) {

  const reserved = [
    'channels',
    'error',
    'portal',
    'settings',
    'site',
    'syndicates',
  ];

  if (reserved.indexOf(slug) >= 0) {
    throw new Error(`![403] Slug cannot be reserved word "${slug}".`);
  }

  if (await assertSlugAvailable(slug)) {

    const old_slug = await getSlugByChannelID(channel_id);
    const tasks = [
      createSlugByChannelID(channel_id, slug),
      writeChannelUpdates(channel_id, { slug })
    ];

    if (old_slug) {
      tasks.push(deleteSlug(old_slug.slug));
    }

    return Promise.all(tasks);

  } else {
    throw new Error("![400] Slug unavailable.");
  }
}


async function handleChannelTiersUpdate (channel_id, new_tiers) {

  const {
    Item: {
      plan_id: old_plan_id,
      tiers: old_tiers
    }
  } = await DynamoDB.get({
    TableName: process.env.DYNAMODB_TABLE_CHANNELS,
    Key: { channel_id }
  }).promise();

  // Curate fields.

  console.log("new_tiers")
  console.log(JSON.stringify(new_tiers, null, 2))

  new_tiers._1 = new_tiers._1 || {};
  new_tiers._1.active = true;
  new_tiers._1.title = new_tiers._1.title || old_tiers._1.title;
  new_tiers._1.description = new_tiers._1.description || old_tiers._1.description;
  new_tiers._1.rate = new_tiers._1.rate || old_tiers._1.rate;

  new_tiers._2 = new_tiers._2 || {};
  new_tiers._2.active = new_tiers._2.active === undefined ? old_tiers._2.active : new_tiers._2.active;
  new_tiers._2.title = new_tiers._2.title || old_tiers._2.title;
  new_tiers._2.description = new_tiers._2.description || old_tiers._2.description;
  new_tiers._2.rate = new_tiers._2.rate || old_tiers._2.rate;

  new_tiers._3 = new_tiers._3 || {};
  new_tiers._3.active = new_tiers._3.active === undefined ? old_tiers._2.active : new_tiers._3.active;
  new_tiers._3.title = new_tiers._3.title || old_tiers._3.title;
  new_tiers._3.description = new_tiers._3.description || old_tiers._3.description;
  new_tiers._3.rate = new_tiers._3.rate || old_tiers._3.rate;

  // Check if a rate change is actually happening. Do not make any
  // calls to Stripe if none of the tiers' rates are being updated.

  if (new_tiers._1.rate === old_tiers._1.rate &&
      new_tiers._2.rate === old_tiers._2.rate &&
      new_tiers._3.rate === old_tiers._3.rate) {

    return writeChannelTiersUpdate(channel_id, new_tiers);
  }

  const tiers = [
    {
      up_to: "1",
      flat_amount: (new_tiers._1 || {}).rate || old_tiers._1.rate || 499
    },
    {
      up_to: "2",
      flat_amount: (new_tiers._2 || {}).rate || old_tiers._2.rate || 499
    },
    {
      up_to: "inf",
      flat_amount: (new_tiers._3 || {}).rate || old_tiers._3.rate || 499
    },
  ];

  const plan = {
    billing_scheme: "tiered",
    currency: "usd",
    interval: "month",
    product: `prod_channel_${channel_id}`,
    tiers,
    tiers_mode: "volume"
  };

  // Update Stripe tiers.

  const [
    { id: new_plan_id }
  ] = await Promise.all([
    createStripePlan(plan),
    deleteStripePlan(old_plan_id).catch(error => {
      console.warn(`[Stripe] ${error}`);
    })
  ]);

  // Write rate changes to DynamoDB.

  return writeChannelTiersUpdate(channel_id, new_tiers, new_plan_id);
}


function handleFundingUpdate (channel_id, funding) {

  switch (funding) {

    case "per_month":
      return reactivateSubscriptionsByProductID(`prod_${channel_id}`);

    case "per_release":
      return deactivateSubscriptionsByProductID(`prod_${channel_id}`);

    default:
      throw new Error("![400] Invalid funding input.");
  }
}


function writeChannelTiersUpdate (channel_id, tiers, plan_id) {

  console.log(JSON.stringify(tiers,null,2))

  const UpdateExpression = "SET tiers = :tiers" + (plan_id ? ", plan_id = :plan_id" : "");
  const ExpressionAttributeValues = {
    ":tiers": tiers,
    ...(plan_id && { ":plan_id": plan_id }),
  };

  console.log(`[DynamoDB:CHANNELS] Updating tiers for channel ${channel_id}`);
  return DynamoDB.update({
    TableName: process.env.DYNAMODB_TABLE_CHANNELS,
    Key: { channel_id },
    UpdateExpression,
    ExpressionAttributeValues
  }).promise();
}
