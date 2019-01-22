<template>
  <section class="section p-0 settings">
    <div class="container">
      <div class="row">

        <!-- settings navigation -->

        <div class="col-lg-3">
          <settings-nav nested></settings-nav>
        </div>

        <!-- /settings navigation -->

        <div class="col-lg-9">
          <!-- row -->
          <div class="row" style="margin-top:-1rem;">

            <!-- profile -->
            <div class="col-lg-4 col-md-6 my-2 my-sm-3" ref="profileImage">
              <tile :url="!!(syndicate || {}).profile_url ? `${syndicate.profile_url}?${date}` : null"
                    :link="`/syndicates/${(syndicate || {}).slug}`"
                     type="display"
                     id="profileImageTile">
              </tile>
            </div>
            <!-- /profile -->

            <!-- stats -->
            <div class="col-lg-8 col-md-6 my-2 my-sm-3" :style="`height:${profileImageHeight}px;`">
              <div class="py-4 h-100" style="border-top: 2px solid #EEEEEE;border-bottom: 2px solid #EEEEEE;`">
                <div class="d-flex justify-content-between align-items-center">
                  <small class="text-uppercase"><i class="fas fa-caret-right mr-2"></i>Monthly profit (projected):</small>
                  <span class="text-success">{{ displayEarningsMonth }}</span>
                </div>
                <div class="d-flex justify-content-between align-items-center">
                  <small class="text-uppercase"><i class="fas fa-caret-right mr-2"></i>Monthly cut (projected):</small>
                  <span class="text-success">{{ displayCutMonth }}</span>
                </div>
                <div class="d-flex justify-content-between align-items-center">
                  <small class="text-uppercase"><i class="fas fa-caret-right mr-2"></i>Total profit:</small>
                  <span class="text-success">{{ displayEarningsTotal }}</span>
                </div>
                <div class="d-flex justify-content-between align-items-center">
                  <small class="text-uppercase"><i class="fas fa-caret-right mr-2"></i>Total cut:</small>
                  <span class="text-success">{{ displayCutTotal }}</span>
                </div>
                <div class="d-flex justify-content-between align-items-center">
                  <small class="text-uppercase"><i class="fas fa-caret-right mr-2"></i>Payment scheme:</small>
                  <span>{{ syndicate.payment_scheme || "Flat" }}</span>
                </div>
                <div class="d-flex justify-content-between align-items-center">
                  <small class="text-uppercase"><i class="fas fa-caret-right mr-2"></i>Subscribers:</small>
                  <span>{{ displaySubscriberCount }}</span>
                </div>
                <div class="d-flex justify-content-between align-items-center">
                  <small class="text-uppercase"><i class="fas fa-caret-right mr-2"></i>Member channels:</small>
                  <span>{{ displayChannelCount }}</span>
                </div>
              </div>
            </div>
            <!-- /stats -->

          </div>
          <!-- /row -->

          <!-- buttons -->
          <div class="d-flex justify-content-center my-3">
            <base-button type="danger" @click="showModal('leave')" class="btn-sm px-4 flex-fill">
              <small>Leave</small>
            </base-button>
            <base-button type="danger" @click="showModal('dissolve')" class="btn-sm px-4 flex-fill">
              <small>Dissolve</small>
            </base-button>
            <base-button type="default" @click="showModal('merge')" class="btn-sm px-4 flex-fill">
              <i class="fas fa-clone" style="font-size:11px;"></i>
              <small>Merge</small>
            </base-button>
            <base-button type="default" @click="showModal('modify')" class="btn-sm px-4 flex-fill">
              <i class="fas fa-edit" style="font-size:11px;"></i>
              <small>Modify</small>
            </base-button>
          </div>
          <!-- /buttons -->

          <div class="d-flex my-5 align-items-center">
            <hr class="flex-fill m-0">
            <h4 class="heading my-0 mx-3 text-muted">Proposals</h4>
            <hr class="flex-fill m-0">
          </div>

          <!-- row -->
          <div v-if="(syndicate.proposals || []).length" class="row">
            <div v-for="proposal in syndicate.proposals" class="col-12">
              <proposal-item :proposal="proposal"
                             :processing="processing.id === proposal.proposal_id ? processing.status : null"
                             :channelCount="syndicate.channels.length || 1"
                             :channel_id="channel_id"
                              v-on:reject="submitVote(proposal.proposal_id, false)"
                              v-on:approve="submitVote(proposal.proposal_id, true)"></proposal-item>
            </div>
          </div>
          <div v-else class="text-center">
            <span>No proposals to display.</span>
          </div>
          <!-- /row -->

        </div>
        <!-- /col-lg-9 -->

      </div>
    </div>

    <!-- modals.modify -->
    <modal :show.sync="modals.modify"
           :item="!!syndicate ? syndicate : {}"
           :new="false" type="proposal"
           @upload="fetchSyndicateSettings()">
    </modal>
    <!-- /modals.modify -->

    <!-- modals.leave -->
    <base-modal :show.sync="modals.leave"
                body-classes="p-0"
                modal-classes="modal-dialog-centered modal-sm">
      <h6 slot="header" class="modal-title" id="modal-title-notification">Leave Syndicate?</h6>
      <card type="secondary" shadow
          header-classes="bg-white pb-5"
          body-classes="p-lg-5"
          class="border-0">

        <template>
          <p>By clicking "Confirm", you will be removed as a member of this syndicate.</p>

          <form @submit="submitLeave">
            <div class="text-center">
              <base-button type="danger" class="w-100" native-type="submit">
                <span>Confirm</span>
