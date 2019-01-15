import decode from "jwt-decode";
import cookie from "js-cookie";
import cookieParser from "cookieparser";


export const state = () => ({
  channels: [],
  syndicates: [],
  email: null,
  email_verified: null,
  role: null,
  token: null,
  id: null,
});


export const actions = {

  nuxtServerInit ({ commit, dispatch }, { req }) {
    var auth;
    if (req && req.headers.cookie) {
      const parsed = cookieParser.parse(req.headers.cookie);
      try {
        auth = JSON.parse(parsed.auth);
        commit("SET_SESSION", auth);
      } catch (error) {

      }
    }

    dispatch("getAllChannels");
    dispatch("getAllSyndicates");
  },

  success (ctx, snack) {
    const {
      message,
      status,
      statusText,
    } = snack;

    this.$bus.$emit("snack", {
      type: "success",
      message,
      status,
      statusText,
    });
  },

  error (ctx, error) {

    var message, status, statusText;

    if (error.response) {
      message = typeof error.response.data === "string" ? error.response.data : error.response.data.message;
      status = error.response.status;
      statusText = error.response.statusText;
    } else {
      message = error.message;
      status = error.name;
    }

    this.$bus.$emit("snack", {
      type: "error",
      message,
      status,
      statusText,
    });
  },

  sendEmailInvite ({ commit, dispatch }, email) {

    const query = `
      mutation ($email: String!) {
        sendEmailInvite (email: $email)
      }
    `;

    const vars = { email };
    return this.$axios.post("/api/private", { query, vars });
  },

  answerInvitation ({ commit, dispatch }, { syndicate_id, decision }) {

    const query = `
      mutation ($syndicate_id: ID!, $decision: Boolean!) {
        answerInvitation (syndicate_id: $syndicate_id, decision: $decision)
      }
    `;

    const vars = { syndicate_id, decision };
    return this.$axios.post("/api/private", { query, vars });
  },

  updateChannelEmail ({ commit, dispatch }, { email, password, new_email }) {

    const query = `
      mutation ($email: String!, $password: String!, $new_email: String!) {
        updateChannelEmail (email: $email, password: $password, new_email: $new_email)
      }
    `;

    const vars = { email, password, new_email };
    return this.$axios.post("/api/private", { query, vars });
  },

  updateChannelPassword ({ commit, dispatch }, data) {

    const query = `
      mutation ($data: PasswordInput!) {
        updateChannelPassword (data: $data)
      }
    `;

    const vars = { data };
    return this.$axios.post("/api/private", { query, vars });
  },

  updateSubscriber ({ commit, dispatch }, data) {

    const query = `
      mutation ($data: SubscriberInput!) {
        updateSubscriber (data: $data) {
          subscriber_id
        }
      }
    `;

    const vars = { data };
    return this.$axios.post("/api/private", { query, vars });
  },

  updateSubscriberEmail ({ commit, dispatch }, { email, password, new_email }) {

    const query = `
      mutation ($email: String!, $password: String!, $new_email: String!) {
        updateSubscriberEmail (email: $email, password: $password, new_email: $new_email)
      }
    `;

    const vars = { email, password, new_email };
    return this.$axios.post("/api/private", { query, vars });
  },

  updateSubscriberPassword ({ commit, dispatch }, data) {

    const query = `
      mutation ($data: PasswordInput!) {
        updateSubscriberPassword (data: $data)
      }
    `;

    const vars = { data };
    return this.$axios.post("/api/private", { query, vars });
  },

  createRelease ({ commit, dispatch }, data) {

    const query = `
      mutation ($data: ReleaseInput!) {
        createRelease (data: $data) {
          time_created
        }
      }
    `;

    const vars = { data };
    return this.$axios.post("/api/private", { query, vars });
  },

  updateRelease ({ commit, dispatch }, { time_created, ...data }) {

    const query = `
      mutation ($time_created: Float!, $data: ReleaseInput!) {
        updateRelease (time_created: $time_created, data: $data) {
          time_created
        }
      }
    `;

    const vars = { time_created, data };
    return this.$axios.post("/api/private", { query, vars });
  },

  deleteRelease ({ commit, dispatch }, time_created) {
    const query = `
      mutation ($time_created: Float!) {
        deleteRelease (time_created: $time_created)
      }
    `;

    const vars = { time_created };
    return this.$axios.post("/api/private", { query, vars });
  },

  createSyndicate ({ commit, dispatch }, data) {
    const query = `
      mutation ($data: SyndicateInput!) {
        createSyndicate (data: $data) {
          syndicate_id
        }
      }
    `;

    const vars = { data };
    return this.$axios.post("/api/private", { query, vars });
  },

  leaveSyndicate ({ commit, dispatch }, syndicate_id) {
    const query = `
      mutation ($syndicate_id: ID!) {
        leaveSyndicate (syndicate_id: $syndicate_id)
      }
    `;

    const vars = { syndicate_id };
    return this.$axios.post("/api/private", { query, vars });
  },

  createProposal ({ commit, dispatch }, data) {
    const query = `
      mutation ($data: ProposalInput!) {
        createProposal (data: $data) {
          time_created
        }
      }
    `;

    const vars = { data };
    return this.$axios.post("/api/private", { query, vars });
  },

  castVote ({ commit, dispatch }, data) {
    const query = `
      mutation ($data: VoteInput!) {
        castVote (data: $data) {
          time_created
        }
      }
    `;

    const vars = { data };
    return this.$axios.post("/api/private", { query, vars });
  },

  getPayoutSettings ({ commit }) {

    const query = `
      query {
        getPayoutSettings {
          account_number_last4,
          bank_name,
          city,
          country,
          dob,
          first_name,
          last_name,
          line1,
          postal_code,
          routing_number,
          state
        }
      }
      `;

    return this.$axios.post("/api/private", { query })
    .then(({ data: { getPayoutSettings: settings }}) => settings);
  },

  updatePayoutSettings ({ commit, dispatch }, data) {
    const query = `
      mutation ($data: PayoutSettingsInput!) {
        updatePayoutSettings (data: $data)
      }
    `;

    const vars = { data };
    return this.$axios.post("/api/private", { query, vars });
  },

  createSource ({ commit, dispatch }, token) {
    const query = `
      mutation ($token: ID!) {
        createSource (token: $token)
      }
    `;

    const vars = { token };
    return this.$axios.post("/api/private", { query, vars });
  },

  setDefaultSource ({ commit, dispatch }, source_id) {
    const query = `
      mutation ($source_id: ID!) {
        setDefaultSource (source_id: $source_id)
      }
    `;

    const vars = { source_id };
    return this.$axios.post("/api/private", { query, vars });
  },

  deleteSource ({ commit, dispatch }, source_id) {
    const query = `
      mutation ($source_id: ID!) {
        deleteSource (source_id: $source_id)
      }
    `;

    const vars = { source_id };
    return this.$axios.post("/api/private", { query, vars });
  },

  getAllChannels ({ commit }) {

    const query = `
      query {
        getAllChannels {
          channel_id,
          description { rendered },
          slug,
          title
        }
      }
    `;

    return this.$axios.post("/api/public", { query })
    .then(({ data: { getAllChannels: channels }}) => {
      commit("SET_CHANNELS", channels);
    });
  },

  getAllSyndicates ({ commit }) {

    const query = `
      query {
        getAllSyndicates {
          syndicate_id,
          description { rendered },
          slug,
          title
        }
      }
    `;

    return this.$axios.post("/api/public", { query })
    .then(({ data: { getAllSyndicates: syndicates }}) => {
      commit("SET_SYNDICATES", syndicates);
    });
  },

  getSources ({ commit, dispatch }) {
    
    const query = `
      query {
        getSources {
          source_id,
          brand,
          country,
          default,
          exp_month,
          exp_year,
          funding,
          last4,
        }
      }
    `;

    return this.$axios.post("/api/private", { query })
    .then(({ data: { getSources }}) => getSources);
  },

  getSubscriberByID ({ commit }) {

    const query = `
      query {
        getSubscriberByID {
          alias,
          address {
            city,
            country,
            first_name,
            last_name,
            line1,
            postal_code,
            state,
          },
        }
      }
    `;

    return this.$axios.post("/api/private", { query })
    .then(({ data: { getSubscriberByID: subscriber }}) => subscriber);
  },

  getSubscription ({ commit, dispatch }, { channel_id, syndicate_id }) {
    
    const query = `
      query ($channel_id: ID, $syndicate_id: ID) {
        getSubscription (channel_id: $channel_id, syndicate_id: $syndicate_id) {
          channel_id,
          extra,
          subscriber_id,
          subscription_id,
          syndicate_id,
          tier,
          time_created,
        }
      }
    `;

    const vars = { channel_id, syndicate_id };
    return this.$axios.post("/api/private", { query, vars });
  },

  createSubscription ({ commit, dispatch }, data) {

    const query = `
      mutation ($channel_id: ID, $syndicate_id: ID, $extra: Int!, $tier: Int!) {
        createSubscription (channel_id: $channel_id, syndicate_id: $syndicate_id, extra: $extra, tier: $tier) {
          channel_id,
          extra,
          subscriber_id,
          subscription_id,
          syndicate_id,
          tier,
          time_created,
        }
      }
    `;

    const vars = { ...data };
    return this.$axios.post("/api/private", { query, vars });
  },

  login ({ commit }, { email, password, redirect }) {

    const query = `
      query ($email: String!, $password: String!) {
        getToken (email: $email, password: $password) {
          access_token,
          id_token,
          expires_in
        }
      }
    `;

    const vars = {
      email,
      password,
    };

    return this.$axios.post("/api/public", { query, vars })
    .then(({ data: { getToken: result }}) => {
      commit("SET_SESSION", result);
      if (redirect) {
        this.$router.push({ path: redirect });
      }
    });
  },

  logout ({ commit }, { redirect, silent }) {
    commit("UNSET_SESSION");
    this.$bus.$emit("logout");

    if (!silent) {
      this.$bus.$emit("snack", {
        type: "success",
        message: "Logout successful.",
        status: 200
      });
    }

    if (redirect) {
      this.$router.push({ path: redirect });
    }
  },

  initializeChannel ({ commit, dispatch }, data) {

    const query = `
      mutation ($data: InitializeChannelInput!) {
        initializeChannel (data: $data) {
          channel_id
        }
      }
    `;

    const vars = { data };
    return this.$axios.post("/api/public", { query, vars });
  },

  initializeSubscriber ({ commit, dispatch }, data) {

    const query = `
      mutation ($data: InitializeSubscriberInput!) {
        initializeSubscriber (data: $data) {
          subscriber_id
        }
      }
    `;

    const vars = { data };
    return this.$axios.post("/api/public", { query, vars });
  },

  updateChannel ({ commit, dispatch }, data) {

    const query = `
      mutation ($data: ChannelInput!) {
        updateChannel (data: $data) {
          channel_id
        }
      }
    `;

    const vars = { data };
    return this.$axios.post("/api/private", { query, vars });
  },

  async uploadFile ({ commit, dispatch }, { file, time_created, syndicate_id, type, progress }) {

    const query = `
      query ($data: GetUploadURLInput!) {
        getUploadURL (data: $data)
      }
    `;

    const vars = {
      data: {
        upload_type: type,
        filename: file.name,
        mime_type: file.type,
        syndicate_id,
        time_created,
      }
    };

    const uploadURL = await this.$axios.post(`/api/private`, { query, vars })
    .then(({ data: { getUploadURL }}) => getUploadURL);

    console.log("uploadURL:\n", uploadURL)

    await this.$axios.put(uploadURL, file, {
      onUploadProgress: progress,
      transformRequest: [
        (data, headers) => {
          delete headers.common;
          delete headers.put;
          headers["Content-Type"] = file.type;
          return data;
        }
      ]
    });
  }
};


export const mutations = {

  SET_CHANNELS (state, channels) {
    state.channels = channels;
  },

  SET_SYNDICATES (state, syndicates) {
    state.syndicates = syndicates;
  },

  SET_SESSION (state, result) {
    const {
      access_token,
      id_token,
      expires_in
    } = result;

    if (process.browser) {
      cookie.set("auth", result);
    }

    const decoded = decode(id_token);
    const email = decoded.email;
    const email_verified = decoded.email_verified;
    const id = decoded.sub.replace(/auth0\|(acct|cus)_/, "");
    const role = decoded["https://sub.city/role"];

    state.email = email;
    state.email_verified = email_verified;
    state.id = id;
    state.role = role;
    state.token = access_token;
  },

  UNSET_SESSION (state) {
    cookie.remove("auth");
    state.role = null;
    state.token = null;
  }
};
