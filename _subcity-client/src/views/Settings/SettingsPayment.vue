<template>
  <section class="section p-0 settings">
    <div class="container">
      <div class="row">

        <!-- settings navigation -->
        <div class="col-lg-3">
          <settings-nav></settings-nav>
        </div>
        <!-- /settings navigation -->

        <div class="col-lg-9">

          <base-alert :type="connectionStatusType" class="mb-4">
            <span class="alert-inner--icon"><i :class="connectionStatusIconClass" style="font-size:14px;"></i></span>
            <span class="alert-inner--text">
              <strong>{{ connectionStatusText.title }}</strong>
              <div class="d-none d-sm-inline">{{ connectionStatusText.message }}</div>
            </span>
          </base-alert>

          <!-- form -->
          <form @submit="savePaymentSettings" :class="[{ 'no-click': busy }]">

            <!-- card -->
            <card shadow>
              <template slot="header">
                <div class="d-flex justify-content-between">
                  <span>{{ immutable.bank_name }}</span>
                  <span>************ {{ immutable.account_number_last4 }}</span>
                </div>
              </template>

              <!-- row -->
              <div class="row m-0">

                <!-- sensitive fields -->
                <div class="p-3 mb-3 mb-md-0 col-md-8 bg-secondary rounded">
                  <div class="form-group form-inline">
                    <small class="mr-3 p-0 text-uppercase text-muted">Edit sensitive fields</small>
                    <base-switch @click="clearSensitiveFields()" v-model="sensitiveFieldsArmed" :disabled="busy"></base-switch>
                  </div>
                  <!-- personal_id_number -->
                  <base-input v-model="accumulator.personal_id_number"
                              :valid="isValid(accumulator.personal_id_number)"
                              :maxlength="$config.maxLengthGeneral"
                              class="mb-3"
                              type="password"
                              placeholder="Social security number"
                              :disabled="!sensitiveFieldsArmed"
                              :addon-left-icon="data.state === `loading` ? `fas fa-sync-alt fa-spin` : `fas fa-angle-double-right`">
                  </base-input>
                  <!-- /personal_id_number -->

                  <!-- account_number -->
                  <base-input v-model="accumulator.account_number"
                              :valid="isValid(accumulator.account_number)"
                              :maxlength="$config.maxLengthGeneral"
                              class="mb-3"
                              type="password"
                              placeholder="Account number"
                              :disabled="!sensitiveFieldsArmed"
                              :addon-left-icon="data.state === `loading` ? `fas fa-sync-alt fa-spin` : `fas fa-angle-double-right`">
                  </base-input>
                  <!-- /account_number -->

                  <!-- routing number -->
                  <base-input v-model="accumulator.routing_number"
                              :valid="isValid(accumulator.routing_number)"
                              :maxlength="$config.maxLengthGeneral"
                              class="mb-0"
                              placeholder="Routing number"
                              :disabled="!sensitiveFieldsArmed"
                              :addon-left-icon="data.state === `loading` ? `fas fa-sync-alt fa-spin` : `fas fa-angle-double-right`">
                  </base-input>
                  <!-- /routing number -->
                </div>
                <!-- /sensitive fields -->

                <div class="d-sm-flex d-md-block col-md-4 pl-md-4 justify-content-around">
                  <!-- payout_interval -->
                  <div class="form-group">
                    <label>
                      <small class="text-uppercase text-muted">Payout interval</small>
                    </label>
                    <base-radio name="daily" v-model="accumulator.payout_interval" :disabled="busy">
                      Daily
                    </base-radio>
                    <base-radio name="weekly" v-model="accumulator.payout_interval" :disabled="busy">
                      Weekly
                    </base-radio>
                    <base-radio name="monthly" v-model="accumulator.payout_interval" :disabled="busy">
                      Monthly
                    </base-radio>
                  </div>
                  <!-- /payout_interval -->

                  <!-- payout_anchor -->
                  <div class="form-group">
                    <label>
                      <small class="text-uppercase text-muted">Payout anchor</small>
                    </label>
