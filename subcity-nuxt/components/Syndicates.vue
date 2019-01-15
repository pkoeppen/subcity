<template>
  <div class="md-layout">
    <div class="md-layout-item md-size-25 md-xsmall-size-100 md-small-size-50 md-medium-size-33" v-for="syndicate in syndicates" :key="syndicate.syndicate_id">
      <nuxt-link :to="`/syndicates/${syndicate.slug}`">
        <md-card class="card" md-with-hover>
          <md-card-media-cover md-solid>
            <md-card-media md-ratio="1:1">
              <img :src="`${DATA_HOST}/syndicates/${syndicate.syndicate_id}/profile.jpeg`" :alt="syndicate.title">
            </md-card-media>

            <md-card-area>
              <md-card-header>
                <span class="md-title">{{ syndicate.title }}</span>
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
    name: "Syndicates",
    props: ["syndicates"],
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