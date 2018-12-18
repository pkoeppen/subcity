const {
  GraphQLID,
  GraphQLList,
  GraphQLString,
  GraphQLNonNull
} = require("graphql");

const {
  ReleaseType,
  ReleaseInputType,
} = require("../types");

const {

  release: {
    createRelease,
    updateRelease
  }

} = require("../resolvers");


const ReleaseMutation = {

  createRelease: {
    type: new GraphQLNonNull(ReleaseType),
    args: {
      data: {
        name: "data",
        type: new GraphQLNonNull(ReleaseInputType)
      }
    },
    resolve: createRelease
  },

  updateRelease: {
    type: new GraphQLNonNull(ReleaseType),
    args: {
      data: {
        name: "data",
        type: new GraphQLNonNull(ReleaseInputType)
      }
    },
    resolve: updateRelease
  }

};

////////////////////////////////////////////////////

module.exports = {
  ReleaseMutation
};