<!--                           <base-dropdown>
                      <base-button slot="title" type="secondary" class="dropdown-toggle">
                        {{ accumulator.payout_anchor || "foo" }}
                      </base-button>
                      <div v-for=""></div>
                    </base-dropdown> -->
                    <base-input v-model="accumulator.payout_anchor"
                                :valid="isValid(accumulator.payout_anchor)"
                                :maxlength="2"
                                placeholder="31"
                                :disabled="payoutAnchorDisabled"
                                :addon-left-icon="data.state === `loading` ? `fas fa-sync-alt fa-spin` : `fas fa-angle-double-right`">
                    </base-input>
                  </div>
                  <!-- /payout_anchor -->
                </div>

                
              </div>
              <!-- /row -->

              <div class="row">
                <div class="col-lg-12">

                  <div class="d-flex mt-5 mb-3 align-items-center">
                    <hr class="flex-fill m-0">
                    <small class="text-uppercase text-muted mx-3">Personal details</small>
                    <hr class="flex-fill m-0">
                  </div>

                  <!-- first_name -->
                  <label class="d-flex justify-content-between w-100">
                    <span>First name</span>
                    <span class="text-muted">{{ $config.maxLengthGeneral - (accumulator.first_name || "").length }}</span>
                  </label>
                  <base-input v-model="accumulator.first_name"
                              :valid="isValid(accumulator.first_name)"
                              :maxlength="$config.maxLengthGeneral"
                              class="mb-3"
                              placeholder="First name"
                              :addon-left-icon="data.state === `loading` ? `fas fa-sync-alt fa-spin` : `fas fa-angle-double-right`">
                  </base-input>
                  <!-- /first_name -->

                  <!-- last_name -->
                  <label class="d-flex justify-content-between w-100">
                    <span>Last name</span>
                    <span class="text-muted">{{ $config.maxLengthGeneral - (accumulator.last_name || "").length }}</span>
                  </label>
                  <base-input v-model="accumulator.last_name"
                              :valid="isValid(accumulator.last_name)"
                              :maxlength="$config.maxLengthGeneral"
                              class="mb-3"
                              placeholder="Last name"
                              :addon-left-icon="data.state === `loading` ? `fas fa-sync-alt fa-spin` : `fas fa-angle-double-right`">
                  </base-input>
                  <!-- /last_name -->

                  <!-- dob -->
                  <label class="d-flex justify-content-between w-100">
                    <span>Date of birth</span>
                  </label>
                  <base-input addon-left-icon="ni ni-calendar-grid-58" :class="[{'has-success': success}, {'has-danger': error}]">
                    <flat-picker slot-scope="{focus, blur}"
                                @on-open="focus"
                                @on-close="blur"
                                placeholder="Date of birth"
                                :config="flatpickrConfig"
                                :class="[{'is-valid': success}, {'is-invalid': error}]"
                                class="form-control datepicker"
                                v-model="accumulator.dob">
                    </flat-picker>
                  </base-input>
                  <!-- /dob -->

                  <div class="d-flex mt-5 mb-3 align-items-center">
                    <hr class="flex-fill m-0">
                    <small class="text-uppercase text-muted mx-3">Primary address</small>
                    <hr class="flex-fill m-0">
                  </div>

                  <!-- line1 -->
                  <label class="d-flex justify-content-between w-100">
                    <span>Address</span>
                    <span class="text-muted">{{ $config.maxLengthExtended - (accumulator.line1 || "").length }}</span>
                  </label>
                  <base-input v-model="accumulator.line1"
                              :valid="isValid(accumulator.line1)"
                              :maxlength="$config.maxLengthExtended"
                              class="mb-3"
                              placeholder="Address"
                              :addon-left-icon="data.state === `loading` ? `fas fa-sync-alt fa-spin` : `fas fa-angle-double-right`">
                  </base-input>
                  <!-- /line1 -->

                  <!-- city -->
                  <label class="d-flex justify-content-between w-100">
                    <span>City</span>
                    <span class="text-muted">{{ $config.maxLengthGeneral - (accumulator.city || "").length }}</span>
                  </label>
                  <base-input v-model="accumulator.city"
                              :valid="isValid(accumulator.city)"
                              :maxlength="$config.maxLengthGeneral"
                              class="mb-3"
                              placeholder="City"
                              :addon-left-icon="data.state === `loading` ? `fas fa-sync-alt fa-spin` : `fas fa-angle-double-right`">
                  </base-input>
                  <!-- /city -->

                  <!-- state -->
                  <label class="d-flex justify-content-between w-100">
                    <span>State</span>
                    <span class="text-muted">{{ $config.maxLengthGeneral - (accumulator.state || "").length }}</span>
                  </label>
                  <base-input v-model="accumulator.state"
                              :valid="isValid(accumulator.state)"
                              :maxlength="$config.maxLengthGeneral"
                              class="mb-3"
                              placeholder="State"
                              :addon-left-icon="data.state === `loading` ? `fas fa-sync-alt fa-spin` : `fas fa-angle-double-right`">
                  </base-input>
                  <!-- /state -->

                  <!-- flex -->
                  <div class="d-flex">

                    <!-- country -->
                    <div class="mr-3">
                      <label class="d-flex justify-content-between w-100">
                        <span>Country</span>
                      </label>
                      <base-dropdown>
                        <base-button slot="title" type="default" class="dropdown-toggle mr-0" :disabled="busy">
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
                    <!-- /country -->

                    <!-- postal_code -->
                    <div class="flex-fill">
                      <label class="d-flex justify-content-between w-100">
                        <span>Postal code</span>
                        <span class="text-muted">{{ $config.maxLengthGeneral - (accumulator.postal_code || "").length }}</span>
                      </label>
                      <base-input v-model="accumulator.postal_code"
                                  :valid="isValid(accumulator.postal_code)"
                                  :maxlength="$config.maxLengthShort"
                                  class="mb-0"
                                  placeholder="Postal code"
                                  :addon-left-icon="data.postal_code === `loading` ? `fas fa-sync-alt fa-spin` : `fas fa-angle-double-right`">
                      </base-input>
                    </div>
                    <!-- /postal_code -->

                  </div>
                  <!-- /flex -->

                </div>
              </div>

              <template slot="footer">
                <div class="d-flex justify-content-center justify-content-lg-end">
                  <base-button :type="submitButtonType" native-type="submit" style="min-width:162px;" :disabled="submitButtonDisabled">
                    <span v-if="submitButtonText">{{ submitButtonText }}</span>
                    <i v-if="busy" :class="submitButtonIconClass"></i>
                  </base-button>
                </div>
              </template>
            </card>
            <!-- /card -->

          </form>
          <!-- /form -->

          <hr>
          <base-button type="primary" style="min-width:162px;" @click="r()">Ready</base-button>
          <base-button type="primary" style="min-width:162px;" @click="l()">Loading</base-button>
          <base-button type="primary" style="min-width:162px;" @click="s()">Success</base-button>
          <base-button type="primary" style="min-width:162px;" @click="e()">Error</base-button>

        </div>
      </div>
    </div>
  </section>
