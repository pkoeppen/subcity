const {
  GraphQLFloat,
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLString
} = require("graphql");


const UploadURLInputType = new GraphQLInputObjectType({
  name: "GetUploadURLInput",
  fields: () => ({

    mime_type:    { type: new GraphQLNonNull(GraphQLString) },
    upload_type:  { type: new GraphQLNonNull(GraphQLString) },
    filename:     { type: new GraphQLNonNull(GraphQLString) },
    time_created: { type: GraphQLFloat },
    syndicate_id: { type: GraphQLString }

  })
});


module.exports = {
  UploadURLInputType
};