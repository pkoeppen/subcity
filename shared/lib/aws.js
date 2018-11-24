const AWS = require("aws-sdk");
AWS.config.update({ region: "us-east-1" });

////////////////////////////////////////////////////

const DynamoDB = new AWS.DynamoDB.DocumentClient();
const S3 = new AWS.S3({
  s3ForcePathStyle: true,
  endpoint: process.env.DATA_HOST
});

////////////////////////////////////////////////////

module.exports = {
  DynamoDB,
  S3
};