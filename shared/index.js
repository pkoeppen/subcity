const { DynamoDB, S3 } = require("./lib/aws");
const generateID = require("./lib/generate-id");
const loadEnv = require("./lib/load-env");

module.exports = {
  DynamoDB,
  S3,
  generateID,
  loadEnv
};