<template>
  <div class="drawer">
    <div>
      <md-toolbar class="md-primary drawer-search">
        <search :box="true" />
      </md-toolbar>
      <md-toolbar class="md-default taskbar" md-elevation="0">
        <nuxt-link to="/portal?signup=true">
          <md-button class="md-primary" @click="$bus.$emit('drawer:close', 'signup')">
            <span>Sign Up</span>
          </md-button>
        </nuxt-link>
        <nuxt-link to="/portal?login=true">
          <md-button @click="$bus.$emit('drawer:close', 'login')">
            <span>Login</span>
          </md-button>
        </nuxt-link>
      </md-toolbar>
      <md-toolbar class="first md-transparent" md-elevation="0">
        <span class="md-title">Getting started</span>
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
          <nuxt-link  to="/channels" class="settings-link">
            <md-button class="md-primary">
              <md-icon style="margin-left: 8px;">recent_actors</md-icon>
              <span class="md-list-item-text">Channels</span>
            </md-button>
          </nuxt-link>
        </md-list-item>
        <md-list-item>
          <nuxt-link  to="/syndicates" class="settings-link">
            <md-button class="md-primary">
              <md-icon style="margin-left: 8px;">group_work</md-icon>
              <span class="md-list-item-text">Syndicates</span>
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
          <span class="md-caption">sub.city v1.0.0</span>
      </md-toolbar>
    </div>
  </div>
</template>

<script>
  import Search from '~/components/Search.vue';

  export default {
    name: "DrawerPublic",
    components: {
      Search,
    }
  }
</script>

<style lang="scss" scoped>
  
  .md-toolbar.first {
    margin-top: 16px;
  }

</style>
