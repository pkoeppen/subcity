require("../../shared/lib/load-env")("dev").__load__();


////////////////////////////////////////////////////////////
/////////////////////////// UTIL ///////////////////////////
////////////////////////////////////////////////////////////


const clear = require("./clear");
const request = require("request");
const fs = require("fs");
const {
  createStripePlan,
  DynamoDB,
  getAuth0User,
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
  makeExecutableSchema,
  addMockFunctionsToSchema,
  mockServer
} = require("graphql-tools");

const {
  graphql,
  printSchema,
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString
} = require("graphql");

const schema = require("../schema");

const typeDefinitions  = printSchema(schema);
const executableSchema = makeExecutableSchema({ typeDefs: typeDefinitions });
const server           = mockServer(typeDefinitions);

// addMockFunctionsToSchema({
//   schema,
//   mocks: {
//     Boolean: () => false,
//     ID:      () => "__ID__",
//     Int:     () => 1,
//     Float:   () => 9.99,
//     String:  () => "__STRING__"
//   }
// });


////////////////////////////////////////////////////////////
////////////////////////// TESTS ///////////////////////////
////////////////////////////////////////////////////////////


/*

"subscriber manager" table

- subscriber name
- tier
- lifetime
- last charge
- subscription status (active|canceled|delinquent)

If charge fails, set subscriber status to "delinquent" and
disallow viewing of releases until their shit is fixed

*/


before(async function() {

  // Clear everything.

  await clear.all();

  // Create arbitrary Stripe plan and product.

  await createStripePlan({
    amount: 1,
    currency: "usd",
    id: "plan_arbitrary",
    interval: "month",
    product: {
      id:   "prod_arbitrary",
      name: "prod_arbitrary"
    }
  });

  // // Create free Stripe plan and product.

  // await createStripePlan({
  //   amount: 0,
  //   currency: "usd",
  //   id: "plan_free",
  //   interval: "month",
  //   product: {
  //     id:   "prod_free",
  //     name: "prod_free"
  //   }
  // });

  // Create free Stripe coupon.

  await stripe.coupons.create({
    percent_off: 100,
    duration: "forever",
    id: "deactivated"
  });

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
});


