<template>
  <div style="margin-bottom: 0;">

    <section id="section-1">
      <div class="container">
        <div class="text">
          <div class="preheadline"><em>Teamwork, now fueling</em></div>
          <div class="bold-italic headline">Subscriptions</div>
          <p class="subtext">This is <nuxt-link to="/">sub.city</nuxt-link>, a collaborative subscription platform. It's like <a href="https://patreon.com">Patreon</a> for teams. What are you waiting for &mdash; Create a channel, invite your friends, and start earning together!</p>
          <md-button to="/site/guide" class="md-primary md-raised" style="margin-top: 50px; margin-left: 16px;">Learn more</md-button>
        </div>
        <div class="background">
          <img src="~/static/images/fuel.svg" />
        </div>
        <div id="coin-1" class="coin"></div>
        <div id="coin-2" class="coin"></div>
        <div id="coin-3" class="coin"></div>
      </div>
    </section>

    <section id="section-2">
      <div class="container">
        <div class="preheadline"><em>What in the world is</em></div>
        <div class="bold-italic headline">Syndication?</div>
        <p class="subtext">The sub.city platform revolves around <em>syndicates</em>. A syndicate is a group of content creators who offer their content as a bundled subscription. By subscribing to a syndicate, subscribers gain simultaneous access to the content of all members of the syndicate. The resulting revenue is then split between the syndicate's members. Creators can thus attract more subscribers and increase the cumulative value of the content they offer.</p>

          <div class="md-layout md-gutter">
            <div class="md-layout-item md-size-50 md-xsmall-size-100">
              <div class="infographic">
                <img src="~/static/images/syndicates_1.png"/>
                <div class="md-display-1">Creator earns: <div><strong>$ 999.00*</strong></div></div>
              </div>
              <span id="asterisk">* The platform's processing fee is 5.0% for both syndicates and individual channels.</span>
            </div>
            <div class="md-layout-item md-size-50 md-xsmall-size-100">
              <div class="infographic">
                <img src="~/static/images/syndicates_2.png"/>
                <div class="md-display-1">Creator earns: <div><strong>$ 6,663.33*</strong></div></div>
              </div>
            </div>
          </div>
      </div>
    </section>

    <section id="section-3" class="container">
      <div class="md-layout md-gutter">
        <div class="md-layout-item md-size-100" style="margin-bottom: 60px;">
          <div class="md-display-3" style="text-align: center; margin: 0 0 32px; text-transform: uppercase; line-height: 50px;"><strong>Welcome to Revolutionary</strong></div>
          <p class="subtext">Well, it's not <em>actually</em> revolutionary. We just took a good idea and made it even better. Nobody likes to work alone &mdash; leverage the power of teamwork to deliver the best content to your subscribers and garner the best returns for your channel.</p>
        </div>
        <div class="md-layout-item md-size-25 md-small-size-50 md-xsmall-size-100">
          <md-card md-with-hover>
            <md-card-header>
              <md-icon class="md-size-3x">recent_actors</md-icon>
              <div class="action">Start A Channel</div>
            </md-card-header>
            <md-card-content>
              <p>If you've <nuxt-link to="/site/guide">received an invite</nuxt-link> to the platform, get started by publishing your channel. Once published, your channel is "live" and can begin accepting subscriptions.</p>
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
              <p>Subscribers don't pay for <em>posts</em>. Subscribers pay for premium content. On sub.city, there are no posts, but <em>releases</em> &mdash; an official publication of your content.</p>
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
              <p>Boost your reach and revenue by joining a syndicate. Or better yet &mdash; found your own! Syndicates are the lifeblood of the platform and drive collaboration between channels.</p>
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
              <p>Band together with other creators from your niche and dominate the scene <em>together</em>. Syndicated content is an attractive offer to existing fans and new subscribers alike.</p>
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

    <section id="section-4">
      <div class="container">
        <div class="city">
          <img id="city" src="~/assets/images/city.svg" />
        </div>
        <div class="text">
          <div class="headline bold-italic" style="margin-top: 0;">Apply today!</div>
          <p class="subtext" style="margin: 32px 0;">While sub.city is currently <em>invite-only</em>, new channels can apply for registration by sending an informal inquiry to <a href="mailto:apply@sub.city">apply@sub.city</a>. Visit our <nuxt-link to="/site/guide">guide</nuxt-link> for more information. Subscribers can create a <nuxt-link to="/portal">subscriber account</nuxt-link> any time. We hope to hear from you soon!</p>
