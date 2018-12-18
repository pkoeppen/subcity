require("../../shared/lib/load-env")("dev").__load__();

////////////////////////////////////////////////////////////
/////////////////////////// UTIL ///////////////////////////
////////////////////////////////////////////////////////////

const clear = require("./clear");

const {
  forIn
} = require("lodash");

const {
  DynamoDB,
  S3
} = require("../../shared");


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

const typeDefinitions  = printSchema(schema);
const executableSchema = makeExecutableSchema({ typeDefs: typeDefinitions });
const server           = mockServer(typeDefinitions);

// addMockFunctionsToSchema({
//   schema,
//   mocks: {
//     Boolean: () => false,
//     ID:      () => "__ID__",
//     Int:     () => 1,
//     Float:   () => 9.99,
//     String:  () => "__STRING__"
//   }
// });


////////////////////////////////////////////////////////////
////////////////////////// TESTS ///////////////////////////
////////////////////////////////////////////////////////////


// - Seed with initial tokens
// - Test everything

// (x2)

// ### CHANNEL SIGNUP
// getSignupToken                 (test: token exists)
// channelSignup                  (test: channel exists in DB)
// updateChannel / getUploadURL   (test: updates exist in DB, uploads exist in S3)

// ### UPDATE CHANNEL
// updateChannelPaymentSettings   (test: updates exist in Stripe)
// createRelease / getUploadURL   (test: release exists in DB, uploads exist in S3)
// updateRelease                  (test: updates exist in DB, uploads exist in S3)

// ### CREATE SYNDICATE
// createSyndicate / getUploadURL (test: release exists in DB, uploads exist in S3)

// ### CREATE/IMPLEMENT PROPOSAL
// createProposal                 (test: proposal exists in DB, uploads exist in S3)
// submitProposalVote             (test: changes applied to syndicate in DB)

// ### SUBSCRIBER SIGNUP
// subscriberSignup               (test: subscriber exists in DB)

// ### SUBSCRIBE TO CHANNEL
// modifySubscription             (test: subscription to channel-0 exists in DB, payment history exists)

// ### UNSUBSCRIBE FROM CHANNEL
// modifySubscription             (test: subscription to channel-0 removed from DB)

// ### SUBSCRIBE TO SYNDICATE (that contains a channel to which the subscriber is already subscribed)
// modifySubscription             (resubscribe to channel-0)
// modifySubscription             (test: subscription to syndicate-0 exists in DB, subscription to channel-0 removed, payment history exists)

// ### INVITE CHANNEL
// createProposal                 (test: proposal exists in DB)
// submitProposalVote             (test: invite message exists in DB)
// respondToSyndicateInvite       (test: membership exists in DB) (change to joinSyndicate, vetted by invitation token?)

// ### MERGE SYNDICATE
// createProposal                 (test: proposal exists in DB)
// submitProposalVote             (test: proposal exists in DB)
// submitProposalVote             (test: updates exist in DB)

// ### LEAVE SYNDICATE
// leaveSyndicate                 (test: membership removed from DB)

// ### DISSOLVE SYNDICATE
// createProposal                 (test: proposal exists in DB)
// submitProposalVote             (test: memberships "active" set to false, syndicate "dissolved" set to true, slug removed from DB, subscriptions cancelled)

before(async function() {

  // Clear everything.

  await clear();

  // Seed signup tokens.

  const requests = [
    "token_0",
    "token_1",
    "token_2"
  ].map(token_id => ({
    PutRequest: {
      Item: {
        token_id,
        pin: 1234
      }
    }
  }));

  const params = {
    RequestItems: {
      [process.env.DYNAMODB_TABLE_TOKENS]: requests
    }
  };
  
  await DynamoDB.batchWrite(params).promise();

  // Make sure the schema isn't goofy.

  describe("Schema", function() {

    it("should have valid type definitions", function() {
      expect(async () => {
        await server.query(`{ __schema { types { name }}}`);
      }).to.not.throw();
    });

  });
});


describe("Channel Signup", function() {

  describe("getSignupToken", function() {

    const query = `
      query($token_id: ID!) {
        assertTokenExists(token_id: $token_id)
      }
    `;

    const ctx = {
      ip_address: "127.0.0.1"
    };

    const vars = {
      token_id: "token_0"
    };

    const expected = {
      data: {
        assertTokenExists: true
      }
    };

    it("should return true (that the signup token exists)", async () => {
      const actual = await graphql(schema, query, null, ctx, vars);
      expect(actual).to.deep.equal(expected);
    });
  });

  describe("channelSignup", function() {

    const query = `
      mutation($data: InitializeChannelInput!) {
        initializeChannel(data: $data)
      }
    `;

    const ctx = {
      ip_address: "127.0.0.1"
    };

    const vars = {
      data: {
        account_number:     "000123456789",
        city:               "San Francisco",
        country:            "US",
        dob:                "1999-12-31",
        email:              "channel.0@foobar.com",
        first_name:         "John",
        last_name:          "Smith",
        line1:              "123 Foobar Lane",
        password:           "$FooBar123",
        personal_id_number: "999999999",
        pin:                1234,
        postal_code:        "94117",
        routing_number:     "110000000",
        state:              "California",
        token_id:           "token_0"
      }
    };

    const expected = {
      data: {
        initializeChannel: true
      }
    };

    it("should successfully sign up a new channel", async () => {
      const actual = await graphql(schema, query, null, ctx, vars);
      expect(actual).to.deep.equal(expected);
    });

    it("should expend the signup token", async () => {
      const { Item: token } = await DynamoDB.get({
        TableName: process.env.DYNAMODB_TABLE_TOKENS,
        Key: {
          token_id: "token_0"
        }
      }).promise();
      expect(token).to.be.an("undefined");
    });

  });
});
