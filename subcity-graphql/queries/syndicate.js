const {
  GraphQLBoolean,
  GraphQLID,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLString,
  GraphQLNonNull
} = require("graphql");

const {
  SyndicateType,
  SyndicateInputType
} = require("../types");

const {

  syndicate: {
    getSyndicateById,
    getSyndicateBySlug,
    getSyndicatesByRange,
    createSyndicate,
    updateSyndicate,
    leaveSyndicate,
    respondToSyndicateInvite  
  }
  
} = require("../resolvers");


const SyndicateQuery = {

  getSyndicateById: {
    type: SyndicateType,
    args: {
      syndicate_id: {
        name: "syndicate_id",
        type: new GraphQLNonNull(GraphQLID)
      }
    },
    resolve: getSyndicateById
  },

  getSyndicatesByRange: {
    type: new GraphQLList(SyndicateType),
    args: {
      data: {
        name: "data",
        type: new GraphQLNonNull(new GraphQLInputObjectType({
          name: "SyndicateRangeInput",
          fields: () => ({
            search: { type: GraphQLString },
            deep:   { type: GraphQLBoolean }
          })
        }))
      }
    },
    resolve: getSyndicatesByRange
  },

  getSyndicateBySlug: {
    type: SyndicateType,
    args: {
      slug: {
        name: "slug",
        type: new GraphQLNonNull(GraphQLString)
      }
    },
    resolve: getSyndicateBySlug
  }

};


const SyndicateMutation = {

  createSyndicate: {
    type: new GraphQLNonNull(SyndicateType),
    args: {
      data: {
        name: "data",
        type: new GraphQLNonNull(SyndicateInputType)
      }
    },
    resolve: createSyndicate
  },

  updateSyndicate: {
    type: new GraphQLNonNull(SyndicateType),
    args: {
      data: {
        name: "data",
        type: new GraphQLNonNull(SyndicateInputType)
      }
    },
    resolve: updateSyndicate
  },

  leaveSyndicate: {
    type: new GraphQLNonNull(GraphQLID),
    args: {
      data: {
        name: "data",
        type: new GraphQLNonNull(new GraphQLInputObjectType({
          name: "LeaveSyndicateInput",
          fields: () => ({
            channel_id:   { type: new GraphQLNonNull(GraphQLID) },
            syndicate_id: { type: new GraphQLNonNull(GraphQLID) }
          })
        }))
      }
    },
    resolve: leaveSyndicate
  },

  respondToSyndicateInvite: {
    type: new GraphQLNonNull(SyndicateType),
    args: {
      data: {
        name: "data",
        type: new GraphQLNonNull(new GraphQLInputObjectType({
          name: "RespondToSyndicateInviteInput",
          fields: () => ({
            channel_id:   { type: new GraphQLNonNull(GraphQLID) },
            syndicate_id: { type: new GraphQLNonNull(GraphQLID) },
            approved:     { type: new GraphQLNonNull(GraphQLBoolean) }
          })
        }))
      }
    },
    resolve: respondToSyndicateInvite
  }

};

////////////////////////////////////////////////////

module.exports = {
  SyndicateQuery,
  SyndicateMutation
};