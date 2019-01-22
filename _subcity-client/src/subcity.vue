<template>
    <div id="subcity">

        <router-view
            name="header"
            :authenticated="authenticated"
            @login="login()"
            @logout="logout()">    
        </router-view>

        <main class="my-5">
          <div v-if="alert" class="container">
            <div class="row">
              <div class="col-12">
                <base-alert :type="alertType" class="mb-4">
                  <span class="alert-inner--icon" style="font-size:14px;"><i :class="alertIconClass"></i></span>
                  <span class="alert-inner--text"><strong>{{ alertTitle }}</strong> {{ alertText }}</span>
                </base-alert>
              </div>
            </div>
          </div>
          <router-view></router-view>
        </main>

        <router-view name="footer"></router-view>

        <login-modal :show.sync="modal.show" :action.sync="modal.action"></login-modal>

    </div>
</template>

<script>  
import LoginModal from "@/components/Modals/LoginModal.vue";
import auth from '@/auth/';

const { isAuthenticated, authNotifier, logout } = auth;

export default {
  name: 'subcity',
  components: {
    LoginModal
  },

  data() {
    return {
      authenticated: isAuthenticated(),
      modal: {
        show: false,
        action: null
      },
      alert: null
    }
  },

  watch: {
    "$route": "setAlert"
  },

  mounted() {
    this.setAlert(this.$route);

    authNotifier.on("logout", () => {
      this.authenticated = false;
      this.$router.push("/");
    });

    this.$bus.on("subscribe", action => {
      this.modal.action = action;
      this.modal.show = true;
    });
  },

  computed: {
    alertType() {
      if (this.alert === "success") { return "success"; }
      if (this.alert === "error") { return "danger"; }
    },
    alertTitle() {
      if (this.alert === "success") { return "Success."; }
      if (this.alert === "error") { return "Error."; }
    },
    alertText() {
      if (this.alert === "success") { return "Your request was processed successfully."; }
      if (this.alert === "error") { return "Something went wrong with your request."; }
    },
    alertIconClass() {
      if (this.alert === "success") { return "fas fa-check"; }
      if (this.alert === "error") { return "fas fa-exclamation-triangle"; }
    }
  },

  methods: {

    login() {
      this.modal.show = true;
    },

    logout() {
      logout();
    },

    setAlert({ query }) {
      if (query.success) {
        this.alert = "success";
      } else if (query.error) {
        this.alert = "error";
      } else {
        this.alert = null;
      }
    }
  }
};
</script>
