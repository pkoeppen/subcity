const {
  ChannelSignupInputType,
  SubscriberSignupInputType
} = require("./onboarding");

const {
  SubscriberType,
  SubscriberPaymentSettingsType,
  SubscriberPaymentSettingsInputType,
  ModifySubscriptionInputType
} = require("./subscriber");

const {
  ChannelType,
  ChannelInputType,
  ChannelPaymentSettingsType,
  ChannelPaymentSettingsInputType,
  ChannelRangeInputType
} = require("./channel");

const {
  ReleaseType,
  ReleaseInputType
} = require("./release");

const {
  SyndicateType,
  SyndicateInputType
} = require("./syndicate");

const {
  ProposalType,
  ProposalInputType,
  ProposalVoteInputType
} = require("./proposal");

const {
  GetUploadURLInputType
} = require("./upload");


////////////////////////////////////////////////////
///////////////////// EXPORTS //////////////////////
////////////////////////////////////////////////////


module.exports = {
  ChannelSignupInputType,
  SubscriberSignupInputType,

  SubscriberType,
  SubscriberPaymentSettingsType,
  SubscriberPaymentSettingsInputType,
  ModifySubscriptionInputType,

  ChannelType,
  ChannelInputType,
  ChannelPaymentSettingsType,
  ChannelPaymentSettingsInputType,
  ChannelRangeInputType,

  ReleaseType,
  ReleaseInputType,

  SyndicateType,
  SyndicateInputType,

  ProposalType,
  ProposalInputType,

  ProposalVoteInputType,
  
  GetUploadURLInputType
};