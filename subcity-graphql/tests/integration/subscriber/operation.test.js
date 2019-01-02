////////////////////////////////////////////////////////////
/////////////////////////// UTIL ///////////////////////////
////////////////////////////////////////////////////////////


const {
  DynamoDB,
  getAuth0User,
  S3
} = require("../../../shared");
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

const schema = require("../../../schema");


////////////////////////////////////////////////////////////
////////////////////////// TESTS ///////////////////////////
////////////////////////////////////////////////////////////



describe("Subscriber settings", function() {

  describe("mutation: updateSubscriber", function() {

    //

  });


  describe("mutation: createPaymentMethod", function() {



  });


  describe("mutation: deletePaymentMethod", function() {

    // Same as deleting account

  });
});

describe("Subscriber settings (payment)", function() {

  
});

describe("Subscriber settings (general)", function() {

  describe("mutation: updateSubscriberEmail", function() {



  });


  describe("mutation: updateSubscriberPassword", function() {



  });


  describe("mutation: cancelAllSubscriptions", function() {



  });


  describe("mutation: deleteSubscriber", function() {



  });
});


describe("Subscriptions", function() {


  describe("mutation: createSubscription (channel)", function() {


    it("should return subscription_id from GraphQL", async () => {

      const query = `
        mutation ($channel_id: ID!, $tier: Int!, $extra: Int!) {
          createSubscription (channel_id: $channel_id, tier: $tier, extra: $extra) {
            subscription_id
          }
        }
      `;

      const vars = {
        channel_id: global.channels._1.object.channel_id,
        extra: 2000,
        tier: 3
      };

      const ctx = {
        subscriber_id: global.subscribers._1.object.subscriber_id,
        ip_address: "127.0.0.1"
      };

      const result = await graphql(schema, query, null, ctx, vars);

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      const subscription_id = result.data.createSubscription.subscription_id;
      expect(subscription_id).to.be.a("string");
    });


    it("should create a new subscription object in DynamoDB", async () => {

      const expected = {
        channel_id: global.channels._1.object.channel_id,
        extra: 2000,
        subscriber_id: global.subscribers._1.object.subscriber_id,
        tier: 3
      };

      const {
        Items: subscriptions
      } = await DynamoDB.scan({
        TableName: process.env.DYNAMODB_TABLE_SUBSCRIPTIONS
      }).promise();

      // Expect the table to have one subscription object.

      expect(subscriptions.length).to.equal(1);

      // Expect "deep.equal", except the values we don't know beforehand.

      const subscription = subscriptions[0];
      global.subscribers._1.subscriptions._1 = Object.assign({}, subscription);

      delete subscription.subscription_id;
      delete subscription.time_created;

      expect(global.subscribers._1.subscriptions._1.subscription_id).to.be.a("string");
      expect(global.subscribers._1.subscriptions._1.time_created).to.be.a("number");
      expect(subscription).to.deep.equal(expected);
    });


    it("should create a new subscription in Stripe", async () => {

      const {
        id: subscription_id,
        customer: customer_id,
        items: {
          data: subscription_items
        },
        canceled_at
      } = await stripe.subscriptions.retrieve(`sub_${global.subscribers._1.subscriptions._1.subscription_id}`);

      const [
        {
          plan: {
            id: plan_id
          },
          quantity: tier
        },
        {
          plan: {
            id: plan_id_extra
          },
          quantity: extra
        }
      ] = subscription_items;

      const actual = {
        canceled_at,
        customer_id,
        extra,
        plan_id,
        plan_id_extra,
        tier,
        subscription_id
      };

      const expected = {
        canceled_at:       null,
        customer_id:       `cus_${global.subscribers._1.object.subscriber_id}`,
        extra:             2000,
        plan_id:           global.channels._1.object.plan_id,
        plan_id_extra:     "plan_extra",
        tier:              3,
        subscription_id:   `sub_${global.subscribers._1.subscriptions._1.subscription_id}`
      };

      expect(expected).to.deep.equal(actual);
      expect(subscription_items.length).to.equal(2);
    });
  });


  describe("mutation: createSubscription (syndicate)", function() {


    it("should return subscription_id from GraphQL", async () => {

      const query = `
        mutation ($syndicate_id: ID!, $tier: Int!, $extra: Int!) {
          createSubscription (syndicate_id: $syndicate_id, tier: $tier, extra: $extra) {
            subscription_id
          }
        }
      `;

      const vars = {
        extra: 1000,
        syndicate_id: global.syndicates._1.object.syndicate_id,
        tier: 2
      };

      const ctx = {
        subscriber_id: global.subscribers._1.object.subscriber_id,
        ip_address: "127.0.0.1"
      };

      const result = await graphql(schema, query, null, ctx, vars);

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      const subscription_id = result.data.createSubscription.subscription_id;
      expect(subscription_id).to.be.a("string");
    });


    it("should create a new subscription object in DynamoDB", async () => {

      const expected = {
        subscriber_id: global.subscribers._1.object.subscriber_id,
        syndicate_id: global.syndicates._1.object.syndicate_id,
        extra: 1000,
        tier: 2
      };

      const {
        Items: subscriptions
      } = await DynamoDB.scan({
        TableName: process.env.DYNAMODB_TABLE_SUBSCRIPTIONS
      }).promise();

      // Expect the table to have two subscription objects.

      expect(subscriptions.length).to.equal(2);

      // Expect "deep.equal", except the values we don't know beforehand.

      const subscription = subscriptions[0].syndicate_id ? subscriptions[0] : subscriptions[1];
      global.subscribers._1.subscriptions._2 = Object.assign({}, subscription);

      delete subscription.subscription_id;
      delete subscription.time_created;

      expect(global.subscribers._1.subscriptions._2.subscription_id).to.be.a("string");
      expect(global.subscribers._1.subscriptions._2.time_created).to.be.a("number");
      expect(subscription).to.deep.equal(expected);
    });

    it("should create a new subscription in Stripe", async () => {

      const {
        id: subscription_id,
        customer: customer_id,
        items: {
          data: subscription_items
        },
        canceled_at
      } = await stripe.subscriptions.retrieve(`sub_${global.subscribers._1.subscriptions._2.subscription_id}`);

      const [
        {
          plan: {
            id: plan_id
          },
          quantity: tier
        },
        {
          plan: {
            id: plan_id_extra
          },
          quantity: extra
        }
      ] = subscription_items;

      const actual = {
        canceled_at,
        customer_id,
        extra,
        plan_id,
        plan_id_extra,
        tier,
        subscription_id
      };

      const expected = {
        canceled_at:       null,
        customer_id:       `cus_${global.subscribers._1.object.subscriber_id}`,
        extra:             1000,
        plan_id:           global.syndicates._1.object.plan_id,
        plan_id_extra:     "plan_extra",
        tier:              2,
        subscription_id:   `sub_${global.subscribers._1.subscriptions._2.subscription_id}`
      };

      expect(actual).to.deep.equal(expected);
      expect(subscription_items.length).to.equal(2);
    });
  });
});
