const request = require("request");


module.exports = {
  createAuth0User,
  deleteAuth0User,
  getAuth0ManagementToken,
  getAuth0User
};


async function createAuth0User ({ user_id, role, email, password }) {

  const { access_token } = await getAuth0ManagementToken();

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

    console.log(`[Auth0] Creating user ${user_id}`);
    request(options, (error, response, body) => {

      if (error) {
        reject(error);
      }
      else if (response.statusCode !== 201) {
        reject(`[Auth0][${response.statusCode}] ${response.statusMessage}`)
      }
      else {
        resolve(JSON.parse(body));
      }
    }); 
  });
}


async function deleteAuth0User (user_id) {

  const { access_token } = await getAuth0ManagementToken();

  const options = {
    method: "DELETE",
    url: `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${user_id}`,
    headers: {
      "Authorization": `Bearer ${access_token}`,
      "Content-Type": "application/json; charset=utf-8"
    }
  };

  return new Promise((resolve, reject) => {
    console.log(`[Auth0] Deleting user ${user_id}`);
    request(options, (error, response, body) => {

      if (error) {
        reject(error);
      }
      else if (response.statusCode !== 204) {
        reject(`[Auth0][${response.statusCode}] ${response.statusMessage}`);
      }
      else {
        resolve();
      }

   });
  });
}


function getAuth0ManagementToken () {

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
    console.log(`[Auth0] Fetching management token`);
    request(options, (error, response, body) => {

      if (error) {
        reject(error);
      }
      else if (response.statusCode !== 200) {
        reject(`[Auth0][${response.statusCode}] ${response.statusMessage}`);
      }
      else {
        resolve(JSON.parse(body));
      }

   });
  });
}


async function getAuth0User (user_id) {

  const { access_token } = await getAuth0ManagementToken();

  const params = {
    method: "GET",
    url: `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${user_id}`,
    headers: {
      "Authorization": `Bearer ${access_token}`,
      "Content-Type": "application/json; charset=utf-8"
    }
  };

  return new Promise((resolve, reject) => {
    console.log(`[Auth0] Fetching user ${user_id}`);
    request(params, (error, response, body) => {

      if (error) {
        reject(error);
      }
      else if (response.statusCode !== 200) {
        reject(`[Auth0][${response.statusCode}] ${response.statusMessage}`);
      }
      else {
        resolve(JSON.parse(body));
      }

    });
  });
}