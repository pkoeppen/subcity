<template>
  <div style="margin-bottom: 0; position: relative; height: 100%;">
    <div class="container" style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
      <div class="md-elevation-10" style="background-color: white; padding: 80px 60px; z-index: 99; text-align: center;">
        <div class="bold-italic md-display-3">{{ error.statusCode || error.status || 500 }}: {{ error.message || error.data || "Network error" }}</div>
        <md-button to="/" class="md-primary" style="margin-top: 32px;">Home page</md-button>
      </div>
    </div>
    <div style="position: absolute; top: 48px; bottom: 0; left: -16px; right: -16px; z-index: 0;">
      <img style="position: absolute; bottom: 0; height: 90%; max-width: initial; opacity: .5;" src="~/assets/images/city.svg" />
    </div>
  </div>
</template>

<script>
export default {
  props: ['error'],
}
</script>