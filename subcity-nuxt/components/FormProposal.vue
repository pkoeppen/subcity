<template>

  <md-card-expand>
    <md-card-actions md-alignment="space-between">
      <div>
        <div style="display:flex;align-items: center;">
          <template v-if="proposal.stage === 'pending'">
            <md-icon style="margin: 0 24px 0 8px;">alarm</md-icon>
            <span class="md-list-item-text">New {{ displayProposalType(proposal.type) }}</span>
          </template>
          <template v-else-if="proposal.stage === 'approved'">
            <md-icon style="margin: 0 24px 0 8px;">play_circle_filled</md-icon>
            <span class="md-list-item-text">Approved {{ displayProposalType(proposal.type) }}</span>
          </template>
          <template v-else-if="proposal.stage === 'rejected'">
            <md-icon style="margin: 0 24px 0 8px;">remove_circle</md-icon>
            <span class="md-list-item-text">Rejected {{ displayProposalType(proposal.type) }}</span>
          </template>
        </div>
      </div>

      <md-card-expand-trigger>
        <md-button class="md-icon-button">
          <md-icon>keyboard_arrow_down</md-icon>
        </md-button>
      </md-card-expand-trigger>
    </md-card-actions>

    <md-card-expand-content>
      <md-card-content style="padding-bottom: 16px;">

        <md-table v-if="proposal.type === 'update'">
          <md-table-row>
            <md-table-head>Attribute</md-table-head>
            <md-table-head>Value</md-table-head>
          </md-table-row>

          <md-table-row v-for="update in filterUpdates(proposal.updates)" :key="update.key">
            <md-table-cell>{{ update.key }}</md-table-cell>
            <md-table-cell>
              <template v-if="update.key === 'Payload File'">
                <a :href="payloadFileDisplay(proposal.time_created, update.value)">Download File</a>
              </template>
              <template v-else-if="update.key === 'Description'">
                <div v-html="update.value.rendered"></div>
              </template>
              <template v-else-if="update.key === 'Profile'">
                <a class="profile-preview md-primary" @click.prevent="showProfilePreview(proposal.time_created)">Show New Profile</a>
              </template>
              <template v-else-if="update.key === 'Tiers'">
                <div v-if="update.value._1" class="tier">
                  <span class="md-caption">Tier 1</span>
                  <div style="padding: 8px 0 0 8px;">
                    <div v-if="update.value._1.active">
                      <md-badge class="md-square md-primary" :md-content="update.value._1.active ? 'ACTIVE' : 'INACTIVE'" style="position: relative; right: 0;width: 56px;"/>
                    </div>
                    <div v-if="update.value._1.title"><em>{{ update.value._1.title }}</em></div>
                    <p v-if="update.value._1.description" v-html="update.value._1.description.rendered"></p>
                    <div v-if="update.value._1.rate" style="color: green;">{{ update.value._1.rate / 100 }}</div>
                  </div>
                </div>
                <div v-if="update.value._2" class="tier">
                  <span class="md-caption">Tier 2</span>
                  <div style="padding: 8px 0 0 8px;">
                    <div v-if="update.value._2.active !== undefined">
                      <md-badge class="md-square md-primary" :md-content="update.value._2.active ? 'ACTIVE' : 'INACTIVE'" style="position: relative; right: 0;width: 56px;"/>
                    </div>
                    <div v-if="update.value._2.title"><em>{{ update.value._2.title }}</em></div>
                    <p v-if="update.value._2.description" v-html="update.value._2.description.rendered"></p>
                    <div v-if="update.value._2.rate" style="color: green;">{{ update.value._2.rate / 100 }}</div>
                  </div>
                </div>
                <div v-if="update.value._3" class="tier">
                  <span class="md-caption">Tier 3</span>
                  <div style="padding: 8px 0 0 8px;">
                    <div v-if="update.value._3.active !== undefined">
                      <md-badge class="md-square md-primary" :md-content="update.value._3.active ? 'ACTIVE' : 'INACTIVE'" style="position: relative; right: 0;width: 56px;"/>
                    </div>
                    <div v-if="update.value._3.title"><em>{{ update.value._3.title }}</em></div>
                    <p v-if="update.value._3.description" v-html="update.value._3.description.rendered"></p>
                    <div v-if="update.value._3.rate" style="color: green;">{{ update.value._3.rate / 100 }}</div>
                  </div>
                </div>
              </template>
              <template v-else>
                {{ update.value }}
              </template>
            </md-table-cell>
          </md-table-row>
        </md-table>

        <div v-else-if="proposal.type === 'join'">
          <div class="title md-title" style="margin: 0 16px 16px;">
            <nuxt-link :to="`/channels/${proposal.channel.slug}`">
              {{ proposal.channel.title }}
            </nuxt-link>
          </div>
          <p style="margin: 0 16px 32px;">If approved, an <em>invitation</em> will be sent to the invited channel for secondary approval. If they approve, their channel will be enrolled as a member of this syndicate.</p>
        </div>

        <div v-else-if="proposal.type === 'slave'">
          <div class="title md-title" style="margin: 0 16px 16px;">
            <template v-if="proposal.slave">
              <nuxt-link :to="`/syndicates/${proposal.slave.slug}`">
                {{ proposal.slave.title }}
              </nuxt-link>
            </template>
            <div class="dissolved" v-else>Dissolved</div>
            <md-icon>arrow_right_alt</md-icon>
            <nuxt-link :to="`/syndicates/${syndicate.syndicate_id}`">
              {{ syndicate.title }}
            </nuxt-link>
          </div>
          <p style="margin: 0 16px 32px;">If approved, a <em>merge request</em> will be sent to the subordinate syndicate for approval. If they approve, this syndicate will absorb the former, incorporating all members and subscriptions of the subordinate syndicate into its own.</p>
        </div>

        <div v-else-if="proposal.type === 'master'">
          <div class="title md-title" style="margin: 0 16px 16px;">
            <nuxt-link :to="`/syndicates/${syndicate.syndicate_id}`">
              {{ syndicate.title }}
            </nuxt-link>
            <md-icon>arrow_right_alt</md-icon>
            <template v-if="proposal.master">
              <nuxt-link :to="`/syndicates/${proposal.master.slug}`">
                {{ proposal.master.title }}
              </nuxt-link>
            </template>
            <div class="dissolved" v-else>Dissolved</div>
          </div>
          <p style="margin: 0 16px 32px;">If approved, this syndicate will be merged into the syndicate that originated the request. All members and subscriptions will be transferred into the latter, ending with the permanent dissolution of the subordinate syndicate.</p>
        </div>

        <div v-else-if="proposal.type === 'dissolve'">
          <p style="margin: 0 16px 32px;">If approved, this syndicate will be <strong>permanently</strong> dissolved. All existing subscriptions will be cancelled, all payouts will stop, and all content will be purged from our servers. Cast your vote with caution.</p>
        </div>

        <md-progress-bar md-mode="buffer" :md-value="getApprovalPercentage(proposal.votes)" :md-buffer="60" style="margin: 16px -16px 0;" />
        <div v-if="!sending" style="display: flex; justify-content: space-between; align-items: center; margin: 16px 0 0;">
          <div style="margin-left: 16px;">
            {{ getApprovalPercentage(proposal.votes) }}% Approval
          </div>
          <div>
            <md-button
              @click="castVote(proposal.time_created, false)"
              style="margin-top: 0; margin-bottom: 0;"
              :disabled="alreadyVoted(proposal.votes)">
                Reject
            </md-button>
            <md-button
              @click="castVote(proposal.time_created, true)"
              style="margin: 0;"
              :disabled="alreadyVoted(proposal.votes)">
                Approve
            </md-button>
          </div>
        </div>
        <div v-else style="min-height: 36px; display: flex; justify-content: center; align-items: center; margin: 16px 0 0;">
          <md-progress-spinner md-diameter="30" md-stroke="3" md-mode="indeterminate"></md-progress-spinner>
        </div>
      </md-card-content>
    </md-card-expand-content>

    <md-dialog-alert
      :md-active.sync="profilePreview"
      :md-content="`<img src='${DATA_HOST}/${profilePreview}' />`"
      md-confirm-text="Close" />
  </md-card-expand>

