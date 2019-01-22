<template>
  <section class="section p-0">
    
    <!-- container -->
    <div class="container">

          <!-- row -->
          <div class="row">

            <!-- profile image -->
            <div class="col-lg-5" ref="profileColumn">
              <div class="ratio-1-1 position-relative">
                <div v-if="channel.is_nsfw" class="nsfw-pin">
                  <svg viewbox="0 0 100 100">
                    <polygon points="0,0 100,0 100,100"/>
                  </svg>
                  <span>18+</span>
                </div>
                <card class="profile border-0 rounded-0" shadow body-classes="h-100 m-4 p-0 position-relative">
                  
                  <img :src="channel.profile_url"
                  class="img-fluid w-100"
                  v-show="profileImageLoaded"
                  v-on:load="profile.state = 'loaded'"
                  v-on:error="profile.state = 'error'">
                  <content-loader v-if="profile.state === 'loading'"
                  primaryColor="#EEEEEE"
                  secondaryColor="#DDDDDD"
                  :speed=".5"
                  :width="100"
                  :height="100">
                  <rect x="0" y="0" width="100" height="100" />
                </content-loader>
                <div v-else-if="profile.state === 'error'">
                  <div class="d-flex justify-content-center align-items-center position-absolute w-100 h-100">
                    <i class="ni ni-image" style="font-size:4rem;"></i>
                  </div>
                  <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMin" class="img-fluid">
                    <rect x="0" y="0" width="100" height="100" fill="#EEEEEE"/>
                  </svg>
                </div>

              </card>
            </div>
          </div>
          <!-- /profile image -->

          <!-- channel title, description -->
          <div class="col-lg-7 mt-5 mt-lg-0 pl-lg-5" :height="profileHeight">

            <!-- DELETE THIS CSS CLASS <div class="ratio-1-1-lg position-relative"> -->
            <div class="h-100 position-relative">

              <div class="d-flex flex-column">
                <content-loader v-if="content.state === 'loading'"
                                primaryColor="#EEEEEE"
                                secondaryColor="#DDDDDD"
                                :speed=".5"
                                :width="100"
                                :height="82">
                  <rect x="0" y="0" width="100" height="22" />
                  <rect x="0" y="29" width="92" height="5" />
                  <rect x="0" y="39" width="98" height="5" />
                  <rect x="0" y="49" width="94" height="5" />
                  <rect x="0" y="59" width="90" height="5" />
                  <rect x="0" y="69" width="98" height="5" />
                </content-loader>
              </div>

              <div class="h-100 d-flex flex-column justify-content-between">
                <div>
                  <h2 class="display-header display-2 pr-2" style="border-right:2px solid #ced4da;">{{ channel.title }}</h2>
                  <div class="text-muted">
                    <a class="mr-2" href="#">https://maiden.agency</a>
                    <a class="mr-2" href="#">https://foo.bar</a>
                  </div>
                </div>

                

                <p v-html="channel.description" class="block-with-text"></p>

                <div v-show="content.state !== 'loading'">

                  <!-- subscriber buttons -->
                  <div v-if="role !== 'channel'" :class="[{ 'no-click': busy }]" class="d-flex">
                    <base-button @click="showModal('subscribe')"
                                 type="primary"
                                 size="lg"
                                 class="mr-2 flex-fill"
                                 :disabled="subscribeButtonDisabled">
                      <i :class="subscribeButtonIconClass" style="font-size:14px;"></i>
                      <span v-show="!loading">
                        <span>{{ subscribeButtonText }}</span>
                        <span v-show="!channel.is_subscribed" class="text-muted ml-1">${{ channel.subscription_rate / 100 }}</span>
                      </span>
                    </base-button>
                    <base-button @click="showModal('tip')"
                                 type="primary"
                                 size="lg"
                                 class="mt-0 px-5"
                                 :disabled="loading">
                      <div class="position-absolute" style="left: 3px; right: 3px; top: 3px; bottom: 3px; border-radius: 4px; border: 1px solid #687482;"></div>
                      <i :class="tipButtonIconClass" style="font-size:14px;"></i>
                      <span v-show="!loading">Tip</span>
                    </base-button>
                  </div>
                  <!-- /subscriber buttons -->

                  <!-- channel buttons -->
                  <div v-else class="d-flex">
                    <base-button @click="showModal('invite')"
                                 type="primary"
                                 size="lg"
                                 class="flex-fill"
                                 :disabled="syndicateInviteButtonDisabled">
                      <i :class="syndicateInviteButtonIconClass" style="font-size:14px;"></i>
                      <span v-show="!loading">Invite to syndicate</span>
                    </base-button>
                  </div>
                  <!-- /channel buttons -->

                </div>
              </div>

            </div>
          </div>
          <!-- /channel title, description -->

        </div>
        <!-- /row -->

        <div class="row">
          <div class="col-12">

            <div class="d-flex my-5 align-items-center">
              <hr class="flex-fill m-0">
              <h4 class="heading my-0 mx-3 text-muted">Overview</h4>
              <hr class="flex-fill m-0">
            </div>

              <p v-html="channel.overview" class="px-3 text-justify"></p>

          </div>
        </div>

        <div v-if="channel.payload_url" class="row">
          <div class="col-12">

            <div class="d-flex my-5 align-items-center">
              <hr class="flex-fill m-0">
              <h4 class="heading my-0 mx-3 text-muted">Payload</h4>
              <hr class="flex-fill m-0">
            </div>

            <!-- TODO: correct download url -->

            <file-embed :display_url="channel.payload_url"
                        :download_url="`https://s3.amazonaws.com/subcity-bucket-out-dev/channels/1DbsTgA6NFF4hd0H/payload/lannister.jpg`">
            </file-embed>

          </div>
        </div>

        <div class="row">
          <div class="col-12">
            
            <div class="d-flex my-5 align-items-center">
              <hr class="flex-fill m-0">
              <h4 class="heading my-0 mx-3 text-muted">Releases</h4>
              <hr class="flex-fill m-0">
            </div>
            <paginator-release
                v-if="((channel || {}).releases || []).length"
                type="display"
                :releases="(channel || {}).releases || []"
                :channel_slug="(channel || {}).slug || ''"
                :perPage="9">
            </paginator-release>
            <div v-else class="text-center">
              <span>No releases to display.</span>
            </div>

          </div>
        </div>


    </div>
    <!-- /container -->

    <!-- modal.subscribe -->
    <subscribe-modal :show.sync="modal.subscribe" :type="'channel'" :node="channel" @refresh="fetchChannel"></subscribe-modal>
    <!-- /modal.subscribe -->

    <!-- modal.tip -->
    <tip-modal :show.sync="modal.tip" :node="channel"></tip-modal>
    <!-- /modal.tip -->

    <!-- modal.invite -->
    <invite-modal :show.sync="modal.invite" :channel="channel" :syndicates="invitableSyndicates"></invite-modal>
    <!-- /modal.invite -->

  </section>
