////////////////////////////////////////////////////////////
/////////////////////////// UTIL ///////////////////////////
////////////////////////////////////////////////////////////


const fs = require("fs");
const request = require("request");
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


describe("Syndicate operation", function() {


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
          syndicate_id: global.syndicates._1.object.syndicate_id,
          type: "update",
          updates: {
            description: "Description 0 Updated",
            links: {
              discord: "https://google.com",
              facebook: "https://google.com",
              instagram: "https://google.com",
              twitch: "https://google.com",
              twitter: "https://google.com",
              youtube: "https://google.com",
            },
            overview: "Overview 0 Updated",
            payload: "test_image_2.jpg",
            slug: "syndicate-0-updated",
            tiers: {
              _1: {
                active: true,
                title: "Standard Tier Updated",
                description: "Comes with _all kinds_ of cool stuff.",
                rate: 499
              },
              _2: {
                active: true,
                title: "Premium Tier Updated",
                description: "Comes with _all kinds_ of cool stuff.",
                rate: 4999
              },
              _3: {
                active: true,
                title: "Platinum Tier Updated",
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
        channel_id: global.channels._1.object.channel_id,
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
        new_profile: true,
        stage: "pending",
        syndicate_id: global.syndicates._1.object.syndicate_id,
        type: "update",
        updates: {
          description: {
            raw: "Description 0 Updated",
            rendered: "Description 0 Updated"
          },
          links: {
            discord: "https://google.com",
            facebook: "https://google.com",
            instagram: "https://google.com",
            twitch: "https://google.com",
            twitter: "https://google.com",
            youtube: "https://google.com",
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
              title: "Standard Tier Updated",
              description: {
                raw: "Comes with _all kinds_ of cool stuff.",
                rendered: "Comes with <em>all kinds</em> of cool stuff."
              },
              rate: 499
            },
            _2: {
              active: true,
              title: "Premium Tier Updated",
              description: {
                raw: "Comes with _all kinds_ of cool stuff.",
                rendered: "Comes with <em>all kinds</em> of cool stuff."
              },
              rate: 4999
            },
            _3: {
              active: true,
              title: "Platinum Tier Updated",
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
        votes: []
      };

      const {
        Items: proposals
      } = await DynamoDB.scan({
        TableName: process.env.DYNAMODB_TABLE_PROPOSALS
      }).promise();

      // Expect the table to have one proposal object.

      expect(proposals.length).to.equal(1);

      // Expect "deep.equal", except the values we don't know beforehand.

      const proposal = proposals[0];
      global.syndicates._1.proposals._1 = Object.assign({}, proposal);

      delete proposal.time_created;

      expect(global.syndicates._1.proposals._1.time_created).to.be.a("number");
      expect(proposal).to.deep.equal(expected); 
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
          syndicate_id: global.syndicates._1.object.syndicate_id,
          time_created: global.syndicates._1.proposals._1.time_created,
          vote: true
        }
      };

      const ctx = {
        channel_id: global.channels._1.object.channel_id,
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


    it("should update the syndicate object in DynamoDB", async () => {

      const expected = {
        description:  {
          raw: "Description 0 Updated",
          rendered: "Description 0 Updated"
        },
        links: {
          discord: "https://google.com",
          facebook: "https://google.com",
          instagram: "https://google.com",
          twitch: "https://google.com",
          twitter: "https://google.com",
          youtube: "https://google.com",
        },
        overview: {
          raw: "Overview 0 Updated",
          rendered: "<p>Overview 0 Updated</p>\n"
        },
        payload:  "test_image_2.jpg",
        syndicate_id: global.syndicates._1.object.syndicate_id,
        tiers: {
          _1: {
            active: true,
            title: "Standard Tier Updated",
            description: {
              raw: "Comes with _all kinds_ of cool stuff.",
              rendered: "Comes with <em>all kinds</em> of cool stuff."
            },
            rate: 499
          },
          _2: {
            active: true,
            title: "Premium Tier Updated",
            description: {
              raw: "Comes with _all kinds_ of cool stuff.",
              rendered: "Comes with <em>all kinds</em> of cool stuff."
            },
            rate: 4999
          },
          _3: {
            active: true,
            title: "Platinum Tier Updated",
            description: {
              raw: "Comes with _all kinds_ of cool stuff.",
              rendered: "Comes with <em>all kinds</em> of cool stuff."
            },
            rate: 9999
          }
        },
        time_created: global.syndicates._1.object.time_created,
        title: "Syndicate 0 Updated",
        unlisted: true
      };

      // Get the updated syndicate object.

      const {
        Item: syndicate
      } = await DynamoDB.get({
        TableName: process.env.DYNAMODB_TABLE_SYNDICATES,
        Key: { syndicate_id: global.syndicates._1.object.syndicate_id }
      }).promise();

      const old_plan_id = global.syndicates._1.object.plan_id;
      global.syndicates._1.object = Object.assign({}, syndicate);

      delete syndicate.plan_id;
      delete syndicate.time_updated;

      expect(global.syndicates._1.object.plan_id).to.be.a("string");
      expect(global.syndicates._1.object.plan_id).to.not.equal(old_plan_id);
      expect(global.syndicates._1.object.time_updated).to.be.a("number");
      expect(syndicate).to.deep.equal(expected);
    });
  });
});
