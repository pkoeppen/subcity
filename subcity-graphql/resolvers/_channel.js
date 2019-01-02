const stripe = require("stripe")(process.env.STRIPE_KEY_PRIVATE);

const {
  Auth0Utilities: {
    createAuth0User,
    getAuth0ManagementToken
  },
  promisify,
  sanitize,
  DynamoDB,
  S3,
  buildQuery,
  getIDHash,
  parseMarkdown,
  curateSets,
  StripeUtilities: {
    createStripeAccountObject,
    createStripeAccount,
    createStripePlan,
    createStripeCustomer,
    handleSubscriptionRateChange
  }
} = require("../shared");

const {
  chunk,
  flatten,
  includes,
  intersection
} = require("lodash");

const {
  getSubscriberById
} = require("./subscriber");


module.exports = {
  assertTokenExists,
  initializeChannel,
  getChannelById,
  // getChannelBySlug,
  // getChannelsByIdArray,
  // getApprovalsByIdArray,
  // getRejectionsByIdArray,
  // getChannelsByRange,
  // getChannelPaymentSettings,
  // createChannel,
  updateChannel,
  writeChannelUpdates,
  // updateChannelPaymentSettings
};

////////////////////////////////////////////////////////////
///////////////////////// QUERIES //////////////////////////
////////////////////////////////////////////////////////////


function assertTokenExists (root, args, ctx, ast) {

  // Assert signup token exists.

  const { token_id } = args;
  
  return getSignupToken(token_id)
  .then(token => !!token);
}


function assertTokenValid (token_id, pin) {

  // Assert signup token and PIN are valid.
  
  return getSignupToken(token_id)
  .then(token => (token ? pin === token.pin : false));
}


function getSignupToken (token_id) {

  // Get signup token.

  const params = {
    TableName: process.env.DYNAMODB_TABLE_TOKENS,
    Key: { token_id },
  };

  return DynamoDB.get(params)
  .promise().then(({ Item: token }) => token);
};


function deleteSignupToken (token_id) {

  // Delete signup token.

  const params = {
    TableName: process.env.DYNAMODB_TABLE_TOKENS,
    Key: { token_id },
  };

  return DynamoDB.delete(params)
  .promise()
  .then(() => true)
  .catch(error => {
    console.error(error.stack || error);
    return false;
  })
};


async function initializeChannel (root, args, ctx, ast) {

  const { ip_address } = ctx;
  const data = Object.assign(args.data, { ip_address });

  // Verify that the signup token and PIN are valid.

  if (!await assertTokenValid(data.token_id, data.pin)) {
    throw new Error("Signup token or PIN invalid.");
  }

  var channel_id,
      stripe_id,
      plan_id,
      currency,
      Auth0ManagementToken;

  try {

    // Create the Stripe account.

    const stripeAccountObject = await createStripeAccountObject(data);
    const { id }              = await createStripeAccount(stripeAccountObject);
    channel_id                = id.replace(/^(acct|cus)_/g, "");
    stripe_id                 = id;
    currency                  = stripeAccountObject.external_account.currency;

    // Create the Stripe plan.

    const planOptions = {
      amount:   1999,
      interval: "month",
      product: {
        id:   `prod_channel_${channel_id}`,
        name: `prod_channel_${channel_id}`
      },
      currency
    };

    ({ id: plan_id } = await createStripePlan(planOptions));

  } catch(error) {

    rollback(["stripe"], {
      user_id:    stripe_id,
      product_id: `prod_channel_${channel_id}`,
      plan_id:    plan_id
    })(error);

    return false;
  }

  try {

    // Get Auth0 management token.

    Auth0ManagementToken = await getAuth0ManagementToken();

    // Create the Auth0 user.

    await createAuth0User(Object.assign({ user_id: stripe_id, role: "channel" }, data, Auth0ManagementToken));

  } catch(error) {

    rollback(["stripe"], {
      user_id: stripe_id,
      product_id: `prod_channel_${channel_id}`,
      plan_id: plan_id
    })(error);

    return false;
  }

  try {

    // Create the channel and delete the signup token.

    const seed = {
      channel_id,
      currency,
      plan_id
    };
    
    await Promise.all([
      createChannel(seed),
      deleteSignupToken(data.token_id)
    ]);

  } catch(error) {

    rollback(["stripe", "auth0"], {
      user_id: stripe_id,
      product_id: `prod_channel_${channel_id}`,
      plan_id: plan_id,
      access_token: Auth0ManagementToken.access_token
    })(error);

    return false;
  }

  return true;
};


