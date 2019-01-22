<template>
  <section class="container">

    <div class="md-layout md-gutter">

      <div class="md-layout-item md-size-30 md-small-size-100">
        <div class="md-layout md-gutter">

          <!-- profile -->
          <div class="md-layout-item md-size-100 md-small-size-50 md-xsmall-size-100">
            <md-card class="md-elevation-5" style="margin: 0;">
              <md-card-media md-ratio="1:1" style="position: relative;background-color: rgba(0, 0, 0, .26);">
                <img :src="`${DATA_HOST}/channels/${channel.channel_id}/profile.jpeg`" class="image" @error="this.style.display='none'"/>
              </md-card-media>
              <md-card-header style="padding: 16px;">
                <md-card-header-text>
                  <div class="md-title">{{ channel.title }}</div>
                  <div class="md-subhead">https://sub.city/{{ channel.slug }}</div>
                </md-card-header-text>
              </md-card-header>
              <md-card-actions v-if="$store.state.role === 'channel'">
                <md-menu md-size="auto" md-direction="bottom-end" style="flex: 1;">
                  <md-button class="md-primary md-raised" style="width: 100%" md-menu-trigger :disabled="sending || !syndicates.length">Invite</md-button>
                  <md-menu-content>
                    <md-menu-item v-for="syndicate in syndicates" :key="syndicate.syndicate_id" @click="createJoinProposal(syndicate.syndicate_id)">
                      {{ syndicate.title }}
                    </md-menu-item>
                  </md-menu-content>
                </md-menu>
              </md-card-actions>
            </md-card>
          </div>

          <!-- tiers -->
          <div class="tier md-layout-item md-size-100 md-small-size-50 md-xsmall-size-100">
            <md-card class="md-elevation-2" style="height: 100%;">
              <md-card-header>
                <md-card-header-text style="display: flex; justify-content: space-between; align-items: center;">
                  <div class="md-title">
                    {{ channel.tiers._1.title }}
                    <span class="md-caption" style="display: block;">{{ channel.funding === "per_month" ? "Monthly" : "Per Release" }}</span>
                  </div>
                  <div class="md-title rate" v-cents="channel.tiers._1.rate" />
                </md-card-header-text>
              </md-card-header>
              <md-card-content>
                <div v-html="channel.tiers._1.description.rendered" class="description"/>
              </md-card-content>
              <md-card-actions>
                <md-button
                  :class="{ subscribed: (subscription || {}).tier === 1 }"
                  class="md-primary md-raised"
                  @click="confirmSubscription(1)"
                  style="flex: 1"
                  :disabled="sending || !!subscription || $store.state.role === 'channel'">
                    Subscribe{{ (subscription || {}).tier === 1 ? "d" : "" }}
                    <template v-if="(subscription || {}).tier === 1 && (subscription || {}).syndicate_id">
                      via Syndicate
                    </template>
                </md-button>
              </md-card-actions>
            </md-card>
          </div>
          <div class="tier md-layout-item md-size-100 md-small-size-50 md-xsmall-size-100">
            <md-card v-if="channel.tiers._2.active" class="md-elevation-2">
              <md-card-header>
                <md-card-header-text style="display: flex; justify-content: space-between; align-items: center;">
                  <div class="md-title">
                    {{ channel.tiers._2.title }}
                    <span class="md-caption" style="display: block;">{{ channel.funding === "per_month" ? "Monthly" : "Per Release" }}</span>
                  </div>
                  <div class="md-title rate" v-cents="channel.tiers._2.rate" />
                </md-card-header-text>
              </md-card-header>
              <md-card-content>
                <div v-html="channel.tiers._2.description.rendered" class="description"/>
              </md-card-content>
              <md-card-actions>
                <md-button
                  :class="{ subscribed: (subscription || {}).tier === 2 }"
                  class="md-primary md-raised"
                  @click="confirmSubscription(2)"
                  style="flex: 1"
                  :disabled="sending || !!subscription || $store.state.role === 'channel'">
                    Subscribe{{ (subscription || {}).tier === 2 ? "d" : "" }}
                    <template v-if="(subscription || {}).tier === 2 && (subscription || {}).syndicate_id">
                      via Syndicate
                    </template>
                </md-button>
              </md-card-actions>
            </md-card>
          </div>
          <div class="tier md-layout-item md-size-100 md-small-size-50 md-xsmall-size-100">
            <md-card v-if="channel.tiers._3.active" class="md-elevation-2">
              <md-card-header>
                <md-card-header-text style="display: flex; justify-content: space-between; align-items: center;">
                  <div class="md-title">
                    {{ channel.tiers._3.title }}
                    <span class="md-caption" style="display: block;">{{ channel.funding === "per_month" ? "Monthly" : "Per Release" }}</span>
                  </div>
                  <div class="md-title rate" v-cents="channel.tiers._3.rate" />
                </md-card-header-text>
              </md-card-header>
              <md-card-content>
                <div v-html="channel.tiers._3.description.rendered" class="description"/>
              </md-card-content>
              <md-card-actions>
                <md-button
                  :class="{ subscribed: (subscription || {}).tier === 3 }"
                  class="md-primary md-raised"
                  @click="confirmSubscription(3)"
                  style="flex: 1"
                  :disabled="sending || !!subscription || $store.state.role === 'channel'">
                    Subscribe{{ (subscription || {}).tier === 3 ? "d" : "" }}
                    <template v-if="(subscription || {}).tier === 3 && (subscription || {}).syndicate_id">
                      via Syndicate
                    </template>
                </md-button>
              </md-card-actions>
            </md-card>
          </div>
        </div>
      </div>

      <div class="md-layout-item md-size-70 md-medium-size-70 md-small-size-100 content">
        <md-toolbar id="display-title" class="md-transparent" style="padding: 0;" md-elevation="0">
          <span class="md-display-3">{{ channel.title }}</span>
          <div class="md-toolbar-section-end">
            <md-button class="md-primary md-raised md-icon-button" :to="settingsButtonTo" v-if="!sending" :disabled="settingsButtonDisabled">
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
            <div v-html="channel.description.rendered" class="description"></div>
          </div>

          <div v-if="channel.payload" class="md-layout-item md-size-100" style="margin-top: 24px;">
            <file-embed
              :payload="channel.payload"
              :download="`${DATA_HOST}/channels/${channel.channel_id}/payload/${channel.payload}`"
            />
          </div>

          <div class="md-layout-item md-size-66 md-small-size-100" style="margin-top: 32px;">
            <div class="header">Releases</div>
            <md-divider style="margin-top: 16px;"/>

            <!-- TODO: Move this logic elsewhere -->

            <template v-if="channel.releases.length">
              <div v-for="release in channel.releases" :key="release.time_created" :class="{ noclick: ($store.state.role === 'channel' && $store.state.id !== channel.channel_id) || (!!subscription && subscription.tier < release.tier) || (!subscription && !channel.tiers[`_${release.tier}`].active) }" class="release">
                <nuxt-link
                  :to="`/channels/${channel.slug}/${release.slug}`"
                  :event="''"
                  @click.native.prevent="($store.state.role === 'channel' && $store.state.id === channel.channel_id) || (subscription || {}).tier >= release.tier ? go(`/channels/${channel.slug}/${release.slug}`) : confirmSubscription(release.tier)">

                  <md-card md-with-hover>
                    <md-card-media-cover md-solid>
                      <md-card-media class="ratio-widescreen">
                        <img :src="`${DATA_HOST}/channels/${channel.channel_id}/releases/${release.time_created}/banner.jpeg`" :alt="release.title">
                      </md-card-media>
                      <md-card-area>
                        <md-card-header class="release-text">
                          <div class="release-title">
                            <md-badge class="md-square md-primary" :md-content="`Tier ${release.tier}`" />
                            <div class="md-title title">{{ release.title }}</div>
                          </div>
                          <md-icon v-if="($store.state.role === 'channel' && $store.state.id === channel.channel_id) || (subscription || {}).tier >= release.tier">lock_open</md-icon>
                          <md-icon v-else>lock</md-icon>
                        </md-card-header>
                      </md-card-area>
                    </md-card-media-cover>
                  </md-card>
                </nuxt-link>
              </div>
            </template>

            <md-empty-state
              v-else
              md-icon="perm_media"
              md-label="No releases to display"
              md-description="This channel has not published any releases.">
            </md-empty-state>
          </div>

          <div class="md-layout-item md-size-33 md-small-size-100" style="margin-top: 32px;">
            <div class="header">Syndicates</div>
            <md-divider style="margin-top: 16px;"/>
            <div class="syndicates md-layout md-gutter" v-if="channel.syndicates.length">
              <div v-for="syndicate in channel.syndicates" :key="syndicate.syndicate_id" class="syndicate md-layout-item md-size-100 md-small-size-50 md-xsmall-size-100">
                <nuxt-link :to="`/syndicates/${syndicate.slug}`">
                  <md-card md-with-hover>
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

            <md-empty-state
              v-else
              md-icon="group"
              md-label="No syndicates to display"
              md-description="This channel is not a member of any syndicates.">
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

  head () {
    return {
      title: `${this.channel.title} || sub.city`,
    }
  },

  data: () => ({
    DATA_HOST: process.env.DATA_HOST
  }),

  mounted () {
    const role = this.$store.state.role;

    if (role === "subscriber") {
      this.getSubscription();

    } else if (role === "channel" && this.channel.channel_id !== this.$store.state.id) {
      this.getSyndicates();
    }
  },

  asyncData({ $axios, app: { $bus }, params, error }) {

    const query = `
      query ($slug: String!) {
        getChannelBySlug (slug: $slug) {
          channel_id,
          description { rendered },
          funding,
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

          releases {
            slug,
            tier,
            time_created,
            title,
          },

          syndicates {
            syndicate_id,
            slug,
            title,
          }
        }
      }
    `;

    const vars = {
      slug: params.channel
    };

    return $axios.post("/api/public", {
      query, vars
    }).then(({ data: { getChannelBySlug: channel }}) => {
      return {
        channel,
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

    createJoinProposal (syndicate_id) {
      
      const query = `
        mutation ($data: ProposalInput!) {
          createProposal (data: $data) {
            time_created
          }
        }
      `;

      const vars = {
        data: {
          channel_id: this.channel.channel_id,
          syndicate_id,
          type: "join"
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
        channel_id: this.channel.channel_id,
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
      if (!this.channel.tiers[`_${tier}`].active) return;

      this.selectedTier = tier;
      this.confirmSubscriptionDialog = true;
    },

    getSubscription () {
      this.sending = true;

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

    getSyndicates () {
      this.sending = true;

      const query = `
        query {
          getSyndicatesByChannelID {
            syndicate_id,
            title,
            members {
              channel_id,
            }
          }
        }
      `;

      return this.$axios.post("/api/private", { query })
      .then(({ data: { getSyndicatesByChannelID: syndicates }}) => {

        this.syndicates = syndicates.filter(({ members }) => {

          // If channel is not a member of syndicate,
          // include it in the list of inviteable syndicates.

          return !members.find(({ channel_id }) => channel_id === this.channel.channel_id);
        });
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
      const tier = this.channel.tiers['_'+this.selectedTier] || {};
      const title = tier.title;
      const description = (tier.description || {}).rendered;
      const type = this.channel.funding === "per_month" ? "Monthly" : "Per Release";
      const rate = tier.rate / 100;
      const total = (tier.rate + this.extra) / 100;

      return `
        <div style='width: 350px;'>
          <hr class='md-divider md-theme-default'/>
          <div class='md-title' style='text-align: center; text-transform: uppercase; margin-top: 32px;'>${this.channel.title}</div>
          <div class='md-display-2' style='text-align:center; margin: 8px 0 16px;'>${title}</div>
          <p class='description'>${description}</p>
          <hr class='md-divider md-theme-default' style='margin: 32px 0;'/>
          <div style='display: flex; align-items: center;'>
            <div style='width: 40%'>
              <div class="badge md-badge md-square md-theme-default md-primary md-position-top">TIER ${this.selectedTier}</div>
            </div>
            <div style='width: 60%;'>
              <div style='text-align: right;'>Subscription type: <span class='line-item'><strong>${type}</strong></span></div>
              <div style='text-align: right;'>Unit charge: <span class='line-item'><strong>$ ${rate}</strong></span></div>
            </div>
          </div>
        </div>
      `;

      // <div style='text-align: right;'>Total: <span class='line-item'><strong>$ ${total}</strong></span></div>
      // <div style='margin-top: 32px;'>Enter an optional extra contribution:</div>
    },

    settingsButtonDisabled () {
      if (this.$store.state.role === "subscriber") {
        return !this.subscription;
      } else if (this.$store.state.role === "channel") {
        return this.channel.channel_id !== this.$store.state.id;
      }
    },

    settingsButtonTo () {
      if (this.$store.state.role === "subscriber") {
        return "/settings/subscriptions";
      } else if (this.$store.state.role === "channel") {
        return "/settings/channel";
      }
    },
  }
}
</script>

<style lang="scss" scoped>

  .syndicate {
    margin: 0 !important;

    .md-card {
      margin-left: 0;
      margin-right: 0;
      margin-top: 16px;
    }
  }

  .content {
    margin-top: 40px;
  }

  .description {
    line-height: 24px;
  }

  .divider {
    margin: 20px 0 20px;

    @media screen and (min-width: 960px) {
      width: 200vw;
      left: -200%;
      position: relative;
    }
  }

  .release {
    margin: 0 !important;

    .md-card {
      margin-left: 0;
      margin-right: 0;
      margin-top: 16px;
    }
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

      .title {
        margin-left: 16px;
      }
    }

    i {
      color: white !important;
      margin: 0;
    }
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

    .md-card {
      margin: 0;
    }
    margin-left: 0;
    margin-right: 0;
    margin-top: 16px;

    @media screen and (min-width: 960px) {
      &:nth-child(2) {
        margin-top: 24px !important;
      }
    }

    @media screen and (min-width: 600px) {
      margin-top: 16px;
      &:nth-child(2) {
        margin-top: 0;
      }
    }
  }

</style>
