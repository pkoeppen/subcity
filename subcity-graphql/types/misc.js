const {
  GraphQLBoolean,
  GraphQLInt,
  GraphQLInputObjectType,
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull
} = require("graphql");


// Address

const AddressType = new GraphQLObjectType({
  name: "Address",
  fields: () => ({
    
    city:        { type: new GraphQLNonNull(GraphQLString) },
    country:     { type: new GraphQLNonNull(GraphQLString) },
    first_name:  { type: new GraphQLNonNull(GraphQLString) },
    last_name:   { type: new GraphQLNonNull(GraphQLString) },
    line1:       { type: new GraphQLNonNull(GraphQLString) },
    line2:       { type: GraphQLString                     },
    postal_code: { type: new GraphQLNonNull(GraphQLString) },
    state:       { type: new GraphQLNonNull(GraphQLString) }

  })
});

const AddressInputType = new GraphQLInputObjectType({
  name: "AddressInput",
  fields: () => ({
    
    city:        { type: new GraphQLNonNull(GraphQLString) },
    country:     { type: new GraphQLNonNull(GraphQLString) },
    first_name:  { type: new GraphQLNonNull(GraphQLString) },
    last_name:   { type: new GraphQLNonNull(GraphQLString) },
    line1:       { type: new GraphQLNonNull(GraphQLString) },
    line2:       { type: GraphQLString                     },
    postal_code: { type: new GraphQLNonNull(GraphQLString) },
    state:       { type: new GraphQLNonNull(GraphQLString) }

  })
});

// Markdown

const MarkdownType = new GraphQLObjectType({
  name: "Markdown",
  fields: () => ({

    raw:      { type: GraphQLString },
    rendered: { type: GraphQLString }

  })
});

// Slug

const SlugType = new GraphQLObjectType({
  name: "Slug",
  fields: () => ({

    channel_id: { type: GraphQLString },
    syndicate_id: { type: GraphQLString },

  })
});

// Tiers

const TierType = new GraphQLObjectType({
  name: "Tier",
  fields: () => ({

    active:      { type: GraphQLBoolean },
    description: { type: MarkdownType },
    rate:        { type: GraphQLInt },
    title:       { type: GraphQLString },

  })
});

const TiersType = new GraphQLObjectType({
  name: "Tiers",
  fields: () => ({

    _1: { type: TierType },
    _2: { type: TierType },
    _3: { type: TierType }

  })
});

const TierInputType = new GraphQLInputObjectType({
  name: "TierInput",
  fields: () => ({

    active:      { type: GraphQLBoolean },
    title:       { type: GraphQLString },
    description: { type: GraphQLString },
    rate:        { type: GraphQLInt }

  })
});

const TiersInputType = new GraphQLInputObjectType({
  name: "TiersInput",
  fields: () => ({

    _1: { type: TierInputType },
    _2: { type: TierInputType },
    _3: { type: TierInputType }

  })
});

// Links

const LinksType = new GraphQLObjectType({
  name: "Links",
  fields: () => ({

    discord: { type: GraphQLString },
    facebook: { type: GraphQLString },
    instagram: { type: GraphQLString },
    twitch: { type: GraphQLString },
    twitter: { type: GraphQLString },
    youtube: { type: GraphQLString },

  })
});

const LinksInputType = new GraphQLInputObjectType({
  name: "LinksInput",
  fields: () => ({

    discord: { type: GraphQLString },
    facebook: { type: GraphQLString },
    instagram: { type: GraphQLString },
    twitch: { type: GraphQLString },
    twitter: { type: GraphQLString },
    youtube: { type: GraphQLString },
    
  })
});


const TransferType = new GraphQLObjectType({
  name: "Transfer",
  fields: () => ({

    amount:        { type: new GraphQLNonNull(GraphQLInt)   },
    channel_id:    { type: new GraphQLNonNull(GraphQLID)    },
    fee_platform:  { type: new GraphQLNonNull(GraphQLInt)   },
    fee_processor: { type: new GraphQLNonNull(GraphQLInt)   },
    syndicate_id:  { type: GraphQLID                        },
    time_created:  { type: new GraphQLNonNull(GraphQLFloat) }

  })
});


module.exports = {
  AddressInputType,
  AddressType,
  MarkdownType,
  SlugType,
  TiersInputType,
  TiersType,
  LinksType,
  LinksInputType
};