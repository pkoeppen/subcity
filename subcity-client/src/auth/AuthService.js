import EventEmitter from "eventemitter3";
import decode from "jwt-decode";

export default class AuthService {
  authenticated = this.isAuthenticated();
  authNotifier = new EventEmitter();

  constructor () {
    this.login           = this.login.bind(this);
    this.logout          = this.logout.bind(this);
    this.setSession      = this.setSession.bind(this);
    this.getAccessToken  = this.getAccessToken.bind(this);
    this.getRole         = this.getRole.bind(this);
    this.isAuthenticated = this.isAuthenticated.bind(this);
    this.handleError     = this.handleError.bind(this);
  }
  
  webAuth = new auth0.WebAuth({
    domain:       process.env.AUTH0_DOMAIN,
    clientID:     process.env.AUTH0_CLIENT_ID,
    audience:     process.env.AUTH0_API_URL,
    scope:        "openid profile read:messages",
    responseType: "token id_token"
  });

  login(email, password, action) {

    // Build the subscribe action query string. This determines
    // which channel or syndicate a user is subscribing to.

    // TODO: Remove one-time login + donation action.

    let query = `?redirect=${action.redirect.replace(/\//g, "%2F")}`;
    if (action.subscribe) {
      query += `&subscribe=${action.subscribe}`;
    } else if (action.onetime && action.amount) {
      query += `&onetime=${action.onetime}&amount=${action.amount}`;
    }

    // Fetch authorization token and redirect.

    this.webAuth.login({
      realm: "Username-Password-Authentication",
      redirectUri: `${process.env.SPA_HOST}/login${query}`,
      email,
      password
    }, this.handleError);
  }

  logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("id_token");
    localStorage.removeItem("expires_at");
    this.authNotifier.emit("logout");
  }

  setSession(authResult) {

    const access_token = authResult.accessToken || authResult.access_token;
    const id_token     = authResult.idToken || authResult.id_token;
    const expires_in   = authResult.expiresIn || authResult.expires_in;

    const expires_at = JSON.stringify(
      expires_in * 1000 + new Date().getTime()
    );

    localStorage.setItem("access_token", access_token);
    localStorage.setItem("id_token", id_token);
    localStorage.setItem("expires_at", expires_at);

    this.authNotifier.emit("login");

    // Renew the user's session shortly before it expires. (ergo 900, not 1000)

    setTimeout(() => this.renewSession(), 900 * expires_in);
  }

  renewSession() {
    const options = {
      redirectUri: `${process.env.SPA_HOST}/login`,
      responseType: "token id_token"
    };
    this.webAuth.checkSession(options, this.setSession);
  }

  getAccessToken() {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      throw new Error("No access token found");
    }
    return accessToken;
  }

  getRole() {

    // id_token may still be saved locally, meaning a role can be fetched
    // even if the user is not logged in. If not logged in, return no role.

    if (!this.isAuthenticated()) {
      return null;
    }
    
    const namespace = process.env.SPA_HOST;
    const id_token  = localStorage.getItem("id_token");

    if (id_token) {

      // TODO: Change this back to variable
      
      return (decode(id_token)[`${process.env.SPA_HOST}/roles`] || [])[0] || null;
    }
  }

  getLogins() {
    const namespace = process.env.SPA_HOST;
    const id_token  = localStorage.getItem("id_token");
    if (id_token) {
      return decode(id_token)[`${namespace}/login_count`] || null;
    }
  }

  isAuthenticated() {
    const expires_at = JSON.parse(localStorage.getItem("expires_at"));
    return new Date().getTime() < expires_at;
  }

  handleError(error) {
    this.authNotifier.emit("authError", { error });
    console.error(error);
  }
}
