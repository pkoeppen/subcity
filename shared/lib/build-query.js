module.exports = buildQuery;


function buildQuery(params) {

  // Build a string query readable by DynamoDB.

  const expressionAttributeValues = {};

  for (let key in params) {
    if (key !== "channel_id" && key !== "release_id" && key !== "slug") {
      expressionAttributeValues[`:${key}`] = params[key];
    }
  }

  const updateExpression = Object.keys(params).map((key, index) => {
      return (key !== "channel_id" && key !== "release_id" && key !== "slug") ? `${key} = :${key}` : null;
  }).filter(n => n).join(", ");

  return { expressionAttributeValues, updateExpression };
}
