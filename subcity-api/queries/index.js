const {
  AuthQuery
} = require("./auth");
const {
  ChannelQuery,
  ChannelMutation,
  OfferQuery
} = require("./channel");
const {
  ProposalMutation
} = require("./proposal");
const {
  ReleaseMutation,
  ReleaseQuery,
} = require("./release");
const {
  SharedQuery,
} = require("./shared");
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

    // SharedQuery

    resolveSlug: SharedQuery.resolveSlug,

    // AuthQuery

    getToken: AuthQuery.getToken,

    // ChannelQuery
    
    getAllChannels: ChannelQuery.getAllChannels,
    getAllSubscriptionsByChannelID: ChannelQuery.getAllSubscriptionsByChannelID,
    getChannelByID: ChannelQuery.getChannelByID,
    getChannelBySlug: ChannelQuery.getChannelBySlug,
    getInvitationsByChannelID: ChannelQuery.getInvitationsByChannelID,
    getPayoutSettings: ChannelQuery.getPayoutSettings,

    // ReleaseQuery

    getReleasesByChannelID: ReleaseQuery.getReleasesByChannelID,

    // SubscriberQuery

    getSubscriptionsBySubscriberID: SubscriberQuery.getSubscriptionsBySubscriberID,
    getSubscriberByID: SubscriberQuery.getSubscriberByID,
    getSubscription: SubscriberQuery.getSubscription,
    getSources: SubscriberQuery.getSources,

    // SyndicateQuery

    getAllSyndicates: SyndicateQuery.getAllSyndicates,
    getSyndicateBySlug: SyndicateQuery.getSyndicateBySlug,
    getSyndicatesByChannelID: SyndicateQuery.getSyndicatesByChannelID,

    // OfferQuery

    assertOfferExists: OfferQuery.assertOfferExists,

    // UploadQuery

    getUploadURL: UploadQuery.getUploadURL
  },

  mutations: {

    // ChannelMutation

    initializeChannel: ChannelMutation.initializeChannel,
    deleteChannel: ChannelMutation.deleteChannel,
    sendEmailInvite: ChannelMutation.sendEmailInvite,
    updateChannel: ChannelMutation.updateChannel,
    updateChannelEmail: ChannelMutation.updateChannelEmail,
    updateChannelPassword: ChannelMutation.updateChannelPassword,
    updatePayoutSettings: ChannelMutation.updatePayoutSettings,

    // SubscriberMutation

    initializeSubscriber: SubscriberMutation.initializeSubscriber,
    createSource: SubscriberMutation.createSource,
    createSubscription: SubscriberMutation.createSubscription,
    deleteAllSubscriptions: SubscriberMutation.deleteAllSubscriptions,
    deleteSource: SubscriberMutation.deleteSource,
    deleteSubscriber: SubscriberMutation.deleteSubscriber,
    deleteSubscription: SubscriberMutation.deleteSubscription,
    updateSubscriber: SubscriberMutation.updateSubscriber,
    updateSubscriberEmail: SubscriberMutation.updateSubscriberEmail,
    updateSubscriberPassword: SubscriberMutation.updateSubscriberPassword,
    setDefaultSource: SubscriberMutation.setDefaultSource,

    // ReleaseMutation

    createRelease: ReleaseMutation.createRelease,
    deleteRelease: ReleaseMutation.deleteRelease,
    updateRelease: ReleaseMutation.updateRelease,

    // SyndicateMutation

    answerInvitation: ChannelMutation.answerInvitation, // TODO: Move this to /syndicate/mutation.js
    createSyndicate: SyndicateMutation.createSyndicate,
    leaveSyndicate: SyndicateMutation.leaveSyndicate,

    // ProposalMutation

    createProposal: ProposalMutation.createProposal,
    castVote: ProposalMutation.castVote
  }
};