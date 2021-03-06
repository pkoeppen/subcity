const stripe = require("stripe")(process.env.STRIPE_KEY_PRIVATE);

const sortBy = require("lodash/sortBy");
const without = require("lodash/without");

const AWS = require("aws-sdk");
AWS.config.update({
  region: "us-east-1"
});


const DynamoDB = new AWS.DynamoDB.DocumentClient();


module.exports = {
  createStripeAccountObject,
  createStripeAccount,
  createStripePlan,
  createStripeCustomer,
  createStripeSource,
  createStripeSubscription,
  deactivateSubscriptionsByProductID,
  deleteStripeAccount,
  deleteStripeCustomer,
  deleteStripePlan,
  deleteStripeProduct,
  deleteStripeSource,
  deleteStripeSubscription,
  getDefaultCurrency,
  getPlansByProductID,
  getStripeAccountSettings,
  getStripeSources,
  getSubscriptionsByProductID,
  getSubscriptionsFromPlans,
  parseDate,
  parseLast4,
  reactivateSubscriptionsByProductID,
  setDefaultStripeSource,
  transferSubscription,
  transferSubscriptionsByProductID,
  updateSubscriptionsToNewPlan,
  updateStripeAccount,
  deletePlans,
  deleteProduct,
  deleteSubscriptions,
  purgeByProductID
};


async function createStripeAccountObject (data) {

  // Create an object ready for submission to Stripe Connect.

  const { year, month, day } = parseDate(data.dob);

  const accountObject = {
    type: "custom",
    country: data.country,
    external_account: {
      object: "bank_account",
      country: data.country,
      currency: await getDefaultCurrency(data.country),
      account_number: data.account_number,
      ...(!!data.routing_number && { routing_number: data.routing_number })
    },
    legal_entity: {
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
      personal_id_number: data.personal_id_number,
      ...(data.country === "US" && { ssn_last_4: parseLast4(data) })
    },
    tos_acceptance: {
      date: Math.floor(Date.now() / 1000),
      ip: data.ip_address
    }
  };

  return accountObject;
}


function createStripeAccount (accountObject) {
  console.log(`[Stripe] Creating new account`);
  return stripe.accounts.create(accountObject);
}


function createStripeCharge (customer_id, amount, description=null) {
  console.log(`[Stripe] Charging customer ${customer_id} amount ${amount}`);
  return stripe.charges.create({
    amount,
    currency: "usd",
    customer: customer_id,
    ...(description && { description })
  });
}


function createStripePlan (plan) {

  if (plan.id && plan.product.id) {
    console.log(`[Stripe] Creating new ${plan.id} and ${plan.product.id}`);
  } else if (plan.product) {
    console.log(`[Stripe] Creating new plan for ${plan.product.id || plan.product}`);
  }

  return stripe.plans.create(plan);
}


function createStripeCustomer (stripeCustomerObject) {
  console.log(`[Stripe] Creating new customer`);
  return stripe.customers.create(stripeCustomerObject);
}


function createStripeSource (customer_id, token) {
  console.log(`[Stripe] Creating new source for ${customer_id}`);
  return stripe.customers.createSource(customer_id, { source: token });
}


function createStripeSubscription (customer_id, plan_id, tier, extra, active=true) {

  const items = [{
    plan: plan_id,
    quantity: tier
  }];

  if (extra) {
    items.push({
      plan: "plan_extra",
      quantity: extra
    });
  }

  console.log(`[Stripe] Creating new subscription for customer ${customer_id}`);
  return stripe.subscriptions.create({
    coupon: active ? null : "deactivated",
    customer: customer_id,
    items
  });
}


function deleteStripeAccount (account_id) {
  console.log(`[Stripe] Deleting ${account_id}`);
  return stripe.accounts.del(account_id);
}


function deleteStripeCustomer (customer_id) {
  console.log(`[Stripe] Deleting ${customer_id}`);
  return stripe.customers.del(customer_id);
}


function deleteStripePlan (plan_id) {
  console.log(`[Stripe] Deleting ${plan_id}`);
  return stripe.plans.del(plan_id);
}


function deleteStripeProduct (product_id) {
  console.log(`[Stripe] Deleting ${product_id}`);
  return stripe.products.del(product_id);
}


function deleteStripeSource (customer_id, source_id) {
  console.log(`[Stripe] Deleting ${source_id}`);
  return stripe.customers.deleteSource(customer_id, source_id);
}


