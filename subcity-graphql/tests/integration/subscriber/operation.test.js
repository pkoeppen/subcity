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



describe("Subscriber settings", () => {


  describe("mutation: updateSubscriber", () => {


    it("should return channel_id from GraphQL", async () => {

      const query = `
        mutation ($data: SubscriberInput!) {
          updateSubscriber (data: $data) {
            subscriber_id
          }
        }
      `;

      const vars = {
        data: {        
          address: {
            city: "Helena",
            country: "US",
            first_name: "Sum Yung",
            last_name: "Gai",
            line_1: "123 Foobar Lane",
            line_2: null,
            postal_code: "12345",
            state: "Montana"
          },
          alias: "Vlad the Impaler",
          email: "subscriber.0.updated@gmail.com",
          password: "H4xx0rz666"
        }
      };

      const ctx = {
        subscriber_id: global.subscribers._1.object.subscriber_id,
        ip_address: "127.0.0.1"
      };

      const expected = {
        data: {
          updateSubscriber: {
            subscriber_id: global.subscribers._1.object.subscriber_id
          }
        }
      };

      const result = await graphql(schema, query, null, ctx, vars);

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      expect(result).to.deep.equal(expected);
    });


    it("should update the subscriber object in DynamoDB", async () => {

      const expected = {
        address: {
          city: "Helena",
          country: "US",
          first_name: "Sum Yung",
          last_name: "Gai",
          line_1: "123 Foobar Lane",
          line_2: null,
          postal_code: "12345",
          state: "Montana"
        },
        alias: "Vlad the Impaler",

        // Note: Email will be updated when subscriber clicks
        // email link confirming the email address.

        email: "subscriber.0@foobar.com",
        subscriber_id: global.subscribers._1.object.subscriber_id,
        time_created:  global.subscribers._1.object.time_created
      };

      // Get the updated subscriber object.

      const {
        Item: subscriber
      } = await DynamoDB.get({
        TableName: process.env.DYNAMODB_TABLE_SUBSCRIBERS,
        Key: { subscriber_id: global.subscribers._1.object.subscriber_id }
      }).promise();

      global.subscribers._1.object = Object.assign({}, subscriber);

      delete subscriber.time_updated;

      expect(global.subscribers._1.object.time_updated).to.be.a("number");
      expect(subscriber).to.deep.equal(expected);  
    });
  });


  describe("mutation: createSource", () => {


    it("should return true from GraphQL", async () => {

      const query = `
        mutation ($token: ID!) {
          createSource (token: $token)
        }
      `;

      const vars = {
        token: "tok_mastercard"
      };

      const ctx = {
        subscriber_id: global.subscribers._1.object.subscriber_id,
        ip_address: "127.0.0.1"
      };

      const expected = {
        data: {
          createSource: true
        }
      };

      const result = await graphql(schema, query, null, ctx, vars);

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      expect(result).to.deep.equal(expected);
    });


    it("should add a new source to the Stripe customer", async () => {

      const {
        sources: {
          data: sources
        }
      } = await stripe.customers.retrieve(`cus_${global.subscribers._1.object.subscriber_id}`);

      expect(sources.length).to.equal(2);
    });
  });


  describe("mutation: setDefaultSource", () => {


    before(async function () {

      const {
        sources: {
          data: sources
        }
      } = await stripe.customers.retrieve(`cus_${global.subscribers._1.object.subscriber_id}`);

      global.subscribers._1.sources._1 = sources[0];
      global.subscribers._1.sources._2 = sources[1];
    });


    it("should return true from GraphQL", async () => {

      const query = `
        mutation ($source_id: ID!) {
          setDefaultSource (source_id: $source_id)
        }
      `;

      const vars = {
        source_id: global.subscribers._1.sources._2.id
      };

      const ctx = {
        subscriber_id: global.subscribers._1.object.subscriber_id,
        ip_address: "127.0.0.1"
      };

      const expected = {
        data: {
          setDefaultSource: true
        }
      };

      const result = await graphql(schema, query, null, ctx, vars);

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      expect(result).to.deep.equal(expected);
    });


    it("should set the Stripe customer's default source", async () => {

      const {
        default_source
      } = await stripe.customers.retrieve(`cus_${global.subscribers._1.object.subscriber_id}`);

      expect(default_source).to.equal(global.subscribers._1.sources._2.id);
    });
  });


  describe("mutation: deleteSource", () => {


    it("should return true from GraphQL", async () => {

      const query = `
        mutation ($source_id: ID!) {
          deleteSource (source_id: $source_id)
        }
      `;

      const vars = {
        source_id: global.subscribers._1.sources._2.id
      };

      const ctx = {
        subscriber_id: global.subscribers._1.object.subscriber_id,
        ip_address: "127.0.0.1"
      };

      const expected = {
        data: {
          deleteSource: true
        }
      };

      const result = await graphql(schema, query, null, ctx, vars);

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      expect(result).to.deep.equal(expected);
    });


    it("should delete the source from Stripe", async () => {

      const {
        sources: {
          data: sources
        }
      } = await stripe.customers.retrieve(`cus_${global.subscribers._1.object.subscriber_id}`);

      expect(sources.length).to.equal(1);
    });
  });


  describe("mutation: cancelAllSubscriptions", () => {

  });


  describe("mutation: deleteSubscriber", () => {

  });
});


describe("Subscriptions", () => {


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


    before(async function() {

      // Delete channel subscription.

      await stripe.subscriptions.del(`sub_${global.subscribers._1.subscriptions._1.subscription_id}`);
      await DynamoDB.delete({
        TableName: process.env.DYNAMODB_TABLE_SUBSCRIPTIONS,
        Key: {
          subscriber_id: global.subscribers._1.object.subscriber_id,
          subscription_id: global.subscribers._1.subscriptions._1.subscription_id
        }
      }).promise();
    });


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

      // Expect the table to have one subscription object.

      expect(subscriptions.length).to.equal(1);

      // Expect "deep.equal", except the values we don't know beforehand.

      const subscription = subscriptions[0];
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
