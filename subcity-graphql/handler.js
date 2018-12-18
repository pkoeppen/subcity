const schema = require("./schema/");
const { graphql, parse } = require("graphql");
const { getPrincipalID, depthLimit } = require("./shared");


////////////////////////////////////////////////////


const handlerPublic = (event, context, callback) => {

  try {
    const { query, vars } = JSON.parse(event.body);
    graphql(schema.public, query, null, event.requestContext.identity, vars)
    .then(result => {

      if (result.errors) {
        throw result.errors[0];
      }

      console.log(`[public][200] ${Object.keys(result.data)[0]}`);
      return callback(null, {
        headers: {
          "Access-Control-Allow-Origin": "*" // change
        },
        statusCode: 200,
        body: JSON.stringify(result)
      });

    })
    .catch(error => {
      console.error(`[public][400] Error: ${error.stack}`);
      return callback(null, {
        headers: {
          "Access-Control-Allow-Origin": "*" // change
        },
        statusCode: 400,
        body: error.message
      });
    });
  }

  catch(error) {
    console.error(`[public][500] Error: ${error.stack}`);
    callback(null, {
      headers: {
        "Access-Control-Allow-Origin": "*" // change
      },
      statusCode: 500,
      body: "Something went wrong."
    });
  }
};


////////////////////////////////////////////////////


const handlerPrivate = (event, context, callback) => {

  try {
    const { query, vars, ctx } = sanitizeQuery(event);
    graphql(schema.private, query, null, ctx, vars)
    .then(result => {

      if (result.errors) {
        throw result.errors[0];
      }

      console.log(`[private][200] ${Object.keys(result.data)[0]}`);
      return callback(null, {
        headers: {
          "Access-Control-Allow-Origin": "*" // change
        },
        statusCode: 200,
        body: JSON.stringify(result)
      });

    })
    .catch(error => {
      console.error(`[private][400] Error: ${error.stack}`);
      callback(null, {
        headers: {
          "Access-Control-Allow-Origin": "*" // change
        },
        statusCode: 400,
        body: error.message
      });
    });
  }

  catch(error) {
    console.error(`[private][500] Error: ${error.stack}`);
    callback(null, {
      headers: {
        "Access-Control-Allow-Origin": "*" // change
      },
      statusCode: 500,
      body: "Something went wrong."
    });
  }
};


////////////////////////////////////////////////////


module.exports = {
  public:  handlerPublic,
  private: handlerPrivate
};


////////////////////////////////////////////////////


function getRole(event) {
  return event.requestContext.authorizer.role;
}


function sanitizeQuery(event) {

  // First, we extract the user's hashed ID
  // and role from the authorization event.

  const ctx  = { private: true };
  const id   = getPrincipalID(event);
  const role = getRole(event);
  const { query, vars } = JSON.parse(event.body);

  // Purge all keys that may have been adulterated.

  delete vars.channel_id;
  delete vars.subscriber_id;
  delete (vars.data || {}).channel_id;
  delete (vars.data || {}).subscriber_id;

  // Next, we inject said ID into the variables dictionary, so that
  // there can be no opportunity for self-injection or other tomfoolery.

  ctx[`${role}_id`]  = id;
  vars[`${role}_id`] = id;                 // for queries
  (vars["data"] || {})[`${role}_id`] = id; // for mutations

  // Let's run a function that will shit its pants if
  // the query goes over a pre-determined depth limit.

  depthLimit(5)(parse(query));

  // Finally, return the clean query.

  return { query, vars, ctx };
}