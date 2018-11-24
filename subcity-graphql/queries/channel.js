const {
  GraphQLID,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLBoolean,
  GraphQLString,
  GraphQLNonNull
} = require("graphql");
const { 
  ChannelType,
  ChannelInputType,
  ChannelPaymentSettingsType,
  ChannelPaymentSettingsInputType,
  ChannelRangeInputType
} = require("../types");
const {
  getChannelById,
  getChannelBySlug,
  getChannelsByRange,
  getChannelPaymentSettings,
  updateChannel,
  updateChannelPaymentSettings
} = require("../resolvers").channel;

///////////////////////////////////////////////////
///////////////////// QUERIES /////////////////////
///////////////////////////////////////////////////

const ChannelQuery = {

  public: {

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
    }
  },

  private: {

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

    // This query will be called when the user (channel/subscriber)
    // is logged in and viewing a public channel page.

    getChannelBySlug: {
      type: ChannelType,
      args: {
        slug: {
          name: "slug",
          type: new GraphQLNonNull(GraphQLString)
        },
        channel_id: {
          name: "channel_id",
          type: GraphQLID
        },
        subscriber_id: {
          name: "subscriber_id",
          type: GraphQLID
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
  }
};

///////////////////////////////////////////////////
//////////////////// MUTATIONS ////////////////////
///////////////////////////////////////////////////

const ChannelMutation = {

  private: {

    updateChannel: {
      type: new GraphQLNonNull(ChannelType),
      args: {
        data: {
          name: "data",
          type: new GraphQLNonNull(ChannelInputType)
        }
      },
      resolve: updateChannel
    },

    updateChannelPaymentSettings: {
      type: new GraphQLNonNull(ChannelPaymentSettingsType),
      args: {
        data: {
          name: "data",
          type: new GraphQLNonNull(ChannelPaymentSettingsInputType)
        }
      },
      resolve: updateChannelPaymentSettings
    }
  }
};

////////////////////////////////////////////////////

module.exports = {
  ChannelQuery,
  ChannelMutation
};