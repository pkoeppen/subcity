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


describe("Release creation", function() {

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
        channel_id: global.channels._1.object.channel_id,
        ip_address: "127.0.0.1"
      };

      const result = await graphql(schema, query, null, ctx, vars);

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      const time_created = result.data.createRelease.time_created;
      expect(time_created).to.be.a("number");
    });


    it("should create a new release object in DynamoDB", async () => {

      const expected = {
        channel_id: global.channels._1.object.channel_id,
        tier: 2,
        title: "Release 0",
        slug: "release-0",
        overview: {
          raw: "Overview 0",
          rendered: "<p>Overview 0</p>\n"
        },
        payload: "test_image.jpg",
        time_updated: 0
      };

      const params = {
        TableName: process.env.DYNAMODB_TABLE_RELEASES
      };

      const {
        Items: releases
      } = await DynamoDB.scan(params).promise();

      // Expect the table to have one channel object.

      expect(releases.length).to.equal(1);

      // Expect "deep.equal", except the values we don't know beforehand.

      const release = releases[0];
      global.channels._1.releases._1 = Object.assign({}, release);

      delete release.time_created;

      expect(global.channels._1.releases._1.time_created).to.be.a("number");
      expect(release).to.deep.equal(expected);
    });
  });


  // Carry this variable over to the next "describe" block for the PUT to S3.

  var upload_url_profile;

  describe("mutation: getUploadURL (release: profile)", function() {


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
          time_created: global.channels._1.releases._1.time_created
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

      upload_url_profile = result.data.getUploadURL;
      expect(upload_url_profile).to.be.a("string");
    });
  });


  var upload_url_banner;

  describe("mutation: getUploadURL (release: banner)", function() {


    it("should return an upload URL from GraphQL", async () => {

      const query = `
        query ($data: GetUploadURLInput!) {
          getUploadURL (data: $data)
        }
      `;

      const vars = {
        data: {
          upload_type: "bannerImage",
          filename: "test_image.jpg",
          mime_type: "image/jpeg",
          time_created: global.channels._1.releases._1.time_created
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

      upload_url_banner = result.data.getUploadURL;
      expect(upload_url_banner).to.be.a("string");
    });
  });


  var upload_url_payload;

  describe("mutation: getUploadURL (release: payload)", function() {


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
          time_created: global.channels._1.releases._1.time_created
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

      upload_url_payload = result.data.getUploadURL;
      expect(upload_url_payload).to.be.a("string");
    });
  });


  describe("S3 PUT requests (release)", function() {


    it("should successfully upload profile image to S3", async () => {

      const upload = new Promise((resolve, reject) => {

        const filepath = `${__dirname}/../../test_image.jpg`;
        const { size } = fs.statSync(filepath);

        const params = {
          url: upload_url_profile,
          headers: {

            // These are necessary in order to not receive any
            // overly-f***ing-cryptic error messages from S3.

            "Content-Type": "image/jpeg",
            "Content-Length": size
          }
        };

        fs.createReadStream(filepath)
        .pipe(request.put(params, (error, response, body) => {

          if (error || response.statusCode !== 200) {
            return reject();
          } else {
            return resolve();
          }

        }));
      });
      
      return expect(upload).to.be.fulfilled;
    });


    it("should successfully upload banner image to S3", async () => {

      const upload = new Promise((resolve, reject) => {

        const filepath = `${__dirname}/../../test_image.jpg`;
        const { size } = fs.statSync(filepath);

        const params = {
          url: upload_url_profile,
          headers: {

            // These are necessary in order to not receive any
            // overly-f***ing-cryptic error messages from S3.

            "Content-Type": "image/jpeg",
            "Content-Length": size
          }
        };

        fs.createReadStream(filepath)
        .pipe(request.put(params, (error, response, body) => {

          if (error || response.statusCode !== 200) {
            return reject();
          } else {
            return resolve();
          }

        }));
      });
      
      return expect(upload).to.be.fulfilled;
    });


    it("should successfully upload payload file to S3", async () => {

      const upload = new Promise((resolve, reject) => {

        const filepath = `${__dirname}/../../test_image.jpg`;
        const { size } = fs.statSync(filepath);

        const params = {
          url: upload_url_payload,
          headers: {

            // These are necessary in order to not receive any
            // overly-f***ing-cryptic error messages from S3.

            "Content-Type": "image/jpeg",
            "Content-Length": size
          }
        };

        fs.createReadStream(filepath)
        .pipe(request.put(params, (error, response, body) => {

          if (error || response.statusCode !== 200) {
            return reject();
          } else {
            return resolve();
          }

        }));
      });
      
      return expect(upload).to.be.fulfilled;
    });
  });
});
