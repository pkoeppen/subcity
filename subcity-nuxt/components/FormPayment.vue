<template>

  <md-card style="margin: 0;">
    <md-card-header style="display: flex; align-items: center; justify-content: space-between;">
      <span class="md-title">Payout settings</span>
      <md-badge
        v-show="this.account_number_last4 && this.bank_name"
        class="md-square green"
        :md-content="this.account_number_last4 && this.bank_name ? `${bank_name} ...${this.account_number_last4}` : ''"
        style="position: relative; right: 0;margin: 0;">
      </md-badge>
    </md-card-header>

    <md-card-content>
      <div class="md-layout md-gutter">
        <div class="md-layout-item md-size-50">
          <md-field :class="getValidationClass('first_name')">
            <label for="first_name">First name</label>
            <md-input name="first_name" id="first_name" autocomplete="first_name" v-model="form.first_name" :disabled="sending || !armed" />
            <span class="md-error" v-if="!$v.form.first_name.required">First name is required.</span>
          </md-field>
        </div>
        <div class="md-layout-item md-size-50">
          <md-field :class="getValidationClass('last_name')">
            <label for="last_name">Last name</label>
            <md-input name="last_name" id="last_name" autocomplete="last_name" v-model="form.last_name" :disabled="sending || !armed" />
            <span class="md-error" v-if="!$v.form.last_name.required">Last name is required.</span>
          </md-field>
        </div>
      </div>

      <md-field :class="getValidationClass('line1')">
        <label for="line1">Address</label>
        <md-input name="line1" id="line1" autocomplete="line1" v-model="form.line1" :disabled="sending || !armed" />
        <span class="md-error" v-if="!$v.form.line1.required">Address is required.</span>
      </md-field>

      <div class="md-layout md-gutter">
        <div class="md-layout-item md-size-50">
          <md-field :class="getValidationClass('city')">
            <label for="city">City</label>
            <md-input name="city" id="city" autocomplete="city" v-model="form.city" :disabled="sending || !armed" />
            <span class="md-error" v-if="!$v.form.city.required">City is required.</span>
          </md-field>
        </div>
        <div class="md-layout-item md-size-50">
          <md-field :class="getValidationClass('postal_code')">
            <label for="postal_code">State</label>
            <md-input name="postal_code" id="postal_code" autocomplete="postal_code" v-model="form.postal_code" :disabled="sending || !armed" />
            <span class="md-error" v-if="!$v.form.postal_code.required">Postal code is required.</span>
          </md-field>
        </div>
        <div class="md-layout-item md-size-50">
          <md-field :class="getValidationClass('state')">
            <label for="state">State</label>
            <md-input name="state" id="state" autocomplete="state" v-model="form.state" :disabled="sending || !armed" />
            <span class="md-error" v-if="!$v.form.state.required">State is required.</span>
          </md-field>
        </div>
        <div class="md-layout-item md-size-50">
          <md-autocomplete @md-opened="autocompleteOpenedFix" :class="getValidationClass('country')" v-model="form.country" :md-options="countries.map(({label}) => label)" name="country" id="country" :disabled="sending || !armed">
            <label>Country</label>
          </md-autocomplete>
        </div>
        <div class="md-layout-item md-size-50">
          <md-field :class="getValidationClass('account_number')">
            <label for="account_number">Account number</label>
            <md-input name="account_number" id="account_number" autocomplete="account_number" v-model="form.account_number" :disabled="sending || !armed" />
            <span class="md-error" v-if="!$v.form.account_number.required">Account number is required.</span>
          </md-field>
        </div>
        <div class="md-layout-item md-size-50">
          <md-field :class="getValidationClass('routing_number')">
            <label for="routing_number">Routing number</label>
            <md-input name="routing_number" id="routing_number" autocomplete="routing_number" v-model="form.routing_number" :disabled="sending || !armed" />
            <span class="md-error" v-if="!$v.form.routing_number.required">Routing number is required.</span>
          </md-field>
        </div>
        <div class="md-layout-item md-size-50">
          <md-field :class="getValidationClass('personal_id_number')">
            <label for="personal_id_number">Personal ID number</label>
            <md-input name="personal_id_number" id="personal_id_number" autocomplete="personal_id_number" v-model="form.personal_id_number" :disabled="sending || !armed" />
            <span class="md-error" v-if="!$v.form.personal_id_number.required">Personal ID number is required.</span>
          </md-field>
        </div>
        <div class="md-layout-item md-size-50">
          <md-field :class="getValidationClass('dob')">
            <label for="dob">Date of birth</label>
            <md-input name="dob" id="dob" autocomplete="dob" v-model="form.dob" :disabled="sending || !armed" />
            <span class="md-error" v-if="!$v.form.dob.required">Date of birth is required.</span>
          </md-field>
        </div>
      </div>
      
    </md-card-content>

    <md-progress-bar md-mode="indeterminate" v-if="sending" />

    <md-card-actions>
      <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
        <md-switch v-model="armed" class="md-primary" style="margin: 0 0 0 8px;" :disabled="sending">Arm</md-switch>
        <md-button class="md-primary" @click="validateFields" :disabled="sending || !armed">Save</md-button>
      </div>
    </md-card-actions>
  </md-card>
