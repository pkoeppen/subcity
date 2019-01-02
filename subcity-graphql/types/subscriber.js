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

    address:       { type: AddressType                       },
    alias:         { type: GraphQLString                     },
    email:         { type: new GraphQLNonNull(GraphQLString) },
    subscriber_id: { type: new GraphQLNonNull(GraphQLID)     },
    time_created:  { type: new GraphQLNonNull(GraphQLFloat)  }

  })
});

const SubscriberInputType = new GraphQLInputObjectType({
  name: "SubscriberInput",
  fields: () => ({

    alias:    { type: GraphQLString    },
    address:  { type: AddressInputType },
    email:    { type: GraphQLString    },
    password: { type: GraphQLString    }

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
    time_created:    { type: new GraphQLNonNull(GraphQLFloat) }

  })
});


module.exports = {
  InitializeSubscriberInputType,
  SubscriberInputType,
  SubscriberType,
  SubscriptionType
};