const {
  DynamoDB,
  loadEnv,
  S3
} = require("../../shared");

// Load environment variables.

loadEnv("dev").__load__();

const request = require("request");
const stripe = require("stripe")(process.env.STRIPE_KEY_PRIVATE);


////////////////////////////////////////////////////////////
////////////////////////// CLEAR ///////////////////////////
////////////////////////////////////////////////////////////


function clear() {
  return Promise.all([
    clearAuth0(),
    clearDynamoDB(),
    clearS3(),
    clearStripe()
  ])
  .then(() => console.log(`\nClear successful.\n`))
  .catch(error => console.log(`\nClear failed.\n${error.stack || error}`))
};


function clearAuth0() {

  // Clears all Auth0 users.

  return getAuth0ManagementToken()
  .then(getAuth0Users)
  .then(deleteAuth0Users);
}


function clearDynamoDB() {

  // Clears all DynamoDB tables.

  return Promise.all([
    deleteChannelsTable(),
    deleteMembershipsTable(),
    deletePaymentsTable(),
    deleteProposalsTable(),
    deleteReleasesTable(),
    deleteSlugsTable(),
    deleteSubscribersTable(),
    deleteSubscriptionsTable(),
    deleteSyndicatesTable()
  ]);
}


async function clearS3() {

  // Clears all keys from both S3 buckets.

  const _0 = S3.listObjects({ Bucket: process.env.S3_BUCKET_IN }).promise()
  .then(({ Contents: objects }) => {

    return Promise.all(objects.map(({ Key }) => {

      console.log(`${"[S3:IN] ".padEnd(30, ".")} Deleting ${Key}`);
      return S3.deleteObject({
        Bucket: process.env.S3_BUCKET_IN,
        Key
      }).promise();

    }));
  });

  const _1 = S3.listObjects({ Bucket: process.env.S3_BUCKET_OUT }).promise()
  .then(({ Contents: objects }) => {

    return Promise.all(objects.map(({ Key }) => {

      console.log(`${"[S3:OUT] ".padEnd(30, ".")} Deleting ${Key}`);
      return S3.deleteObject({
        Bucket: process.env.S3_BUCKET_OUT,
        Key
      }).promise();

    }));
  });

  return Promise.all([_0,_1]);
}


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


function getAuth0ManagementToken() {
  const params = {
    method: "POST",
    url: `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      client_id: process.env.AUTH0_M2M_CLIENT_ID,
      client_secret: process.env.AUTH0_M2M_CLIENT_SECRET,
      audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`,
      grant_type: "client_credentials"
    })
  };
  return new Promise((resolve, reject) => {
    request(params, (error, response, body) => {
     if (error) { return reject(error); }
     else if (response.statusCode !== 200) { return reject(`[Auth0] ${response.statusCode}: ${response.statusMessage}`)}
     else { resolve( JSON.parse(body).access_token ); }
   });
  });
}


function getAuth0Users(access_token) {
  const params = {
    method: "GET",
    url: `https://${process.env.AUTH0_DOMAIN}/api/v2/users`,
    headers: {
      "Authorization": `Bearer ${access_token}`,
      "Content-Type": "application/json; charset=utf-8"
    }
  };
  return new Promise((resolve, reject) => {
    request(params, (error, response, body) => {
     if (error) { return reject(error); }
     else if (response.statusCode !== 200) { return reject(`[${response.statusCode}] ${response.statusMessage}`)}
     else { resolve({ users: JSON.parse(body), access_token }); }
   });
  });
}


function deleteAuth0Users({ users, access_token }) {
  const toDelete = users.map(({ user_id }) => {
    const params = {
      method: "DELETE",
      url: `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${user_id}`,
      headers: {
        "Authorization": `Bearer ${access_token}`,
        "Content-Type": "application/json; charset=utf-8"
      }
    };
    return new Promise((resolve, reject) => {
      console.log(`${"[Auth0] ".padEnd(30, ".")} Deleting ${user_id}`);
      request(params, (error, response, body) => resolve("success"));
    });
  });
  return Promise.all(toDelete);
}


function deleteChannelsTable() {
  const params = {
    TableName: process.env.DYNAMODB_TABLE_CHANNELS
  };
  return DynamoDB.scan(params).promise()
  .then(({ Items }) => {
    Items.map(({ channel_id }) => {
      console.log(`${"[DynamoDB:CHANNELS] ".padEnd(30, ".")} Deleting ${channel_id}`);
      return DynamoDB.delete(Object.assign(params, { Key: { channel_id }})).promise();
    });
  });
}


