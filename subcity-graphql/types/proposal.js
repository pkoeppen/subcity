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
    getChannelById,
    getApprovalsByIdArray,
    getRejectionsByIdArray
  }
} = require("../resolvers");

const ProposalType = new GraphQLObjectType({
  name: "Proposal",
  fields: () => ({

    // Key.

    syndicate_id:       { type: new GraphQLNonNull(GraphQLID) },
    proposal_id:        { type: new GraphQLNonNull(GraphQLID) },

    // Non-editable.

    created_at:            { type: new GraphQLNonNull(GraphQLFloat) },
    expires:            { type: new GraphQLNonNull(GraphQLString) },
    proposal_status:    { type: new GraphQLNonNull(GraphQLString) }, // [pending, approved, rejected]
    profile_url:        { type: GraphQLString },

    // Editable.

    action:             { type: GraphQLString }, // [merge#{syndicate_id}, dissolve]
    _channel_id:        { type: GraphQLID },
    _syndicate_id:      { type: GraphQLID },
    slug:               { type: GraphQLString },
    title:              { type: GraphQLString },
    description:        { type: GraphQLString },
    payload_url:        { type: GraphQLString },
    is_nsfw:            { type: GraphQLBoolean },
    is_unlisted:        { type: GraphQLBoolean },
    subscription_rate:  { type: GraphQLFloat },
    subscriber_pays:    { type: GraphQLBoolean },
    new_profile:        { type: GraphQLBoolean },
    anonymous:          { type: GraphQLBoolean },

    // Edge nodes.

    creator: {
      type: require("./channel").ChannelType,
      resolve: getChannelById
    },
    approvals: {
      type: new GraphQLList(require("./channel").ChannelType),
      resolve: getApprovalsByIdArray
    },
    rejections: {
      type: new GraphQLList(require("./channel").ChannelType),
      resolve: getRejectionsByIdArray
    }
  })
});

const ProposalInputType = new GraphQLInputObjectType({
  name: "ProposalInput",
  fields: () => ({
    channel_id:         { type: new GraphQLNonNull(GraphQLID) },
    _channel_id:        { type: GraphQLID },
    syndicate_id:       { type: new GraphQLNonNull(GraphQLID) },
    _syndicate_id:        { type: GraphQLID },
    
    action:             { type: GraphQLString }, // [merge#{syndicate_id}, dissolve]
    slug:               { type: GraphQLString },
    title:              { type: GraphQLString },
    description:        { type: GraphQLString },
    payload_url:          { type: GraphQLString },
    is_nsfw:            { type: GraphQLBoolean },
    is_unlisted:        { type: GraphQLBoolean },
    subscription_rate:  { type: GraphQLFloat },
    subscriber_pays:    { type: GraphQLBoolean },
    new_profile:        { type: GraphQLBoolean },
    anonymous:          { type: GraphQLBoolean }
  })
});

const ProposalVoteInputType = new GraphQLInputObjectType({
  name: "ProposalVoteInput",
  fields: () => ({
    proposal_id:  { type: new GraphQLNonNull(GraphQLID) },
    syndicate_id: { type: new GraphQLNonNull(GraphQLID) },
    channel_id:   { type: new GraphQLNonNull(GraphQLID) },
    vote:         { type: new GraphQLNonNull(GraphQLBoolean) }
  })
});

module.exports = {
  ProposalType,
  ProposalInputType,
  ProposalVoteInputType
};