const {
  GraphQLID,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLString
} = require("graphql");

const InitializeChannelInputType = new GraphQLInputObjectType({
  name: "InitializeChannelInput",
  fields: () => ({

    account_number:     { type: new GraphQLNonNull(GraphQLString) },
    city:               { type: new GraphQLNonNull(GraphQLString) },
    country:            { type: new GraphQLNonNull(GraphQLString) },
    dob:                { type: new GraphQLNonNull(GraphQLString) },
    email:              { type: new GraphQLNonNull(GraphQLString) },
    first_name:         { type: new GraphQLNonNull(GraphQLString) },
    last_name:          { type: new GraphQLNonNull(GraphQLString) },
    line1:              { type: new GraphQLNonNull(GraphQLString) },
    password:           { type: new GraphQLNonNull(GraphQLString) },
    personal_id_number: { type: new GraphQLNonNull(GraphQLString) },
    pin:                { type: new GraphQLNonNull(GraphQLInt) },
    postal_code:        { type: new GraphQLNonNull(GraphQLString) },
    routing_number:     { type: new GraphQLNonNull(GraphQLString) },
    state:              { type: new GraphQLNonNull(GraphQLString) },
    token_id:           { type: new GraphQLNonNull(GraphQLString) }

  })
});

const InitializeSubscriberInputType = new GraphQLInputObjectType({
  name: "InitializeSubscriberInput",
  fields: () => ({
    email:    { type: new GraphQLNonNull(GraphQLString) },
    password: { type: new GraphQLNonNull(GraphQLString) },
    token_id: { type: new GraphQLNonNull(GraphQLString) }
  })
});

module.exports = {
  InitializeChannelInputType,
  InitializeSubscriberInputType
};