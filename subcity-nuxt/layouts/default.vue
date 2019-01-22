<template>
  <div>
    <md-app style="height: 100vh;" md-waterfall md-mode="fixed">
      <md-app-toolbar style="background-color: white; z-index: 100;">
        <div class="container md-toolbar-row">
          <nuxt-link to="/">
            <logo style="width: 110px;"/>
          </nuxt-link>

          <div class="md-toolbar-section-end" style="flex: 1;">
            <div v-if="$route.fullPath !== '/'" class="md-layout-item md-size-50 md-small-hide" style="margin-right: 16px;">
              <search />
            </div>
            <nuxt-link to="/channels">
              <md-button>channels</md-button>
            </nuxt-link>
            <nuxt-link to="/syndicates">
              <md-button>syndicates</md-button>
            </nuxt-link>
            <md-button class="md-icon-button" @click="showDrawer = true">
              <md-icon>menu</md-icon>
            </md-button>
          </div>
        </div>
      </md-app-toolbar>

      <md-app-drawer class="md-right" :md-active.sync="showDrawer">
        <drawer-channel v-if="role === 'channel'"/>
        <drawer-subscriber v-else-if="role === 'subscriber'"/>
        <drawer-public v-else />
      </md-app-drawer>

      <md-app-content>

        <nuxt class="nuxt"/>
        
        <md-toolbar id="footer">
          <div class="container">
            <div>
              <span class="md-caption">&copy; 2019 sub.city</span>
              <nuxt-link to="/site/legal#terms" class="md-caption" style="margin-left: 16px;">Terms</nuxt-link>
              <nuxt-link to="/site/legal#privacy" class="md-caption" style="margin-left: 16px;">Privacy</nuxt-link>
            </div>
            <div>
              <md-icon>lock</md-icon>
            </div>
          </div>
        </md-toolbar>
      </md-app-content>
    </md-app>

    <md-snackbar md-position="center" :md-duration="6000" :md-active.sync="showSnackbar" md-persistent>
      <div style="display: flex; align-items: center;">
        <md-icon :class="snackbarClass">{{ snackbarIconType }}</md-icon>
        <span style="margin-left: 16px;">{{ snackbarMessage }}</span>
      </div>
      <md-button :class="snackbarClass" @click="showSnackbar = false">Close</md-button>
    </md-snackbar>
  </div>
</template>

<script>
  import DrawerChannel from "~/components/DrawerChannel.vue";
  import DrawerPublic from "~/components/DrawerPublic.vue";
  import DrawerSubscriber from "~/components/DrawerSubscriber.vue";
  import Logo from "~/components/Logo.vue";
  import Search from "~/components/Search.vue";


  export default {
    components: {
      DrawerChannel,
      DrawerPublic,
      DrawerSubscriber,
      Logo,
      Search,
    },

    data: () => ({
      showDrawer: false,
      showSnackbar: false,
      snackbarMessage: null,
      snackbarType: null,
    }),

    created () {

      if (this.$route.query.supportSignUp) {
        this.$store.dispatch("logout", { silent: true });
        setTimeout(() => this.$store.dispatch("success", {
          message: "Email verified successfully.",
          status: 200,
        }), 0);
      }

      this.$bus.$on("logout", () => {
        this.showDrawer = false;
      });

      this.$bus.$on("snack", ({ type, status, statusText, message }) => {
        //this.snackbarMessage = `[${status}] ${statusText ? statusText + ": " : ""}${message}`;
        this.snackbarMessage = message;
        this.snackbarType = type;
        this.showSnackbar = true;
      });

      this.$bus.$on("drawer:close", () => {
        this.showDrawer = false;
      });
    },

    computed: {

      role () {
        return this.$store.state.role;
      },

      snackbarClass () {
        switch (this.snackbarType) {
          case "success":
            return "green";
          case "error":
            return "md-primary";
          default:
            return "white"
        }
      },

      snackbarIconType () {
        switch (this.snackbarType) {
          case "success":
            return "check_circle";
          case "error":
            return "warning";
          default:
            return "info"
        }
      }
    },

    watch: {

      $route: function () {
        this.showDrawer = false;
      },
    }
  };
</script>

<style lang="scss" scoped>

  .md-drawer {
    width: 320px;
    max-width: calc(100vw - 125px);

    @media screen and (max-width: 450px) {
      width: 100%;
      max-width: calc(100vw - 60px);
    }
  }

  .nuxt {
    min-height: calc(100vh - 126px);
    margin-bottom: 16px;
  }

  .nuxt-link-active .md-button {
    color: #ff5252;
  }

  .text-uppercase {
    text-transform: uppercase;
  }

  .green {
    color: #00e676 !important;
  }

  .white {
    color: white !important;
  }

  #footer {
    position: relative;
    left: -16px;
    width: calc(100% + 32px);

    .container {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .md-icon {
        color: #ff5252;
      }
    }
  }

</style>