function rollback(providers, { user_id, product_id, plan_id, access_token }) {

  const actions = {

    async stripe() {

      if (/^acct/.test(user_id)) {

        // Delete "channel" user.

        console.log(`${"[Stripe] ".padEnd(30, ".")} Rollback: Deleting ${user_id}`);
        await stripe.accounts.del(user_id)
        .catch(error => {
          console.error(`[Stripe] Rollback for ${user_id} failed.`);
          console.error(error.message);
        });

        if (plan_id) {

          // Delete associated plan. Must be deleted before its parent product.

          console.log(`${"[Stripe] ".padEnd(30, ".")} Rollback: Deleting ${plan_id}`);
          await stripe.plans.del(plan_id)
          .catch(error => {
            console.error(`[Stripe] Rollback for ${plan_id} failed.`);
            console.error(error.message);
          });
        }

        if (product_id) {

          // Delete associated product.

          console.log(`${"[Stripe] ".padEnd(30, ".")} Rollback: Deleting ${product_id}`);
          await stripe.products.del(product_id)
          .catch(error => {
            console.error(`${"[Stripe] ".padEnd(30, ".")} Rollback for ${product_id} failed.`);
            console.error(error.message);
          });
        }

      } else {

        // Delete "subscriber" user.

        console.log(`${"[Stripe] ".padEnd(30, ".")} Rollback: Deleting ${user_id}`);
        await stripe.customers.del(user_id)
        .catch(error => {
          console.error(`${"[Stripe] ".padEnd(30, ".")} Rollback for ${user_id} failed.`);
          console.error(error.message);
        })
      }

    },

    auth0() {

      const options = {
        method: "DELETE",
        url: `https://${process.env.AUTH0_DOMAIN}/api/v2/users/auth0|${user_id}`,
        headers: {
          "Authorization": `Bearer ${access_token}`,
          "Content-Type": "application/json; charset=utf-8"
        }
      };

      console.log(`${"[Auth0] ".padEnd(30, ".")} Rollback: Deleting ${user_id}`);
      request(options, (error, response) => {
        if (error) {
          console.error(`${"[Auth0] ".padEnd(30, ".")} Rollback for ${user_id} failed.`);
          console.error(error.message);
        }
      });

    }
  };
  
  return error => {
    providers.map(provider => actions[provider]());
    console.error(error);
  }
}


function getChannelById (channel_id) {

  // Get channel by ID.

  if (!channel_id) { return null; }
  
  const params = {
    TableName: process.env.DYNAMODB_TABLE_CHANNELS,
    Key: { channel_id }
  };

  return DynamoDB.get(params).promise()
  .then(({ Item: channel }) => {

    if (!channel) {
      return new Error("! Channel not found.");
    } else {
      return channel;
    }

  });
};


function getChannelBySlug (root, args, ctx, ast) {

  // Called only from a public channel page, but accessible from within
  // both the public and private API. It also exists within the private
  // API to allow the attachment of a channel or subscriber id field.

  const {
    channel_id,
    subscriber_id,
    slug
  } = args;

  const params = {
    TableName: process.env.DYNAMODB_TABLE_CHANNELS,
    FilterExpression: "slug = :slug",
    ExpressionAttributeValues: { ":slug": slug }
  };

  return DynamoDB.scan(params).promise()
  .then(async ({ Items: channels }) => {

    const channel = curateSets(channels[0]);

    if (!channel) {
      throw new Error();
    } else {

      // Delete sensitive fields.

      delete channel.plan_id;
      delete channel.earnings_month;
      delete channel.earnings_total;
      delete channel.subscriber_count;
      delete channel.subscriber_pays;
      delete channel.unlisted;

      // Deserialize the channel description and overview.

      channel.description = parseMarkdown(channel.description);
      channel.overview    = parseMarkdown(channel.overview);

      if (subscriber_id) {

        // Attach "is_subscribed" to accurately display the "subscribe"
        // or "unsubscribe" button on the front end.

        const { syndicates: subscriber_syndicates } = await getSubscriberById(null, { subscriber_id });

        channel.is_subscribed                = includes(channel.subscribers, subscriber_id);
        channel.subscribed_through_syndicate = intersection(channel.syndicates, subscriber_syndicates).length > 0;
      }

      return channel;
    }
  })
  .catch(error => {
    console.error(error);
    throw new Error("Error fetching channel.");
  });
};


