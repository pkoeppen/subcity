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
  createSyndicate,
  getAllSyndicates,
  getSyndicateByID,
  getSyndicateBySlug,
  getSyndicatesByChannelID,
  leaveSyndicate
} = require("../resolvers");


const SyndicateQuery = {

  getAllSyndicates: {

    type: new GraphQLList(SyndicateType),
    resolve: (root, args, ctx, ast) => {

      return getAllSyndicates();
    }
  },

  getSyndicateByID: {

    type: SyndicateType,
    args: {
      syndicate_id: {
        name: "syndicate_id",
        type: new GraphQLNonNull(GraphQLID)
      }
    },

    resolve: (root, args, ctx, ast) => {

      const {
        syndicate_id
      } = args;

      return getSyndicateByID(syndicate_id);
    }
  },

  getSyndicateBySlug: {

    type: SyndicateType,
    args: {
      slug: {
        name: "slug",
        type: new GraphQLNonNull(GraphQLString)
      }
    },

    resolve: (root, args, ctx, ast) => {

      const {
        slug
      } = args;

      return getSyndicateBySlug(slug);
    }
  },

  getSyndicatesByChannelID: {

    type: new GraphQLList(SyndicateType),
    resolve: (root, args, ctx, ast) => {

      const {
        channel_id
      } = ctx;

      return getSyndicatesByChannelID(channel_id);
    }
  },
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