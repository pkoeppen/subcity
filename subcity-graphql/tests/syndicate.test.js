require("../../shared/lib/load-env")("dev").__load__();


////////////////////////////////////////////////////////////
/////////////////////////// UTIL ///////////////////////////
////////////////////////////////////////////////////////////


const clear = require("./clear");
const request = require("request");
const fs = require("fs");
const {
  DynamoDB,
  getPlansByProductID,
  getSubscriptionsByProductID,
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
  graphql
} = require("graphql");

const schema = require("../schema");


////////////////////////////////////////////////////////////
////////////////////////// TESTS ///////////////////////////
////////////////////////////////////////////////////////////


// before(async function() {

//   // Clear.

//   await Promise.all([
//     clear.auth0(),
//     clear.invitations(),
//     clear.proposals(),
//     clear.syndicates(),
//     clear.slugs(),
//     clear.stripe()
//   ]);
// });


var channel_id,
    channel_id_2,
    channel_id_3,
    syndicate_id_1,
    syndicate_id_2,
    time_created_proposal,
    time_created_syndicate;


describe("Create syndicate", function() {


  before(async () => {

    // Get the channel_id.

    const params = {
      TableName: process.env.DYNAMODB_TABLE_CHANNELS
    };

    await DynamoDB.scan(params).promise()
    .then(({ Items: channels }) => {

      channel_id = channels[0].channel_id;
    });
  });


  describe("mutation: createSyndicate", function() {


    it("should return syndicate_id from GraphQL", async () => {

      const query = `
        mutation ($data: SyndicateInput!) {
          createSyndicate (data: $data) {
            syndicate_id
          }
        }
      `;

      const vars = {
        data: {
          description: "Description 0",
          links: {
            _1: {
              title: "Foobar Link 1",
              url: "https://sub.city"
            },
            _2: {
              title: "Foobar Link 2",
              url: "https://google.com"
            },
            _3: {
              title: "Foobar Link 3",
              url: "https://yandex.ru"
            }
          },
          overview: "Overview 0",
          payload: "test_image.jpg",
          slug: "syndicate-0",
          tiers: {
            _1: {
              active: true,
              alias: "Standard Tier",
              description: "Comes with _all kinds_ of cool stuff.",
              rate: 1999
            },
            _2: {
              active: true,
              alias: "Premium Tier",
              description: "Comes with _all kinds_ of cool stuff.",
              rate: 3999
            },
            _3: {
              active: true,
              alias: "Platinum Tier",
              description: "Comes with _all kinds_ of cool stuff.",
              rate: 7999
            }
          },
          title: "Syndicate 0",
          unlisted: false
        }
      };

      const ctx = {
        channel_id,
        ip_address: "127.0.0.1"
      };

      ({
        data: {
          createSyndicate: {
            syndicate_id: syndicate_id_1
          }
        }
      } = await graphql(schema, query, null, ctx, vars));

      expect(syndicate_id_1).to.be.a("string");
    });


    it("should create a new syndicate object in DynamoDB", async () => {

      const expected_DynamoDB = {
        syndicate_id: syndicate_id_1,
        description:  {
          raw: "Description 0",
          rendered: "Description 0"
        },
        links: {
          _1: {
            title: "Foobar Link 1",
            url: "https://sub.city"
          },
          _2: {
            title: "Foobar Link 2",
            url: "https://google.com"
          },
          _3: {
            title: "Foobar Link 3",
            url: "https://yandex.ru"
          }
        },
        overview: {
          raw: "Overview 0",
          rendered: "<p>Overview 0</p>\n"
        },
        payload:  "test_image.jpg",
        tiers: {
          _1: {
            active: true,
            alias: "Standard Tier",
            description: {
              raw: "Comes with _all kinds_ of cool stuff.",
              rendered: "Comes with <em>all kinds</em> of cool stuff."
            },
            rate: 1999
          },
          _2: {
            active: true,
            alias: "Premium Tier",
            description: {
              raw: "Comes with _all kinds_ of cool stuff.",
              rendered: "Comes with <em>all kinds</em> of cool stuff."
            },
            rate: 3999
          },
          _3: {
            active: true,
            alias: "Platinum Tier",
            description: {
              raw: "Comes with _all kinds_ of cool stuff.",
              rendered: "Comes with <em>all kinds</em> of cool stuff."
            },
            rate: 7999
          }
        },
        time_updated: 0,
        title: "Syndicate 0",
        unlisted: false
      };

      const params = {
        TableName: process.env.DYNAMODB_TABLE_SYNDICATES
      };

      const {
        Items: syndicates
      } = await DynamoDB.scan(params).promise();

      // Expect the table to have one syndicate object.

      expect(syndicates.length).to.equal(1);

      // Expect "deep.equal", except the values we don't know beforehand.

      const syndicate = syndicates[0];
      const {
        plan_id,
        time_created
      } = syndicate;

      time_created_syndicate = time_created;

      delete syndicate.plan_id;
      delete syndicate.time_created;

      expect(plan_id).to.be.a("string");
      expect(time_created).to.be.a("number");
      expect(syndicate).to.deep.equal(expected_DynamoDB);
    });


    it("should create a slug object in DynamoDB", async () => {

      const expected_slug = {
        slug: "syndicate-0",
        syndicate_id: syndicate_id_1
      };

      const params = {
        TableName: process.env.DYNAMODB_TABLE_SLUGS,
        Key: {
          slug: "syndicate-0"
        }
      };

      const { Item: actual_slug } = await DynamoDB.get(params).promise();
      expect(actual_slug).to.deep.equal(expected_slug);
    });


    it("should create a membership object in DynamoDB", async () => {

      const expected_membership = {
        channel_id,
        syndicate_id: syndicate_id_1
      };

      const params = {
        TableName: process.env.DYNAMODB_TABLE_MEMBERSHIPS,
        Key: {
          channel_id,
          syndicate_id: syndicate_id_1
        }
      };

      const {
        Item: actual_membership
      } = await DynamoDB.get(params).promise();

      const {
        time_created
      } = actual_membership;

      delete actual_membership.time_created;

      expect(time_created).to.be.a("number");
      expect(actual_membership).to.deep.equal(expected_membership);
    });
  });


  // Carry this variable over to the next "describe" block for the PUT to S3.

  var upload_url_profile;
  describe("mutation: getUploadURL (syndicate: profile)", function() {


    it("should return an upload URL from GraphQL", async () => {

      const query = `
        query ($data: GetUploadURLInput!) {
          getUploadURL (data: $data)
        }
      `;

      const vars = {
        data: {
          upload_type: "profileImage",
          filename: "test_image.jpg",
          mime_type: "image/jpeg",
          syndicate_id: syndicate_id_1
        }
      };
      
      const ctx = {
        channel_id,
        ip_address: "127.0.0.1"
      };

      ({
        data: {
          getUploadURL: upload_url_profile
        }
      } = await graphql(schema, query, null, ctx, vars));

      expect(upload_url_profile).to.be.a("string");
    });
  });


  var upload_url_payload;
  describe("mutation: getUploadURL (syndicate: payload)", function() {


    it("should return an upload URL from GraphQL", async () => {

      const query = `
        query ($data: GetUploadURLInput!) {
          getUploadURL (data: $data)
        }
      `;

      const vars = {
        data: {
          upload_type: "payloadFile",
          filename: "test_image.jpg",
          mime_type: "image/jpeg",
          syndicate_id: syndicate_id_1
        }
      };
      
      const ctx = {
        channel_id,
        ip_address: "127.0.0.1"
      };

      ({
        data: {
          getUploadURL: upload_url_payload
        }
      } = await graphql(schema, query, null, ctx, vars));

      expect(upload_url_payload).to.be.a("string");
    });
  });
});


