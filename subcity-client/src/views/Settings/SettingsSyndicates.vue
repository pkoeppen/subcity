<template>
  <section class="section p-0 settings">
    <div class="container">
      <div class="row">

        <!-- settings navigation -->

        <div class="col-lg-3">
          <settings-nav></settings-nav>
        </div>

        <!-- /settings navigation -->

        <div class="col-lg-9">

          <!-- invitations -->
          <div v-if="(invitations || []).length" class="mb-4">
            <base-alert v-for="invitation in invitations" type="success" class="mb-2 d-flex justify-content-between align-items-center">
              <div>
                <span class="alert-inner--icon" style="font-size:14px;"><i class="fas fa-plus-circle"></i></span>
                <span class="alert-inner--text"><strong>Invitation:</strong> You've been invited to join the syndicate <a :href="`/syndicates/${invitation.slug}`">{{ invitation.title }}</a>.</span>
              </div>
              <div>
                <base-button type="primary" size="sm" @click="submitDecisionToJoinSyndicate(invitation.syndicate_id, true)">
                  <small>Approve</small>
                </base-button>
                <base-button type="primary" size="sm" @click="submitDecisionToJoinSyndicate(invitation.syndicate_id, false)">
                  <small>Reject</small>
                </base-button>
              </div>
            </base-alert>
          </div>
          <!-- invitations -->

          <paginator-syndicate-settings
              :syndicates="syndicates"
              :perPage="8"
              @upload="fetchSyndicateSettings()"
              type="settings">
          </paginator-syndicate-settings>
          
        </div>
        <!-- /col-lg-9 -->

      </div>
    </div>
  </section>
</template>

<script>

import SettingsNav from "@/views/Settings/SettingsNav.vue";
import PaginatorSyndicateSettings from "@/components/Paginators/PaginatorSyndicateSettings.vue";
import BaseAlert from "@/components/Base/BaseAlert.vue";
import BaseButton from "@/components/Base/BaseButton.vue";

export default {
  name: "settings-syndicates",
  components: {
    SettingsNav,
    PaginatorSyndicateSettings,
    BaseAlert,
    BaseButton
  },

  data () {
    return {
      syndicates: null,
      invitations: null
    }
  },

  created() {
    this.fetchSyndicateSettings();
  },

  methods: {

    fetchSyndicateSettings() {

      const query = `
        query($channel_id: ID!) {
          getChannelById(channel_id: $channel_id) {
            syndicates {
              syndicate_id,
              slug,
              title,
              description,
              profile_url
            },
            invitations {
              syndicate_id,
              title,
              slug
            }
          }
        }
      `;

      return this.$http.post("/api/private",
        { query, vars: {}},
        { headers: this.$getHeaders() })
      .then(response => {
        if (response.data.errors) {

          // Error.

          throw new Error(response.data.errors[0].message);
        }

        // Success.

        const {
          syndicates,
          invitations
        } = response.data.data.getChannelById;

        this.syndicates  = syndicates;
        this.invitations = invitations;
      });
    },

    submitDecisionToJoinSyndicate(syndicate_id, approved) {

      const data = {
        syndicate_id,
        approved
      };
      
      const query = `
        mutation($data: RespondToInviteInput!) {
          respondToInvite(data: $data) {
            syndicate_id
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

        console.log("success");
      });
    }
  }
};
</script>