const getChannelsByIdArray = (root, args, ctx, ast) => {

  // Returns channel objects based on an array of supplied IDs.

  const { channels } = root;

  if (!channels || !channels.length) { return []; }

  const chunked = chunk(channels, 100).map(chunk => {
    const params = {
      RequestItems: {
        [process.env.DYNAMODB_TABLE_CHANNELS]: {
          Keys: chunk.map(channel_id => ({ channel_id }))
        }
      }
    };
    return DynamoDB.batchGet(params).promise();
  });

  return Promise.all(chunked)
  .then(results => {
    return flatten(results.map(({ Responses }) => Responses[process.env.DYNAMODB_TABLE_CHANNELS]))
    .map(channel => curateSets(channel));
  })
  .catch(error => {
    console.error(error);
    throw new Error("Error fetching channels.");
  });;
};


const getApprovalsByIdArray = (root, args, ctx, ast) => {

  // A little workaround to return an array of SyndicateType objects.

  root.channels = root.approvals;
  return getChannelsByIdArray(root, args);
};


const getRejectionsByIdArray = (root, args, ctx, ast)=> {

  // See above.

  root.channels = root.rejections;
  return getChannelsByIdArray(root, args);
};


const getChannelsByRange = (root, args, ctx, ast) => {

  // TODO: Stuff

  const params = {
    TableName: process.env.DYNAMODB_TABLE_CHANNELS,
    FilterExpression : "updated_at <> :zero",
    ExpressionAttributeValues : { ":zero" : 0 },
    // Limit: 50,
  };

  return DynamoDB.scan(params).promise()
  .then(({ Items }) => (Items || []))
  .catch(error => {
    console.error(error);
    throw new Error("Error fetching channels.");
  });;


  // var channels = [];
  // while (true) {

  //   // Scan channels in chunks of length "params.range" until either
  //   // "channels" is full, or there are no more channels to scan.

  //   let { Items, LastEvaluatedKey: { channel_id } = {}} = await DynamoDB.scan(params).promise();

  //   // Attach new channels to "channels" array.

  //   channels = channels.concat(Items);
  //   if (channels.length === options.range || !channel_id) {

  //     // "channels" array is full, or we're out of channels.

  //     break;
  //   }

  //   // Start from the last scanned channel.

  //   params.ExclusiveStartKey = { channel_id };
  // }

  // return channels.slice(0, options.range);
};


const getChannelPaymentSettings = (root, args, ctx, ast) => {

  // Fetch Stripe account settings and transmogrify it
  // to fit the ChannelPaymentSettings GraphQL type.

  const { channel_id } = args;
  
  return stripe.accounts.retrieve(`acct_${channel_id}`)
  .then(account => {

    // Add leading zeroes to date.

    var { year, month, day } = account.legal_entity.dob;
    month = ("0" + month).slice(-2);
    day = ("0" + day).slice(-2);

    // Mangle the data into a form GraphQL will accept.

    const paymentSettingsObject = {

      first_name:           account.legal_entity.first_name,
      last_name:            account.legal_entity.last_name,
      country:              account.country,
      city:                 account.legal_entity.address.city,
      line1:                account.legal_entity.address.line1,
      postal_code:          account.legal_entity.address.postal_code,
      state:                account.legal_entity.address.state,
      dob:                  `${year}-${month}-${day}`,
      bank_name:            account.external_accounts.data[0].bank_name,
      routing_number:       account.external_accounts.data[0].routing_number,
      account_number_last4: account.external_accounts.data[0].last4,
      payout_interval:      account.payout_schedule.interval,
      payout_anchor:        account.payout_schedule.monthly_anchor || account.payout_schedule.weekly_anchor || null

    };

    return paymentSettingsObject;
  })
  .catch(error => {
    console.error(error);
    throw new Error("Error fetching payment settings.");
  });
};


///////////////////////////////////////////////////
//////////////////// MUTATIONS ////////////////////
///////////////////////////////////////////////////


function createChannel (seed) {

  // Create a new channel.

  const channel = Object.assign({
    description:    null,
    overview:       null,
    payload_url:    null,
    published:      false,
    rate:           1999,
    slug:           null,
    time_created:   Date.now(),
    time_updated:   null,
    title:          null,
    unlisted:       false
  }, seed);

  console.log(`${"[DynamoDB:CHANNELS] ".padEnd(30, ".")} Creating new channel ${seed.channel_id}`);
  return DynamoDB.put({
    TableName: process.env.DYNAMODB_TABLE_CHANNELS,
    Item: channel
  }).promise()
  .catch(error => {
    console.error(error);
    return new Error("Error creating channel.");
  });
};


