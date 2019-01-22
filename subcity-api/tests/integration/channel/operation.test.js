////////////////////////////////////////////////////////////
/////////////////////////// UTIL ///////////////////////////
////////////////////////////////////////////////////////////


const fs = require("fs");
const request = require("request");
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


describe("Update channel", function() {


  describe("mutation: updateChannel", function() {


    it("should return channel_id from GraphQL", async () => {

      const query = `
        mutation($data: ChannelInput!) {
          updateChannel(data: $data) {
            channel_id
          }
        }
      `;

      const vars = {
        data: {        
          description: "Description 0",
          funding: "per_month",
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
          slug: "channel-0",
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
          title: "Channel 0",
          unlisted: true
        }
      };

      const ctx = {
        channel_id: global.channels._1.object.channel_id,
        ip_address: "127.0.0.1"
      };

      const expected = {
        data: {
          updateChannel: {
            channel_id: global.channels._1.object.channel_id
          }
        }
      };

      const result = await graphql(schema, query, null, ctx, vars);

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      expect(result).to.deep.equal(expected);
    });


    it("should update the channel object in DynamoDB", async () => {

      const expected = {
        channel_id: global.channels._1.object.channel_id,
        description:  {
          raw: "Description 0",
          rendered: "Description 0"
        },
        funding: "per_month",
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
        time_created: global.channels._1.object.time_created,
        title: "Channel 0",
        unlisted: true
      };

      // Get the updated channel object.

      const {
        Item: channel
      } = await DynamoDB.get({
        TableName: process.env.DYNAMODB_TABLE_CHANNELS,
        Key: { channel_id: global.channels._1.object.channel_id }
      }).promise();

      const old_plan_id = global.channels._1.object.plan_id;
      global.channels._1.object = Object.assign({}, channel);

      delete channel.plan_id;
      delete channel.time_updated;

      expect(global.channels._1.object.plan_id).to.be.a("string");
      expect(global.channels._1.object.plan_id).to.not.equal(old_plan_id);
      expect(global.channels._1.object.time_updated).to.be.a("number");
      expect(channel).to.deep.equal(expected);  
    });

    it("should create a slug object in DynamoDB", async () => {

      const expected = {
        slug: "channel-0",
        channel_id: global.channels._1.object.channel_id
      };

      const {
        Item: actual
      } = await DynamoDB.get({
        TableName: process.env.DYNAMODB_TABLE_SLUGS,
        Key: { slug: "channel-0" }
      }).promise();

      expect(actual).to.deep.equal(expected);
    });
  });


  // Carry this variable over to the next "describe" block for the PUT to S3.

  var upload_url_profile;

  describe("mutation: getUploadURL (channel: profile)", function() {


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
          mime_type: "image/jpeg"
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

  describe("mutation: getUploadURL (channel: payload)", function() {


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
          mime_type: "image/jpeg"
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


  describe("S3 PUT requests", function() {


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


  describe("mutation: updatePayoutSettings", function() {


    it("should return true from GraphQL", async () => {

      const query = `
        mutation ($data: PayoutSettingsInput!) {
          updatePayoutSettings (data: $data)
        }
      `;

      const vars = {
        data: {
          account_number: "000123456789",
          city: "Chicago",
          country: "US",
          dob: "1950-01-01",
          first_name: "Johannes",
          last_name: "Mustermann",
          line1: "123 Mulberry Lane",
          // payout_anchor,
          // payout_interval,
          personal_id_number: "123456789",
          postal_code: "53146",
          routing_number: "110000000",
          state: "Illinois"
        }
      };

      const ctx = {
        channel_id: global.channels._1.object.channel_id,
        ip_address: "127.0.0.1"
      };

      const expected = {
        data: {
          updatePayoutSettings: true
        }
      };

      const result = await graphql(schema, query, null, ctx, vars);

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }
      
      expect(result).to.deep.equal(expected);
    });


    it("should update the channel's Stripe Connect account", async () => {

      const expected = {
        legal_entity: {
          address: {
            city: "Chicago",
            country: "US",
            line1: "123 Mulberry Lane",
            line2: null,
            postal_code: "53146",
            state: "Illinois"
          },
          dob: {
            day: 1,
            month: 1,
            year: 1950
          },
          first_name: "Johannes",
          last_name: "Mustermann"
        },
        external_account: {
          country: "US",
          currency: "usd",
          last4: "6789",
          routing_number: "110000000"
        }
      };

      const {
        legal_entity: {
          address,
          dob,
          first_name,
          last_name
        },
        external_accounts: {
          data: external_accounts
        }
      } = await stripe.accounts.retrieve(`acct_${global.channels._1.object.channel_id}`);
      
      const {
        country,
        currency,
        last4,
        routing_number
      } = external_accounts[0];

      const actual = {
        legal_entity: {
          address,
          dob,
          first_name,
          last_name
        },
        external_account: {
          country,
          currency,
          last4,
          routing_number
        }
      };

      expect(actual).to.deep.equal(expected);
    });
  });
});
