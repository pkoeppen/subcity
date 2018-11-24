require("dotenv").config({ path: `${__dirname}/../../.env` });
const {
  forIn
} = require("lodash");

const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const { expect } = chai;

const {
  makeExecutableSchema,
  addMockFunctionsToSchema,
  mockServer
} = require("graphql-tools");
const { graphql, printSchema } = require("graphql");
const { DynamoDB } = require("../shared");
const schema = require("../schema");

const {
  getChannelById,
  getChannelBySlug,
  getChannelsByIdArray,
  getChannels,
  createChannel,
  updateChannel,
  getChannelPaymentSettings,
  updateChannelPaymentSettings
} = require("../resolvers").channel;


///////////////////////////////////////////////////
/////////////////////// GQL ///////////////////////
///////////////////////////////////////////////////


const typeDefsPublic  = printSchema(schema.public);
const schemaPublic    = makeExecutableSchema({ typeDefs: typeDefsPublic });
const serverPublic    = mockServer(typeDefsPublic);

addMockFunctionsToSchema({
  schema: schemaPublic,
  mocks: {
    Boolean: () => false,
    ID: () => "__ID__",
    Int: () => 1,
    Float: () => 9.99,
    String: () => "__STRING__",
  }
});

const typeDefsPrivate = printSchema(schema.private);
const schemaPrivate   = makeExecutableSchema({ typeDefs: typeDefsPrivate });
const serverPrivate   = mockServer(typeDefsPrivate);

addMockFunctionsToSchema({
  schema: schemaPrivate,
  mocks: {
    Boolean: () => false,
    ID: () => "__ID__",
    Int: () => 1,
    Float: () => 9.99,
    String: () => "__STRING__"
  }
});


///////////////////////////////////////////////////
////////////////////// TESTS //////////////////////
///////////////////////////////////////////////////


before(async function() {

  describe("Schema", function() {

    it("should have valid type definitions (public)", function() {
      expect(async () => {
        await serverPublic.query(`{ __schema { types { name }}}`);
      }).to.not.throw();
    });

    it("should have valid type definitions (private)", function() {
      expect(async () => {
        await serverPrivate.query(`{ __schema { types { name }}}`);
      }).to.not.throw();
    });

  });
});


