import without from "lodash/without";
import { generateID } from "../shared";
import Stripe from "stripe";
import AWS from "aws-sdk";

const stripe = Stripe(process.env.STRIPE_KEY_PRIVATE);
AWS.config.update({ region: "us-east-1" });
const DynamoDB = new AWS.DynamoDB.DocumentClient();


export { handlerInbound as inbound };


const dispatch = {

  "invoice.payment_succeeded": function (body, callback) {

    // Handles transfers to Stripe Connect accounts, either as a single
    // channel or multiple channels as members of a syndicate.

    const product_id    = body.data.object.lines.data[0].plan.product;
    const subscriber_id = body.data.object.customer.replace(/^cus_/, "");
    const charge_id     = body.data.object.charge;
    const amount_paid   = body.data.object.amount_paid;

    if (amount_paid === 0) {

      // Ignore $0.00 invoices for subscriptions with a 100%-off coupon.

      return callback(null, { statusCode: 200 });
    }

    const data = {
      amount_paid,
      charge_id,
      product_id,
      subscriber_id
    };

    if (/^prod_channel_/.test(product_id)) {

      // Transfer to a single channel.

      return distributeEarningsToChannel(data)
      .then(() => callback(null, { statusCode: 200 }))
      .catch(error => {
        console.error(error);
        return callback(null, { statusCode: 500 })
      });
    }

    if (/^prod_syndicate_/.test(product_id)) {

      // Transfer to all member channels.

      return distributeEarningsToSyndicate(data)
      .then(() => callback(null, { statusCode: 200 }))
      .catch(error => {
        console.error(error);
        return callback(null, { statusCode: 500 })
      });
    }
  },


  "invoice.payment_failed": function() {

    // Removes relevant subscription from subscriber and notifies them of the failed charge.

    // TODO

  }
};


function handlerInbound (event, context, callback) {

  // Dispatches Stripe events to their appropriate handlers.

  const body = JSON.parse(event.body);
  const type = body.type;
  return (dispatch[type] || noop)(body, callback);
}


function distributeEarningsToChannel(data) {

  // Sends channel's cut of the payment to their Stripe Connect account,
  // and updates their running earnings_total in DynamoDB.

  const {
    amount_paid,
    charge_id,
    product_id,
    subscriber_id
  } = data;

  const channel_id    = product_id.replace(/^prod_channel_/g, "");
  const account_id    = product_id.replace(/^prod_channel_/g, "acct_");
  const fee_platform  = Math.ceil(amount_paid * 0.05);
  const fee_processor = Math.round(amount_paid * 0.029) + 30;
  const amount        = amount_paid - fee_platform - fee_processor;

  // Create Stripe transfer, to be executed when the funds
  // become available in the platform account.

  console.log(`[Stripe] Transferring (${amount}) to ${account_id}`);
  return stripe.transfers.create({
    amount,
    currency: "usd",
    source_transaction: charge_id,
    destination: account_id,
  }).then(() => {

    // Update DynamoDB.

    const transfer = {
      amount,
      channel_id,
      fee_platform,
      fee_processor,
      subscriber_id,
      time_created: Date.now()
    };

    return DynamoDB.put({
      TableName: process.env.DYNAMODB_TABLE_TRANSFERS,
      Item: transfer
    }).promise();
  });
}


async function distributeEarningsToSyndicate (data) {

  // Fetches all members of the syndicate in question and
  // transfers each cut to their Stripe Connect account.

  const {
    amount_paid,
    charge_id,
    product_id,
    subscriber_id
  } = data;

  const syndicate_id = product_id.replace(/^prod_syndicate_/g, "");

  const params = {
    TableName: process.env.DYNAMODB_TABLE_MEMBERSHIPS,
    IndexName: `${process.env.DYNAMODB_TABLE_MEMBERSHIPS}-GSI`,
    KeyConditionExpression: "syndicate_id = :syndicate_id",
    ExpressionAttributeValues: {
      ":syndicate_id": syndicate_id
    }
  };

  const {
    Items: memberships
  } = await DynamoDB.query(params).promise();

  const fee_platform  = Math.ceil(amount_paid * 0.05);
  const fee_processor = Math.round(amount_paid * 0.029) + 30;
  const amount        = Math.floor((amount_paid - fee_platform - fee_processor) / memberships.length);

  return Promise.all(memberships.map(({ channel_id }) => {

    // Create Stripe transfer, to be executed when the funds
    // become available in the platform account.

    const account_id = `acct_${channel_id}`;

    console.log(`[Stripe] Transferring (${amount}) to ${account_id} (syndicate: ${syndicate_id})`);
    return stripe.transfers.create({
      amount,
      currency: "usd",
      source_transaction: charge_id,
      destination: account_id,
    }).then(() => {

      // Update DynamoDB.

      const transfer = {
        amount,
        channel_id,
        fee_platform,
        fee_processor,
        subscriber_id,
        syndicate_id,
        time_created: Date.now()
      };

      return DynamoDB.put({
        TableName: process.env.DYNAMODB_TABLE_TRANSFERS,
        Item: transfer
      }).promise();
    });
  }));
}


function noop (body, callback) {

  return callback(null, { statusCode: 200, body: `Ignoring "${body.type}" event from Stripe` });
};
