<template>
  <section class="container">

    <md-steppers :md-active-step.sync="active" :class="{ 'sending': sending }" md-dynamic-height>
      <md-step id="first" md-label="Personal" :md-done.sync="first" :md-error="firstStepError">
        <div class="md-layout md-gutter" style="margin-top: 32px; align-items: center;">
          <div class="md-layout-item md-size-50">
            <img src="~/static/images/1.svg" style="height: 120px; margin-bottom: 16px;"/>
            <div class="md-display-3" style="margin-bottom: 32px;">Good to have you here.</div>
            <p>This part of the site is still under construction, so I'm just going to put placeholder text here for now. Yes, it's intentional. No, I don't speak Latin. Lorem ipsum dolor sit amet consectetur adipisicing elit. Molestias doloribus eveniet quaerat modi cumque quos sed, temporibus nemo eius amet aliquid, illo minus blanditiis tempore, dolores voluptas dolore placeat nulla.</p>
          </div>
          <div class="md-layout-item md-size-50">

            <div class="md-layout md-gutter">
              <div class="md-layout-item md-size-50">
                <md-field :class="getValidationClass('first', 'first_name')">
                  <label for="first_name">First name</label>
                  <md-input type="first_name" name="first_name" id="first_name" autocomplete="first_name" v-model="firstForm.first_name" :disabled="sending" />
                  <span class="md-error" v-if="!$v.firstForm.first_name.required">First name is required.</span>
                </md-field>
              </div>
              <div class="md-layout-item md-size-50">
                <md-field :class="getValidationClass('first', 'last_name')">
                  <label for="last_name">Last name</label>
                  <md-input type="last_name" name="last_name" id="last_name" autocomplete="last_name" v-model="firstForm.last_name" :disabled="sending" />
                  <span class="md-error" v-if="!$v.firstForm.last_name.required">Last name is required.</span>
                </md-field>
              </div>
            </div>

            <md-field :class="getValidationClass('first', 'line1')">
              <label for="line1">Address</label>
              <md-input type="line1" name="line1" id="line1" autocomplete="line1" v-model="firstForm.line1" :disabled="sending" />
              <span class="md-error" v-if="!$v.firstForm.line1.required">Address is required.</span>
            </md-field>

            <div class="md-layout md-gutter">
              <div class="md-layout-item md-size-50">
                <md-field :class="getValidationClass('first', 'city')">
                  <label for="city">City</label>
                  <md-input type="city" name="city" id="city" autocomplete="city" v-model="firstForm.city" :disabled="sending" />
                  <span class="md-error" v-if="!$v.firstForm.city.required">City is required.</span>
                </md-field>
              </div>
              <div class="md-layout-item md-size-50">
                <md-field :class="getValidationClass('first', 'state')">
                  <label for="state">State</label>
                  <md-input type="state" name="state" id="state" autocomplete="state" v-model="firstForm.state" :disabled="sending" />
                  <span class="md-error" v-if="!$v.firstForm.state.required">State is required.</span>
                </md-field>
              </div>
            </div>

            <div class="md-layout md-gutter">
              <div class="md-layout-item md-size-50">
                <md-field :class="getValidationClass('first', 'postal_code')">
                  <label for="postal_code">Postal code</label>
                  <md-input type="postal_code" name="postal_code" id="postal_code" autocomplete="postal_code" v-model="firstForm.postal_code" :disabled="sending" />
                  <span class="md-error" v-if="!$v.firstForm.postal_code.required">Postal code is required.</span>
                </md-field>
              </div>
              <div class="md-layout-item md-size-50">
                <md-autocomplete @md-opened="autocompleteOpenedFix" :class="getValidationClass('first', 'country')" v-model="firstForm.country" :md-options="countries.map(({label}) => label)" type="country" name="country" id="country" :disabled="sending">
                  <label>Country</label>
                </md-autocomplete>
              </div>
            </div>

          </div> 
        </div>

        <md-button class="md-raised md-primary" style="float:right; margin-right: 0;" @click="nextStep('second')">Continue</md-button>
      </md-step>

      <md-step id="second" md-label="Payment" :md-done.sync="second" :md-error="secondStepError">
        <div class="md-layout md-gutter" style="margin-top: 32px; align-items: center;">
          <div class="md-layout-item md-size-40">

            <md-field :class="getValidationClass('second', 'account_number')">
              <label for="account_number">Account number</label>
              <md-input type="account_number" name="account_number" id="account_number" autocomplete="account_number" v-model="secondForm.account_number" :disabled="sending" />
              <span class="md-error" v-if="!$v.secondForm.account_number.required">Account number is required.</span>
            </md-field>

            <md-field :class="getValidationClass('second', 'routing_number')">
              <label for="routing_number">Routing number</label>
              <md-input type="routing_number" name="routing_number" id="routing_number" autocomplete="routing_number" v-model="secondForm.routing_number" :disabled="sending || routingNumberDisabled" />
              <span class="md-error" v-if="!$v.secondForm.routing_number.required">Routing number is required.</span>
            </md-field>

            <div class="md-layout md-gutter">
              <div class="md-layout-item md-size-50">
                <md-field :class="getValidationClass('second', 'personal_id_number')">
                  <label for="personal_id_number">Personal ID number</label>
                  <md-input type="personal_id_number" name="personal_id_number" id="personal_id_number" autocomplete="personal_id_number" v-model="secondForm.personal_id_number" :disabled="sending" />
                  <span class="md-error" v-if="!$v.secondForm.personal_id_number.required">Personal ID number is required.</span>
                </md-field>
              </div>
              <div class="md-layout-item md-size-50">
                <md-field :class="getValidationClass('second', 'dob')">
                  <label for="dob">Date of birth</label>
                  <md-input placeholder="yyyy-mm-dd" type="dob" name="dob" id="dob" autocomplete="dob" v-model="secondForm.dob" :disabled="sending" />
                  <span class="md-error" v-if="!$v.secondForm.dob.required">Date of birth is required.</span>
                </md-field>
              </div>
            </div>
          </div>
          <div class="md-layout-item md-size-60">
            <img src="~/static/images/2.svg" style="height: 120px; margin-bottom: 16px;"/>
            <div class="md-display-3" style="margin-bottom: 32px;">Ready the cannons.</div>
            <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Molestias doloribus eveniet quaerat modi cumque quos sed, temporibus nemo eius amet aliquid, illo minus blanditiis tempore, dolores voluptas dolore placeat nulla.</p>
          </div>
        </div>

        <md-button class="md-raised md-primary" style="float:right; margin-right: 0;" @click="nextStep('third')">Continue</md-button>
      </md-step>

      <md-step id="third" md-label="Credentials" :md-done.sync="third" style="position: relative;">

        <div class="md-layout md-gutter" style="margin-top: 32px; justify-content: center;">
          <div class="md-layout-item md-size-100" style="display: flex; justify-content: center;">
            <img src="~/static/images/3.svg" style="height: 120px; margin-bottom: 32px;"/>
          </div>
          <div class="md-layout-item md-size-33">
            <md-field :class="getValidationClass('third', 'email')">
              <label for="email">Email</label>
              <md-input type="email" name="email" id="email" autocomplete="email" v-model="thirdForm.email" :disabled="sending" />
              <span class="md-error" v-if="!$v.thirdForm.email.required">Email is required.</span>
              <span class="md-error" v-else-if="!$v.thirdForm.email.email">Invalid email.</span>
            </md-field>

            <md-field :class="getValidationClass('third', 'password')">
              <label for="password">Password</label>
              <md-input type="password" name="password" id="password" autocomplete="password" v-model="thirdForm.password" :disabled="sending" />
              <span class="md-error" v-if="!$v.thirdForm.password.required">Password is required.</span>
            </md-field>
            <md-checkbox v-model="thirdForm.tos_agreed" class="md-primary" style="padding: 0 8px;" :disabled="sending">
              I agree to the <nuxt-link to="/terms">Terms of Service</nuxt-link>.
            </md-checkbox>
            <md-button class="md-raised md-primary" style="float:right; margin-right: 0;" @click="validateFields()">Initialize</md-button>
          </div>
        </div>

        <md-progress-bar md-mode="indeterminate" v-if="sending" />
      </md-step>
    </md-steppers>
  </section>

