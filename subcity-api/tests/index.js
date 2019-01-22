require("../../shared/lib/load-env")("dev").__load__();
const stripe = require("stripe")(process.env.STRIPE_KEY_PRIVATE);
const clear = require("./clear");
const {
  DynamoDB,
} = require("../shared");

global.channels = {
  _1: {
    object: {},
    releases: {
      _1: {}
    }
  },
  _2: {
    object: {},
    releases: {
      _1: {}
    }
  },
  _3: {
    object: {},
    releases: {
      _1: {}
    }
  }
};

global.subscribers = {
  _1: {
    object: {},
    sources: {
      _1: {},
      _2: {}
    },
    subscriptions: {
      _1: {},
      _2: {}
    }
  },
  _2: {
    object: {},
    sources: {
      _1: {},
      _2: {}
    },
    subscriptions: {
      _1: {},
      _2: {}
    }
  },
  _3: {
    object: {},
    sources: {
      _1: {},
      _2: {}
    },
    subscriptions: {
      _1: {},
      _2: {}
    }
  }
};

global.syndicates = {
  _1: {
    object: {},
    proposals: {
      _1: {}
    }
  },
  _2: {
    object: {},
    proposals: {
      _1: {}
    }
  },
  _3: {
    object: {},
    proposals: {
      _1: {}
    }
  }
};


before(async function() {

  // Clear everything.

  await clear.all()
  .then(async () => {

    // Create "extra" Stripe plan and product.

    await stripe.plans.create({
      amount: 1,
      currency: "usd",
      id: "plan_extra",
      interval: "month",
      product: {
        id:   "prod_extra",
        name: "prod_extra"
      }
    });

    // Create free Stripe coupon.

    await stripe.coupons.create({
      percent_off: 100,
      duration: "forever",
      id: "deactivated"
    });
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


require("./integration/channel/creation.test");
require("./integration/subscriber/creation.test");
require("./integration/syndicate/creation.test");
require("./integration/release/creation.test");

require("./integration/channel/operation.test");
require("./integration/subscriber/operation.test");
require("./integration/syndicate/operation.test");
require("./integration/release/operation.test");

require("./integration/complexity.test");

require("./integration/subscriber/deletion.test");
require("./integration/release/deletion.test");
require("./integration/channel/deletion.test");
require("./integration/syndicate/deletion.test");

//require("./integration/transfers.test");


async function load () {

  const {
    Items: [
      channel
    ]
  } = await DynamoDB.scan({
    TableName: process.env.DYNAMODB_TABLE_CHANNELS
  }).promise();

  global.channels._1.object = Object.assign({}, channel);

  const {
    Items: [
      subscriber
    ]
  } = await DynamoDB.scan({
    TableName: process.env.DYNAMODB_TABLE_SUBSCRIBERS
  }).promise();

  global.subscribers._1.object = Object.assign({}, subscriber);

  const {
    Items: [
      syndicate
    ]
  } = await DynamoDB.scan({
    TableName: process.env.DYNAMODB_TABLE_SYNDICATES
  }).promise();

  global.syndicates._1.object = Object.assign({}, syndicate);
}