<!--           <form novalidate @submit.prevent="validateFields">
            <md-field :class="getValidationClass('email')">
              <label for="email">Email</label>
              <md-input type="email" name="email" id="email" autocomplete="email" v-model="form.email" :disabled="sending" />
              <span class="md-error" v-if="!$v.form.email.required">Email is required.</span>
              <span class="md-error" v-else-if="!$v.form.email.email">Invalid email.</span>
            </md-field>
            <md-button type="submit" class="md-primary md-raised" style="float: right; margin: 0;" :disabled="sending">Request Access</md-button>
          </form> -->
        </div>
      </div>
    </section>

    <section id="section-5" style="padding: 80px 0;">
      <div class="container">
        <div style="display: flex; flex-direction: column; justify-content: center;">
          <md-icon class="md-size-3x" style="margin: 0 auto 40px;">verified_user</md-icon>
          <div class="md-display-3" style="text-align: center; margin: 0 0 32px; text-transform: uppercase; line-height: 50px;"><strong>Freedom of Speech</strong></div>
          <p class="subtext">This site is built by and targeted at creators who champion <strong>traditional Western values</strong>. We support <em>absolute liberty</em> regarding the expression of opinion and will uphold your right to speak your mind to the furthest extent of the law.</p>
        </div>
      </div>
    </section>
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

  .headline {
    font-size: 80px;
    line-height: 80px;
    text-transform: uppercase;
    color: #333;
    margin: 30px 0;

    @media screen and (max-width: 960px) {
      font-size: 60px;
      line-height: 60px;
    }

    @media screen and (max-width: 600px) {
      margin: 24px 0;
      font-size: 40px;
      line-height: 40px;
    }
  }

  .preheadline {
    font-size: 36px;
    color: #666;

    @media screen and (max-width: 960px) {
      font-size: 28px;
    }

    @media screen and (max-width: 600px) {
      font-size: 20px;
    }
  }

  .md-display-3 {
    @media screen and (max-width: 600px) {
      font-size: 40px;
    }
  }

  #section-1 {
    min-height: 100vh;
    display: flex;
    align-items: center;
    position: relative;
    padding: 80px 0;

    .background {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
      width: 50%;
      position: absolute;
      top: 0;
      right: -16px;
      z-index: 1;

      img {
        position: relative;
        top: 120px;
        min-height: calc(100% + 120px);
        max-width: initial;
      }

      @media screen and (max-width: 1280px) {
        opacity: .5;
        padding-bottom: 32px;
        z-index: 0;

        img {
          min-height: 100%;
          top: 0;
        }
      }

      @media screen and (max-width: 600px) {
        display: none;
      }
    }

    .coin {
      position: absolute;
      width: 90px;
      height: 65px;
      background-image: url("~/static/images/coin.png");
      background-size: cover;
      animation: spin 5000ms infinite linear;
      z-index: 1;
      opacity: .5;

      @media screen and (max-width: 600px) {
        width: 121px;
        height: 88px;
      }

      @media screen and (min-width: 601px) and (max-width: 1280px) {
        display: none;
      }

      &#coin-1 {
        top: 54%;
        left: 50px;

        @media screen and (max-width: 1500px) {
          top: initial;
          bottom: 15%;
          left: 20%;
        }

        @media screen and (max-width: 1280px) {
          bottom: 10%;
          left: 16%;
        }
      }

      &#coin-2 {
        top: 20px;
        left: 30%;
        animation-direction: reverse;

      }

      &#coin-3 {
        top: 10%;
        right: 50px;
        animation-delay: -1s;

        @media screen and (max-width: 1280px) {
          right: 10%;
          top: 40%;
        }
      }
    }

    .text {
      width: 100%;
      z-index: 10;
      position: relative;

      @media screen and (min-width: 601px) {
        width: 50%;
      }

      @media screen and (max-width: 600px) {
        text-align: center;
      }
    }
  }

  #section-2 {
    background-color: #ff5252;
    padding: 120px 16px;
    width: calc(100% + 32px);
    position: relative;
    left: -16px;

    * {
      color: white;
    }

    .md-layout {
      margin-top: 60px;

      .md-layout-item {
        display: flex;
        flex-direction: column;
        justify-content: space-between;

        @media screen and (max-width: 600px) {
          &:nth-child(2) {
            margin-top: 16px;
          }
          #asterisk {
            display: none;
          }
        }
        
        .infographic {
          text-align: center;
          border-style: dotted;
          border-color: rgba(255, 255, 255, 1);
          border-radius: 10px;
          padding: 60px;

          .md-display-1 {
            margin-top: 60px;
          }

          @media screen and (max-width: 960px) {
            padding: 40px;

            .md-display-1 {
              font-size: 30px;
            }
          }

          @media screen and (max-width: 700px) {
            padding: 40px 16px;

            .md-display-1 {
              margin-top: 40px;
            }
          }

          @media screen and (max-width: 600px) {
            padding: 40px;
          }
        }
      }
    }

    @media screen and (max-width: 600px) {
      text-align: center;
    }
  }

  #section-3 {
    padding: 120px 0 0;

    @media screen and (max-width: 960px) {
      padding-bottom: 120px;
    }

    .subtext {
      width: 60%;
      margin: 0 auto;
      text-align: center;
      padding: 0;

      @media screen and (max-width: 700px) {
        width: 80%;
      }
    }

    .md-layout {

      .md-layout-item {
        margin-bottom: 16px;

        .md-card {
          margin: 0;
          height: 100%;
          padding: 32px 16px;

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
  }

  #section-4 {
    min-height: 660px;
    position: relative;

    .container {
      display: flex;
      justify-content: center;
      align-items: center;

      .city {
        height: 760px;
        flex: 1;
        position: relative;
        margin-right: 40px;
        img {
          position: absolute;
          right: 0;
          bottom: 0;
          height: 100%;
          max-width: initial;
        }
      }

      .text {
        z-index: 10;
        width: 33%;
      }
    }

    @media screen and (max-width: 960px) {

      .city {
        position: absolute !important;
        height: 100%;
        width: 100%;
        bottom: 0;
      }

      .text {
        text-align: center;
        flex: 0 0 50%;
        background-color: white;
        padding: 60px 40px 40px;
        box-shadow: 0 3px 1px -2px rgba(0, 0, 0, .2),0 2px 2px 0 rgba(0, 0, 0, .14),0 1px 5px 0 rgba(0, 0, 0, .12);
      }

      img#city {
        opacity: .5;
        position: relative;
      }
    }

    @media screen and (max-width: 800px) {

      .text {
        flex: 0 0 70%;
      }
    }

    @media screen and (max-width: 600px) {

      .text {
        flex: 1;
      }
    }
  }

  #section-5 {
    background-color: #ff5252;
    padding: 120px 16px;
    width: calc(100% + 32px);
    position: relative;
    left: -16px;

    * {
      color: white;
    }

    .subtext {
      width: 60%;
      margin: 0 auto;
      text-align: center;
      padding: 0;

      @media screen and (max-width: 700px) {
        width: 80%;
      }
    }
  }

  .subtext {
    font-size: 20px;
    line-height: 40px;
    color: #666;
    padding-left: 16px;

    @media screen and (max-width: 960px) {
      font-size: 16px;
      line-height: 32px;
    }

    @media screen and (max-width: 600px) {
      font-size: 14px;
      line-height: 28px;
    }
  }

  .subtitle {
    font-weight: 300;
    font-size: 42px;
    color: #526488;
    word-spacing: 5px;
    padding-bottom: 15px;
  }

  .links {
    padding-top: 15px;
  }

  @keyframes spin {
    from {
        transform:rotate(0deg);
    }
    to {
        transform:rotate(360deg);
    }
}
</style>
