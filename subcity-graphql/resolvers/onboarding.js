const request = require("request");
const stripe = require("stripe")(process.env.STRIPE_KEY_PRIVATE);
const {
  stripeUtilities: {
    getStripeAccountObject,
    createStripeAccount,
    createStripePlan,
    createStripeCustomer
  },
  DynamoDB,
  getPrincipalID
} = require("../shared");

const createChannel = require("./channel").createChannel;
const createSubscriber = require("./subscriber").createSubscriber;

////////////////////////////////////////////////////

const getSignupTokenById = (root, args) => {

  const { token_id } = args;

  const params = {
    TableName: process.env.DYNAMODB_TABLE_TOKENS,
    Key: { token_id },
  };
  return DynamoDB.get(params)
  .promise().then(data => !!((data || {}).Item || {}).token_id);
};

const deleteSignupTokenById = token_id => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE_TOKENS,
    Key: { token_id },
  };
  return DynamoDB.delete(params)
  .promise().then(() => true);
};

const handleChannelSignup = async (root, args, context) => {

  const data = Object.assign(args.data, { ip_address: context.sourceIp });

  // Verify that the channel signup token is valid.

  if (await getSignupTokenById(null, ({ token_id: data.token_id })) === null) {
    throw new Error("Signup token invalid.");
  }

  // Build the Stripe account object.

  const stripeAccountObject = await getStripeAccountObject(data);

  var channel_id,
      stripe_id,
      plan_id,
      Auth0ManagementToken;

  try {

    // Create the Stripe account.

    const { id } = await createStripeAccount(stripeAccountObject);
    channel_id = getPrincipalID(null, id);
    stripe_id = id;

    // Create the Stripe plan.

    const planOptions = {
      amount: 499,
      interval: "month",
      product: {
        id: `prod_channel_${channel_id}`,
        name: `prod_channel_${channel_id}`
      },
      currency: stripeAccountObject.external_account.currency,
    };

    ({ id: plan_id } = await createStripePlan(planOptions));

  } catch(error) {
    rollback(["stripe"], {
      user_id: stripe_id,
      product_id: `prod_channel_${channel_id}`,
      plan_id: plan_id
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
      currency: stripeAccountObject.external_account.currency,
      plan_id: plan_id
    };
    
    await Promise.all([createChannel(seed), deleteSignupTokenById(data.token_id)]);

  } catch(error) {
    rollback(["stripe", "auth0"], {
      user_id: stripe_id,
      product_id: `prod_channel_${channel_id}`,
      plan_id: plan_id,
      access_token: Auth0ManagementToken.access_token
    })(error);
    return false;
  }

  return ({ channel_id });
};

const handleSubscriberSignup = async (root, args) => {

  const { data } = args;

  var subscriber_id,
      stripe_id,
      Auth0ManagementToken;

  try {

    // Create the Stripe customer.

    // TODO: Set currency field on subscriber.

    const { id, country } = await createStripeCustomer({ source: data.token_id });
    subscriber_id = getPrincipalID(null, id);
    stripe_id = id;

  } catch(error) {
    rollback([], {})(error);
    return false;
  }

  try {

    // Get Auth0 management token.

    Auth0ManagementToken = await getAuth0ManagementToken();

    // Create the Auth0 user.

    await createAuth0User(Object.assign({ user_id: stripe_id, role: "subscriber" }, data, Auth0ManagementToken));

  } catch(error) {
    rollback(["stripe"], {
      user_id: stripe_id
    })(error);
    throw new Error(error);
  }

  try {

    // Create the subscriber.

    const seed = {
      subscriber_id
    };

    await createSubscriber(seed);

  } catch(error) {
    rollback(["stripe", "auth0"], {
      user_id: stripe_id,
      access_token: Auth0ManagementToken.access_token
    })(error);
    return false;
  }

  return ({ subscriber_id });
};

////////////////////////////////////////////////////

module.exports = {
  getSignupTokenById: getSignupTokenById,
  handleChannelSignup: handleChannelSignup,
  handleSubscriberSignup: handleSubscriberSignup,
};

////////////////////////////////////////////////////

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

function assertTokenValid(data) {
  const { token_id } = data;
  return getSignupTokenById(token_id)
}


function getAuth0ManagementToken() {
  const options = {
    method: "POST",
    url: `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      client_id: process.env.AUTH0_M2M_CLIENT_ID,
      client_secret: process.env.AUTH0_M2M_CLIENT_SECRET,
      audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`,
      grant_type: "client_credentials"
    })
  };
  return new Promise((resolve, reject) => {
    console.log(`${"[Auth0] ".padEnd(30, ".")} Fetching management token`);
    request(options, (error, response, body) => {
     if (error) { reject(error); }
     else if (response.statusCode !== 200) { reject(`[${response.statusCode}] ${response.statusMessage}`)}
     else { resolve(JSON.parse(body)); }
   });
  });
}

function createAuth0User({ user_id, role, email, password, access_token }) {
  const user = {
    user_id,
    email,
    password,
    email_verified: false,
    verify_email: false,
    connection: "Username-Password-Authentication",
    app_metadata: {
      roles: [role]
    }
  };
  const options = {
    method: "POST",
    url: `https://${process.env.AUTH0_DOMAIN}/api/v2/users`,
    headers: {
      "Authorization": `Bearer ${access_token}`,
      "Content-Type": "application/json; charset=utf-8"
    },
    body: JSON.stringify(user)
  };
  return new Promise((resolve, reject) => {
    console.log(`${"[Auth0] ".padEnd(30, ".")} Creating new user ${user_id}`);
    request(options, (error, response) => {
      const body = JSON.parse(response.body);
      if (error) { reject(error); }
      else if (body.statusCode) { reject(`[${body.statusCode}] ${body.message}`)}
      else { resolve(body); }
    });
  });
}