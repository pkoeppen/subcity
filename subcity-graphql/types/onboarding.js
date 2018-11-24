const {
  GraphQLID,
  GraphQLInputObjectType,
  GraphQLString,
  GraphQLNonNull,
} = require("graphql");

const ChannelSignupInputType = new GraphQLInputObjectType({
  name: "ChannelSignupInput",
  fields: () => ({
    token_id: { type: new GraphQLNonNull(GraphQLID) },
    email: { type: new GraphQLNonNull(GraphQLString) },
    password: { type: new GraphQLNonNull(GraphQLString) },

    // Name

    first_name: { type: new GraphQLNonNull(GraphQLString) },
    last_name: { type: new GraphQLNonNull(GraphQLString) },

    // Address

    country: { type: new GraphQLNonNull(GraphQLString) },
    city: { type: new GraphQLNonNull(GraphQLString) },
    line1: { type: new GraphQLNonNull(GraphQLString) },
    postal_code: { type: new GraphQLNonNull(GraphQLString) },
    state: { type: new GraphQLNonNull(GraphQLString) },

    // DOB

    dob: { type: new GraphQLNonNull(GraphQLString) },

    // Bank Account

    routing_number: { type: new GraphQLNonNull(GraphQLString) }, // US only
    account_number: { type: new GraphQLNonNull(GraphQLString) },

    // Legal

    personal_id_number: { type: new GraphQLNonNull(GraphQLString) },
  })
});

const SubscriberSignupInputType = new GraphQLInputObjectType({
  name: "SubscriberSignupInput",
  fields: () => ({
    email: { type: new GraphQLNonNull(GraphQLString) },
    password: { type: new GraphQLNonNull(GraphQLString) },
    token_id: { type: new GraphQLNonNull(GraphQLString) }
  })
});

module.exports = {
  ChannelSignupInputType,
  SubscriberSignupInputType
};