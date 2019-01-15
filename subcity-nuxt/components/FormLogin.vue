<template>

  <div>
    <form novalidate @submit.prevent="validateForm">
      <md-card class="md-elevation-3">
        <md-card-header>
          <div class="md-title">Login</div>
        </md-card-header>

        <md-card-content>
          <md-field :class="getValidationClass('email')">
            <label for="email">Email</label>
            <md-input type="email" name="email" id="email-login" autocomplete="email" v-model="form.email" :disabled="sending" />
            <span class="md-error" v-if="!$v.form.email.required">Email is required.</span>
            <span class="md-error" v-else-if="!$v.form.email.email">Invalid email.</span>
          </md-field>

          <md-field :class="getValidationClass('password')">
            <label for="password">Password</label>
            <md-input type="password" name="password" id="password-login" autocomplete="password" v-model="form.password" :disabled="sending" />
            <span class="md-error" v-if="!$v.form.password.required">Password is required.</span>
          </md-field>
          
        </md-card-content>

        <md-progress-bar md-mode="indeterminate" v-if="sending" />

        <md-card-actions style="justify-content: space-between;">
          <a class="hover" @click.prevent="forgotPasswordDialog = true">Forgot your password?</a>
          <md-button type="submit" class="md-primary" :disabled="sending">Login</md-button>
        </md-card-actions>
      </md-card>
    </form>

    <md-dialog-prompt
      :md-active.sync="forgotPasswordDialog"
      v-model="forgotPasswordEmail"
      md-title="Password reset link"
      md-input-placeholder="Enter your email..."
      md-confirm-text="Send"
      md-cancel-text="Cancel"
      @md-confirm="resetPassword()"
      @md-cancel="forgotPasswordEmail = null" />
  </div>

</template>

<script>
  import { validationMixin } from "vuelidate";
  import {
    required,
    email,
  } from "vuelidate/lib/validators";

  export default {
    name: "FormLogin",
    mixins: [validationMixin],
    data () {
      return {
        forgotPasswordDialog: false,
        forgotPasswordEmail: null,
        form: {
          email: this.$route.query.email || null,
          password: null,
        },
        sending: false,
      }
    },

    validations: {
      form: {
        email: {
          required,
          email,
        },
        password: {
          required,
        },
      }
    },

    mounted () {
      if (this.$route.query.login) {
        setTimeout(() => document.getElementById("email-login").focus(), 600);
      } else if (this.$route.query.email) {
        setTimeout(() => document.getElementById("password-login").focus(), 600);
      }
    },

    methods: {

      getValidationClass (fieldName) {
        const field = this.$v.form[fieldName];

        if (field) {
          return {
            "md-invalid": field.$invalid && field.$dirty
          };
        }
      },

      clearForm () {
        this.$v.$reset();
        this.form.email = null;
        this.form.password = null;
      },

      resetPassword () {
        this.sending = true;

        const body = {
          connection: "Username-Password-Authentication",
          client_id: "",
          email: this.forgotPasswordEmail,
        };

        return this.$axios.post("https://subcity-dev.auth0.com/dbconnections/change_password", body)
        .then(res => {

          console.log(JSON.stringify(res));

          this.$store.dispatch("success", {
            message: "Password reset link sent successfully.",
            status: 200,
          });
        })
        .catch(error => this.$store.dispatch("error", error))
        .finally(() => {
          this.sending = false;
          this.forgotPasswordEmail = null;
        });
      },

      validateForm () {
        this.$v.$touch();

        if (!this.$v.$invalid) {
          this.sending = true;
          this.$store.dispatch("login", Object.assign({ redirect: "/channels" }, this.form))
          .then(() => {
            this.$store.dispatch("success", {
              message: "Login successful.",
              status: 200
            });
          })
          .catch(error => {
            this.$store.dispatch("error", error);
          })
          .finally(() => {
            this.sending = false;
          });
        }
      }
    }
  }
</script>

<style lang="scss" scoped>
  
  .hover {
    font-size: 12px;

    &:hover {
      cursor: pointer;
    }
  }

  .md-progress-bar {
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
  }

</style>
