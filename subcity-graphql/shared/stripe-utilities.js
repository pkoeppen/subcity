const stripe = require("stripe")(process.env.STRIPE_KEY_PRIVATE);
const {
  without
} = require("lodash");


////////////////////////////////////////////////////


async function getStripeAccountObject(data) {
  const { year, month, day } = parseDate(data.dob);
  const stripeAccountObject = {
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
      ...(data.country === "US" && { ssn_last_4: getSSNLast4(data) })
    },
    tos_acceptance: {
      date: Math.floor(Date.now() / 1000),
      ip: data.ip_address
    }
  };
  return stripeAccountObject;
}


function createStripeAccount(stripeAccountObject) {
  console.log(`${"[Stripe] ".padEnd(30, ".")} Creating new account`);
  return stripe.accounts.create(stripeAccountObject);
}


function createStripePlan(planOptions) {
  console.log(`${"[Stripe] ".padEnd(30, ".")} Creating new product/plan ${planOptions.product.id}`);
  return stripe.plans.create(planOptions);
}


function createStripeCustomer(stripeCustomerObject) {
  console.log(`${"[Stripe] ".padEnd(30, ".")} Creating new customer`);
  return stripe.customers.create(stripeCustomerObject);
}


function parseDate(date) {
  const dateObject = new Date(date);
  if (isNaN(dateObject.getTime())) {
    throw new Error("Invalid date of birth.");
  } else {
    const [year, month, day] = dateObject.toLocaleDateString().split("-");
    return { year, month, day };
  }
}


function getSSNLast4({ personal_id_number }) {
  if (personal_id_number && /^[0-9]{9}$/.test(personal_id_number)) {
    return personal_id_number.slice(-4);
  } else {
    throw new Error("Invalid ID number.");
  }
}


function getDefaultCurrency(country) {
  return stripe.countrySpecs.retrieve(country)
  .then(spec => spec.default_currency);
}


async function handleSubscriptionRateChange(type, original, subscription_rate) {

  // This method creates a new Stripe plan associated with the channel's Stripe product,
  // deletes the old plan, and moves all subscribers to the new rate if so specified.

  const {
    channel_id,
    syndicate_id,
    currency,
    plan_id: old_plan_id,
    subscribers
  } = original;

  const id = (channel_id || syndicate_id);
  var product_id;

  switch(type) {
    case "channel":
      product_id = `prod_channel_${id}`;
      break;
    case "syndicate":
      product_id = `prod_syndicate_${id}`;
      break
    default:
      throw new Error("Invalid type input. Type must be 'channel' or 'syndicate'.");
  }

  // Configure options for new Stripe plan.

  const planOptions = {
    amount: subscription_rate,
    interval: "month",
    product: product_id,
    currency,
  };

  // Create the new plan...

  console.log(`[Stripe] Creating new plan for ${type}: ${id}`);
  const a = stripe.plans.create(planOptions);

  // ...and deactivate the old plan.
  // I say "deactivate" because existing subscribers are not affected.

  console.log(`[Stripe] Deactivating old plan ${old_plan_id}`);
  const b = stripe.plans.update(old_plan_id, { active: false });

  const [
    { id: new_plan_id }
  ] = await Promise.all([a,b]);

  if (true) { // TODO: Some option to move all existing subscribers to new plan (or leave them)

    // TODO: Email subscribers regarding update to subscription.

    await handleSubscriptionTransfer(product_id, new_plan_id);
  }

  return new_plan_id;
}


async function handleSubscriptionTransfer(product_id, new_plan_id, delete_product) {

  // Get all (old) plans associated with the channel's Stipe product...

  const old_plans = without((await getPlansByProductId(product_id)).map(plan => plan.id), new_plan_id);

  // ...then get all subscriptions associated with those plans.

  const subscriptions        = await getSubscriptionsFromPlans(old_plans);
  const updatedSubscriptions = await updateSubscriptionsToNewPlan(subscriptions, new_plan_id);

  // Delete all old plans.

  await deletePlans(old_plans);

  // And maybe delete the product, too.

  if (delete_product) {
    await deleteProduct(product_id);
  }
}


async function getPlansByProductId(product_id) {
  var index = 1;
  var buffer = [];
  var has_more = true;

  // Stripe paginates queries with a max of 100 items per page, so to get all
  // plan items, we have to jump through some goofy little hoops as follows.

  while (has_more) {
    var plansToConcat;
    console.log(`[Stripe] Fetching plans for ${product_id} (page: ${index})`);
    ({ has_more, data: plansToConcat } = await stripe.plans.list({
      product: product_id,
      limit: 100,
      ...(buffer.length && { starting_after: buffer[buffer.length - 1].id })
    }));
    buffer = buffer.concat(plansToConcat);
    index++;
  }
  return buffer;
}


function getSubscriptionsFromPlans(plans) {
  return plans.reduce(async (promise, plan_id) => {
    var index = 1;
    var buffer = [];
    var has_more = true;

    // Stripe paginates queries with a max of 100 items per page, so to get all
    // subscription items, we have to jump through (even more) goofy little hoops.

    while (has_more) {
      var subsToConcat;
      console.log(`[Stripe] Fetching subscriptions to ${plan_id} (page: ${index})`);
      ({ has_more, data: subsToConcat } = await stripe.subscriptions.list({
        plan: plan_id,
        limit: 100,
        ...(buffer.length && { starting_after: buffer[buffer.length - 1].id })
      }));
      buffer = buffer.concat(subsToConcat);
      index++;
    }
    return promise.then(acc => acc.concat(buffer));
  }, Promise.resolve([]));
}


function updateSubscriptionsToNewPlan(subscriptions, new_plan_id) {

  // Move all subscriptions to the new plan (subscription rate).

  return Promise.all(subscriptions.map(subscription => {
    const {
      id,
      items: { data }
    } = subscription;
    console.log(`[Stripe] Updating subscription ${id} to ${new_plan_id}`);
    return stripe.subscriptions.update(id, {
      items: [{
        id: data[0].id,
        plan: new_plan_id
      }]
    });
  }));
}


function deletePlans(plans) {
  return Promise.all(plans.map(plan_id => {
    console.log(`[Stripe] Deleting plan ${plan_id}`);
    return stripe.plans.del(plan_id);
  }));
}


function deleteProduct(product_id) {
  console.log(`[Stripe] Deleting product ${product_id}`);
  return stripe.products.del(product_id);
}


function deleteSubscriptions(subscriptions) {
  return Promise.all(subscriptions.map(subscription_id => {
    console.log(`[Stripe] Deleting subscription ${subscription_id}`);
    return stripe.subscriptions.del(subscription_id);
  }));
}


async function purgeByProductID(product_id) {
  const plans         = (await getPlansByProductId(product_id)).map(({ id }) => id);
  const subscriptions = (await getSubscriptionsFromPlans(plans)).map(({ id }) => id);

  // Delete all subscriptions, plans, and product associated with the product_id.

  await deleteSubscriptions(subscriptions);
  await deletePlans(plans);
  await deleteProduct(product_id);
}


////////////////////////////////////////////////////


module.exports = {
  getStripeAccountObject,
  createStripeAccount,
  createStripePlan,
  createStripeCustomer,
  parseDate,
  getSSNLast4,
  getDefaultCurrency,
  handleSubscriptionRateChange,
  handleSubscriptionTransfer,
  getPlansByProductId,
  getSubscriptionsFromPlans,
  updateSubscriptionsToNewPlan,
  deletePlans,
  deleteProduct,
  deleteSubscriptions,
  purgeByProductID
};