function assertSlugAvailable (slug) {

  const params = {
    TableName: process.env.DYNAMODB_TABLE_SLUGS,
    Key: { slug }
  };
  console.log("slug\n\n\n\n\n",slug)
  return DynamoDB.get(params).promise()
  .then(({ Item: slug }) => !slug)
  .catch(error => {
    console.error(`[assertSlugAvailable] Error: ${error}`);
    return new Error("! Error asserting slug availability.");
  });;
}


function createSlug (slug_item) {

  const params = {
    TableName: process.env.DYNAMODB_TABLE_SLUGS,
    Item: slug
  };

  console.log(`${"[DynamoDB:SLUGS] ".padEnd(30, ".")} creating slug ${slug}`);
  return DynamoDB.put(params).promise()
  .catch(error => {
    console.error(`[createSlug] Error: ${error}`);
    return new Error("! Error creating slug.");
  });
}


function deleteSlug (slug) {

  const params = {
    TableName: process.env.DYNAMODB_TABLE_SLUGS,
    Key: {
      slug
    }
  };

  console.log(`${"[DynamoDB:SLUGS] ".padEnd(30, ".")} Deleting slug ${slug}`);
  return DynamoDB.delete(params).promise()
  .catch(error => {
    console.error(`[deleteSlug] Error: ${error}`);
    return new Error("! Error deleting slug.");
  });
}


async function handleSlugAssignment ({ channel_id, syndicate_id }, slug) {

  if (await assertSlugAvailable(slug)) {

    const channel   = await getChannelById(channel_id);
    const syndicate = await getSyndicateById(syndicate_id);
    const old_slug  = (channel || syndicate).slug;
    const slug_item = {
      slug,
      ...(channel_id && { channel_id }),
      ...(syndicate_id && { syndicate_id })
    };

    return Promise.all([
      createSlug(slug_item),
      deleteSlug(old_slug)
    ]);

  } else {
    return new Error("! Slug unavailable.");
  }
}


function writeChannelUpdates (channel_id, updates) {

  // Writes channel updates to DynamoDB.

  const { expressionAttributeValues, updateExpression } = buildQuery(updates);

  console.log(`${"[DynamoDB:CHANNELS] ".padEnd(30, ".")} Updating channel ${channel_id}`);
  return DynamoDB.update({
    TableName: process.env.DYNAMODB_TABLE_CHANNELS,
    Key: { channel_id },
    UpdateExpression: `SET ${updateExpression}`,
    ExpressionAttributeValues: expressionAttributeValues
  }).promise();
}


async function updateChannel (channel_id, data) {

  const data = sanitize(data);
  data.time_updated = Date.now();

  const tasks = [
    writeChannelUpdates(channel_id, data),
    ...(!!data.slug && handleSlugAssignment({ channel_id }, data.slug)),
    ...(!!data.rate && handleSubscriptionRateChange({ channel_id }, Math.floor(data.rate)))
  ];

  return Promise.all(tasks)
  .then(() => true);
};


const updateChannelPaymentSettings = async (root, args, ctx, ast) => {

  const { data } = args;

  // If a new account number is provided, build the external_account object.

  let external_account;
  if (data.account_number) {
    external_account = {
      object: "bank_account",
      country: data.country,
      currency: await stripeUtilities.getDefaultCurrency(data.country),
      account_number: data.account_number,
      ...(!!data.routing_number && { routing_number: data.routing_number })
    };
  }

  // Always build the legal_entity object.

  const { year, month, day } = stripeUtilities.parseDate(data.dob);
  const legal_entity = {
    first_name: data.first_name,
    last_name: data.last_name,
    address: {
      city: data.city,
      line1: data.line1,
      postal_code: data.postal_code,
      state: data.state
    },
    dob: {
      day: day,
      month: month,
      year: year
    },
    type: "individual",

    // If a new personal ID number is provided, include the following fields.

    ...(!!data.personal_id_number && { personal_id_number: data.personal_id_number }),
    ...(!!data.personal_id_number && data.country === "US" && { ssn_last_4: stripeUtilities.getSSNLast4(data) })
  };

  // Build the final Stripe account object.

  const stripeAccountObject = {
    legal_entity,
    ...(!!external_account && { external_account }),
  };

  // Update the account.

  return stripe.accounts.update(`acct_${data.channel_id}`, stripeAccountObject)
  .then(account => true)
  .catch(error => {
    throw new Error("Error updating payment settings.");
  });
};
