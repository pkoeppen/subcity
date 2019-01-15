<template>
  <div class="md-layout">
    <div class="md-layout-item md-size-25 md-xsmall-size-100 md-small-size-50 md-medium-size-33" v-for="channel in channels" :key="channel.syndicate_id">
      <nuxt-link :to="`/channels/${channel.slug}`">
        <md-card class="card" md-with-hover>
          <md-card-media-cover md-solid>
            <md-card-media md-ratio="1:1">
              <img :src="`${DATA_HOST}/channels/${channel.channel_id}/profile.jpeg`" :alt="channel.title">
            </md-card-media>

            <md-card-area>
              <md-card-header>
                <span class="md-title">{{ channel.title }}</span>
              </md-card-header>
            </md-card-area>
          </md-card-media-cover>
        </md-card>
      </nuxt-link>
    </div>
  </div>
</template>

<script>

  export default {
    name: "Channels",
    props: ["channels"],
    data: () => ({
      DATA_HOST: process.env.DATA_HOST
    }),
  };
</script>

<style>

  .card {
    margin: 0 16px 16px 0 !important;
  }
  
  .md-layout {
    margin-right: -16px !important;
  }

</style>