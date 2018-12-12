<template>
  <section class="section p-0">
    
    <!-- container -->
    <div class="container">

          <!-- row -->
          <div class="row">

            <!-- profile image -->
            <div class="col-lg-6" ref="profileColumn">
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
          <div class="col-lg-6 mt-5 mt-lg-0" :height="profileHeight">

            <div class="ratio-1-1-lg position-relative">
              <div class="frame w-100">

                <div class="subframe d-flex flex-column">

                  <content-loader v-if="content.state === 'loading'"
                  primaryColor="#EEEEEE"
                  secondaryColor="#DDDDDD"
                  :speed=".5"
                  :width="100"
                  :height="82">
                    <rect x="0" y="0" width="100" height="22" />
                    <rect x="0" y="27" width="92" height="5" />
                    <rect x="0" y="37" width="98" height="5" />
                    <rect x="0" y="47" width="94" height="5" />
                    <rect x="0" y="57" width="90" height="5" />
                    <rect x="0" y="67" width="98" height="5" />
                    <rect x="0" y="77" width="94" height="5" />
                    <rect x="0" y="87" width="88" height="5" />
                  </content-loader>

                  <h2 class="display-header display-2 pr-2" style="border-right:2px solid #ced4da;">{{ channel.title }}</h2>
                  <p v-html="channel.description" class="block-with-text"></p>
                </div>

                <!-- if role is not channel (subscriber or null) -->
                <div v-if="role !== 'channel'" :class="[{ 'no-click': busy }]" class="subscribe-buttons-container text-uppercase">
                  <base-button @click="showModal('subscribe')"
                               type="primary"
                               size="lg"
                               class="mr-1 flex-fill"
                               style="border-radius: 0 5px 5px 0;"
                               :disabled="subscribeButtonDisabled">
                    <i :class="subscribeButtonIconClass" style="font-size:14px;"></i>
                    <span v-show="!loading">{{ subscribeButtonText }}</span>
                  </base-button>
                  <base-button @click="showModal('onetime')"
                               type="primary"
                               size="lg"
                               class="mt-0 px-5"
                               :disabled="loading">
                    <i :class="onetimeButtonIconClass" style="font-size:14px;"></i>
                    <span v-show="!loading">Once</span>
                  </base-button>
                </div>
                <!-- /if role is not channel -->

                <!-- else if role is channel -->
                <div v-else class="d-flex">
                  <base-button @click="showModal('invite')"
                               type="primary"
                               size="lg"
                               class="flex-fill"
                               style="border-radius: 0 5px 5px 0;"
                               :disabled="syndicateInviteButtonDisabled">
                    <i :class="subscribeButtonIconClass" style="font-size:14px;"></i>
                    <span v-show="!loading">Invite to syndicate</span>
                  </base-button>
                </div>
                <!-- /else if role is channel -->

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
              <h4 class="heading my-0 mx-3 text-muted">Payload</h4>
              <hr class="flex-fill m-0">
            </div>

            <!-- TODO: correct download url -->

            <file-embed v-if="channel.payload_url" :channel_id="channel.channel_id" :display_url="channel.payload_url" :download_url="channel.download_url"></file-embed>

            <div v-else class="text-center">
              <span>No payload to display.</span>
            </div>

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
    <base-modal :show.sync="modal.subscribe"
                 body-classes="p-0"
                 modal-classes="modal-dialog-centered modal-sm">
      <h6 slot="header" class="modal-title" id="modal-title-notification">{{ subscribeModalHeaderText }}</h6>
      <card type="secondary" shadow
          header-classes="bg-white pb-5"
          body-classes="p-lg-5"
          class="border-0">

        <template>

          <h1 class="text-success text-center m-0">$ {{ channel.subscription_rate / 100 }} / mo</h1>
          <div class="text-uppercase text-center">{{ channel.title }}</div>

          <hr>
          <p class="m-0">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
          <hr>

          <form @submit="handleSubscribe" :class="[{ 'no-click': busy }]">

            <!-- TODO: add a message-to-channel field -->

            <div class="text-center">
              <base-button :type="confirmButtonType" class="w-100" native-type="submit" :disabled="loading">
                <span v-if="!busy">{{ confirmSubscriptionButtonText }}</span>
                <i v-if="busy" :class="confirmButtonIconClass"></i>
              </base-button>
            </div>

          </form>

        </template>
      </card>
    </base-modal>
    <!-- /modal.subscribe -->

    <!-- modal.onetime -->
    <base-modal :show.sync="modal.onetime"
                 body-classes="p-0"
                 modal-classes="modal-dialog-centered modal-sm">
      <card type="secondary" shadow
        header-classes="bg-white pb-5"
        body-classes="p-lg-5"
        class="border-0">
                  
        <template>

          <img src="@/assets/img/logo_alpha.svg" class="d-block mx-auto" style="height:44px;width:auto;">

          <hr>

          <!-- onetime-guest -->
          <div v-show="!authenticated">
            <h1 class="text-success text-center">$ {{ onetime.hasFocus ? "--" : onetimeDisplayAmount }}</h1>
            <base-input v-model="onetimeDisplayAmount"
                        @keypress="onlyNumbers"
                        @focus="onetime.hasFocus = true"
                        @blur="onetime.hasFocus = false"
                        alternative
                        class="mb-3"
                        placeholder="Amount"
                        :addon-left-icon="loading ? 'fas fa-sync-alt fa-spin' : 'fas fa-dollar-sign'">
            </base-input>

            <div class="text-uppercase text-center">
              <div>{{ channel.title }}</div>
              <small class="text-muted">One-time donation</small>
            </div>

            <hr>

            <form @submit="handleOnetime" role="form">

              <div class="form-group input-group input-group-alternative">
                <div class="input-group-prepend">
                  <span class="input-group-text" style="font-size: 0.75rem;">
                    <i :class="loading ? 'fas fa-sync-alt fa-spin' : 'fas fa-credit-card'"></i>
                  </span>
                </div>
                <div ref="cardNumberOnetime" style="padding:.9rem 0;"></div>
              </div>

              <div class="d-flex">
                <div class="form-group input-group input-group-alternative mr-3 mb-0">
                  <div ref="cardExpiryOnetime" style="padding:.9rem .75rem;"></div>
                </div>

                <div class="form-group input-group input-group-alternative mb-0">
                  <div ref="cardCvcOnetime" style="padding:.9rem .75rem;"></div>
                </div>
              </div>

              <div class="text-center my-4">
                <base-button :type="confirmButtonType" class="w-100" native-type="submit" :disabled="confirmButtonDisabled">
                  <span v-if="!busy">Confirm</span>
                  <i v-if="busy" :class="confirmButtonIconClass"></i>
                </base-button>
              </div>
            </form>
          </div>
          <!-- /onetime-guest -->

          <!-- onetime-authorized -->
          <div v-show="authenticated">
            authed
          </div>
          <!-- /onetime-authorized -->

          <!-- secured by auth0 -->
          <div class="d-flex mt-4 mt-lg-4 align-items-center">
            <hr class="flex-fill m-0">
            <div class="text-muted text-center text-uppercase mx-2">
              <small><i class="fas fa-fingerprint mr-1" style="font-size:12px;"></i>Secured by <a href="https://auth0.com">Auth0</a></small>
            </div>
            <hr class="flex-fill m-0">
          </div>
          <!-- /secured by auth0 -->

        </template>
      </card>
    </base-modal>
    <!-- /modal.onetime -->

    <!-- modal.invite -->
    <base-modal :show.sync="modal.invite"
                 body-classes="p-0"
                 modal-classes="modal-dialog-centered modal-sm">
        <h6 slot="header" class="modal-title" id="modal-title-notification">{{ inviteModalHeaderText }}</h6>
          <card type="secondary" shadow
            header-classes="bg-white pb-5"
            body-classes="p-lg-5"
            class="border-0">

        <template>

          <form @submit="handleInviteToSyndicate" :class="[{ 'no-click': busy }]">

            <select class="mb-4" v-model="hostSyndicate">
              <option v-for="syndicate in invitableSyndicates"
                      class="dropdown-item"
                      :value="syndicate.syndicate_id">
                {{ syndicate.title }}
              </option>
            </select>

            <div class="text-center">
              <base-button :type="confirmButtonType" class="w-100" native-type="submit" :disabled="loading">
                <span v-if="!busy">Confirm</span>
                <i v-if="busy" :class="confirmButtonIconClass"></i>
              </base-button>
            </div>

          </form>

        </template>
      </card>
    </base-modal>
    <!-- /modal.invite -->

  </section>
