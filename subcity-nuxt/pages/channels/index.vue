<template>
  <section class="container">
    <channels :channels="channels"/>
  </section>
</template>

<script>
  import { mapState } from "vuex";
  import Channels from '~/components/Channels.vue'
  import Search from "~/components/Search.vue";

  export default {
    components: {
      Channels,
      Search
    },

    head () {
      return {
        title: "Channels || sub.city",
      }
    },

    fetch ({ store }) {
      return store.dispatch("getAllChannels");
    },

    computed: mapState([
      "channels"
    ]),
  }
</script>
