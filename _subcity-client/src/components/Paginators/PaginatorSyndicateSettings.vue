<template>
  <div>

    <div class="row" style="margin-top:-1rem;">

      <!-- new syndicate tile -->
      <div :class="[{
            'col-lg-4': perPage === 8,
            'col-lg-3': perPage === 11,
            'no-click': !syndicates
          }]"
          class="col-md-6 my-2 my-sm-3"
          @click="showModal()">
        <div class="position-relative ratio-1-1 tile" style="background: #EEEEEE;">
          <div class="d-flex justify-content-center align-items-center controls">
            <i :class="`${!!syndicates ? 'ni ni-fat-add ni-3x' : 'fas fa-sync-alt fa-spin fa-2x'}`"></i>
          </div>
        </div>
      </div>
      <!-- /new syndicate tile -->

      <!-- syndicate tiles -->
      <div v-for="syndicate in paginated"
        :class="[{
          'col-lg-4': perPage === 8 || perPage === 9,
          'col-lg-3': perPage === 11 || perPage === 12,
        }]"
        class="col-md-6 my-2 my-sm-3">
        <tile :url="syndicate ? `${syndicate.profile_url}?${new Date().getTime()}` : null"
              :link="`/syndicates/${(syndicate || {}).slug}`"
              :func="() => { goToSyndicateSettingsURL(`/settings/syndicates/${(syndicate || {}).slug}`); }"
              type="dual">
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

    <!-- modal -->
    <modal :show.sync="modal.show" :new="true" type="syndicate" v-on:upload="$emit('upload')"></modal>
    <!-- /modal -->

  </div>
</template>

<script>

import Modal from "@/components/Modals/Modal.vue";
import Tile from "@/components/Tiles/Tile.vue";

export default {

  name: "paginator-syndicate-settings",

  props: [
    "type",
    "perPage",
    "syndicates"
  ],

  components: {
    Modal,
    Tile
  },

  data() {
    return {
      pageNumber: 1,
      modal: {
        show: false
      }
    }
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
  },

  methods: {

    showModal() {
      this.modal.show = true;
    },

    goToSyndicateSettingsURL(url) {
      this.$router.push(url);
    }

  }
};

</script>