<!--                 <span v-if="!busy">{{ confirmSubscriptionButtonText }}</span>
                <i v-if="busy" :class="confirmButtonIconClass"></i> -->
              </base-button>
            </div>
          </form>

        </template>
      </card>
    </base-modal>
    <!-- /modals.leave -->

    <!-- modals.dissolve -->
    <base-modal :show.sync="modals.dissolve"
                body-classes="p-0"
                modal-classes="modal-dialog-centered modal-sm">
      <h6 slot="header" class="modal-title" id="modal-title-notification">Submit Proposal - Dissolve</h6>
      <card type="secondary" shadow
          header-classes="bg-white pb-5"
          body-classes="p-lg-5"
          class="border-0">

        <template>
          <p>By clicking "Confirm", a proposal to dissolve this syndicate will be submitted.</p>

          <form @submit="submitDissolve">
            <div class="text-center">
              <base-button type="danger" class="w-100" native-type="submit">
                <span>Confirm</span>
              </base-button>
            </div>
          </form>

        </template>
      </card>
    </base-modal>
    <!-- /modals.dissolve -->

    <!-- modals.merge -->
    <base-modal :show.sync="modals.merge"
                body-classes="p-0"
                modal-classes="modal-dialog-centered modal-sm">
      <h6 slot="header" class="modal-title" id="modal-title-notification">Submit Proposal - Merge</h6>
      <card type="secondary" shadow
          header-classes="bg-white pb-5"
          body-classes="p-lg-5"
          class="border-0">

        <template>
          <p>By clicking "Confirm", a proposal to merge this syndicate will be submitted.</p>

          <form @submit="submitMerge">
            <div class="text-center">
              <base-button type="default" class="w-100" native-type="submit">
                <span>Confirm</span>
              </base-button>
            </div>
          </form>

        </template>
      </card>
    </base-modal>
    <!-- /modals.merge -->

  </section>
</template>

<script>

import SettingsNav from "@/views/Settings/SettingsNav.vue";
import Modal from "@/components/Modals/Modal.vue";
import BaseModal from "@/components/Base/BaseModal.vue";
import ProposalItem from "@/views/Settings/ProposalItem.vue";
import Tile from "@/components/Tiles/Tile.vue";
import { bus } from "@/globals/bus.js";

