////////////////////////////////////////////////////////////
/////////////////////////// UTIL ///////////////////////////
////////////////////////////////////////////////////////////


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


describe("Release deletion", function () {


  describe("mutation: deleteRelease", function () {


    it("should return true from GraphQL", async () => {

      const query = `
        mutation ($time_created: Float!) {
          deleteRelease (time_created: $time_created)
        }
      `;

      const vars = {
        time_created: global.channels._1.releases._1.time_created
      };

      const ctx = {
        channel_id: global.channels._1.object.channel_id,
        ip_address: "127.0.0.1"
      };

      const expected = {
        data: {
          deleteRelease: true
        }
      };

      const result = await graphql(schema, query, null, ctx, vars);

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }
      
      expect(result).to.deep.equal(expected);
    });


    it("should delete the release's S3 content", async () => {

      const {
        Contents: contents_IN
      } = await S3.listObjects({
        Bucket: process.env.S3_BUCKET_IN,
        Prefix: `channels/${global.channels._1.object.channel_id}/releases/${global.channels._1.releases._1.time_created}`
      }).promise();

      const {
        Contents: contents_OUT
      } = await S3.listObjects({
        Bucket: process.env.S3_BUCKET_OUT,
        Prefix: `channels/${global.channels._1.object.channel_id}/releases/${global.channels._1.releases._1.time_created}`
      }).promise();

      expect(contents_IN.length).to.equal(0);
      expect(contents_OUT.length).to.equal(0);
    });


    it("should delete the release itself from DynamoDB", async () => {

      const { Item: release } = await DynamoDB.get({
        TableName: process.env.DYNAMODB_TABLE_RELEASES,
        Key: {
          channel_id: global.channels._1.object.channel_id,
          time_created: global.channels._1.releases._1.time_created
        }
      }).promise();

      expect(release).to.be.an("undefined");
    });
  })
});