function getStripeAccountSettings (account_id) {

  return stripe.accounts.retrieve(account_id)
  .then(account => {

    // Add leading zeroes to date.

    var { year, month, day } = account.legal_entity.dob;
    month = ("0" + month).slice(-2);
    day = ("0" + day).slice(-2);

    // Mangle the data into a form GraphQL will accept.

    const settings = {

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

    return settings;
  });
}


function getStripeSources (customer_id) {
  return stripe.customers.retrieve(customer_id)
  .then(({ default_source, sources: { data }}) => {
    return data.map(({ id, ...source }) => {
      if (id === default_source) {
        source.default = true;
      }
      source.source_id = id;
      return source;
    })
  });
}


function deleteStripeSubscription (subscription_id) {
  console.log(`[Stripe] Deleting ${subscription_id}`);
  return stripe.subscriptions.del(subscription_id);
}


function getDefaultCurrency (country) {
  return stripe.countrySpecs.retrieve(country)
  .then(spec => spec.default_currency);
}


function getSubscriptionsByProductID (product_id) {
  return getPlansByProductID(product_id)
  .then(plans => plans.map(({ id }) => id ))
  .then(getSubscriptionsFromPlans);
}


function parseDate (date) {
  const dateObject = new Date(date);
  if (isNaN(dateObject.getTime())) {
    throw new Error("Invalid date of birth.");
  } else {
    const [year, month, day] = dateObject.toLocaleDateString().split("-");
    return { year, month, day };
  }
}


function parseLast4({ personal_id_number }) {
  if (personal_id_number && /^[0-9]{9}$/.test(personal_id_number)) {
    return personal_id_number.slice(-4);
  } else {
    throw new Error("Invalid ID number.");
  }
}


async function transferSubscription (subscription_id, plan_id) {

  const {
    items: {
      data: subscription_items
    }
  } = await stripe.subscriptions.retrieve(subscription_id);

  const items = subscription_items.map(item => {
    if (item.plan === "plan_extra") {
      return item;
    } else {
      return {
        id: item.id,
        plan: plan_id
      };
    }
  });

  console.log(`[Stripe] Updating subscription ${subscription_id} to ${plan_id}`);
  return stripe.subscriptions.update(subscription_id, { items });
}


async function transferSubscriptionsByProductID (product_id, plan_id) {

  // Get all (old) plans associated with the Stipe product...

  const plans = without((await getPlansByProductID(product_id)).map(({ id }) => id), plan_id);

  // ...then get all subscriptions associated with those plans.

  const subscriptions = await getSubscriptionsFromPlans(plans);

  return updateSubscriptionsToNewPlan(subscriptions, plan_id)
  .then(() => ({ subscriptions, plans }));
}


async function getPlansByProductID (product_id) {

  var buffer;
  var plans    = [];
  var has_more = true;

  // Stripe paginates queries with a max of 100 items per page, so to get all
  // plan items, we have to jump through some goofy little hoops as follows.

  while (has_more) {

    try {
      console.log(`[Stripe] Fetching plans for ${product_id}`);
      ({ has_more, data: buffer } = await stripe.plans.list({
        product: product_id,
        limit: 100,
        ...(plans.length && { starting_after: plans[plans.length - 1].id })
      }));
      plans = plans.concat(buffer);

    } catch (error) {

      // Product not found. Probably.
      
      break;
    }
  }

  return plans;
}


function getSubscriptionsFromPlans (plans) {

  return plans.reduce(async (promise, plan_id) => {

    var index = 1;
    var subscriptions = [];
    var has_more = true;

    // Stripe paginates queries with a max of 100 items per page, so to get all
    // subscription items, we have to jump through (even more) goofy little hoops.

    while (has_more) {

      var subsToConcat;

      console.log(`[Stripe] Fetching subscriptions to ${plan_id} (${index})`);
      ({ has_more, data: subsToConcat } = await stripe.subscriptions.list({
        plan: plan_id,
        limit: 100,
        ...(subscriptions.length && { starting_after: subscriptions[subscriptions.length - 1].id })
      }));
      subscriptions = subscriptions.concat(subsToConcat);
      index++;
    }

    return promise.then(acc => acc.concat(subscriptions));
  }, Promise.resolve([]));
}


function updateSubscriptionsToNewPlan (subscriptions, new_plan_id) {

  return Promise.all(subscriptions.map(subscription => {

    const {
      id: subscription_id,
      items: {
        data: subscription_items
      }
    } = subscription;

    const items = subscription_items.map(item => {
      if (item.plan === "plan_extra") {
        return item;
      } else {
        return {
          id: item.id,
          plan: new_plan_id
        };
      }
    });

    console.log(`[Stripe] Updating subscription ${subscription_id} to ${new_plan_id}`);
    return stripe.subscriptions.update(subscription_id, { items });
  }));
}


function deactivateSubscriptions (subscriptions) {
  return Promise.all(subscriptions.map(({ id: subscription_id }) => {
    console.log(`[Stripe] Deactivating subscription ${subscription_id}`);
    return stripe.subscriptions.update(subscription_id, { coupon: "deactivated" });
  }));
}


function deactivateSubscriptionsByProductID (product_id) {
  return getSubscriptionsByProductID(product_id)
  .then(deactivateSubscriptions);
}


function reactivateSubscriptions (subscriptions) {
  return Promise.all(subscriptions.map(({ id: subscription_id }) => {
    console.log(`[Stripe] Reactivating subscription ${subscription_id}`);
    return stripe.subscriptions.update(subscription_id, { coupon: null });
  }));
}


function reactivateSubscriptionsByProductID (product_id) {
  return getSubscriptionsByProductID(product_id)
  .then(reactivateSubscriptions);
}


function updateStripeAccount (account_id, account_object) {
  return stripe.accounts.update(account_id, account_object);
}


function deletePlans (plans) {
  return Promise.all(plans.map(plan_id => {
    console.log(`[Stripe] Deleting plan ${plan_id}`);
    return stripe.plans.del(plan_id);
  }));
}


function deleteProduct (product_id) {
  console.log(`[Stripe] Deleting product ${product_id}`);
  return stripe.products.del(product_id);
}


function deleteSubscriptions (subscriptions) {
  return Promise.all(subscriptions.map(subscription_id => {
    console.log(`[Stripe] Deleting subscription ${subscription_id}`);
    return stripe.subscriptions.del(subscription_id);
  }));
}


async function purgeByProductID (product_id) {
  const plans         = (await getPlansByProductID(product_id)).map(({ id }) => id);
  const subscriptions = (await getSubscriptionsFromPlans(plans)).map(({ id }) => id);

  // Delete all subscriptions, plans, and product associated with the product_id.

  await deleteSubscriptions(subscriptions);
  await deletePlans(plans);
  await deleteProduct(product_id);
}


function setDefaultStripeSource (customer_id, source_id) {
  console.log(`[Stripe] Setting source ${source_id} as default for ${customer_id}`);
  return stripe.customers.update(customer_id, { default_source: source_id });
}
