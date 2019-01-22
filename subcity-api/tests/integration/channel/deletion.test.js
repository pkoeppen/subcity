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


describe("Delete channel", function() {


  before(async function () {

    // Create a new subscriber.

    const {
      id: subscriber_id
    } = await stripe.customers.create({ source: "tok_mastercard" });

    const subscriber = {
      subscriber_id: subscriber_id.replace("cus_", ""),
      time_created: Date.now()
    };

    await DynamoDB.put({
      TableName: process.env.DYNAMODB_TABLE_SUBSCRIBERS,
      Item: subscriber
    }).promise();

    global.subscribers._1.object = Object.assign({}, subscriber);

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


  describe("mutation: deleteChannel", function() {


    it("should return true from GraphQL", async () => {

      const expected = {
        data: {
          deleteChannel: true
        }
      };

      const query = `
        mutation {
          deleteChannel
        }
      `;

      const ctx = {
        channel_id: global.channels._1.object.channel_id,
        ip_address: "127.0.0.1"
      };

      const result = await graphql(schema, query, null, ctx, null);

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      expect(result).to.deep.equal(expected);
    });


    it("should delete the channel's slugs from DynamoDB", async () => {

      const { Items: slugs } = await DynamoDB.query({
        TableName: process.env.DYNAMODB_TABLE_SLUGS,
        IndexName: `${process.env.DYNAMODB_TABLE_SLUGS}-GSI-1`,
        KeyConditionExpression: "channel_id = :channel_id",
        ExpressionAttributeValues: {
          ":channel_id": global.channels._1.object.channel_id
        }
      }).promise();

      expect(slugs.length).to.equal(0);
    });

    
    it("should delete the channel's invitations from DynamoDB", async () => {

      const { Items: invitations } = await DynamoDB.query({
        TableName: process.env.DYNAMODB_TABLE_INVITATIONS,
        KeyConditionExpression: "channel_id = :channel_id",
        ExpressionAttributeValues: {
          ":channel_id": global.channels._1.object.channel_id
        }
      }).promise();

      expect(invitations.length).to.equal(0);
    });


    it("should delete the channel's memberships from DynamoDB", async () => {

      const { Items: memberships } = await DynamoDB.query({
        TableName: process.env.DYNAMODB_TABLE_MEMBERSHIPS,
        KeyConditionExpression: "channel_id = :channel_id",
        ExpressionAttributeValues: {
          ":channel_id": global.channels._1.object.channel_id
        }
      }).promise();

      expect(memberships.length).to.equal(0);
    });


    it("should delete the channel's subscriptions from DynamoDB", async () => {

      const { Items: subscriptions } = await DynamoDB.query({
        TableName: process.env.DYNAMODB_TABLE_SUBSCRIPTIONS,
        IndexName: `${process.env.DYNAMODB_TABLE_SUBSCRIPTIONS}-GSI-1`,
        KeyConditionExpression: "channel_id = :channel_id",
        ExpressionAttributeValues: {
          ":channel_id": global.channels._1.object.channel_id
        }
      }).promise();

      expect(subscriptions.length).to.equal(0);
    });


    it("should delete the channel's Stripe Connect account", async () => {

      return expect(stripe.accounts.retrieve(`acct_${global.channels._1.object.channel_id}`)).to.be.rejected;
    });


    it("should delete the channel's Stripe product", async () => {

      return expect(stripe.products.retrieve(`prod_channel_${global.channels._1.object.channel_id}`)).to.be.rejected;
    });


    it("should delete the channel's Stripe plan", async () => {

      return expect(stripe.plans.retrieve(global.channels._1.object.plan_id)).to.be.rejected;
    });


    it("should delete the channel's Stripe subscriptions", async () => {

      const {
        data: subscriptions
      } = await stripe.subscriptions.list();

      return expect(subscriptions.length).to.equal(0);
    });


    it("should delete the channel's Auth0 user", async () => {

      return expect(getAuth0User(`auth0|acct_${global.channels._1.object.channel_id}`)).to.be.rejected;
    });


    it("should delete the channel's S3 content", async () => {

      const {
        Contents: contents_IN
      } = await S3.listObjects({
        Bucket: process.env.S3_BUCKET_IN,
        Prefix: `channels/${global.channels._1.object.channel_id}`
      }).promise();

      const {
        Contents: contents_OUT
      } = await S3.listObjects({
        Bucket: process.env.S3_BUCKET_OUT,
        Prefix: `channels/${global.channels._1.object.channel_id}`
      }).promise();

      expect(contents_IN.length).to.equal(0);
      expect(contents_OUT.length).to.equal(0);
    });


    it("should delete the channel itself from DynamoDB", async () => {

      const { Item: channel } = await DynamoDB.get({
        TableName: process.env.DYNAMODB_TABLE_CHANNELS,
        Key: { channel_id: global.channels._1.object.channel_id }
      }).promise();

      expect(channel).to.be.an("undefined");
    });
  });
});
