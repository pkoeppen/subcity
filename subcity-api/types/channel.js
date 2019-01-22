const {
  GraphQLBoolean,
  GraphQLID,
  GraphQLInt,
  GraphQLFloat,
  GraphQLList,
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLString,
  GraphQLNonNull,
} = require("graphql");

const {
  ReleaseType
} = require("./release");

const {
  SubscriberType,
  SubscriptionType
} = require("./subscriber");

const {
  MarkdownType,
  TiersInputType,
  TiersType,
  LinksType,
  LinksInputType
} = require("./misc");

const {
  getReleasesByChannelID,
  getSubscribersByChannelID,
  getSubscriptionsByChannelID,
  getSyndicatesByChannelID,
  getTransfersByChannelID,
} = require("../resolvers");


const TransferType = new GraphQLObjectType({
  name: "Transfer",
  fields: () => ({

    amount: { type: new GraphQLNonNull(GraphQLInt) },
    channel_id: { type: new GraphQLNonNull(GraphQLID) },
    fee_platform: { type: new GraphQLNonNull(GraphQLInt) },
    fee_processor: { type: new GraphQLNonNull(GraphQLInt) },
    syndicate_id: { type: new GraphQLNonNull(GraphQLID) },
    time_created: { type: new GraphQLNonNull(GraphQLFloat) },

  }),
});


const SyndicateType = new GraphQLObjectType({
  name: "_Syndicate",
  fields: () => ({

    description:  { type: new GraphQLNonNull(MarkdownType)   },
    links:        { type: new GraphQLNonNull(LinksType)      },
    payload:      { type: GraphQLString                      },
    plan_id:      { type: new GraphQLNonNull(GraphQLString)  },
    slug:         { type: new GraphQLNonNull(GraphQLString)  },
    syndicate_id: { type: new GraphQLNonNull(GraphQLID)      },
    tiers:        { type: new GraphQLNonNull(TiersType)      },
    time_created: { type: new GraphQLNonNull(GraphQLFloat)   },
    time_updated: { type: new GraphQLNonNull(GraphQLFloat)   },
    title:        { type: GraphQLString                      },
    unlisted:     { type: new GraphQLNonNull(GraphQLBoolean) },

  })
});


const ChannelType = new GraphQLObjectType({
  name: "Channel",
  fields: () => ({

    channel_id:   { type: new GraphQLNonNull(GraphQLID)      },
    description:  { type: new GraphQLNonNull(MarkdownType)   },
    funding:      { type: new GraphQLNonNull(GraphQLString)  },
    invites:      { type: new GraphQLList(GraphQLString)     },
    links:        { type: new GraphQLNonNull(LinksType)      },
    payload:      { type: GraphQLString                      },
    plan_id:      { type: new GraphQLNonNull(GraphQLString)  },
    slug:         { type: new GraphQLNonNull(GraphQLString)  },
    subscription: { type: SubscriptionType                   },
    tiers:        { type: new GraphQLNonNull(TiersType)      },
    time_created: { type: new GraphQLNonNull(GraphQLFloat)   },
    time_updated: { type: new GraphQLNonNull(GraphQLFloat)   },
    title:        { type: GraphQLString                      },
    unlisted:     { type: new GraphQLNonNull(GraphQLBoolean) },

    releases: {
      type: new GraphQLList(ReleaseType),
      resolve: (root, args, ctx, ast) => {

        const {
          channel_id
        } = root;

        return getReleasesByChannelID(channel_id);
      }
    },

    // subscribers: {
    //   type: new GraphQLList(SubscriberType),
    //   resolve: (root, args, ctx, ast) => {

    //     const {
    //       channel_id
    //     } = ctx;

    //     return getSubscribersByChannelID(channel_id);
    //   }
    // },

    subscriptions: {
      type: new GraphQLList(SubscriptionType),
      resolve: (root, args, ctx, ast) => {

        const {
          channel_id
        } = ctx;

        return getSubscriptionsByChannelID(channel_id);
      }
    },

    syndicates: {
      type: new GraphQLList(SyndicateType),
      resolve: (root, args, ctx, ast) => {

        const {
          channel_id
        } = root;

        return getSyndicatesByChannelID(channel_id);
      }
    },

    transfers: {
      type: new GraphQLList(TransferType),
      resolve: (root, args, ctx, ast) => {

        const {
          channel_id
        } = ctx;

        return getTransfersByChannelID(channel_id);
      }
    },
  })
});


