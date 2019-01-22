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

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      const subscriber_id = result.data.initializeSubscriber.subscriber_id;
      expect(subscriber_id).to.be.a("string");
    });


    it("should create a new subscriber object in DynamoDB", async () => {

      const expected = {
        address: null,
        alias: null,
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

      const subscriber = subscribers[0];
      global.subscribers._1.object = Object.assign({}, subscriber);

      delete subscriber.email;
      delete subscriber.subscriber_id;
      delete subscriber.time_created;

      expect(global.subscribers._1.object.email).to.be.a("string");
      expect(global.subscribers._1.object.subscriber_id).to.be.a("string");
      expect(global.subscribers._1.object.time_created).to.be.a("number");
      expect(subscriber).to.deep.equal(expected);
    });


    it("should create a new customer in Stripe", async function() {

      return expect(stripe.customers.retrieve(`cus_${global.subscribers._1.object.subscriber_id}`)).to.be.fulfilled;
    });


    it("should create a new user in Auth0", async function() {

      const expected = {
        email: "subscriber.0@foobar.com",
        user_id: `auth0|cus_${global.subscribers._1.object.subscriber_id}`,
        app_metadata: {
          roles: ["subscriber"]
        }
      };

      const {
        email,
        user_id,
        app_metadata
      } = await getAuth0User(`auth0|cus_${global.subscribers._1.object.subscriber_id}`);

      const actual = {
        email,
        user_id,
        app_metadata
      };

      expect(actual).to.deep.equal(expected);
    });
  });
});
