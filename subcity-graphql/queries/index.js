const {
  signupTokenQuery,
  channelSignupMutation,
  subscriberSignupMutation
} = require("./onboarding");

const {
  SubscriberQuery,
  SubscriberMutation
} = require("./subscriber");

const {
  ChannelQuery,
  ChannelMutation
} = require("./channel");

const {
  ReleaseQuery,
  ReleaseMutation
} = require("./release");

const {
  SyndicateQuery,
  SyndicateMutation
} = require("./syndicate");

const {
  ProposalMutation
} = require("./proposal");

const {
  getUploadURLQuery
} = require("./upload");

////////////////////////////////////////////////////

module.exports = {

  queries: {

    ///////////////////////////////////////
    // PUBLIC // Accessible to everyone. //
    ///////////////////////////////////////

    public: {

      // Signup token query.

      getSignupToken: signupTokenQuery,

      // Channel queries.

      getChannelBySlug: ChannelQuery.public.getChannelBySlug,
      getChannelsByRange: ChannelQuery.public.getChannelsByRange,

      // Release queries.

      // getReleaseBySlug: ReleaseQuery.public.getReleaseBySlug,
      // getMultipleReleases: ReleaseQuery.public.getMultipleReleases

      // Syndicate queries.

      getSyndicateBySlug:   SyndicateQuery.public.getSyndicateBySlug,
      getSyndicatesByRange: SyndicateQuery.public.getSyndicatesByRange
    },

    /////////////////////////////////////////
    // PRIVATE // Accessible to the owner. //
    /////////////////////////////////////////

    private: {

      // Subscriber (settings) queries.

      getSubscriber: SubscriberQuery.private.getSubscriberById,
      //getSubscriberPaymentSettings: SubscriberQuery.private.getSubscriberPaymentSettings,

      // Channel (settings) queries.

      getChannelById: ChannelQuery.private.getChannelById,
      getChannelBySlug: ChannelQuery.private.getChannelBySlug,
      getChannelPaymentSettings: ChannelQuery.private.getChannelPaymentSettings,

      // Release (settings) queries.

      getRelease: ReleaseQuery.private.getReleaseById,
      // getReleases: ReleasesQuery.private.getReleaseByIdArray,

      // Syndicate queries.

      getSyndicateBySlug: SyndicateQuery.private.getSyndicateBySlug,

      // S3 upload URL query.

      getUploadURL: getUploadURLQuery
    }
  },

  mutations: {

    ///////////////////////////////////////
    // PUBLIC // Accessible to everyone. //
    ///////////////////////////////////////

    public: {

      // Signup mutations.

      channelSignup: channelSignupMutation,
      subscriberSignup: subscriberSignupMutation
    },

    /////////////////////////////////////////////////
    // PRIVATE // Accessible to the owner/members. //
    /////////////////////////////////////////////////

    private: {

      // Subscriber (settings) mutations.

      //updateSubscriberPaymentSettings: SubscriberMutation.private.updateSubscriberPaymentSettings,
      modifySubscription: SubscriberMutation.private.modifySubscription,

      // Channel (settings) mutations.

      updateChannel: ChannelMutation.private.updateChannel,
      updateChannelPaymentSettings: ChannelMutation.private.updateChannelPaymentSettings,

      // Release (settings) mutations.

      createRelease: ReleaseMutation.private.createRelease,
      updateRelease: ReleaseMutation.private.updateRelease,

      // Syndicate (settings) mutations.

      createSyndicate: SyndicateMutation.private.createSyndicate,
      leaveSyndicate: SyndicateMutation.private.leaveSyndicate,
      respondToSyndicateInvite: SyndicateMutation.private.respondToSyndicateInvite,
      createProposal: ProposalMutation.private.createProposal,
      submitProposalVote: ProposalMutation.private.submitProposalVote
    }
  }
};