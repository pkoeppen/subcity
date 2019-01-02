require("../../shared/lib/load-env")("dev").__load__();


////////////////////////////////////////////////////////////
/////////////////////////// UTIL ///////////////////////////
////////////////////////////////////////////////////////////


const clear = require("./clear");
const request = require("request");
const fs = require("fs");
const {
  createStripeCustomer,
  createStripePlan,
  DynamoDB,
  S3
} = require("../shared");
const stripe = require("stripe")(process.env.STRIPE_KEY_PRIVATE);


////////////////////////////////////////////////////////////
/////////////////////////// CHAI ///////////////////////////
////////////////////////////////////////////////////////////


const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const { expect } = chai;


////////////////////////////////////////////////////////////
/////////////////////////// GQL ////////////////////////////
////////////////////////////////////////////////////////////


const {
  graphql
} = require("graphql");

const schema = require("../schema");


////////////////////////////////////////////////////////////
////////////////////////// TESTS ///////////////////////////
////////////////////////////////////////////////////////////


before(async function() {

  // Clear releases.

  await clear.stripe();
});


describe("Create syndicate", function() {

  it("should do something", async () => {

    const { id: subscriber_id } = await createStripeCustomer({ source: "tok_ca" });

    const params_1 = {
      billing_scheme: "tiered",
      currency: "eur",
      interval: "month",
      product: {
        id: "fooproduct_1",
        name: "fooproduct_1"
      },
      tiers: [
        {
          flat_amount: 499,
          up_to: 1
        },
        {
          flat_amount: 999,
          up_to: 2
        },
        {
          flat_amount: 1499,
          up_to: "inf"
        },
      ],
      tiers_mode: "volume"
    };

    const { id: plan_id_1 } = await createStripePlan(params_1);

    const params_2 = {
      billing_scheme: "tiered",
      currency: "eur",
      interval: "month",
      product: {
        id: "fooproduct_2",
        name: "fooproduct_2"
      },
      tiers: [
        {
          flat_amount: 499,
          up_to: 1
        },
        {
          flat_amount: 999,
          up_to: 2
        },
        {
          flat_amount: 1499,
          up_to: "inf"
        },
      ],
      tiers_mode: "volume"
    };

    const { id: plan_id_2 } = await createStripePlan(params_2);

    const { id: subscription_id_1 } = await stripe.subscriptions.create({
      customer: subscriber_id,
      items: [{ plan: plan_id_1 }]
    });

    const { id: subscription_id_2 } = await stripe.subscriptions.create({
      customer: subscriber_id,
      items: [{ plan: plan_id_2 }]
    });

    console.log("subscriber_id", subscriber_id);
    console.log("plan_id_1", plan_id_1);
    console.log("plan_id_2", plan_id_2);
    console.log("subscription_id_1", subscription_id_1);
    console.log("subscription_id_2", subscription_id_2);

  });

});
