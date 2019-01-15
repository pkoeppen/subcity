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
} = require("../../shared");
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

const schema = require("../../schema");


////////////////////////////////////////////////////////////
////////////////////////// TESTS ///////////////////////////
////////////////////////////////////////////////////////////


/*

x. Subscriber is subscribed to channel and subscribes to syndicate containing channel
x. Subscribed channel joins subscribed syndicate
x. Subscribed syndicate merges into subscribed syndicate
x. Subscribed syndicate merges into non-subscribed syndicate
x. Syndicate merges into syndicate, channel member of both

*/


describe("Subscribe to syndicate containing subscribed channel", function() {


  before(async function() {

    // Delete syndicate subscription.

    await stripe.subscriptions.del(`sub_${global.subscribers._1.subscriptions._2.subscription_id}`);
    await DynamoDB.delete({
      TableName: process.env.DYNAMODB_TABLE_SUBSCRIPTIONS,
      Key: {
        subscriber_id: global.subscribers._1.object.subscriber_id,
        subscription_id: global.subscribers._1.subscriptions._2.subscription_id
      }
    }).promise();

    // Create channel subscription.

    return; // Channel subscription exists from /subscriber/operation.test.

    const params = {
      customer: `cus_${global.subscribers._1.object.subscriber_id}`,
      items: [{ plan: global.channels._1.object.plan_id }]
    };

    const {
      id: subscription_id
    } = await stripe.subscriptions.create(params);

    const subscription = {
      channel_id: global.channels._1.object.channel_id,
      subscriber_id: global.subscribers._1.object.subscriber_id,
      subscription_id: subscription_id.replace("sub_", ""),
      tier: 2,
      time_created: Date.now()
    };

    await DynamoDB.put({
      TableName: process.env.DYNAMODB_TABLE_SUBSCRIPTIONS,
      Item: subscription
    }).promise();

    global.subscribers._1.subscriptions._1 = subscription;

    // _1: channel (_1)
    // _2: --
  });


  describe("mutation: createSubscription (syndicate)", function() {


    it("should return subscription_id from GraphQL", async () => {

      const query = `
        mutation ($syndicate_id: ID!, $tier: Int!, $extra: Int!) {
          createSubscription (syndicate_id: $syndicate_id, tier: $tier, extra: $extra) {
            subscription_id
          }
        }
      `;

      const vars = {
        extra: 0,
        syndicate_id: global.syndicates._1.object.syndicate_id,
        tier: 1
      };

      const ctx = {
        subscriber_id: global.subscribers._1.object.subscriber_id,
        ip_address: "127.0.0.1"
      };

      const result = await graphql(schema, query, null, ctx, vars);

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      const subscription_id = result.data.createSubscription.subscription_id;
      expect(subscription_id).to.be.a("string");
    });


    it("should create a new subscription object in DynamoDB", async () => {

      const expected = {
        subscriber_id: global.subscribers._1.object.subscriber_id,
        syndicate_id: global.syndicates._1.object.syndicate_id,
        extra: 0,
        tier: 1
      };

      const {
        Items: subscriptions
      } = await DynamoDB.scan({
        TableName: process.env.DYNAMODB_TABLE_SUBSCRIPTIONS
      }).promise();

      // Expect the table to have one subscription object.

      expect(subscriptions.length).to.equal(1);

      // Expect "deep.equal", except the values we don't know beforehand.

      const subscription = subscriptions[0].syndicate_id ? subscriptions[0] : subscriptions[1];
      global.subscribers._1.subscriptions._2 = Object.assign({}, subscription);

      delete subscription.subscription_id;
      delete subscription.time_created;

      expect(global.subscribers._1.subscriptions._2.subscription_id).to.be.a("string");
      expect(global.subscribers._1.subscriptions._2.time_created).to.be.a("number");
      expect(subscription).to.deep.equal(expected);
    });


    it("should replace channel subscription with syndicate subscription in Stripe", async () => {

      const {
        data: subscriptions
      } = await stripe.subscriptions.list({
        customer: `cus_${global.subscribers._1.object.subscriber_id}`
      });

      expect(subscriptions.length).to.equal(1);
      expect(subscriptions[0].plan.id).to.equal(global.syndicates._1.object.plan_id);
    });
  });

  // _1: --
  // _2: syndicate (_1)
});


