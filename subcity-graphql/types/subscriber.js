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
  AddressInputType,
  AddressType
} = require("./misc");

const {
  getChannelByID,
  getChannelsBySyndicateID,
  getSubscriberByID,
  getSyndicateByID,
} = require("../resolvers");


// These avoid circular dependencies.

const ChannelType = new GraphQLObjectType({
  name: "Subscription_Channel",
  fields: () => ({
    channel_id: { type: new GraphQLNonNull(GraphQLID) },
    title: { type: new GraphQLNonNull(GraphQLString) },
    slug: { type: new GraphQLNonNull(GraphQLString) },
  })
});

const SyndicateType = new GraphQLObjectType({
  name: "Subscription_Syndicate",
  fields: () => ({
    title: { type: new GraphQLNonNull(GraphQLString) },
    slug: { type: new GraphQLNonNull(GraphQLString) },
    syndicate_id: { type: new GraphQLNonNull(GraphQLID) },
    members: {
      type: new GraphQLList(ChannelType),
      resolve: (root, args, ctx, ast) => {

        const {
          syndicate_id
        } = root;
        
        if (!syndicate_id) return null;
        return getChannelsBySyndicateID(syndicate_id);
      }
    }
  })
});


const InitializeSubscriberInputType = new GraphQLInputObjectType({
  name: "InitializeSubscriberInput",
  fields: () => ({

    cardholder: { type: new GraphQLNonNull(GraphQLString) },
    email:      { type: new GraphQLNonNull(GraphQLString) },
    password:   { type: new GraphQLNonNull(GraphQLString) },
    token_id:   { type: new GraphQLNonNull(GraphQLString) }

  })
});

const SourceType = new GraphQLObjectType({
  name: "Source",
  fields: () => ({

    brand:     { type: new GraphQLNonNull(GraphQLString)  },
    country:   { type: new GraphQLNonNull(GraphQLString)  },
    default:   { type: GraphQLBoolean },
    exp_month: { type: new GraphQLNonNull(GraphQLInt)     },
    exp_year:  { type: new GraphQLNonNull(GraphQLInt)     },
    funding:   { type: new GraphQLNonNull(GraphQLString)  },
    source_id: { type: new GraphQLNonNull(GraphQLID)      },
    last4:     { type: new GraphQLNonNull(GraphQLString)  },

  })
});

const SubscriberType = new GraphQLObjectType({
  name: "Subscriber",
  fields: () => ({

    address:       { type: AddressType                       },
    alias:         { type: GraphQLString                     },
    email:         { type: new GraphQLNonNull(GraphQLString) },
    subscriber_id: { type: new GraphQLNonNull(GraphQLID)     },
    time_created:  { type: new GraphQLNonNull(GraphQLFloat)  },

  })
});

const SubscriberInputType = new GraphQLInputObjectType({
  name: "SubscriberInput",
  fields: () => ({

    address:  { type: AddressInputType },
    alias:    { type: GraphQLString    },
    email:    { type: GraphQLString    },

  })
});

const SubscriptionType = new GraphQLObjectType({
  name: "Subscription",
  fields: () => ({

    channel_id:      { type: GraphQLID                        },
    extra:           { type: new GraphQLNonNull(GraphQLInt)   },
    subscriber_id:   { type: new GraphQLNonNull(GraphQLID)    },
    subscription_id: { type: new GraphQLNonNull(GraphQLID)    },
    syndicate_id:    { type: GraphQLID                        },
    tier:            { type: new GraphQLNonNull(GraphQLInt)   },
    time_created:    { type: new GraphQLNonNull(GraphQLFloat) },

    channel: {
      type: ChannelType,
      resolve: (root, args, ctx, ast) => {

        const {
          channel_id
        } = root;
        
        if (!channel_id) return null;
        return getChannelByID(channel_id);
      }
    },

    subscriber: {
      type: SubscriberType,
      resolve: (root, args, ctx, ast) => {

        const {
          subscriber_id
        } = root;

        return getSubscriberByID(subscriber_id);
      }
    },

    syndicate: {
      type: SyndicateType,
      resolve: (root, args, ctx, ast) => {

        const {
          syndicate_id
        } = root;
        
        if (!syndicate_id) return null;
        return getSyndicateByID(syndicate_id);
      }
    },

  })
});


module.exports = {
  InitializeSubscriberInputType,
  SourceType,
  SubscriberInputType,
  SubscriberType,
  SubscriptionType
};