const ChannelInputType = new GraphQLInputObjectType({
  name: "ChannelInput",
  fields: () => ({

    description: { type: GraphQLString  },
    funding:     { type: GraphQLString  },
    links:       { type: LinksInputType },
    payload:     { type: GraphQLString  },
    slug:        { type: GraphQLString  },
    tiers:       { type: TiersInputType },
    title:       { type: GraphQLString  },
    unlisted:    { type: GraphQLBoolean }

  })
});


const PasswordInputType = new GraphQLInputObjectType({
  name: "PasswordInput",
  fields: () => ({

    email: { type: new GraphQLNonNull(GraphQLString) },
    old_password: { type: new GraphQLNonNull(GraphQLString) },
    new_password: { type: new GraphQLNonNull(GraphQLString) },

  })
});


const PayoutSettingsType = new GraphQLObjectType({
  name: "PayoutSettings",
  fields: () => ({

    account_number_last4: { type: new GraphQLNonNull(GraphQLString) },
    bank_name:            { type: new GraphQLNonNull(GraphQLString) },
    city:                 { type: new GraphQLNonNull(GraphQLString) },
    country:              { type: new GraphQLNonNull(GraphQLString) },
    dob:                  { type: new GraphQLNonNull(GraphQLString) },
    first_name:           { type: new GraphQLNonNull(GraphQLString) },
    last_name:            { type: new GraphQLNonNull(GraphQLString) },
    line1:                { type: new GraphQLNonNull(GraphQLString) },
    // payout_anchor:     { type: GraphQLString                     },
    // payout_interval:   { type: new GraphQLNonNull(GraphQLString) },
    postal_code:          { type: new GraphQLNonNull(GraphQLString) },
    routing_number:       { type: new GraphQLNonNull(GraphQLString) },
    state:                { type: new GraphQLNonNull(GraphQLString) }


  })
});


const PayoutSettingsInputType = new GraphQLInputObjectType({
  name: "PayoutSettingsInput",
  fields: () => ({

    account_number:     { type: GraphQLString                     },
    city:               { type: new GraphQLNonNull(GraphQLString) },
    country:            { type: new GraphQLNonNull(GraphQLString) },
    dob:                { type: new GraphQLNonNull(GraphQLString) },
    first_name:         { type: new GraphQLNonNull(GraphQLString) },
    last_name:          { type: new GraphQLNonNull(GraphQLString) },
    line1:              { type: new GraphQLNonNull(GraphQLString) },
    // payout_interval: { type: new GraphQLNonNull(GraphQLString) },
    // payout_anchor:   { type: GraphQLString                     },
    personal_id_number: { type: GraphQLString                     },
    postal_code:        { type: new GraphQLNonNull(GraphQLString) },
    routing_number:     { type: GraphQLString                     },
    state:              { type: new GraphQLNonNull(GraphQLString) },

  })
});

const InitializeChannelInputType = new GraphQLInputObjectType({
  name: "InitializeChannelInput",
  fields: () => ({

    account_number:     { type: new GraphQLNonNull(GraphQLString) },
    city:               { type: new GraphQLNonNull(GraphQLString) },
    country:            { type: new GraphQLNonNull(GraphQLString) },
    dob:                { type: new GraphQLNonNull(GraphQLString) },
    email:              { type: new GraphQLNonNull(GraphQLString) },
    first_name:         { type: new GraphQLNonNull(GraphQLString) },
    last_name:          { type: new GraphQLNonNull(GraphQLString) },
    line1:              { type: new GraphQLNonNull(GraphQLString) },
    password:           { type: new GraphQLNonNull(GraphQLString) },
    personal_id_number: { type: new GraphQLNonNull(GraphQLString) },
    postal_code:        { type: new GraphQLNonNull(GraphQLString) },
    routing_number:     { type: GraphQLString },
    state:              { type: new GraphQLNonNull(GraphQLString) },
    offer_id:           { type: new GraphQLNonNull(GraphQLString) }

  })
});


module.exports = {
  ChannelType,
  ChannelInputType,
  PasswordInputType,
  PayoutSettingsType,
  PayoutSettingsInputType,
  InitializeChannelInputType,
  TransferType,
};