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

// Update channel/subscriber login settings
// Update subscriber contact information/address
// Channel: Enable tiers
// - Channel creates release with Tier 3, people subscribe
// - Channel disables Tier 2 and 3
// - All Tier 2 and 3 subscriptions are downgraded to Tier 1
// - Releases left at Tier 3 get icon notifying channel that no one can see them
// - Tier 1 < Tier 2 < Tier 3

// - Remove "move subscribers to new plan" option completely

/*

If channel to which a subscriber is already subscribed joins a syndicate

Subscription Object

Subscribed to channel directly:
{
  subscriber_id: "subscriber_123"
  channel_id: "channel_123",
  syndicate_id: null,
  tier: 1,
  time_created: 7898238741,
  time_updated: 7809981246
}

Subscribed to channel through syndicate:
{
  subscriber_id: "subscriber_123"
  channel_id: "channel_123",
  syndicate_id: "syndicate_123"
  tier: 1,
  time_created: 7898238741,
  time_updated: 7809981246
}

*/

// ### CHANNEL SIGNUP
// x getSignupToken                 (test: token exists)
// x channelSignup                  (test: channel exists in DB)

// ### UPDATE CHANNEL
// x updateChannel / getUploadURL   (test: updates exist in DB, uploads exist in S3)
// x updateChannelPaymentSettings   (test: updates exist in Stripe)

// ### CREATE/UPDATE RELEASE
// createRelease / getUploadURL   (test: release exists in DB, uploads exist in S3)
// updateRelease                  (test: updates exist in DB, uploads exist in S3)

// ### CREATE SYNDICATE
// createSyndicate / getUploadURL (test: release exists in DB, uploads exist in S3)

// ### invite
// createProposal                 (test: proposal exists in DB)
// submitProposalVote             (test: invite message exists in DB)
// respondToSyndicateInvite       (test: membership exists in DB) (change to joinSyndicate, vetted by invitation token?)

// ### merge
// createProposal                 (test: proposal exists in DB)
// submitProposalVote             (test: proposal exists in DB)
// submitProposalVote             (test: updates exist in DB)

// ### leave
// leaveSyndicate                 (test: membership removed from DB)

// ### dissolve
// createProposal                 (test: proposal exists in DB)
// submitProposalVote             (test: memberships "active" set to false, syndicate "dissolved" set to true, slug removed from DB, subscriptions cancelled)

// ### CREATE/APPLY PROPOSAL
// createProposal                 (test: proposal exists in DB, uploads exist in S3)
// submitProposalVote             (test: changes applied to syndicate in DB)

// ### SUBSCRIBER SIGNUP
// subscriberSignup               (test: subscriber exists in DB)

// ### subscribe to channel
// modifySubscription             (test: subscription to channel-0 exists in DB, payment history exists)

// ### unsubscribe from channel
// modifySubscription             (test: subscription to channel-0 removed from DB)

// ### subscribe to syndicate (that contains a channel to which the subscriber is already subscribed)
// modifySubscription             (resubscribe to channel-0)
// modifySubscription             (test: subscription to syndicate-0 exists in DB, subscription to channel-0 removed, payment history exists)

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

const channels = {};

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
      const {
        data: {
          initializeChannel: channel_id
        }
      } = await graphql(schema, query, null, ctx, vars);
      channels.channel_0 = channel_id;
      expect(channel_id).to.be.a("string");
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


describe("Channel Update", function() {

  describe("updateChannel", function() {

    const query = `
      mutation($data: ChannelInput!) {
        updateChannel(data: $data)
      }
    `;

    const ctx = {
      channel_id: channels.channel_0,
      ip_address: "127.0.0.1"
    };
    console.log("test channel_id\n\n\n\n", channels.channel_0)

    const vars = {
      data: {
        description: "description_0",
        unlisted:    true,
        overview:    "overview_0",
        payload_url: "payload.jpg",
        slug:        "slug-0",
        // rate:        499
        title:       "title_0",
      }
    };

    const expected = {
      data: {
        updateChannel: true
      }
    };

    it("should return true (that the signup token exists)", async () => {
      const actual = await graphql(schema, query, null, ctx, vars);
      expect(actual).to.deep.equal(expected);
    });
  });

});