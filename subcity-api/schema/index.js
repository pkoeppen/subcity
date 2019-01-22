const {
  GraphQLObjectType,
  GraphQLSchema  
} = require("graphql");

const {
  queries,
  mutations
} = require("../queries");


const schema = new GraphQLSchema({

  query: new GraphQLObjectType({
    name: "Query",
    fields: queries
  }),

  mutation: new GraphQLObjectType({
    name: "Mutation",
    fields: mutations
  })

});


module.exports = schema;