</template>

<script>
  export default {
    name: "FormProposal",
    props: ["proposal", "syndicate"],

    data: () => ({
      channel_id: null,
      sending: false,
      profilePreview: false,
      DATA_HOST: process.env.DATA_HOST,
    }),

    created () {
      this.channel_id = this.$store.state.id;
    },

    methods: {

      alreadyVoted (votes) {
        for (let i = 0; i < votes.length; i++) {
          if (votes[i].channel_id === this.channel_id) return true;
        }
      },

      castVote(time_created, vote) {
        this.sending = true;

        const data = {
          syndicate_id: this.syndicate.syndicate_id,
          time_created,
          vote
        };

        return this.$store.dispatch("castVote", data)
        .then(() => {
          this.$store.dispatch("success", {
            message: "Vote submitted successfully.",
            status: 200
          });
          this.$router.go({ path: "/settings/syndicates", force: true });
        })
        .catch(error => {
          this.$store.dispatch("error", error);
        })
        .finally(() => {
          this.sending = false;
        });
      },

      displayProposalType (type) {
        switch(type) {
          case "update":
            return "Update Proposal";
          case "join":
            return "Join Proposal";
          case "slave":
            return "Merge Request";
          case "master":
            return "Merge Approval";
          case "dissolve":
            return "Dissolution Proposal";
        }
      },

      filterUpdates (updates) {
        return Object.keys(updates).map(key => {
          if (updates[key]) {

            // If update value is not null.

            const mappings = {
              description: "Description",
              links: "Links",
              new_profile: "Profile",
              payload: "Payload File",
              slug: "Slug",
              tiers: "Tiers",
              title: "Title",
              unlisted: "Unlisted Status"
            };

            return {
              key: mappings[key],
              value: updates[key]
            };
          }
        }).filter(x => x);
      },

      getApprovalPercentage (votes) {
        if (!votes.length) return 0;
        return votes.filter(({ vote }) => vote).length / votes.length * 100;
      },

      payloadFileDisplay (time_created, url) {
        return `${this.DATA_HOST}/syndicates/${this.syndicate.syndicate_id}/proposals/${time_created}/payload/${url}`;
      },

      showProfilePreview (time_created) {
        this.profilePreview = `syndicates/${this.syndicate.syndicate_id}/proposals/${time_created}/profile.jpeg`;
      }
    },
  };
</script>

<style lang="scss" scoped>

  .title {
    display: flex;
    align-items: center;
    justify-content: flex-start;

    .md-icon {
      margin: 0 8px;
    }

    .dissolved {
      color: #666;
      text-transform: uppercase;
      font-size: 12px;
      letter-spacing: 2px;
    }
  }

  .profile-preview {

    &:hover {
      cursor: pointer;
    }
  }

 .tier {
  margin-bottom: 16px;

  &:first-child {
    margin-top: 16px;
  }
 }

</style>