</template>

<script>

import PaginatorRelease from "@/components/Paginators/PaginatorRelease.vue";
import FileEmbed from "@/components/FileEmbed.vue";
import { ContentLoader } from "vue-content-loader";
import BaseModal from "@/components/Base/BaseModal.vue";
import SubscribeModal from "@/components/Modals/SubscribeModal.vue";
import TipModal from "@/components/Modals/TipModal.vue";
import InviteModal from "@/components/Modals/InviteModal.vue";
import auth from "@/auth/";

export default {

  components: {
    PaginatorRelease,
    FileEmbed,
    ContentLoader,
    BaseModal,
    SubscribeModal,
    TipModal,
    InviteModal
  },

  data() {
    return {
      profile: {
        state: "loading"
      },
      content: {
        state: "loading"
      },
      data: {
        state: "ready"
      },

      // TODO: Delete the above in favor of the below

      state: {
        content: "loading",
        data: "ready",
        profile: "loading",
        ownSyndicates: "ready"
      },

      channel: {
        releases: new Array(9)
      },
      modal: {
        subscribe: false,
        tip: false,
        invite: false
      },
      authenticated: auth.isAuthenticated(),
      role: auth.getRole(),
      invitableSyndicates: []
    }
  },

  mounted() {
    this.fetchChannel().then(() => this.fetchOwnSyndicates());
  },

  watch: {
    "$route": "fetchChannel"
  },

  computed: {

    profileHeight() {
      return (this.$refs.profileColumn || {}).clientHeight;
    },

    profileImageLoaded() {
      return this.profile.state === "loaded";
    },

    // Master State

    loading() {
      return (this.data.state === "loading" ||
              this.content.state === "loading" ||
              this.state.ownSyndicates === "loading");
    },
    success() {
      return (this.data.state === "success");
    },
    error() {
      return (this.data.state === "error" ||
              this.content.state === "error" ||
              this.state.ownSyndicates === "error");
    },
    busy() {
      return (this.loading || this.success || this.error);
    },

    // Subscribe/Tip Buttons

    subscribeButtonText() {
      if (this.channel.is_subscribed) { return "Unsubscribe"; }
      return "Subscribe";
    },

    subscribeButtonIconClass() {
      if (this.loading) { return "fas fa-sync-alt fa-spin"; }
      if (this.channel.is_subscribed) { return "fas fa-step-backward text-danger mr-1"; }
      if (this.role === "channel") { return "fas fa-plus text-success"; }
      return "fas fa-forward text-success mr-1";
    },

    subscribeButtonDisabled() {
      return (this.loading || this.channel.subscribed_through_syndicate);
    },

    tipButtonIconClass() {
      if (this.loading) { return "fas fa-sync-alt fa-spin"; }
      return "fas fa-dollar-sign text-success mr-1 ml-0";
    },

    // Syndicate Invite Button

    syndicateInviteButtonDisabled() {
      return (this.loading || this.invitableSyndicates.length < 1);
    },

    syndicateInviteButtonIconClass() {
      if (this.loading) { return "fas fa-sync-alt fa-spin"; }
      return "fas fa-plus text-success";
    }

  },


  methods: {

    showModal(type) {
      switch(type) {
        case "subscribe":

          // If the user is not logged in, show the login modal with an
          // action redirect that will subscribe them after login.

          if (!this.authenticated) {
            let action = {
              subscribe: `channel:${this.channel.channel_id}`,
              amount: this.channel.subscription_rate,
              title: this.channel.title
            };
            this.$bus.emit("subscribe", action);

          // Otherwise, show the normal subscribe modal.

          } else {
            this.modal.subscribe = true;
          }
          break;

        case "tip":

          // Show the one-time donation modal.

          this.modal.tip = true;
          break;

        case "invite":

          // Show the invite-to-syndicate modal.

          this.modal.invite = true;
          break;
      }
    },

    resetState(success=false) {
      if (success) {

        // Reset input state and reload settings.

        this.data.state      = "ready";
        this.modal.subscribe = false;
        this.modal.tip       = false;
        this.modal.invite    = false;
        this.fetchChannel();

      } else {

        // Reset input state for re-submit.

        this.data.state = "ready";
      }
    },

    fetchChannel() {
      this.data.state = "loading";

      const slug = this.$route.params.slug;

      // If the user is authenticated, add a slot in the query for their
      // role, and send the request to the private API instead of the public.

      const role = this.authenticated && auth.getRole();
      let roleString1 = "";
      let roleString2 = "";

      if (role) {
        roleString1 = `, $${role}_id: ID`;
        roleString2 = `, ${role}_id: $${role}_id`;
      }

      const query = `
        query($slug: String!${roleString1}) {
          getChannelBySlug(slug: $slug${roleString2}) {
            channel_id,
            slug,
            profile_url,
            payload_url,
            description,
            overview,
            title,
            is_nsfw,
            subscription_rate,
            is_subscribed,
            subscribed_through_syndicate,
            releases {
              slug,
              title,
              profile_url
            },
            syndicates {
              syndicate_id,
              title,
              channels {
                channel_id
              }
            }
          }
        }
      `;

      const url = `/api/${role ? "private" : "public"}`;

      return this.$http.post(url,
        { query, vars: { slug }},
        { headers: this.$getHeaders() })
      .then(response => {
        if (response.data.errors) {

          // Error (channel not found).

          throw new Error(response.data.errors[0].message);
          //this.$router.push("/404");
        }

        // Success.

        const channel      = response.data.data.getChannelBySlug;
        this.channel       = channel;
        this.content.state = "loaded";
        this.data.state    = "ready";

      }).catch(error => {        
        console.error(error);
      });
    },

    fetchOwnSyndicates() {

      // If channel is logged in, fetch their syndicates. This is
      // used in conjunction with the "Invite to Syndicate" button.

      if (!this.authenticated || this.role !== "channel") {
        return;
      }

      this.state.ownSyndicates = "loading";

      const query = `
        query($channel_id: ID!) {
          getChannelById(channel_id: $channel_id) {
            syndicates {
              syndicate_id,
              title,
              channels {
                channel_id
              },
              proposals {
                proposal_status,
                action,
                _channel_id
              }
            }
          }
        }
      `;

      this.$http.post("/api/private",
        { query, vars: {} },
        { headers: this.$getHeaders() })
      .then(response => {
        if (response.data.errors) {

          // Error.

          this.state.ownSyndicates = "error";
          throw new Error(response.data.errors[0].message);
        }

        // Success.

        var syndicates = response.data.data.getChannelById.syndicates;

        // Remove syndicates of which the channel being viewed is already a member,
        // or to which the channel has already been invited.

        syndicates = syndicates.filter(({ channels, proposals }) => {

          // These booleans are in reference to the channel
          // currently being viewed (not the one logged in).

          const alreadyMemberOfSyndicate  = (channels.map(({ channel_id }) => channel_id).indexOf(this.channel.channel_id) > -1);
          const alreadyHasInviteProposal = (proposals.filter(({ proposal_status, action, _channel_id }) => {
            return (proposal_status !== "rejected" &&
                    action === "invite" &&
                    _channel_id === this.channel.channel_id)
          }).length > 0);

          return (!alreadyMemberOfSyndicate && !alreadyHasInviteProposal);
        });

        this.invitableSyndicates = syndicates;
        this.state.ownSyndicates = "ready";
      });
    }

  }
};
</script>
