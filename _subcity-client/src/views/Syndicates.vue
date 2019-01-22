<template>
  <div>

    <section class="section p-0">
      <div class="container">
        <div class="row">
          <div class="col-lg-12">

            <paginator-syndicate
              :perPage="9"
              type="display">
            </paginator-syndicate>

          </div>
        </div>
      </div>
    </section>

  </div>
</template>

<script>

  import PaginatorSyndicate from "@/components/Paginators/PaginatorSyndicate.vue";

  export default {

    components: {
      PaginatorSyndicate
    }

  };
  
</script>
