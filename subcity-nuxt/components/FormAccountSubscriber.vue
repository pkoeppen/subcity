<template>
  <div>
      <div class="md-title">Email address</div>
      <div class="md-toolbar md-transparent" style="flex-flow: row; margin-top: 8px; padding-right: 0;">
        <md-field :class="!emailVerified ? 'md-invalid' : getValidationClass('formEmail', 'email')">
          <label for="email">Email</label>
          <md-input type="email" name="email" id="email" v-model="formEmail.email" :disabled="sending || !emailVerified" />
          <span class="md-error" v-if="!emailVerified">Please verify your email to make further changes.</span>
          <span class="md-error" v-else-if="!$v.formEmail.email.email">Invalid email address.</span>
          <span class="md-error" v-else-if="!$v.formEmail.email.required">Email is required.</span>
        </md-field>
        <md-button @click="openVerifyEmailDialog()" :disabled="sending || verifyEmailButtonDisabled || !emailVerified">Verify</md-button>
      </div>

      <div class="md-title" style="margin-top: 40px;">Password</div>
      <div class="md-toolbar md-transparent" style="flex-flow: row; margin-top: 8px; align-items: flex-end; padding-right: 0;">
        <div style="flex: 1;">
          <md-field :class="getValidationClass('formPassword', 'passwordOld')">
            <label for="old-password">Old password</label>
            <md-input type="password" name="old-password" id="old-password" v-model="formPassword.passwordOld" :disabled="sending" />
            <span class="md-error" v-if="!$v.formPassword.passwordOld.required">Old password is required.</span>
          </md-field>
          <md-field :class="getValidationClass('formPassword', 'passwordNew')">
            <label for="new-password">New password</label>
            <md-input type="password" name="new-password" id="new-password" v-model="formPassword.passwordNew" :disabled="sending" />
            <span class="md-error" v-if="!$v.formPassword.passwordNew.required">New password is required.</span>
          </md-field>
        </div>
        <md-button style="bottom: 8px;" @click="updateSubscriberPassword" :disabled="sending">Change</md-button>
      </div>

      <div class="md-title" style="margin-top: 40px;">Shipping address</div>
      <div class="md-caption">Shared with subscribed channels</div>
      <div class="md-toolbar md-transparent" style="flex-flow: row; margin-top: 8px; align-items: flex-end; padding-right: 0;">
        <div style="flex: 1;">
          <md-field :class="getValidationClass('formAddress', 'first_name')">
            <label for="first_name">First name</label>
            <md-input type="first_name" name="first_name" id="first_name" autocomplete="first_name" v-model="formAddress.first_name" :disabled="sending" />
            <span class="md-error" v-if="!$v.formAddress.first_name.required">First name is required.</span>
          </md-field>
          <md-field :class="getValidationClass('formAddress', 'last_name')">
            <label for="last_name">Last name</label>
            <md-input type="last_name" name="last_name" id="last_name" autocomplete="last_name" v-model="formAddress.last_name" :disabled="sending" />
            <span class="md-error" v-if="!$v.formAddress.last_name.required">Last name is required.</span>
          </md-field>
          <md-field :class="getValidationClass('formAddress', 'line1')">
            <label for="line1">Address</label>
            <md-input type="line1" name="line1" id="line1" autocomplete="line1" v-model="formAddress.line1" :disabled="sending" />
            <span class="md-error" v-if="!$v.formAddress.line1.required">Address is required.</span>
          </md-field>
          <md-field :class="getValidationClass('formAddress', 'city')">
            <label for="city">City</label>
            <md-input type="city" name="city" id="city" autocomplete="city" v-model="formAddress.city" :disabled="sending" />
            <span class="md-error" v-if="!$v.formAddress.city.required">City is required.</span>
          </md-field>
          <md-field :class="getValidationClass('formAddress', 'state')">
            <label for="state">State</label>
            <md-input type="state" name="state" id="state" autocomplete="state" v-model="formAddress.state" :disabled="sending" />
            <span class="md-error" v-if="!$v.formAddress.state.required">State is required.</span>
          </md-field>
          <md-field :class="getValidationClass('formAddress', 'postal_code')">
            <label for="postal_code">Postal code</label>
            <md-input type="postal_code" name="postal_code" id="postal_code" autocomplete="postal_code" v-model="formAddress.postal_code" :disabled="sending" />
            <span class="md-error" v-if="!$v.formAddress.postal_code.required">Postal code is required.</span>
          </md-field>
          <md-field :class="getValidationClass('formAddress', 'country')">
            <label for="country">Country</label>
            <md-input type="country" name="country" id="country" autocomplete="country" v-model="formAddress.country" :disabled="sending" />
            <span class="md-error" v-if="!$v.formAddress.country.required">Country is required.</span>
          </md-field>
        </div>
        <md-button style="bottom: 8px;" @click="updateAddress()" :disabled="sending">Save</md-button>
      </div>

      <div class="md-title" style="margin-top: 40px;">Alias</div>
      <div class="md-caption">Shared with subscribed channels</div>
      <div class="md-toolbar md-transparent" style="flex-flow: row; margin-top: 8px; align-items: flex-end; padding-right: 0;">
        <div style="flex: 1;">
          <md-field :class="getValidationClass('formAlias', 'alias')">
            <label for="alias">Alias</label>
            <md-input type="alias" name="alias" id="alias" autocomplete="alias" v-model="formAlias.alias" :disabled="sending" />
          </md-field>
        </div>
        <md-button style="bottom: 8px;" @click="updateAlias()" :disabled="sending">Save</md-button>
      </div>

    <md-dialog-prompt
      :md-active.sync="verifyEmailDialog"
      v-model="formEmail.password"
      md-title="Email change confirmation"
      :md-content="`You are changing your email to <strong>${this.formEmail.email}</strong>. <br> Further email changes will be locked until you verify the new email.<br><br>Enter your password to continue.`"
      md-confirm-text="Verify"
      md-cancel-text="Cancel"
      @md-cancel="resetEmailField"
      @md-confirm="updateSubscriberEmail" />
  </div>
