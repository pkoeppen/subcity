const {
  GraphQLBoolean,
  GraphQLFloat,
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


const InitializeSubscriberInputType = new GraphQLInputObjectType({
  name: "InitializeSubscriberInput",
  fields: () => ({

    email:    { type: new GraphQLNonNull(GraphQLString) },
    password: { type: new GraphQLNonNull(GraphQLString) },
    token_id: { type: new GraphQLNonNull(GraphQLString) }

  })
});

const SubscriberType = new GraphQLObjectType({
  name: "Subscriber",
  fields: () => ({

    subscriber_id: { type: new GraphQLNonNull(GraphQLID) },
    time_created:  { type: new GraphQLNonNull(GraphQLFloat) }

  })
});

const ModifySubscriptionInputType = new GraphQLInputObjectType({
  name: "ModifySubscriptionInput",
  fields: () => ({

    subscriber_id: { type: new GraphQLNonNull(GraphQLID) },

    // Subscription to be modified.
    // Note: "_" is there because "channel_id" is reserved.
    // "_syndicate_id" gets it too, just for the sake of uniformity.

    _channel_id:   { type: GraphQLString },
    _syndicate_id: { type: GraphQLString },
    subscribe:     { type: new GraphQLNonNull(GraphQLBoolean) }

  })
});


module.exports = {

  InitializeSubscriberInputType,
  SubscriberType,
  ModifySubscriptionInputType

};