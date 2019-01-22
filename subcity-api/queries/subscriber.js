const {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLString,
} = require("graphql");

const {
  InitializeSubscriberInputType,
  PasswordInputType,
  SourceType,
  SubscriberInputType,
  SubscriberType,
  SubscriberPaymentSettingsType,
  SubscriberPaymentSettingsInputType,
  SubscriptionType,
  SubscriptionInputType,
} = require("../types");

const {
  createSource,
  createSubscription,
  deleteAllSubscriptions,
  deleteSource,
  deleteSubscriber,
  deleteSubscription,
  getSources,
  getSubscriptionsBySubscriberID,
  getSubscriberByID,
  getSubscriberPaymentSettings,
  getSubscriptionByChannelID,
  getSubscriptionBySyndicateID,
  initializeSubscriber,
  setDefaultSource,
  updatePaymentSettings,
  updateSubscriber,
  updateSubscriberEmail,
  updateSubscriberPassword,
} = require("../resolvers");


const SubscriberQuery = {

  getSubscriptionsBySubscriberID: {
    type: new GraphQLList(SubscriptionType),
    resolve: (root, args, ctx, ast) => {

      const {
        subscriber_id
      } = ctx;

      return getSubscriptionsBySubscriberID(subscriber_id);
    }
  },

  getSources: {
    type: new GraphQLList(SourceType),
    resolve: (root, args, ctx, ast) => {

      const {
        subscriber_id
      } = ctx;

      return getSources(subscriber_id);
    }
  },

  getSubscriberByID: {
    type: SubscriberType,
    resolve: (root, args, ctx, ast) => {

      const {
        subscriber_id
      } = ctx;

      return getSubscriberByID(subscriber_id);
    }
  },

  getSubscription: {
    type: SubscriptionType,
    args: {
      channel_id: {
        name: "channel_id",
        type: GraphQLID
      },
      syndicate_id: {
        name: "syndicate_id",
        type: GraphQLID
      },
    },
    resolve: (root, args, ctx, ast) => {

      const {
        subscriber_id
      } = ctx;

      if (!subscriber_id) return null;

      const {
        channel_id,
        syndicate_id,
      } = args;

      if (channel_id) return getSubscriptionByChannelID(subscriber_id, channel_id);
      if (syndicate_id) return getSubscriptionBySyndicateID(subscriber_id, syndicate_id);
    }
  }
};


const SubscriberMutation = {

  createSource: {
    type: new GraphQLNonNull(GraphQLBoolean),
    args: {
      token: {
        name: "token",
        type: GraphQLID
      }
    },
    resolve: (root, args, ctx, ast) => {

      const {
        subscriber_id
      } = ctx;

      const {
        token
      } = args;

      return createSource(subscriber_id, token);
    }
  },

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

  deleteAllSubscriptions: {
    type: new GraphQLNonNull(GraphQLBoolean),
    resolve: (root, args, ctx, ast) => {

      const {
        subscriber_id
      } = ctx;

      return deleteAllSubscriptions(subscriber_id);
    }
  },

  deleteSource: {
    type: new GraphQLNonNull(GraphQLBoolean),
    args: {
      source_id: {
        name: "source_id",
        type: GraphQLID
      }
    },
    resolve: (root, args, ctx, ast) => {

      const {
        subscriber_id
      } = ctx;

      const {
        source_id
      } = args;

      return deleteSource(subscriber_id, source_id);
    }
  },

  deleteSubscriber: {
    type: new GraphQLNonNull(GraphQLBoolean),
    resolve: (root, args, ctx, ast) => {

      const {
        subscriber_id
      } = ctx;

      return deleteSubscriber(subscriber_id);
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

  setDefaultSource: {
    type: new GraphQLNonNull(GraphQLBoolean),
    args: {
      source_id: {
        name: "source_id",
        type: GraphQLID
      }
    },
    resolve: (root, args, ctx, ast) => {

      const {
        subscriber_id
      } = ctx;

      const {
        source_id
      } = args;

      return setDefaultSource(subscriber_id, source_id);
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

  updateSubscriberEmail: {
    type: new GraphQLNonNull(GraphQLBoolean),
    args: {
      email: {
        name: "email",
        type: new GraphQLNonNull(GraphQLString)
      },
      password: {
        name: "password",
        type: new GraphQLNonNull(GraphQLString)
      },
      new_email: {
        name: "new_email",
        type: new GraphQLNonNull(GraphQLString)
      },
    },
    resolve: (root, args, ctx, ast) => {

      const {
        subscriber_id
      } = ctx;

      const {
        email,
        password,
        new_email,
      } = args;

      return updateSubscriberEmail(subscriber_id, email, password, new_email);
    }
  },

  updateSubscriberPassword: {
    type: new GraphQLNonNull(GraphQLBoolean),
    args: {
      data: {
        name: "data",
        type: new GraphQLNonNull(PasswordInputType)
      }
    },
    resolve: (root, args, ctx, ast) => {

      const {
        subscriber_id
      } = ctx;

      const {
        data
      } = args;

      return updateSubscriberPassword(subscriber_id, data);
    }
  },
};


module.exports = {
  SubscriberQuery,
  SubscriberMutation
};