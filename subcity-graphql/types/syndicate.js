const {
  GraphQLBoolean,
  GraphQLID,
  GraphQLInt,
  GraphQLFloat,
  GraphQLList,
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLString,
  GraphQLNonNull
} = require("graphql");

const {
  ChannelType
} = require("./channel");

const {
  MarkdownType,
  TiersInputType,
  TiersType,
  LinksType,
  LinksInputType
} = require("./misc");

const {
  ProposalType
} = require("./proposal");

const {
  SubscriptionType
} = require("./subscriber");

const {
  getChannelsBySyndicateID,
  getProposalsBySyndicateID,
  getSubscriptionsBySyndicateID,
  getSyndicateByID,
} = require("../resolvers");


const SyndicateType = new GraphQLObjectType({
  name: "Syndicate",
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

    members: {
      type: new GraphQLList(ChannelType),
      resolve: (root, args, ctx, ast) => {

        const {
          syndicate_id
        } = root;

        return getChannelsBySyndicateID(syndicate_id);
      }
    },

    proposals: {
      type: new GraphQLList(ProposalType),
      resolve: (root, args, ctx, ast) => {

        const {
          channel_id
        } = ctx;

        const {
          syndicate_id
        } = root;

        return getProposalsBySyndicateID(syndicate_id, channel_id);
      }
    },

    subscriptions: {
      type: new GraphQLList(SubscriptionType),
      resolve: (root, args, ctx, ast) => {

        const {
          channel_id
        } = ctx;

        const {
          syndicate_id
        } = root;

        return getSubscriptionsBySyndicateID(syndicate_id, channel_id);
      }
    },
  })
});

const SyndicateInputType = new GraphQLInputObjectType({
  name: "SyndicateInput",
  fields: () => ({

    description: { type: new GraphQLNonNull(GraphQLString)  },
    links:       { type: new GraphQLNonNull(LinksInputType) },
    payload:     { type: GraphQLString                      },
    slug:        { type: new GraphQLNonNull(GraphQLString)  },
    tiers:       { type: new GraphQLNonNull(TiersInputType) },
    title:       { type: new GraphQLNonNull(GraphQLString)  },
    unlisted:    { type: new GraphQLNonNull(GraphQLBoolean) }

  })
});

const InvitationType = new GraphQLObjectType({
  name: "Invitation",
  fields: () => ({

    channel_id: { type: new GraphQLNonNull(GraphQLID) },
    syndicate_id: { type: new GraphQLNonNull(GraphQLID) },
    time_created: { type: new GraphQLNonNull(GraphQLFloat) },

    syndicate: {
      type: new GraphQLNonNull(SyndicateType),
      resolve: (root, args, ctx, ast) => {

        const {
          syndicate_id
        } = root;

        return getSyndicateByID(syndicate_id);
      }
    }
  })
});


module.exports = {
  InvitationType,
  SyndicateType,
  SyndicateInputType
};
