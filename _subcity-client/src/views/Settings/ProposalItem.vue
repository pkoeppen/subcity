<template>

  <card class="mb-3" shadow>

    <template slot="header">
      <div class="d-flex justify-content-between">

        <!-- header-left -->
        <div>
          <span v-if="proposal.proposal_status === 'pending'" class="text-uppercase">New Proposal</span>
          <span v-else-if="proposal.proposal_status === 'approved'" class="text-uppercase">Approved</span>
          <span v-else-if="proposal.proposal_status === 'rejected'" class="text-uppercase">Rejected</span>
          <span v-else-if="proposal.proposal_status === 'expired'" class="text-uppercase">Expired</span>
          <span class="text-muted ml-sm-1 d-block d-sm-inline"><i class="fas fa-fingerprint mr-2"></i>{{ creatorDisplay }}</span>
        </div>
        <!-- /header-left -->

        <!-- header-right -->
        <div :class="[{ 'text-danger': almostExpired, 'text-right': expiry === 'EXPIRED'}]" class="text-uppercase d-flex align-items-center" style="width:72px;">
          <div v-if="!expiry" class="text-right w-100"><i class="fas fa-sync-alt fa-spin ml-auto mr-1" style="font-size:12px;"></i></div>
          <span v-else-if="expiry && proposal.proposal_status === 'pending'">{{ expiry }}</span>
          <div v-else-if="proposal.proposal_status === 'approved'" class="text-right text-success w-100"><i class="fas fa-check-circle ml-auto mr-1"></i></div>
          <div v-else-if="proposal.proposal_status === 'rejected'" class="text-right text-danger w-100"><i class="fas fa-times-circle ml-auto mr-1"></i></div>
          <div v-else-if="proposal.proposal_status === 'expired'" class="text-right w-100"><i class="fas fa-ban ml-auto mr-1"></i></div>
        </div>
        <!-- /header-right -->

      </div>
    </template>

    <!-- row -->
    <div class="row">

      <!-- new profile -->
      <div v-if="proposal.new_profile === true" class="col-lg-4 mb-4 mb-lg-0">
        <a :href="proposal.profile_url">
          <img :src="proposal.profile_url" class="img-fluid w-100">
        </a>
      </div>
      <!-- /new profile -->

      <!-- proposal body -->
      <div :class="proposal.new_profile === true ? 'col-lg-8' : 'col-lg-12'">

        <!-- action -->
        <div v-if="proposal.action">
          <div class="text-center mt-2" v-html="proposalActionHTML"></div>
        </div>
        <!-- /action -->

        <!-- proposal items -->
        <ul v-else class="list-group">
          <li v-for="item in curatedProposalItems" class="list-group-item d-flex flex-column flex-md-row justify-content-between align-items-center">
              <badge type="default" class="mb-2 mb-md-0 mr-md-3 px-2" style="border-radius:.1rem;">{{ item.attribute }}</badge>
              <p v-if="item.attribute === 'New Description' || item.attribute === 'New Payload File'" v-html="item.value" class="text-justify m-0"></p>
              <span v-else>{{ item.value }}</span>
          </li>
        </ul>
        <!-- /proposal items -->

      </div>
      <!-- /proposal body -->

    </div>
    <!-- /row -->

    <!-- row -->
    <div v-if="proposal.proposal_status === 'pending'" class="row">
      <div class="col-12">
        <base-progress type="default" :value="percentApproval" label="Total Approval"></base-progress>
      </div>
    </div>
    <!-- /row -->

    <template slot="footer">
      <div class="d-flex justify-content-center justify-content-sm-end align-items-center">
        <div class="flex-fill d-none d-sm-flex">
          <div v-if="!expiry"><i class="fas fa-sync-alt fa-spin ml-2" style="font-size:10px;"></i></div>
          <badge v-else type="secondary">{{ statusDisplay }}</badge>
        </div>
        <base-button :type="buttonIsDefault ? 'default' : 'danger'"
                     @click="$emit('reject')"
                     size="sm"
                     :disabled="buttonIsDisabled"
                     class="flex-fill flex-sm-grow-0"
                     style="min-width: 120px;">
          <span v-if="processing !== 'rejection'">Reject</span>
          <span v-if="processing === 'rejection'"><i class="fas fa-sync-alt fa-spin"></i></span>
        </base-button>
        <base-button :type="buttonIsDefault ? 'default' : 'success'"
                     @click="$emit('approve')"
                     size="sm"
                     :disabled="buttonIsDisabled"
                     class="flex-fill flex-sm-grow-0"
                     style="min-width: 120px;">
          <span v-if="processing !== 'approval'">Approve</span>
          <span v-if="processing === 'approval'"><i class="fas fa-sync-alt fa-spin"></i></span>
        </base-button>
      </div>
    </template>
    
  </card>

