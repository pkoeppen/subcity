const {
  GraphQLNonNull,
  GraphQLString
} = require("graphql");

const {
  UploadURLInputType
} = require("../types")

const {

  upload: {
    getUploadURL
  }

} = require("../resolvers");


const UploadQuery = {

  getUploadURL: {
    type: new GraphQLNonNull(GraphQLString),
    args: {
      data: {
        name: "data",
        type: new GraphQLNonNull(UploadURLInputType)
      }
    },
    resolve: getUploadURL
  }

};


module.exports = {
  UploadQuery
};