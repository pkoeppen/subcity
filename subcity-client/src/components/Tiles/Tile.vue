<template>
  <div>

    <!-- tile -->
    <div @click="(busy || !isUploadType) ? noop() : openInput()"
         :class="[{ 'no-click': busy }, { error: state === 'error' }]"
         class="w-100 tile"
         style="padding-bottom: 100%; background: #EEEEEE;">

      <content-loader v-if="imageLoading"
                      primaryColor="#EEEEEE"
                      secondaryColor="#DDDDDD"
                      :speed=".5"
                      :width="100"
                      :height="100"
                      class="position-absolute w-100 h-100">
                      <rect x="0" y="0" width="100" height="100" />
      </content-loader>

      <!-- linked image -->
      <router-link v-if="isDisplayType" :to="link">
        <img v-show="imageLoaded"
            :src="url"
             @load="setImageState('loaded')"
             @error="setImageState('error')"
             class="position-absolute w-100 h-100"
             style="object-fit:cover;" />
        <div v-if="imageError" class="controls">
          <div class="error justify-content-center align-items-center">
            <i class="fas fa-exclamation-triangle fa-4x"></i>
            <small style="margin:10px 0 -15px;">404</small>
          </div>
        </div>
      </router-link>
      <!-- /linked image -->

      <!-- image -->
      <img v-else v-show="imageLoaded"
          :src="url"
           @load="setImageState('loaded')"
           @error="setImageState('error')"
           class="position-absolute w-100 h-100"
           style="object-fit:cover;" />
      <!-- /image -->

      <!-- upload controls -->
      <div v-if="isUploadType && !imageLoading"
          :class="[{ 'has-image': imageLoaded }]"
           class="d-flex justify-content-center align-items-center controls">
        <i v-if="state === 'ready'" class="ni ni-fat-add ni-4x"></i>
        <i v-else-if="state === 'loading'" class="fas fa-sync-alt fa-spin fa-4x"></i>
        <i v-else-if="state === 'success'"  class="fas fa-check fa-4x faa-bounce animated text-success"></i>
        <i v-else-if="state === 'error'" :class="!!url ? `fa-4x` : `fa-2x mr-2`" class="fas fa-exclamation-triangle faa-flash animated red"></i>
        <span v-if="!imageLoaded && state === 'ready'"><small>Upload a profile (1 x 1)</small></span>
        <span v-else-if="!hasImage && state === 'error'"><small>Upload failed.</small></span>

        <input @change="setPreview"
              ref="imageInput"
              type="file"
              accept="image/jpeg, image/png"
              hidden/>
      </div>
      <!-- /upload controls -->

      <!-- modal controls -->
      <div v-if="isDualType && !imageLoading"
          :class="{ 'no-hover': imageError }"
           class="d-flex flex-column controls justify-content-center align-items-center">

        <!-- upper -->
        <router-link :to="link" class="tile-button h-50 w-100 d-flex justify-content-center align-items-center">
          <i class="fas fa-eye fa-2x"></i>
        </router-link>
        <!-- /upper -->

        <!-- lower -->
        <div @click="func" class="tile-button h-50 w-100 d-flex justify-content-center align-items-center">
          <i class="fas fa-edit fa-2x"></i>
        </div>
        <!-- /lower -->
        
        <div v-if="imageError" class="error justify-content-center align-items-center">
          <i class="fas fa-exclamation-triangle fa-4x"></i>
          <small style="margin:10px 0 -15px;">404</small>
        </div>
      </div>
      <!-- /modal controls -->

    </div>
    <!-- /tile -->

  </div>
</template>

<script>

import { ContentLoader } from 'vue-content-loader';

export default {
  name: "tile",
  components: {
    ContentLoader
  },
  props: {
    type: {
      required: true,
      default: null
    },
    url: {
      required: false,
      default: null
    },
    state: {
      required: false,
      default: "ready"
    },
    parentBusy: {
      required: false,
      default: false
    },
    link: {
      required: false,
      default: null
    },
    func: {
      required: false,
      default: () => (() => {})     
    }
  },
  data () {
    return {
      reader: null,
      imageState: null
    }
  },
  mounted() {
    this.reader = new FileReader();
    this.imageState = "loading";
  },

  computed: {
    busy() {
      return (this.state !== "ready" ||
              this.imageLoading ||
              this.parentBusy);
    },
    hasImage() {
      return this.url !== false;
    },
    imageLoading() {
      return this.hasImage && this.imageState === "loading";
    },
    imageLoaded() {
      return this.hasImage && this.imageState === "loaded";
    },
    imageError() {
      return this.hasImage && this.imageState === "error";
    },
    isDisplayType() {
      return this.type === "display";
    },
    isUploadType() {
      return this.type === "upload";
    },
    isDualType() {
      return this.type === "dual";
    }
  },

  methods: {

    noop() {},

    setImageState(state) {
      this.imageState = state;
      if (state === "error") {
        this.$emit("update:state", state);
        setTimeout(() => this.$emit("reset"), 3000);
      }
    },

    openInput() {
      this.$refs.imageInput.click();
    },

    setPreview(event) {
      if (event.target.files && event.target.files[0]) {
        var file = event.target.files[0];
        this.reader.onload = e => {
          this.$emit("update:url", e.target.result);
          this.$emit("update:state", "ready");
        };
        this.reader.readAsDataURL(file);
        this.$emit("update:file", file);
      }
    }
  }
};
</script>