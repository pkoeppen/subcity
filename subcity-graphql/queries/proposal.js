const {
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLID
} = require("graphql");

const {
  ProposalType,
  ProposalInputType,
  ProposalVoteInputType
} = require("../types");

const {

  proposal: {
    createProposal,
    submitProposalVote
  }
  
} = require("../resolvers");


const ProposalMutation = {

  createProposal: {
    type: new GraphQLNonNull(ProposalType),
    args: {
      data: {
        name: "data",
        type: new GraphQLNonNull(ProposalInputType)
      }
    },
    resolve: createProposal
  },

  submitProposalVote: {
    type: new GraphQLNonNull(ProposalType),
    args: {
      data: {
        name: "data",
        type: new GraphQLNonNull(ProposalVoteInputType)
      }
    },
    resolve: submitProposalVote
  } 

}


module.exports = {
  ProposalMutation
};