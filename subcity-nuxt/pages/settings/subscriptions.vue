<template>
  <section class="container">

    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 32px;">
      <div class="md-display-1" style="font-size: 22px; text-transform: uppercase;">Channels</div>
      <div style="height: 30px;" v-if="sending">
        <md-progress-spinner class="md-primary" :md-diameter="30" :md-stroke="3" md-mode="indeterminate"/>
      </div>
    </div>
    <md-divider style="margin-top: 8px;"/>

    <div v-if="subscriptions.channels.length" class="md-layout md-gutter">
      <div v-for="subscription in subscriptions.channels" :key="subscription.subscription_id" class="md-layout-item md-size-25">
        
          <md-card md-with-hover style="margin: 32px 0;">
            <md-card-media-cover md-solid>
              <nuxt-link :to="`/channels/${subscription.channel.slug}`">
                <md-card-media md-ratio="1:1">
                  <img :src="`${DATA_HOST}/channels/${subscription.channel.channel_id}/profile.jpeg`" :alt="subscription.channel.title">
                </md-card-media>
              </nuxt-link>
              <md-card-area>
                <md-card-header>
                  <span class="md-title">{{ subscription.channel.title }}</span>
                </md-card-header>
                <md-card-actions>
                  <md-button @click="showConfirmDeleteDialog(subscription)">Cancel Subscription</md-button>
                </md-card-actions>
              </md-card-area>
            </md-card-media-cover>
          </md-card>
        
      </div>
    </div>

    <md-empty-state
      v-else
      md-icon="recent_actors"
      md-label="No channels to display">
    </md-empty-state>

    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 32px;">
      <div class="md-display-1" style="font-size: 22px; text-transform: uppercase;">Syndicates</div>
      <div style="height: 30px;" v-if="sending">
        <md-progress-spinner class="md-primary" :md-diameter="30" :md-stroke="3" md-mode="indeterminate"/>
      </div>
    </div>
    <md-divider style="margin-top: 8px;"/>

    <div v-if="subscriptions.syndicates.length" style="margin-top: 32px;">
      <md-card class="syndicate" v-for="subscription in subscriptions.syndicates" :key="subscription.subscription_id">
        <md-card-header style="padding: 32px 32px 0; display: flex; justify-content: space-between; align-items: center;">
          <nuxt-link :to="`/syndicates/${subscription.syndicate.slug}`">
            <div style="font-size: 22px;">{{ subscription.syndicate.title }}</div>
          </nuxt-link>
          <div style="display: flex; align-items: center;">
            <div class="badge md-badge md-square md-theme-default md-position-top">{{ subscription.syndicate.members.length }} MEMBERS</div>
            <div class="badge md-badge md-square md-theme-default md-primary md-position-top">TIER {{ subscription.tier }}</div>
            <md-icon>lock_open</md-icon>
          </div>
        </md-card-header>
        <div class="channels md-layout">
          <div v-for="channel in subscription.syndicate.members" :key="channel.channel_id" class="md-layout-item md-size-25">
            <nuxt-link :to="`/channels/${channel.slug}`">
              <md-card md-with-hover>
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
        <md-card-actions>
          <md-button class="md-primary" @click="showConfirmDeleteDialog(subscription)">Cancel Subscription</md-button>
        </md-card-actions>
      </md-card>
    </div>

    <md-empty-state
      v-else
      md-icon="group"
      md-label="No syndicates to display">
    </md-empty-state>

    <md-dialog :md-active.sync="confirmDeleteDialog">
      <md-dialog-title>Confirm cancellation</md-dialog-title>

      <md-dialog-content style="max-width: 400px;">
        You are about to <strong>permanently</strong> delete your subscription to <nuxt-link :to="selected.channel ? `/channels/${selected.channel.slug}` : `/syndicates/${selected.syndicate.slug}`">{{ (selected.channel || selected.syndicate).title }}</nuxt-link>.
        <br><br>  
        If you resubscribe, you will be charged the full subscription rate without proration. Are you sure you wish to proceed?
      </md-dialog-content>

      <md-dialog-actions>
        <md-button class="" @click="confirmDeleteDialog = false">Keep Subscription</md-button>
        <md-button class="md-primary" @click="deleteSubscription()">Cancel Subscription</md-button>
      </md-dialog-actions>
    </md-dialog>

  </section>
</template>

<script>
  export default {
    name: "SettingsSubscriptions",

    head () {
      return {
        title: `Subscriptions || sub.city`,
      }
    },

    fetch ({ store, redirect }) {
      if (!store.state.role || store.state.role !== 'subscriber') {
        return redirect('/portal?login=true')
      }
    },

    data: () => ({
      confirmDeleteDialog: false,
      confirmDeleteDialogContent: "",
      subscriptions: {
        channels: [],
        syndicates: [],
      },
      selected: {
        channel: {},
        syndicate: {},
      },
      sending: true,
      DATA_HOST: process.env.DATA_HOST,
    }),

    mounted () {

      const query = `
        query {
          getSubscriptionsBySubscriberID {
            channel_id,
            subscription_id,
            subscriber_id,
            syndicate_id,
            tier,
            time_created,

            channel {
              channel_id,
              title,
              slug,
            },

            syndicate {
              syndicate_id,
              title,
              slug,

              members {
                channel_id,
                title,
                slug,
              }
            }
          }
        }
      `;

      return this.$axios.post("/api/private", { query })
      .then(({ data: { getSubscriptionsBySubscriberID: subscriptions }}) => {
        this.subscriptions.channels = subscriptions.filter(({ channel }) => !!channel);
        this.subscriptions.syndicates = subscriptions.filter(({ syndicate }) => !!syndicate);
      })
      .catch(error => this.$store.dispatch("error", error))
      .finally(() => { this.sending = false });
    },

    methods: {

      deleteSubscription () {
        this.confirmDeleteDialog = false;
        this.sending = true;

        const query = `
          mutation ($subscription_id: ID!) {
            deleteSubscription (subscription_id: $subscription_id)
          }
        `;

        const vars = {
          subscription_id: this.selected.subscription_id
        };

        return this.$axios.post("/api/private", { query, vars })
        .then(() => {
          this.$store.dispatch("success", {
            message: "Subscription cancelled successfully.",
            status: 200
          });
        })
        .catch(error => this.$store.dispatch("error", error))
        .finally(() => { this.sending = false });
      },

      showConfirmDeleteDialog (subscription) {
        this.selected = subscription;
        this.confirmDeleteDialog = true;
      },

    },
  }
</script>

<style lang="scss" scoped>

  .badge {
    position: relative;
    right: 0;
    min-width: 50px;
    margin-right: 16px;
  }

  .channels {
    padding: 32px 32px 0;
    margin-right: -16px;

    .md-layout-item {
      
      // padding-left: 16px;
      // padding-right: 16px;

      .md-card {
        margin: 0 16px 16px 0;
      }
    }

    .md-card-actions {
      padding: 0 32px 16px;
    }
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
  }

  .hover {

    &:hover {
      cursor: pointer;
    }
  }

  .syndicate {
    margin: 0 0 32px;
  }

</style>
