<template>

  <md-autocomplete value="" :md-options="items" :md-open-on-focus="false" md-dense :md-layout="box ? 'box' : null">

    <label>Search</label>

    <template slot="md-autocomplete-item" slot-scope="{ item, term }">
      <md-highlight-text :md-term="term">{{ item.title }}</md-highlight-text>
    </template>

    <template slot="md-autocomplete-empty" slot-scope="{ term }">
      No results matching "{{ term }}" were found.
    </template>
  </md-autocomplete>

</template>

<script>

  export default {
    name: "Search",
    props: ['box'],
    computed: {

      items() {

        const {
          channels,
          syndicates
        } = this.$store.state;

        return [...channels, ...syndicates];
      }
    }
  };

</script>
