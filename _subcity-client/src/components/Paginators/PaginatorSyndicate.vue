<template>
  <div>

    <div class="row" style="margin-top:-1rem;">

      <!-- syndicate tiles -->
      <div v-for="syndicate in paginated"
        :class="[{
          'col-lg-4': perPage === 8 || perPage === 9,
          'col-lg-3': perPage === 11 || perPage === 12,
        }]"
        class="col-md-6 my-2 my-sm-3">
        <tile :url="syndicate ? `${syndicate.profile_url}?${new Date().getTime()}` : null"
              :link="`/syndicates/${(syndicate || {}).slug}`"
              type="display">
        </tile>
      </div>
      <!-- /syndicate tiles -->

    </div>

    <!-- pagination -->
    <div v-if="total > 8" class="row">
      <div class="col">
        <base-pagination v-model="pageNumber" :total="total" :perPage="perPage" align="end" size="sm" class="my-2 my-sm-3"></base-pagination>
      </div>
    </div>
    <!-- /pagination -->

  </div>
</template>

<script>

import Tile from "@/components/Tiles/Tile.vue";

export default {

  name: "paginator-syndicate",

  props: [
    "perPage"
  ],

  components: {
    Tile
  },

  data() {
    return {
      syndicates: new Array(9),
      pageNumber: 1
    }
  },

  created() {
    this.fetchSyndicates();
  },

  computed: {

    total() {
      return this.syndicates ? this.syndicates.length : 0;
    },

    pageCount() {
      if (!this.syndicates) { return 0; }
      return Math.floor(this.syndicates.length / this.perPage);
    },

    paginated() {
      if (!this.syndicates) { return []; }
      const start = (this.pageNumber - 1) * this.perPage;
      const end = start + this.perPage;
      return this.syndicates.slice(start, end);
    },

    isSettings() {
      return this.type === "settings";
    }
  },

  methods: {

    fetchSyndicates() {

      const data = {
        search: "",
        deep: false
      };

      const query = `
        query($data: SyndicateRangeInput!) {
          getSyndicatesByRange(data: $data) {
            syndicate_id,
            slug,
            profile_url
          }
        }
      `;

      return this.$http.post("/api/public",
        { query, vars: { data }},
        { headers: this.$getHeaders() })
      .then(response => {
        if (response.data.errors) {

          // Error.

          throw new Error(response.data.errors[0].message);
        }

        // Success.
        
        const syndicates = response.data.data.getSyndicatesByRange;
        this.syndicates = syndicates;
      });
    }

  }
};

</script>