describe("ChannelQuery: Queries", function() {


  describe("getChannelById", function() {

    let query = `
      query($channel_id: ID!) {
        getChannelById(channel_id: $channel_id) {
          channel_id,
          created_at,
          updated_at,
          profile_url,
          payload_url,
          release_count,
          earnings_month,
          earnings_total,
          subscriber_count,
          currency,
          plan_id,
          is_subscribed,
          slug,
          title,
          description,
          is_nsfw,
          is_unlisted,
          subscription_rate,
          subscriber_pays
        }
      }
    `;

    let ctx = {
      authorizer: {
        principalId: "__ID__",
        claims: {
          "http://localhost:3000/roles": ["channel"]
        }
      },
      identity: {
        sourceIp: "127.0.0.1"
      }
    };

    let variables = {
      channel_id: "__ID__"
    };

    let expected = {
      data: {
        getChannelById: {
          channel_id: "__ID__",
          created_at: "__STRING__",
          updated_at: "__STRING__",
          profile_url: "__STRING__",
          payload_url: "__STRING__",
          release_count: 1,
          earnings_month: 9.99,
          earnings_total: 9.99,
          subscriber_count: 1,
          currency: "__STRING__",
          plan_id: "__STRING__",
          is_subscribed: false,
          slug: "__STRING__",
          title: "__STRING__",
          description: "__STRING__",
          is_nsfw: false,
          is_unlisted: false,
          subscription_rate: 9.99,
          subscriber_pays: false
        }
      }
    };

    it("should return data as expected", async () => {
      let actual = await graphql(schemaPrivate, query, null, { ctx }, variables);
      expect(actual).to.deep.equal(expected);
    });

    it("should return error if sent to public endpoint", async () => {
      let actual = await graphql(schemaPublic, query, null, { ctx }, variables);
      expect(actual.errors).to.have.lengthOf(1);
    });

  });


  describe("getChannelBySlug (public)", function() {

    let query = `
      query($slug: String!) {
        getChannelBySlug(slug: $slug) {
          channel_id,
          created_at,
          updated_at,
          profile_url,
          payload_url,
          release_count,
          earnings_month,
          earnings_total,
          subscriber_count,
          currency,
          plan_id,
          is_subscribed,
          slug,
          title,
          description,
          is_nsfw,
          is_unlisted,
          subscription_rate,
          subscriber_pays
        }
      }
    `;

    let ctx = {
      identity: {
        sourceIp: "127.0.0.1"
      }
    };

    let variables = {
      slug: "__STRING__"
    };

    let expected = {
      data: {
        getChannelBySlug: {
          channel_id: "__ID__",
          created_at: "__STRING__",
          updated_at: "__STRING__",
          profile_url: "__STRING__",
          payload_url: "__STRING__",
          release_count: 1,
          earnings_month: 9.99,
          earnings_total: 9.99,
          subscriber_count: 1,
          currency: "__STRING__",
          plan_id: "__STRING__",
          is_subscribed: false,
          slug: "__STRING__",
          title: "__STRING__",
          description: "__STRING__",
          is_nsfw: false,
          is_unlisted: false,
          subscription_rate: 9.99,
          subscriber_pays: false
        }
      }
    };

    it("should return data as expected", async () => {
      let actual = await graphql(schemaPublic, query, null, { ctx }, variables);
      expect(actual).to.deep.equal(expected);
    });

  });


  describe("getChannelBySlug (private)", function() {

    let query = `
      query($channel_id: ID!, $slug: String!) {
        getChannelBySlug(channel_id: $channel_id, slug: $slug) {
          channel_id,
          created_at,
          updated_at,
          profile_url,
          payload_url,
          release_count,
          earnings_month,
          earnings_total,
          subscriber_count,
          currency,
          plan_id,
          is_subscribed,
          slug,
          title,
          description,
          is_nsfw,
          is_unlisted,
          subscription_rate,
          subscriber_pays
        }
      }
    `;

    let ctx = {
      identity: {
        sourceIp: "127.0.0.1"
      }
    };

    let variables = {
      slug: "__STRING__",
      channel_id: "__ID__"
    };

    let expected = {
      data: {
        getChannelBySlug: {
          channel_id: "__ID__",
          created_at: "__STRING__",
          updated_at: "__STRING__",
          profile_url: "__STRING__",
          payload_url: "__STRING__",
          release_count: 1,
          earnings_month: 9.99,
          earnings_total: 9.99,
          subscriber_count: 1,
          currency: "__STRING__",
          plan_id: "__STRING__",
          is_subscribed: false,
          slug: "__STRING__",
          title: "__STRING__",
          description: "__STRING__",
          is_nsfw: false,
          is_unlisted: false,
          subscription_rate: 9.99,
          subscriber_pays: false
        }
      }
    };

    it("should return data as expected", async () => {
      let actual = await graphql(schemaPrivate, query, null, { ctx }, variables);
      expect(actual).to.deep.equal(expected);
    });

    it("should return error if sent to public endpoint", async () => {
      let actual = await graphql(schemaPublic, query, null, { ctx }, variables);
      expect(actual.errors).to.have.lengthOf(1);
    });

  });


  describe("getChannelPaymentSettings", function() {

    let query = `
      query($channel_id: ID!) {
        getChannelPaymentSettings(channel_id: $channel_id) {
          first_name,
          last_name,
          country,
          city,
          line1,
          postal_code,
          state,
          dob,
          bank_name,
          routing_number,
          account_number_last4,
          payout_interval,
          payout_anchor
        }
      }
    `;

    let variables = { channel_id: "__ID__" };

    let ctx = {
      authorizer: {
        principalId: "__ID__",
        claims: {
          "http://localhost:3000/roles": ["channel"]
        }
      },
      identity: {
        sourceIp: "127.0.0.1"
      }
    };

    let expected = {
      data: {
        getChannelPaymentSettings: {
          first_name: "__STRING__",
          last_name: "__STRING__",
          country: "__STRING__",
          city: "__STRING__",
          line1: "__STRING__",
          postal_code: "__STRING__",
          state: "__STRING__",
          dob: "__STRING__",
          bank_name: "__STRING__",
          routing_number: "__STRING__",
          account_number_last4: "__STRING__",
          payout_interval: "__STRING__",
          payout_anchor: "__STRING__"
        }
      }
    };

    it("should return data as expected", async () => {
      let actual = await graphql(schemaPrivate, query, null, { ctx }, variables);
      expect(actual).to.deep.equal(expected);
    });

    it("should return error if sent to public endpoint", async () => {
      let actual = await graphql(schemaPublic, query, null, { ctx }, variables);
      expect(actual.errors.length).to.equal(1);
    });

  });
});


