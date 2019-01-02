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
  MarkdownType
} = require("./misc");


const ReleaseType = new GraphQLObjectType({
  name: "Release",
  fields: () => ({

    channel_id:   { type: new GraphQLNonNull(GraphQLID)     },
    download_url: { type: GraphQLString                     },
    overview:     { type: new GraphQLNonNull(MarkdownType)  },
    payload:      { type: GraphQLString                     },
    slug:         { type: new GraphQLNonNull(GraphQLString) },
    time_created: { type: new GraphQLNonNull(GraphQLFloat)  },
    time_updated: { type: new GraphQLNonNull(GraphQLFloat)  },
    title:        { type: new GraphQLNonNull(GraphQLString) }

  })
});

const ReleaseInputType = new GraphQLInputObjectType({
  name: "ReleaseInput",
  fields: () => ({

    overview:    { type: new GraphQLNonNull(GraphQLString) },
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