describe("Channel signup", function() {

  describe("query: assertTokenExists", function() {   


    it("should return true from GraphQL", async () => {

      const expected_GraphQL = {
        data: {
          assertTokenExists: true
        }
      };

      const query = `
        query($token_id: ID!) {
          assertTokenExists(token_id: $token_id)
        }
      `;

      const ctx = {
        ip_address: "127.0.0.1"
      };

      const vars = {
        token_id: "token_0"
      };

      const actual_GraphQL = await graphql(schema, query, null, ctx, vars);
      expect(actual_GraphQL).to.deep.equal(expected_GraphQL);
    });
  });


  describe("mutation: initializeChannel", function() {


    // TODO: test rollback


    it("should return channel_id from GraphQL", async () => {

      const query = `
        mutation($data: InitializeChannelInput!) {
          initializeChannel(data: $data) {
            channel_id
          }
        }
      `;

      const vars = {
        data: {
          account_number:     "000123456789",
          city:               "San Francisco",
          country:            "US",
          dob:                "1999-12-31",
          email:              "channel.0@foobar.com",
          first_name:         "John",
          last_name:          "Smith",
          line1:              "123 Foobar Lane",
          password:           "$FooBar123",
          personal_id_number: "999999999",
          pin:                1234,
          postal_code:        "94117",
          routing_number:     "110000000",
          state:              "California",
          token_id:           "token_0"
        }
      };

      const ctx = {
        ip_address: "127.0.0.1"
      };

      const result = await graphql(schema, query, null, ctx, vars);

      global.channels._1.channel_id = result.data.initializeChannel.channel_id;
      expect(global.channels._1.channel_id).to.be.a("string");
    });


    it("should create a new Connect account in Stripe", async function() {

      return expect(stripe.accounts.retrieve(`acct_${global.channels._1.channel_id}`)).to.be.fulfilled;
    });


    it("should create a new user in Auth0", async function() {

      const expected_Auth0 = {
        email: "channel.0@foobar.com",
        user_id: `auth0|acct_${global.channels._1.channel_id}`,
        app_metadata: {
          roles: ["channel"]
        }
      };

      const {
        email,
        user_id,
        app_metadata
      } = await getAuth0User(`auth0|acct_${global.channels._1.channel_id}`);

      const actual_Auth0 = {
        email,
        user_id,
        app_metadata
      };

      expect(actual_Auth0).to.deep.equal(expected_Auth0);
    });


    it("should create a new channel object in DynamoDB", async () => {

      const expected = {
        channel_id: global.channels._1.channel_id,
        description: null,
        links: {
          _1: null,
          _2: null,
          _3: null
        },
        overview: null,
        payload: null,
        tiers: {
          _1: {
            active: true,
            alias: null,
            description: {
              raw: null,
              rendered: null
            },
            rate: 499
          },
          _2: {
            active: false,
            alias: null,
            description: {
              raw: null,
              rendered: null
            },
            rate: 499
          },
          _3: {
            active: false,
            alias: null,
            description: {
              raw: null,
              rendered: null
            },
            rate: 499
          }
        },
        time_updated: 0,
        title: null,
        funding: "per_month",
        unlisted: false
      };

      const params = {
        TableName: process.env.DYNAMODB_TABLE_CHANNELS
      };

      const {
        Items: channels
      } = await DynamoDB.scan(params).promise();

      // Expect the table to have one channel object.

      expect(channels.length).to.equal(1);

      // Expect "deep.equal", except the values we don't know beforehand.

      const actual = channels[0];
      const {
        plan_id,
        time_created
      } = actual;

      global.channels._1.plan_id = plan_id;
      console.log("global plan_id",global.channels._1.plan_id)

      delete actual.plan_id;
      delete actual.time_created;

      expect(global.channels._1.plan_id).to.be.a("string");
      expect(time_created).to.be.a("number");

      expect(actual).to.deep.equal(expected);
    });


    it("should expend the signup token", async () => {

      const { Item: token } = await DynamoDB.get({
        TableName: process.env.DYNAMODB_TABLE_TOKENS,
        Key: {
          token_id: "token_0"
        }
      }).promise();

      expect(token).to.be.an("undefined");
    });

  });
});


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
          slug: "channel-0",
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
          title: "Channel 0",
          unlisted: true
        }
      };

      const ctx = {
        channel_id: global.channels._1.channel_id,
        ip_address: "127.0.0.1"
      };

      const expected = {
        data: {
          updateChannel: {
            channel_id: global.channels._1.channel_id
          }
        }
      };

      const actual = await graphql(schema, query, null, ctx, vars);
      expect(actual).to.deep.equal(expected);
    });


    it("should update the channel object in DynamoDB", async () => {

      const expected = {
        channel_id: global.channels._1.channel_id,
        description:  {
          raw: "Description 0",
          rendered: "Description 0"
        },
        funding: "per_month",
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
        title: "Channel 0",
        unlisted: true
      };

      // Get the updated channel object.

      const {
        Item: actual
      } = await DynamoDB.get({
        TableName: process.env.DYNAMODB_TABLE_CHANNELS,
        Key: { channel_id: global.channels._1.channel_id }
      }).promise();

      const {
        plan_id,
        time_created,
        time_updated
      } = actual;

      const plan_updated = (global.channels._1.plan_id !== plan_id);
      global.channels._1.plan_id = plan_id;

      delete actual.plan_id;
      delete actual.time_created;
      delete actual.time_updated;

      expect(plan_id).to.be.a("string");
      expect(plan_updated).to.equal(true);
      expect(time_created).to.be.a("number");
      expect(time_updated).to.be.a("number");

      expect(actual).to.deep.equal(expected);    
    });

    it("should create a slug object in DynamoDB", async () => {

      const expected = {
        slug: "channel-0",
        channel_id: global.channels._1.channel_id
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

    const query = `
      query($data: GetUploadURLInput!) {
        getUploadURL(data: $data)
      }
    `;

    const vars = {
      data: {
        upload_type: "profileImage",
        filename: "test_image.jpg",
        mime_type: "image/jpeg"
      }
    };

    it("should return an upload URL from GraphQL", async () => {
      
      const ctx = {
        channel_id: global.channels._1.channel_id,
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
  describe("mutation: getUploadURL (channel: payload)", function() {

    const query = `
      query($data: GetUploadURLInput!) {
        getUploadURL(data: $data)
      }
    `;

    const vars = {
      data: {
        upload_type: "payloadFile",
        filename: "test_image.jpg",
        mime_type: "image/jpeg"
      }
    };

    it("should return an upload URL from GraphQL", async () => {
      
      const ctx = {
        channel_id: global.channels._1.channel_id,
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


  describe("S3 PUT requests", function() {

    it("should successfully upload profile image to S3", async () => {

      const upload = new Promise((resolve, reject) => {

        const filepath = `${__dirname}/test_image.jpg`;
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

        const filepath = `${__dirname}/test_image.jpg`;
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
        mutation($data: PayoutSettingsInput!) {
          updatePayoutSettings(data: $data)
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
        channel_id: global.channels._1.channel_id,
        ip_address: "127.0.0.1"
      };

      const expected = {
        data: {
          updatePayoutSettings: true
        }
      };

      const actual = await graphql(schema, query, null, ctx, vars);
      expect(actual).to.deep.equal(expected);
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
      } = await stripe.accounts.retrieve(`acct_${global.channels._1.channel_id}`);
      
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


return;

describe("Delete channel", function() {

  describe("mutation: deleteChannel", function() {


    it("should return true from GraphQL", async () => {

      const expected = {
        data: {
          deleteChannel: true
        }
      };

      const query = `
        mutation {
          deleteChannel
        }
      `;

      const ctx = {
        channel_id,
        ip_address: "127.0.0.1"
      };

      const actual = await graphql(schema, query, null, ctx, null);
      expect(actual).to.deep.equal(expected);
    });


    it("should delete the channel's slugs from DynamoDB", async () => {

      const { Items: slugs } = await DynamoDB.query({
        TableName: process.env.DYNAMODB_TABLE_SLUGS,
        IndexName: `${process.env.DYNAMODB_TABLE_SLUGS}-GSI-1`,
        KeyConditionExpression: "channel_id = :channel_id",
        ExpressionAttributeValues: {
          ":channel_id": global.channels._1.channel_id
        }
      }).promise();

      expect(slugs.length).to.equal(0);
    });

    
    it("should delete the channel's invitations from DynamoDB", async () => {

      const { Items: invitations } = await DynamoDB.query({
        TableName: process.env.DYNAMODB_TABLE_INVITATIONS,
        KeyConditionExpression: "channel_id = :channel_id",
        ExpressionAttributeValues: {
          ":channel_id": global.channels._1.channel_id
        }
      }).promise();

      expect(invitations.length).to.equal(0);
    });


    it("should delete the channel's memberships from DynamoDB", async () => {

      const { Items: memberships } = await DynamoDB.query({
        TableName: process.env.DYNAMODB_TABLE_MEMBERSHIPS,
        KeyConditionExpression: "channel_id = :channel_id",
        ExpressionAttributeValues: {
          ":channel_id": global.channels._1.channel_id
        }
      }).promise();

      expect(memberships.length).to.equal(0);
    });


    it("should delete the channel's subscriptions from DynamoDB", async () => {

      const { Items: subscriptions } = await DynamoDB.query({
        TableName: process.env.DYNAMODB_TABLE_SUBSCRIPTIONS,
        IndexName: `${process.env.DYNAMODB_TABLE_SUBSCRIPTIONS}-GSI-1`,
        KeyConditionExpression: "channel_id = :channel_id",
        ExpressionAttributeValues: {
          ":channel_id": global.channels._1.channel_id
        }
      }).promise();

      expect(subscriptions.length).to.equal(0);
    });


    it("should delete the channel's Stripe Connect account", async () => {

      return expect(stripe.accounts.retrieve(`acct_${global.channels._1.channel_id}`)).to.be.rejected;
    });


    it("should delete the channel's Stripe product", async () => {

      return expect(stripe.products.retrieve(`prod_channel_${global.channels._1.channel_id}`)).to.be.rejected;
    });


    it("should delete the channel's Stripe plan", async () => {

      return expect(stripe.plans.retrieve(global.channels._1.plan_id)).to.be.rejected;
    });


    it("should delete the channel's Stripe subscriptions", async () => {

      const {
        data: subscriptions
      } = await stripe.subscriptions.list();

      return expect(subscriptions.length).to.equal(0);
    });


    // it("should delete the channel's messages from DynamoDB", async () => {

    //   const { Items: messages } = await DynamoDB.query({
    //     TableName: process.env.DYNAMODB_TABLE_MESSAGES,
    //     IndexName: `${process.env.DYNAMODB_TABLE_MESSAGES}-GSI-1`
    //     KeyConditionExpression: "channel_id = :channel_id",
    //     ExpressionAttributeValues: {
    //       ":channel_id": channel_id
    //     }
    //   }).promise();

    //   expect(messages.length).to.equal(0);
    // });


    it("should delete the channel's Auth0 user", async () => {

      return expect(getAuth0User(`auth0|acct_${global.channels._1.channel_id}`)).to.be.rejected;
    });


    it("should delete the channel's S3 content", async () => {

      const {
        Contents: contents_IN
      } = await S3.listObjects({
        Bucket: process.env.S3_BUCKET_IN,
        Prefix: `channels/${global.channels._1.channel_id}`
      }).promise();

      const {
        Contents: contents_OUT
      } = await S3.listObjects({
        Bucket: process.env.S3_BUCKET_OUT,
        Prefix: `channels/${global.channels._1.channel_id}`
      }).promise();

      expect(contents_IN.length).to.equal(0);
      expect(contents_OUT.length).to.equal(0);
    });


    it("should delete the channel itself from DynamoDB", async () => {

      const { Item: channel } = await DynamoDB.get({
        TableName: process.env.DYNAMODB_TABLE_CHANNELS,
        Key: { channel_id: global.channels._1.channel_id }
      }).promise();

      expect(channel).to.be.an("undefined");
    });
  });
});
