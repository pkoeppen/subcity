<template>
  <div>

    <div class="row" style="margin-top:-1rem;">

      <!-- new release tile -->
      <div v-if="isModal"
          :class="[{
            'col-lg-4': perPage === 8,
            'col-lg-3': perPage === 11,
            'no-click': !releases
          }]"
          class="col-md-6 my-2 my-sm-3"
          @click="showModal()">
        <div class="position-relative ratio-1-1 tile" style="background: #EEEEEE;">
          <div class="d-flex justify-content-center align-items-center controls">
            <i :class="`${!!releases ? 'ni ni-fat-add ni-3x' : 'fas fa-sync-alt fa-spin fa-2x'}`"></i>
          </div>
        </div>
      </div>
      <!-- /new release tile -->

      <!-- release tiles -->
      <div v-for="release in paginated"
        :class="[{
          'col-lg-4': perPage === 8 || perPage === 9,
          'col-lg-3': perPage === 11 || perPage === 12,
        }]"
        class="col-md-6 my-2 my-sm-3">
        <tile :url="release ? `${release.profile_url}?${new Date().getTime()}` : null"
              :link="`/channels/${channel_slug}/${(release || {}).slug}`"
              :func="() => { showModal(release); }"
              :type="isModal ? 'dual' : 'display'">
        </tile>
      </div>
      <!-- /release tiles -->
    </div>

    <!-- pagination -->
    <div v-if="total > 8" class="row">
      <div class="col">
        <base-pagination v-model="pageNumber" :total="total" :perPage="perPage" align="end" size="sm" class="my-2 my-sm-3"></base-pagination>
      </div>
    </div>
    <!-- /pagination -->

    <!-- modal -->
    <modal v-if="isModal"
          :show.sync="modal.show"
          :item="modal.release"
          :new="modal.new"
          type="release"
          @upload="$emit('upload')">
    </modal>
    <!-- /modal -->

  </div>
</template>

<script>

import Modal from "@/components/Modals/Modal.vue";
import Tile from "@/components/Tiles/Tile.vue";

export default {

  name: "paginator-release",

  props: [
    "type",
    "perPage",
    "releases",
    "channel_slug"
  ],

  components: {
    Modal,
    Tile
  },

  data () {
    return {
      pageNumber: 1,
      modal: {
        show: false,
        new: true,
        release: {}
      }
    }
  },

  computed: {

    total() {
      return this.releases ? this.releases.length : 0;
    },

    pageCount() {
      if (!this.releases) { return 0; }
      return Math.floor(this.releases.length / this.perPage);
    },

    paginated() {
      if (!this.releases) { return []; }
      const start = (this.pageNumber - 1) * this.perPage;
      const end = start + this.perPage;
      return this.releases.slice(start, end);
    },

    isModal() {
      return this.type === "modal";
    }
  },

  methods: {

    showModal(release=false) {
      if (release) {
        this.modal.release = release;
        this.modal.new = false;
      } else {
        this.modal.new = true;
      }
      this.modal.show = true;
    }
  }
};

</script>