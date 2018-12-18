const {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLID,
  GraphQLNonNull
} = require("graphql");

const {
  InitializeSubscriberInputType,
  SubscriberType,
  SubscriberPaymentSettingsType,
  SubscriberPaymentSettingsInputType,
  ModifySubscriptionInputType
} = require("../types");

const {
  initializeSubscriber,
  getSubscriberById,
  getSubscriberPaymentSettings,
  modifySubscription,
  updatePaymentSettings
} = require("../resolvers").subscriber;


const SubscriberQuery = {

  getSubscriberById: {
    type: SubscriberType,
    args: {
      subscriber_id: {
        name: "subscriber_id",
        type: new GraphQLNonNull(GraphQLID)
      }
    },
    resolve: getSubscriberById
  }

};


const SubscriberMutation = {

  initializeSubscriber: {
    type: new GraphQLNonNull(GraphQLBoolean),
    args: {
      data: {
        name: "data",
        type: new GraphQLNonNull(InitializeSubscriberInputType)
      }
    },
    resolve: initializeSubscriber
  },

  modifySubscription: {
    type: new GraphQLNonNull(GraphQLBoolean),
    args: {
      data: {
        name: "data",
        type: new GraphQLNonNull(ModifySubscriptionInputType)
      }
    },
    resolve: modifySubscription
  }

};


module.exports = {
  SubscriberQuery,
  SubscriberMutation
};