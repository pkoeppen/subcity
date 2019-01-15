<template>
  <section class="container">
    <syndicates :syndicates="syndicates"/>
  </section>
</template>

<script>
  import { mapState } from "vuex";
  import Syndicates from '~/components/Syndicates.vue'
  import Search from "~/components/Search.vue";

  export default {
    components: {
      Syndicates,
      Search
    },

    fetch ({ store }) {
      return store.dispatch("getAllSyndicates");
    },

    computed: mapState([
      "syndicates"
    ]),
  }
</script>

<style lang="scss" scoped>

  .container {
    max-width: 1200px;
    margin: 0 auto;
  }

</style>