describe("Subscribed channel joins subscribed syndicate", function() {


  before(async function () {

    // Create a second channel.

    const {
      id: plan_id
    } = await stripe.plans.create({
      billing_scheme: "tiered",
      interval: "month",
      product: {
        id:   `prod_channel_Ch2`,
        name: `prod_channel_Ch2`
      },
      currency: "usd",
      tiers: [
        {
          flat_amount: 499,
          up_to: 1
        },
        {
          flat_amount: 499,
          up_to: 2
        },
        {
          flat_amount: 499,
          up_to: "inf"
        },
      ],
      tiers_mode: "volume"
    });

    const channel = {
      channel_id: "Ch2",
      description: null,
      funding: "per_month",
      links: {
        _1: null,
        _2: null,
        _3: null
      },
      overview: null,
      payload: null,
      plan_id,
      tiers: {
        _1: {
          active: true,
          title: null,
          description: {
            raw: null,
            rendered: null
          },
          rate: 499
        },
        _2: {
          active: false,
          title: null,
          description: {
            raw: null,
            rendered: null
          },
          rate: 499
        },
        _3: {
          active: false,
          title: null,
          description: {
            raw: null,
            rendered: null
          },
          rate: 499
        }
      },
      time_created: Date.now(),
      time_updated: 0,
      title: null,
      unlisted: false
    };

    await DynamoDB.put({
      TableName: process.env.DYNAMODB_TABLE_CHANNELS,
      Item: channel
    }).promise();

    global.channels._2.object = channel;

    // Create second subscription to second channel.

    const params = {
      customer: `cus_${global.subscribers._1.object.subscriber_id}`,
      items: [{ plan: global.channels._2.object.plan_id }]
    };

    const {
      id: subscription_id
    } = await stripe.subscriptions.create(params);

    const subscription = {
      channel_id: global.channels._2.object.channel_id,
      subscriber_id: global.subscribers._1.object.subscriber_id,
      subscription_id: subscription_id.replace("sub_", ""),
      tier: 3,
      time_created: Date.now()
    };

    await DynamoDB.put({
      TableName: process.env.DYNAMODB_TABLE_SUBSCRIPTIONS,
      Item: subscription
    }).promise();

    global.subscribers._1.subscriptions._1 = subscription;

    // _1: channel (_2)
    // _2: syndicate (_1)
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
          channel_id: global.channels._2.object.channel_id,
          syndicate_id: global.syndicates._1.object.syndicate_id,
          type: "join"
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
        channel_id: global.channels._2.object.channel_id,
        stage: "pending",
        syndicate_id: global.syndicates._1.object.syndicate_id,
        type: "join",
        votes: []
      };

      const {
        Items: proposals
      } = await DynamoDB.scan({
        TableName: process.env.DYNAMODB_TABLE_PROPOSALS
      }).promise();

      const proposal = proposals.filter(({ time_created }) => {
        return (time_created !== global.syndicates._1.proposals._1.time_created)
      })[0];

      global.syndicates._1.proposals._2 = Object.assign({}, proposal);

      delete proposal.time_created;

      expect(global.syndicates._1.proposals._2.time_created).to.be.a("number");
      expect(proposal).to.deep.equal(expected); 
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
          syndicate_id: global.syndicates._1.object.syndicate_id,
          time_created: global.syndicates._1.proposals._2.time_created,
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
            time_created: global.syndicates._1.proposals._2.time_created
          }
        }
      };

      const result = await graphql(schema, query, null, ctx, vars);

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      expect(result).to.deep.equal(expected);
    });


    it("should update the proposal to 'approved' in DynamoDB", async () => {

      const {
        Item: proposal
      } = await DynamoDB.get({
        TableName: process.env.DYNAMODB_TABLE_PROPOSALS,
        Key: {
          syndicate_id: global.syndicates._1.object.syndicate_id,
          time_created: global.syndicates._1.proposals._2.time_created
        }
      }).promise();

      expect(proposal.stage).to.equal("approved"); 
    });


    it("should create an invitation object in DynamoDB", async () => {

      const {
        Item: invitation
      } = await DynamoDB.get({
        TableName: process.env.DYNAMODB_TABLE_INVITATIONS,
        Key: { 
          channel_id: global.channels._2.object.channel_id,
          syndicate_id: global.syndicates._1.object.syndicate_id
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
        syndicate_id: global.syndicates._1.object.syndicate_id,
        decision: true
      };

      const ctx = {
        channel_id: global.channels._2.object.channel_id,
        ip_address: "127.0.0.1"
      };

      const expected = {
        data: {
          answerInvitation: true
        }
      };

      const result = await graphql(schema, query, null, ctx, vars);

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      expect(result).to.deep.equal(expected);
    });


    it("should create a membership object in DynamoDB", async () => {

      const {
        Item: membership
      } = await DynamoDB.get({
        TableName: process.env.DYNAMODB_TABLE_MEMBERSHIPS,
        Key: { 
          channel_id: global.channels._2.object.channel_id,
          syndicate_id: global.syndicates._1.object.syndicate_id
        }
      }).promise();

      expect(membership).to.be.an("object");
    });


    it("should delete all DynamoDB channel subscriptions covered under syndicate", async () => {

      const {
        Items: subscriptions
      } = await DynamoDB.scan({
        TableName: process.env.DYNAMODB_TABLE_SUBSCRIPTIONS
      }).promise();

      expect(subscriptions.length).to.equal(1);
      expect(subscriptions[0].syndicate_id).to.equal(global.syndicates._1.object.syndicate_id);
    });


    it("should delete all Stripe channel subscriptions covered under syndicate", async () => {

      const {
        data: subscriptions
      } = await stripe.subscriptions.list({
        customer: `cus_${global.subscribers._1.object.subscriber_id}`
      });

      expect(subscriptions.length).to.equal(1);
      expect(subscriptions[0].plan.id).to.equal(global.syndicates._1.object.plan_id);
    });
  });

  // _1: --
  // _2: syndicate (_1)
});


