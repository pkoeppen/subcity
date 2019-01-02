module.exports = {
  buildQuery
};


function buildQuery(updates) {

  // Build the UpdateExpression.

  const UpdateExpression = "SET ".concat(
    Object.keys(updates).map((key, index) => {
      return `${key} = :${key}`;
  }).join(", "));

  // Build the ExpressionAttributeValues.

  const ExpressionAttributeValues = {};

  for (let key in updates) {
    ExpressionAttributeValues[`:${key}`] = updates[key];
  }

  return { UpdateExpression, ExpressionAttributeValues };
}
