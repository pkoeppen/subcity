const {
  ChannelQuery,
  ChannelMutation,
  TokenQuery
} = require("./channel");

const {
  ProposalMutation
} = require("./proposal");

const {
  ReleaseMutation
} = require("./release");

const {
  SubscriberQuery,
  SubscriberMutation
} = require("./subscriber");

const {
  SyndicateQuery,
  SyndicateMutation
} = require("./syndicate");

const {
  UploadQuery
} = require("./upload");


module.exports = {

  queries: {

    // ChannelQuery
    
    getChannelById:     ChannelQuery.getChannelById,
    getChannelsByRange: ChannelQuery.getChannelsByRange,
    getChannelBySlug:   ChannelQuery.getChannelBySlug,
    getPayoutSettings:  ChannelQuery.getPayoutSettings,

    // SubscriberQuery

    getSubscriber: SubscriberQuery.getSubscriberById,
    // getSubscriberPaymentSettings

    // SyndicateQuery

    getSyndicateBySlug:   SyndicateQuery.getSyndicateBySlug,
    getSyndicatesByRange: SyndicateQuery.getSyndicatesByRange,

    // TokenQuery

    assertTokenExists: TokenQuery.assertTokenExists,

    // UploadQuery

    getUploadURL: UploadQuery.getUploadURL
  },

  mutations: {

    // ChannelMutation

    initializeChannel:    ChannelMutation.initializeChannel,
    deleteChannel:        ChannelMutation.deleteChannel,
    updateChannel:        ChannelMutation.updateChannel,
    updatePayoutSettings: ChannelMutation.updatePayoutSettings,

    // SubscriberMutation

    initializeSubscriber: SubscriberMutation.initializeSubscriber,
    createSubscription:   SubscriberMutation.createSubscription,
    deleteSubscription:   SubscriberMutation.deleteSubscription,
    updateSubscriber:     SubscriberMutation.updateSubscriber,

    // ReleaseMutation

    createRelease: ReleaseMutation.createRelease,
    deleteRelease: ReleaseMutation.deleteRelease,
    updateRelease: ReleaseMutation.updateRelease,

    // SyndicateMutation

    answerInvitation: ChannelMutation.answerInvitation, // TODO: Move this to /syndicate/mutation.js
    createSyndicate:  SyndicateMutation.createSyndicate,
    leaveSyndicate:   SyndicateMutation.leaveSyndicate,

    // ProposalMutation

    createProposal: ProposalMutation.createProposal,
    castVote:       ProposalMutation.castVote
  }
};