<template>

  <base-modal :show="show"
              @close="close"
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
        <p class="m-0">CHANNEL'S CALL TO ACTION GOES HERE. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
        <hr>

        <form @submit="handleSubscribe" :class="[{ 'no-click': busy }]">

          <!-- TODO: add a message-to-channel field -->

          <div class="text-center">
            <base-button :type="confirmButtonType" class="w-100" native-type="submit" :disabled="loading">
              <span v-if="!busy">{{ confirmButtonText }}</span>
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

export default {

  name: "subscribe-modal",

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

    channel: {
      type: Object,
      required: true,
      description: "Object corresponding to the channel being viewed."
    },

  },


  data () {
    return {
      state: "ready"
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

    // Confirm Subscribe Button

    subscribeModalHeaderText() {
      return `${this.channel.is_subscribed ? "Cancel " : ""}Subscription - ${this.channel.title}`;
    },

    confirmButtonText() {
      if (this.channel.is_subscribed) { return "Unsubscribe"; }
      return "Confirm";
    },

    confirmButtonDisabled() {
      if (this.busy) { return true; }
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
      this.resetState();
    },

    resetState(success=false) {
      if (success) {
        this.close();
      } else {
        this.state = "ready";
      }
    },

    handleSubscribe(event) {
      event.preventDefault();

      this.state = "loading";

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

          this.state = "error";
          setTimeout(() => this.resetState(false), 2000);
          console.error(response.data.errors[0].message);
        }

        // Success.

        this.state = "success";
        this.$emit("refresh");
        setTimeout(() => this.resetState(true), 2000);
      });
    }
  }
};

</script>