function deleteMembershipsTable() {
  const params = {
    TableName: process.env.DYNAMODB_TABLE_MEMBERSHIPS
  };
  return DynamoDB.scan(params).promise()
  .then(({ Items }) => {
    Items.map(({ channel_id, syndicate_id }) => {
      console.log(`${"[DynamoDB:MEMBERSHIPS]".padEnd(30, ".")} Deleting ${channel_id}:${syndicate_id}`);
      return DynamoDB.delete(Object.assign(params, { Key: { channel_id, syndicate_id }})).promise();
    });
  });
}


function deletePaymentsTable() {
  const params = {
    TableName: process.env.DYNAMODB_TABLE_PAYMENTS
  };
  return DynamoDB.scan(params).promise()
  .then(({ Items }) => {
    Items.map(({ channel_id, time_created }) => {
      console.log(`${"[DynamoDB:PAYMENTS]".padEnd(30, ".")} Deleting ${channel_id}:${time_created}`);
      return DynamoDB.delete(Object.assign(params, { Key: { channel_id, time_created }})).promise();
    });
  });
}


function deleteProposalsTable() {
  const params = {
    TableName: process.env.DYNAMODB_TABLE_PROPOSALS
  };
  return DynamoDB.scan(params).promise()
  .then(({ Items }) => {
    Items.map(({ syndicate_id, time_created }) => {
      console.log(`${"[DynamoDB:PROPOSALS] ".padEnd(30, ".")} Deleting ${syndicate_id}:${time_created}`);
      return DynamoDB.delete(Object.assign(params, { Key: { syndicate_id, time_created }})).promise();
    });
  });
}


function deleteReleasesTable() {
  const params = {
    TableName: process.env.DYNAMODB_TABLE_RELEASES
  };
  return DynamoDB.scan(params).promise()
  .then(({ Items }) => {
    Items.map(({ channel_id, time_created }) => {
      console.log(`${"[DynamoDB:RELEASES] ".padEnd(30, ".")} Deleting ${channel_id}:${time_created}`);
      return DynamoDB.delete(Object.assign(params, { Key: { channel_id, time_created }})).promise();
    });
  });
}


function deleteSlugsTable() {
  const params = {
    TableName: process.env.DYNAMODB_TABLE_SLUGS
  };
  return DynamoDB.scan(params).promise()
  .then(({ Items }) => {
    Items.map(({ slug }) => {
      console.log(`${"[DynamoDB:SLUGS]".padEnd(30, ".")} Deleting ${slug}`);
      return DynamoDB.delete(Object.assign(params, { Key: { slug }})).promise();
    });
  });
}


function deleteSubscribersTable() {
  const params = {
    TableName: process.env.DYNAMODB_TABLE_SUBSCRIBERS
  };
  return DynamoDB.scan(params).promise()
  .then(({ Items }) => {
    Items.map(({ subscriber_id }) => {
      console.log(`${"[DynamoDB:SUBSCRIBERS]".padEnd(30, ".")} Deleting ${subscriber_id}`);
      return DynamoDB.delete(Object.assign(params, { Key: { subscriber_id }})).promise();
    });
  });
}


function deleteSubscriptionsTable() {
  const params = {
    TableName: process.env.DYNAMODB_TABLE_SUBSCRIPTIONS
  };
  return DynamoDB.scan(params).promise()
  .then(({ Items }) => {
    Items.map(({ subscriber_id, time_created }) => {
      console.log(`${"[DynamoDB:SUBSCRIPTIONS]".padEnd(30, ".")} Deleting ${subscriber_id}:${time_created}`);
      return DynamoDB.delete(Object.assign(params, { Key: { subscriber_id, time_created }})).promise();
    });
  });
}


function deleteSyndicatesTable() {
  const params = {
    TableName: process.env.DYNAMODB_TABLE_SYNDICATES
  };
  return DynamoDB.scan(params).promise()
  .then(({ Items }) => {
    Items.map(({ syndicate_id }) => {
      console.log(`${"[DynamoDB:SYNDICATES] ".padEnd(30, ".")} Deleting ${syndicate_id}`);
      return DynamoDB.delete(Object.assign(params, { Key: { syndicate_id }})).promise();
    });
  });
}


module.exports = clear;
