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


describe("Subscriber deletion", function() {


  before(async function () {

    // Delete first channel membership to syndicate.

    await DynamoDB.delete({
      TableName: process.env.DYNAMODB_TABLE_MEMBERSHIPS,
      Key: {
        channel_id: global.channels._1.object.channel_id,
        syndicate_id: global.syndicates._1.object.syndicate_id
      }
    }).promise();

    // Create channel subscription.

    const params = {
      customer: `cus_${global.subscribers._1.object.subscriber_id}`,
      items: [{ plan: global.channels._1.object.plan_id }]
    };

    const {
      id: subscription_id
    } = await stripe.subscriptions.create(params);

    const subscription = {
      channel_id: global.channels._1.object.channel_id,
      subscriber_id: global.subscribers._1.object.subscriber_id,
      subscription_id: subscription_id.replace("sub_", ""),
      tier: 3,
      time_created: Date.now()
    };

    await DynamoDB.put({
      TableName: process.env.DYNAMODB_TABLE_SUBSCRIPTIONS,
      Item: subscription
    }).promise();

    global.subscribers._1.subscriptions._2 = Object.assign({}, subscription);
  });


  describe("mutation: deleteSubscription (channel)", function() {


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
        subscriber_id: global.subscribers._1.object.subscriber_id,
        ip_address: "127.0.0.1"
      };

      const expected = {
        data: {
          deleteSubscription: true
        }
      };

      const result = await graphql(schema, query, null, ctx, vars);

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      expect(result).to.deep.equal(expected);
    });


    it("should delete the subscription object from DynamoDB", async () => {

      const {
        Item: subscription
      } = await DynamoDB.get({
        TableName: process.env.DYNAMODB_TABLE_SUBSCRIPTIONS,
        Key: {
          subscriber_id: global.subscribers._1.object.subscriber_id,
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


  describe("mutation: deleteSubscription (syndicate)", function() {


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
        subscriber_id: global.subscribers._1.object.subscriber_id,
        ip_address: "127.0.0.1"
      };

      const expected = {
        data: {
          deleteSubscription: true
        }
      };

      const result = await graphql(schema, query, null, ctx, vars);

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      expect(result).to.deep.equal(expected);
    });


    it("should delete the subscription object from DynamoDB", async () => {

      const {
        Item: subscription
      } = await DynamoDB.get({
        TableName: process.env.DYNAMODB_TABLE_SUBSCRIPTIONS,
        Key: {
          subscriber_id: global.subscribers._1.object.subscriber_id,
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


  describe("mutation: deleteSubscriber", function() {


    it("should return true from GraphQL", async () => {

      const query = `
        mutation {
          deleteSubscriber
        }
      `;

      const ctx = {
        subscriber_id: global.subscribers._1.object.subscriber_id,
        ip_address: "127.0.0.1"
      };

      const expected = {
        data: {
          deleteSubscriber: true
        }
      };

      const result = await graphql(schema, query, null, ctx, null);

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      expect(result).to.deep.equal(expected);
    });


    it("should delete all subscriptions from DynamoDB", async () => {

      const {
        Items: subscriptions
      } = await DynamoDB.scan({
        TableName: process.env.DYNAMODB_TABLE_SUBSCRIPTIONS
      }).promise();

      expect(subscriptions.length).to.equal(0);
    });


    it("should delete all subscriptions in Stripe", async () => {

      const {
        data: subscriptions
      } = await stripe.subscriptions.list();

      expect(subscriptions.length).to.equal(0);
    });


    it("should delete the customer from Stripe", async () => {

      const {
        deleted
      } = await stripe.customers.retrieve(`cus_${global.subscribers._1.object.subscriber_id}`);

      return expect(deleted).to.equal(true);
    });


    it("should delete the user from Auth0", async () => {

      return expect(getAuth0User(`auth0|cus_${global.subscribers._1.object.subscriber_id}`)).to.be.rejected;
    });


    it("should delete the subscriber from DynamoDB", async () => {

      const {
        Item: subscriber
      } = await DynamoDB.get({
        TableName: process.env.DYNAMODB_TABLE_SUBSCRIBERS,
        Key: {
          subscriber_id: global.subscribers._1.object.subscriber_id
        }
      }).promise();

      expect(subscriber).to.be.an("undefined");
    });
  });
});
