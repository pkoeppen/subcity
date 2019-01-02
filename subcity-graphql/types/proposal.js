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
  ChannelType
} = require("./channel");

const {
  SyndicateInputType,
  SyndicateType
} = require("./syndicate");

const {

} = require("../resolvers");

// slave  = merge invite to slave syndicate (user-submittable)
// master = merge approval into master by slave syndicate (not user-submittable)

const ProposalType = new GraphQLObjectType({
  name: "Proposal",
  fields: () => ({

    channel_id:   { type: GraphQLID                         },
    master_id:    { type: GraphQLID                         },
    new_profile:  { type: GraphQLBoolean                    },
    slave_id:     { type: GraphQLID                         },
    stage:        { type: new GraphQLNonNull(GraphQLString) },
    syndicate_id: { type: new GraphQLNonNull(GraphQLID)     },
    time_created: { type: new GraphQLNonNull(GraphQLFloat)  },
    type:         { type: new GraphQLNonNull(GraphQLString) }, // (update|master|slave|join|dissolve)
    updates:      { type: SyndicateType                     },

    channel: {
      type: ChannelType,
      resolve: (root, args, ctx, ast) => {

        const {
          channel_id
        } = root;

        return getChannelById(channel_id);
      }
    },

    master: {
      type: SyndicateType,
      resolve: (root, args, ctx, ast) => {

        const {
          master_id: syndicate_id
        } = root;

        return getSyndicateById(syndicate_id);
      }
    },

    slave: {
      type: SyndicateType,
      resolve: (root, args, ctx, ast) => {

        const {
          slave_id: syndicate_id
        } = root;

        return getSyndicateById(syndicate_id);
      }
    },

    // // Key.

    // syndicate_id:       { type: new GraphQLNonNull(GraphQLID) },
    // proposal_id:        { type: new GraphQLNonNull(GraphQLID) },

    // // Non-editable.

    // created_at:            { type: new GraphQLNonNull(GraphQLFloat) },
    // expires:            { type: new GraphQLNonNull(GraphQLString) },
    // proposal_status:    { type: new GraphQLNonNull(GraphQLString) }, // [pending, approved, rejected]
    // profile_url:        { type: GraphQLString },

    // // Editable.

    // action:             { type: GraphQLString }, // [merge#{syndicate_id}, dissolve]
    // _channel_id:        { type: GraphQLID },
    // _syndicate_id:      { type: GraphQLID },
    // slug:               { type: GraphQLString },
    // title:              { type: GraphQLString },
    // description:        { type: GraphQLString },
    // payload:            { type: GraphQLString },
    // is_nsfw:            { type: GraphQLBoolean },
    // is_unlisted:        { type: GraphQLBoolean },
    // subscription_rate:  { type: GraphQLFloat },
    // subscriber_pays:    { type: GraphQLBoolean },
    // new_profile:        { type: GraphQLBoolean },
    // anonymous:          { type: GraphQLBoolean },

    // Edge nodes.

    // creator: {
    //   type: require("./channel").ChannelType,
    //   resolve: getChannelById
    // },
    // approvals: {
    //   type: new GraphQLList(require("./channel").ChannelType),
    //   resolve: getApprovalsByIdArray
    // },
    // rejections: {
    //   type: new GraphQLList(require("./channel").ChannelType),
    //   resolve: getRejectionsByIdArray
    // }
  })
});

const ProposalInputType = new GraphQLInputObjectType({
  name: "ProposalInput",
  fields: () => ({

    channel_id:   { type: GraphQLID                         },
    new_profile:  { type: GraphQLBoolean                    },
    slave_id:     { type: GraphQLID                         },
    syndicate_id: { type: new GraphQLNonNull(GraphQLID)     },
    type:         { type: new GraphQLNonNull(GraphQLString) }, // (update|slave|join|dissolve)
    updates:      { type: SyndicateInputType                }

  })
});

const VoteInputType = new GraphQLInputObjectType({
  name: "VoteInput",
  fields: () => ({

    syndicate_id: { type: new GraphQLNonNull(GraphQLID)      },
    time_created: { type: new GraphQLNonNull(GraphQLFloat)   },
    vote:         { type: new GraphQLNonNull(GraphQLBoolean) }

  })
});

module.exports = {
  ProposalType,
  ProposalInputType,
  VoteInputType
};