const request = require("request");


module.exports = {
  createAuth0User,
  getAuth0ManagementToken
};


function getAuth0ManagementToken() {

  // Fetches management token for the Auth0 API.

  const options = {
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

    console.log(`${"[Auth0] ".padEnd(30, ".")} Fetching management token`);
    request(options, (error, response, body) => {
     if (error) { reject(error); }
     else if (response.statusCode !== 200) { reject(`[${response.statusCode}] ${response.statusMessage}`)}
     else { resolve(JSON.parse(body)); }
   });

  });
}


function createAuth0User({ user_id, role, email, password, access_token }) {

  // Does what it says.

  const user = {
    user_id,
    email,
    password,
    email_verified: false,
    verify_email: false,
    connection: "Username-Password-Authentication",
    app_metadata: {
      roles: [role]
    }
  };

  const options = {
    method: "POST",
    url: `https://${process.env.AUTH0_DOMAIN}/api/v2/users`,
    headers: {
      "Authorization": `Bearer ${access_token}`,
      "Content-Type": "application/json; charset=utf-8"
    },
    body: JSON.stringify(user)
  };

  return new Promise((resolve, reject) => {

    console.log(`${"[Auth0] ".padEnd(30, ".")} Creating new user ${user_id}`);
    request(options, (error, response) => {
      const body = JSON.parse(response.body);
      if (error) { reject(error); }
      else if (body.statusCode) { reject(`[${body.statusCode}] ${body.message}`)}
      else { resolve(body); }
    });
    
  });
}
