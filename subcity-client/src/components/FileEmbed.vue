<template>
  <div v-if="url !== null">

    <content-loader v-if="loading"
                    primaryColor="#EEEEEE"
                    secondaryColor="#DDDDDD"
                    :speed=".5"
                    :width="100"
                    :height="56.25">
      <rect x="0" y="0" width="100" height="56.25" />
    </content-loader>

    <img v-if="filetype === 'image'" :src="fullURL" class="img-fluid">

    <video v-if="filetype === 'video'"
           class="embed-responsive"
           :src="fullURL"
           controls>
        Your browser does not support video embeds.
    </video>

    <a :href="fullURL" download>
      <base-alert type="primary" class="d-flex justify-content-center align-items-center rounded-0 m-0">
        <i :class="iconClass" style="font-size:14px;"></i>
        <span class="alert-inner--text ml-2">{{ url }}</span>
      </base-alert>
    </a>

  </div>
</template>

<script>
import BaseAlert from "@/components/Base/BaseAlert.vue";
import { ContentLoader } from "vue-content-loader";

const filetypes = {
  image: [
    "jpg",
    "jpeg",
    "png",
    "gif",
    "tiff",
    "svg"
  ],
  video: [
    "mp4",
    "webm"
  ]
}

export default {
  name: "file-embed",
  components: {
    BaseAlert,
    ContentLoader
  },
  props: {
    channel_id: {
      type: String,
      required: true,
      default: ""
    },
    url: {
      type: String,
      required: true,
      default: ""
    }
  },

  data () {
    return {

    }
  },

  computed: {

    loading() {
      return this.url === "";
    },

    filetype() {
      const match = /\.[a-z0-9]+$/i.exec(this.url);
      if (!match) { return null; }
      const filetype = match[0].slice(1);

      if (filetypes.image.indexOf(filetype) > -1) { return "image"; }
      if (filetypes.video.indexOf(filetype) > -1) { return "video"; }
      return "file";
    },

    fullURL() {
      return `${this.$config.dataHost}/bucket-out/channels/${this.channel_id}/payload/${this.url}`;
    },

    iconClass() {
      if (this.loading) { return "fas fa-sync-alt fa-spin"; }
      return "fas fa-download";
    }
  },

  methods: {

  }
};
</script>