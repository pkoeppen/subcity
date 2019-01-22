////////////////////////////////////////////////////////////
/////////////////////////// UTIL ///////////////////////////
////////////////////////////////////////////////////////////


const {
  DynamoDB,
  getPlansByProductID,
  getSubscriptionsByProductID,
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


describe("Syndicate dissolution", function() {


  describe("mutation: createProposal (dissolve)", function() {


    it("should return time_created from GraphQL", async () => {

      const query = `
        mutation ($data: ProposalInput!) {
          createProposal (data: $data) {
            time_created
          }
        }
      `;

      const vars = {
        data: {
          syndicate_id: global.syndicates._1.object.syndicate_id,
          type: "dissolve"
        }
      };

      const ctx = {
        channel_id: global.channels._2.object.channel_id,
        ip_address: "127.0.0.1"
      };

      const result = await graphql(schema, query, null, ctx, vars);

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      const time_created = result.data.createProposal.time_created;
      expect(time_created).to.be.a("number");
    });


    it("should create a proposal object in DynamoDB", async () => {

      const expected = {
        stage: "pending",
        syndicate_id: global.syndicates._1.object.syndicate_id,
        type: "dissolve",
        votes: []
      };

      const {
        Items: proposals
      } = await DynamoDB.scan({
        TableName: process.env.DYNAMODB_TABLE_PROPOSALS
      }).promise();

      const proposal = proposals.pop();
      global.syndicates._1.proposals._1 = Object.assign({}, proposal);

      delete proposal.time_created;

      expect(proposal).to.deep.equal(expected); 
    });
  });


  describe("mutation: castVote (dissolve)", function() {


    it("should return time_created from GraphQL", async () => {

      const query = `
        mutation ($data: VoteInput!) {
          castVote (data: $data) {
            time_created
          }
        }
      `;

      const vars = {
        data: {
          syndicate_id: global.syndicates._1.object.syndicate_id,
          time_created: global.syndicates._1.proposals._1.time_created,
          vote: true
        }
      };

      const ctx = {
        channel_id: global.channels._2.object.channel_id,
        ip_address: "127.0.0.1"
      };

      const expected = {
        data: {
          castVote: {
            time_created: global.syndicates._1.proposals._1.time_created
          }
        }
      };

      const result = await graphql(schema, query, null, ctx, vars);

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      expect(result).to.deep.equal(expected);
    });


    it("should delete the syndicate's slug from DynamoDB", async () => {

      const { Items: slugs } = await DynamoDB.query({
        TableName: process.env.DYNAMODB_TABLE_SLUGS,
        IndexName: `${process.env.DYNAMODB_TABLE_SLUGS}-GSI-2`,
        KeyConditionExpression: "syndicate_id = :syndicate_id",
        ExpressionAttributeValues: {
          ":syndicate_id": global.syndicates._1.object.syndicate_id
        }
      }).promise();

      expect(slugs.length).to.equal(0);
    });


    it("should delete the syndicate's memberships from DynamoDB", async () => {

      const { Items: memberships } = await DynamoDB.query({
        TableName: process.env.DYNAMODB_TABLE_MEMBERSHIPS,
        IndexName: `${process.env.DYNAMODB_TABLE_MEMBERSHIPS}-GSI`,
        KeyConditionExpression: "syndicate_id = :syndicate_id",
        ExpressionAttributeValues: {
          ":syndicate_id": global.syndicates._1.object.syndicate_id
        }
      }).promise();

      expect(memberships.length).to.equal(0);
    });


    it("should delete the channel's subscriptions from DynamoDB", async () => {

      const { Items: subscriptions } = await DynamoDB.query({
        TableName: process.env.DYNAMODB_TABLE_SUBSCRIPTIONS,
        IndexName: `${process.env.DYNAMODB_TABLE_SUBSCRIPTIONS}-GSI-2`,
        KeyConditionExpression: "syndicate_id = :syndicate_id",
        ExpressionAttributeValues: {
          ":syndicate_id": global.syndicates._1.object.syndicate_id
        }
      }).promise();

      expect(subscriptions.length).to.equal(0);
    });


    it("should delete the syndicate's Stripe product", async () => {

      return expect(stripe.products.retrieve(`prod_syndicate_${global.syndicates._1.object.syndicate_id}`)).to.be.rejected;
    });


    it("should delete the syndicate's Stripe plans", async () => {

      const plans = await getPlansByProductID(`prod_syndicate_${global.syndicates._1.object.syndicate_id}`);
      expect(plans.length).to.equal(0);
    });


    it("should delete the syndicate's Stripe subscriptions", async () => {

      const subscriptions = await getSubscriptionsByProductID(`prod_syndicate_${global.syndicates._1.object.syndicate_id}`);
      expect(subscriptions.length).to.equal(0);
    });


    it("should delete the syndicate's S3 content", async () => {

      const {
        Contents: contents_IN
      } = await S3.listObjects({
        Bucket: process.env.S3_BUCKET_IN,
        Prefix: `syndicates/${global.syndicates._1.object.syndicate_id}`
      }).promise();

      const {
        Contents: contents_OUT
      } = await S3.listObjects({
        Bucket: process.env.S3_BUCKET_OUT,
        Prefix: `syndicates/${global.syndicates._1.object.syndicate_id}`
      }).promise();

      expect(contents_IN.length).to.equal(0);
      expect(contents_OUT.length).to.equal(0);
    });


    it("should delete the syndicate itself from DynamoDB", async () => {

      const { Item: syndicate } = await DynamoDB.get({
        TableName: process.env.DYNAMODB_TABLE_SYNDICATES,
        Key: { syndicate_id: global.syndicates._1.object.syndicate_id }
      }).promise();

      expect(syndicate).to.be.an("undefined");
    });
  });
});
