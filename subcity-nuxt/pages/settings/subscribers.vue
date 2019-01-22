<template>
  <section class="container">

    <div class="md-layout md-gutter">
      <div class="md-layout-item md-size-100">
        <md-table v-model="subscribers" md-sort="time_created" md-sort-order="asc" md-card style="margin: 0;">
          <md-table-toolbar>
            <div style="display: flex; align-items: center;">
              <h1 class="md-title">Subscribers</h1>
              <div style="height: 20px; margin-left: 16px;" v-if="sending">
                <md-progress-spinner class="md-primary" :md-diameter="20" :md-stroke="3" md-mode="indeterminate"/>
              </div>
            </div>
          </md-table-toolbar>

<!--           <md-table-toolbar class="md-primary" slot="md-table-alternate-header" slot-scope="{ count }">
            <div class="md-toolbar-section-start">{{ displaySelected }}</div>
            <div class="md-toolbar-section-end">
              <md-button class="md-icon-button">
                <md-icon>delete</md-icon>
              </md-button>
            </div>
          </md-table-toolbar> -->

          <md-table-row class="md-primary" slot="md-table-row" slot-scope="{ item }">
            <md-table-cell class="md-primary" md-label="Since" md-sort-by="time_created" style="max-width: 110px;">{{ parseDate(item.time_created) }}</md-table-cell>
            <md-table-cell md-label="Alias" md-sort-by="alias">
              {{ item.alias }}
              <span v-if="!item.alias" class="md-caption">No alias given</span>
            </md-table-cell>
            <md-table-cell md-label="Email" md-sort-by="email">{{ item.email }}</md-table-cell>
            <md-table-cell md-label="Tier" md-sort-by="tier">{{ item.tier }}</md-table-cell>
            <md-table-cell md-label="Via">
              <template v-for="node in item.via">
                <md-badge v-if="node === 'direct'" class="md-square md-primary" :md-content="node" style="position: relative; right: 0; margin: 0; width: 40px;" />
                <nuxt-link v-else :to="`/syndicates/${node.slug}`">
                  <div style="margin-top: 4px;">{{ node.title }}</div>
                </nuxt-link>
              </template>
            </md-table-cell>
            <md-table-cell md-label="Address">
              <a v-if="item.address" class="hover" @click.prevent="showAddress(item)">Show Address</a>
              <span v-else class="md-caption">No address given</span>
            </md-table-cell>
          </md-table-row>
        </md-table>
      </div>
    </div>


    <md-empty-state
      v-if="!sending && !subscribers.length"
      md-icon="group"
      md-label="You don't have any subscribers."
      style="margin-top: 60px;">
    </md-empty-state>


    <md-dialog-alert
      :md-active.sync="addressDialog"
      md-title="Shipping address"
      :md-content="addressFormatted"
      @md-closed="addressFormatted = ''"/>

  </section>
</template>

<script>
  export default {
    name: "SettingsSubscribers",

    head () {
      return {
        title: `Subscribers || sub.city`,
      }
    },

    fetch ({ store, redirect }) {
      if (!store.state.role || store.state.role !== 'channel') {
        return redirect('/portal?login=true')
      }
    },

    data: () => ({
      addressDialog: false,
      addressFormatted: "",
      subscribers: [],
      selected: [],
      sending: true,
    }),

    mounted () {

      const query = `
        query {
          getAllSubscriptionsByChannelID {
            channel_id,
            subscription_id,
            subscriber_id,
            syndicate_id,
            tier,
            time_created,

            subscriber {
              subscriber_id,
              address {
                city,
                country,
                first_name,
                last_name,
                line1,
                line2,
                postal_code,
                state,
              },
              alias,
              email,
            },

            syndicate {
              title,
              slug,
            }
          }
        }
      `;

      return this.$axios.post("/api/private", { query })
      .then(({ data: { getAllSubscriptionsByChannelID: subscriptions }}) => {

        // Morph subscriptions into a list of unique subscribers including their
        // maximum tier, minimum time_created, and a list of entry points.

        const subscribers = {};

        subscriptions.map(subscription => {

          const {
            channel_id,
            subscriber_id,
            syndicate_id,
            tier,
            time_created,
            subscriber,
            syndicate,
          } = subscription;

          if (subscribers.hasOwnProperty(subscriber_id)) {
            subscribers[subscriber_id].via.push(channel_id ? "direct" : syndicate);
            subscribers[subscriber_id].tier = Math.max(subscribers[subscriber_id].tier, tier);
            subscribers[subscriber_id].time_created = Math.min(subscribers[subscriber_id].time_created, time_created);

          } else {
            subscribers[subscriber_id] = {
              via: [channel_id ? "direct" : syndicate],
              tier,
              time_created,
              ...subscriber
            }
          }
        });

        // Convert subscribers object to iterable array.

        this.subscribers = Object.keys(subscribers)
        .map(key => subscribers[key])
        .sort((a,b) => (a.time_created < b.time_created));
      })
      .catch(error => this.$store.dispatch("error", error))
      .finally(() => { this.sending = false });
    },

    methods: {

      onSelect (subscribers) {
        this.selected = subscribers;
      },

      parseDate (unix_timestamp) {
        const date = new Date(unix_timestamp);
        return date.toLocaleString("en-US");
      },

      showAddress ({ address, ...subscriber }) {
        this.addressDialog = true;
        this.addressFormatted = `
          <hr class="md-divider" style="background-color: #CCC; margin: 8px 0 24px;"/>
          <div style="display: flex; justify-content: space-between;">
            <div>Name:</div><strong>${address.first_name} ${address.last_name}</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <div>Address${address.line2 ? " 1" : ""}:</div><div>${address.line1}</div>
          </div>
          
          ${address.line2 ? "<div style=\"display: flex; justify-content: space-between;\"><div>Address 2:</div><div>" + address.line2 + "</div></div>" : ""}

          <div style="display: flex; justify-content: space-between;">
            <div>City:</div><div>${address.city}</div>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <div>Postal code:</div><div>${address.postal_code}</div>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <div>State:</div><div>${address.state}</div>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <div>Country:</div><div>${address.country}</div>
          </div>
          <hr class="md-divider" style="background-color: #CCC; margin-top: 24px;"/>
        `;
      }
    },

    computed: {

      displaySelected () {
        if (this.selected.length)
          return `${this.selected.length} subscriber${this.selected.length > 1 ? "s" : ""} selected`;
        else
          return `1 subscriber selected`;
      }
    }
  }
</script>

<style lang="scss" scoped>

  .container {
    max-width: 1200px;
    margin: 0 auto;
  }

  .hover {

    &:hover {
      cursor: pointer;
    }
  }

</style>
