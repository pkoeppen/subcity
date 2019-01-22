<template>
  <section class="section p-0">
    
    <!-- container -->
    <div class="container">

          <!-- row -->
          <div class="row">

            <!-- profile image -->
            <div class="col-lg-5" ref="profileColumn">
              <div class="ratio-1-1 position-relative">
                <div v-if="syndicate.is_nsfw" class="nsfw-pin">
                  <svg viewbox="0 0 100 100">
                    <polygon points="0,0 100,0 100,100"/>
                  </svg>
                  <span>18+</span>
                </div>
                <card class="profile border-0 rounded-0" shadow body-classes="h-100 m-4 p-0 position-relative">
                  
                  <img :src="syndicate.profile_url"
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
                  <h2 class="display-header display-2 pr-2" style="border-right:2px solid #ced4da;">{{ syndicate.title }}</h2>
                  <div class="text-muted">
                    <a class="mr-2" href="#">https://maiden.agency</a>
                    <a class="mr-2" href="#">https://foo.bar</a>
                  </div>
                </div>

                

                <p v-html="syndicate.description" class="block-with-text"></p>

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
                        <span v-show="!syndicate.is_subscribed" class="text-muted ml-1">${{ syndicate.subscription_rate / 100 }}</span>
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

                  <!-- syndicate buttons -->
                  <div v-else class="d-flex">
                    <base-button @click="showModal('tip')"
                                 type="primary"
                                 size="lg"
                                 class="flex-fill"
                                 :disabled="syndicateInviteButtonDisabled">
                      <i :class="syndicateInviteButtonIconClass" style="font-size:14px;"></i>
                      <span v-show="!loading">Invite to syndicate</span>
                    </base-button>
                  </div>
                  <!-- /syndicate buttons -->

                </div>
              </div>

            </div>
          </div>
          <!-- /syndicate title, description -->

        </div>
        <!-- /row -->

        <div class="row">
          <div class="col-12">

            <div class="d-flex my-5 align-items-center">
              <hr class="flex-fill m-0">
              <h4 class="heading my-0 mx-3 text-muted">Payload</h4>
              <hr class="flex-fill m-0">
            </div>

            <!-- TODO: Fix download_url -->

            <file-embed :display_url="syndicate.payload_url"
                        :download_url="`https://s3.amazonaws.com/subcity-bucket-out-dev/channels/1DbsTgA6NFF4hd0H/payload/lannister.jpg`">
            </file-embed>

          </div>
        </div>

        <div class="row">
          <div class="col-12">
            
            <div class="d-flex my-5 align-items-center">
              <hr class="flex-fill m-0">
              <h4 class="heading my-0 mx-3 text-muted">Channels</h4>
              <hr class="flex-fill m-0">
            </div>

            <paginator-channel
              v-if="((syndicate || {}).channels || []).length">  
            </paginator-channel>

            <div v-else class="text-center">
              <span>No channels to display.</span>
            </div>

          </div>
        </div>

    </div>
    <!-- /container -->

    <!-- modal.subscribe -->
    <subscribe-modal :show.sync="modal.subscribe" :type="'syndicate'" :node="syndicate" @refresh="fetchSyndicate"></subscribe-modal>
    <!-- /modal.subscribe -->

    <!-- modal.tip -->
    <tip-modal :show.sync="modal.tip" :node="syndicate"></tip-modal>
    <!-- /modal.tip -->

    <!-- modal.merge -->
    <merge-modal :show.sync="modal.merge" :syndicate="syndicate" :syndicates="mergeableSyndicates"></merge-modal>
    <!-- /modal.merge -->

  </section>
</template>

<script>

import PaginatorChannel from "@/components/Paginators/PaginatorChannel.vue";
import FileEmbed from "@/components/FileEmbed.vue";
import { ContentLoader } from "vue-content-loader";
import BaseModal from "@/components/Base/BaseModal.vue";
import SubscribeModal from "@/components/Modals/SubscribeModal.vue";
import TipModal from "@/components/Modals/TipModal.vue";
import MergeModal from "@/components/Modals/MergeModal.vue";
import auth from "@/auth/";