describe("Update syndicate", function() {

  describe("mutation: createProposal (update)", function() {


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
          new_profile: true,
          syndicate_id: syndicate_id_1,
          type: "update",
          updates: {
            description: "Description 0 Updated",
            links: {
              _1: {
                title: "Foobar Link 1 Updated",
                url: "https://sub.city/updated"
              },
              _2: {
                title: "Foobar Link 2 Updated",
                url: "https://google.com/updated"
              },
              _3: {
                title: "Foobar Link 3 Updated",
                url: "https://yandex.ru/updated"
              }
            },
            overview: "Overview 0 Updated",
            payload: "test_image_2.jpg",
            slug: "syndicate-0-updated",
            tiers: {
              _1: {
                active: true,
                alias: "Standard Tier Updated",
                description: "Comes with _all kinds_ of cool stuff.",
                rate: 499
              },
              _2: {
                active: true,
                alias: "Premium Tier Updated",
                description: "Comes with _all kinds_ of cool stuff.",
                rate: 4999
              },
              _3: {
                active: true,
                alias: "Platinum Tier Updated",
                description: "Comes with _all kinds_ of cool stuff.",
                rate: 9999
              }
            },
            title: "Syndicate 0 Updated",
            unlisted: true
          }
        }
      };

      const ctx = {
        channel_id,
        ip_address: "127.0.0.1"
      };

      const result = await graphql(schema, query, null, ctx, vars);
      time_created_proposal = ((result.data || {}).createProposal || {}).time_created;

      expect(time_created_proposal).to.be.a("number");
    });


    it("should create a proposal object in DynamoDB", async () => {

      const expected_DynamoDB = {
        new_profile: true,
        stage: "pending",
        syndicate_id: syndicate_id_1,
        time_created: time_created_proposal,
        type: "update",
        updates: {
          description: {
            raw: "Description 0 Updated",
            rendered: "Description 0 Updated"
          },
          links: {
            _1: {
              title: "Foobar Link 1 Updated",
              url: "https://sub.city/updated"
            },
            _2: {
              title: "Foobar Link 2 Updated",
              url: "https://google.com/updated"
            },
            _3: {
              title: "Foobar Link 3 Updated",
              url: "https://yandex.ru/updated"
            }
          },
          overview: {
            raw: "Overview 0 Updated",
            rendered: "<p>Overview 0 Updated</p>\n"
          },
          payload: "test_image_2.jpg",
          slug: "syndicate-0-updated",
          tiers: {
            _1: {
              active: true,
              alias: "Standard Tier Updated",
              description: {
                raw: "Comes with _all kinds_ of cool stuff.",
                rendered: "Comes with <em>all kinds</em> of cool stuff."
              },
              rate: 499
            },
            _2: {
              active: true,
              alias: "Premium Tier Updated",
              description: {
                raw: "Comes with _all kinds_ of cool stuff.",
                rendered: "Comes with <em>all kinds</em> of cool stuff."
              },
              rate: 4999
            },
            _3: {
              active: true,
              alias: "Platinum Tier Updated",
              description: {
                raw: "Comes with _all kinds_ of cool stuff.",
                rendered: "Comes with <em>all kinds</em> of cool stuff."
              },
              rate: 9999
            }
          },
          title: "Syndicate 0 Updated",
          unlisted: true
        },
        votes: {}
      };

      const {
        Item: proposal
      } = await DynamoDB.get({
        TableName: process.env.DYNAMODB_TABLE_PROPOSALS,
        Key: {
          syndicate_id: syndicate_id_1,
          time_created: time_created_proposal
        }
      }).promise();

      expect(proposal).to.deep.equal(expected_DynamoDB); 
    });
  });


  describe("mutation: castVote (update)", function() {


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
          syndicate_id: syndicate_id_1,
          time_created: time_created_proposal,
          vote: true
        }
      };

      const ctx = {
        channel_id,
        ip_address: "127.0.0.1"
      };

      const expected_GraphQL = {
        data: {
          castVote: {
            time_created: time_created_proposal
          }
        }
      };

      const actual_GraphQL = await graphql(schema, query, null, ctx, vars);
      expect(expected_GraphQL).to.deep.equal(actual_GraphQL);
    });


    it("should update the syndicate object in DynamoDB", async () => {

      const expected_DynamoDB = {
        description:  {
          raw: "Description 0 Updated",
          rendered: "Description 0 Updated"
        },
        links: {
          _1: {
            title: "Foobar Link 1 Updated",
            url: "https://sub.city/updated"
          },
          _2: {
            title: "Foobar Link 2 Updated",
            url: "https://google.com/updated"
          },
          _3: {
            title: "Foobar Link 3 Updated",
            url: "https://yandex.ru/updated"
          }
        },
        overview: {
          raw: "Overview 0 Updated",
          rendered: "<p>Overview 0 Updated</p>\n"
        },
        payload:  "test_image_2.jpg",
        syndicate_id: syndicate_id_1,
        tiers: {
          _1: {
            active: true,
            alias: "Standard Tier Updated",
            description: {
              raw: "Comes with _all kinds_ of cool stuff.",
              rendered: "Comes with <em>all kinds</em> of cool stuff."
            },
            rate: 499
          },
          _2: {
            active: true,
            alias: "Premium Tier Updated",
            description: {
              raw: "Comes with _all kinds_ of cool stuff.",
              rendered: "Comes with <em>all kinds</em> of cool stuff."
            },
            rate: 4999
          },
          _3: {
            active: true,
            alias: "Platinum Tier Updated",
            description: {
              raw: "Comes with _all kinds_ of cool stuff.",
              rendered: "Comes with <em>all kinds</em> of cool stuff."
            },
            rate: 9999
          }
        },
        time_created: time_created_syndicate,
        title: "Syndicate 0 Updated",
        unlisted: true
      };

      const {
        Item: syndicate
      } = await DynamoDB.get({
        TableName: process.env.DYNAMODB_TABLE_SYNDICATES,
        Key: { syndicate_id: syndicate_id_1 }
      }).promise();

      const {
        plan_id,
        time_updated
      } = syndicate;

      delete syndicate.plan_id;
      delete syndicate.time_updated;

      expect(plan_id).to.be.a("string");
      expect(time_updated).to.be.a("number");
      expect(syndicate).to.deep.equal(expected_DynamoDB);
    });

  });
});


