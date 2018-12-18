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
    
    getChannelById:            ChannelQuery.getChannelById,
    getChannelsByRange:        ChannelQuery.getChannelsByRange,
    getChannelBySlug:          ChannelQuery.getChannelBySlug,
    getChannelPaymentSettings: ChannelQuery.getChannelPaymentSettings,

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

    initializeChannel:            ChannelMutation.initializeChannel,
    updateChannel:                ChannelMutation.updateChannel,
    updateChannelPaymentSettings: ChannelMutation.updateChannelPaymentSettings,

    // SubscriberMutation

    initializeSubscriber: SubscriberMutation.initializeSubscriber,
    // updateSubscriber
    // updateSubscriberPaymentSettings
    modifySubscription: SubscriberMutation.modifySubscription,

    // ReleaseMutation

    createRelease: ReleaseMutation.createRelease,
    updateRelease: ReleaseMutation.updateRelease,

    // SyndicateMutation

    createSyndicate:          SyndicateMutation.createSyndicate,
    leaveSyndicate:           SyndicateMutation.leaveSyndicate,
    respondToSyndicateInvite: SyndicateMutation.respondToSyndicateInvite,

    // ProposalMutation

    createProposal:     ProposalMutation.createProposal,
    submitProposalVote: ProposalMutation.submitProposalVote
  }
};