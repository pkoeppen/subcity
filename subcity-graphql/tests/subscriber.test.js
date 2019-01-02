require("../../shared/lib/load-env")("dev").__load__();


////////////////////////////////////////////////////////////
/////////////////////////// UTIL ///////////////////////////
////////////////////////////////////////////////////////////


const clear = require("./clear");
const request = require("request");
const fs = require("fs");
const {
  DynamoDB,
  getAuth0User,
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
  makeExecutableSchema,
  addMockFunctionsToSchema,
  mockServer
} = require("graphql-tools");

const {
  graphql,
  printSchema,
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString
} = require("graphql");

const schema = require("../schema");


////////////////////////////////////////////////////////////
////////////////////////// TESTS ///////////////////////////
////////////////////////////////////////////////////////////


/*

TODO
- Patron limit
- Shipping address
- Tracked benefits


channels
syndicates
payment
- small analytics /  total spend
- card
general
- shipping address
- email
- password
- delete account
- cancel all subscriptions


creation
operation
deletion

*/


before(async function () {
  return
  // Clear.

  await Promise.all([
    clear.auth0(),
    clear.subscribers()
  ]);

  // Get the channel_id and plan_id.

  const params_1 = {
    TableName: process.env.DYNAMODB_TABLE_CHANNELS
  };

  await DynamoDB.scan(params_1).promise()
  .then(({ Items: channels }) => {

    global.channels._1.channel_id = channels[0].channel_id;
    global.channels._1.plan_id = channels[0].plan_id;
  });

  // Get the syndicate_id and plan_id.

  const params_2 = {
    TableName: process.env.DYNAMODB_TABLE_SYNDICATES
  };

  await DynamoDB.scan(params_2).promise()
  .then(({ Items: syndicates }) => {

    global.syndicates._1.syndicate_id = syndicates[0].syndicate_id;
    global.syndicates._1.plan_id = syndicates[0].plan_id;
  });
});


describe("Subscriber creation", function() {


  describe("mutation: initializeSubscriber", function() {


    // TODO: test rollback


    it("should return subscriber_id from GraphQL", async () => {

      const query = `
        mutation ($data: InitializeSubscriberInput!) {
          initializeSubscriber (data: $data) {
            subscriber_id
          }
        }
      `;

      const vars = {
        data: {
          email: "subscriber.0@foobar.com",
          password: "$FooBar123",
          token_id: "tok_visa"
        }
      };

      const ctx = {
        ip_address: "127.0.0.1"
      };

      const result = await graphql(schema, query, null, ctx, vars);

      global.subscribers._1.subscriber_id = result.data.initializeSubscriber.subscriber_id;
      expect(global.subscribers._1.subscriber_id).to.be.a("string");
    });


    it("should create a new customer in Stripe", async function() {

      return expect(stripe.customers.retrieve(`cus_${global.subscribers._1.subscriber_id}`)).to.be.fulfilled;
    });


    it("should create a new user in Auth0", async function() {

      const expected_Auth0 = {
        email: "subscriber.0@foobar.com",
        user_id: `auth0|cus_${global.subscribers._1.subscriber_id}`,
        app_metadata: {
          roles: ["subscriber"]
        }
      };

      const {
        email,
        user_id,
        app_metadata
      } = await getAuth0User(`auth0|cus_${global.subscribers._1.subscriber_id}`);

      const actual_Auth0 = {
        email,
        user_id,
        app_metadata
      };

      expect(actual_Auth0).to.deep.equal(expected_Auth0);
    });


    it("should create a new subscriber object in DynamoDB", async () => {

      const expected = {
        subscriber_id: global.subscribers._1.subscriber_id,
        time_updated: 0
      };

      const {
        Items: subscribers
      } = await DynamoDB.scan({
        TableName: process.env.DYNAMODB_TABLE_SUBSCRIBERS
      }).promise();

      // Expect the table to have one subscriber object.

      expect(subscribers.length).to.equal(1);

      // Expect "deep.equal", except the values we don't know beforehand.

      const actual = subscribers[0];
      const {
        time_created
      } = actual;

      delete actual.time_created;

      expect(time_created).to.be.a("number");
      expect(actual).to.deep.equal(expected);
    });
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
        channel_id: global.channels._1.channel_id,
        extra: 2000,
        tier: 3
      };

      const ctx = {
        subscriber_id: global.subscribers._1.subscriber_id,
        ip_address: "127.0.0.1"
      };

      const result = await graphql(schema, query, null, ctx, vars);

      global.subscribers._1.subscriptions._1.subscription_id = result.data.createSubscription.subscription_id;
      expect(global.subscribers._1.subscriptions._1.subscription_id).to.be.a("string");
    });


    it("should create a new subscription object in DynamoDB", async () => {

      const {
        Item: subscription
      } = await DynamoDB.get({
        TableName: process.env.DYNAMODB_TABLE_SUBSCRIPTIONS,
        Key: {
          subscriber_id: global.subscribers._1.subscriber_id,
          subscription_id: global.subscribers._1.subscriptions._1.subscription_id
        }
      }).promise();

      const {
        time_created
      } = subscription;

      expect(time_created).to.be.a("number");
      expect(subscription).to.be.an("object");
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
            id: plan_id_arbitrary
          },
          quantity: extra
        }
      ] = subscription_items;

      const actual = {
        canceled_at,
        customer_id,
        extra,
        plan_id,
        plan_id_arbitrary,
        tier,
        subscription_id
      };

      const expected = {
        canceled_at:       null,
        customer_id:       `cus_${global.subscribers._1.subscriber_id}`,
        extra:             2000,
        plan_id:           global.channels._1.plan_id,
        plan_id_arbitrary: "plan_arbitrary",
        tier:              3,
        subscription_id:   `sub_${global.subscribers._1.subscriptions._1.subscription_id}`
      };

      expect(actual).to.deep.equal(expected);
      expect(subscription_items.length).to.equal(2);
    });
  });
