const schema = require("./schema/");
const { graphql, parse } = require("graphql");
const { getPrincipalID, depthLimit } = require("./shared");


////////////////////////////////////////////////////


const handlerPublic = (event, context, callback) => {

  try {
    const { query, vars } = JSON.parse(event.body);
    graphql(schema.public, query, null, event.requestContext.identity, vars)
    .then(
      result => {
        console.log(`[public][200]`);
        return callback(null, {
          headers: {
            "Access-Control-Allow-Origin": "*" // change
          },
          statusCode: 200,
          body: JSON.stringify(result)
        });
      },
      error => {
        console.log(`[public][400] Error: ${Object.keys(result.data)[0]}`);
        return callback(null, {
          headers: {
            "Access-Control-Allow-Origin": "*" // change
          },
          statusCode: 400,
          body: error.message
        });
      }
    );
  }

  catch(error) {
    console.error(error);
    callback(null, {
      headers: {
        "Access-Control-Allow-Origin": "*" // change
      },
      statusCode: 400,
      body: error.message
    });
  }
};


////////////////////////////////////////////////////


const handlerPrivate = (event, context, callback) => {

  try {
    const { query, vars } = sanitizeQuery(event);
    graphql(schema.private, query, null, { private: true }, vars)
    .then(
      result => {
        console.log(`[private][200] ${Object.keys(result.data)[0]}`);
        return callback(null, {
          headers: {
            "Access-Control-Allow-Origin": "*" // change
          },
          statusCode: 200,
          body: JSON.stringify(result)
        });
      },
      error => {
        console.log(`[private][400] Error: ${Object.keys(result.data)[0]}`);
        return callback(null, {
          headers: {
            "Access-Control-Allow-Origin": "*" // change
          },
          statusCode: 400,
          body: error.message
        });
      }
    );
  }

  catch(error) {
    console.error(error);
    callback(null, {
      headers: {
        "Access-Control-Allow-Origin": "*" // change
      },
      statusCode: 400,
      body: error.message
    });
  }
};


////////////////////////////////////////////////////


module.exports = {
  public: handlerPublic,
  private: handlerPrivate
};


////////////////////////////////////////////////////


function getRole(event) {
  return event.requestContext.authorizer.role;
}


function sanitizeQuery(event) {

  // First, we extract the user's hashed ID
  // and role from the authorization event.

  const id = getPrincipalID(event);
  const role = getRole(event);
  const { query, vars } = JSON.parse(event.body);

  // Purge all keys that may have been adulterated.

  delete vars.channel_id;
  delete vars.subscriber_id;
  delete (vars.data || {}).channel_id;
  delete (vars.data || {}).subscriber_id;

  // Next, we inject said ID into the variables dictionary, so that
  // there can be no opportunity for self-injection or other tomfoolery.

  vars[`${role}_id`] = id;                 // for queries
  (vars["data"] || {})[`${role}_id`] = id; // for mutations

  // Let's run a function that will shit its pants if
  // the query goes over a pre-determined depth limit.

  depthLimit(5)(parse(query));

  // Finally, return the clean query.

  return { query, vars };
}