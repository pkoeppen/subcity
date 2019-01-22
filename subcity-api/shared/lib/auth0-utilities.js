const request = require("request");


module.exports = {
  createAuth0User,
  deleteAuth0User,
  findAuth0UsersByEmail,
  getAuth0ClientToken,
  getAuth0ManagementToken,
  getAuth0User,
  updateAuth0Email,
  updateAuth0Password,
};


async function updateAuth0Email (user_id, email, password, new_email) {

  // Resolves a client token with which to update the Vuex store.

  try {
    await getAuth0ClientToken(email, password);
  } catch (error) {
    if (error.toString().startsWith("![403]")) {
      throw new Error("![403] Incorrect password.");
    } else {
      throw error;
    }
  }

  const { access_token } = await getAuth0ManagementToken();

  var params = {
    body: JSON.stringify({
      client_id: process.env.AUTH0_M2M_ID,
      connection: "Username-Password-Authentication",
      email: new_email,
      email_verified: false,
    }),
    headers: {
      "Authorization": `Bearer ${access_token}`,
      "Content-Type": "application/json"
    },
    method: "PATCH",
    url: `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${user_id}`
  };

  return new Promise((resolve, reject) => {
    console.log(`[Auth0] Updating email for user ${user_id}`);
    request(params, (error, response, body) => {

      if (error) {
        reject(error);
      }
      else if (response.statusCode !== 200) {
        reject(`[Auth0][${response.statusCode}] ${response.statusMessage}`);
      }
      else {
        resolve();
      }
    });
  })
  .then(() => {

    params = {
      body: JSON.stringify({
        client_id: process.env.AUTH0_M2M_ID,
        user_id,
      }),
      headers: {
        "Authorization": `Bearer ${access_token}`,
        "Content-Type": "application/json"
      },
      method: "POST",
      url: `https://${process.env.AUTH0_DOMAIN}/api/v2/jobs/verification-email`
    };

    return new Promise((resolve, reject) => {
      console.log(`[Auth0] Sending verification email to ${user_id}`);
      request(params, (error, response, body) => {

        if (error) {
          reject(error);
        }
        else if (response.statusCode !== 201) {
          reject(`[Auth0][${response.statusCode}] ${response.statusMessage}`);
        }
        else {
          resolve();
        }
      });
    });
  });
}


async function updateAuth0Password (user_id, { email, old_password, new_password }) {

  // Check the current password.

  try {
    await getAuth0ClientToken(email, old_password);
  } catch (error) {
    if (error.toString().startsWith("![403]")) {
      throw new Error("![403] Incorrect password.");
    } else {
      throw error;
    }
  }

  // Update to new password.

  const { access_token } = await getAuth0ManagementToken();

  const params = {
    body: JSON.stringify({
      connection: "Username-Password-Authentication",
      password: new_password
    }),
    headers: {
      "Authorization": `Bearer ${access_token}`,
      "Content-Type": "application/json"
    },
    method: "PATCH",
    url: `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${user_id}`
  };

  return new Promise((resolve, reject) => {
    console.log(`[Auth0] Updating password for user ${user_id}`);
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


async function createAuth0User ({ user_id, role, email, password }) {

  const { access_token } = await getAuth0ManagementToken();

  const user = {
    user_id,
    email,
    password,
    email_verified: false,
    verify_email: true,
    connection: "Username-Password-Authentication",
    app_metadata: { role }
  };

  const options = {
    method: "POST",
    url: `https://${process.env.AUTH0_DOMAIN}/api/v2/users`,
    headers: {
      "Authorization": `Bearer ${access_token}`,
      "Content-Type": "application/json"
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
        if (response.statusCode === 409) {
          reject("![409] User already exists.");
        } else {
          reject(`[Auth0][${response.statusCode}] ${response.statusMessage}`);
        }
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
      "Content-Type": "application/json"
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


async function findAuth0UsersByEmail (email) {

  const { access_token } = await getAuth0ManagementToken();

  const options = {
    method: "GET",
    url: `https://${process.env.AUTH0_DOMAIN}/api/v2/users-by-email?email=${encodeURIComponent(email)}`,
    headers: {
      "Authorization": `Bearer ${access_token}`,
      "Content-Type": "application/json"
    }
  };

  return new Promise((resolve, reject) => {
    console.log(`[Auth0] Finding users by email ${email}`);
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


function getAuth0ClientToken (email, password) {

  // Fetches token on behalf of the client.

  const options = {
    method: "POST",
    url: `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
    headers: { "Content-Type": "application/json" },
    body: {
      grant_type: "password",
      username: email,
      password,
      scope: "openid read:openid",
      audience: `https://sub.city/auth`,
      client_id: process.env.AUTH0_RESOURCE_ID,
      client_secret: process.env.AUTH0_RESOURCE_SECRET,
    },
    json: true
  };

  return new Promise((resolve, reject) => {
    console.log(`[Auth0] Fetching client token`);
    request(options, (error, response, body) => {

      if (error) {
        reject(error);
      }
      else if (response.statusCode !== 200) {
        if (response.statusCode === 403) {
          reject("![403] Incorrect email or password.");
        } else {
          reject(`[Auth0][${response.statusCode}] ${response.statusMessage}`);
        }
      }
      else {
        resolve(body);
      }
    });
  });
}


function getAuth0ManagementToken () {

  // Fetches management token for the Auth0 API.

  const options = {
    method: "POST",
    url: `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.AUTH0_M2M_ID,
      client_secret: process.env.AUTH0_M2M_SECRET,
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
      "Content-Type": "application/json"
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
