const {
  GraphQLID,
  GraphQLInputObjectType,
  GraphQLString,
  GraphQLNonNull,
} = require("graphql");

const GetUploadURLInputType = new GraphQLInputObjectType({
  name: "GetUploadURLInput",
  fields: () => ({
    mime_type:    { type: new GraphQLNonNull(GraphQLString) },
    upload_type:  { type: new GraphQLNonNull(GraphQLString) },
    filename:     { type: new GraphQLNonNull(GraphQLString) },
    channel_id:   { type: new GraphQLNonNull(GraphQLString) },
    release_id:   { type: GraphQLString },
    syndicate_id: { type: GraphQLString },
    proposal_id:  { type: GraphQLString }
  })
});

module.exports = {
  GetUploadURLInputType
};