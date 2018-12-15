<template>

  <base-modal :show="show"
              @close="close"
               body-classes="p-0"
               modal-classes="modal-dialog-centered modal-sm">
    <card type="secondary" shadow
          header-classes="bg-white pb-5"
          body-classes="p-lg-5"
          class="border-0">

      <template>

        <template v-if="action">
          <h1 class="text-success text-center m-0">$ {{ action.amount / 100 }} / mo</h1>
          <div class="text-uppercase text-center">{{ action.title }}</div>
          <hr>
        </template>

        <tabs v-if="!(action || {}).onetime" fill class="flex-column flex-md-row" tabNavWrapperClasses="p-0 my-4" :class="[{ 'no-click': busy }]">

            <tab-pane ref="signInTab">
              <span slot="title" class="text-uppercase">Sign in</span>
              <form @submit="handleSignIn" role="form">
                <base-input v-model="email"
                            alternative
                            class="mb-3"
                            placeholder="Email"
                            :addon-left-icon="loading ? 'fas fa-sync-alt fa-spin' : 'fas fa-envelope'">
                </base-input>
                <base-input v-model="password"
                            alternative
                            type="password"
                            placeholder="Password"
                            :addon-left-icon="loading ? 'fas fa-sync-alt fa-spin' : 'fas fa-lock'">
                </base-input>
                <div class="text-center my-4">
                  <base-button :type="submitButtonType" class="w-100" native-type="submit" :disabled="submitButtonDisabled">
                    <span v-if="!busy">Sign in{{ actionText }}</span>
                    <i v-if="busy" :class="submitButtonIconClass"></i>
                  </base-button>
                </div>
              </form>
            </tab-pane>

            <tab-pane ref="signUpTab">
              <span slot="title" class="text-uppercase">Sign up</span>
              <form @submit="handleSignUp" role="form">

                <base-input v-model="email"
                            alternative
                            class="mb-3"
                            placeholder="Email"
                            :addon-left-icon="loading ? 'fas fa-sync-alt fa-spin' : 'fas fa-envelope'">
                </base-input>
                <base-input v-model="password"
                            alternative
                            type="password"
                            placeholder="Password"
                            :addon-left-icon="loading ? 'fas fa-sync-alt fa-spin' : 'fas fa-lock'">
                </base-input>

                <div class="text-muted text-center w-100 mb-3">
                  <small>Signup is free (subscriptions are not).</small>
                </div>

                <div class="form-group input-group input-group-alternative">
                  <div class="input-group-prepend">
                    <span class="input-group-text" style="font-size: 0.75rem;">
                      <i :class="loading ? 'fas fa-sync-alt fa-spin' : 'fas fa-credit-card'"></i>
                    </span>
                  </div>
                  <div ref="cardNumber" style="padding:.9rem 0;"></div>
                </div>

                <div class="d-flex">
                  <div class="form-group input-group input-group-alternative mr-3 mb-0">
                    <div ref="cardExpiry" style="padding:.9rem .75rem;"></div>
                  </div>

                  <div class="form-group input-group input-group-alternative mb-0">
                    <div ref="cardCvc" style="padding:.9rem .75rem;"></div>
                  </div>
                </div>

                <div class="text-center my-4">
                  <base-button :type="submitButtonType" class="w-100" native-type="submit" :disabled="submitButtonDisabled">
                    <span v-if="!busy">Sign up{{ actionText }}</span>
                    <i v-if="busy" :class="submitButtonIconClass"></i>
                  </base-button>
                </div>
              </form>
            </tab-pane>
        </tabs>

        <!-- secured by auth0 -->
        <div class="d-flex mt-4 mt-lg-4 align-items-center">
          <hr class="flex-fill m-0">
          <div class="text-muted text-center text-uppercase mx-2">
            <small><i class="fas fa-fingerprint mr-1" style="font-size:12px;"></i>Secured by <a href="https://auth0.com">Auth0</a></small>
          </div>
          <hr class="flex-fill m-0">
        </div>
        <!-- /secured by auth0 -->

<!--         <base-button type="primary" class="w-100 mb-2 mt-4" @click="r()">Ready</base-button>
        <base-button type="primary" class="w-100 mb-2" @click="l()">Loading</base-button>
        <base-button type="primary" class="w-100 mb-2" @click="s()">Success</base-button>
        <base-button type="primary" class="w-100 mb-2" @click="e()">Error</base-button> -->

      </template>
    </card>
  </base-modal>

</template>

