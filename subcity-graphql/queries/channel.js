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
  ChannelPaymentSettingsType,
  ChannelPaymentSettingsInputType,
  ChannelRangeInputType,
  InitializeChannelInputType
} = require("../types");

const {

  channel: {
    assertTokenExists,
    initializeChannel,
    getChannelById,
    getChannelBySlug,
    getChannelsByRange,
    getChannelPaymentSettings,
    updateChannel,
    updateChannelPaymentSettings  
  }
  
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
    resolve: getChannelById
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

  getChannelPaymentSettings: {
    type: ChannelPaymentSettingsType,
    args: {
      channel_id: {
        name: "channel_id",
        type: new GraphQLNonNull(GraphQLID)
      }
    },
    resolve: getChannelPaymentSettings
  }

};

const ChannelMutation = {

  initializeChannel: {
    type: new GraphQLNonNull(GraphQLBoolean),
    args: {
      data: {
        name: "data",
        type: new GraphQLNonNull(InitializeChannelInputType)
      }
    },
    resolve: initializeChannel
  },

  updateChannel: {
    type: new GraphQLNonNull(GraphQLBoolean),
    args: {
      data: {
        name: "data",
        type: new GraphQLNonNull(ChannelInputType)
      }
    },
    resolve: updateChannel
  },

  updateChannelPaymentSettings: {
    type: new GraphQLNonNull(GraphQLBoolean),
    args: {
      data: {
        name: "data",
        type: new GraphQLNonNull(ChannelPaymentSettingsInputType)
      }
    },
    resolve: updateChannelPaymentSettings
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
    resolve: assertTokenExists
  }
};


////////////////////////////////////////////////////////////
////////////////////////// EXPORTS /////////////////////////
////////////////////////////////////////////////////////////


module.exports = {
  ChannelQuery,
  ChannelMutation,
  TokenQuery
};