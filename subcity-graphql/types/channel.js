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
  release: {
    getReleaseBySlug,
    getReleasesByIdArray
  },
  syndicate: {
    getSyndicateBySlug,
    getSyndicatesByIdArray,
    getInvitationsByIdArray
  }
} = require("../resolvers");


const ChannelType = new GraphQLObjectType({
  name: "Channel",
  fields: () => ({

    // Key.

    channel_id: { type: new GraphQLNonNull(GraphQLID) },

    // Non-editable.

    created_at:                   { type: new GraphQLNonNull(GraphQLInt) },
    updated_at:                   { type: GraphQLString },
    profile_url:                  { type: new GraphQLNonNull(GraphQLString) },
    payload_url:                  { type: GraphQLString },
    earnings_total:               { type: new GraphQLNonNull(GraphQLInt) },
    subscriber_count:             { type: new GraphQLNonNull(GraphQLInt) },
    currency:                     { type: new GraphQLNonNull(GraphQLString) },
    plan_id:                      { type: new GraphQLNonNull(GraphQLString) },
    is_subscribed:                { type: GraphQLBoolean },
    subscribed_through_syndicate: { type: GraphQLBoolean },

    // Editable.

    slug:              { type: GraphQLString },
    title:             { type: GraphQLString },
    description:       { type: GraphQLString },
    is_nsfw:           { type: new GraphQLNonNull(GraphQLBoolean) },
    is_unlisted:       { type: new GraphQLNonNull(GraphQLBoolean) },
    subscription_rate: { type: new GraphQLNonNull(GraphQLInt) },
    subscriber_pays:   { type: new GraphQLNonNull(GraphQLBoolean) },

    // Edge nodes.

    subscribers: { type: new GraphQLList(GraphQLID) },
    release: {
      type: new GraphQLNonNull(ReleaseType),
      args: {
        slug: {
          name: "slug",
          type: new GraphQLNonNull(GraphQLString)
        },
        subscriber_id: {
          name: "subscriber_id",
          type: GraphQLID
        }
      },
      resolve: getReleaseBySlug
    },
    releases: {
      type: new GraphQLList(require("./release").ReleaseType),
      resolve: getReleasesByIdArray
    },
    syndicate: {
      type: require("./syndicate").SyndicateType,
      args: {
        slug: {
          name: "slug",
          type: new GraphQLNonNull(GraphQLString)
        },
        settings: {
          name: "settings",
          type: new GraphQLNonNull(GraphQLBoolean)
        }
      },
      resolve: getSyndicateBySlug
    },
    syndicates: {
      type: new GraphQLList(require("./syndicate").SyndicateType),
      resolve: getSyndicatesByIdArray
    },
    invitations: {
      type: new GraphQLList(require("./syndicate").SyndicateType),
      resolve: getInvitationsByIdArray
    },
  })
});


const ChannelInputType = new GraphQLInputObjectType({
  name: "ChannelInput",
  fields: () => ({
    channel_id:        { type: new GraphQLNonNull(GraphQLID) },
    slug:              { type: new GraphQLNonNull(GraphQLString) },
    title:             { type: new GraphQLNonNull(GraphQLString) },
    description:       { type: new GraphQLNonNull(GraphQLString) },
    payload_url:       { type: GraphQLString },
    is_nsfw:           { type: new GraphQLNonNull(GraphQLBoolean) },
    is_unlisted:       { type: new GraphQLNonNull(GraphQLBoolean) },
    subscription_rate: { type: GraphQLInt },
    subscriber_pays:   { type: new GraphQLNonNull(GraphQLBoolean) }
  })
});


const ChannelPaymentSettingsType = new GraphQLObjectType({
  name: "ChannelPaymentSettings",
  fields: () => ({
    first_name:           { type: new GraphQLNonNull(GraphQLString) },
    last_name:            { type: new GraphQLNonNull(GraphQLString) },
    country:              { type: new GraphQLNonNull(GraphQLString) },
    city:                 { type: new GraphQLNonNull(GraphQLString) },
    line1:                { type: new GraphQLNonNull(GraphQLString) },
    postal_code:          { type: new GraphQLNonNull(GraphQLString) },
    state:                { type: new GraphQLNonNull(GraphQLString) },
    dob:                  { type: new GraphQLNonNull(GraphQLString) },
    bank_name:            { type: new GraphQLNonNull(GraphQLString) },
    routing_number:       { type: new GraphQLNonNull(GraphQLString) },
    account_number_last4: { type: new GraphQLNonNull(GraphQLString) },
    payout_interval:      { type: new GraphQLNonNull(GraphQLString) },
    payout_anchor:        { type: GraphQLString }
  })
});


const ChannelPaymentSettingsInputType = new GraphQLInputObjectType({
  name: "ChannelPaymentSettingsInput",
  fields: () => ({

    // Key.

    channel_id: { type: new GraphQLNonNull(GraphQLID) },

    // Personal.

    first_name:         { type: new GraphQLNonNull(GraphQLString) },
    last_name:          { type: new GraphQLNonNull(GraphQLString) },
    dob:                { type: new GraphQLNonNull(GraphQLString) },
    personal_id_number: { type: GraphQLString },

    // Address.

    country:     { type: new GraphQLNonNull(GraphQLString) },
    city:        { type: new GraphQLNonNull(GraphQLString) },
    line1:       { type: new GraphQLNonNull(GraphQLString) },
    postal_code: { type: new GraphQLNonNull(GraphQLString) },
    state:       { type: new GraphQLNonNull(GraphQLString) },
    
    // Banking.
    
    routing_number:  { type: GraphQLString },
    account_number:  { type: GraphQLString },
    payout_interval: { type: new GraphQLNonNull(GraphQLString) },
    payout_anchor:   { type: GraphQLString }
  })
});


////////////////////////////////////////////////////
///////////////////// EXPORTS //////////////////////
////////////////////////////////////////////////////


module.exports = {
  ChannelType,
  ChannelInputType,
  ChannelPaymentSettingsType,
  ChannelPaymentSettingsInputType
};