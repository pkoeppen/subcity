<template>
  <div>

    <section class="section p-0">
      <div class="container">
        <div class="row">
          <div class="col-lg-12">

            <paginator-channel></paginator-channel>

          </div>
        </div>
      </div>
    </section>

  </div>
</template>

<script>
  import PaginatorChannel from "@/components/Paginators/PaginatorChannel.vue";

  export default {
    components: {
      PaginatorChannel
    }
  };
</script>
