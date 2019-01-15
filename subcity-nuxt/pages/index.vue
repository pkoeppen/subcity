<template>
  <div>

    <section id="section-1" class="container">
        <div style="width: 50%;">
          <div class="preheadline"><em>Let's talk about</em></div>
          <div class="bold-italic headline">Subscriptions.</div>
          <p class="subtext">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>
          <md-button class="md-primary md-raised" style="margin: 50px 0 0;">Learn more</md-button>
        </div>
        <img class="test" src="~/assets/images/test.svg" />
    </section>

    <section id="section-2">
      <div class="container" style="color: white;">
        <div class="preheadline" style="color: white;"><em>Life is better with</em></div>
        <div class="bold-italic headline" style="color: white;">Teamwork.</div>
        <p class="subtext">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum.</p>
      </div>
    </section>

    <section id="section-3" class="container">
      <div class="md-layout md-gutter">
        <div class="md-layout-item md-size-100" style="margin-bottom: 60px;">
          <div class="md-display-3" style="text-align: center; margin: 0 0 32px; text-transform: uppercase;"><strong>Welcome to revolutionary</strong></div>
          <p class="subtext" style="width: 60%; margin: 0 auto; text-align: center;">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
        </div>
        <div class="md-layout-item md-size-25 md-small-size-50 md-xsmall-size-100">
          <md-card md-with-hover>
            <md-card-header>
              <md-icon class="md-size-3x">recent_actors</md-icon>
              <div class="action">Start A Channel</div>
            </md-card-header>
            <md-card-content>
              <p>Lorem ipsum dolor sit amet ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad.</p>
            </md-card-content>
          </md-card>
        </div>
        <div class="md-layout-item md-size-25 md-small-size-50 md-xsmall-size-100">
          <md-card md-with-hover>
            <md-card-header>
              <md-icon class="md-size-3x">group</md-icon>
              <div class="action">Join Syndicates</div>
            </md-card-header>
            <md-card-content>
              <p>Lorem ipsum dolor sit amet ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad.</p>
            </md-card-content>
          </md-card>
        </div>
        <div class="md-layout-item md-size-25 md-small-size-50 md-xsmall-size-100">
          <md-card md-with-hover>
            <md-card-header>
              <md-icon class="md-size-3x">movie_filter</md-icon>
              <div class="action">Publish Content</div>
            </md-card-header>
            <md-card-content>
              <p>Lorem ipsum dolor sit amet ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad.</p>
            </md-card-content>
          </md-card>
        </div>
        <div class="md-layout-item md-size-25 md-small-size-50 md-xsmall-size-100">
          <md-card md-with-hover>
            <md-card-header>
              <md-icon class="md-size-3x">account_balance</md-icon>
              <div class="action">Earn Together</div>
            </md-card-header>
            <md-card-content>
              <p>Lorem ipsum dolor sit amet ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad.</p>
            </md-card-content>
          </md-card>
        </div>
        <div class="md-layout-item md-size-100" style="text-align: center; margin: 40px 0;">
          <a href="#"
             data-contact="cGV0ZXJAc3ViLmNpdHk="
             data-subject="R2VuZXJhbCBJbnF1aXJ5"
             onfocus="this.href = 'mailto:' + atob(this.dataset.contact) + '?subject=' + atob(this.dataset.subject || '')">
            <div class="md-title">Learn more about the platform</div>
          </a>
        </div>
      </div>
    </section>

    <section id="section-4" style="height: 660px; position: relative;">
      <div class="container">
        <div style="width: 33%; margin-left: auto;">
          <div class="headline bold-italic" style="margin-top: 0;">Inquire today!</div>
          <p class="subtext" style="margin: 32px 0;">Lorem ipsum dolor sit amet, consectetur adipiscing elit, <a href="mailto:apply@sub.city">apply@sub.city</a> tempor incididunt ut labore et dolore magna aliqua. Ut enim ad <nuxt-link to="/portal">subscriber account</nuxt-link> minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
          <form novalidate @submit.prevent="validateFields">
            <md-field :class="getValidationClass('email')">
              <label for="email">Email</label>
              <md-input type="email" name="email" id="email" autocomplete="email" v-model="form.email" :disabled="sending" />
              <span class="md-error" v-if="!$v.form.email.required">Email is required.</span>
              <span class="md-error" v-else-if="!$v.form.email.email">Invalid email.</span>
            </md-field>
            <md-button type="submit" class="md-primary md-raised" style="float: right; margin: 0;" :disabled="sending">Request Access</md-button>
          </form>
        </div>
      </div>
      <img id="city" src="~/assets/images/city.svg" />
    </section>

    <footer style="background-color: #ff5252;margin: 0 -16px -16px;">
      <section class="container" style="padding: 80px 0;">
        <div class="md-layout md-gutter">
        <div class="md-layout-item md-size-100">
          <div class="md-display-3" style="text-align: center; margin: 0 0 32px; text-transform: uppercase;"><strong>Welcome to revolutionary</strong></div>
          <p class="subtext" style="width: 60%; margin: 0 auto; text-align: center;">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
        </div>
      </div>
      </section>
    </footer>
  </div>
</template>

<script>
  import { validationMixin } from "vuelidate";
  import {
    required,
    email,
    minLength,
  } from "vuelidate/lib/validators";

  export default {
    name: "Homepage",
    mixins: [validationMixin],

    data: () => ({
      form: {
        email: null
      },
      sending: false,
    }),

    validations: {
      form: {
        email: {
          required,
          email
        },
      },
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

      validateFields () {
        this.$v.$touch();

        if (!this.$v.$invalid) {
          //
        }
      }
    },
  }
</script>

<style lang="scss" scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
}

.headline {
  font-size: 80px;
  line-height: 80px;
  text-transform: uppercase;
  color: #666;
  margin: 30px 0;
}

.preheadline {
  font-size: 36px;
  color: #999;
}

.title {
  font-family: "Quicksand", "Source Sans Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; /* 1 */
  display: block;
  font-weight: 300;
  font-size: 100px;
  color: #35495e;
  letter-spacing: 1px;
}

#section-1 {
  height: 800px;
  display: flex;
  align-items: center;
}

#section-2 {
  background-color: #ff5252;
  padding: 120px 0;
  width: calc(100% + 32px);
  position: relative;
  top: -40px;
  left: -16px;
}

#section-3 {
  margin: 60px auto 120px;

  .md-layout {

    .md-layout-item .md-card {
      padding: 32px 16px 24px;
      margin: 0 0 16px;

      .md-card-header {
        align-items: flex-start;
        display: flex;
        flex-direction: column;

        .action {
          text-transform: uppercase;
          font-size: 24px;
          line-height: 32px;
          color: #666;
          margin: 24px auto 0;
        }
      }

      .md-card-content {
        padding: 0 16px 32px;

        p {
          margin: 0;
          line-height: 30px;
        }
      }
    }
  }
}

#section-4 {
  min-height: 500px;

  img#city {
    width: 60%;
    position: absolute;
    left: -16px;
    bottom: 0;
  }
}

.subtext {
  font-size: 20px;
  line-height: 36px;
}

.subtitle {
  font-weight: 300;
  font-size: 42px;
  color: #526488;
  word-spacing: 5px;
  padding-bottom: 15px;
}

.test {
  width: 60vw;
  position: absolute;
  top: 0;
  right: -40px;
  z-index: 10;
}

.links {
  padding-top: 15px;
}
</style>
