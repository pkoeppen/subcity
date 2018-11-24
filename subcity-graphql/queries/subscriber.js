const {
  GraphQLID,
  GraphQLBoolean,
  GraphQLNonNull
} = require("graphql");

const { 
  SubscriberType,
  SubscriberPaymentSettingsType,
  SubscriberPaymentSettingsInputType,
  ModifySubscriptionInputType
} = require("../types");

const {
  getSubscriberById,
  getSubscriberPaymentSettings,
  modifySubscription,
  updatePaymentSettings
} = require("../resolvers").subscriber;

///////////////////////////////////////////////////
///////////////////// QUERIES /////////////////////
///////////////////////////////////////////////////

const SubscriberQuery = {

  private: {

    getSubscriberById: {
      type: SubscriberType,
      args: {
        subscriber_id: {
          name: "subscriber_id",
          type: new GraphQLNonNull(GraphQLID)
        }
      },
      resolve: getSubscriberById
    },

    // getSubscriberPaymentSettings: {
    //   type: SubscriberPaymentSettingsType,
    //   args: {
    //     subscriber_id: {
    //       name: "subscriber_id",
    //       type: new GraphQLNonNull(GraphQLID)
    //     }
    //   },
    //   resolve: getSubscriberPaymentSettings
    // }
  }
};

///////////////////////////////////////////////////
//////////////////// MUTATIONS ////////////////////
///////////////////////////////////////////////////

const SubscriberMutation = {

  private: {

    modifySubscription: {
      type: new GraphQLNonNull(GraphQLBoolean),
      args: {
        data: {
          name: "data",
          type: new GraphQLNonNull(ModifySubscriptionInputType)
        }
      },
      resolve: modifySubscription
    },

    // updateSubscriberPaymentSettings: {
    //   type: new GraphQLNonNull(GraphQLBoolean),
    //   args: {
    //     data: {
    //       name: "data",
    //       type: new GraphQLNonNull(SubscriberPaymentSettingsInputType)
    //     }
    //   },
    //   resolve: updatePaymentSettings
    // }
  }
};

///////////////////////////////////////////////////

module.exports = {
  SubscriberQuery,
  SubscriberMutation
};