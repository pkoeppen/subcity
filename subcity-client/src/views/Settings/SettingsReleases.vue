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
          <paginator-release
              :releases="releases"
              :channel_slug="channel_slug"
              :perPage="8"
              type="modal"
              @upload="fetchReleaseSettings()">
          </paginator-release>
        </div>

      </div>
    </div>
  </section>
</template>

<script>
import SettingsNav from "@/views/Settings/SettingsNav.vue";
import PaginatorRelease from "@/components/Paginators/PaginatorRelease.vue";

export default {

  name: "settings-releases",
  
  components: {
    SettingsNav,
    PaginatorRelease
  },

  data () {
    return {
      releases: null,
      channel_slug: ""
    }
  },

  created() {
    this.fetchReleaseSettings();
  },

  methods: {

    fetchReleaseSettings() {

      const query = `
        query($channel_id: ID!) {
          getChannelById(channel_id: $channel_id) {
            slug,
            releases {
              release_id,
              channel_id,
              slug,
              title,
              description,
              profile_url,
              banner_url,
              payload_url
            }
          }
        }
      `;

      return this.$http.post(`${this.$config.apiHost}/api/private`,
        { query, vars: {}},
        { headers: this.$getHeaders() })
      .then(response => {
        if (response.data.errors) {

          // Error.

          throw new Error(response.data.errors[0].message);
        }

        // Success.

        const { releases, slug } = response.data.data.getChannelById;

        this.releases = releases;
        this.channel_slug = slug;
      });
    }
  }
};
</script>