export default {
  name: "settings-syndicate-single",
  components: {
    SettingsNav,
    Modal,
    BaseModal,
    ProposalItem,
    Tile
  },

  data () {
    this.fetchSyndicateSettings();
    return {
      syndicate: {},
      channel_id: null,
      modals: {
        modify: false,
        leave: false,
        dissolve: false,
        merge: false
      },
      date: new Date().getTime(),
      processing: {
        id: null,
        status: null
      },
      profileImageHeight: 0
    }
  },  

  mounted() {
    this.handleProfileImageResize();
    window.addEventListener("resize", this.handleProfileImageResize);
  },

  beforeDestroy() {
    window.removeEventListener("resize", this.handleProfileImageResize);
  },

  computed: {

    displayEarningsMonth() {

      // Formatted display for the syndicate's monthly earnings.

      return (typeof this.syndicate.projected_month !== "number")
             ? `--`
             : `$ ${this.syndicate.projected_month}`;
    },

    displayEarningsTotal() {

      // Formatted display for the syndicate's total earnings (all time).

      return (typeof this.syndicate.earnings_total !== "number")
             ? `--`
             : `$ ${this.syndicate.earnings_total}`;
    },

    displayCutMonth() {

      // Formatted display for each channel's monthly cut.

      return (typeof this.syndicate.projected_cut !== "number")
             ? `--`
             : `$ ${this.syndicate.projected_cut}`;
    },

    displayCutTotal() {

      // Formatted display for this channel's total cut (all time).

      return (typeof this.syndicate.earnings_cut !== "number")
             ? `--`
             : `$ ${this.syndicate.earnings_cut}`;
    },

    displaySubscriberCount() {

      // Formatted display for the syndicate's total subscriber count.

      return (typeof this.syndicate.subscriber_count !== "number")
             ? `--`
             : `${this.syndicate.subscriber_count}`;
    },

    displayChannelCount() {

      // Formatted display for the syndicate's total member count.

      return (typeof this.syndicate.channels !== "object")
             ? `--`
             : `${this.syndicate.channels.length}`;
    }
  },

  methods: {

    noop () {},

    showModal(name) {
      this.modals[name] = true;
    },

    fetchSyndicateSettings() {

      const vars = {
        slug: this.$route.params.slug,
        settings: true
      };
      
      const query = `
        query($channel_id: ID!, $slug: String!, $settings: Boolean!) {
          getChannelById(channel_id: $channel_id) {
            channel_id,
            syndicate(slug: $slug, settings: $settings) {
              channels {
                title
              },
              created_at,
              description,
              earnings_total,
              earnings_cut,
              projected_month,
              projected_cut,
              is_nsfw,
              is_unlisted,
              payload_url,
              profile_url,
              slug,
              subscriber_count,
              subscriber_pays,
              subscription_rate,
              syndicate_id,
              title,              
              proposals {
                proposal_id,
                syndicate_id,
                _syndicate_id,
                _channel_id,
                profile_url,
                created_at,
                expires,
                proposal_status,
                action,
                slug,
                title,
                description,
                payload_url,
                is_nsfw,
                is_unlisted,
                subscriber_pays,
                subscription_rate,
                new_profile,
                rejections {
                  channel_id
                },
                approvals {
                  channel_id
                },
                creator {
                  title
                }
              }
            }
          }
        }
      `;

      return this.$http.post("/api/private",
        { query, vars },
        { headers: this.$getHeaders() })
      .then(response => {
        if (response.data.errors) {

          // Error.

          throw new Error(response.data.errors[0].message);
        }

        // Success.

        const { syndicate, channel_id } = response.data.data.getChannelById;
        if (!syndicate) { return this.$router.push("/settings/syndicates"); }

        this.syndicate = syndicate;
        this.channel_id = channel_id;

        this.date = new Date().getTime();
        this.processing.id = this.processing.status = null;
        // this.data.state = "ready";
      });
    },

    submitVote(proposal_id, vote) {
      this.processing.id = proposal_id;
      this.processing.status = (vote === true) ? "approval" : "rejection";
      const data = {
        syndicate_id: this.syndicate.syndicate_id,
        proposal_id: proposal_id,
        vote: vote
      };
      const query = `
        mutation($data: ProposalVoteInput!) {
          submitProposalVote(data: $data) {
            proposal_id,
            slug
          }
        }
      `;
      return this.$http.post("/api/private",
        { query, vars: { data }},
        { headers: this.$getHeaders() })
      .then(response => {
        if (response.data.errors) {
          throw new Error(response.data.errors[0].message);
        }

        // Success.

        const { proposal_id, slug } = response.data.data.submitProposalVote;
        if (slug) { this.$router.push(`/settings/syndicates/${slug}`); }

        this.processing.status = "done";
        this.fetchSyndicateSettings();
      });
    },

    submitLeave(event) {
      event.preventDefault();

      const data = {
        syndicate_id: this.syndicate.syndicate_id
      };
      const query = `
        mutation($data: LeaveSyndicateInput!) {
          leaveSyndicate(data: $data)
        }
      `;
      return this.$http.post("/api/private",
        { query, vars: { data }},
        { headers: this.$getHeaders() })
      .then(response => {
        if (response.data.errors) {

          // Error.

          throw new Error(response.data.errors[0].message);
        }

        // Success.

        this.fetchSyndicateSettings();
      });
    },

    submitDissolve(event) {
      event.preventDefault();

      const data = {
        syndicate_id: this.syndicate.syndicate_id,
        action: "dissolve"
      };
      
      const query = `
        mutation($data: ProposalInput!) {
          createProposal(data: $data) {
            proposal_id
          }
        }
      `;
      
      return this.$http.post("/api/private",
        { query, vars: { data }},
        { headers: this.$getHeaders() })
      .then(response => {
        if (response.data.errors) {

          // Error.

          throw new Error(response.data.errors[0].message);
        }

        // Success.

        this.fetchSyndicateSettings();
      });
    },

    submitMerge(event) {
      event.preventDefault();
      console.log("submitting merge proposal")
    },

    handleProfileImageResize() {
      this.profileImageHeight = document.getElementById("profileImageTile").clientHeight;
    }
  }
};
</script>