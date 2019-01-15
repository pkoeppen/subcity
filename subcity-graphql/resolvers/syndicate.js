const {
  buildQuery,
  createStripePlan,
  DynamoDB,
  generateID,
  purgeByProductID,
  sanitize
} = require("../shared");

const {
  dissolveSyndicate
} = require("./proposal");

const {
  getMembershipsBySyndicateID
} = require("./queries");


module.exports = {
  createSyndicate,
  createSyndicateMembership,
  leaveSyndicate
};


////////////////////////////////////////////////////////////
//////////////////////// FUNCTIONS /////////////////////////
////////////////////////////////////////////////////////////


async function createSyndicate (channel_id, data) {

  console.log(data)

  data = sanitize(data);
  const slug = data.slug;
  const syndicate_id = generateID();

  const plan = {
    billing_scheme: "tiered",
    interval: "month",
    product: {
      id:   `prod_syndicate_${syndicate_id}`,
      name: `prod_syndicate_${syndicate_id}`
    },
    currency: "usd",
    tiers: [
      {
        flat_amount: data.tiers._1.rate || 499,
        up_to: 1
      },
      {
        flat_amount: (data.tiers._2 || {}).rate || 499,
        up_to: 2
      },
      {
        flat_amount: (data.tiers._3 || {}).rate || 499,
        up_to: "inf"
      },
    ],
    tiers_mode: "volume"
  };

  return Promise.all([
    createStripePlan(plan),
    createSyndicateMembership(syndicate_id, channel_id),
    handleSyndicateSlugAssignment(syndicate_id, slug)
  ])
  .then(([{ id: plan_id }]) => {

    data.tiers._2 = data.tiers._2 || {
      active: false,
      title: null,
      description: { raw: null, rendered: null },
      rate: 499
    };
    
    data.tiers._3 = data.tiers._3 || {
      active: false,
      title: null,
      description: { raw: null, rendered: null },
      rate: 499
    };

    const syndicate = Object.assign({
      syndicate_id,
      plan_id,
      time_created: Date.now(),
      time_updated: 0
    }, data);

    // Create the syndicate in DynamoDB.

    console.log(`[DynamoDB:SYNDICATES] Creating new syndicate ${syndicate_id}`);
    return DynamoDB.put({
      TableName: process.env.DYNAMODB_TABLE_SYNDICATES,
      Item: syndicate
    }).promise()
    .then(() => syndicate);
  })
  .catch(error => {

    // Rollback. Timeout to allow all the things to
    // be created, to assure they can then be deleted.

    setTimeout(() => {
      Promise.all([
        purgeByProductID(`prod_syndicate_${syndicate_id}`),
        deleteMembership(syndicate_id, channel_id),
        deleteSlug(slug)
      ]);
    }, 1000);    

    throw error;
  });
};


function createSyndicateMembership (syndicate_id, channel_id) {

  const membership = {
    syndicate_id,
    channel_id,
    time_created: Date.now()
  };

  console.log(`[DynamoDB:MEMBERSHIPS] Creating membership ${syndicate_id}:${channel_id}`);
  return DynamoDB.put({
    TableName: process.env.DYNAMODB_TABLE_MEMBERSHIPS,
    Item: membership
  }).promise();
}


function leaveSyndicate (channel_id, syndicate_id) {

  const params = {
    TableName: process.env.DYNAMODB_TABLE_MEMBERSHIPS,
    Key: {
      channel_id,
      syndicate_id
    }
  };

  return DynamoDB.delete(params).promise()
  .then(() => true)
  .finally(async () => {

    // If channel was sole member, dissolve syndicate.

    const memberships = await getMembershipsBySyndicateID(syndicate_id);

    if (!memberships.length) {
      return dissolveSyndicate(syndicate_id);
    }
  });
}


////////////////////////////////////////////////////////////
///////////////////////// HELPERS //////////////////////////
////////////////////////////////////////////////////////////


function assertSlugAvailable (slug) {

  const params = {
    TableName: process.env.DYNAMODB_TABLE_SLUGS,
    Key: { slug }
  };

  return DynamoDB.get(params).promise()
  .then(({ Item: slug }) => !slug);
}


function createSlugBySyndicateID (syndicate_id, slug) {

  const params = {
    TableName: process.env.DYNAMODB_TABLE_SLUGS,
    Item: {
      syndicate_id,
      slug
    }
  };

  console.log(`[DynamoDB:SLUGS] Creating slug ${slug}`);
  return DynamoDB.put(params).promise();
}


function deleteMembership (syndicate_id, channel_id) {
  const params = {
    TableName: process.env.DYNAMODB_TABLE_MEMBERSHIPS,
    Key: {
      syndicate_id,
      channel_id
    }
  };

  console.log(`[DynamoDB:MEMBERSHIPS] Deleting membership ${syndicate_id}:${channel_id}`);
  return DynamoDB.delete(params).promise();
}


function deleteSlug (slug) {

  const params = {
    TableName: process.env.DYNAMODB_TABLE_SLUGS,
    Key: { slug }
  };

  console.log(`[DynamoDB:SLUGS] Deleting slug ${slug}`);
  return DynamoDB.delete(params).promise();
}


function getSlugBySyndicateID (syndicate_id) {

  const params = {
    TableName: process.env.DYNAMODB_TABLE_SLUGS,
    IndexName: `${process.env.DYNAMODB_TABLE_SLUGS}-GSI-2`,
    KeyConditionExpression: "syndicate_id = :syndicate_id",
    ExpressionAttributeValues: {
        ":syndicate_id": syndicate_id
    }
  };

  return DynamoDB.query(params)
  .promise().then(({ Items: slugs }) => {

    if (slugs.length) {
      return slugs[0];
    }
  });
};


async function handleSyndicateSlugAssignment (syndicate_id, slug) {

  if (await assertSlugAvailable(slug)) {

    const old_slug = await getSlugBySyndicateID(syndicate_id);
    const tasks = [
      createSlugBySyndicateID(syndicate_id, slug),
      writeSyndicateUpdates(syndicate_id, { slug })
    ];

    if (old_slug) {
      tasks.push(deleteSlug(old_slug.slug));
    }

    return Promise.all(tasks);

  } else {
    throw new Error("![400] Slug unavailable.");
  }
}


function writeSyndicateUpdates (syndicate_id, updates) {

  // Writes syndicate updates to DynamoDB.

  const { ExpressionAttributeValues, UpdateExpression } = buildQuery(updates);

  console.log(`[DynamoDB:SYNDICATES] Updating syndicate ${syndicate_id}`);
  return DynamoDB.update({
    TableName: process.env.DYNAMODB_TABLE_SYNDICATES,
    Key: { syndicate_id },
    UpdateExpression,
    ExpressionAttributeValues
  }).promise();
}