describe("Invite channel", function() {


  before(async function () {

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

    // Create a second channel.

    const query = `
      mutation ($data: InitializeChannelInput!) {
        initializeChannel (data: $data) {
          channel_id
        }
      }
    `;

    const vars = {
      data: {
        account_number:     "000123456789",
        city:               "New York City",
        country:            "US",
        dob:                "1950-1-1",
        email:              "channel.1@foobar.com",
        first_name:         "Foo",
        last_name:          "Bar",
        line1:              "456 Road Street",
        password:           "$FooBar123",
        personal_id_number: "999999999",
        pin:                1234,
        postal_code:        "94117",
        routing_number:     "110000000",
        state:              "New York",
        token_id:           "token_1"
      }
    };

    const ctx = {
      ip_address: "127.0.0.1"
    };

    const result = await graphql(schema, query, null, ctx, vars);
    channel_id_2 = ((result.data || {}).initializeChannel || {}).channel_id;
  });


  describe("mutation: createProposal (join)", function() {


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
          channel_id: channel_id_2,
          syndicate_id: syndicate_id_1,
          type: "join"
        }
      };

      const ctx = {
        channel_id,
        ip_address: "127.0.0.1"
      };

      const result = await graphql(schema, query, null, ctx, vars);
      time_created_proposal = ((result.data || {}).createProposal || {}).time_created;

      expect(time_created_proposal).to.be.a("number");
    });


    it("should create a proposal object in DynamoDB", async () => {

      const expected_DynamoDB = {
        channel_id: channel_id_2,
        stage: "pending",
        syndicate_id: syndicate_id_1,
        time_created: time_created_proposal,
        type: "join",
        votes: {}
      };

      const {
        Item: proposal
      } = await DynamoDB.get({
        TableName: process.env.DYNAMODB_TABLE_PROPOSALS,
        Key: {
          syndicate_id: syndicate_id_1,
          time_created: time_created_proposal
        }
      }).promise();

      expect(proposal).to.deep.equal(expected_DynamoDB); 
    });
  });


  describe("mutation: castVote (join)", function() {


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
          syndicate_id: syndicate_id_1,
          time_created: time_created_proposal,
          vote: true
        }
      };

      const ctx = {
        channel_id,
        ip_address: "127.0.0.1"
      };

      const expected_GraphQL = {
        data: {
          castVote: {
            time_created: time_created_proposal
          }
        }
      };

      const actual_GraphQL = await graphql(schema, query, null, ctx, vars);
      expect(expected_GraphQL).to.deep.equal(actual_GraphQL);
    });


    it("should create an invitation object in DynamoDB", async () => {

      const {
        Item: invitation
      } = await DynamoDB.get({
        TableName: process.env.DYNAMODB_TABLE_INVITATIONS,
        Key: { 
          channel_id: channel_id_2,
          syndicate_id: syndicate_id_1
        }
      }).promise();

      expect(invitation).to.be.an("object");
    });
  });


  describe("mutation: answerInvitation (join)", function() {


    it("should return decision from GraphQL", async () => {

      const query = `
        mutation ($syndicate_id: ID!, $decision: Boolean!) {
          answerInvitation (syndicate_id: $syndicate_id, decision: $decision)
        }
      `;

      const vars = {
        syndicate_id: syndicate_id_1,
        decision: true
      };

      const ctx = {
        channel_id: channel_id_2,
        ip_address: "127.0.0.1"
      };

      const expected_GraphQL = {
        data: {
          answerInvitation: true
        }
      };

      const actual_GraphQL = await graphql(schema, query, null, ctx, vars);
      expect(expected_GraphQL).to.deep.equal(actual_GraphQL);
    });


    it("should create a membership object in DynamoDB", async () => {

      const {
        Item: membership
      } = await DynamoDB.get({
        TableName: process.env.DYNAMODB_TABLE_MEMBERSHIPS,
        Key: { 
          channel_id: channel_id_2,
          syndicate_id: syndicate_id_1
        }
      }).promise();

      expect(membership).to.be.an("object");
    });

    // it("should delete all DynamoDB channel subscriptions when subscriber is already subscribed to parent syndicate")
    // it("should delete all Stripe channel subscriptions when subscriber is already subscribed to parent syndicate")
  });
});


