////////////////////////////////////////////////////////////
/////////////////////////// UTIL ///////////////////////////
////////////////////////////////////////////////////////////


const fs = require("fs");
const request = require("request");
const {
  DynamoDB,
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


describe("Update release", function () {


  // Should trigger subscriber payment, as channel (_1) is "per_month" at this point.


  describe("mutation: updateRelease", function() {


    it("should return time_created from GraphQL", async () => {

      const query = `
        mutation ($time_created: Float!, $data: ReleaseInput!) {
          updateRelease (time_created: $time_created, data: $data) {
            time_created
          }
        }
      `;

      const vars = {
        time_created: global.channels._1.releases._1.time_created,
        data: {
          tier: 3,
          title: "Release 0 Updated",
          slug: "release-0-updated",
          overview: "Overview 0 Updated",
          payload: "test_image_2.jpg"
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

      const time_created = result.data.updateRelease.time_created;
      expect(time_created).to.equal(global.channels._1.releases._1.time_created);
    });


    it("should update the release object in DynamoDB", async () => {

      const expected = {
        channel_id: global.channels._1.object.channel_id,
        overview: {
          raw: "Overview 0 Updated",
          rendered: "<p>Overview 0 Updated</p>\n"
        },
        payload: "test_image_2.jpg",
        slug: "release-0-updated",
        tier: 3,
        time_created: global.channels._1.releases._1.time_created,
        title: "Release 0 Updated"
      };

      const {
        Item: release
      } = await DynamoDB.get({
        TableName: process.env.DYNAMODB_TABLE_RELEASES,
        Key: {
          channel_id: global.channels._1.object.channel_id,
          time_created: global.channels._1.releases._1.time_created
        }
      }).promise();

      global.channels._1.releases._1 = Object.assign({}, release);

      delete release.time_updated;

      expect(global.channels._1.releases._1.time_updated).to.be.a("number");
      expect(release).to.deep.equal(expected);
    });
  });
});
