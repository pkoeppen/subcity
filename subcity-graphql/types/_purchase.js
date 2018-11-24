const {
  GraphQLID,
  GraphQLString,
  GraphQLNonNull
} = require("graphql");

const PurchaseType = new GraphQLObjectType({
  name: "Purchase",
  fields: () => ({

    // Key.

    subscriber_id: { type: new GraphQLNonNull(GraphQLID) },
    channel_id:    { type: new GraphQLNonNull(GraphQLID) },

    // Non-editable.

    release_id: { type: GraphQLID },
    start_date: { type: GraphQLString },
    end_date:   { type: GraphQLString },
    type:       { type: new GraphQLNonNull(GraphQLString) }, // [subscription, purchase]
    source:     { type: new GraphQLNonNull(GraphQLString) }  // [channel:{channel_id}, syndicate:{syndicate_id}]
    //expires: { type: foobar }
  })
});

module.exports = {
  ProposalType
};