</template>

<script>

Number.prototype.pad = function(size) {
  var s = String(this);
  while (s.length < (size || 2)) { s = "0" + s; }
  return s;
}

export default {

  name: "proposal-item",

  props: ["channel_id", "proposal", "channelCount", "processing"],

  data() {
    return {
      expiry: null,
      expiryInterval: null,
      almostExpired: false
    }
  },

  mounted() {

    // If proposal is still eligible for voting,
    // determine the countdown time to display.

    if (this.proposal.proposal_status === "pending") {

      this.expiryInterval = setInterval(() => {

        const now = new Date().getTime();
        const distance = new Date(this.proposal.expires).getTime() - now;
        const hours = Math.floor((distance / (1000 * 60 * 60)));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        this.expiry = `${hours.pad()} : ${minutes.pad()} : ${seconds.pad()}`;

        if (hours < 2) {
          this.almostExpired = true;
        }

        if (distance <= 0) {
          this.expiry = "EXPIRED";
          clearInterval(this.expiryInterval);
        }

      }, 1000);

    } else {
      this.expiry = this.proposal.proposal_status;
    }
  },

  computed: {

    buttonIsDefault() {
      return (this.proposal.proposal_status !== "pending");
    },

    buttonIsDisabled() {
      return (this.alreadyVoted || this.proposal.proposal_status !== 'pending' || this.processing !== null);
    },

    alreadyVoted() {
      const votes = this.proposal.approvals.concat(this.proposal.rejections).map(channel => channel.channel_id);
      return (votes.indexOf(this.channel_id) > -1);
    },

    percentApproval() {
      return (100 * this.proposal.approvals.length / this.channelCount);
    },

    statusDisplay() {
      return this.expiry === "EXPIRED" && this.proposal.proposal_status === "pending"
             ? "EXPIRED"
             : this.proposal.proposal_status;
    },

    creatorDisplay() {
      if (this.proposal.action === "merge_approval") {
        return this.proposal._syndicate_id;
      } else {
        return this.proposal.creator.title;
      }
    },

    curatedProposalItems() {

      // Determines how each new proposal attribute is displayed.

      if (!this.proposal) { return []; }

      const ignore = [
        "proposal_id",
        "syndicate_id",
        "action",
        "profile_url",
        "creator",
        "created",
        "expires",
        "proposal_status",
        "rejections",
        "approvals"
      ];

      const map = {
        slug: {
          attribute: "New Slug",
          value: v => v
        },
        title: {
          attribute: "New Title",
          value: v => v
        },
        description: {
          attribute: "New Description",
          value: v => v
        },
        payload_url: {
          attribute: "New Payload File",
          value: v => `<a href="${v}">${v}</a>`
        },
        is_nsfw: {
          attribute: "Adult Content Flag",
          value: v => (v ? "On" : "Off")
        },
        is_unlisted: {
          attribute: "Unlisted Flag",
          value: v => (v ? "On" : "Off")
        },
        subscriber_pays: {
          attribute: "Subscriber Pays",
          value: v => (v ? "Yes" : "No")
        },
        subscription_rate: {
          attribute: "Price Change",
          value: v => v
        },
        new_profile: {
          attribute: "New Profile Image",
          value: v => (v ? "Yes" : "No")
        },
      };

      return Object.keys(this.proposal).map(key => {
        return (this.proposal[key] !== null && ignore.indexOf(key) < 0)
               ? ({ attribute: map[key].attribute, value: map[key].value(this.proposal[key]) })
               : null;
      }).filter(Boolean);
    },

    proposalActionHTML() {

      switch(this.proposal.action) {
        case "invite":
          return `
            <h1 class="text-success">Invitation:</h1>
            <h3 class="${this.proposal.proposal_status === "pending" ? "mb-0" : ""}"><a href="#">${this.proposal._channel_id}</a> will be invited to join the syndicate.</h3>
          `;
        case "merge_request":
          return `
            <h1 class="text-success">Merge request:</h1>
            <h3 class="${this.proposal.proposal_status === "pending" ? "mb-0" : ""}"><a href="#">${this.proposal._syndicate_id}</a> will be invited to merge into the syndicate.</h3>
          `;
        case "merge_approval":
          return `
            <h1 class="text-success">Merge approval:</h1>
            <h3 class="${this.proposal.proposal_status === "pending" ? "mb-0" : ""}">The syndicate will be merged into <a href="#">${this.proposal._syndicate_id}</a>.</h3>
          `;
        case "dissolve":
          return `
            <h1 class="text-danger">Dissolution:</h1>
            <h3>The syndicate will be permanently dissolved.</h3>
          `;
        default:
          // foo
      }
    }
  }
};
</script>