</template>

<script>

import PaginatorRelease from "@/components/Paginators/PaginatorRelease.vue";
import FileEmbed from "@/components/FileEmbed.vue";
import { ContentLoader } from "vue-content-loader";
import BaseModal from "@/components/Base/BaseModal.vue";
import auth from "@/auth/";

const classes = {
  base: "form-control",
  invalid: "has-danger"
};

const style = {
  base: {
    color: "#8898aa",
    "::placeholder": {
      color: "#adb5bd"
    }
  },
  invalid: {
    color: "#f2353b"
  }
};

const stripe            = Stripe("pk_test_7yS5dDjXxrthjZg8ninXVLUK");
const elements          = stripe.elements();
const cardNumberOnetime = elements.create("cardNumber", { classes, style });
const cardExpiryOnetime = elements.create("cardExpiry", { classes, style });
const cardCvcOnetime    = elements.create("cardCvc", { classes, style });

export default {

  components: {
    PaginatorRelease,
    FileEmbed,
    ContentLoader,
    BaseModal
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
      channel: {
        releases: new Array(9)
      },
      modal: {
        subscribe: false,
        onetime: false,
        invite: false
      },
      onetime: {
        amount: 25,
        hasFocus: false
      },
      cardNumberValid: false,
      cardExpiryValid: false,
      cardCvcValid: false,
      authenticated: auth.isAuthenticated(),
      role: auth.getRole(),
      invitableSyndicates: [],
      hostSyndicate: null
    }
  },

  mounted() {
    this.fetchChannel().then(() => this.fetchOwnSyndicates());

    cardNumberOnetime.on("change", ({ complete }) => {
      this.cardNumberValid = complete;
    });
    cardExpiryOnetime.on("change", ({ complete }) => {
      this.cardExpiryValid = complete;
    });
    cardCvcOnetime.on("change", ({ complete }) => {
      this.cardCvcValid = complete;
    });

    cardNumberOnetime.mount(this.$refs.cardNumberOnetime);
    cardExpiryOnetime.mount(this.$refs.cardExpiryOnetime);
    cardCvcOnetime.mount(this.$refs.cardCvcOnetime);
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

    // Onetime Input Display

    onetimeDisplayAmount: {
      get() {
        if (this.onetime.hasFocus) {
          return this.onetime.amount ? this.onetime.amount.toString() : "";
        } else {
          return this.onetime.amount.toFixed(2).replace(/(\d)(?=(\d{3})+(?:\.\d+)?$)/g, "$1,");
        }
      },
      set(newValue) {
        this.onetime.amount = parseFloat(newValue.replace(/[^\d\.]/g, ""))
        if (isNaN(newValue)) {
          this.onetime.amount = 0;
        }
      }
    },

    // Subscribe/Onetime Buttons

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

    onetimeButtonIconClass() {
      if (this.loading) { return "fas fa-sync-alt fa-spin"; }
      return "fas fa-dollar-sign text-success mr-1";
    },

    // Subscribe Modal

    subscribeModalHeaderText() {
      return `${this.channel.is_subscribed ? "Cancel " : ""}Subscription - ${this.channel.title}`;
    },

    confirmSubscriptionButtonText() {
      if (this.channel.is_subscribed) { return "Unsubscribe"; }
      return "Confirm";
    },

    // Syndicate Invite Modal

    syndicateInviteButtonDisabled() {
      return (this.loading || this.invitableSyndicates.length < 1);
    },

    inviteModalHeaderText() {
      return `Invitation - ${this.channel.title}`;
    },

    // Confirm Subscribe Button

    confirmButtonDisabled() {
      if (this.busy) { return true; }
      return (!this.cardNumberValid || !this.cardExpiryValid || !this.cardCvcValid);
    },

    confirmButtonType() {
      if (this.success) { return "success"; }
      if (this.error) { return "danger"; }
      return "default";
    },

    confirmButtonIconClass() {
      if (this.loading) { return "fas fa-sync-alt fa-spin"; }
      if (this.success) { return "fas fa-check"; }
      if (this.error) { return "fas fa-exclamation-triangle"; }
      return "d-none";
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

        case "onetime":

          // Show the one-time donation modal.
          // Note: If the user is not logged in, they will not be prompted
          // to do so. TODO: Just collect their onetime payment details. Fin.

          this.modal.onetime = true;
          break;
        case "invite":
          this.modal.invite = true;
          break;
      }
    },

    resetState(success=false) {
      if (success) {

        // Reset input state and reload settings.

        this.data.state = "ready";
        this.modal.subscribe = false;
        this.modal.onetime = false;
        this.modal.invite = false;
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
      });
    },

    handleSubscribe(event) {
      event.preventDefault();
      this.data.state = "loading";

      const data = {
        _channel_id: this.channel.channel_id,
        subscribe: !this.channel.is_subscribed
      };
      const query = `
        mutation($data: ModifySubscriptionInput!) {
          modifySubscription(data: $data)
        }
      `;

      return this.$http.post("/api/private",
        { query, vars: { data }},
        { headers: this.$getHeaders() })
      .then(response => {
        if (response.data.errors) {

          // Error.

          this.data.state = "error";
          setTimeout(() => this.resetState(false), 2000);
          throw new Error(response.data.errors[0].message);
        }

        // Success.

        this.data.state = "success";
        setTimeout(() => this.resetState(true), 2000);
      });
    },

    handleOnetime(event) {
      event.preventDefault();
      console.log("handling onetime")
    },

    handleInviteToSyndicate(event) {
      event.preventDefault();

      const data = {
        syndicate_id: this.hostSyndicate,
        _channel_id: this.channel.channel_id,
        action: "invite"
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

      });
    },

    onlyNumbers(event) {

      // This method only allows numbers to be entered,
      // doing nothing for all other characters.

      const { charCode } = event;
      const { target: { value }} = event;
      const index = value.length - 2;
      if (charCode < 32 || charCode > 46 && charCode < 58) {
        return true;
      } else {
        event.preventDefault();
      }
    }
  }
};
</script>
