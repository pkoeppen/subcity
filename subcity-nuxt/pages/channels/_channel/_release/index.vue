<template>
  <div>
    <md-toolbar class="toolbar" md-elevation="0">
      <div class="container" style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <nuxt-link :to="`/channels/${channel.slug}`">
            <span>&laquo; {{ channel.title }}</span>
          </nuxt-link>
        </div>
        <div style="height: 20px;" v-if="sending">
          <md-progress-spinner :md-diameter="20" :md-stroke="3" md-mode="indeterminate"/>
        </div>
        <md-badge v-else class="badge md-square md-primary" :md-content="`Tier ${release.tier}`" />
      </div>
    </md-toolbar>

    <section class="container" style="margin-top: 16px;">
      <div class="md-layout">
        <div class="md-layout-item md-size-100">
          <md-card class="banner md-elevation-10">
            <md-card-media-cover>
              <md-card-media class="ratio-widescreen">
                <img :src="`${DATA_HOST}/channels/${channel.channel_id}/releases/${release.time_created}/banner.jpeg`" :alt="release.title">
              </md-card-media>
            </md-card-media-cover>
          </md-card>
        </div>
        <div class="md-layout-item md-size-100">
          <div class="title md-display-3 bold-italic">{{ release.title }}</div>
          <div class="description" v-html="release.description.rendered"/>
          <file-embed :payload="release.payload" :download="release.download"/>
        </div>
      </div>

      <template v-if="releases.length">
        <md-divider style="margin-top: 48px;"/>
        <div class="md-title" style="color: #999; margin: 48px 0 32px; text-align: center;">
          <em>More from {{ channel.title }}</em>
        </div>
        <div class="md-layout md-gutter">
          <div v-for="release in releases" :key="release.time_created" :class="{ noclick }" class="card md-layout-item md-size-50">
            <nuxt-link :to="`/channels/${channel.slug}/${release.slug}`">
              <md-card md-with-hover>
                <md-card-media-cover md-solid>
                  <md-card-media class="ratio-widescreen">
                    <img :src="`${DATA_HOST}/channels/${channel.channel_id}/releases/${release.time_created}/banner.jpeg`" :alt="release.title">
                  </md-card-media>
                  <md-card-area>
                    <md-card-header class="release-text">
                      <div class="release-title">
                        <md-badge class="md-square md-primary" :md-content="`Tier ${release.tier}`" />
                        <div class="md-title release-title">{{ release.title }}</div>
                      </div>
                      <md-icon v-if="($store.state.role === 'channel' && $store.state.id === channel.channel_id) || (subscription || {}).tier >= release.tier">lock_open</md-icon>
                      <md-icon v-else>lock</md-icon>
                    </md-card-header>
                  </md-card-area>
                </md-card-media-cover>
              </md-card>
            </nuxt-link>
          </div>
        </div>
      </template>
    </section>
  </div>
</template>

<script>
  import FileEmbed from "~/components/FileEmbed.vue";

  export default {
    components: {
      FileEmbed
    },

    head () {
      return {
        title: `${this.release.title} || ${this.channel.title} || sub.city`,
      }
    },

    data: () => ({
      sending: true,
      subscription: null,
      DATA_HOST: process.env.DATA_HOST
    }),

    created () {
      this.getSubscription();
    },

    asyncData({ $axios, app: { $bus, store }, params, error }) {

      const role = store.state.role;
      const id = store.state.id;

      if (!role) {
        return error({
          data: "Unauthorized",
          status: 403,
          statusText: "Unauthorized",
        });
      }

      const query = `
        query ($slug_channel: String!, $slug_release: String!) {
          getChannelBySlug (slug: $slug_channel) {
            channel_id,
            slug,
            title,

            releases {
              channel_id,
              download (slug: $slug_release),
              description { rendered },
              payload,
              slug,
              tier,
              time_created,
              time_updated,
              title,
            },
          }
        }
      `;

      const vars = {
        slug_channel: params.channel,
        slug_release: params.release,
      };

      return $axios.post("/api/private", { query, vars })
      .then(({ data: { getChannelBySlug: channel }}) => {

        if (role === "channel" && id !== channel.channel_id) {
          return error({
            data: "Unauthorized",
            status: 403,
            statusText: "Unauthorized",
          });
        }

        const release = channel.releases.find(({ slug }) => slug === params.release);
        const releases = channel.releases.filter(({ slug }) => slug !== params.release);

        if (!release) {
          return error({
            data: "Not found",
            status: 404,
            statusText: "Not found",
          });
        }

        return {
          channel,
          release,
          releases,
        };
      }).catch(e => {

        const {
          data,
          status,
          statusText,
        } = e;

        error({
          data,
          status,
          statusText,
        });
      });
    },

    methods: {

      getSubscription () {

        const data = {
          channel_id: this.channel.channel_id,
        };

        this.$store.dispatch("getSubscription", data)
        .then(({ data: { getSubscription: subscription }}) => {
          this.subscription = subscription;
        })
        .catch(error => {
          this.$store.dispatch("error", error);
        })
        .finally(() => {
          this.sending = false;
        });
      },
    },

    computed: {

      noclick () {
        return (this.$store.state.role === 'channel' && this.$store.state.id !== this.channel.channel_id) || 
               (this.subscription && this.subscription.tier < this.release.tier);
      }
    }
  }
</script>

<style lang="scss" scoped>

  .badge {
    color: white !important;
    background-color: #666 !important;
    text-transform: uppercase;
    position: relative;
    width: 40px;
    right: 0;
  }

  .banner {
    margin: 0;
    border-radius: 4px;
    overflow: hidden;
  }

  .card {
    margin: 0 !important;

    .md-card {
      margin: 16px 0 0 !important;
    }

  }

  .container {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
  }

  .description {
    padding: 0 32px 32px;
    line-height: 28px;
    margin: 0 0 16px;
  }

  .noclick {
    pointer-events: none;
  }

  .ratio-widescreen {
    overflow: hidden;

    &:before {
      content: "";
      width: 100%;
      display: block;
      padding-top: 1px / 2.39px * 100%;
    }

    img {
      position: absolute;
      top: 50%;
      right: 0;
      left: 0;
      transform: translateY(-50%);
    }
  }

  .release-text {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    margin: 8px 0;

    .release-title {
      display: flex;
      align-items: center;

      .md-badge {
        color: black;
        background-color: white;
        text-transform: uppercase;
        position: relative;
        width: 40px;
      }

      .release-title {
        margin-left: 16px;
      }
    }

    i {
      color: white !important;
      margin: 0;
    }
  }

  .title {
    text-align: center;
    margin: 48px 0;
  }

  .toolbar {
    width: calc(100% + 32px;);
    position: relative;
    left: -16px;
    padding-left: 16px;
    padding-right: 16px;
  }

</style>
