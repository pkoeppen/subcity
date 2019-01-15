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
  LinksInputType,
  LinksType,
  MarkdownType,
  TiersInputType,
  TiersType,
} = require("./misc");

const {
  getChannelByID,
  getSyndicateByID
} = require("../resolvers");


const SyndicateType = new GraphQLObjectType({

  // This avoids a circular dependency with ./syndicate.js.

  name: "Proposal_Syndicate",
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

const UpdatesType = new GraphQLObjectType({

  name: "Updates",
  fields: () => ({

    description:  { type: MarkdownType },
    links:        { type: LinksType },
    new_profile:  { type: GraphQLBoolean },
    payload:      { type: GraphQLString },
    slug:         { type: GraphQLString },
    tiers:        { type: TiersType },
    title:        { type: GraphQLString },
    unlisted:     { type: GraphQLBoolean },

  })
});

const UpdatesInputType = new GraphQLInputObjectType({
  name: "UpdatesInput",
  fields: () => ({

    description: { type: GraphQLString  },
    links:       { type: LinksInputType },
    new_profile: { type: GraphQLBoolean },
    payload:     { type: GraphQLString  },
    slug:        { type: GraphQLString  },
    tiers:       { type: TiersInputType },
    title:       { type: GraphQLString  },
    unlisted:    { type: GraphQLBoolean }

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

const VoteType = new GraphQLObjectType({
  name: "Vote",
  fields: () => ({

    channel_id: { type: new GraphQLNonNull(GraphQLID)      },
    vote:       { type: new GraphQLNonNull(GraphQLBoolean) }
    
  })
});

const ProposalType = new GraphQLObjectType({
  name: "Proposal",
  fields: () => ({

    channel_id:   { type: GraphQLID                         },
    master_id:    { type: GraphQLID                         },
    slave_id:     { type: GraphQLID                         },
    stage:        { type: new GraphQLNonNull(GraphQLString) },
    syndicate_id: { type: new GraphQLNonNull(GraphQLID)     },
    time_created: { type: new GraphQLNonNull(GraphQLFloat)  },
    type:         { type: new GraphQLNonNull(GraphQLString) }, // (update|master|slave|join|dissolve)
    updates:      { type: UpdatesType                       },
    votes:        { type: new GraphQLList(VoteType)         },

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

    master: {
      type: SyndicateType,
      resolve: (root, args, ctx, ast) => {

        const {
          master_id
        } = root;

        if (!master_id) return null;
        return getSyndicateByID(master_id);
      }
    },

    slave: {
      type: SyndicateType,
      resolve: (root, args, ctx, ast) => {

        const {
          slave_id
        } = root;

        if (!slave_id) return null;
        return getSyndicateByID(slave_id);
      }
    }
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
    updates:      { type: UpdatesInputType                  }

  })
});

module.exports = {
  ProposalType,
  ProposalInputType,
  VoteInputType
};