</template>

<script>

import flatPicker from "vue-flatpickr-component";
import SettingsNav from "@/views/Settings/SettingsNav.vue";

export default {
  name: "settings-channel",
  components: {
    SettingsNav,
    flatPicker
  },

  data () {
    return {
      bankConnectionStatus: "loading",
      sensitiveFieldsArmed: false,
      data: {
        state: "loading"
      },
      paymentSettings: {},
      accumulator: {
        first_name: null,
        last_name: null,
        country: null,
        city: null,
        line1: null,
        postal_code: null,
        state: null,
        dob: null,
        payout_interval: null,
        payout_anchor: null,
        personal_id_number: null,
        account_number: null,
        routing_number: null
      },
      immutable: {
        bank_name: null,
        account_number_last4: null
      },
      flatpickrConfig: {
        allowInput: true,
        dateFormat: "Y-m-d"
      }
    }
  },

  created() {
    this.fetchPaymentSettings();
  },

  watch: {
    paymentSettings() {

      // When the channel object comes through, populate input fields.

      Object.keys(this.accumulator).map(key => {
        this.accumulator[key] = this.paymentSettings[key];
      });
      Object.keys(this.immutable).map(key => {
        this.immutable[key] = this.paymentSettings[key];
      });
    }
  },

  computed: {

    // Data

    dataChanged() {
      return Object.keys(this.accumulator).map(key => {
        return (this.accumulator[key] !== this.paymentSettings[key]);
      }).filter(b => b).length > 0;
    },

    dataInputValid() {
      const fieldsValid = Object.keys(this.accumulator).map(key => {
        return this.isValid(this.accumulator[key]);
      }).filter(b => b === false).length === 0;
      return (fieldsValid && this.$config.slugRegex.test(this.accumulator.slug));
    },
    payoutAnchorDisabled() {
      return (this.accumulator.payout_interval === "daily");
    },

    // All

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

    // Submit Button

    submitButtonText() {
      if (!this.busy) { return "Save"; }
      if (this.loading) { return null; }
      if (this.success) { return "Success!"; }
      if (this.error) { return "Error."; }
    },
    submitButtonDisabled() {
      if (this.busy || !this.dataInputValid) { return true; }
      if (this.sensitiveFieldsArmed) {
        if (!this.accumulator.personal_id_number ||
            !this.accumulator.account_number ||
            !this.accumulator.routing_number) {
          return true;
        }
      }

      const valid = Object.keys(this.accumulator).map(key => {
        return this.isValid(this.accumulator[key]);
      }).filter(b => b === false).length === 0;

      return (this.busy || !valid || !this.dataChanged);
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
      return "d-none";
    },

    // Top Connected Status Bar

    connectionStatusType() {
      if (this.bankConnectionStatus === "loading") { return "default"; }
      if (this.bankConnectionStatus === "connected") { return "success"; }
      if (this.bankConnectionStatus === "error") { return "danger"; }
    },
    connectionStatusText() {
      if (this.bankConnectionStatus === "loading") {
        return ({ title: "Loading...", message: "" });
      }
      if (this.bankConnectionStatus === "connected") {
        return ({ title: "Connected.", message: " Your bank account is connected and ready to receive deposits." });
      }
      if (this.bankConnectionStatus === "error") {
        return ({ title: "Error", message: " Change this text" });
      }
    },
    connectionStatusIconClass() {
      if (this.bankConnectionStatus === "loading") { return "fas fa-sync-alt fa-spin"; }
      if (this.bankConnectionStatus === "connected") { return "fas fa-check"; }
      if (this.bankConnectionStatus === "error") { return "fas fa-exclamation-triangle"; }
    }
  },

  methods: {

    isValid(field) {

      // "null" = neutral
      // "true" = success
      // "false" = danger

      if (field === null) { return null; }
      if ((field || "").length === 0) { return false; }
      
      // General data.state fallback.

      if (this.data.state === "success") { return true; }
      if (this.data.state === "error") { return false; }
      return null;
    },

    clearSensitiveFields() {
      this.accumulator.personal_id_number = null;
      this.accumulator.account_number = null;
      this.accumulator.routing_number = null;
    },

    resetState(success=false) {
      if (success) {
        this.sensitiveFieldsArmed = false;
        this.clearSensitiveFields();
        this.fetchPaymentSettings();
      } else {
        this.data.state = "ready";
      }
    },

    // DEVELOPMENT
    l() {
      this.bankConnectionStatus = "loading";
      this.data.state = "loading";
    },
    e() {
      this.bankConnectionStatus = "error";
      this.data.state = "error";
    },
    s() {
      this.bankConnectionStatus = "connected";
      this.data.state = "success";
    },
    r() {
      this.bankConnectionStatus = "connected";
      this.data.state = "ready";
    },
    ////////////////////

    fetchPaymentSettings() {
      this.bankConnectionStatus = "loading";
      this.data.state = "loading";

      const query = `
        query($channel_id: ID!) {
          getChannelPaymentSettings(channel_id: $channel_id) {
            first_name,
            last_name,
            country,
            city,
            line1,
            postal_code,
            state,
            dob,
            bank_name,
            account_number_last4,
            payout_interval,
            payout_anchor
          }
        }`;

      return this.$http.post("/api/private",
        { query, vars: {}},
        { headers: this.$getHeaders() })
      .then(response => {
        if (response.data.errors) {
          throw new Error(response.data.errors[0].message);
        }

        // Success.

        const paymentSettings = response.data.data.getChannelPaymentSettings;

        paymentSettings.personal_id_number = null;
        paymentSettings.account_number = null;
        paymentSettings.routing_number = null;
        this.paymentSettings = paymentSettings;
        this.data.state = "ready";

        this.bankConnectionStatus = null || "connected"; // fuck with this
      });
    },

    savePaymentSettings(e) {
      e.preventDefault();
      this.data.state = "loading";

      // Prepare data for GQL.

      const data = Object.assign({}, this.accumulator);
      const query = `
        mutation($data: ChannelPaymentSettingsInput!) {
          updateChannelPaymentSettings(data: $data)
        }
      `;

      // Off it goes.

      return this.$http.post("/api/private",
        { query, vars: { data }},
        { headers: this.$getHeaders() })
      .then(response => {
        if (response.data.errors) {
          throw new Error(response.data.errors[0].message);
        }

        // Success.

        this.data.state = "success";
        setTimeout(() => { this.resetState(true); }, 2000);
      })
      .catch(error => {
        this.data.state = "error";
        console.error(error);
        setTimeout(() => { this.resetState(); }, 2000);
      });
    }
  }
};
</script>