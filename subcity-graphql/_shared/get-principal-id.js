const getPrincipalID = (event, id=null) => {
  const principalId = id || event.requestContext.authorizer.principalId;
  return principalId.replace(/^(auth0\|)?(acct|cus)_/g, "");
};

////////////////////////////////////////////////////

module.exports = getPrincipalID;