export default {

  components: {
    PaginatorChannel,
    FileEmbed,
    ContentLoader,
    BaseModal,
    SubscribeModal,
    TipModal,
    MergeModal
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
      syndicate: {
        releases: new Array(9)
      },
      modal: {
        subscribe: false,
        tip: false,
        merge: false
      },
      authenticated: auth.isAuthenticated(),
      role: auth.getRole(),
      mergeableSyndicates: []
    }
  },

  mounted() {
    this.fetchSyndicate().then(() => this.fetchOwnSyndicates());
  },

  watch: {
    "$route": "fetchSyndicate"
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
              this.content.state === "loading");
    },

    success() {
      return (this.data.state === "success");
    },

    error() {
      return (this.data.state === "error" ||
              this.content.state === "error");
    },

    busy() {
      return (this.loading || this.success || this.error);
    },

    // Subscribe/Tip Buttons

    subscribeButtonText() {
      if (this.syndicate.is_subscribed) { return "Unsubscribe"; }
      return "Subscribe";
    },

    subscribeButtonIconClass() {
      if (this.loading) { return "fas fa-sync-alt fa-spin"; }
      if (this.syndicate.is_subscribed) { return "fas fa-step-backward text-danger mr-1"; }
      if (this.role === "channel") { return "fas fa-plus text-success"; }
      return "fas fa-forward text-success mr-1";
    },

    subscribeButtonDisabled() {
      return (this.loading);
    },

    tipButtonIconClass() {
      if (this.loading) { return "fas fa-sync-alt fa-spin"; }
      return "fas fa-dollar-sign text-success mr-1 ml-0";
    },

    // Syndicate Merge Modal

    syndicateMergeButtonDisabled() {
      return this.mergeableSyndicates.length < 1;
    },

    mergeModalHeaderText() {
      return `Merge Request - ${this.syndicate.title}`;
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
              subscribe: `syndicate:${this.syndicate.syndicate_id}`,
              amount: this.syndicate.subscription_rate,
              title: this.syndicate.title
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

        case "merge":

          // Show the merge invite modal.

          this.modal.merge = true;
          break;
      }
    },

    resetState(success=false) {
      if (success) {

        // Reset input state and reload settings.

        this.data.state      = "ready";
        this.modal.subscribe = false;
        this.modal.tip       = false;
        this.modal.merge     = false;
        this.fetchSyndicate();

      } else {

        // Reset input state for re-submit.

        this.data.state = "ready";
      }
    },

    fetchSyndicate() {
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
          getSyndicateBySlug(slug: $slug${roleString2}) {
            syndicate_id,
            slug,
            profile_url,
            payload_url,
            description,
            title,
            is_nsfw,
            subscription_rate,
            is_subscribed,
            channels {
              channel_id,
              title,
              profile_url
            }
          }
        }
      `;

      const url = `/api/${role ? "private" : "public"}`
      return this.$http.post(url,
        { query, vars: { slug }},
        { headers: this.$getHeaders() })
      .then(response => {
        if (response.data.errors) {

          // Error.

          throw new Error(response.data.errors[0].message);
          //this.$router.push("/404");
        }

        // Success.

        const syndicate    = response.data.data.getSyndicateBySlug;
        this.syndicate     = syndicate;
        this.content.state = "loaded";
        this.data.state    = "ready";

      }).catch(error => {        
        console.error(error);
      });
    },

    fetchOwnSyndicates() {

      // If channel is logged in, fetch their syndicates. This is
      // used in conjunction with the "Merge With Syndicate" button.

      if (!this.authenticated || this.role !== "channel") {
        return;
      }

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
                _syndicate_id
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

          throw new Error(response.data.errors[0].message);
        }

        // Success.

        var syndicates = response.data.data.getChannelById.syndicates;

        // Remove this syndicate (the one being viewed) as well as any that
        // already contain a merge proposal from the list of mergeable syndicates.

        syndicates = syndicates.filter(({ syndicate_id, proposals }) => {

          const isSelf = (syndicate_id === this.syndicate.syndicate_id);
          const alreadyHasMergeProposal = (proposals.filter(({ proposal_status, action, _syndicate_id }) => {
            return (proposal_status !== "rejected" &&
                    action === "merge" &&
                    _syndicate_id === this.syndicate.syndicate_id)
          }).length > 0);

          return (!isSelf && !alreadyHasMergeProposal);
        });

        this.mergeableSyndicates = syndicates;
      });
    }

  }
};
</script>
