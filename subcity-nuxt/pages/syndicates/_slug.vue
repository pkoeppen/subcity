<template>
  <section class="container" style="margin-bottom: 40px;">

    <div class="md-layout md-gutter">

      <div class="md-layout-item md-size-30 md-medium-size-30 md-small-size-100">
        <div class="md-layout md-gutter">

          <div class="md-layout-item md-size-100">
            <md-card class="md-elevation-5" style="margin: 0;">
              <md-card-media md-ratio="1:1" style="position: relative;background-color: rgba(0, 0, 0, .26);">
                <img :src="`${DATA_HOST}/syndicates/${syndicate.syndicate_id}/profile.jpeg`" class="image" @error="this.style.display='none'"/>
              </md-card-media>
              <md-card-header style="padding: 16px;">
                <md-card-header-text>
                  <div class="md-title">{{ syndicate.title }}</div>
                  <div class="md-subhead">https://sub.city/{{ syndicate.slug }}</div>
                </md-card-header-text>
              </md-card-header>
              <md-card-actions v-if="$store.state.role === 'channel'">
                <md-menu md-size="auto" md-direction="bottom-end" style="flex: 1;">
                  <md-button class="md-primary md-raised" style="width: 100%" md-menu-trigger :disabled="sending || !syndicates.length">Merge</md-button>

                  <md-menu-content>
                    <md-menu-item v-for="syndicate in syndicates" :key="syndicate.syndicate_id" @click="createMergeProposal(syndicate.syndicate_id)">
                      {{ syndicate.title }}
                    </md-menu-item>
                  </md-menu-content>
                </md-menu>
              </md-card-actions>
            </md-card>
          </div>

          <div class="md-layout-item md-size-100">
            <md-card class="tier md-elevation-2">
              <md-card-header>
                <md-card-header-text style="display: flex; justify-content: space-between; align-items: center;">
                  <div class="md-title">
                    {{ syndicate.tiers._1.title }}
                    <span class="md-caption" style="display: block;">Monthly</span>
                  </div>
                  <div class="md-title rate" v-cents="syndicate.tiers._1.rate" />
                </md-card-header-text>
              </md-card-header>
              <md-card-content>
                <div v-html="syndicate.tiers._1.description.rendered" class="description"/>
              </md-card-content>
              <md-card-actions>
                <md-button
                  :class="{ subscribed: (subscription || {}).tier === 1 }"
                  class="md-primary md-raised"
                  @click="confirmSubscription(1)"
                  style="flex: 1"
                  :disabled="sending || !!subscription || $store.state.role === 'channel'">
                    Subscribe{{ (subscription || {}).tier === 1 ? "d" : "" }}
                </md-button>
              </md-card-actions>
            </md-card>

            <md-card v-if="syndicate.tiers._2.active" class="tier md-elevation-2">
              <md-card-header>
                <md-card-header-text style="display: flex; justify-content: space-between; align-items: center;">
                  <div class="md-title">
                    {{ syndicate.tiers._2.title }}
                    <span class="md-caption" style="display: block;">Monthly</span>
                  </div>
                  <div class="md-title rate" v-cents="syndicate.tiers._2.rate" />
                </md-card-header-text>
              </md-card-header>
              <md-card-content>
                <div v-html="syndicate.tiers._2.description.rendered" class="description"/>
              </md-card-content>
              <md-card-actions>
                <md-button
                  :class="{ subscribed: (subscription || {}).tier === 2 }"
                  class="md-primary md-raised"
                  @click="confirmSubscription(2)"
                  style="flex: 1"
                  :disabled="sending || !!subscription || $store.state.role === 'channel'">
                    Subscribe{{ (subscription || {}).tier === 2 ? "d" : "" }}
                </md-button>
              </md-card-actions>
            </md-card>

            <md-card v-if="syndicate.tiers._3.active" class="tier md-elevation-2">
              <md-card-header>
                <md-card-header-text style="display: flex; justify-content: space-between; align-items: center;">
                  <div class="md-title">
                    {{ syndicate.tiers._3.title }}
                    <span class="md-caption" style="display: block;">Monthly</span>
                  </div>
                  <div class="md-title rate" v-cents="syndicate.tiers._3.rate" />
                </md-card-header-text>
              </md-card-header>
              <md-card-content>
                <div v-html="syndicate.tiers._3.description.rendered" class="description"/>
              </md-card-content>
              <md-card-actions>
                <md-button
                  :class="{ subscribed: (subscription || {}).tier === 3 }"
                  class="md-primary md-raised"
                  @click="confirmSubscription(3)"
                  style="flex: 1"
                  :disabled="sending || !!subscription || $store.state.role === 'channel'">
                    Subscribe{{ (subscription || {}).tier === 3 ? "d" : "" }}
                </md-button>
              </md-card-actions>
            </md-card>
          </div>
        </div>
      </div>

      <div class="md-layout-item md-size-70 md-medium-size-70 md-small-size-100 content">
        <md-toolbar id="display-title" class="md-transparent" style="padding: 0;" md-elevation="0">
          <span class="md-display-3">{{ syndicate.title }}</span>
          <div class="md-toolbar-section-end">
            <md-button class="md-primary md-raised md-icon-button" to="/settings/subscriptions" v-if="!sending" :disabled="!subscription">
              <md-icon>settings</md-icon>
            </md-button>
            <div style="height: 30px; margin-left: 16px;" v-else>
              <md-progress-spinner class="md-primary" :md-diameter="30" :md-stroke="3" md-mode="indeterminate"/>
            </div>
          </div>
        </md-toolbar>
        <md-divider class="divider"/>
        <div class="md-layout md-gutter">

          <div class="md-layout-item md-size-100">
            <div v-html="syndicate.description.rendered" class="description"></div>
          </div>

          <div v-if="syndicate.payload" class="md-layout-item md-size-100" style="margin-top: 24px;">
            <file-embed
              :payload="syndicate.payload"
              :download="`${DATA_HOST}/syndicates/${syndicate.syndicate_id}/payload/${syndicate.payload}`"
            />
          </div>

          <div class="md-layout-item md-size-100" style="margin-top: 32px;">
            <div class="header">Channels</div>
            <md-divider style="margin-top: 16px;"/>
            <div v-if="syndicate.members.length" class="channels md-layout md-gutter">
              <div class="md-layout-item md-size-33 md-xsmall-size-100 md-small-size-50" v-for="channel in syndicate.members" :key="channel.channel_id">
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

            <md-empty-state
              v-else
              md-icon="recent_actors"
              md-label="No channels to display"
              md-description="This syndicate has no member channels. This is actually impossible, and this message should never be shown.">
            </md-empty-state>
          </div>
        </div>
      </div>
    </div>

    <md-dialog-confirm
      :md-active.sync="confirmSubscriptionDialog"
      md-title="Confirm subscription"
      :md-content="confirmSubscriptionDialogContent"
      md-confirm-text="Confirm"
      md-cancel-text="Cancel"
      @md-confirm="createSubscription" />
  </section>