describe("Merge syndicate", function() {


  before(async function () {

    // Create a third channel.

    var query = `
      mutation ($data: InitializeChannelInput!) {
        initializeChannel (data: $data) {
          channel_id
        }
      }
    `;

    var vars = {
      data: {
        account_number:     "000123456789",
        city:               "Chicago",
        country:            "US",
        dob:                "1970-7-7",
        email:              "channel.3@foobar.com",
        first_name:         "George",
        last_name:          "Washington",
        line1:              "789 Street Lane",
        password:           "$FooBar123",
        personal_id_number: "999999999",
        pin:                1234,
        postal_code:        "94117",
        routing_number:     "110000000",
        state:              "Illinois",
        token_id:           "token_2"
      }
    };

    var ctx = {
      ip_address: "127.0.0.1"
    };

    const result = await graphql(schema, query, null, ctx, vars);
    channel_id_3 = ((result.data || {}).initializeChannel || {}).channel_id;

    // Create a second syndicate.

    query = `
      mutation ($data: SyndicateInput!) {
        createSyndicate (data: $data) {
          syndicate_id
        }
      }
    `;

    vars = {
      data: {
        description: "Syndicate Description 2",
        links: {
          _1: {
            title: "Foobar Link 1",
            url: "https://sub.city"
          },
          _2: {
            title: "Foobar Link 2",
            url: "https://google.com"
          },
          _3: {
            title: "Foobar Link 3",
            url: "https://yandex.ru"
          }
        },
        overview: "Syndicate Overview 2",
        payload: "test_image.jpg",
        slug: "syndicate-1",
        tiers: {
          _1: {
            active: true,
            alias: "Standard Tier",
            description: "Comes with _all kinds_ of cool stuff.",
            rate: 1999
          },
          _2: {
            active: true,
            alias: "Premium Tier",
            description: "Comes with _all kinds_ of cool stuff.",
            rate: 3999
          },
          _3: {
            active: true,
            alias: "Platinum Tier",
            description: "Comes with _all kinds_ of cool stuff.",
            rate: 7999
          }
        },
        title: "Syndicate 2",
        unlisted: false
      }
    };

    ctx = {
      channel_id: channel_id_3,
      ip_address: "127.0.0.1"
    };

    ({
      data: {
        createSyndicate: {
          syndicate_id: syndicate_id_2
        }
      }
    } = await graphql(schema, query, null, ctx, vars));
  });


  describe("mutation: createProposal (slave)", function() {


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
          slave_id: syndicate_id_2,
          syndicate_id: syndicate_id_1,
          type: "slave"
        }
      };

      const ctx = {
        channel_id,
        ip_address: "127.0.0.1"
      };

      const result = await graphql(schema, query, null, ctx, vars);
      time_created_proposal = ((result.data || {}).createProposal || {}).time_created;

      expect(time_created_proposal).to.be.a("number");
    });


    it("should create a proposal object in DynamoDB", async () => {

      const expected_DynamoDB = {
        slave_id: syndicate_id_2,
        stage: "pending",
        syndicate_id: syndicate_id_1,
        time_created: time_created_proposal,
        type: "slave",
        votes: {}
      };

      const {
        Item: proposal
      } = await DynamoDB.get({
        TableName: process.env.DYNAMODB_TABLE_PROPOSALS,
        Key: {
          syndicate_id: syndicate_id_1,
          time_created: time_created_proposal
        }
      }).promise();

      expect(proposal).to.deep.equal(expected_DynamoDB); 
    });
  });


  describe("mutation: castVote (slave)", function() {


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
          syndicate_id: syndicate_id_1,
          time_created: time_created_proposal,
          vote: true
        }
      };

      // Cast both member channels' votes.

      const ctx_1 = {
        channel_id,
        ip_address: "127.0.0.1"
      };

      const ctx_2 = {
        channel_id: channel_id_2,
        ip_address: "127.0.0.1"
      };

      const expected_GraphQL = {
        data: {
          castVote: {
            time_created: time_created_proposal
          }
        }
      };

      const actual_GraphQL_1 = await graphql(schema, query, null, ctx_1, vars);
      const actual_GraphQL_2 = await graphql(schema, query, null, ctx_2, vars);
      expect(actual_GraphQL_1).to.deep.equal(expected_GraphQL);
      expect(actual_GraphQL_2).to.deep.equal(expected_GraphQL);
    });


    it("should create a proposal for the slave syndicate in DynamoDB", async () => {

      // Get the proposal's time_created.

      const {
        Items: proposals
      } = await DynamoDB.query({
        TableName: process.env.DYNAMODB_TABLE_PROPOSALS,
        KeyConditionExpression: "syndicate_id = :syndicate_id",
        ExpressionAttributeValues: {
          ":syndicate_id": syndicate_id_2
        }
      }).promise()

      const proposal = proposals[0];
      time_created_proposal = proposal.time_created;

      const expected_DynamoDB = {
        master_id: syndicate_id_1,
        stage: "pending",
        syndicate_id: syndicate_id_2,
        time_created: time_created_proposal,
        type: "master",
        votes: {}
      };

      expect(proposal).to.deep.equal(expected_DynamoDB); 
    });
  });


  describe("mutation: castVote (master)", function() {


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
          syndicate_id: syndicate_id_2,
          time_created: time_created_proposal,
          vote: true
        }
      };

      const ctx_1 = {
        channel_id: channel_id_3,
        ip_address: "127.0.0.1"
      };

      const expected_GraphQL = {
        data: {
          castVote: {
            time_created: time_created_proposal
          }
        }
      };

      const actual_GraphQL = await graphql(schema, query, null, ctx_1, vars);
      expect(actual_GraphQL).to.deep.equal(expected_GraphQL);
    });


    it("should convert all slave syndicate subscriptions to master syndicate (Stripe)", async () => {

      const subscriptions = await getSubscriptionsByProductID(`prod_syndicate_${syndicate_id_1}`);

      expect(subscriptions.length).to.equal(0);
    });


    it("should convert all slave syndicate subscriptions to master syndicate (DynamoDB)", async () => {

      const {
        Items: subscriptions
      } = await DynamoDB.query({
        TableName: process.env.DYNAMODB_TABLE_SUBSCRIPTIONS,
        IndexName: `${process.env.DYNAMODB_TABLE_SUBSCRIPTIONS}-GSI-2`,
        KeyConditionExpression: "syndicate_id = :syndicate_id",
        ExpressionAttributeValues: {
          ":syndicate_id": syndicate_id_1
        }
      }).promise();

      expect(subscriptions.length).to.equal(0);
    });


    it("should convert all slave syndicate memberships to master syndicate", async () => {

      const {
        Items: memberships
      } = await DynamoDB.query({
        TableName: process.env.DYNAMODB_TABLE_MEMBERSHIPS,
        IndexName: `${process.env.DYNAMODB_TABLE_MEMBERSHIPS}-GSI`,
        KeyConditionExpression: "syndicate_id = :syndicate_id",
        ExpressionAttributeValues: {
          ":syndicate_id": syndicate_id_1
        }
      }).promise();

      expect(memberships.length).to.equal(3);
    });


    it("should dissolve the slave syndicate", async () => {

      const {
        Item: syndicate
      } = await DynamoDB.get({
        TableName: process.env.DYNAMODB_TABLE_SYNDICATES,
        Key: { syndicate_id: syndicate_id_2 }
      }).promise();

      expect(syndicate).to.be.an("undefined");
    });
  });
});


