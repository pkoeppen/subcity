const {
  GraphQLBoolean,
  GraphQLID,
  GraphQLNonNull
} = require("graphql");

const {
  ChannelType,
  ChannelSignupInputType,
  SubscriberSignupInputType,
  SubscriberType
} = require("../types");

const {
  onboarding: {
    assertTokenExists,
    initializeChannel,
    initializeSubscriber
  }
} = require("../resolvers");


const ChannelSignupMutation = {

  initializeChannel: {
    type: new GraphQLNonNull(GraphQLBoolean),
    args: {
      data: {
        name: "data",
        type: new GraphQLNonNull(ChannelSignupInputType)
      }
    },
    resolve: initializeChannel
  }

};

const SubscriberSignupMutation = {

  initializeSubscriber: {
    type: new GraphQLNonNull(GraphQLBoolean),
    args: {
      data: {
        name: "data",
        type: new GraphQLNonNull(SubscriberSignupInputType)
      }
    },
    resolve: initializeSubscriber
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


module.exports = {
  ChannelSignupMutation,
  SubscriberSignupMutation,
  TokenQuery
};
