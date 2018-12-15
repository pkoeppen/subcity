<template>

  <base-modal :show="show"
              @close="close"
              body-classes="p-0"
              modal-classes="modal-dialog-centered modal-sm">

    <h6 slot="header" class="modal-title" id="modal-title-notification">{{ headerText }}</h6>

      <card type="secondary" shadow
            header-classes="bg-white pb-5"
            body-classes="p-lg-5"
            class="border-0">

      <template>

        <form @submit="handleInviteToSyndicate" :class="[{ 'no-click': busy }]">

          <select class="mb-4" v-model="hostSyndicate">
            <option v-for="syndicate in syndicates"
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

</template>

<script>

import BaseModal from "@/components/Base/BaseModal.vue";

export default {

  name: "invite-modal",

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

    syndicates: {
      type: Array,
      required: true,
      description: "Array of syndicates to which the channel can be invited."
    }

  },


  data () {
    return {
      state: "ready",
      hostSyndicate: null
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

    // Syndicate Invite

    headerText() {
      return `Invitation - ${this.channel.title}`;
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

    handleInviteToSyndicate(event) {
      event.preventDefault();

      this.state = "loading";

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
