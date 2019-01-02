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
    line_1:      { type: new GraphQLNonNull(GraphQLString) },
    line_2:      { type: GraphQLString                     },
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
    line_1:      { type: new GraphQLNonNull(GraphQLString) },
    line_2:      { type: GraphQLString                     },
    postal_code: { type: new GraphQLNonNull(GraphQLString) },
    state:       { type: new GraphQLNonNull(GraphQLString) }

  })
});

// Markdown

const MarkdownType = new GraphQLObjectType({
  name: "Markdown",
  fields: () => ({

    raw:      { type: new GraphQLNonNull(GraphQLString) },
    rendered: { type: new GraphQLNonNull(GraphQLString) }

  })
});

// Tiers

const TierType = new GraphQLObjectType({
  name: "Tier",
  fields: () => ({

    active:      { type: new GraphQLNonNull(GraphQLBoolean) },
    alias:       { type: GraphQLString },
    description: { type: MarkdownType },
    rate:        { type: new GraphQLNonNull(GraphQLInt) }

  })
});

const TiersType = new GraphQLObjectType({
  name: "Tiers",
  fields: () => ({

    _1: { type: new GraphQLNonNull(TierType) },
    _2: { type: new GraphQLNonNull(TierType) },
    _3: { type: new GraphQLNonNull(TierType) }

  })
});

const TierInputType = new GraphQLInputObjectType({
  name: "TierInput",
  fields: () => ({

    active:      { type: new GraphQLNonNull(GraphQLBoolean) },
    alias:       { type: GraphQLString },
    description: { type: GraphQLString },
    rate:        { type: new GraphQLNonNull(GraphQLInt) }

  })
});

const TiersInputType = new GraphQLInputObjectType({
  name: "TiersInput",
  fields: () => ({

    _1: { type: new GraphQLNonNull(TierInputType) },
    _2: { type: new GraphQLNonNull(TierInputType) },
    _3: { type: new GraphQLNonNull(TierInputType) }

  })
});

// Links

const LinkType = new GraphQLObjectType({
  name: "Link",
  fields: () => ({

    title: { type: new GraphQLNonNull(GraphQLBoolean) },
    url:   { type: new GraphQLNonNull(GraphQLString) }

  })
});

const LinksType = new GraphQLObjectType({
  name: "Links",
  fields: () => ({

    _1: { type: LinkType },
    _2: { type: LinkType },
    _3: { type: LinkType }

  })
});

const LinkInputType = new GraphQLInputObjectType({
  name: "LinkInput",
  fields: () => ({

    title: { type: new GraphQLNonNull(GraphQLString) },
    url:   { type: new GraphQLNonNull(GraphQLString) }

  })
});

const LinksInputType = new GraphQLInputObjectType({
  name: "LinksInput",
  fields: () => ({

    _1: { type: LinkInputType },
    _2: { type: LinkInputType },
    _3: { type: LinkInputType }
    
  })
});


module.exports = {
  AddressInputType,
  AddressType,
  MarkdownType,
  TiersInputType,
  TiersType,
  LinksType,
  LinksInputType
};