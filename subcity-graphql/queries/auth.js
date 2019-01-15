const {
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLID,
  GraphQLInt,
  GraphQLString,
} = require("graphql");

const {
  getAuth0ClientToken
} = require("../shared");


const TokenType = new GraphQLObjectType({
  name: "Token",
  fields: () => ({

    access_token: { type: new GraphQLNonNull(GraphQLString) },
    id_token: { type: new GraphQLNonNull(GraphQLString) },
    token_type: { type: new GraphQLNonNull(GraphQLString) },
    expires_in: { type: new GraphQLNonNull(GraphQLInt) },

  })
});

const AuthQuery = {

  getToken: {
    type: new GraphQLNonNull(TokenType),
    args: {
      email: {
        name: "email",
        type: new GraphQLNonNull(GraphQLString)
      },
      password: {
        name: "password",
        type: new GraphQLNonNull(GraphQLString)
      }
    },

    resolve: (root, args, ctx, ast) => {

      const {
        email,
        password
      } = args;

      return getAuth0ClientToken(email, password);
    }
  }
};


module.exports = {
  AuthQuery
};