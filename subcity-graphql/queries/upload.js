const {
  GraphQLString,
  GraphQLNonNull
} = require("graphql");
const {
  GetUploadURLInputType
} = require("../types")
const {
  getUploadURL
} = require("../resolvers").upload;

////////////////////////////////////////////////////

const getUploadURLQuery = {
  type: new GraphQLNonNull(GraphQLString),
  args: {
    data: {
      name: "data",
      type: new GraphQLNonNull(GetUploadURLInputType)
    }
  },
  resolve: getUploadURL
};

////////////////////////////////////////////////////

module.exports = {
  getUploadURLQuery
};