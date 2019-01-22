const { graphql, parse } = require("graphql");
const schema = require("./schema");
const { depthLimit } = require("./shared");
const { webhook } = require("./stripe");


module.exports = {
  private: handlerPrivate,
  public: handlerPublic,
  stripe: webhook,
};


const headers = {
  "Access-Control-Allow-Origin": process.env.NODE_ENV === 'dev' ? 'http://localhost:3000' : 'https://sub.city',
  //"Access-Control-Allow-Origin": '*',
};

const ERROR_REGEX = /(?:\[)([0-9]{3})(?:\]\s)(.*)/g;


function handlerPublic (event, context, callback) {

  const {
    query,
    vars,
  } = JSON.parse(event.body);

  const ctx = {
    ip_address: event.requestContext.identity.sourceIp,
  };

  // Disallow query depth over five levels.

  try {
    depthLimit(10)(parse(query));
  } catch (error) {
    console.log(`[depthLimit] IP: ${ctx.ip_address}`);
    return callback(null, {
      headers,
      statusCode: 400,
      body: "Query depth limit exceeded."
    });
  }

  graphql(schema, query, null, ctx, vars)
  .then(({ data, errors }) => {

    if (errors) {
      const error = errors[0];

      if (error.message.startsWith("!")) {

        const [
          match,
          statusCode,
          message
        ] = ERROR_REGEX.exec(error.message);

        return callback(null, {
          headers,
          statusCode,
          body: message
        });

      } else {
        console.log(`[handlerPublic] Error: ${error.message}`);
        return callback(null, {
          headers,
          statusCode: 500,
          body: "An unknown error occurred."
        });
      }

    } else {
      return callback(null, {
        headers,
        statusCode: 200,
        body: JSON.stringify(data)
      });
    }
  })
  .catch(error => {
    console.log(`[handlerPublic] Error: ${error.message}`);
    return callback(null, {
      headers,
      statusCode: 500,
      body: "An unknown error occurred."
    });
  });
}


function handlerPrivate (event, context, callback) {

  const {
    query,
    vars,
  } = JSON.parse(event.body);

  const {
    principalId: id,
    role,
  } = event.requestContext.authorizer;

  const ctx = {
    ip_address: event.requestContext.identity.sourceIp,
    [`${role}_id`]: id.replace(/^auth0\|(acct|cus)_/g, ""),
  };

  // Disallow query depth over five levels.

  try {
    depthLimit(10)(parse(query));
  } catch (error) {
    console.log(error.stack || error)
    console.log(`[depthLimit] IP: ${ctx.ip_address}, ID: ${id}`);
    return callback(null, {
      headers,
      statusCode: 400,
      body: "Query depth limit exceeded."
    });
  }

  graphql(schema, query, null, ctx, vars)
  .then(({ data, errors }) => {

    if (errors) {
      const error = errors[0];

      if (error.message.startsWith("!")) {

        const [
          match,
          statusCode,
          message
        ] = ERROR_REGEX.exec(error.message);

        return callback(null, {
          headers,
          statusCode,
          body: message
        });
        
      } else {
        console.log(`[handlerPrivate] Error: ${error.message}${error.stack}`);
        return callback(null, {
          headers,
          statusCode: 500,
          body: "An unknown error occurred."
        });
      }

    } else {
      return callback(null, {
        headers,
        statusCode: 200,
        body: JSON.stringify(data)
      });
    }
  })
  .catch(error => {
    console.log(`[handlerPrivate] Error: ${error.message}`);
    return callback(null, {
      headers,
      statusCode: 500,
      body: "An unknown error occurred."
    });
  });
}
