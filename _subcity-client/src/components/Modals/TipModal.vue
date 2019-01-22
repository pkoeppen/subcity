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

        <h1 class="text-success text-center">$ {{ tipInputHasFocus ? "--" : tipDisplayAmount }}</h1>
        <base-input v-model="tipDisplayAmount"
                    @keypress="onlyNumbers"
                    @focus="tipInputHasFocus = true"
                    @blur="tipInputHasFocus = false"
                    alternative
                    class="my-4"
                    placeholder="Amount"
                    :addon-left-icon="loading ? 'fas fa-sync-alt fa-spin' : 'fas fa-dollar-sign'">
        </base-input>

        <div class="text-uppercase text-center">
          <div>{{ node.title }}</div>
          <small class="text-muted">One-time donation</small>
        </div>

        <hr>

        <form @submit="handleTip" role="form">

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

          <div class="text-center mt-4">
            <base-button :type="confirmButtonType" class="w-100" native-type="submit" :disabled="confirmButtonDisabled">
              <span v-if="!busy">Confirm</span>
              <i v-if="busy" :class="confirmButtonIconClass"></i>
            </base-button>
          </div>
        </form>

      </template>
    </card>
  </base-modal>

</template>

<script>

import BaseModal from "@/components/Base/BaseModal.vue";

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

const stripe     = Stripe("pk_test_7yS5dDjXxrthjZg8ninXVLUK");
const elements   = stripe.elements();
const cardNumber = elements.create("cardNumber", { classes, style });
const cardExpiry = elements.create("cardExpiry", { classes, style });
const cardCvc    = elements.create("cardCvc", { classes, style });

export default {

  name: "tip-modal",

  components: {
    BaseModal
  },

  props: {

    show: {
      type: Boolean,
      required: true,
      default: false,
      description: "Whether to show the modal."
    },

    node: {
      type: Object,
      required: true,
      description: "Object corresponding to the channel/syndicate being viewed."
    }

  },


  mounted() {
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


  data () {
    return {
      state: "ready",
      stripe: {
        cardNumberValid: false,
        cardExpiryValid: false,
        cardCvcValid: false,
      },
      amount: 25,
      tipInputHasFocus: false
    }
  },


  computed: {

    // Master State

    loading() {
      return this.state === "loading";
    },

    success() {
      return this.state === "success";
    },

    error() {
      return this.state === "error";
    },

    busy() {
      return this.loading || this.success || this.error;
    },

    // Tip Input Display

    tipDisplayAmount: {
      get() {
        if (this.tipInputHasFocus) {
          return this.amount ? this.amount.toString() : "";
        } else if (this.amount === "" || isNaN(this.amount)) {
          this.amount = 25;          
        } else if (this.amount > 9999) {
          this.amount = 9999;
        }

        return this.amount.toFixed(2).replace(/(\d)(?=(\d{3})+(?:\.\d+)?$)/g, "$1,");
      },
      set(newValue) {
        this.amount = parseFloat(newValue.replace(/[^\d\.]/g, ""))
      }
    },

    // Confirm Subscribe Button

    subscribeModalHeaderText() {
      return `${this.node.is_subscribed ? "Cancel " : ""}Subscription - ${this.node.title}`;
    },

    confirmButtonText() {
      if (this.node.is_subscribed) { return "Unsubscribe"; }
      return "Confirm";
    },

    confirmButtonDisabled() {
      if (this.busy) { return true; }
      return !this.cardNumberValid || !this.cardExpiryValid || !this.cardCvcValid;
    },

    confirmButtonType() {
      if (this.success) { return "success"; }
      if (this.error)   { return "danger"; }
      return "default";
    },

    confirmButtonIconClass() {
      if (this.loading) { return "fas fa-sync-alt fa-spin"; }
      if (this.success) { return "fas fa-check"; }
      if (this.error)   { return "fas fa-exclamation-triangle"; }
      return "d-none";
    }
  },


  methods: {

    close() {
      this.$emit("update:show", false);
      this.amount = 25;
      this.resetState();
    },

    resetState(success=false) {
      if (success) {
        this.close();
      } else {
        this.state = "ready";
      }
    },

    async handleTip(event) {
      event.preventDefault();

      this.state = "loading";

      const { token } = await stripe.createToken(cardNumber);
      console.log("doing stripe stuff");
      this.state = "success";
      setTimeout(() => this.resetState(true), 2000);

      return;

      this.state = "error";
      setTimeout(() => this.resetState(false), 2000);
      console.error(response.data.errors[0].message);
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
