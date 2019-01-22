<template>
  <section class="container">

    <div class="md-layout md-gutter" style="margin-top: 32px;">
      <div class="md-layout-item md-size-50">
        <form-account-channel v-if="role === 'channel'"/>
        <form-account-subscriber v-else-if="role === 'subscriber'" />
      </div>
      <div class="md-layout-item md-size-50">
        <form-payment v-if="role === 'channel'"/>
        <form-sources v-else-if="role === 'subscriber'" />
      </div>
    </div>

  </section>
</template>

<script>
  import FormAccountChannel from "~/components/FormAccountChannel.vue";
  import FormAccountSubscriber from "~/components/FormAccountSubscriber.vue";
  import FormPayment from "~/components/FormPayment.vue";
  import FormSources from "~/components/FormSources.vue";

  export default {
    name: "SettingsAccount",
    components: {
      FormAccountChannel,
      FormAccountSubscriber,
      FormPayment,
      FormSources,
    },
    head () {
      return {
        title: `Account || sub.city`,
      }
    },
    fetch ({ store, redirect }) {
      if (!store.state.role) {
        return redirect('/portal?login=true')
      }
    },
    asyncData ({ app: { store }}) {
      return { role: store.state.role };
    }
  }
</script>

<style lang="scss" scoped>

  .container {
    max-width: 1200px;
    margin: 0 auto;
  }

</style>
