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


describe("Create syndicate", function() {


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
            discord: "https://google.com",
            facebook: "https://google.com",
            instagram: "https://google.com",
            twitch: "https://google.com",
            twitter: "https://google.com",
            youtube: "https://google.com",
          },
          overview: "Overview 0",
          payload: "test_image.jpg",
          slug: "syndicate-0",
          tiers: {
            _1: {
              active: true,
              title: "Standard Tier",
              description: "Comes with _all kinds_ of cool stuff.",
              rate: 1999
            },
            _2: {
              active: true,
              title: "Premium Tier",
              description: "Comes with _all kinds_ of cool stuff.",
              rate: 3999
            },
            _3: {
              active: true,
              title: "Platinum Tier",
              description: "Comes with _all kinds_ of cool stuff.",
              rate: 7999
            }
          },
          title: "Syndicate 0",
          unlisted: false
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

      const syndicate_id = result.data.createSyndicate.syndicate_id;
      expect(syndicate_id).to.be.a("string");
    });


    it("should create a new syndicate object in DynamoDB", async () => {

      const expected = {
        description:  {
          raw: "Description 0",
          rendered: "Description 0"
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
          raw: "Overview 0",
          rendered: "<p>Overview 0</p>\n"
        },
        payload:  "test_image.jpg",
        tiers: {
          _1: {
            active: true,
            title: "Standard Tier",
            description: {
              raw: "Comes with _all kinds_ of cool stuff.",
              rendered: "Comes with <em>all kinds</em> of cool stuff."
            },
            rate: 1999
          },
          _2: {
            active: true,
            title: "Premium Tier",
            description: {
              raw: "Comes with _all kinds_ of cool stuff.",
              rendered: "Comes with <em>all kinds</em> of cool stuff."
            },
            rate: 3999
          },
          _3: {
            active: true,
            title: "Platinum Tier",
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

      const {
        Items: syndicates
      } = await DynamoDB.scan({
        TableName: process.env.DYNAMODB_TABLE_SYNDICATES
      }).promise();

      // Expect the table to have one syndicate object.

      expect(syndicates.length).to.equal(1);

      // Expect "deep.equal", except the values we don't know beforehand.

      const syndicate = syndicates[0];
      global.syndicates._1.object = Object.assign({}, syndicate);

      delete syndicate.plan_id;
      delete syndicate.syndicate_id;
      delete syndicate.time_created;

      expect(global.syndicates._1.object.plan_id).to.be.a("string");
      expect(global.syndicates._1.object.syndicate_id).to.be.a("string");
      expect(global.syndicates._1.object.time_created).to.be.a("number");
      expect(syndicate).to.deep.equal(expected);
    });


    it("should create a slug object in DynamoDB", async () => {

      const expected = {
        slug: "syndicate-0",
        syndicate_id: global.syndicates._1.object.syndicate_id
      };

      const params = {
        TableName: process.env.DYNAMODB_TABLE_SLUGS,
        Key: { slug: "syndicate-0" }
      };

      const { Item: actual } = await DynamoDB.get(params).promise();
      expect(actual).to.deep.equal(expected);
    });


    it("should create a membership object in DynamoDB", async () => {

      const expected = {
        channel_id: global.channels._1.object.channel_id,
        syndicate_id: global.syndicates._1.object.syndicate_id
      };

      const {
        Item: actual
      } = await DynamoDB.get({
        TableName: process.env.DYNAMODB_TABLE_MEMBERSHIPS,
        Key: {
          channel_id: global.channels._1.object.channel_id,
          syndicate_id: global.syndicates._1.object.syndicate_id
        }
      }).promise();

      const {
        time_created
      } = actual;

      delete actual.time_created;

      expect(time_created).to.be.a("number");
      expect(actual).to.deep.equal(expected);
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
          syndicate_id: global.syndicates._1.object.syndicate_id
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
          syndicate_id: global.syndicates._1.object.syndicate_id
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


  describe("S3 PUT requests (syndicate)", function() {


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