</template>

<script>
  import { validationMixin } from "vuelidate";
  import {
    alphaNum,
    email,
    required,
    requiredIf,
  } from "vuelidate/lib/validators";

  export default {
    name: "FormAccountSubscriber",
    mixins: [validationMixin],
    validations: {
      formAlias: {
        alias: {
          alphaNum,
        },
      },
      formAddress: {
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
      formEmail: {
        email: {
          required,
          email
        },
      },
      formPassword: {
        password: {
          required
        },
        passwordOld: {
          required
        },
        passwordNew: {
          required
        }
      }
    },

    data () {
      return {
        formAlias: {
          alias: null,
        },
        formAddress: {
          city: null,
          country: null,
          first_name: null,
          last_name: null,
          line1: null,
          postal_code: null,
          state: null,
        },
        formEmail: {
          email: this.$store.state.email,
          password: null,
        },
        formPassword: {
          password: null,
        },
        sending: false,
        verifyEmailDialog: false,
      };
    },

    created () {
      this.sending = true;

      return this.$store.dispatch("getSubscriberByID")
      .then(subscriber => {

        if (subscriber.address) {
          this.formAddress.city = subscriber.address.city;
          this.formAddress.country = subscriber.address.country;
          this.formAddress.first_name = subscriber.address.first_name;
          this.formAddress.last_name = subscriber.address.last_name;
          this.formAddress.line1 = subscriber.address.line1;
          this.formAddress.postal_code = subscriber.address.postal_code;
          this.formAddress.state = subscriber.address.state;
        }

        this.formAlias.alias = subscriber.alias;
      })
      .catch(error => this.$store.dispatch("error", error))
      .finally(() => { this.sending = false });
    },

    methods: {

      openVerifyEmailDialog () {
        this.$v.formEmail.$touch();
        if (this.$v.$invalid) return;

        this.verifyEmailDialog = true;
        setTimeout(() => { document.querySelector(".md-dialog-content input").type = "password" }, 100);
      },

      updateAddress () {
        this.$v.formAddress.$touch();
        if (this.$v.formAddress.$invalid) return;

        this.sending = true;

        const data = {
          address: {
            city: this.formAddress.city,
            country: this.formAddress.country,
            first_name: this.formAddress.first_name,
            last_name: this.formAddress.last_name,
            line1: this.formAddress.line1,
            postal_code: this.formAddress.postal_code,
            state: this.formAddress.state,
          }
        };
        
        return this.$store.dispatch("updateSubscriber", data)
        .then(() => this.$store.dispatch("success", {
          message: "Address updated successfully.",
          status: 200
        }))
        .catch(error => {
          this.$store.dispatch("error", error);
        })
        .finally(() => {
          this.sending = false;
        });
      },

      updateAlias () {
        this.$v.formAlias.$touch();
        if (this.$v.formAlias.$invalid) return;

        this.sending = true;

        const data = {
          alias: this.formAlias.alias,
        };
        
        return this.$store.dispatch("updateSubscriber", data)
        .then(() => this.$store.dispatch("success", {
          message: "Alias updated successfully.",
          status: 200
        }))
        .catch(error => {
          this.$store.dispatch("error", error);
        })
        .finally(() => {
          this.sending = false;
        });
      },

      updateSubscriberPassword () {
        this.$v.formPassword.$touch();
        if (this.$v.formPassword.$invalid) return;

        this.sending = true;

        const data = {
          email: this.$store.state.email,
          old_password: this.formPassword.passwordOld,
          new_password: this.formPassword.passwordNew,
        };

        return this.$store.dispatch("updateSubscriberPassword", data)
        .then(() => {
          this.$store.dispatch("success", {
            message: "Password changed successfully.",
            status: 200
          });
          this.$v.$reset();
          this.formPassword.passwordOld = null;
          this.formPassword.passwordNew = null;
        })
        .catch(error => {
          this.$store.dispatch("error", error);
        })
        .finally(() => {
          this.sending = false;
        });
      },

      getValidationClass (_0, _1) {
        const field = this.$v[_0][_1];

        if (field) {
          return {
            "md-invalid": field.$invalid && field.$dirty
          };
        }
      },

      resetEmailField () {
        this.formEmail.email = this.$store.state.email;
      },

      updateSubscriberEmail () {
        this.sending = true;

        const data = {
          email: this.$store.state.email,
          password: this.formEmail.password,
          new_email: this.formEmail.email,
        };
        
        return this.$store.dispatch("updateSubscriberEmail", data)
        .then(() => this.$store.dispatch("updateSubscriber", { email: this.formEmail.email }))
        .then(() => this.$store.dispatch("success", {
          message: "Verification email sent successfully.",
          status: 200
        }))
        .then(() => this.$store.dispatch("login", {
          email: this.formEmail.email,
          password: this.formEmail.password,
        }))
        .catch(error => {
          this.$store.dispatch("error", error);
        })
        .finally(() => {
          this.sending = false;
          this.formEmail.email = this.$store.state.email;
          this.formEmail.password = null;
        });
      },
    },

    computed: {

      verifyEmailButtonDisabled () {
        return this.formEmail.email === this.$store.state.email;
      },

      emailVerified () {
        return this.$store.state.email_verified;
      },
    }
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
