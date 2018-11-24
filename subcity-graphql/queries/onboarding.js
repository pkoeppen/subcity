const {
  GraphQLBoolean,
  GraphQLID,
  GraphQLNonNull
} = require("graphql");
const {
  ChannelSignupInputType,
  SubscriberSignupInputType,
  ChannelType,
  SubscriberType
} = require("../types");
const {
  getSignupTokenById,
  handleChannelSignup,
  handleSubscriberSignup
} = require("../resolvers").onboarding;

////////////////////////////////////////////////////

const signupTokenQuery = {
  type: new GraphQLNonNull(GraphQLBoolean),
  args: {
    token_id: {
      name: "token_id",
      type: new GraphQLNonNull(GraphQLID)
    }
  },
  resolve: getSignupTokenById
};

////////////////////////////////////////////////////

const channelSignupMutation = {
  type: new GraphQLNonNull(ChannelType),
  args: {
    data: {
      name: "data",
      type: new GraphQLNonNull(ChannelSignupInputType)
    }
  },
  resolve: handleChannelSignup
};

////////////////////////////////////////////////////

const subscriberSignupMutation = {
  type: new GraphQLNonNull(SubscriberType),
  args: {
    data: {
      name: "data",
      type: new GraphQLNonNull(SubscriberSignupInputType)
    }
  },
  resolve: handleSubscriberSignup
};

////////////////////////////////////////////////////

module.exports = {
  signupTokenQuery,
  channelSignupMutation,
  subscriberSignupMutation
};