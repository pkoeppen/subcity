<template>
  <div class="drawer">
    <div>

      <md-toolbar class="md-transparent" md-elevation="0">
        <span class="md-title">Settings</span>
      </md-toolbar>
      <md-list>
        <md-list-item>
          <nuxt-link  to="/settings/subscriptions" class="settings-link">
            <md-button class="md-primary">
              <md-icon style="margin-left: 8px;">recent_actors</md-icon>
              <span class="md-list-item-text">Subscriptions</span>
            </md-button>
          </nuxt-link>
        </md-list-item>
        <md-list-item>
          <nuxt-link  to="/settings/account" class="settings-link">
            <md-button class="md-primary">
              <md-icon style="margin-left: 8px;">settings</md-icon>
              <span class="md-list-item-text">Account</span>
            </md-button>
          </nuxt-link>
        </md-list-item>
      </md-list>
    </div>
    <div>
      <md-toolbar class="md-primary taskbar" md-elevation="0">
        <md-button @click="logout()">
          <span>Logout</span>
        </md-button>
      </md-toolbar>
    </div>
  </div>
</template>

<script>
  export default {
    name: "DrawerSubscriber",
    methods: {
      logout () {
        this.$store.dispatch("logout", { redirect: "/channels" });
      }
    }
  }
</script>

<style lang="scss" >

  .drawer {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .settings-link {
    width: 100%;

    .md-button {
      width: 100%;
      margin: 0;
    }

    .md-ripple {
      justify-content: flex-start !important;
    }

    .md-button-content {
      display: flex;
      align-items: center;

      :first-child {
        margin-right: 32px;
      }

      * {
        display: inline;
      }
    }
  }


  .taskbar {
    width: 100%;
    justify-content: center;
  }

</style>