<template>
  <div class="drawer">
    <div>
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
    </div>
    <div>
      <md-toolbar class="md-transparent" md-elevation="0">
        <span class="md-title">Public</span>
      </md-toolbar>
      <md-list>
        <md-list-item>
          <span class="md-list-item-text">Abbey Christansen</span>

          <md-button class="md-icon-button md-list-action">
            <md-icon class="md-primary">chat_bubble</md-icon>
          </md-button>
        </md-list-item>

        <md-list-item>
          <span class="md-list-item-text">Alex Nelson</span>

          <md-button class="md-icon-button md-list-action">
            <md-icon class="md-primary">chat_bubble</md-icon>
          </md-button>
        </md-list-item>

        <md-list-item>
          <span class="md-list-item-text">Mary Johnson</span>

          <md-button class="md-icon-button md-list-action">
            <md-icon>chat_bubble</md-icon>
          </md-button>
        </md-list-item>
      </md-list>

      <md-divider/>

      <md-toolbar class="md-transparent" md-elevation="0">
        <span class="md-title">Settings</span>
      </md-toolbar>
      <md-list>
        <md-list-item>
          <md-icon>dashboard</md-icon>
          <nuxt-link to="/settings/channel">
            <span class="md-list-item-text">Channel</span>
          </nuxt-link>
        </md-list-item>
        <md-list-item>
          <md-icon>perm_media</md-icon>
          <span class="md-list-item-text">Releases</span>
        </md-list-item>
        <md-list-item>
          <md-icon>group_work</md-icon>
          <span class="md-list-item-text">Syndicates</span>
        </md-list-item>
        <md-list-item>
          <md-icon>account_balance</md-icon>
          <span class="md-list-item-text">Payment</span>
        </md-list-item>
        <md-list-item>
          <md-icon>settings</md-icon>
          <span class="md-list-item-text">General</span>
        </md-list-item>
      </md-list>
    </div>
  </div>
</template>

<style>

  .drawer {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .taskbar {
    width: 100%;
    justify-content: center;
  }

</style>