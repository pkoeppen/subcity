const {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLID,
  GraphQLInt,
  GraphQLNonNull
} = require("graphql");

const {
  InitializeSubscriberInputType,
  SubscriberInputType,
  SubscriberType,
  SubscriberPaymentSettingsType,
  SubscriberPaymentSettingsInputType,
  SubscriptionType,
  SubscriptionInputType
} = require("../types");

const {
  initializeSubscriber,
  getSubscriberById,
  getSubscriberPaymentSettings,
  createSubscription,
  deleteSubscription,
  updatePaymentSettings,
  updateSubscriber
} = require("../resolvers");


const SubscriberQuery = {

  getSubscriberById: {
    type: SubscriberType,
    args: {
      subscriber_id: {
        name: "subscriber_id",
        type: new GraphQLNonNull(GraphQLID)
      }
    },
    resolve: getSubscriberById
  }

};


const SubscriberMutation = {

  createSubscription: {
    type: new GraphQLNonNull(SubscriptionType),
    args: {
      channel_id: {
        name: "channel_id",
        type: GraphQLID
      },
      extra: {
        name: "extra",
        type: new GraphQLNonNull(GraphQLInt)
      },
      syndicate_id: {
        name: "syndicate_id",
        type: GraphQLID
      },
      tier: {
        name: "tier",
        type: new GraphQLNonNull(GraphQLInt)
      }
    },
    resolve: (root, args, ctx, ast) => {

      const {
        subscriber_id
      } = ctx;

      return createSubscription(subscriber_id, args);
    }
  },

  deleteSubscription: {
    type: new GraphQLNonNull(GraphQLBoolean),
    args: {
      subscription_id: {
        name: "subscription_id",
        type: GraphQLID
      }
    },
    resolve: (root, args, ctx, ast) => {

      const {
        subscriber_id
      } = ctx;

      const {
        subscription_id
      } = args;

      return deleteSubscription(subscriber_id, subscription_id);
    }
  },

  initializeSubscriber: {
    type: new GraphQLNonNull(SubscriberType),
    args: {
      data: {
        name: "data",
        type: new GraphQLNonNull(InitializeSubscriberInputType)
      }
    },
    resolve: (root, args, ctx, ast) => {

      const {
        ip_address
      } = ctx;

      const data = Object.assign({}, args.data, { ip_address });

      return initializeSubscriber(data);
    }
  },

  updateSubscriber: {
    type: new GraphQLNonNull(SubscriberType),
    args: {
      data: {
        name: "data",
        type: new GraphQLNonNull(SubscriberInputType)
      }
    },
    resolve: (root, args, ctx, ast) => {

      const {
        subscriber_id
      } = ctx;

      const {
        data
      } = args;

      return updateSubscriber(subscriber_id, data);
    }
  },
};


module.exports = {
  SubscriberQuery,
  SubscriberMutation
};