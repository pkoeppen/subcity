<template>
  <div id="portal" style="margin-bottom: 0;">
    <md-tabs class="md-primary" md-alignment="centered" md-sync-route style="margin-left: -16px; margin-right: -16px; z-index: 10;">
      <md-tab id="tab-signup" md-label="Sign Up" to="/portal?signup=true">
        <section class="container">
          <form-signup style="margin: 16px auto; width: 100%; max-width: 400px; z-index: 10;"/>
        </section>
      </md-tab>

      <md-tab id="tab-login" md-label="Login" to="/portal?login=true">
        <section class="container">
          <form-login style="margin: 16px auto; width: 100%; max-width: 400px; z-index: 10;"/>
        </section>
      </md-tab>
    </md-tabs>
    <div style="position: absolute; top: 48px; bottom: 0; left: -16px; right: -16px; z-index: 0;">
      <img style="position: absolute; bottom: 0; height: 90%; max-width: initial;" src="~/assets/images/city.svg" />
    </div>
  </div>
</template>

<script>
  import FormLogin from "~/components/FormLogin.vue";
  import FormSignup from "~/components/FormSignup.vue";

  export default {
    name: "Portal",
    components: {
      FormLogin,
      FormSignup
    },

    head () {
      return {
        title: `Portal || sub.city`,
      }
    },

    mounted () {
      if (this.$route.query.login || this.$route.query.email) {
        setTimeout(() => document.querySelectorAll(".md-tabs-navigation > .md-button")[1].click(), 200);
      }
    },

    watch: {
      "$route": (to) => {
        if (to.query.signup) {
          setTimeout(() => document.querySelectorAll(".md-tabs-navigation > .md-button")[0].click(), 0);
        } else if (to.query.login) {
          setTimeout(() => document.querySelectorAll(".md-tabs-navigation > .md-button")[1].click(), 0);
        }
      }
    }
  }
</script>

<style lang="scss">

  .container {
    max-width: 1200px;
    margin: 0 auto;
  }

  #portal {
    position: relative;

    .md-content {
      z-index: 10;
      background-color: transparent !important; 
    }
  }
</style>