</template>

<script>
  import FileEmbed from "~/components/FileEmbed.vue";

export default {
  name: "Channel",
  components: {
    FileEmbed,
  },

  mounted () {
    const role = this.$store.state.role;

    if (role === "subscriber") {
      this.getSubscription();

    } else if (role === "channel") {
      this.getSyndicates();
    }
  },

  data: () => ({
    DATA_HOST: process.env.DATA_HOST
  }),

  asyncData({ $axios, app: { $bus }, params, error }) {

    const query = `
      query ($slug: String!) {
        getSyndicateBySlug (slug: $slug) {
          syndicate_id,
          description { rendered },
          links {
            discord,
            facebook,
            instagram,
            twitch,
            twitter,
            youtube,
          },
          payload,
          slug,
          tiers {
            _1 {
              active,
              title,
              description { rendered },
              rate
            },
            _2 {
              active,
              title,
              description { rendered },
              rate
            },
            _3 {
              active,
              title,
              description { rendered },
              rate
            },
          },
          title,
          unlisted,

          members {
            channel_id,
            slug,
            title,
          }
        }
      }
    `;

    const vars = {
      slug: params.slug
    };

    return $axios.post("/api/public", {
      query, vars
    }).then(({ data: { getSyndicateBySlug: syndicate }}) => {
      return {
        syndicate,
        confirmSubscriptionDialog: false,
        extra: 0,
        selectedTier: null,
        sending: false,
        subscription: null,
        syndicates: [],
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

    createMergeProposal (syndicate_id) {

      const query = `
        mutation ($data: ProposalInput!) {
          createProposal (data: $data) {
            time_created
          }
        }
      `;

      const vars = {
        data: {
          slave_id: this.syndicate.syndicate_id,
          syndicate_id,
          type: "slave"
        }
      };

      this.$axios.post("/api/private", { query, vars })
      .then(() => {
        this.$store.dispatch("success", {
          message: "Proposal submitted successfully.",
          status: 200
        });
      })
      .catch(error => {
        this.$store.dispatch("error", error);
      })
      .finally(() => {
        this.sending = false;
      });
    },

    createSubscription () {
      this.sending = true;

      const data = {
        syndicate_id: this.syndicate.syndicate_id,
        extra: this.extra,
        tier: this.selectedTier,
      };

      this.$store.dispatch("createSubscription", data)
      .then(({ data: { createSubscription: subscription }}) => {
        this.subscription = subscription;
        this.$store.dispatch("success", {
          message: "Subscribed successfully.",
          status: 200
        });
      })
      .catch(error => {
        this.$store.dispatch("error", error);
      })
      .finally(() => {
        this.sending = false;
      });
    },

    confirmSubscription (tier) {
      if (!this.syndicate.tiers[`_${tier}`].active) return;

      this.selectedTier = tier;
      this.confirmSubscriptionDialog = true;
    },

    getSubscription () {
      this.sending = true;

      const data = {
        syndicate_id: this.syndicate.syndicate_id,
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

    getSyndicates () {
      this.sending = true;

      const query = `
        query {
          getSyndicatesByChannelID {
            syndicate_id,
            title,
          }
        }
      `;

      return this.$axios.post("/api/private", { query })
      .then(({ data: { getSyndicatesByChannelID: syndicates }}) => {
        this.syndicates = syndicates.filter(({ syndicate_id }) => syndicate_id !== this.syndicate.syndicate_id);;
      })
      .catch(error => {
        this.$store.dispatch("error", error);
      })
      .finally(() => {
        this.sending = false;
      });
    },

    go (path) {
      this.$router.push({ path });
    },
  },

  computed: {

    confirmSubscriptionDialogContent () {
      const tier = this.syndicate.tiers['_'+this.selectedTier] || {};
      const title = tier.title;
      const description = (tier.description || {}).rendered;
      const rate = tier.rate / 100;
      const total = (tier.rate + this.extra) / 100;

      return `
        <div style='width: 350px;'>
          <hr class='md-divider md-theme-default'/>
          <div class='md-title' style='text-align: center; text-transform: uppercase; margin-top: 32px;'>${this.syndicate.title}</div>
          <div class='md-display-2' style='text-align:center; margin: 8px 0 16px;'>${title}</div>
          <p class='description'>${description}</p>
          <hr class='md-divider md-theme-default' style='margin: 32px 0;'/>
          <div style='display: flex; align-items: center;'>
            <div style='width: 40%'>
              <div class="badge md-badge md-square md-theme-default md-primary md-position-top">TIER ${this.selectedTier}</div>
            </div>
            <div style='width: 60%;'>
              <div style='text-align: right;'>Subscription type: <span class='line-item'><strong>Monthly</strong></span></div>
              <div style='text-align: right;'>Unit charge: <span class='line-item'><strong>$ ${rate}</strong></span></div>
            </div>
          </div>
        </div>
      `;

      // <div style='text-align: right;'>Total: <span class='line-item'><strong>$ ${total}</strong></span></div>
      // <div style='margin-top: 32px;'>Enter an optional extra contribution:</div>
    }
  }
}
</script>

<style lang="scss">

  .md-dialog-content {

    .badge {
      position: relative;
      right: 0;
      width: 50px;
      margin: 0 auto;
    }

    .line-item {
      min-width: 90px;
      display: inline-block;
      letter-spacing: initial;
      font-size: 16px;
    }

    // &:nth-child(2) {
    //   padding-bottom: 0;
    // }

    &:nth-child(3) {
      
      .md-field {
        margin: 0;
        padding: 0;

        &:after {
          top: 32px;
        }
      }
    }
  }
</style>

<style lang="scss" scoped>

  .channels {
    margin-left: -16px;
    margin-right: -16px;

    .md-layout-item {
      padding-left: 16px;
      padding-right: 16px;
    }
  }

  .card {
    margin: 32px 0 0 !important;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
  }

  .content {
    margin-top: 40px;
  }

  .description {
    line-height: 24px;
  }

  .divider {
    width: 200vw;
    margin: 20px 0 20px;
    left: -200%;
    position: relative;
  }

  .header {
    font-size: 26px;
    color: #666;
    line-height: 26px;
    margin-bottom: 8px;
  }

  .noclick {
    pointer-events: none;
  }

  .rate {
    color: #00c853;
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

  .subscribed {
    color: white !important;
    background-color: #44ce7d !important;
  }

  .tier {
    margin: 24px 0;

    &:first-child {
      margin-top: 32px;
    }
  }

</style>