describe("ChannelMutation", function() {


  describe("updateChannel", function() {

    let query = `
      mutation($data: ChannelInput!) {
        updateChannel(data: $data) {
          channel_id,
          created_at,
          updated_at,
          profile_url,
          payload_url,
          release_count,
          earnings_month,
          earnings_total,
          subscriber_count,
          currency,
          plan_id,
          is_subscribed,
          slug,
          title,
          description,
          is_nsfw,
          is_unlisted,
          subscription_rate,
          subscriber_pays
        }
      }
    `;

    let ctx = {
      authorizer: {
        principalId: "__ID__",
        claims: {
          "http://localhost:3000/roles": ["channel"]
        }
      },
      identity: {
        sourceIp: "127.0.0.1"
      }
    };

    let variables = {
      data: {
        channel_id: "__ID__",
        payload_url: "__STRING__",
        slug: "__STRING__",
        title: "__STRING__",
        description: "__STRING__",
        is_nsfw: false,
        is_unlisted: false,
        subscription_rate: 9.99,
        subscriber_pays: false
      }
    };

    let expected = {
      data: {
        updateChannel: {
          channel_id: "__ID__",
          created_at: "__STRING__",
          updated_at: "__STRING__",
          profile_url: "__STRING__",
          payload_url: "__STRING__",
          release_count: 1,
          earnings_month: 9.99,
          earnings_total: 9.99,
          subscriber_count: 1,
          currency: "__STRING__",
          plan_id: "__STRING__",
          is_subscribed: false,
          slug: "__STRING__",
          title: "__STRING__",
          description: "__STRING__",
          is_nsfw: false,
          is_unlisted: false,
          subscription_rate: 9.99,
          subscriber_pays: false
        }
      }
    };

    it("should return data as expected", async () => {
      let actual = await graphql(schemaPrivate, query, null, { ctx }, variables);
      expect(actual).to.deep.equal(expected);
    });

    it("should return error if sent to public endpoint", async () => {
      let actual = await graphql(schemaPublic, query, null, { ctx }, variables);
      expect(actual.errors).to.have.lengthOf(2);
    });

  });


  describe("updateChannelPaymentSettings", function() {

    let query = `
      mutation($data: ChannelPaymentSettingsInput!) {
        updateChannelPaymentSettings(data: $data) {
          first_name,
          last_name,
          country,
          city,
          line1,
          postal_code,
          state,
          dob,
          bank_name,
          routing_number,
          account_number_last4,
          payout_interval,
          payout_anchor
        }
      }
    `;

    let variables = {
      data: {
        channel_id: "__ID__",
        first_name: "__STRING__",
        last_name: "__STRING__",
        country: "__STRING__",
        city: "__STRING__",
        line1: "__STRING__",
        postal_code: "__STRING__",
        state: "__STRING__",
        dob: "__STRING__",
        personal_id_number: "__STRING__",
        routing_number: "__STRING__",
        account_number: "__STRING__",
        payout_interval: "__STRING__",
        payout_anchor: "__STRING__"
      }
    };

    let ctx = {
      authorizer: {
        principalId: "__ID__",
        claims: {
          "http://localhost:3000/roles": ["channel"]
        }
      },
      identity: {
        sourceIp: "127.0.0.1"
      }
    };

    let expected = {
      data: {
        updateChannelPaymentSettings: {
          first_name: "__STRING__",
          last_name: "__STRING__",
          country: "__STRING__",
          city: "__STRING__",
          line1: "__STRING__",
          postal_code: "__STRING__",
          state: "__STRING__",
          dob: "__STRING__",
          bank_name: "__STRING__",
          routing_number: "__STRING__",
          account_number_last4: "__STRING__",
          payout_interval: "__STRING__",
          payout_anchor: "__STRING__"
        }
      }
    };

    it("should return data as expected", async () => {
      let actual = await graphql(schemaPrivate, query, null, { ctx }, variables);
      expect(actual).to.deep.equal(expected);
    });

    it("should return error if sent to public endpoint", async () => {
      let actual = await graphql(schemaPublic, query, null, { ctx }, variables);
      expect(actual.errors.length).to.equal(2);
    });

  });
});


