const {
  GraphQLNonNull,
  GraphQLString
} = require("graphql");

const {
  UploadURLInputType
} = require("../types")

const {
  getUploadURL
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
    resolve: (root, args, ctx, ast) => {

      const {
        channel_id
      } = ctx;

      const {
        data
      } = args;

      return getUploadURL(channel_id, data);
    }
  }

};


module.exports = {
  UploadQuery
};