<script>
import BaseModal from "@/components/Base/BaseModal.vue";
import Tabs from "@/components/Tabs/Tabs.vue";
import TabPane from "@/components/Tabs/TabPane.vue";
import auth from "@/auth/";

const { login, authNotifier } = auth;

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
const stripe = Stripe("pk_test_7yS5dDjXxrthjZg8ninXVLUK");
const elements = stripe.elements();
const cardNumber = elements.create("cardNumber", { classes, style });
const cardExpiry = elements.create("cardExpiry", { classes, style });
const cardCvc = elements.create("cardCvc", { classes, style });

export default {
  name: "login-modal",
  components: {
    BaseModal,
    Tabs,
    TabPane
  },
  props: {
    show: {
      type: Boolean,
      required: true,
      default: false,
      description: "Whether to show the modal."
    },
    action: {
      type: Object,
      required: false,
      default: null,
      description: "What to do (who to subscribe to) after successful login/signup."
    }
  },

  data () {
    return {
      email: "channel-0@foo.com",
      password: "Umami1408",
      cardNumberValid: false,
      cardExpiryValid: false,
      cardCvcValid: false,
      data: {
        state: "ready"
      },
      signUpTabActive: false
    }
  },

  mounted() {
    this.$watch(() => this.$refs.signUpTab.active, val => { this.signUpTabActive = val; })

    authNotifier.on("authError", error => {
      this.data.state = "error";
      setTimeout(() => { this.resetState(); }, 3000);
    });

    cardNumber.on("change", ({ complete }) => {
      this.cardNumberValid = complete;
    });
    cardExpiry.on("change", ({ complete }) => {
      this.cardExpiryValid = complete;
    });
    cardCvc.on("change", ({ complete }) => {
      this.cardCvcValid = complete;
    });

    cardNumber.mount(this.$refs.cardNumber);
    cardExpiry.mount(this.$refs.cardExpiry);
    cardCvc.mount(this.$refs.cardCvc);
  },

  computed: {

    // Action

    actionText() {
      if (!this.action) { return null; }
      if (this.action.subscribe) { return " + Subscribe"; }
      if (this.action.onetime) { return " + Donate"; }
    },

    // Master State

    loading() {
      return this.data.state === "loading";
    },
    success() {
      return this.data.state === "success";
    },
    error() {
      return this.data.state === "error";
    },
    busy() {
      return (this.loading || this.success || this.error);
    },

    // Submit Button

    submitButtonDisabled() {
      if (this.busy || !this.email || !this.password) { return true; }
      if (this.signUpTabActive) {
        return (!this.cardNumberValid || !this.cardExpiryValid || !this.cardCvcValid);
      }
    },
    submitButtonType() {
      if (this.success) { return "success"; }
      if (this.error) { return "danger"; }
      return "default";
    },
    submitButtonIconClass() {
      if (this.loading) { return "fas fa-sync-alt fa-spin"; }
      if (this.success) { return "fas fa-check"; }
      if (this.error) { return "fas fa-exclamation-triangle"; }
      return "d-none";
    }
  },

  methods: {

    // DEVELOPMENT
    l() {
      this.data.state = "loading";
    },
    e() {
      this.data.state = "error";
    },
    s() {
      this.data.state = "success";
    },
    r() {
      this.data.state = "ready";
    },
    ////////////////////

    close() {
      this.$emit("update:show", false);
      this.$emit("update:action", null);
      this.resetState();
    },

    resetState() {
      this.data.state = "ready";
    },

    handleSignIn(e) {
      e.preventDefault();
      this.data.state = "loading";

      const action = Object.assign({ redirect: this.$route.path }, this.action);
      login(this.email, this.password, action);
    },

    async handleSignUp(e) {
      e.preventDefault();
      this.data.state = "loading";

      const { token } = await stripe.createToken(cardNumber);
      const data = {
        email: this.email,
        password: this.password,
        token_id: token.id
      };
      const query = `
        mutation($data: SubscriberSignupInput!) {
          subscriberSignup(data: $data) {
            subscriber_id
          }
        }
      `;

      return this.$http.post("/api/public",
        { query, vars: { data }},
        { headers: this.$getHeaders() })
      .then(response => {
        if (response.data.errors) {

          // Error.

          this.data.state = "error";
          setTimeout(() => { this.resetState(); }, 3000);
          throw new Error(response.data.errors[0].message);
        }

        // Success.

        this.data.state = "success";
        const action = Object.assign({ redirect: this.$route.path }, this.action);
        login(this.email, this.password, action);
      })
      .catch(error => {
        this.data.state = "error";
        setTimeout(() => { this.resetState(); }, 3000);
      });
    }
  }
};
</script>