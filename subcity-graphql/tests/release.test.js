require("../../shared/lib/load-env")("dev").__load__();


////////////////////////////////////////////////////////////
/////////////////////////// UTIL ///////////////////////////
////////////////////////////////////////////////////////////


const clear = require("./clear");
const fs = require("fs");
const {
  DynamoDB,
  S3
} = require("../shared");


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


before(async function () {
  return
  // Clear.

  await Promise.all([
    clear.releases()
  ]);

  // Get the channel_id and plan_id.

  const params = {
    TableName: process.env.DYNAMODB_TABLE_CHANNELS
  };

  await DynamoDB.scan(params).promise()
  .then(({ Items: channels }) => {

    global.channels._1.channel_id = channels[0].channel_id;
    global.channels._1.plan_id = channels[0].plan_id;
  });
});


describe("Create release", function() {

  describe("mutation: createRelease", function() {


    it("should return time_created from GraphQL", async () => {

      const query = `
        mutation ($data: ReleaseInput!) {
          createRelease (data: $data) {
            time_created
          }
        }
      `;

      const vars = {
        data: {
          tier: 2,
          title: "Release 0",
          slug: "release-0",
          overview: "Overview 0",
          payload: "test_image.jpg"
        }
      };

      const ctx = {
        channel_id: global.channels._1.channel_id,
        ip_address: "127.0.0.1"
      };

      const result = await graphql(schema, query, null, ctx, vars);
      global.channels._1.releases._1.time_created = ((result.data || {}).createRelease || {}).time_created;

      expect(global.channels._1.releases._1.time_created).to.be.a("number");
    });


    it("should create a new release object in DynamoDB", async () => {

      const expected = {
        channel_id: global.channels._1.channel_id,
        tier: 2,
        title: "Release 0",
        slug: "release-0",
        overview: {
          raw: "Overview 0",
          rendered: "<p>Overview 0</p>\n"
        },
        payload: "test_image.jpg",
        time_created: global.channels._1.releases._1.time_created,
        time_updated: 0
      };

      const params = {
        TableName: process.env.DYNAMODB_TABLE_RELEASES
      };

      const {
        Items: releases
      } = await DynamoDB.scan(params).promise();

      const actual = releases[0];

      expect(releases.length).to.equal(1);
      expect(actual).to.deep.equal(expected);
    });
  });
});


describe("Update release", function () {

  describe("mutation: updateRelease", function() {


    it("should return time_created from GraphQL", async () => {

      const query = `
        mutation($time_created: Float!, $data: ReleaseInput!) {
          updateRelease(time_created: $time_created, data: $data) {
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
        channel_id: global.channels._1.channel_id,
        ip_address: "127.0.0.1"
      };

      const result = await graphql(schema, query, null, ctx, vars);
      const time_created = ((result.data || {}).updateRelease || {}).time_created;

      expect(time_created).to.equal(global.channels._1.releases._1.time_created);
    });


    it("should update the release object in DynamoDB", async () => {

      const expected = {
        channel_id: global.channels._1.channel_id,
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

      const params = {
        TableName: process.env.DYNAMODB_TABLE_RELEASES,
        Key: {
          channel_id: global.channels._1.channel_id,
          time_created: global.channels._1.releases._1.time_created
        }
      };

      const {
        Item: actual
      } = await DynamoDB.get(params).promise();

      // Expect "deep.equal", except the values we don't know beforehand.

      const { time_updated } = actual;
      delete actual.time_updated;

      expect(time_updated).to.be.a("number");
      expect(actual).to.deep.equal(expected);
    });
  });


  var upload_url_profile;
  describe("mutation: getUploadURL (release: profile)", function() {

    const query = `
      query($data: GetUploadURLInput!) {
        getUploadURL(data: $data)
      }
    `;

    it("should return an upload URL from GraphQL", async () => {

      const vars = {
        data: {
          time_created: global.channels._1.releases._1.time_created,
          upload_type: "profileImage",
          filename: "test_image.jpg",
          mime_type: "image/jpeg"
        }
      };
      
      const ctx = {
        channel_id: global.channels._1.channel_id,
        ip_address: "127.0.0.1"
      };

      const result = await graphql(schema, query, null, ctx, vars);
      upload_url_profile = (result.data || {}).getUploadURL;

      expect(upload_url_profile).to.be.a("string");
    });
  });


  var upload_url_banner;
  describe("mutation: getUploadURL (release: banner)", function() {

    const query = `
      query($data: GetUploadURLInput!) {
        getUploadURL(data: $data)
      }
    `;

    it("should return an upload URL from GraphQL", async () => {

      const vars = {
        data: {
          time_created: global.channels._1.releases._1.time_created,
          upload_type: "bannerImage",
          filename: "test_image.jpg",
          mime_type: "image/jpeg"
        }
      };
      
      const ctx = {
        channel_id: global.channels._1.channel_id,
        ip_address: "127.0.0.1"
      };

      const result = await graphql(schema, query, null, ctx, vars);
      upload_url_banner = (result.data || {}).getUploadURL;

      expect(upload_url_banner).to.be.a("string");
    });
  });


  var upload_url_payload;
  describe("mutation: getUploadURL (release: payload)", function() {

    const query = `
      query($data: GetUploadURLInput!) {
        getUploadURL(data: $data)
      }
    `;

    it("should return an upload URL from GraphQL", async () => {

      const vars = {
        data: {
          time_created: global.channels._1.releases._1.time_created,
          upload_type: "payloadFile",
          filename: "test_image.jpg",
          mime_type: "image/jpeg"
        }
      };
      
      const ctx = {
        channel_id: global.channels._1.channel_id,
        ip_address: "127.0.0.1"
      };

      const result = await graphql(schema, query, null, ctx, vars);
      upload_url_payload = (result.data || {}).getUploadURL;

      expect(upload_url_payload).to.be.a("string");
    });
  });
});


describe("Delete release", function () {

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
        channel_id: global.channels._1.channel_id,
        ip_address: "127.0.0.1"
      };

      const expected_GraphQL = {
        data: {
          deleteRelease: true
        }
      };

      const actual_GraphQL = await graphql(schema, query, null, ctx, vars);
      expect(actual_GraphQL).to.deep.equal(expected_GraphQL);
    });


    it("should delete the release's S3 content", async () => {

      const {
        Contents: contents_IN
      } = await S3.listObjects({
        Bucket: process.env.S3_BUCKET_IN,
        Prefix: `channels/${global.channels._1.channel_id}/releases/${global.channels._1.releases._1.time_created}`
      }).promise();

      const {
        Contents: contents_OUT
      } = await S3.listObjects({
        Bucket: process.env.S3_BUCKET_OUT,
        Prefix: `channels/${global.channels._1.channel_id}/releases/${global.channels._1.releases._1.time_created}`
      }).promise();

      expect(contents_IN.length).to.equal(0);
      expect(contents_OUT.length).to.equal(0);
    });


    it("should delete the release itself from DynamoDB", async () => {

      const { Item: release } = await DynamoDB.get({
        TableName: process.env.DYNAMODB_TABLE_RELEASES,
        Key: {
          channel_id: global.channels._1.channel_id,
          time_created: global.channels._1.releases._1.time_created
        }
      }).promise();

      expect(release).to.be.an("undefined");
    });
  })
});
