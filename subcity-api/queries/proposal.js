const {
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLID
} = require("graphql");

const {
  ProposalType,
  ProposalInputType,
  VoteInputType
} = require("../types");

const {
  castVote,
  createProposal,
} = require("../resolvers");


const ProposalMutation = {

  castVote: {
    type: new GraphQLNonNull(ProposalType),
    args: {
      data: {
        name: "data",
        type: new GraphQLNonNull(VoteInputType)
      }
    },
    resolve: (root, args, ctx, ast) => {

      const {
        channel_id
      } = ctx;

      const {
        data
      } = args;

      return castVote(channel_id, data);
    }
  },

  createProposal: {
    type: new GraphQLNonNull(ProposalType),
    args: {
      data: {
        name: "data",
        type: new GraphQLNonNull(ProposalInputType)
      }
    },
    resolve: (root, args, ctx, ast) => {

      const {
        channel_id
      } = ctx;

      const {
        data
      } = args;

      return createProposal(channel_id, data);
    }
  } 

}


module.exports = {
  ProposalMutation
};