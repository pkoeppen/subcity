<template>
  <div>
    <md-toolbar class="toolbar" md-elevation="0">
      <div class="container" style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <nuxt-link to="/">&raquo; site</nuxt-link>
          <nuxt-link to="/site/guide" style="margin-left: 8px;">&raquo; about</nuxt-link>
        </div>
        <md-badge class="badge md-square md-primary" md-content="Updated: 16 Jan 2019" />
      </div>
    </md-toolbar>
    <section class="container" style="margin-top: 32px;">
      <div class="md-layout" style="justify-content: center;">
        <div class="md-layout-item md-size-80 md-small-size-100">
          <md-card>
            
          </md-card>
        </div>
      </div>
      <div style="display: flex; justify-content: center; align-items: center; margin: 40px 0; color: #666;">
        <span class="bold-italic" style="margin-right: 8px;">Enjoy the site!</span>
        <md-icon style="margin: 0;">insert_emoticon</md-icon>
      </div>
    </section>
  </div>
</template>

<script>
  export default {
    name: "About",
    head () {
      return {
        title: `About || sub.city`,
      }
    },
  };
</script>

<style lang="scss" scoped>

  .badge {
    color: white !important;
    background-color: #666 !important;
    text-transform: uppercase;
    position: relative;
    right: 0;
  }

  .md-card {
    margin-left: 0;
    margin-right: 0;
  }

  .md-layout-item {

    &:not(:first-child) {
      margin-top: 32px;
    }

    @media screen and (max-width: 960px) {
      &:not(:first-child) {
        margin-top: 16px;
      }
    }
  }

  .toolbar {
    width: calc(100% + 32px;);
    position: relative;
    left: -16px;
    padding-left: 16px;
    padding-right: 16px;
  }
</style>