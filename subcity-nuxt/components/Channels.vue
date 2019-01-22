<template>
  <div class="md-layout">
    <div class="md-layout-item md-size-25 md-small-size-33 md-xsmall-size-50" v-for="channel in channels" :key="channel.syndicate_id">
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

<style lang="scss" scoped>

  .card {
    margin: 0 16px 16px 0 !important;
  }
  
  .md-layout {
    margin-right: -16px !important;

    .md-layout-item {
      @media screen and (max-width: 400px) {
        min-width: 100%;
        max-width: 100%;
        flex: 0 1 100%;
      }
    }
  }

</style>