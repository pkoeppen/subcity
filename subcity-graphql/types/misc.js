const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull
} = require("graphql");


const MarkdownType = new GraphQLObjectType({
  name: "Markdown",
  fields: () => ({
    raw:      { type: new GraphQLNonNull(GraphQLString) },
    rendered: { type: new GraphQLNonNull(GraphQLString) }
  })
});


////////////////////////////////////////////////////
///////////////////// EXPORTS //////////////////////
////////////////////////////////////////////////////


module.exports = {
  MarkdownType
};