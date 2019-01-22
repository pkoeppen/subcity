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

const schema = require("../../../schema");

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


/*

"subscriber manager" table

- subscriber name
- tier
- lifetime
- last charge
- subscription status (active|canceled|delinquent)

If charge fails, set subscriber status to "delinquent" and
disallow viewing of releases until their shit is fixed

*/


describe("Channel creation", function() {


  describe("query: assertTokenExists", function() {   


    it("should return true from GraphQL", async () => {

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

      const actual = await graphql(schema, query, null, ctx, vars);
      expect(actual).to.deep.equal(expected);
    });
  });


  describe("mutation: initializeChannel", function() {


    // TODO: test rollback


    it("should return channel_id from GraphQL", async () => {

      const query = `
        mutation($data: InitializeChannelInput!) {
          initializeChannel(data: $data) {
            channel_id
          }
        }
      `;

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

      const ctx = {
        ip_address: "127.0.0.1"
      };

      const result = await graphql(schema, query, null, ctx, vars);

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      global.channels._1.object.channel_id = result.data.initializeChannel.channel_id;
      expect(global.channels._1.object.channel_id).to.be.a("string");
    });


    it("should create a new Connect account in Stripe", async function() {

      return expect(stripe.accounts.retrieve(`acct_${global.channels._1.object.channel_id}`)).to.be.fulfilled;
    });


    it("should create a new user in Auth0", async function() {

      const expected = {
        email: "channel.0@foobar.com",
        user_id: `auth0|acct_${global.channels._1.object.channel_id}`,
        app_metadata: {
          roles: ["channel"]
        }
      };

      const {
        email,
        user_id,
        app_metadata
      } = await getAuth0User(`auth0|acct_${global.channels._1.object.channel_id}`);

      const actual = {
        email,
        user_id,
        app_metadata
      };

      expect(actual).to.deep.equal(expected);
    });


    it("should create a new channel object in DynamoDB", async () => {

      const expected = {
        description: null,
        links: {
          discord: null,
          facebook: null,
          instagram: null,
          twitch: null,
          twitter: null,
          youtube: null,
        },
        overview: null,
        payload: null,
        tiers: {
          _1: {
            active: true,
            title: null,
            description: {
              raw: null,
              rendered: null
            },
            rate: 499
          },
          _2: {
            active: false,
            title: null,
            description: {
              raw: null,
              rendered: null
            },
            rate: 499
          },
          _3: {
            active: false,
            title: null,
            description: {
              raw: null,
              rendered: null
            },
            rate: 499
          }
        },
        time_updated: 0,
        title: null,
        funding: "per_month",
        unlisted: false
      };

      const {
        Items: channels
      } = await DynamoDB.scan({
        TableName: process.env.DYNAMODB_TABLE_CHANNELS
      }).promise();

      // Expect the table to have one channel object.

      expect(channels.length).to.equal(1);

      // Expect "deep.equal", except the values we don't know beforehand.

      const channel = channels[0];
      global.channels._1.object = Object.assign({}, channel);

      delete channel.channel_id;
      delete channel.plan_id;
      delete channel.time_created;

      expect(global.channels._1.object.channel_id).to.be.a("string");
      expect(global.channels._1.object.plan_id).to.be.a("string");
      expect(global.channels._1.object.time_created).to.be.a("number");
      expect(channel).to.deep.equal(expected);
    });


    it("should expend the signup token", async () => {

      const { Item: token } = await DynamoDB.get({
        TableName: process.env.DYNAMODB_TABLE_TOKENS,
        Key: { token_id: "token_0" }
      }).promise();

      expect(token).to.be.an("undefined");
    });

  });
});
