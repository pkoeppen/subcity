<template>
  <div>

    <!-- paginated channels -->
    <div v-if="channels" class="row" style="margin-top:-1rem;">
      <div v-for="channel in paginated"
          :key="(channel || {}).channel_id"
          :class="[{
            'col-lg-4': perPage === 9,
            'col-lg-3': perPage === 12,
          }]"
          class="col-md-6 my-2 my-sm-3">

        <tile :url="(channel || {}).profile_url"
              :link="`/channels/${ (channel || {}).slug }`"
               type="display">
        </tile>
        
      </div>
    </div>
    <!-- /paginated channels -->

    <!-- pagination -->
    <div v-if="total > 8" class="row">
      <div class="col">
        <pagination v-model="pageNumber" :total="total" :perPage="perPage" align="end" size="sm" class="my-3"></pagination>
      </div>
    </div>
    <!-- /pagination -->

  </div>
</template>

<script>

import Pagination from "@/components/Base/BasePagination.vue";
import Tile from "@/components/Tiles/Tile.vue";

export default {

  name: "paginator-channel",

  props: {
    perPage: {
      type: Number,
      required: false,
      default: 9,
    }
  },

  components: {
    Pagination,
    Tile
  },

  data () {
    return {
      channels: new Array(9),
      pageNumber: 1
    }
  },

  created() {
    this.fetchChannels();
  },

  computed: {

    total() {
      return this.channels.length;
    },

    pageCount() {
      return Math.floor(this.channels.length / this.perPage);
    },

    paginated() {
      const start = (this.pageNumber - 1) * this.perPage;
      const end = start + this.perPage;
      return this.channels.slice(start, end);
    }
  },

  methods: {

    fetchChannels() {

      const data = {
        search: "",
        deep: false
      };

      const query = `
        query($data: ChannelRangeInput!) {
          getChannelsByRange(data: $data) {
            channel_id,
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
        
        const channels = response.data.data.getChannelsByRange;
        this.channels = channels;
      });
    }
  }
};
</script>