const {
  graphql,
  parse,
  print,
  typeFromAST,
  GraphQLSchema,
  GraphQLObjectType,
} = require('graphql');

const {
  queries,
  mutations
} = require('../queries/');

////////////////////////////////////////////////////

const schema = {

  public: new GraphQLSchema({
    query: new GraphQLObjectType({
      name: "QueryPublic",
      fields: queries.public
    }),
    mutation: new GraphQLObjectType({
      name: "MutationPublic",
      fields: mutations.public
    })
  }),

  private: new GraphQLSchema({
    query: new GraphQLObjectType({
      name: "QueryPrivate",
      fields: queries.private
    }),
    mutation: new GraphQLObjectType({
      name: "MutationPrivate",
      fields: mutations.private
    }),
  })

};

////////////////////////////////////////////////////

module.exports = schema;