<template>
    <header class="header-global">
        <base-nav class="navbar-main" type="" effect="light" expand>
            <a slot="brand" class="navbar-brand mr-lg-5" href="https://demos.creative-tim.com/vue-argon-design-system/documentation">
                <img src="@/assets/img/logo_alpha.svg">
            </a>

            <div class="row" slot="content-header" slot-scope="{closeMenu}">
                <div class="col-6 collapse-brand">
                    <a href="https://demos.creative-tim.com/vue-argon-design-system/documentation/">
                        <img src="@/assets/img/logo.svg">
                    </a>
                </div>
                <div class="col-6 collapse-close">
                    <close-button @click="closeMenu"></close-button>
                </div>
            </div>

            <ul class="navbar-nav navbar-nav-hover align-items-lg-center ml-lg-auto">
                <li class="nav-item mr-0 ml-lg-4"> <!-- FIX MARGIN-LEFT FOR MOBILE -->
                    <router-link to="/channels" class="nav-link nav-link-icon" style="padding-left:0 !important;padding-right:0 !important;">
                        <span class="nav-link-inner--text">channels</span>
                    </router-link>
                </li>
                <li class="nav-item mr-0 ml-lg-4"> <!-- FIX MARGIN-LEFT FOR MOBILE -->
                    <router-link to="/syndicates" class="nav-link nav-link-icon" style="padding-left:0 !important;padding-right:0 !important;">
                        <span class="nav-link-inner--text">syndicates</span>
                    </router-link>
                </li>
                <li class="nav-item mr-0 ml-lg-4" v-if="authenticated"> <!-- FIX MARGIN-LEFT FOR MOBILE -->
                    <router-link to="/settings" class="nav-link nav-link-icon" style="padding-left:0 !important;padding-right:0 !important;">
                        <span class="nav-link-inner--text">settings</span>
                    </router-link>
                </li>
                <li class="nav-item mr-0 ml-lg-4"> <!-- FIX MARGIN-LEFT FOR MOBILE -->
                    <a class="nav-link nav-link-icon"
                       v-if="!authenticated" @click.prevent="$emit('login')"
                       href="/login"
                       style="padding-left:0 !important;padding-right:0 !important;">
                        <span class="nav-link-inner--text">login</span>
                    </a>
                    <a class="nav-link nav-link-icon"
                       v-else
                       href="/logout"
                       @click.prevent="$emit('logout')"
                       style="padding-left:0 !important;padding-right:0 !important;" >
                        <span class="nav-link-inner--text">logout</span>
                    </a>
                </li>
            </ul>
        </base-nav>
    </header>
</template>
<script>
import BaseNav from "@/components/Base/BaseNav";
import BaseDropdown from "@/components/Base/BaseDropdown";
import CloseButton from "@/components/Base/CloseButton";

export default {
  components: {
    BaseNav,
    CloseButton,
    BaseDropdown
  },
  props: ["authenticated"]
};
</script>