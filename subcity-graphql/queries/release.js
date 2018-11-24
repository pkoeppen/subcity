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
  getReleaseById,
  getReleasesByChannelSlug,
  createRelease,
  updateRelease
} = require("../resolvers").release;

///////////////////////////////////////////////////
///////////////////// QUERIES /////////////////////
///////////////////////////////////////////////////

const ReleaseQuery = {

  public: {

  },

  private: {

    getReleaseById: {
      type: ReleaseType,
      args: {
        release_id: {
          name: "release_id",
          type: new GraphQLNonNull(GraphQLID)
        },
        subscriber_id: {
          name: "subscriber_id",
          type: GraphQLID
        }
      },
      resolve: getReleaseById
    }
  }
};

///////////////////////////////////////////////////
//////////////////// MUTATIONS ////////////////////
///////////////////////////////////////////////////

const ReleaseMutation = {

  private: {

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
  }
};

////////////////////////////////////////////////////

module.exports = {
  ReleaseQuery,
  ReleaseMutation
};