</template>

<script>
  import { validationMixin } from "vuelidate";
  import {
    alphaNum,
    between,
    required,
    requiredIf,
    maxLength,
    numeric,
    url,
  } from "vuelidate/lib/validators";
  import countries from "~/assets/countries.json";

  export default {
    name: "FormPayment",
    mixins: [validationMixin],
    validations: {
      form: {
        account_number: {
          required,
          numeric
        },
        city: {
          required,
        },
        country: {
          required,
        },
        dob: {
          required,
        },
        first_name: {
          required,
        },
        last_name: {
          required,
        },
        line1: {
          required,
        },
        personal_id_number: {
          required,
        },
        postal_code: {
          required,
        },
        routing_number: {
          required,
        },
        state: {
          required,
        },
      }
    },

    data: () => ({
      account_number_last4: null,
      armed: false,
      bank_name: null,
      countries,
      form: {},
      sending: true,
    }),

    async mounted () {

      return this.$store.dispatch("getPayoutSettings")
      .then(settings => {

        const {
          account_number_last4,
          bank_name,
          ...form
        } = settings;

        this.account_number_last4 = account_number_last4;
        this.bank_name = bank_name;
        this.form = form;
        this.form.country = this.countries.find(({ value }) => value === this.form.country).label;
      })
      .catch(error => {
        this.$store.dispatch("error", error);
      })
      .finally(() => {
        this.sending = false;
      });
    },

    watch: {
      armed (armed) {
        if (!armed) {
          this.$v.$reset();
        }
      }
    },

    methods: {

      autocompleteOpenedFix () {
        this.form.country = this.form.country ? this.form.country + " " : " ";
        this.form.country = this.form.country.substring(0, this.form.country.length - 1)
      },

      getValidationClass (fieldName) {
        const field = this.$v.form[fieldName];

        if (field) {
          return {
            "md-invalid": field.$invalid && field.$dirty
          };
        }
      },

      updatePayoutSettings () {
        this.sending = true;

        const country = this.countries.find(({ label }) => label === this.form.country).value;
        const data = Object.assign({}, this.form);
        data.country = country;

        return this.$store.dispatch("updatePayoutSettings", data)
        .then(() => {
          this.$store.dispatch("success", {
            message: "Payout settings updated successfully.",
            status: 200
          });
          this.form.account_number = null;
          this.form.personal_id_number = null;
        })
        .catch(error => {
          this.$store.dispatch("error", error);
        })
        .finally(() => {
          this.armed = false;
          this.sending = false;
        });
      },

      validateFields () {
        this.$v.$touch();

        if (!this.$v.$invalid) {
          this.updatePayoutSettings();
        }
      },
    },
  };
</script>

<style lang="scss" scoped>

  .green {
    background-color: #00c853 !important;
  }

  .md-progress-bar {
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
  }

</style>
