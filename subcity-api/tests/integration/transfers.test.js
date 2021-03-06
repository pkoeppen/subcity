////////////////////////////////////////////////////////////
/////////////////////////// UTIL ///////////////////////////
////////////////////////////////////////////////////////////


const clear = require("../clear");
const {
  DynamoDB,
  getPlansByProductID,
  getSubscriptionsByProductID,
  S3
} = require("../../shared");
const stripe = require("stripe")(process.env.STRIPE_KEY_PRIVATE);


////////////////////////////////////////////////////////////
/////////////////////////// CHAI ///////////////////////////
////////////////////////////////////////////////////////////


const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const { expect } = chai;


////////////////////////////////////////////////////////////
/////////////////////////// GQL ////////////////////////////
////////////////////////////////////////////////////////////


const {
  graphql
} = require("graphql");

const schema = require("../../schema");


////////////////////////////////////////////////////////////
////////////////////////// TESTS ///////////////////////////
////////////////////////////////////////////////////////////


describe("Transfers to channels and syndicates", function() {


  before(async function() {

    await clear.all();

  });
});
