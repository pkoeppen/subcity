<template>
  <div>

    <md-autocomplete value="" :md-options="items" :md-open-on-focus="false">

      <label>Search</label>

      <template slot="md-autocomplete-item" slot-scope="{ item, term }">
        <md-highlight-text :md-term="term">{{ item.title }}</md-highlight-text>
      </template>

      <template slot="md-autocomplete-empty" slot-scope="{ term }">
        No results matching "{{ term }}" were found.
      </template>
    </md-autocomplete>

  </div>
</template>

<script>

  export default {

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
