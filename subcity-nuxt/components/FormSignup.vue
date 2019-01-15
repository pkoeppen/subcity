<template>

  <form novalidate @submit.prevent="validateFields">
    <md-card class="md-elevation-3">
      <md-card-header>
        <div class="md-title">Sign Up</div>
      </md-card-header>

      <md-card-content>
        <md-field :class="getValidationClass('email')">
          <label for="email">Email</label>
          <md-input type="email" name="email" id="email-signup" autocomplete="email" v-model="form.email" :disabled="sending" />
          <span class="md-error" v-if="!$v.form.email.required">Email is required.</span>
          <span class="md-error" v-else-if="!$v.form.email.email">Invalid email.</span>
        </md-field>

        <md-field :class="getValidationClass('password')">
          <label for="password">Password</label>
          <md-input type="password" name="password" id="password-signup" autocomplete="password" v-model="form.password" :disabled="sending" />
          <span class="md-error" v-if="!$v.form.password.required">Password is required.</span>
        </md-field>

        <md-field :class="getValidationClass('cardholder')">
          <label for="cardholder">Cardholder</label>
          <md-input name="cardholder" id="cardholder" autocomplete="given-name" v-model="form.cardholder" :disabled="sending" />
          <span class="md-error" v-if="!$v.form.cardholder.required">Cardholder name is required.</span>
        </md-field>

        <div class="card-field" :class="getValidationClass('card_complete')">
          <input v-model="form.card_complete" hidden/>
          <div ref="card" class="card"></div>
          <span class="md-error" v-if="!$v.form.card_complete.complete">Payment card is required.</span>
        </div>
        
      </md-card-content>

      <md-progress-bar md-mode="indeterminate" v-if="sending" />

      <md-card-actions style="justify-content: space-between;">
        <md-checkbox v-model="form.tos_agreed" class="md-primary" style="padding: 0 8px;" :disabled="sending">
          I agree to the <nuxt-link to="/terms">Terms of Service</nuxt-link>.
        </md-checkbox>
        <md-button type="submit" class="md-primary" :disabled="sending">Initialize</md-button>
      </md-card-actions>
    </md-card>

  </form>

</template>

<script>
  import { validationMixin } from "vuelidate";
  import {
    required,
    email,
    minLength,
  } from "vuelidate/lib/validators";

  var stripe, card;

  export default {
    name: "FormSignup",
    mixins: [validationMixin],
    data: () => ({
      form: {
        card_complete: false,
        cardholder: null,
        email: null,
        password: null,
        tos_agreed: false
      },
      sending: false,
    }),

    mounted () {

      stripe = Stripe("pk_test_7yS5dDjXxrthjZg8ninXVLUK");

      const elements = stripe.elements({
        fonts: [{
          cssSrc: "https://fonts.googleapis.com/css?family=Roboto+Condensed",
        }],
      });

      card = elements.create("card", {
        classes: {
          focus: "focused",
          invalid: "invalid"
        },
        style: {
          base: {
            color: "rgba(0, 0, 0, .87)",
            fontSize: "15px",
            fontFamily: "'Roboto Condensed', sans-serif",
          },
        }
      });

      card.on("change", ({ complete }) => {
        this.form.card_complete = complete;
      });

      card.mount(this.$refs.card);

      if (!this.$route.query.login && !this.$route.query.email) {
        setTimeout(() => document.getElementById("email-signup").focus(), 500);
      }
    },

    validations: {
      form: {
        card_complete: {
          complete: (value) => value || false
        },
        cardholder: {
          required
        },
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
        this.card_complete = false;
        this.form.email = null;
        this.form.password = null;
        this.form.tos_agreed = false;
      },

      async initializeSubscriber () {
        this.sending = true;

        const { token: { id: token_id }} = await stripe.createToken(card);
        const data = {
          cardholder: this.form.cardholder,
          email: this.form.email,
          password: this.form.password,
          token_id
        };

        return this.$store.dispatch("initializeSubscriber", data)
        .then(() => {
          this.$store.dispatch("success", {
            message: "Your account has been created!",
            status: 200
          });
          return this.$store.dispatch("login", Object.assign({ redirect: "/channels" }, data));
        })
        .catch(error => {
          this.$store.dispatch("error", error);
        })
        .finally(() => {
          this.sending = false;
        });
      },

      validateFields () {
        this.$v.$touch();

        if (!this.$v.$invalid) {
          this.initializeSubscriber();
        }
      }
    }
  }
</script>

<style lang="scss" scoped>

  .card-field {
    position: relative;

    .md-error {
      color: #ff1744;
      opacity: 0;
      transform: translate3d(0,-8px,0);
      height: 20px;
      position: absolute;
      bottom: -22px;
      font-size: 12px;
      transition: .3s cubic-bezier(.4,0,.2,1);
    }

    &.md-invalid {

      .md-error {
        opacity: 1;
        transform: translateZ(0);
      }
      
      .card:after {
        background-color: #ff5252;
      }
    }

    .card {
      width: 100%;
      min-height: 48px;
      margin: 4px 0 24px;
      padding-top: 16px;
      position: relative;
      font-family: inherit;

      &:before, &:after {
        position: absolute;
        bottom: 0;
        right: 0;
        left: 0;
        transition: border .3s cubic-bezier(.4,0,.2,1), opacity .3s cubic-bezier(.4,0,.2,1), transform .3s cubic-bezier(.4,0,.2,1);
        will-change: border,opacity,transform;
        content: " ";
      }

      &:before {
        height: 2px;
        background-color: #ff5252;
        z-index: 2;
        opacity: 0;
        transform: scaleX(.12);
      }

      &:after {
        height: 1px;
        z-index: 1;
        background-color: rgba(0, 0, 0, .42);
      }

      &.focused:before {
        opacity: 1;
        transform: scaleX(1);
      }

      &.invalid:after {
        background-color: #ff5252;
      }
    }
  }

  .md-layout {
    justify-content: center;
  }

  .md-progress-bar {
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
  }
</style>
