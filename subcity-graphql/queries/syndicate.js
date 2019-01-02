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

    getSyndicateById,
    getSyndicateBySlug,
    getSyndicatesByRange,

  createSyndicate,
  leaveSyndicate
  
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
    resolve: (root, args, ctx, ast) => {

      const {
        channel_id
      } = ctx;

      const {
        data
      } = args;

      return createSyndicate(channel_id, data);
    }
  },

  leaveSyndicate: {
    type: new GraphQLNonNull(GraphQLBoolean),
    args: {
      syndicate_id: {
        name: "syndicate_id",
        type: new GraphQLNonNull(GraphQLID)
      }
    },
    resolve: (root, args, ctx, ast) => {

      const {
        channel_id
      } = ctx;

      const {
        syndicate_id
      } = args;

      return leaveSyndicate(channel_id, syndicate_id);
    }
  }
};


module.exports = {
  SyndicateQuery,
  SyndicateMutation
};