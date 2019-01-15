<template>
  <div>
    <md-card style="margin: 0;">
      <md-card-header style="display: flex; align-items: center; justify-content: space-between;">
        <span class="md-title">Payment methods</span>
      </md-card-header>

      <md-card-content>
        <div v-for="(source, index) in sources" :key="index" class="card-wrapper">

          <div class="cc">
            <img class="square" src="https://image.ibb.co/cZeFjx/little_square.png">
            <img class="logo" :src="`/cards/${getLogo(source.brand)}-outline.svg`">
            <p class="number">**** **** **** {{ source.last4 }}</p>
            <div class="cardholder">
              <span class="label">Card holder</span>
              <p class="info">(Name hidden)</p>
            </div>
            <div class="expiry">
              <span class="label">Expires</span>
              <p class="info">{{ addZero(source.exp_month) }}/{{ `${source.exp_year}`.slice(2,4) }}</p>
            </div>          
          </div>

          <div>
            <md-button class="md-primary" @click="setDefaultSource(source.source_id)" :disabled="sending || source.default">Set Default</md-button>
            <md-button @click="showConfirmDeleteSourceDialog(source.source_id)" :disabled="sending || source.default">Delete</md-button>
          </div>
        </div>
      </md-card-content>

      <md-card-expand>
        <md-card-actions>
          <md-card-expand-trigger>
            <md-button class="md-primary" :disabled="sending" ref="expand">Add Card</md-button>
          </md-card-expand-trigger>
        </md-card-actions>

        <md-card-expand-content>
          <md-card-content style="padding: 0 32px 24px; max-width: 400px; margin: 0 auto;">
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
            <div style="display: flex; justify-content: center; align-items: center;">
              <md-button class="md-primary" style="margin: 0" @click="createSource()" :disabled="sending">Save Card</md-button>
            </div>
          </md-card-content>
        </md-card-expand-content>
      </md-card-expand>

      <md-progress-bar md-mode="indeterminate" v-if="sending" />
    </md-card>

    <md-dialog :md-active.sync="confirmDeleteSourceDialog">
      <md-dialog-title>Confirm deletion</md-dialog-title>

      <md-dialog-content style="max-width: 400px;">
        You are about to <strong>permanently</strong> delete this card. If your default card fails and there are no remaining payment methods, your account will be deleted.<br><br>Are you sure you wish to proceed?
      </md-dialog-content>

      <md-dialog-actions>
        <md-button class="" @click="confirmDeleteSourceDialog = false">Keep Card</md-button>
        <md-button class="md-primary" @click="deleteSource()">Delete Card</md-button>
      </md-dialog-actions>
    </md-dialog>
  </div>
</template>

<script>
  import { validationMixin } from "vuelidate";
  import {
    required,
    minLength,
  } from "vuelidate/lib/validators";

  var stripe, card;

  export default {
    name: "FormPayment",
    mixins: [validationMixin],
    validations: {
      form: {
        card_complete: {
          complete: (value) => value || false
        },
        cardholder: {
          required
        },
      }
    },

    data: () => ({
      confirmDeleteSourceDialog: false,
      sources: [],
      form: {
        card_complete: false,
        cardholder: null,
      },
      selectedSource: null,
      sending: true,
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

      this.getSources();
    },

    methods: {

      addZero (number) {
        number = "" + number;
        if (number.length === 1) {
          number = "0" + number;
        }
        return number;
      },

      async createSource () {
        this.$v.$touch();
        if (this.$v.$invalid) return;

        this.sending = true;

        const { token: { id: token_id }} = await stripe.createToken(card);

        this.$store.dispatch("createSource", token_id)
        .then(() => {
          this.$store.dispatch("success", {
            message: "Card added successfully.",
            status: 200
          });
          setTimeout(() => this.$refs.expand.$el.click(), 0);
          this.clearForm();
          this.getSources();
        })
        .catch(error => {
          this.$store.dispatch("error", error);
        })
        .finally(() => {
          this.sending = false;
        });
      },

      clearForm () {
        this.$v.$reset();
        this.card_complete = false;
        this.form.cardholder = null;
        card.clear();
      },

      deleteSource () {
        this.confirmDeleteSourceDialog = false;
        this.sending = true;

        return this.$store.dispatch("deleteSource", this.selectedSource)
        .then(() => {
          this.$store.dispatch("success", {
            message: "Card deleted successfully.",
            status: 200
          });
          this.getSources();
        })
        .catch(error => {
          this.$store.dispatch("error", error);
        })
        .finally(() => {
          this.sending = false;
        });
      },

      getLogo (brand) {
        switch (brand) {
          case "Visa":
            return "visa";
          case "MasterCard":
            return "mastercard";
          case "Discover":
            return "discover";
          case "American Express":
            return "amex";
          default:
            return "card-default";
        }
      },

      getSources () {
        return this.$store.dispatch("getSources")
        .then(sources => {
          console.log(JSON.stringify(sources,null,2))
          this.sources = sources;
        })
        .catch(error => {
          this.$store.dispatch("error", error);
        })
        .finally(() => {
          this.sending = false;
        });
      },

      getValidationClass (fieldName) {
        const field = this.$v.form[fieldName];

        if (field) {
          return {
            "md-invalid": field.$invalid && field.$dirty
          };
        }
      },

      setDefaultSource (source_id) {
        this.sending = true;

        return this.$store.dispatch("setDefaultSource", source_id)
        .then(() => {
          this.$store.dispatch("success", {
            message: "Default card set successfully.",
            status: 200
          });
          this.getSources();
        })
        .catch(error => {
          this.$store.dispatch("error", error);
        })
        .finally(() => {
          this.sending = false;
        });
      },

      showConfirmDeleteSourceDialog (source_id) {
        this.selectedSource = source_id;
        this.confirmDeleteSourceDialog = true;
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

  .card-wrapper {
    display: flex;
    justify-content: space-around;
    align-items: center;
    margin-top: 16px;
  }

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

  @import url('https://fonts.googleapis.com/css?family=Space+Mono:400,400i,700,700i');

  .cc {
    font-family: "Space Mono", monospace;
    position: relative;
    width: 320px;
    height: 190px;
    padding: 18px;
    box-shadow: 1px 1px #aaa3a3;
    display: inline-block;
    width: 320px;
    height: 190px;
    background-image:  linear-gradient(to right bottom, #ee9ca7, #ff5252, #cb2d3e);
    background-repeat: no-repeat;
    background-position: center;
    background-size: cover;
    border-radius: 8px;

    .logo {
      position: absolute;
      top: 8px;
      right: 18px;
      height: 49px;
      stroke: white;
    }

    .square {
      border-radius: 5px;
      height: 30px;
    }

    .number {
      display: block;
      width: 100%;
      word-spacing: 4px;
      font-size: 20px;
      letter-spacing: 2px;
      color: #fff;
      text-align: center;
      margin-bottom: 20px;
      margin-top: 20px;
    }

    .cardholder {
      width: 75%;
      float: left;
    }

    .expiry {
      width: 25%;
      float: left;
    }

    .label {
      font-size: 10px;
      text-transform: uppercase;
      color: rgba(255,255,255,0.8);
      letter-spacing: 1px;
    }

    .info {
      margin-bottom: 0;
      margin-top: 5px;
      font-size: 16px;
      line-height: 18px;
      color: #fff;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
  }

</style>
