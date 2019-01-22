<template>

  <section class="section">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-lg-10">
          <h1 class="display text-center mb-4">Good to have you here.</h1>
          <p class="text-justify mb-5">Lorem ipsum dolor sit amet, consectetur <router-link to="#" class="text-underline">adipiscing elit</router-link>, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim <router-link to="#" class="text-underline">reading our FAQ</router-link> ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in <router-link to="#" class="text-underline">tacos grandes</router-link> culpa qui officia deserunt mollit anim id est laborum.</p>
          <card type="secondary" shadow
                header-classes="bg-white pb-5"
                body-classes="px-lg-5 py-lg-5"
                class="border-0">
            <template>
              <form role="form" @submit="submit" :class="[{ 'no-click': busy }]">
                <!-- row -->
                <div class="row">

                  <!-- section1 -->
                  <div class="col-lg-6 px-lg-4">

                    <div class="text-center text-uppercase text-muted mb-3">
                      <small>Personal details</small>
                    </div>

                    <!-- first name -->
                    <base-input v-model="userData.first_name"
                                alternative
                                class="mb-3"
                                placeholder="First name"
                                :addon-left-icon="`fas ${loading ? 'fa-sync-alt fa-spin' : 'fa-address-card'}`">
                    </base-input>
                    <!-- /first name -->

                    <!-- last name -->
                    <base-input v-model="userData.last_name"
                                alternative
                                placeholder="Last name"
                                :addon-left-icon="`fas ${loading ? 'fa-sync-alt fa-spin' : 'fa-address-card'}`">
                    </base-input>
                    <!-- /last name -->

                    <!-- dob -->
                    <base-input addon-left-icon="ni ni-calendar-grid-58" alternative>
                        <flat-picker slot-scope="{focus, blur}"
                                     @on-open="focus"
                                     @on-close="blur"
                                     placeholder="Date of birth"
                                     :config="flatpickrConfig"
                                     class="form-control datepicker"
                                     v-model="userData.dob">
                        </flat-picker>
                    </base-input>
                    <!-- /dob -->

                    <div class="text-center text-uppercase text-muted mb-3 mt-lg-4">
                      <small>Primary Address</small>
                    </div>

                    <!-- address -->
                    <base-input v-model="userData.line1"
                                alternative
                                class="mb-3"
                                placeholder="Address"
                                :addon-left-icon="`fas ${loading ? 'fa-sync-alt fa-spin' : 'fa-map-marker-alt'}`">
                    </base-input>
                    <!-- /address -->

                    <!-- city -->
                    <base-input v-model="userData.city"
                                alternative
                                placeholder="City"
                                :addon-left-icon="`fas ${loading ? 'fa-sync-alt fa-spin' : 'fa-map-marked-alt'}`">
                    </base-input>
                    <!-- /city -->

                    <!-- state -->
                    <base-input v-model="userData.state"
                                alternative
                                placeholder="State"
                                :addon-left-icon="`fas ${loading ? 'fa-sync-alt fa-spin' : 'fa-map-marked-alt'}`">
                    </base-input>
                    <!-- /state -->

                    <div class="d-flex">
                      <!-- postal code -->
                      <base-input v-model="userData.postal_code"
                                  alternative
                                  placeholder="Postal code"
                                  :addon-left-icon="`fas ${loading ? 'fa-sync-alt fa-spin' : 'fa-map-marked-alt'}`">
                      </base-input>
                      <!-- /postal code -->

                      <base-dropdown>
                        <base-button slot="title" type="default" class="dropdown-toggle mr-0 ml-3">
                          <img src="https://demos.creative-tim.com/argon-design-system/assets/img/icons/flags/US.png" />
                          <small class="mx-1">US</small>
                        </base-button>
                        <li>
                          <a class="dropdown-item" href="#">
                            <img src="https://demos.creative-tim.com/argon-design-system/assets/img/icons/flags/DE.png" /> Germany
                          </a>
                        </li>
                        <li>
                          <a class="dropdown-item" href="#">
                            <img src="https://demos.creative-tim.com/argon-design-system/assets/img/icons/flags/GB.png" /> United Kingdom
                          </a>
                        </li>
                        <li>
                          <a class="dropdown-item" href="#">
                            <img src="https://demos.creative-tim.com/argon-design-system/assets/img/icons/flags/US.png" /> United States
                          </a>
                        </li>
                      </base-dropdown>
                    </div>

                  </div>
                  <!-- /section1 -->

                  <!-- section2 -->
                  <div class="col-lg-6 px-lg-4">

                    <div class="text-center text-uppercase text-muted mb-3">
                      <small>Direct deposit</small>
                    </div>

                    <!-- routing number -->
                    <base-input v-model="userData.routing_number"
                                alternative
                                placeholder="Routing number"
                                :addon-left-icon="`fas ${loading ? 'fa-sync-alt fa-spin' : 'fa-university'}`">
                    </base-input>
                    <!-- /routing number -->

                    <!-- account number -->
                    <base-input v-model="userData.account_number"
                                alternative
                                placeholder="Account number"
                                :addon-left-icon="`fas ${loading ? 'fa-sync-alt fa-spin' : 'fa-university'}`">
                    </base-input>
                    <!-- /account number -->

                    <!-- personal_id_number -->
                    <base-input v-model="userData.personal_id_number"
                                alternative
                                type="password"
                                maxlength="9"
                                placeholder="Social security number"
                                :addon-left-icon="`fas ${loading ? 'fa-sync-alt fa-spin' : 'fa-fingerprint'}`">
                    </base-input>
                    <!-- /personal_id_number -->

                    <div class="text-center text-uppercase text-muted mb-3  mt-lg-4">
                      <small>Login information</small>
                    </div>

                    <!-- email -->
                    <base-input v-model="userData.email"
                                alternative
                                type="email"
                                placeholder="Email"
                                :addon-left-icon="`fas ${loading ? 'fa-sync-alt fa-spin' : 'fa-envelope'}`">
                    </base-input>
                    <!-- /email -->

                    <!-- password -->
                    <base-input v-model="userData.password"
                                alternative
                                type="password"
                                placeholder="Password"
                                :addon-left-icon="loading ? 'fas fa-sync-alt fa-spin' : passwordFieldIcon">
                    </base-input>
                    <!-- /password -->

                    <base-progress :value="passwordStrength" :height="2" :percentage="false" :class="passwordStrengthColorClass" class="p-0"></base-progress>

                    <base-checkbox v-model="tos_agreed">
                        <span>I agree with the
                            <a href="#">Terms of Service</a>
                        </span>
                    </base-checkbox>
                    <base-checkbox v-model="privacy_agreed">
                        <span>I agree with the
                            <a href="#">Privacy Policy</a>
                        </span>
                    </base-checkbox>

                    
                  </div>
                  <!-- /section2 -->

                </div>
                <!-- /row -->

                <hr>

                <div class="text-center">
                  <base-button :type="submitButtonType" native-type="submit" style="min-width:162px;" :disabled="submitButtonDisabled">
                    <span v-if="!busy">Create Account</span>
                    <i v-if="busy" :class="submitButtonIconClass"></i>
                  </base-button>
                </div>
              </form>

              <hr>
              <base-button type="primary" style="min-width:162px;" @click="r()">Ready</base-button>
              <base-button type="primary" style="min-width:162px;" @click="l()">Loading</base-button>
              <base-button type="primary" style="min-width:162px;" @click="s()">Success</base-button>
              <base-button type="primary" style="min-width:162px;" @click="e()">Error</base-button>

            </template>
          </card>
        </div>
      </div>
    </div>
  </section>
