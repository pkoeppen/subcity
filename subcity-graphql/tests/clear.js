require("dotenv").config({ path: `${__dirname}/.env` });
const request = require("request");
const stripe = require("stripe")(process.env.STRIPE_KEY_PRIVATE);
const { DynamoDB } = require("../shared");

////////////////////////////////////////////////////
////////////////////// CLEAR ///////////////////////
////////////////////////////////////////////////////

function clear() {
  return Promise.all([
    clearStripe(),
    clearAuth0(),
    clearDynamoDB()
  ])
  .then(() => console.log(`\nClear successful.`))
  .catch(error => console.log(`\nClear failed. Error: ${error.message}`))
};

async function clearStripe() {

  // Delete everything but the plans...

  await Promise.all([
    stripe.customers.list({ limit: 100 })
    .then(({ data }) => {
      const toDelete = data.map(({ id }) => {
        console.log(`${"[Stripe] ".padEnd(30, ".")} Deleting ${id}`);
        return stripe.customers.del(id);
      });
      return toDelete;
    }),
    stripe.accounts.list({ limit: 100 })
    .then(({ data }) => {
      const toDelete = data.map(({ id }) => {
        console.log(`${"[Stripe] ".padEnd(30, ".")} Deleting ${id}`);
        return stripe.account.del(id);
      });
      return toDelete;
    }),
    stripe.plans.list({ limit: 100 })
    .then(({ data }) => {
      const toDelete = data.map(({ id }) => {
        console.log(`${"[Stripe] ".padEnd(30, ".")} Deleting ${id}`)
        return stripe.plans.del(id);
      });
      return toDelete;
    })
  ]);

  // ...then delete the plans, since the other stuff has to be deleted first.

  await stripe.products.list({ limit: 100 })
  .then(({ data }) => {
    const toDelete = data.map(({ id }) => {
      console.log(`${"[Stripe] ".padEnd(30, ".")} Deleting ${id}`)
      return stripe.products.del(id)
      .catch(error => console.error(`Error: Could not delete ${id}.`));
    });
    return toDelete;
  });

  return Promise.resolve();
}


function clearAuth0() {
  return getAuth0ManagementToken()
  .then(getAuth0Users)
  .then(deleteAuth0Users);
}


function clearDynamoDB() {
  return Promise.all([
    deleteSubscribersTable(),
    deleteChannelsTable(),
    deleteReleasesTable(),
    deleteSyndicatesTable(),
    deleteProposalsTable()
  ]);
}


function deleteSubscribersTable() {
  const options = {
    TableName: process.env.DYNAMODB_TABLE_SUBSCRIBERS
  };
  return DynamoDB.scan(options).promise()
  .then(({ Items }) => {
    Items.map(({ subscriber_id }) => {
      console.log(`${"[DynamoDB:SUBSCRIBERS]".padEnd(30, ".")} Deleting ${subscriber_id}`);
      return DynamoDB.delete(Object.assign(options, { Key: { subscriber_id }})).promise();
    });
  });
}


function deleteChannelsTable() {
  const options = {
    TableName: process.env.DYNAMODB_TABLE_CHANNELS
  };
  return DynamoDB.scan(options).promise()
  .then(({ Items }) => {
    Items.map(({ channel_id }) => {
      console.log(`${"[DynamoDB:CHANNELS] ".padEnd(30, ".")} Deleting ${channel_id}`);
      return DynamoDB.delete(Object.assign(options, { Key: { channel_id }})).promise();
    });
  });
}


function deleteReleasesTable() {
  const options = {
    TableName: process.env.DYNAMODB_TABLE_RELEASES
  };
  return DynamoDB.scan(options).promise()
  .then(({ Items }) => {
    Items.map(({ channel_id, release_id }) => {
      console.log(`${"[DynamoDB:RELEASES] ".padEnd(30, ".")} Deleting ${release_id}`);
      return DynamoDB.delete(Object.assign(options, { Key: { channel_id, release_id }})).promise();
    });
  });
}


function deleteSyndicatesTable() {
  const options = {
    TableName: process.env.DYNAMODB_TABLE_SYNDICATES
  };
  return DynamoDB.scan(options).promise()
  .then(({ Items }) => {
    Items.map(({ syndicate_id }) => {
      console.log(`${"[DynamoDB:SYNDICATES] ".padEnd(30, ".")} Deleting ${syndicate_id}`);
      return DynamoDB.delete(Object.assign(options, { Key: { syndicate_id }})).promise();
    });
  });
}


function deleteProposalsTable() {
  const options = {
    TableName: process.env.DYNAMODB_TABLE_PROPOSALS
  };
  return DynamoDB.scan(options).promise()
  .then(({ Items }) => {
    Items.map(({ syndicate_id, proposal_id }) => {
      console.log(`${"[DynamoDB:PROPOSALS] ".padEnd(30, ".")} Deleting ${proposal_id}`);
      return DynamoDB.delete(Object.assign(options, { Key: { syndicate_id, proposal_id }})).promise();
    });
  });
}


function getAuth0ManagementToken() {
  const options = {
    method: "POST",
    url: "https://subcity.auth0.com/oauth/token",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      client_id: process.env.AUTH0_M2M_CLIENT_ID,
      client_secret: process.env.AUTH0_M2M_CLIENT_SECRET,
      audience: "https://subcity.auth0.com/api/v2/",
      grant_type: "client_credentials"
    })
  };
  return new Promise((resolve, reject) => {
    request(options, (error, response, body) => {
     if (error) { return reject(error); }
     else if (response.statusCode !== 200) { return reject(`[${response.statusCode}] ${response.statusMessage}`)}
     else { resolve( JSON.parse(body).access_token ); }
   });
  });
}


function getAuth0Users(access_token) {
  const options = {
    method: "GET",
    url: "https://subcity.auth0.com/api/v2/users",
    headers: {
      "Authorization": `Bearer ${access_token}`,
      "Content-Type": "application/json; charset=utf-8"
    }
  };
  return new Promise((resolve, reject) => {
    request(options, (error, response, body) => {
     if (error) { return reject(error); }
     else if (response.statusCode !== 200) { return reject(`[${response.statusCode}] ${response.statusMessage}`)}
     else { resolve({ users: JSON.parse(body), access_token }); }
   });
  });
}


function deleteAuth0Users({ users, access_token }) {
  const toDelete = users.map(({ user_id }) => {
    const options = {
      method: "DELETE",
      url: `https://subcity.auth0.com/api/v2/users/${user_id}`,
      headers: {
        "Authorization": `Bearer ${access_token}`,
        "Content-Type": "application/json; charset=utf-8"
      }
    };
    return new Promise((resolve, reject) => {
      console.log(`${"[Auth0] ".padEnd(30, ".")} Deleting ${user_id}`);
      request(options, (error, response, body) => resolve("success"));
    });
  });
  return Promise.all(toDelete);
}


module.exports = clear;