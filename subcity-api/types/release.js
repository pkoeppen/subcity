const {
  GraphQLID,
  GraphQLInt,
  GraphQLObjectType,
  GraphQLFloat,
  GraphQLInputObjectType,
  GraphQLString,
  GraphQLNonNull,
} = require("graphql");
const {
  getDownloadURL,
} = require("../resolvers");
const {
  MarkdownType
} = require("./misc");


const ReleaseType = new GraphQLObjectType({
  name: "Release",
  fields: () => ({

    channel_id:   { type: new GraphQLNonNull(GraphQLID)     },
    description:  { type: new GraphQLNonNull(MarkdownType)  },
    payload:      { type: GraphQLString                     },
    slug:         { type: new GraphQLNonNull(GraphQLString) },
    tier:         { type: new GraphQLNonNull(GraphQLInt)    },
    time_created: { type: new GraphQLNonNull(GraphQLFloat)  },
    time_updated: { type: new GraphQLNonNull(GraphQLFloat)  },
    title:        { type: new GraphQLNonNull(GraphQLString) },

    download: {
      type: GraphQLString,
      args: {
        slug: {
          name: "slug",
          type: new GraphQLNonNull(GraphQLString)
        }
      },
      resolve: (root, args, ctx, ast) => {

        if (args.slug !== root.slug) return;

        const {
          channel_id,
          subscriber_id
        } = ctx;

        return getDownloadURL({ channel_id, subscriber_id }, root);
      }
    },

  })
});

const ReleaseInputType = new GraphQLInputObjectType({
  name: "ReleaseInput",
  fields: () => ({

    description: { type: new GraphQLNonNull(GraphQLString) },
    payload:     { type: GraphQLString                     },
    slug:        { type: new GraphQLNonNull(GraphQLString) },
    tier:        { type: new GraphQLNonNull(GraphQLInt)    },
    title:       { type: new GraphQLNonNull(GraphQLString) }

  })
});


module.exports = {
  ReleaseType,
  ReleaseInputType
};