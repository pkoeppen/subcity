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
  MarkdownType,
  TiersInputType,
  TiersType,
  LinksType,
  LinksInputType
} = require("./misc");

const {

    getReleaseBySlug,
    getReleasesByIdArray,

    getSyndicateBySlug,
    getSyndicatesByIdArray,
    getInvitationsByIdArray

  // subscriber: {
  //   getSubscribersByChannelId
  // }

} = require("../resolvers");


const ChannelType = new GraphQLObjectType({
  name: "Channel",
  fields: () => ({

    channel_id:   { type: new GraphQLNonNull(GraphQLID)      },
    description:  { type: new GraphQLNonNull(MarkdownType)   },
    funding:      { type: new GraphQLNonNull(GraphQLString)  },
    links:        { type: new GraphQLNonNull(LinksType)      },
    overview:     { type: MarkdownType                       },
    payload:      { type: GraphQLString                      },
    plan_id:      { type: new GraphQLNonNull(GraphQLString)  },
    slug:         { type: GraphQLString                      },
    //subscription: { type: SubscriptionType },
    tiers:        { type: new GraphQLNonNull(TiersType)      },
    time_created: { type: new GraphQLNonNull(GraphQLFloat)   },
    time_updated: { type: new GraphQLNonNull(GraphQLFloat)   },
    title:        { type: new GraphQLNonNull(GraphQLString)  },
    unlisted:     { type: new GraphQLNonNull(GraphQLBoolean) },


    // // Edge nodes.

    // release: {
    //   type: new GraphQLNonNull(ReleaseType),
    //   args: {
    //     slug: {
    //       name: "slug",
    //       type: new GraphQLNonNull(GraphQLString)
    //     },
    //     subscriber_id: {
    //       name: "subscriber_id",
    //       type: GraphQLID
    //     }
    //   },
    //   resolve: getReleaseBySlug
    // },

    // releases: {
    //   type: new GraphQLList(require("./release").ReleaseType),
    //   resolve: getReleasesByIdArray
    // },

    // syndicate: {
    //   type: require("./syndicate").SyndicateType,
    //   args: {
    //     slug: {
    //       name: "slug",
    //       type: new GraphQLNonNull(GraphQLString)
    //     },
    //     settings: {
    //       name: "settings",
    //       type: new GraphQLNonNull(GraphQLBoolean)
    //     }
    //   },
    //   resolve: getSyndicateBySlug
    // },

    // syndicates: {
    //   type: new GraphQLList(require("./syndicate").SyndicateType),
    //   resolve: getSyndicatesByIdArray
    // },

    // invitations: {
    //   type: new GraphQLList(require("./syndicate").SyndicateType),
    //   resolve: getInvitationsByIdArray
    // },

    // subscribers: {
    //   type: { type: new GraphQLList(GraphQLID) },
    //   resolve: getSubscribersByChannelId
    // }

  })
});


const ChannelInputType = new GraphQLInputObjectType({
  name: "ChannelInput",
  fields: () => ({

    description: { type: GraphQLString  },
    funding:     { type: GraphQLString  },
    links:       { type: LinksInputType },
    overview:    { type: GraphQLString  },
    payload:     { type: GraphQLString  },
    slug:        { type: GraphQLString  },
    tiers:       { type: TiersInputType },
    title:       { type: GraphQLString  },
    unlisted:    { type: GraphQLBoolean }

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
    payout_anchor:        { type: GraphQLString                     },
    payout_interval:      { type: new GraphQLNonNull(GraphQLString) },
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
    personal_id_number: { type: GraphQLString                     },
    postal_code:        { type: new GraphQLNonNull(GraphQLString) },
    routing_number:     { type: GraphQLString                     },
    state:              { type: new GraphQLNonNull(GraphQLString) }

    // payout_interval: { type: new GraphQLNonNull(GraphQLString) },
    // payout_anchor:   { type: GraphQLString }

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
    pin:                { type: new GraphQLNonNull(GraphQLInt)    },
    postal_code:        { type: new GraphQLNonNull(GraphQLString) },
    routing_number:     { type: new GraphQLNonNull(GraphQLString) },
    state:              { type: new GraphQLNonNull(GraphQLString) },
    token_id:           { type: new GraphQLNonNull(GraphQLString) }

  })
});


module.exports = {
  ChannelType,
  ChannelInputType,
  PayoutSettingsType,
  PayoutSettingsInputType,
  InitializeChannelInputType
};