describe("Subscribed syndicate merges into unsubscribed syndicate", function() {


  before(async function () {

    // Create a second syndicate.

    const {
      id: plan_id
    } = await stripe.plans.create({
      billing_scheme: "tiered",
      interval: "month",
      product: {
        id:   `prod_syndicate_Sy2`,
        name: `prod_syndicate_Sy2`
      },
      currency: "usd",
      tiers: [
        {
          flat_amount: 499,
          up_to: 1
        },
        {
          flat_amount: 499,
          up_to: 2
        },
        {
          flat_amount: 499,
          up_to: "inf"
        },
      ],
      tiers_mode: "volume"
    });

    const syndicate = {
      syndicate_id: "Sy2",
      description: null,
      links: {
        _1: null,
        _2: null,
        _3: null
      },
      overview: null,
      payload: null,
      plan_id,
      tiers: {
        _1: {
          active: true,
          title: null,
          description: {
            raw: null,
            rendered: null
          },
          rate: 499
        },
        _2: {
          active: false,
          title: null,
          description: {
            raw: null,
            rendered: null
          },
          rate: 499
        },
        _3: {
          active: false,
          title: null,
          description: {
            raw: null,
            rendered: null
          },
          rate: 499
        }
      },
      time_created: Date.now(),
      time_updated: 0,
      title: null,
      unlisted: false
    };

    await DynamoDB.put({
      TableName: process.env.DYNAMODB_TABLE_SYNDICATES,
      Item: syndicate
    }).promise();

    global.syndicates._2.object = Object.assign({}, syndicate);

    const membership = {
      channel_id: global.channels._2.object.channel_id,
      syndicate_id: syndicate.syndicate_id,
      time_created: Date.now()
    };

    // Create membership for second channel to second syndicate.

    await DynamoDB.put({
      TableName: process.env.DYNAMODB_TABLE_MEMBERSHIPS,
      Item: membership
    }).promise();

    // Delete second channel membership to first syndicate.

    // await DynamoDB.delete({
    //   TableName: process.env.DYNAMODB_TABLE_MEMBERSHIPS,
    //   Key: {
    //     channel_id: global.channels._2.object.channel_id,
    //     syndicate_id: global.syndicates._1.object.syndicate_id
    //   }
    // }).promise();

    // _1: --
    // _2: syndicate (_1)
  });


  describe("mutation: createProposal (slave)", function() {


    // First syndicate (_1) merges into second syndicate (_2).
    // Ultimately, (_2) should contain both channels.


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
          slave_id: global.syndicates._1.object.syndicate_id,
          syndicate_id: global.syndicates._2.object.syndicate_id,
          type: "slave"
        }
      };

      const ctx = {
        channel_id: global.channels._2.object.channel_id,
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
        slave_id: global.syndicates._1.object.syndicate_id,
        stage: "pending",
        syndicate_id: global.syndicates._2.object.syndicate_id,
        type: "slave",
        votes: []
      };

      const {
        Items: proposals
      } = await DynamoDB.scan({
        TableName: process.env.DYNAMODB_TABLE_PROPOSALS
      }).promise();

      const proposal = proposals.filter(({ time_created }) => {
        return (time_created !== global.syndicates._1.proposals._1.time_created &&
                time_created !== global.syndicates._1.proposals._2.time_created)
      })[0];

      global.syndicates._2.proposals._1 = Object.assign({}, proposal);

      delete proposal.time_created;

      expect(global.syndicates._2.proposals._1.time_created).to.be.a("number");
      expect(proposal).to.deep.equal(expected); 
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
          syndicate_id: global.syndicates._2.object.syndicate_id,
          time_created: global.syndicates._2.proposals._1.time_created,
          vote: true
        }
      };

      const ctx = {
        channel_id: global.channels._2.object.channel_id,
        ip_address: "127.0.0.1"
      };

      const expected = {
        data: {
          castVote: {
            time_created: global.syndicates._2.proposals._1.time_created
          }
        }
      };

      const result = await graphql(schema, query, null, ctx, vars);

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      expect(result).to.deep.equal(expected);
    });


    it("should create a proposal for the slave syndicate in DynamoDB", async () => {

      const expected = {
        master_id: global.syndicates._2.object.syndicate_id,
        stage: "pending",
        syndicate_id: global.syndicates._1.object.syndicate_id,
        type: "master",
        votes: []
      };

      const {
        Items: proposals
      } = await DynamoDB.query({
        TableName: process.env.DYNAMODB_TABLE_PROPOSALS,
        KeyConditionExpression: "syndicate_id = :syndicate_id",
        ExpressionAttributeValues: {
          ":syndicate_id": global.syndicates._1.object.syndicate_id
        }
      }).promise()

      const proposal = proposals[2];
      global.syndicates._1.proposals._3 = Object.assign({}, proposal);

      delete proposal.time_created;

      expect(proposal).to.deep.equal(expected); 
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
          syndicate_id: global.syndicates._1.object.syndicate_id,
          time_created: global.syndicates._1.proposals._3.time_created,
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
            time_created: global.syndicates._1.proposals._3.time_created
          }
        }
      };

      // Two votes for both channels.

      const result_1 = await graphql(schema, query, null, ctx, vars);

      if (result_1.errors) {
        throw new Error(result.errors[0].message);
      }

      ctx.channel_id = global.channels._2.object.channel_id;
      const result_2 = await graphql(schema, query, null, ctx, vars);

      if (result_2.errors) {
        throw new Error(result.errors[0].message);
      }

      expect(result_1).to.deep.equal(expected);
      expect(result_2).to.deep.equal(expected);
    });


    it("should convert all slave syndicate subscriptions to master syndicate in Stripe", async () => {

      const subscriptions = await getSubscriptionsByProductID(`prod_syndicate_${global.syndicates._2.object.syndicate_id}`);

      expect(subscriptions.length).to.equal(1);
    });


    it("should convert all slave syndicate subscriptions to master syndicate in DynamoDB", async () => {

      const {
        Items: subscriptions
      } = await DynamoDB.query({
        TableName: process.env.DYNAMODB_TABLE_SUBSCRIPTIONS,
        IndexName: `${process.env.DYNAMODB_TABLE_SUBSCRIPTIONS}-GSI-2`,
        KeyConditionExpression: "syndicate_id = :syndicate_id",
        ExpressionAttributeValues: {
          ":syndicate_id": global.syndicates._2.object.syndicate_id
        }
      }).promise();

      expect(subscriptions.length).to.equal(1);
    });


    it("should convert all slave syndicate memberships to master syndicate", async () => {

      const {
        Items: memberships
      } = await DynamoDB.query({
        TableName: process.env.DYNAMODB_TABLE_MEMBERSHIPS,
        IndexName: `${process.env.DYNAMODB_TABLE_MEMBERSHIPS}-GSI`,
        KeyConditionExpression: "syndicate_id = :syndicate_id",
        ExpressionAttributeValues: {
          ":syndicate_id": global.syndicates._2.object.syndicate_id
        }
      }).promise();

      expect(memberships.length).to.equal(2);
    });


    it("should dissolve the slave syndicate", async () => {

      const {
        Item: syndicate
      } = await DynamoDB.get({
        TableName: process.env.DYNAMODB_TABLE_SYNDICATES,
        Key: { syndicate_id: global.syndicates._1.object.syndicate_id }
      }).promise();

      expect(syndicate).to.be.an("undefined");
    });
  });

  // _1: --
  // _2: syndicate (_2)
});