</template>

<script>
  import { validationMixin } from "vuelidate"
  import {
    required,
    requiredIf,
    email,
    minLength,
    maxLength,
    numeric
  } from "vuelidate/lib/validators";
  import countries from "~/assets/countries.json";

  export default {
    name: "Initialization",
    mixins: [validationMixin],
    head () {
      return {
        title: `Onboarding || sub.city`,
      }
    },
    data: () => ({
      countries,
      active: "first",
      first: false,
      second: false,
      third: false,
      firstStepError: null,
      secondStepError: null,
      firstForm: {
        city: null,
        country: null,
        first_name: null,
        last_name: null,
        line1: null,
        postal_code: null,
        state: null,
      },
      secondForm: {
        account_number: null,
        dob: null,
        personal_id_number: null,
        routing_number: null,
      },
      thirdForm: {
        email: null,
        password: null,
      },
      sending: false,
    }),

    validations: {
      firstForm: {
        city: {
          required,
        },
        country: {
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
        postal_code: {
          required,
        },
        state: {
          required,
        },
      },
      secondForm: {
        account_number: {
          required,
        },
        dob: {
          required,
        },
        personal_id_number: {
          required,
        },
        routing_number: {
          required: requiredIf(function () { return this.firstForm.country === "United States of America" }),
        },
      },
      thirdForm: {
        email: {
          required,
          email
        },
        password: {
          required,
          minLength: minLength(8)
        },
        tos_agreed: {
          agreed: (value) => value || false
        }
      }
    },

    asyncData ({ $axios, store, params, error }) {

      const query = `
        query ($offer_id: ID!) {
          assertOfferExists (offer_id: $offer_id)
        }
      `;

      const vars = {
        offer_id: params.offerID
      };

      return $axios.post("/api/public", {
        query, vars
      })
      .then(() => {})
      .catch(_error => {
        const {
          data: message,
          status,
          statusText,
        } = _error.response;
        error({
          message: `${statusText}: ${message}`,
          statusCode: status
        });
      });
    },

    watch: {
      active: function (to, from) {
        this.$v[`${from}Form`].$touch();

        if (!this.$v[`${from}Form`].$invalid) {
          this[from] = true;
          this[`${from}StepError`] = null;
          this.active = to;
        } else {
          this[from] = false;
          this[`${from}StepError`] = "Form input invalid.";
        }
      }
    },

    methods: {

      autocompleteOpenedFix () {
        this.firstForm.country = this.firstForm.country ? this.firstForm.country + " " : " ";
        this.firstForm.country = this.firstForm.country.substring(0, this.firstForm.country.length - 1)
      },

      getValidationClass (index, fieldName) {
        const field = this.$v[`${index}Form`][fieldName];

        if (field) {
          return {
            "md-invalid": field.$invalid && field.$dirty
          };
        }
      },

      clearForm () {
        this.$v.$reset();
      },

      async initializeChannel () {
        this.sending = true;

        const country = this.countries.find(({ label }) => label === this.firstForm.country).value;
        this.firstForm.country = country;

        const data = Object.assign({
          offer_id: this.$route.params.offerID
        },
        this.firstForm,
        this.secondForm,
        this.thirdForm);

        delete data.tos_agreed;

        return this.$store.dispatch("initializeChannel", data)
        .then(() => {
          this.$store.dispatch("success", {
            message: "Your account has been created!",
            status: 200
          });
          return this.$store.dispatch("login", Object.assign({ redirect: "/settings/channel" }, data));
        })
        .catch(error => {
          this.$store.dispatch("error", error);
        })
        .finally(() => {
          this.sending = false;
        });
      },

      nextStep (step) {
        this.active = step;
      },

      validateFields () {
        this.$v.$touch();

        if (!this.$v.$invalid) {
          this.initializeChannel();
        }
      }
    },

    computed: {

      routingNumberDisabled () {
        return this.firstForm.country !== "United States of America";
      }
    }
  }
</script>

<style lang="scss" scoped>

  .sending {
    pointer-events: none;
  }

  .step {
    margin-top: 32px !important;
  }

  .md-progress-bar {
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
  }

  p {
    line-height: 28px;
  }
</style>