describe("ChannelQuery: Resolvers", function() {

  var channel_id,
      channel_slug,
      release_id,
      release_slug,
      syndicate_id,
      syndicate_slug,
      proposal_id,
      subscriber_id;

  before(async function() {

    var params, Items;

    // Get channel.

    params = {
      TableName: process.env.DYNAMODB_TABLE_CHANNELS
    };
    ({ Items } = await DynamoDB.scan(params).promise());
    channel_id = Items[0].channel_id;
    channel_slug = Items[0].slug;
    release_id = Items[0].releases.values[0];
    syndicate_id = Items[0].syndicates.values[0];
    subscriber_id = Items[0].subscribers.values[0];

    // Get release.

    params = {
      TableName: process.env.DYNAMODB_TABLE_RELEASES
    };
    ({ Items } = await DynamoDB.scan(params).promise());
    release_slug = Items[0].slug;

    // Get syndicate.

    params = {
      TableName: process.env.DYNAMODB_TABLE_SYNDICATES
    };
    ({ Items } = await DynamoDB.scan(params).promise());
    syndicate_slug = Items[0].slug;

    // TODO
    // Doesn't work, because I'm not currently seeding a proposal.

    params = {
      TableName: process.env.DYNAMODB_TABLE_SYNDICATES
    };
    ({ Items } = await DynamoDB.scan(params).promise());
    proposal_id = Items[0].proposals.values[0];
  });


  describe("getChannelById", function() {

    let expected = {
      channel_id: "__ID__",
      created_at: "__STRING__",
      updated_at: "__STRING__",
      profile_url: "__STRING__",
      payload_url: "__STRING__",
      release_count: 1,
      earnings_month: 9.99,
      earnings_total: 9.99,
      subscriber_count: 1,
      currency: "__STRING__",
      plan_id: "__STRING__",
      slug: "__STRING__",
      title: "__STRING__",
      description: "__STRING__",
      is_nsfw: false,
      is_unlisted: false,
      subscription_rate: 9.99,
      subscriber_pays: false,
      releases: { values: [Array] },
      syndicates: { values: [Array] },
      subscribers: { values: [Array] }
    };

    it("should return data as expected", async function() {
      const channel = await getChannelById(channel_id);
      expect(Object.keys(channel).sort()).to.deep.equal(Object.keys(expected).sort());
      forIn(channel, (key, value) => {
        expect(typeof channel[key]).to.equal(typeof expected[key]);
      });
    });

    it("should throw if channel not found", function() {
      return expect(getChannelById("__DOESNT_EXIST__")).to.eventually.be.rejectedWith("Channel not found.");
    });

  });


  describe("getChannelBySlug", function() {

    let expected = {
      channel_id: "__ID__",
      created_at: "__STRING__",
      updated_at: "__STRING__",
      profile_url: "__STRING__",
      payload_url: "__STRING__",
      release_count: 1,
      currency: "__STRING__",
      slug: "__STRING__",
      title: "__STRING__",
      description: "__STRING__",
      is_nsfw: false,
      subscription_rate: 9.99,
      releases: { values: [Array] },
      syndicates: { values: [Array] },
      subscribers: { values: [Array] }
    };

    it("should return data as expected (guest)", async function() {
      const channel = await getChannelBySlug({ slug: channel_slug });
      expect(Object.keys(channel).sort()).to.deep.equal(Object.keys(expected).sort());
      forIn(channel, (key, value) => {
        expect(typeof channel[key]).to.equal(typeof expected[key]);
      });
    });

    it("should return data as expected (channel)", async function() {

      // TODO: Return differently for channel (check resolver)

      const channel = await getChannelBySlug({ slug: channel_slug, channel_id });
      expect(Object.keys(channel).sort()).to.deep.equal(Object.keys(expected).sort());
      forIn(channel, (key, value) => {
        expect(typeof channel[key]).to.equal(typeof expected[key]);
      });
    });

    it("should return data as expected (subscriber)", async function() {
      expected.is_subscribed = true;
      const channel = await getChannelBySlug({ slug: channel_slug, subscriber_id });
      expect(Object.keys(channel).sort()).to.deep.equal(Object.keys(expected).sort());
      forIn(channel, (key, value) => {
        expect(typeof channel[key]).to.equal(typeof expected[key]);
      });
    });

    it("should throw if channel not found", function() {
      return expect(getChannelBySlug({ slug: "__DOESNT_EXIST__" })).to.eventually.be.rejectedWith("Channel not found.");
    });

  });


});