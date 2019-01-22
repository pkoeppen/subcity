<template>
  <div class="drawer">
    <div>
      <md-toolbar class="md-primary drawer-search">
        <search :box="true" />
      </md-toolbar>
      <md-toolbar class="first md-transparent" md-elevation="0">
        <span class="md-title">Settings</span>
      </md-toolbar>
      <md-divider class="md-inset"/>
      <md-list>
        <md-list-item>
          <nuxt-link  to="/settings/channel" class="settings-link">
            <md-button class="md-primary">
              <md-icon style="margin-left: 8px;">recent_actors</md-icon>
              <span class="md-list-item-text">Channel</span>
            </md-button>
          </nuxt-link>
        </md-list-item>
        <md-list-item>
          <nuxt-link  to="/settings/releases" class="settings-link">
            <md-button class="md-primary">
              <md-icon style="margin-left: 8px;">perm_media</md-icon>
              <span class="md-list-item-text">Releases</span>
            </md-button>
          </nuxt-link>
        </md-list-item>
        <md-list-item>
          <nuxt-link  to="/settings/syndicates" class="settings-link">
            <md-button class="md-primary">
              <md-icon style="margin-left: 8px;">group_work</md-icon>
              <span class="md-list-item-text">Syndicates</span>
            </md-button>
          </nuxt-link>
        </md-list-item>
        <md-list-item>
          <nuxt-link  to="/settings/subscribers" class="settings-link">
            <md-button class="md-primary">
              <md-icon style="margin-left: 8px;">group</md-icon>
              <span class="md-list-item-text">Subscribers</span>
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
      <md-toolbar class="md-transparent" md-elevation="0">
        <span class="md-title">Support</span>
      </md-toolbar>
      <md-divider class="md-inset"/>
      <md-list>
        <md-list-item>
          <nuxt-link  to="/site/guide" class="settings-link">
            <md-button class="md-primary">
              <md-icon style="margin-left: 8px;">explore</md-icon>
              <span class="md-list-item-text">Guide</span>
            </md-button>
          </nuxt-link>
        </md-list-item>
        <md-list-item>
          <nuxt-link  to="/site/about" class="settings-link">
            <md-button class="md-primary">
              <md-icon style="margin-left: 8px;">public</md-icon>
              <span class="md-list-item-text">About</span>
            </md-button>
          </nuxt-link>
        </md-list-item>
        <md-list-item>
          <nuxt-link  to="/site/support" class="settings-link">
            <md-button class="md-primary">
              <md-icon style="margin-left: 8px;">contact_support</md-icon>
              <span class="md-list-item-text">Contact</span>
            </md-button>
          </nuxt-link>
        </md-list-item>
        <md-list-item>
          <nuxt-link  to="/site/legal" class="settings-link">
            <md-button class="md-primary">
              <md-icon style="margin-left: 8px;">copyright</md-icon>
              <span class="md-list-item-text">Legal</span>
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
  import Search from "~/components/Search.vue";

  export default {
    name: "DrawerChannel",
    components: {
      Search,
    },
    methods: {
      logout () {
        this.$store.dispatch("logout", { redirect: "/channels" });
      }
    }
  }
</script>

<style lang="scss" scoped>
  
  .md-toolbar.first {
    
    @media screen and (max-width: 960px) {
      margin-top: 16px;
    }
  }
  
</style>
