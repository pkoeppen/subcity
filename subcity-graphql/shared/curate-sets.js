const {
  without
} = require("lodash");

const curateSets = item => {

  const {
    channels,
    releases,
    subscribers,
    syndicates,
    proposals,
    approvals,
    rejections,
    invitations
  } = item;

  if (channels) {
    item.channels = without(item.channels.values, "__DEFAULT__");
  }
  if (releases) {
    item.releases = without(item.releases.values, "__DEFAULT__");
  }
  if (subscribers) {
    item.subscribers = without(item.subscribers.values, "__DEFAULT__");
  }
  if (syndicates) {
    item.syndicates = without(item.syndicates.values, "__DEFAULT__");
  }
  if (proposals) {
    item.proposals = without(item.proposals.values, "__DEFAULT__");
  }
  if (approvals) {
    item.approvals = without(item.approvals.values, "__DEFAULT__");
  }
  if (rejections) {
    item.rejections = without(item.rejections.values, "__DEFAULT__");
  }
  if (invitations) {
    item.invitations = without(item.invitations.values, "__DEFAULT__");
  }

  return item;
}

////////////////////////////////////////////////////

module.exports = curateSets;