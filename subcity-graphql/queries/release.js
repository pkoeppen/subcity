const {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLList,
  GraphQLNonNull
} = require("graphql");

const {
  ReleaseType,
  ReleaseInputType
} = require("../types");

const {
  createRelease,
  deleteRelease,
  getReleasesByChannelID,
  updateRelease
} = require("../resolvers");


const ReleaseQuery = {

  getReleasesByChannelID: {

    type: new GraphQLList(ReleaseType),
    resolve: (root, args, ctx, ast) => {

      const {
        channel_id
      } = ctx;

      return getReleasesByChannelID(channel_id);
    }
  },
};


const ReleaseMutation = {

  createRelease: {

    type: new GraphQLNonNull(ReleaseType),
    args: {
      data: {
        name: "data",
        type: new GraphQLNonNull(ReleaseInputType)
      }
    },
    resolve: (root, args, ctx, ast) => {

      const {
        channel_id
      } = ctx;

      const {
        data
      } = args;

      return createRelease(channel_id, data);
    }
  },

  deleteRelease: {

    type: new GraphQLNonNull(GraphQLBoolean),
    args: {
      time_created: {
        name: "time_created",
        type: new GraphQLNonNull(GraphQLFloat)
      }
    },
    resolve: (root, args, ctx, ast) => {

      const {
        channel_id
      } = ctx;

      const {
        time_created
      } = args;

      return deleteRelease(channel_id, time_created);
    }
  },

  updateRelease: {

    type: new GraphQLNonNull(ReleaseType),
    args: {
      time_created: {
        name: "time_created",
        type: new GraphQLNonNull(GraphQLFloat)
      },
      data: {
        name: "data",
        type: new GraphQLNonNull(ReleaseInputType)
      }
    },
    resolve: (root, args, ctx, ast) => {

      const {
        channel_id
      } = ctx;

      const {
        time_created,
        data
      } = args;

      return updateRelease(channel_id, time_created, data);
    }
  }
};


module.exports = {
  ReleaseMutation,
  ReleaseQuery,
};
