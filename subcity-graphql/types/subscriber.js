const {
  GraphQLBoolean,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLString,
  GraphQLNonNull,
} = require("graphql");

const {
  channel: {
    getChannelsByIdArray
  },
  syndicate: {
    getSyndicatesByIdArray
  }
} = require("../resolvers");

////////////////////////////////////////////////////

const SubscriberType = new GraphQLObjectType({
  name: "Subscriber",
  fields: () => ({

    // Key.

    subscriber_id: { type: new GraphQLNonNull(GraphQLID) },

    // Non-editable.

    created_at: { type: new GraphQLNonNull(GraphQLInt) },

    // Edge nodes.

    channels: {
      type: new GraphQLList(require("./channel").ChannelType),
      resolve: getChannelsByIdArray
    },
    syndicates: {
      type: new GraphQLList(require("./syndicate").SyndicateType),
      resolve: getSyndicatesByIdArray
    }
  })
});

const SubscriberPaymentSettingsType = new GraphQLObjectType({
  name: "SubscriberPaymentSettings",
  fields: () => ({
    
    // card last4
    // etc
    subscriber_id: { type: new GraphQLNonNull(GraphQLID) },
    
  })
});

const SubscriberPaymentSettingsInputType = new GraphQLInputObjectType({
  name: "SubscriberPaymentSettingsInput",
  fields: () => ({

    // Key.

    subscriber_id: { type: new GraphQLNonNull(GraphQLID) },

    // Stripe token.

    token_id: { type: new GraphQLNonNull(GraphQLString) },
  })
});

const ModifySubscriptionInputType = new GraphQLInputObjectType({
  name: "ModifySubscriptionInput",
  fields: () => ({

    // Key.

    subscriber_id: { type: new GraphQLNonNull(GraphQLID) },

    // Subscription to be modified.
    // Note: "_" is there because "channel_id" is reserved.
    // "_syndicate_id" gets it too, just for the sake of uniformity.

    _channel_id: { type: GraphQLString },
    _syndicate_id: { type: GraphQLString },

    // Subscription action - "true" to subscribe, "false" to unsubscribe.

    subscribe: { type: new GraphQLNonNull(GraphQLBoolean) },
  })
});

////////////////////////////////////////////////////

module.exports = {
  SubscriberType,
  SubscriberPaymentSettingsType,
  SubscriberPaymentSettingsInputType,
  ModifySubscriptionInputType
};