describe("Leave syndicate", function() {

  describe("mutation: leaveSyndicate", function() {
    it("should return true from GraphQL", async () => {

      const query = `
        mutation ($syndicate_id: ID!) {
          leaveSyndicate (syndicate_id: $syndicate_id)
        }
      `;

      const vars = {
        syndicate_id: syndicate_id_1
      };

      const ctx = {
        channel_id: channel_id_3,
        ip_address: "127.0.0.1"
      };

      const expected_GraphQL = {
        data: {
          leaveSyndicate: true
        }
      };

      const actual_GraphQL = await graphql(schema, query, null, ctx, vars);
      expect(actual_GraphQL).to.deep.equal(expected_GraphQL);
    });
  });

});

return
describe("Dissolve syndicate", function() {

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
          syndicate_id: syndicate_id_1,
          type: "dissolve"
        }
      };

      const ctx = {
        channel_id,
        ip_address: "127.0.0.1"
      };

      const result = await graphql(schema, query, null, ctx, vars);
      time_created_proposal = ((result.data || {}).createProposal || {}).time_created;

      expect(time_created_proposal).to.be.a("number");
    });


    it("should create a proposal object in DynamoDB", async () => {

      const expected_DynamoDB = {
        stage: "pending",
        syndicate_id: syndicate_id_1,
        time_created: time_created_proposal,
        type: "dissolve",
        votes: {}
      };

      const {
        Item: proposal
      } = await DynamoDB.get({
        TableName: process.env.DYNAMODB_TABLE_PROPOSALS,
        Key: {
          syndicate_id: syndicate_id_1,
          time_created: time_created_proposal
        }
      }).promise();

      expect(proposal).to.deep.equal(expected_DynamoDB); 
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
          syndicate_id: syndicate_id_1,
          time_created: time_created_proposal,
          vote: true
        }
      };

      // Cast both member channels' votes.

      const ctx_1 = {
        channel_id,
        ip_address: "127.0.0.1"
      };

      const ctx_2 = {
        channel_id: channel_id_2,
        ip_address: "127.0.0.1"
      };

      const expected_GraphQL = {
        data: {
          castVote: {
            time_created: time_created_proposal
          }
        }
      };

      const actual_GraphQL_1 = await graphql(schema, query, null, ctx_1, vars);
      const actual_GraphQL_2 = await graphql(schema, query, null, ctx_2, vars);
      expect(actual_GraphQL_1).to.deep.equal(expected_GraphQL);
      expect(actual_GraphQL_2).to.deep.equal(expected_GraphQL);
    });


    it("should delete the syndicate's slug from DynamoDB", async () => {

      const { Items: slugs } = await DynamoDB.query({
        TableName: process.env.DYNAMODB_TABLE_SLUGS,
        IndexName: `${process.env.DYNAMODB_TABLE_SLUGS}-GSI-2`,
        KeyConditionExpression: "syndicate_id = :syndicate_id",
        ExpressionAttributeValues: {
          ":syndicate_id": syndicate_id_1
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
          ":syndicate_id": syndicate_id_1
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
          ":syndicate_id": syndicate_id_1
        }
      }).promise();

      expect(subscriptions.length).to.equal(0);
    });


    it("should delete the syndicate's Stripe product", async () => {

      return expect(stripe.products.retrieve(`prod_syndicate_${syndicate_id_1}`)).to.be.rejected;
    });


    it("should delete the syndicate's Stripe plans", async () => {

      const plans = await getPlansByProductID(`prod_syndicate_${syndicate_id_1}`);
      expect(plans.length).to.equal(0);
    });


    it("should delete the syndicate's Stripe subscriptions", async () => {

      const subscriptions = await getSubscriptionsByProductID(`prod_syndicate_${syndicate_id_1}`);
      expect(subscriptions.length).to.equal(0);
    });


    it("should delete the syndicate's S3 content", async () => {

      const {
        Contents: contents_IN
      } = await S3.listObjects({
        Bucket: process.env.S3_BUCKET_IN,
        Prefix: `syndicates/${syndicate_id_1}`
      }).promise();

      const {
        Contents: contents_OUT
      } = await S3.listObjects({
        Bucket: process.env.S3_BUCKET_OUT,
        Prefix: `syndicates/${syndicate_id_1}`
      }).promise();

      expect(contents_IN.length).to.equal(0);
      expect(contents_OUT.length).to.equal(0);
    });


    it("should delete the channel itself from DynamoDB", async () => {

      const { Item: syndicate } = await DynamoDB.get({
        TableName: process.env.DYNAMODB_TABLE_SYNDICATES,
        Key: { syndicate_id: syndicate_id_1 }
      }).promise();

      expect(syndicate).to.be.an("undefined");
    });
  });
});
