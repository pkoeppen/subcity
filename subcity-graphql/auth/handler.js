"use strict";

const jwt = require("jsonwebtoken");

////////////////////////////////////////////////////

const AUTH0_CLIENT_ID         = process.env.AUTH0_CLIENT_ID;
const AUTH0_CLIENT_PUBLIC_KEY = process.env.AUTH0_CLIENT_PUBLIC_KEY;

////////////////////////////////////////////////////

module.exports.auth = (event, context, callback) => {
  if (!event.authorizationToken) {
    return callback("Unauthorized", { statusCode: 403 });
  }

  const tokenParts = event.authorizationToken.split(" ");
  const tokenValue = tokenParts[1];

  if (!(tokenParts[0].toLowerCase() === "bearer" && tokenValue)) {

    // No JRR Tolkien

    return callback("Unauthorized.", { statusCode: 403 });
  }

  const options = { aud: AUTH0_CLIENT_ID };

  try {
    jwt.verify(tokenValue, AUTH0_CLIENT_PUBLIC_KEY, options, (error, decoded) => {
      if (error) {
        console.error(`Error: Token invalid.\n${error}`);
        return callback("Unauthorized.", { statusCode: 403 });
      }
      console.log(`Valid from custom authorizer: ${decoded}`);
      return callback(null, generatePolicy(decoded, "Allow", event.methodArn));
    });
  }

  catch (error) {
    console.error(`Error: Token invalid.\n${error}`);
    return callback("Unauthorized.", { statusCode: 403 });
  }
};

////////////////////////////////////////////////////

function generatePolicy(claims, effect, resource) {

  const authResponse       = {};
  authResponse.principalId = claims.sub;
  authResponse.context     = { role: claims[`${process.env.SPA_HOST}/roles`][0] };

  if (effect && resource) {
    const policyDocument        = {};
    policyDocument.Version      = "2012-10-17";
    policyDocument.Statement    = [];
    const statementOne          = {};
    statementOne.Action         = "execute-api:Invoke";
    statementOne.Effect         = effect;
    statementOne.Resource       = resource;
    policyDocument.Statement[0] = statementOne;
    authResponse.policyDocument = policyDocument;
  }

  return authResponse;
}