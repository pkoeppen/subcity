import { without } from "lodash";
import { generateID } from "../shared";
import stripe from "stripe";
import AWS from "aws-sdk";

stripe = stripe(process.env.STRIPE_KEY_PRIVATE);
AWS.config.update({ region: "us-east-1" });
const DynamoDB = new AWS.DynamoDB.DocumentClient();


////////////////////////////////////////////////////

// TODO
// x Stripe hook: On payment to plan, add to earnings_total
// 2. Stripe hook: On payment decline, unsubscribe from syndicate (and channel, that's a TODO)
//    -> Also maybe add "delinquent" field to subscriber, then eventually delete account
// 3. Track subscriber access/subscriptions and stuff
// 4. If payment fails, add flag to remove all subs in 15 days unless credit card is updated
/*

- Syndicate page

- Restrict content to active subscribers
  - Download payload files only with temporary Signed URL
  - On failed charge, cancel relevant subscription
  - On credit card update, update all subscriptions


- Payouts to channels (Transfer from master account, actually... Payouts then happen automatically)
  - On error (account frozen, account closed, etc), do something

*/


const SUBCITY_FEE_AMOUNT = 0.049; // Put this in some global config file eventually


const noop = (body, callback) => {
  return callback(null, { statusCode: 200, body: `Ignoring "${body.type}" event from Stripe` });
};


const dispatch = {

  "invoice.payment_succeeded": function (body, callback) {

    // Handles transfers to Stripe Connect accounts, either as a single
    // channel or multiple channels as members of a syndicate.

    const product_id    = body.data.object.lines.data[0].plan.product;
    const subscriber_id = body.data.object.customer.replace(/^cus_/, "");
    const charge_id     = body.data.object.charge;
    const amount_paid   = body.data.object.amount_paid;

    const data = {
      amount_paid,
      charge_id,
      product_id,
      subscriber_id
    };

    if (/^prod_channel_/.test(product_id)) {

      // Transfer to a single channel.

      distributeEarningsToChannel(data)
      .then(addPurchasesToSubscriber)
      .catch(error => {
        console.error(error);
      });
    }

    if (/^prod_syndicate_/.test(product_id)) {

      // Transfer to all channels in a syndicate.

      distributeEarningsToSyndicate(data)
      .then(addPurchasesToSubscriber)
      .catch(error => {
        console.error(error);
      });
    }

    callback(null, { statusCode: 200 });
  },


  "invoice.payment_failed": function() {

    // Removes relevant subscription from subscriber and notifies them of the failed charge.

    // TODO

  }
};


const handlerInbound = (event, context, callback) => {

  // Dispatches Stripe events to their appropriate handlers.

  body = JSON.parse(event.body);
  const type = body.type;
  return (dispatch[type] || noop)(body, callback);
};


////////////////////////////////////////////////////


module.exports = {
  inbound: handlerInbound
};


////////////////////////////////////////////////////


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
  const stripe_cut    = (amount_paid * 0.029) + 30;
  const payout_amount = Math.floor((amount_paid - stripe_cut) * (1 - SUBCITY_FEE_AMOUNT));

  // Create Stripe transfer, to be executed when the funds
  // become available in the platform account.

  console.log(`${"[Stripe] ".padEnd(30, ".")} Sending transfer (${payout_amount} cents) to Connect account ${account_id}`);
  const a = stripe.transfers.create({
    amount: payout_amount,
    currency: "usd", // TODO: Change to syndicate/channel currency
    source_transaction: charge_id,
    destination: account_id,
  });

  // Update DynamoDB.

  const b = DynamoDB.update({
    TableName: process.env.DYNAMODB_TABLE_CHANNELS,
    Key: {
      channel_id
    },
    UpdateExpression: `SET #earnings_total = if_not_exists(#earnings_total, :zero) + :amount_paid`,
    ExpressionAttributeNames: {
      "#earnings_total": "earnings_total"
    },
    ExpressionAttributeValues: {
      ":amount_paid": amount_paid,
      ":zero": 0
    }
  }).promise();

  return Promise.all([a,b])
  .then(() => ({ channel_id, subscriber_id }))
  .catch(error => {
    console.error(error);
  });
}


async function distributeEarningsToSyndicate(data) {

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
    TableName: process.env.DYNAMODB_TABLE_SYNDICATES,
    Key: { syndicate_id },
  };
  var {
    Item: {
      channels
    }
  } = await DynamoDB.get(params).promise();
  channels = without(channels.values, "__DEFAULT__");

  // Subtract sub.city fee, then divide by number of member channels.

  const stripe_cut    = (amount_paid * 0.029) + 30;
  const payout_amount = Math.floor(((amount_paid - stripe_cut) * (1 - SUBCITY_FEE_AMOUNT)) / channels.length);

  const toTransfer = channels.reduce((acc, channel_id) => {

    // Create Stripe transfer, to be executed when the funds
    // become available in the platform account.

    let account_id = `acct_${channel_id}`;
    console.log(`${"[Stripe] ".padEnd(30, ".")} Sending transfer (${payout_amount} cents) to Connect account ${account_id}`);
    let a = stripe.transfers.create({
      amount: payout_amount,
      currency: "usd", // Change to syndicate/channel currency
      source_transaction: charge_id,
      destination: account_id,
    });

    // Update DynamoDB.

    // TODO: Attach earnings to syndicate somehow
    
    let b = Promise.resolve();
    // let b = DynamoDB.update({
    //   TableName: process.env.DYNAMODB_TABLE_CHANNELS,
    //   Key: {
    //     channel_id
    //   },
    //   UpdateExpression: `SET earnings_total  = earnings_total + :amount_paid`,
    //   ExpressionAttributeValues: {
    //     ":amount_paid": amount_paid
    //   }
    // }).promise();

    return acc.concat([a,b]);
  }, []);

  return Promise.all(toTransfer)
  .then(() => ({ channels, subscriber_id, syndicate_id }))
}


function addPurchasesToSubscriber({ channels, channel_id, subscriber_id, syndicate_id }) {

  // Credit purchases (all channel releases within the next billing cycle) to the subscriber.

  const purchase_id = generateID();
  const start_time  = new Date();
  const end_time    = new Date();
  end_time.setMonth(end_time.getMonth() + 1);

  const purchase = {
    purchase_id,
    subscriber_id,
    channel_id,
    release_id: null,
    start_time: start_time.getTime(),
    end_time: end_time.getTime(),
    type: "subscription",
    source: `channel:${channel_id}`
  };

  if (channels && syndicate_id) {

    // Add purchases from all member channels (syndicate subscription).

    return Promise.all(channels.map(channel_id => {
      purchase.channel_id = channel_id;
      purchase.source     = `syndicate:${syndicate_id}`;
      
      console.log(`${"[DynamoDB:PURCHASES] ".padEnd(30, ".")} Creating purchase ${subscriber_id}:${purchase_id}`);
      return DynamoDB.put({
        TableName: process.env.DYNAMODB_TABLE_PURCHASES,
        Item: purchase
      }).promise();
    }));

  } else {

    // Add purchases from one channel (channel subscription).

    console.log(`${"[DynamoDB:PURCHASES] ".padEnd(30, ".")} Creating purchase ${subscriber_id}:${purchase_id}`);
    return DynamoDB.put({
      TableName: process.env.DYNAMODB_TABLE_PURCHASES,
      Item: purchase
    }).promise();
  }
}