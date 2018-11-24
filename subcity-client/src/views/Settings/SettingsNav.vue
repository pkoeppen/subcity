<template>

  <nav class="settings-nav" :class="[{ nested }]">
    <ul role="tablist" class="nav flex-lg-column justify-content-between nav-pills nav-fill">

      <li class="nav-item nav-item-circle d-block d-flex-md text-left-lg p-0 mb-4 mb-sm-3 mb-md-4 mb-lg-0">
        <router-link to="/settings/channel" class="nav-link nav-link-settings shadow-none" aria-selected="true">
          <div class="d-none d-md-block">channel</div>
          <i class="d-md-none fa fa-image"></i>
        </router-link>
      </li>

      <li class="nav-item nav-item-circle d-block d-flex-md text-left-lg p-0 mb-4 mb-sm-3 mb-md-4 mb-lg-0">
        <router-link to="/settings/releases" class="nav-link nav-link-settings shadow-none" aria-selected="true">
          <div class="d-none d-md-block">releases</div>
          <i class="d-md-none fa fa-images"></i>
        </router-link>
      </li>

      <li class="nav-item nav-item-circle d-block d-flex-md text-left-lg p-0 mb-4 mb-sm-3 mb-md-4 mb-lg-0">
        <router-link to="/settings/syndicates" class="nav-link nav-link-settings shadow-none" aria-selected="true">
          <div class="d-none d-md-block">syndicates</div>
          <i class="d-md-none fa fa-users"></i>
        </router-link>
      </li>

      <li class="nav-item nav-item-circle d-block d-flex-md text-left-lg p-0 mb-4 mb-sm-3 mb-md-4 mb-lg-0">
        <router-link to="/settings/payment" class="nav-link nav-link-settings shadow-none" aria-selected="true">
          <div class="d-none d-md-block">payment</div>
          <i class="d-md-none fa fa-credit-card"></i>
        </router-link>
      </li>

      <li class="nav-item nav-item-circle d-block d-flex-md text-left-lg p-0 mb-4 mb-sm-3 mb-md-4 mb-lg-0">
        <router-link to="/settings/general" class="nav-link nav-link-settings shadow-none" aria-selected="true">
          <div class="d-none d-md-block">general</div>
          <i class="d-md-none fa fa-cog"></i>
        </router-link>
      </li>

    </ul>
  </nav>

</template>

<script>

  export default {
    props: {
      nested: Boolean
    }
  };
  
</script>
