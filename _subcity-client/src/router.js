import Vue from "vue";
import Router from "vue-router";

import AppHeader from "@/layout/AppHeader";
import AppFooter from "@/layout/AppFooter";

import Channels from "@/views/Channels";
import ChannelSingle from "@/views/ChannelSingle";
import ReleaseSingle from "@/views/ReleaseSingle";
import Syndicates from "@/views/Syndicates";
import SyndicateSingle from "@/views/SyndicateSingle";
import Onboarding from "@/views/Onboarding";

import SettingsChannel from "@/views/Settings/SettingsChannel";
import SettingsReleases from "@/views/Settings/SettingsReleases";
import SettingsSyndicates from "@/views/Settings/SettingsSyndicates";
import SettingsSyndicatesSingle from "@/views/Settings/SettingsSyndicatesSingle";
import SettingsPayment from "@/views/Settings/SettingsPayment";
import SettingsGeneral from "@/views/Settings/SettingsGeneral";

import auth from "@/auth/";
import config from "./globals/config";

Vue.use(Router);

export default new Router({
  linkActiveClass: "active",
  mode: "history",
  routes: [

    {
      path: "/",
      name: "index",
      components: {
        header: AppHeader,
        default: Channels,
        footer: AppFooter
      }
    },

    {
      path: "/login",
      name: "login",
      beforeEnter: handleLogin
    },
    
    {
      path: "/channels",
      name: "channels",
      components: {
        header: AppHeader,
        default: Channels,
        footer: AppFooter
      }
    },

    {
      path: "/channels/:slug",
      name: "channel",
      components: {
        header: AppHeader,
        default: ChannelSingle,
        footer: AppFooter
      }
    },

    {
      path: "/channels/:channel_slug/:release_slug",
      name: "release",
      components: {
        header: AppHeader,
        default: ReleaseSingle,
        footer: AppFooter
      }
    },

    {
      path: "/syndicates",
      name: "syndicates",
      components: {
        header: AppHeader,
        default: Syndicates,
        footer: AppFooter
      }
    },

    {
      path: "/syndicates/:slug",
      name: "syndicate",
      components: {
        header: AppHeader,
        default: SyndicateSingle,
        footer: AppFooter
      }
    },

    {
      path: "/settings",
      name: "settings",
      beforeEnter: assertAuthenticated(null, true)
    },

    {
      path: "/settings/channels",
      name: "settings-channels",
      components: {
        header: AppHeader,
        default: SettingsChannel,
        footer: AppFooter
      },
      beforeEnter: assertAuthenticated("subscriber")
    },

    {
      path: "/settings/channel",
      name: "settings-channel",
      components: {
        header: AppHeader,
        default: SettingsChannel,
        footer: AppFooter
      },
      beforeEnter: assertAuthenticated("channel")
    },

    {
      path: "/settings/releases",
      name: "settings-releases",
      components: {
        header: AppHeader,
        default: SettingsReleases,
        footer: AppFooter
      },
      beforeEnter: assertAuthenticated("channel")
    },

    {
      path: "/settings/syndicates",
      name: "settings-syndicates",
      components: {
        header: AppHeader,
        default: SettingsSyndicates,
        footer: AppFooter
      },
      beforeEnter: assertAuthenticated("channel")
    },

    {
      path: "/settings/syndicates/:slug",
      name: "settings-syndicates-single",
      components: {
        header: AppHeader,
        default: SettingsSyndicatesSingle,
        footer: AppFooter
      },
      beforeEnter: assertAuthenticated("channel")
    },

    {
      path: "/settings/payment",
      name: "settings-payment",
      components: {
        header: AppHeader,
        default: SettingsPayment,
        footer: AppFooter
      },
      beforeEnter: assertAuthenticated()
    },

    {
      path: "/settings/general",
      name: "settings-general",
      components: {
        header: AppHeader,
        default: SettingsGeneral,
        footer: AppFooter
      },
      beforeEnter: assertAuthenticated("channel")
    },

    {
      path: "/onboarding/:token_id",
      name: "onboarding",
      components: {
        header: AppHeader,
        default: Onboarding,
        footer: AppFooter
      },
      beforeEnter: (to, from, next) => {
        const token_id = to.params.token_id;
        if (!token_id) { return next("/"); }
        const query = `
          query($token_id: ID!) {
            getSignupToken(token_id: $token_id)
          }
        `;
        const vars = { token_id };
        Vue.prototype.$http.post("/api/public", { query, vars })
        .then(response => {
          const tokenValid = response.data.data.getSignupToken;
          if (tokenValid) { next(); }
          else { next("/"); }
        }).catch(error => next("/"));
      }
    },

    {
      path: "*",
      redirect: "/"
    },
  ],

  scrollBehavior: to => {
    if (to.hash) {
      return { selector: to.hash };
    } else {
      return { x: 0, y: 0 };
    }
  }
});

function handleLogin(to, from, next) {

  // Set authorized session.

  const hash = window.location.hash.substr(1);
  const authResult = hash.split('&').reduce(function (result, item) {
      const parts = item.split('=');
      result[parts[0]] = parts[1];
      return result;
  }, {});
  auth.setSession(authResult);

  // Execute secondary action (subscribe).

  const { subscribe, onetime, amount, redirect } = to.query;
  let data, query;

  if (subscribe) {

    // "Subscribe" action.

    let [ type, id ] = subscribe.split(":");

    data = {
      subscribe: true,
      ...(type === "channel" && { _channel_id: id }),
      ...(type === "syndicate" && { _syndicate_id: id }),
    };
    query = `
      mutation($data: ModifySubscriptionInput!) {
        modifySubscription(data: $data)
      }
    `;
  }

  else if (onetime) {

    // "One-time donation" action.

    let [ type, id ] = onetime.split(":");

    data = {
      amount,
      ...(type === "channel" && { _channel_id: id }),
      ...(type === "syndicate" && { _syndicate_id: id }),
    };
    query = `
      mutation($data: OnetimeInput!) {
        onetime(data: $data)
      }
    `;
  }

  else {

    // No action - proceed.

    return next(redirect || "/");
  }

  // Off to GraphQL-land.

  config.$http.post("/api/private",
    { query, vars: { data }},
    { headers: config.$getHeaders() })
  .then(response => {
    if (response.data.errors) {

      // Error.

      throw new Error(response.data.errors[0].message);
    }

    // Upon successful subscription, redirect to the given redirect URL.

    next(`${redirect || "/"}?success=true`);
  }).catch(error => next(`${redirect || "/"}?error=true`));
}

function assertAuthenticated(roleToMatch, redirect) {
  return (to, from, next) => {

    const role = auth.getRole();
    const isAuthenticated = auth.isAuthenticated();
    const hasCorrectRole = roleToMatch ? role === roleToMatch : true;

    if (isAuthenticated && hasCorrectRole) {
      if (redirect) {
        next(role === "subscriber" ? "/settings/channels" : "/settings/channel");
      } else {
        next();
      }
    } else {
      next("/");
    }
  };
}