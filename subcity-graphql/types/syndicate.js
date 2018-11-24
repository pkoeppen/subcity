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
  channel: {
    getChannelsByIdArray
  },
  proposal: {
    getProposalsByIdArray
  }
} = require("../resolvers");

const SyndicateType = new GraphQLObjectType({
  name: "Syndicate",
  fields: () => ({
    
    // Key.

    syndicate_id: { type: new GraphQLNonNull(GraphQLID) },

    // Non-editable.

    created_at:       { type: new GraphQLNonNull(GraphQLInt) },
    profile_url:      { type: new GraphQLNonNull(GraphQLString) },
    earnings_total:   { type: new GraphQLNonNull(GraphQLInt) },
    cut_total:        { type: new GraphQLNonNull(GraphQLFloat) },
    subscriber_count: { type: new GraphQLNonNull(GraphQLInt) },
    currency:         { type: new GraphQLNonNull(GraphQLString) },
    is_subscribed:    { type: GraphQLBoolean },

    // Editable.

    slug:              { type: new GraphQLNonNull(GraphQLString) },
    title:             { type: new GraphQLNonNull(GraphQLString) },
    description:       { type: new GraphQLNonNull(GraphQLString) },
    payload_url:       { type: GraphQLString },
    is_nsfw:           { type: new GraphQLNonNull(GraphQLBoolean) },
    is_unlisted:       { type: new GraphQLNonNull(GraphQLBoolean) },
    subscription_rate: { type: new GraphQLNonNull(GraphQLInt) },
    subscriber_pays:   { type: new GraphQLNonNull(GraphQLBoolean) },

    // Edge nodes.
    
    subscribers: { type: new GraphQLList(GraphQLID) },
    channels: {
      type: new GraphQLNonNull(new GraphQLList(require("./channel").ChannelType)),
      resolve: getChannelsByIdArray
    },
    proposals: {
      type: new GraphQLList(require("./proposal").ProposalType),
      resolve: getProposalsByIdArray
    }
  })
});

const SyndicateInputType = new GraphQLInputObjectType({
  name: "SyndicateInput",
  fields: () => ({
    channel_id:        { type: new GraphQLNonNull(GraphQLID) },
    slug:              { type: new GraphQLNonNull(GraphQLString) },
    title:             { type: new GraphQLNonNull(GraphQLString) },
    description:       { type: new GraphQLNonNull(GraphQLString) },
    payload_url:       { type: GraphQLString },
    is_nsfw:           { type: new GraphQLNonNull(GraphQLBoolean) },
    is_unlisted:       { type: new GraphQLNonNull(GraphQLBoolean) },
    subscription_rate: { type: new GraphQLNonNull(GraphQLInt) },
    subscriber_pays:   { type: new GraphQLNonNull(GraphQLBoolean) }
  })
});

module.exports = {
  SyndicateType,
  SyndicateInputType
};