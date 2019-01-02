const {
  DynamoDB
} = require("../../shared/lib/aws");

module.exports = {
  assertTokenExists,
  getChannelById
};


////////////////////////////////////////////////////////////
//////////////////////// FUNCTIONS /////////////////////////
////////////////////////////////////////////////////////////


function assertTokenExists (token_id) {

  // Assert signup token exists.
  
  return getSignupToken(token_id)
  .then(token => !!token);
}


function getChannelById (channel_id) {

  // Get channel by ID.

  if (!channel_id) { return null; }
  
  const params = {
    TableName: process.env.DYNAMODB_TABLE_CHANNELS,
    Key: { channel_id }
  };

  return DynamoDB.get(params).promise()
  .then(({ Item: channel }) => {

    if (!channel) {
      throw new Error("! Channel not found.");
    } else {
      return channel;
    }

  });
};


////////////////////////////////////////////////////////////
///////////////////////// HELPERS //////////////////////////
////////////////////////////////////////////////////////////


function getSignupToken (token_id) {

  // Get signup token.

  const params = {
    TableName: process.env.DYNAMODB_TABLE_TOKENS,
    Key: { token_id },
  };

  return DynamoDB.get(params)
  .promise().then(({ Item: token }) => token);
};