</template>

<script>

// Look into loading this in a way that won't get its massive
// 700KB or whatever bundled into the final Webpack dist.
import checkPasswordStrength from "zxcvbn";

import flatPicker from "vue-flatpickr-component";
import "flatpickr/dist/flatpickr.css";

// const stripe = Stripe("pk_test_7yS5dDjXxrthjZg8ninXVLUK");

export default {
  components: {
    flatPicker
  },

  mounted() {
    // let zxcvbn = document.createElement('script');
    // zxcvbn.setAttribute("src","cdn//zxcvbn");
    // document.head.appendChild(zxcvbn);
  },

  data () {
    return {
      data: {
        state: "ready"
      },
      userData: {
        email: "p@k.com",
        password: "Umami1408",
        country: "US",
        first_name: "Peter",
        last_name: "Koeppen",
        // Address
        city: "Fort Wayne",
        line1: "3717 Burrwood Terrace",
        postal_code: "46815",
        state: "Indiana",
        // DOB
        dob: "1993-05-31",
        // Bank Account
        routing_number: "110000000", // US only
        account_number: "000123456789",
        // Legal
        personal_id_number: "999999999",
      },

      // TOS
      tos_agreed: true,
      privacy_agreed: true,
      // Flatpickr
      flatpickrConfig: {
        allowInput: true,
        dateFormat: "Y-m-d"
      }
    }
  },

  computed: {

    // State

    loading() {
      return this.data.state === "loading";
    },
    success() {
      return this.data.state === "success";
    },
    error() {
      return this.data.state === "error";
    },
    busy() {
      return (this.loading || this.success || this.error);
    },

    // Password Strength

    passwordStrength() {
      if (!this.userData.password) return 0;
      return 20 + (20 * checkPasswordStrength(this.userData.password).score);
    },
    passwordStrengthColorClass() {
      if (this.passwordStrength <= 20) { return "bg-red"; }
      if (this.passwordStrength <= 40) { return "bg-orange"; }
      if (this.passwordStrength <= 60) { return "bg-yellow"; }
      if (this.passwordStrength <= 80) { return "bg-green"; }
      return "bg-blue";
    },
    passwordFieldIcon() {
      if (this.passwordStrength <= 60) { return "fas fa-lock-open"; }
      if (this.passwordStrength > 60) { return "fas fa-lock"; }
    },

    // Submit Button

    submitButtonDisabled() {
      return (this.passwordStrength <= 60 ||
              !this.tos_agreed ||
              !this.privacy_agreed);
    },
    submitButtonType() {
      if (this.success) { return "success"; }
      if (this.error) { return "danger"; }
      return "default";
    },
    submitButtonIconClass() {
      if (this.loading) { return "fas fa-sync-alt fa-spin"; }
      if (this.success) { return "fas fa-check"; }
      if (this.error) { return "fas fa-exclamation-triangle"; }
    }
  },

  methods: {

    // DEVELOPMENT
    l() {
      this.data.state = "loading";
    },
    e() {
      this.data.state = "error";
    },
    s() {
      this.data.state = "success";
    },
    r() {
      this.data.state = "ready";
    },
    ////////////////////

    resetStatus() {
      this.data.state = "ready";
    },

    submit(e) {
      e.preventDefault();
      this.data.state = "loading";

      const data = { token_id: this.$route.params.token_id };
      Object.keys(this.userData).map(key => {
        data[key] = this.userData[key];
      });

      const query = `
        mutation($data: ChannelSignupInput!) {
          channelSignup(data: $data) {
            channel_id
          }
        }
      `;

      this.$http.post("/api/public",
        { query, vars: { data }},
        { headers: this.$getHeaders() })
      .then(response => {
        if (response.data.errors) {
          throw new Error(response.data.errors[0].message);
        }

        this.data.state = "success";

        // forward to settings

      }).catch(error => {
        setTimeout(() => this.resetStatus(), 2000);
        this.data.state = "error";
        console.error(error);
      });
    }
  }
};
</script>