return

  describe("mutation: deleteSubscription (channel)", function() {

    it("should return true from GraphQL", async () => {

      const query = `
        mutation ($subscription_id: ID!) {
          deleteSubscription (subscription_id: $subscription_id)
        }
      `;

      const vars = {
        subscription_id: global.subscribers._1.subscriptions._1.subscription_id
      };

      const ctx = {
        subscriber_id: global.subscribers._1.subscriber_id,
        ip_address: "127.0.0.1"
      };

      const expected = {
        data: {
          deleteSubscription: true
        }
      };

      const result = await graphql(schema, query, null, ctx, vars);
      expect(result).to.deep.equal(expected);
    });

    it("should delete the subscription object from DynamoDB", async () => {

      const {
        Item: subscription
      } = await DynamoDB.get({
        TableName: process.env.DYNAMODB_TABLE_SUBSCRIPTIONS,
        Key: {
          subscriber_id: global.subscribers._1.subscriber_id,
          subscription_id: global.subscribers._1.subscriptions._1.subscription_id
        }
      }).promise();

      expect(subscription).to.be.an("undefined");
    });

    it("should cancel the Stripe subscription", async () => {

      const {
        canceled_at
      } = await stripe.subscriptions.retrieve(`sub_${global.subscribers._1.subscriptions._1.subscription_id}`);

      expect(canceled_at).to.be.a("number");
    });
  });


  describe("mutation: createSubscription (syndicate)", function() {

    it("should return subscription_id from GraphQL", async () => {

      const query = `
        mutation ($syndicate_id: ID!, $tier: Int!) {
          createSubscription (syndicate_id: $syndicate_id, tier: $tier) {
            subscription_id
          }
        }
      `;

      const vars = {
        extra: 0,
        syndicate_id: global.syndicates._1.syndicate_id,
        tier: 3
      };

      const ctx = {
        subscriber_id: global.subscribers._1.subscriber_id,
        ip_address: "127.0.0.1"
      };

      const result = await graphql(schema, query, null, ctx, vars);

      global.subscribers._1.subscriptions._2.subscription_id = result.data.createSubscription.subscription_id;
      expect(global.subscribers._1.subscriptions._2.subscription_id).to.be.a("string");
    });

    it("should create a new subscription object in DynamoDB", async () => {

      const {
        Item: subscription
      } = await DynamoDB.get({
        TableName: process.env.DYNAMODB_TABLE_SUBSCRIPTIONS,
        Key: {
          subscriber_id: global.subscribers._1.subscriber_id,
          subscription_id: global.subscribers._1.subscriptions._2.subscription_id
        }
      }).promise();

      const {
        time_created
      } = subscription;

      expect(time_created).to.be.a("number");
      expect(subscription).to.be.an("object");
    });

    it("should create a new subscription in Stripe", async () => {

      const {
        id: subscription_id,
        customer: customer_id,
        items: {
          data: subscription_items
        },
        plan: {
          id: plan_id
        },
        quantity: tier,
        canceled_at
      } = await stripe.subscriptions.retrieve(`sub_${global.subscribers._1.subscriptions._2.subscription_id}`);

      const actual = {
        customer_id,
        plan_id,
        tier,
        subscription_id
      };

      const expected = {
        customer_id: `cus_${global.subscribers._1.subscriber_id}`,
        plan_id: global.syndicates._1.plan_id,
        tier: 3,
        subscription_id: `sub_${global.subscribers._1.subscriptions._2.subscription_id}`
      };

      expect(actual).to.deep.equal(expected);
      expect(subscription_items.length).to.equal(1);
      expect(subscription_items[0].plan.id).to.equal(global.syndicates._1.plan_id);
    });
  });


  describe("mutation: deleteSubscription (syndicate)", function() {

    it("should return true from GraphQL", async () => {

      const query = `
        mutation ($subscription_id: ID!) {
          deleteSubscription (subscription_id: $subscription_id)
        }
      `;

      const vars = {
        subscription_id: global.subscribers._1.subscriptions._2.subscription_id
      };

      const ctx = {
        subscriber_id: global.subscribers._1.subscriber_id,
        ip_address: "127.0.0.1"
      };

      const expected = {
        data: {
          deleteSubscription: true
        }
      };

      const result = await graphql(schema, query, null, ctx, vars);
      expect(result).to.deep.equal(expected);
    });

    it("should delete the subscription object from DynamoDB", async () => {

      const {
        Item: subscription
      } = await DynamoDB.get({
        TableName: process.env.DYNAMODB_TABLE_SUBSCRIPTIONS,
        Key: {
          subscriber_id: global.subscribers._1.subscriber_id,
          subscription_id: global.subscribers._1.subscriptions._2.subscription_id
        }
      }).promise();

      expect(subscription).to.be.an("undefined");
    });

    it("should cancel the Stripe subscription", async () => {

      const {
        canceled_at
      } = await stripe.subscriptions.retrieve(`sub_${global.subscribers._1.subscriptions._2.subscription_id}`);

      expect(canceled_at).to.be.a("number");
    });
  });
});


describe("Subscriber settings (subscriber)", function() {

  describe("mutation: udpateSubscriber", function() {



  });
});

describe("Subscriber settings (payment)", function() {

  describe("mutation: updatePaymentMethod", function() {

    // What is even supposed to go on this page?

  });


  describe("mutation: removePaymentMethod", function() {

    // Same as deleting account

  });
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
