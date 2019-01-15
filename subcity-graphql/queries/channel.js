const {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLID,
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLString
} = require("graphql");

const {
  ChannelInputType,
  ChannelType,
  InitializeChannelInputType,
  InvitationType,
  PasswordInputType,
  PayoutSettingsType,
  PayoutSettingsInputType,
  SubscriptionType,
} = require("../types");

const {
  answerInvitation,
  assertOfferExists,
  updateChannelEmail,
  updateChannelPassword,
  deleteChannel,
  getAllChannels,
  getAllSubscriptionsByChannelID,
  getChannelByID,
  getChannelBySlug,
  getInvitationsByChannelID,
  getPayoutSettings,
  initializeChannel,
  sendEmailInvite,
  updateChannel,
  updatePayoutSettings
} = require("../resolvers");


const ChannelQuery = {

  getAllChannels: {
    type: new GraphQLList(ChannelType),
    resolve: (root, args, ctx, ast) => {

      return getAllChannels();
    }
  },

  getAllSubscriptionsByChannelID: {
    type: new GraphQLList(SubscriptionType),
    resolve: (root, args, ctx, ast) => {

      const {
        channel_id
      } = ctx;

      return getAllSubscriptionsByChannelID(channel_id);
    }
  },

  getChannelByID: {
    type: ChannelType,
    resolve: (root, args, ctx, ast) => {

      const {
        channel_id
      } = ctx;

      return getChannelByID(channel_id);
    }
  },

  getChannelBySlug: {
    type: ChannelType,
    args: {
      slug: {
        name: "slug",
        type: new GraphQLNonNull(GraphQLString)
      }
    },

    resolve: (root, args, ctx, ast) => {

      const {
        slug
      } = args;

      return getChannelBySlug(slug);
    }
  },

  getInvitationsByChannelID: {
    type: new GraphQLList(InvitationType),

    resolve: (root, args, ctx, ast) => {

      const {
        channel_id
      } = ctx;

      return getInvitationsByChannelID(channel_id);
    }
  },

  getPayoutSettings: {
    type: PayoutSettingsType,
    resolve: (root, args, ctx, ast) => {

      const {
        channel_id
      } = ctx;

      return getPayoutSettings(channel_id);
    }
  },
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

  sendEmailInvite: {
    type: new GraphQLNonNull(GraphQLBoolean),
    args: {
      email: {
        name: "email",
        type: new GraphQLNonNull(GraphQLString)
      },
    },
    resolve: (root, args, ctx, ast) => {

      const {
        channel_id
      } = ctx;

      const {
        email,
      } = args;

      return sendEmailInvite(channel_id, email);
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

  updateChannelEmail: {
    type: new GraphQLNonNull(GraphQLBoolean),
    args: {
      email: {
        name: "email",
        type: new GraphQLNonNull(GraphQLString)
      },
      password: {
        name: "password",
        type: new GraphQLNonNull(GraphQLString)
      },
      new_email: {
        name: "new_email",
        type: new GraphQLNonNull(GraphQLString)
      },
    },
    resolve: (root, args, ctx, ast) => {

      const {
        channel_id
      } = ctx;

      const {
        email,
        password,
        new_email,
      } = args;

      return updateChannelEmail(channel_id, email, password, new_email);
    }
  },

  updateChannelPassword: {
    type: new GraphQLNonNull(GraphQLBoolean),
    args: {
      data: {
        name: "data",
        type: new GraphQLNonNull(PasswordInputType)
      }
    },
    resolve: (root, args, ctx, ast) => {

      const {
        channel_id
      } = ctx;

      const {
        data
      } = args;

      return updateChannelPassword(channel_id, data);
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


const OfferQuery = {

  assertOfferExists: {
    type: new GraphQLNonNull(GraphQLBoolean),
    args: {
      offer_id: {
        name: "offer_id",
        type: new GraphQLNonNull(GraphQLID)
      }
    },

    resolve: (root, args, ctx, ast) => {

      const {
        offer_id
      } = args;

      return assertOfferExists(offer_id);
    }
  }
};


module.exports = {
  ChannelQuery,
  ChannelMutation,
  OfferQuery
};