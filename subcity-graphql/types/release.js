const {
  GraphQLBoolean,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLString,
  GraphQLNonNull,
} = require("graphql");

const ReleaseType = new GraphQLObjectType({
  name: "Release",
  fields: () => ({
    
    // Key.

    release_id: { type: new GraphQLNonNull(GraphQLID) },
    channel_id: { type: new GraphQLNonNull(GraphQLID) },

    // Non-editable.

    created_at:   { type: new GraphQLNonNull(GraphQLInt) },
    profile_url:  { type: new GraphQLNonNull(GraphQLString) },
    banner_url:   { type: new GraphQLNonNull(GraphQLString) },
    likes:        { type: new GraphQLNonNull(GraphQLInt) },
    dislikes:     { type: new GraphQLNonNull(GraphQLInt) },
    download_url: { type: GraphQLString },

    // Editable.

    slug:        { type: new GraphQLNonNull(GraphQLString) },
    title:       { type: new GraphQLNonNull(GraphQLString) },
    description: { type: new GraphQLNonNull(GraphQLString) },
    payload_url: { type: GraphQLString }
  })
});

const ReleaseInputType = new GraphQLInputObjectType({
  name: "ReleaseInput",
  fields: () => ({
    release_id:  { type: GraphQLID },
    channel_id:  { type: new GraphQLNonNull(GraphQLID) },
    slug:        { type: new GraphQLNonNull(GraphQLString) },
    title:       { type: new GraphQLNonNull(GraphQLString) },
    description: { type: new GraphQLNonNull(GraphQLString) },
    payload_url: { type: GraphQLString },
  })
});

module.exports = {
  ReleaseType,
  ReleaseInputType
};