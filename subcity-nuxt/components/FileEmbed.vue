<template>
  <div class="md-elevation-5">
    <img v-if="filetype === 'image'" :src="download">
    <video v-else-if="filetype === 'video'"
           :src="download"
           controls>
        Your browser does not support video embeds.
    </video>
    <md-toolbar md-elevation="0">
      <div class="md-caption">Payload</div>
      <md-button class="md-primary" style="margin-left: auto;">
        <div style="display: flex; align-items: center;">
          <md-icon>save_alt</md-icon>
          <span style="text-transform: initial; margin-left: 4px;">{{ payload }}</span>
        </div>
      </md-button>
    </md-toolbar>
  </div>
</template>

<script>

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
  name: "FileEmbed",
  props: {
    payload: {
      type: String,
      required: true,
      default: ""
    },
    download: {
      type: String,
      required: true,
      default: ""
    }
  },

  computed: {

    filetype() {
      const match = /\.[a-z0-9]+$/i.exec(this.payload);
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

<style lang="scss" scoped>


</style>