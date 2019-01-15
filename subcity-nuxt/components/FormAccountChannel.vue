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
        <md-button style="bottom: 8px;" @click="updateChannelPassword()" :disabled="sending">Change</md-button>
      </div>

      <div class="md-title" style="margin-top: 40px;">Invites</div>
      <div class="md-caption">Experimental</div>
      <div class="md-toolbar md-transparent" style="flex-flow: row; margin-top: 8px; align-items: flex-end; padding-right: 0;">
        <div style="flex: 1;">
          <md-field :class="getValidationClass('formEmailInvite', 'email')">
            <label for="emailInvite">Email</label>
            <md-input type="email" name="emailInvite" id="emailInvite" v-model="formEmailInvite.email" :disabled="sending" />
            <span class="md-error" v-if="!$v.formEmailInvite.email.email">Invalid email address.</span>
            <span class="md-error" v-else-if="!$v.formEmailInvite.email.required">Email is required.</span>
          </md-field>
        </div>
        <md-button style="bottom: 8px;" @click="sendEmailInvite()" :disabled="sending">Invite</md-button>
      </div>
      <p class="md-caption" style="margin-left: 16px; margin-right: 96px;">This is an experimental feature currently under development. In the future, channels will be able to bid for internal "ad slots" displaying their content to subscribers site-wide.</p>
      <md-list v-if="invites.length" class="md-dense" style="margin-right: 96px;">
        <md-list-item v-for="(invite, index) in invites" :key="index">
          <span>{{ invite }}</span>
          <span class="md-caption">Invited</span>
        </md-list-item>
      </md-list>

      <div class="md-title" style="margin-top: 40px;">Placement auction</div>
      <div class="md-caption">Experimental</div>
      <div class="md-toolbar md-transparent" style="flex-flow: row; margin-top: 8px; align-items: flex-end; padding-right: 0;">
        <div style="flex: 1;">
          <md-field>
            <label for="bid">Bid amount</label>
            <md-input type="number" name="bid" id="bid" disabled />
          </md-field>
        </div>
        <md-button style="bottom: 8px;" disabled>Place</md-button>
      </div>
      <p class="md-caption" style="margin-left: 16px; margin-right: 96px;">This is an experimental feature currently under development. In the future, channels will be able to bid for internal "ad slots" displaying their content to subscribers site-wide.</p>

    <md-dialog-prompt
      :md-active.sync="verifyEmailDialog"
      v-model="formEmail.password"
      md-title="Email change confirmation"
      :md-content="`You are changing your email to <strong>${this.formEmail.email}</strong>. <br> Further email changes will be locked until you verify the new email.<br><br>Enter your password to continue.`"
      md-confirm-text="Verify"
      md-cancel-text="Cancel"
      @md-cancel="resetEmailField"
      @md-confirm="updateChannelEmail" />
  </div>
</template>

<script>
  import { validationMixin } from "vuelidate";
  import {
    email,
    required,
    requiredIf,
  } from "vuelidate/lib/validators";

  export default {
    name: "FormAccountChannel",
    mixins: [validationMixin],
    validations: {
      formEmail: {
        email: {
          required,
          email,
        },
        password: {
          required,
        },
      },
      formEmailInvite: {
        email: {
          required,
          email,
        },
      },
      formPassword: {
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
        formEmail: {
          email: this.$store.state.email,
          password: null,
        },
        formEmailInvite: {
          email: null,
        },
        formPassword: {
          password: null,
        },
        invites: [],
        sending: false,
        verifyEmailDialog: false,
      };
    },

    created () {
      const query = `
        query {
          getChannelByID {
            invites
          }
        }
      `;

      return this.$axios.post("/api/private", { query })
      .then(({ data: { getChannelByID: channel }}) => {
        this.invites = channel.invites;
      });
    },

    methods: {

      openVerifyEmailDialog () {
        this.verifyEmailDialog = true;
        setTimeout(() => { document.querySelector(".md-dialog-content input").type = "password" }, 100);
      },

      updateChannelPassword () {
        this.$v.formPassword.$touch();
        if (this.$v.formPassword.$invalid) return;

        this.sending = true;

        const data = {
          email: this.$store.state.email,
          old_password: this.formPassword.passwordOld,
          new_password: this.formPassword.passwordNew,
        };

        return this.$store.dispatch("updateChannelPassword", data)
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

      sendEmailInvite () {
        this.$v.formEmailInvite.$touch();
        if (this.$v.formEmailInvite.$invalid) return;
        if (this.invites.indexOf(this.formEmailInvite.email) >= 0) return;

        this.sending = true;

        return this.$store.dispatch("sendEmailInvite", this.formEmailInvite.email)
        .then(() => {
          this.$store.dispatch("success", {
            message: "Invitation email sent successfully.",
            status: 200
          });
          this.formEmailInvite.email = null;
          this.$v.$reset();
        })
        .catch(error => {
          this.$store.dispatch("error", error);
        })
        .finally(() => {
          this.sending = false;
        });
      },

      updateChannelEmail () {
        this.sending = true;

        const data = {
          email: this.$store.state.email,
          password: this.formEmail.password,
          new_email: this.formEmail.email,
        };
        
        return this.$store.dispatch("updateChannelEmail", data)
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