describe("Subscribed syndicate merges into subscribed syndicate", function() {


  before(async function () {

    // Create a third syndicate.

    const {
      id: plan_id
    } = await stripe.plans.create({
      billing_scheme: "tiered",
      interval: "month",
      product: {
        id:   `prod_syndicate_Sy3`,
        name: `prod_syndicate_Sy3`
      },
      currency: "usd",
      tiers: [
        {
          flat_amount: 499,
          up_to: 1
        },
        {
          flat_amount: 499,
          up_to: 2
        },
        {
          flat_amount: 499,
          up_to: "inf"
        },
      ],
      tiers_mode: "volume"
    });

    const syndicate = {
      syndicate_id: "Sy3",
      description: null,
      links: {
        _1: null,
        _2: null,
        _3: null
      },
      overview: null,
      payload: null,
      plan_id,
      tiers: {
        _1: {
          active: true,
          title: null,
          description: {
            raw: null,
            rendered: null
          },
          rate: 499
        },
        _2: {
          active: false,
          title: null,
          description: {
            raw: null,
            rendered: null
          },
          rate: 499
        },
        _3: {
          active: false,
          title: null,
          description: {
            raw: null,
            rendered: null
          },
          rate: 499
        }
      },
      time_created: Date.now(),
      time_updated: 0,
      title: null,
      unlisted: false
    };

    await DynamoDB.put({
      TableName: process.env.DYNAMODB_TABLE_SYNDICATES,
      Item: syndicate
    }).promise();

    // Note - Third syndicate takes slot of first syndicate.

    global.syndicates._1.object = Object.assign({}, syndicate);

    const membership = {
      channel_id: global.channels._1.object.channel_id,
      syndicate_id: syndicate.syndicate_id,
      time_created: Date.now()
    };

    // Create membership for first channel to third syndicate.

    await DynamoDB.put({
      TableName: process.env.DYNAMODB_TABLE_MEMBERSHIPS,
      Item: membership
    }).promise();

    // Delete membership to second syndicate.

    await DynamoDB.delete({
      TableName: process.env.DYNAMODB_TABLE_MEMBERSHIPS,
      Key: {
        channel_id: global.channels._1.object.channel_id,
        syndicate_id: global.syndicates._2.object.syndicate_id
      }
    }).promise();

    // Create second subscription to third syndicate.

    const params = {
      customer: `cus_${global.subscribers._1.object.subscriber_id}`,
      items: [{ plan: global.syndicates._1.object.plan_id }]
    };

    const {
      id: subscription_id
    } = await stripe.subscriptions.create(params);

    const subscription = {
      subscriber_id: global.subscribers._1.object.subscriber_id,
      subscription_id: subscription_id.replace("sub_", ""),
      syndicate_id: global.syndicates._1.object.syndicate_id,
      tier: 3,
      time_created: Date.now()
    };

    await DynamoDB.put({
      TableName: process.env.DYNAMODB_TABLE_SUBSCRIPTIONS,
      Item: subscription
    }).promise();

    // Note that the first and second subscriptions
    // have switched slots since the last test suite.

    global.subscribers._1.subscriptions._1 = Object.assign({}, subscription);

    // _1: syndicate (_1)
    // _2: syndicate (_2)
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
          slave_id: global.syndicates._2.object.syndicate_id,
          syndicate_id: global.syndicates._1.object.syndicate_id,
          type: "slave"
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
        slave_id: global.syndicates._2.object.syndicate_id,
        stage: "pending",
        syndicate_id: global.syndicates._1.object.syndicate_id,
        type: "slave",
        votes: []
      };

      const {
        Items: proposals
      } = await DynamoDB.scan({
        TableName: process.env.DYNAMODB_TABLE_PROPOSALS
      }).promise();

      const proposal = proposals.filter(({ syndicate_id }) => {
        return syndicate_id === global.syndicates._1.object.syndicate_id;
      })[0];

      global.syndicates._1.proposals._1 = Object.assign({}, proposal);

      delete proposal.time_created;

      expect(global.syndicates._1.proposals._1.time_created).to.be.a("number");
      expect(proposal).to.deep.equal(expected); 
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


    it("should create a proposal for the slave syndicate in DynamoDB", async () => {

      const expected = {
        master_id: global.syndicates._1.object.syndicate_id,
        stage: "pending",
        syndicate_id: global.syndicates._2.object.syndicate_id,
        type: "master",
        votes: []
      };

      const {
        Items: proposals
      } = await DynamoDB.query({
        TableName: process.env.DYNAMODB_TABLE_PROPOSALS,
        KeyConditionExpression: "syndicate_id = :syndicate_id",
        ExpressionAttributeValues: {
          ":syndicate_id": global.syndicates._2.object.syndicate_id
        }
      }).promise()

      const proposal = proposals[1];
      global.syndicates._2.proposals._1 = Object.assign({}, proposal);

      delete proposal.time_created;

      expect(proposal).to.deep.equal(expected); 
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
          syndicate_id: global.syndicates._2.object.syndicate_id,
          time_created: global.syndicates._2.proposals._1.time_created,
          vote: true
        }
      };

      const ctx_1 = {
        channel_id: global.channels._2.object.channel_id,
        ip_address: "127.0.0.1"
      };

      const expected = {
        data: {
          castVote: {
            time_created: global.syndicates._2.proposals._1.time_created
          }
        }
      };

      const result = await graphql(schema, query, null, ctx_1, vars);

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      expect(result).to.deep.equal(expected);
    });


    it("should convert all slave syndicate subscriptions to master syndicate in Stripe", async () => {

      const subscriptions_1 = await getSubscriptionsByProductID(`prod_syndicate_${global.syndicates._1.object.syndicate_id}`);
      expect(subscriptions_1.length).to.equal(1);

      const subscriptions_2 = await getSubscriptionsByProductID(`prod_syndicate_${global.syndicates._2.object.syndicate_id}`);
      expect(subscriptions_2.length).to.equal(0);
    });


    it("should convert all slave syndicate subscriptions to master syndicate in DynamoDB", async () => {

      const {
        Items: subscriptions_1
      } = await DynamoDB.query({
        TableName: process.env.DYNAMODB_TABLE_SUBSCRIPTIONS,
        IndexName: `${process.env.DYNAMODB_TABLE_SUBSCRIPTIONS}-GSI-2`,
        KeyConditionExpression: "syndicate_id = :syndicate_id",
        ExpressionAttributeValues: {
          ":syndicate_id": global.syndicates._1.object.syndicate_id
        }
      }).promise();

      expect(subscriptions_1.length).to.equal(1);

      const {
        Items: subscriptions_2
      } = await DynamoDB.query({
        TableName: process.env.DYNAMODB_TABLE_SUBSCRIPTIONS,
        IndexName: `${process.env.DYNAMODB_TABLE_SUBSCRIPTIONS}-GSI-2`,
        KeyConditionExpression: "syndicate_id = :syndicate_id",
        ExpressionAttributeValues: {
          ":syndicate_id": global.syndicates._2.object.syndicate_id
        }
      }).promise();

      expect(subscriptions_2.length).to.equal(0);
    });


    it("should convert all slave syndicate memberships to master syndicate", async () => {

      const {
        Items: memberships
      } = await DynamoDB.query({
        TableName: process.env.DYNAMODB_TABLE_MEMBERSHIPS,
        IndexName: `${process.env.DYNAMODB_TABLE_MEMBERSHIPS}-GSI`,
        KeyConditionExpression: "syndicate_id = :syndicate_id",
        ExpressionAttributeValues: {
          ":syndicate_id": global.syndicates._1.object.syndicate_id
        }
      }).promise();

      expect(memberships.length).to.equal(2);
    });


    it("should dissolve the slave syndicate", async () => {

      const {
        Item: syndicate
      } = await DynamoDB.get({
        TableName: process.env.DYNAMODB_TABLE_SYNDICATES,
        Key: { syndicate_id: global.syndicates._2.object.syndicate_id }
      }).promise();

      expect(syndicate).to.be.an("undefined");
    });
  });
});
