<template>
  <md-app-toolbar class="md-transparent" md-elevation="0">
    <div class="container md-toolbar-row">
      <div style="flex: 1;">
        <logo style="width: 110px;"/>
      </div>
      
      <div class="md-toolbar-section-end">
        <md-button>channels</md-button>
        <md-button class="md-primary">syndicates</md-button>
        <md-button class="md-icon-button">
          <md-icon>menu</md-icon>
        </md-button>
      </div>
    </div>
  </md-app-toolbar>
</template>

<script>
  import Logo from "~/components/Logo.vue";
  export default {
    components: {
      Logo
    }
  };
</script>