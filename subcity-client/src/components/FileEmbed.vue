<template>
  <div>

    <img v-if="filetype === 'image'" :src="download_url" class="img-fluid">

    <video v-if="filetype === 'video'"
           class="embed-responsive"
           :src="download_url"
           controls>
        Your browser does not support video embeds.
    </video>

    <a :href="download_url" download>
      <base-alert type="primary" class="d-flex justify-content-center align-items-center rounded-0 m-0">
        <i :class="iconClass" style="font-size:14px;"></i>
        <span class="alert-inner--text ml-2">{{ display_url }}</span>
      </base-alert>
    </a>

  </div>
</template>

<script>
import BaseAlert from "@/components/Base/BaseAlert.vue";

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
    BaseAlert
  },
  props: {
    channel_id: {
      type: String,
      required: true,
      default: ""
    },
    display_url: {
      type: String,
      required: true,
      default: ""
    },
    download_url: {
      type: String,
      required: true,
      default: ""
    }
  },

  computed: {

    filetype() {
      const match = /\.[a-z0-9]+$/i.exec(this.display_url);
      if (!match) { return null; }
      const filetype = match[0].slice(1);

      if (filetypes.image.indexOf(filetype) > -1) { return "image"; }
      if (filetypes.video.indexOf(filetype) > -1) { return "video"; }
      return "file";
    },

    iconClass() {
      if (this.loading) { return "fas fa-sync-alt fa-spin"; }
      return "fas fa-download";
    }
  }

};
</script>