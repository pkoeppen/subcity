const {
  GraphQLBoolean,
  GraphQLID,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLString
} = require("graphql");

const {
  ChannelType,
  ChannelInputType,
  PayoutSettingsType,
  PayoutSettingsInputType,
  ChannelRangeInputType,
  InitializeChannelInputType
} = require("../types");

const {

  answerInvitation,
  assertTokenExists,
  deleteChannel,
  getChannelById,
  initializeChannel,

  getChannelBySlug,
  getChannelsByRange,
  getPayoutSettings,
  updateChannel,
  updatePayoutSettings
  
} = require("../resolvers");


const ChannelQuery = {

  getChannelById: {

    type: ChannelType,
    args: {
      channel_id: {
        name: "channel_id",
        type: new GraphQLNonNull(GraphQLID)
      }
    },

    resolve: (root, args, ctx, ast) => {

      const {
        channel_id
      } = ctx;

      return getChannelById(channel_id);
    }
  },

  getChannelsByRange: {
    type: new GraphQLList(ChannelType),
    args: {
      data: {
        name: "data",
        type: new GraphQLNonNull(new GraphQLInputObjectType({
          name: "ChannelRangeInput",
          fields: () => ({
            search: { type: GraphQLString },
            deep:   { type: GraphQLBoolean }
          })
        }))
      }
    },
    resolve: getChannelsByRange
  },

  getChannelBySlug: {
    type: ChannelType,
    args: {
      slug: {
        name: "slug",
        type: new GraphQLNonNull(GraphQLString)
      }
    },
    resolve: getChannelBySlug
  },

  getPayoutSettings: {
    type: PayoutSettingsType,
    args: {
      channel_id: {
        name: "channel_id",
        type: new GraphQLNonNull(GraphQLID)
      }
    },
    resolve: getPayoutSettings
  }

};


const ChannelMutation = {

  answerInvitation: {
    type: new GraphQLNonNull(GraphQLBoolean),
    args: {
      decision: {
        name: "decision",
        type: new GraphQLNonNull(GraphQLBoolean)
      },
      syndicate_id: {
        name: "syndicate_id",
        type: new GraphQLNonNull(GraphQLID)
      }
    },
    resolve: (root, args, ctx, ast) => {

      const {
        channel_id
      } = ctx;

      const {
        decision,
        syndicate_id
      } = args;

      return answerInvitation(channel_id, syndicate_id, decision);
    }
  },

  deleteChannel: {
    type: new GraphQLNonNull(GraphQLBoolean),
    resolve: (root, args, ctx, ast) => {

      const {
        channel_id
      } = ctx;

      return deleteChannel(channel_id);
    }
  },

  initializeChannel: {
    type: new GraphQLNonNull(ChannelType),
    args: {
      data: {
        name: "data",
        type: new GraphQLNonNull(InitializeChannelInputType)
      }
    },
    resolve: (root, args, ctx, ast) => {

      const {
        ip_address
      } = ctx;

      const data = Object.assign({}, args.data, { ip_address });

      return initializeChannel(data);
    }
  },

  updateChannel: {
    type: new GraphQLNonNull(ChannelType),
    args: {
      data: {
        name: "data",
        type: new GraphQLNonNull(ChannelInputType)
      }
    },
    resolve: (root, args, ctx, ast) => {

      const {
        channel_id
      } = ctx;

      const {
        data
      } = args;

      return updateChannel(channel_id, data);
    }
  },

  updatePayoutSettings: {
    type: new GraphQLNonNull(GraphQLBoolean),
    args: {
      data: {
        name: "data",
        type: new GraphQLNonNull(PayoutSettingsInputType)
      }
    },
    resolve: (root, args, ctx, ast) => {

      const {
        channel_id
      } = ctx;

      const {
        data
      } = args;

      return updatePayoutSettings(channel_id, data)
    }
  }
};


const TokenQuery = {

  assertTokenExists: {
    type: new GraphQLNonNull(GraphQLBoolean),
    args: {
      token_id: {
        name: "token_id",
        type: new GraphQLNonNull(GraphQLID)
      }
    },
    resolve: (root, args, ctx, ast) => {

      const {
        token_id
      } = args;

      return assertTokenExists(token_id);
    }
  }
};


module.exports = {
  ChannelQuery,
  ChannelMutation,
  TokenQuery
};