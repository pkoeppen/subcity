const {
  GraphQLNonNull,
  GraphQLString,
} = require("graphql");

const {
  SlugType,
} = require("../types");

const {
  getSlugBySlug,
} = require("../resolvers");


const SharedQuery = {

  resolveSlug: {
    type: SlugType,
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

      return getSlugBySlug(slug);
    }
  },
};


module.exports = {
  SharedQuery,
};