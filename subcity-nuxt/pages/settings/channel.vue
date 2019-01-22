<template>
  <section class="container">

    <div class="md-layout md-gutter" style="justify-content: space-around;">

      <div class="md-layout-item md-size-30 md-size-medium-33 md-small-size-100">
        <div class="md-layout md-gutter">
          <div class="md-layout-item md-small-size-40 md-xsmall-size-100">
            <md-card class="md-elevation-5" style="margin: 0;">
              <md-card-media md-ratio="1:1" style="position: relative;background-color: rgba(0, 0, 0, .26);">
                <div id="profile-upload" :class="{ loading: _imageProgress }" @click="openImageInput()">
                  <md-icon class="md-size-2x">library_add</md-icon>
                  <md-progress-spinner id="image-spinner" md-mode="determinate" :md-value="_imageProgress"></md-progress-spinner>
                  <input @change="setPreview"
                    ref="imageInput"
                    type="file"
                    accept="image/jpeg, image/png"
                    hidden/>
                </div>
                <img :src="profileURL" class="image" @error="this.style.display='none'"/>
              </md-card-media>
              <md-card-header>
                <md-card-header-text>
                  <div class="md-title">{{ form.title }}</div>
                  <nuxt-link class="link" :to="`/${ form.slug || channel.channel_id }`">https://sub.city/{{ form.slug || channel.channel_id }}</nuxt-link>
                </md-card-header-text>
              </md-card-header>
              <md-divider/>
              <md-card-actions id="funding">
                <md-radio v-model="form.funding" value="per_month" class="md-primary" style="padding: 0 8px;" :disabled="sending">
                  Monthly
                </md-radio>
                <md-radio v-model="form.funding" value="per_release" class="md-primary" style="padding: 0 8px;" :disabled="sending">
                  Release
                </md-radio>
              </md-card-actions>
            </md-card>
          </div>

          <div class="md-layout-item md-small-size-60 md-xsmall-size-100">
            <md-card class="md-elevation-2" id="tier-one">
              <md-card-header>
                <md-card-header-text style="display: flex; justify-content: space-between;">
                  <div class="md-title">{{ form.tierOneTitle || "Low Tier" }}</div>  
                  <md-checkbox v-model="form.tierOneActive" class="md-primary" style="margin-right: 0;" disabled>
                    Active
                  </md-checkbox>            
                </md-card-header-text>
              </md-card-header>
              <md-card-content>
                <div style="display: flex; align-items: center;">
                  <div class="md-display-1" style="margin-right: 16px; min-width: 33%; white-space: nowrap;" v-cents="form.tierOneRate"></div>
                  <div style="flex: 1;">
                    <md-field :class="getValidationClass('tierOneRate')">
                      <label for="tierOneRate">Rate</label>
                      <md-input name="tierOneRate" id="tierOneRate" v-model="form.tierOneRate" :disabled="sending" v-numbers="{ max: 6 }" />
                      <span class="md-helper-text">Enter amount in cents.</span>
                      <span class="md-error" v-if="!$v.form.tierOneRate.required">Rate is required.</span>
                      <span class="md-error" v-else-if="!$v.form.tierOneRate.between">Rate must be between 499 and 999999 cents.</span>
                    </md-field>
                  </div>
                </div>
                <md-field :class="getValidationClass('tierOneTitle')">
                  <label for="tierOneTitle">Title</label>
                  <md-input name="tierOneTitle" id="tierOneTitle" v-model="form.tierOneTitle" :disabled="sending" md-counter="30" />
                  <span class="md-error" v-if="!$v.form.tierOneTitle.required">Title is required.</span>
                  <span class="md-error" v-else-if="!$v.form.tierOneRate.maxLength">Title is too long.</span>
                </md-field>
                <md-field :class="getValidationClass('tierOneDescription')">
                  <label for="tierOneDescription">Description</label>
                  <md-textarea name="tierOneDescription" id="tierOneDescription" v-model="form.tierOneDescription" :disabled="sending" md-counter="300" md-autogrow></md-textarea>
                  <span class="md-error" v-if="!$v.form.tierOneDescription.required">Description is required.</span>
                  <span class="md-error" v-else-if="!$v.form.tierOneDescription.maxLength">Description is too long.</span>
                </md-field>
              </md-card-content>
            </md-card>

            <md-card class="md-elevation-2" style="margin: 0 0 16px;">
              <md-card-header>
                <md-card-header-text style="display: flex; justify-content: space-between;">
                  <div class="md-title">{{ form.tierTwoTitle || "Mid Tier" }}</div>  
                  <md-checkbox v-model="form.tierTwoActive" class="md-primary" style="margin-right: 0;" :disabled="sending">
                    Active
                  </md-checkbox>            
                </md-card-header-text>
              </md-card-header>
              <md-card-content v-show="form.tierTwoActive">
                <div style="display: flex; align-items: center;">
                  <div class="md-display-1" style="margin-right: 16px; min-width: 33%" v-cents="form.tierTwoRate"></div>
                  <div style="flex: 1;">
                    <md-field :class="getValidationClass('tierTwoRate')">
                      <label for="tierTwoRate">Rate</label>
                      <md-input name="tierTwoRate" id="tierTwoRate" v-model="form.tierTwoRate" :disabled="sending" v-numbers="{ max: 6 }" />
                      <span class="md-helper-text">Enter amount in cents.</span>
                      <span class="md-error" v-if="!$v.form.tierTwoRate.required">Rate is required.</span>
                      <span class="md-error" v-else-if="!$v.form.tierTwoRate.between">Rate must be between 499 and 999999 cents.</span>
                    </md-field>
                  </div>
                </div>
                <md-field :class="getValidationClass('tierTwoTitle')">
                  <label for="tierTwoTitle">Title</label>
                  <md-input name="tierTwoTitle" id="tierTwoTitle" v-model="form.tierTwoTitle" :disabled="sending" md-counter="30" />
                  <span class="md-error" v-if="!$v.form.tierTwoTitle.required">Title is required.</span>
                  <span class="md-error" v-else-if="!$v.form.tierTwoRate.maxLength">Title is too long.</span>
                </md-field>
                <md-field :class="getValidationClass('tierTwoDescription')">
                  <label for="tierTwoDescription">Description</label>
                  <md-textarea name="tierTwoDescription" id="tierTwoDescription" v-model="form.tierTwoDescription" :disabled="sending" md-counter="300" md-autogrow></md-textarea>
                  <span class="md-error" v-if="!$v.form.tierTwoDescription.required">Description is required.</span>
                  <span class="md-error" v-else-if="!$v.form.tierTwoDescription.maxLength">Description is too long.</span>
                </md-field>
              </md-card-content>
            </md-card>

            <md-card class="md-elevation-2" style="margin: 0 0 16px;">
              <md-card-header>
                <md-card-header-text style="display: flex; justify-content: space-between;">
                  <div class="md-title">{{ form.tierThreeTitle || "High Tier" }}</div>  
                  <md-checkbox v-model="form.tierThreeActive" class="md-primary" style="margin-right: 0;" :disabled="sending">
                    Active
                  </md-checkbox>            
                </md-card-header-text>
              </md-card-header>
              <md-card-content v-show="form.tierThreeActive">
                <div style="display: flex; align-items: center;">
                  <div class="md-display-1" style="margin-right: 16px; min-width: 33%" v-cents="form.tierThreeRate"></div>
                  <div style="flex: 1;">
                    <md-field :class="getValidationClass('tierThreeRate')">
                      <label for="tierThreeRate">Rate</label>
                      <md-input name="tierThreeRate" id="tierThreeRate" v-model="form.tierThreeRate" :disabled="sending" v-numbers="{ max: 6 }" />
                      <span class="md-helper-text">Enter amount in cents.</span>
                      <span class="md-error" v-if="!$v.form.tierThreeRate.required">Rate is required.</span>
                      <span class="md-error" v-else-if="!$v.form.tierThreeRate.between">Rate must be between 499 and 999999 cents.</span>
                    </md-field>
                  </div>
                </div>
                <md-field :class="getValidationClass('tierThreeTitle')">
                  <label for="tierThreeTitle">Title</label>
                  <md-input name="tierThreeTitle" id="tierThreeTitle" v-model="form.tierThreeTitle" :disabled="sending" md-counter="30" />
                  <span class="md-error" v-if="!$v.form.tierThreeTitle.required">Title is required.</span>
                  <span class="md-error" v-else-if="!$v.form.tierThreeRate.maxLength">Title is too long.</span>
                </md-field>
                <md-field :class="getValidationClass('tierThreeDescription')">
                  <label for="tierThreeDescription">Description</label>
                  <md-textarea name="tierThreeDescription" id="tierThreeDescription" v-model="form.tierThreeDescription" :disabled="sending" md-counter="300" md-autogrow></md-textarea>
                  <span class="md-error" v-if="!$v.form.tierThreeDescription.required">Description is required.</span>
                  <span class="md-error" v-else-if="!$v.form.tierThreeDescription.maxLength">Description is too long.</span>
                </md-field>
              </md-card-content>
            </md-card>
          </div>
        </div>
      </div>

      <div class="md-layout-item md-size-50 md-medium-size-66 md-small-size-100 content">
        <md-toolbar id="display-title" class="md-transparent" style="padding: 0;" md-elevation="0">
          <span class="md-display-3">{{ form.title || "Untitled" }}</span>
          <div class="md-toolbar-section-end">
            <md-button class="md-primary md-raised md-icon-button" @click="validateFields()" v-if="!sending">
              <md-icon>save</md-icon>
            </md-button>
            <div style="height: 30px; margin-left: 16px;" v-else>
              <md-progress-spinner class="md-primary" :md-diameter="30" :md-stroke="3" md-mode="indeterminate"/>
            </div>
          </div>
        </md-toolbar>
        
        <md-divider class="divider"/>
        <div class="md-layout md-gutter">
          <div class="md-layout-item md-size-100">
            <md-field :class="getValidationClass('title')">
              <label for="title">Title</label>
              <md-input name="title" id="title" autocomplete="title" v-model="form.title" :disabled="sending" md-counter="30" max="30"/>
              <span class="md-error" v-if="!$v.form.title.required">Title is required.</span>
              <span class="md-error" v-else-if="!$v.form.title.maxLength">Title is too long.</span>
            </md-field>
            <md-field :class="getValidationClass('slug')">
              <label for="slug">Slug</label>
              <span class="md-prefix">https://sub.city/</span>
              <md-input name="slug" id="slug" autocomplete="slug" v-model="form.slug" :disabled="sending" md-counter="30" />
              <span class="md-error" v-if="!$v.form.slug.required">Slug is required.</span>
              <span class="md-error" v-else-if="!$v.form.slug.maxLength">Slug is too long.</span>
              <span class="md-error" v-else-if="!$v.form.slug.alphaNum">Slug must be alphanumerical characters only.</span>
            </md-field>
            <md-field :class="getValidationClass('description')">
              <label for="description">Description</label>
              <md-textarea name="description" id="description" v-model="form.description" :disabled="sending" md-counter="5000" md-autogrow></md-textarea>
              <span class="md-error" v-if="!$v.form.description.required">Description is required.</span>
              <span class="md-error" v-else-if="!$v.form.description.maxLength">Description is too long.</span>
            </md-field>
            <md-field>
              <label>Payload file</label>
              <md-file v-model="form.payload" @md-change="setPayloadFile" :disabled="sending"/>
            </md-field>

            <md-empty-state
              md-icon="perm_media"
              md-label="Create your first release"
              md-description="Creating project, you'll be able to upload your design and collaborate with people.">
              <md-button class="md-primary md-raised" to="/settings/releases">Create release</md-button>
            </md-empty-state>
          </div>
        </div>
      </div>

      <div class="md-layout-item md-size-20 md-medium-size-100" style="margin-top: 40px;">
        <md-card style="margin: 0;">
          <div style="display: flex;justify-content:space-between;align-items: center;padding:16px 0 16px;">
            <div style="display: flex; align-items: center;">
              <md-icon style="margin: 0 16px;">attach_money</md-icon>
              <span class="md-title">Transfers</span>
            </div>
            <md-badge v-if="transfers.length" class="md-square md-primary" :md-content="transfers.length" style="position: relative; right: 0;margin: 0 16px;"/>
          </div>
          <md-divider/> 
          <md-list v-if="transfers.length">
            <md-list-item v-for="transfer in transfers" :key="transfer.time_created">
              <strong style="color: #00c853;">$ {{ (transfer.amount / 100).toFixed(2) }}</strong>
              <div>{{ parseDate(transfer.time_created) }}</div>
            </md-list-item>
          </md-list>
        </md-card>
      </div>
    </div>
   
  </section>
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

  export default {
    name: "SettingsChannel",
    mixins: [validationMixin],
    validations: {
      form: {
        description: {
          required,
          maxLength: maxLength(5000),
        },
        linkDiscord: { url },
        linkFacebook: { url },
        linkInstagram: { url },
        linkTwitch: { url },
        linkTwitter: { url },
        linkYoutube: { url },
        slug: {
          required,
          alphaNum,
          maxLength: maxLength(30),
        },
        tierOneActive: {
          required
        },
        tierOneTitle: {
          required,
          maxLength: maxLength(30),
        },
        tierOneDescription: {
          required,
          maxLength: maxLength(300)
        },
        tierOneRate: {
          required,
          numeric,
          between: between(499, 999999),
        },
        tierTwoActive: {
          required
        },
        tierTwoTitle: {
          required: requiredIf(({ tierTwoActive }) => tierTwoActive),
          maxLength: maxLength(30),
        },
        tierTwoDescription: {
          required: requiredIf(({ tierTwoActive }) => tierTwoActive),
          maxLength: maxLength(300)
        },
        tierTwoRate: {
          required: requiredIf(({ tierTwoActive }) => tierTwoActive),
          numeric,
          between: between(499, 999999),
        },
        tierThreeActive: {
          required
        },
        tierThreeTitle: {
          required: requiredIf(({ tierThreeActive }) => tierThreeActive),
          maxLength: maxLength(30),
        },
        tierThreeDescription: {
          required: requiredIf(({ tierThreeActive }) => tierThreeActive),
          maxLength: maxLength(300)
        },
        tierThreeRate: {
          required: requiredIf(({ tierThreeActive }) => tierThreeActive),
          numeric,
          between: between(499, 999999),
        },
        title: {
          required,
          maxLength: maxLength(30),
        },
        unlisted: {
          required
        }
      }
    },

    head () {
      return {
        title: `Channel || sub.city`,
      }
    },

    fetch ({ store, redirect }) {
      if (!store.state.role || store.state.role !== 'channel') {
        return redirect('/portal?login=true')
      }
    },

    data: () => ({
      channel: {},
      transfers: [],
      imageProgress: 0,
      fileProgress: 0,
      profileURL: null,
      form: {},
      sending: true,
      DATA_HOST: process.env.DATA_HOST,
    }),

    mounted () {

      const query = `
        query {
          getChannelByID {
            channel_id,
            description { raw },
            funding,
            links {
              discord,
              facebook,
              instagram,
              twitch,
              twitter,
              youtube,
            },
            payload,
            slug,
            tiers {
              _1 {
                active,
                title,
                description { raw },
                rate
              },
              _2 {
                active,
                title,
                description { raw },
                rate
              },
              _3 {
                active,
                title,
                description { raw },
                rate
              },
            },
            time_created,
            time_updated,
            title,
            unlisted,

            subscriptions {
              subscription_id,
              time_created,
            },

            transfers {
              amount,
              fee_platform,
              fee_processor,
              time_created,
            },
          }
        }
      `;

      return this.$axios.post("/api/private", { query })
      .then(({ data: { getChannelByID: channel }}) => {

        const form = {
          description: channel.description.raw,
          funding: channel.funding,
          linkDiscord: channel.links.discord,
          linkFacebook: channel.links.facebook,
          linkInstagram: channel.links.instagram,
          linkTwitch: channel.links.twitch,
          linkTwitter: channel.links.twitter,
          linkYoutube: channel.links.youtube,
          payload: channel.payload,
          slug: channel.slug !== channel.channel_id ? channel.slug : null,
          tierOneActive: channel.tiers._1.active,
          tierOneTitle: channel.tiers._1.title,
          tierOneDescription: channel.tiers._1.description.raw,
          tierOneRate: channel.tiers._1.rate,
          tierTwoActive: channel.tiers._2.active,
          tierTwoTitle: channel.tiers._2.title,
          tierTwoDescription: channel.tiers._2.description.raw,
          tierTwoRate: channel.tiers._2.rate,
          tierThreeActive: channel.tiers._3.active,
          tierThreeTitle: channel.tiers._3.title,
          tierThreeDescription: channel.tiers._3.description.raw,
          tierThreeRate: channel.tiers._3.rate,
          title: channel.title,
          unlisted: channel.unlisted
        };

        this.channel = channel;
        this.transfers = channel.transfers;
        this.form = form;
        this.profileURL = channel.time_updated ? `${this.DATA_HOST}/channels/${channel.channel_id}/profile.jpeg` : null;
      })
      .catch(error => this.$store.dispatch("error", error))
      .finally(() => { this.sending = false });
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

      updateChannel () {
        this.sending = true;

        const data = {        
          description: this.form.description,
          funding: this.form.funding,
          links: {
            discord: this.form.linkDiscord,
            facebook: this.form.linkFacebook,
            instagram: this.form.linkInstagram,
            twitch: this.form.linkTwitch,
            twitter: this.form.linkTwitter,
            youtube: this.form.linkYoutube,
          },
          payload: this.form.payload,
          ...(this.form.slug !== this.channel.slug && { slug: this.form.slug }),
          title: this.form.title,
          unlisted: this.form.unlisted
        };

        // Tier 1

        if (this.form.tierOneTitle !== this.channel.tiers._1.title) {
          data.tiers = data.tiers || {};
          data.tiers._1 = data.tiers._1 || {};
          data.tiers._1.title = this.form.tierOneTitle;
        }

        if (this.form.tierOneDescription !== this.channel.tiers._1.description.raw) {
          data.tiers = data.tiers || {};
          data.tiers._1 = data.tiers._1 || {};
          data.tiers._1.description = this.form.tierOneDescription;
        }

        if (parseInt(this.form.tierOneRate) !== this.channel.tiers._1.rate) {
          data.tiers = data.tiers || {};
          data.tiers._1 = data.tiers._1 || {};
          data.tiers._1.rate = parseInt(this.form.tierOneRate);
        }

        // Tier 2

        if (this.form.tierTwoActive !== this.channel.tiers._2.active) {
          data.tiers = data.tiers || {};
          data.tiers._2 = data.tiers._2 || {};
          data.tiers._2.active = this.form.tierTwoActive;
        }

        if (this.form.tierTwoActive && this.form.tierTwoTitle !== this.channel.tiers._2.title) {
          data.tiers = data.tiers || {};
          data.tiers._2 = data.tiers._2 || {};
          data.tiers._2.title = this.form.tierTwoTitle;
        }

        if (this.form.tierTwoActive && this.form.tierTwoDescription !== this.channel.tiers._2.description.raw) {
          data.tiers = data.tiers || {};
          data.tiers._2 = data.tiers._2 || {};
          data.tiers._2.description = this.form.tierTwoDescription;
        }

        if (this.form.tierTwoActive && parseInt(this.form.tierTwoRate) !== this.channel.tiers._2.rate) {
          data.tiers = data.tiers || {};
          data.tiers._2 = data.tiers._2 || {};
          data.tiers._2.rate = parseInt(this.form.tierTwoRate);
        }

        // Tier 3

        if (this.form.tierThreeActive !== this.channel.tiers._3.active) {
          data.tiers = data.tiers || {};
          data.tiers._3 = data.tiers._3 || {};
          data.tiers._3.active = this.form.tierThreeActive;
        }

        if (this.form.tierThreeActive && this.form.tierThreeTitle !== this.channel.tiers._3.title) {
          data.tiers = data.tiers || {};
          data.tiers._3 = data.tiers._3 || {};
          data.tiers._3.title = this.form.tierThreeTitle;
        }

        if (this.form.tierThreeActive && this.form.tierThreeDescription !== this.channel.tiers._3.description.raw) {
          data.tiers = data.tiers || {};
          data.tiers._3 = data.tiers._3 || {};
          data.tiers._3.description = this.form.tierThreeDescription;
        }

        if (this.form.tierThreeActive && parseInt(this.form.tierThreeRate) !== this.channel.tiers._3.rate) {
          data.tiers = data.tiers || {};
          data.tiers._3 = data.tiers._3 || {};
          data.tiers._3.rate = parseInt(this.form.tierThreeRate);
        }

        return Promise.all([
          this.$store.dispatch("updateChannel", data),
          this.uploadFiles()
        ])
        .then(() => {
          this.$store.dispatch("success", {
            message: "Channel updated successfully.",
            status: 200
          });

          // Update channel object without fetching twice.

          this.channel.description.raw = this.form.description;
          this.channel.funding = this.form.funding;
          this.channel.links.discord = this.form.linkDiscord;
          this.channel.links.facebook = this.form.linkFacebook;
          this.channel.links.instagram = this.form.linkInstagram;
          this.channel.links.twitch = this.form.linkTwitch;
          this.channel.links.twitter = this.form.linkTwitter;
          this.channel.links.youtube = this.form.linkYoutube;
          this.channel.payload = this.form.payload;
          this.channel.slug = this.form.slug;
          this.channel.tiers._1.active = this.form.tierOneActive;
          this.channel.tiers._1.title = this.form.tierOneTitle;
          this.channel.tiers._1.description.raw = this.form.tierOneDescription;
          this.channel.tiers._1.rate = this.form.tierOneRate;
          this.channel.tiers._2.active = this.form.tierTwoActive;
          this.channel.tiers._2.title = this.form.tierTwoTitle;
          this.channel.tiers._2.description.raw = this.form.tierTwoDescription;
          this.channel.tiers._2.rate = this.form.tierTwoRate;
          this.channel.tiers._3.active = this.form.tierThreeActive;
          this.channel.tiers._3.title = this.form.tierThreeTitle;
          this.channel.tiers._3.description.raw = this.form.tierThreeDescription;
          this.channel.tiers._3.rate = this.form.tierThreeRate;
          this.channel.title = this.form.title;
          this.channel.unlisted = this.form.unlisted;
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
          this.updateChannel();
        }
      },

      openImageInput () {
        this.$refs.imageInput.click();
      },

      parseDate (unix_timestamp) {
        const date = new Date(unix_timestamp);
        return `${date.getDate()}/${date.getMonth()+1}/${date.getFullYear()}`;
      },

      setPayloadFile (files) {
        this.payload = files[0];
      },

      setPreview (event) {
        if (event.target.files && event.target.files[0]) {
          const file = event.target.files[0];
          const reader = new FileReader();
          reader.onload = event => {
            this.profileURL = event.target.result;
          };
          reader.readAsDataURL(file);
        }
      },

      async uploadImageFile () {
        const file = this.$refs.imageInput.files[0];
        if (!file  || !file.size) return Promise.resolve();

        const data = {
          file,
          type: "profile",
          progress (event) {
            this.imageProgress = event.loaded / event.total * 100;
          }
        };

        return this.$store.dispatch("uploadFile", data)
        .finally(() => {
          this.imageProgress = 0;
        });
      },

      uploadPayloadFile (time_created) {
        if (!this.payload) return Promise.resolve();

        const data = {
          file: this.payload,
          time_created,
          type: "payload",
          progress (event) {
            this.imageProgress = event.loaded / event.total * 100;
          }
        };

        return this.$store.dispatch("uploadFile", data)
        .finally(() => {
          this.payloadProgress = 0;
        });
      },

      uploadFiles (time_created) {
        return Promise.all([
          this.uploadImageFile(time_created),
          this.uploadPayloadFile(time_created)
        ]);
      }
    },

    computed: {

      _imageProgress: {
        get () {
          return this.imageProgress;
        },
        set (progress) {
          this.imageProgress = progress;
        }
      }
    }
  }
</script>

<style lang="scss" scoped>

  .container {
    max-width: 1200px;
    margin: 0 auto;
  }

  .content {
    margin-top: 40px;

    @media (max-width: 960px) {
      position: relative;
      top: 16px;
    }
  }

  #description {
    @media (min-width: 960px) {
      min-height: 250px !important;
      max-height: 500px !important;
    }
  }

  #display-title {

    @media (max-width: 960px) {
      display: none;
    }
  }

  .divider {
    width: 200vw;
    margin: 20px 0 20px;
    left: -200%;
    position: relative;
  }

  .image {
    object-fit: cover;
    width: 100%;
    height: 100%;
  }

  #funding {
    justify-content: space-around;

    @media (min-width: 600px) {
      flex-direction: column;
    }

    @media (min-width: 960px) {
      flex-direction: row;
    }
  }

  #image-spinner {
    display: none;
  }

  .link {
    color: #999 !important;

    &:hover {
      color: #666 !important;
    }
  }

  #profile-upload {
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    top: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
    opacity: .5;
    transition: .3s cubic-bezier(.4,0,.2,1);

    &.loading {
      pointer-events: none;

      .md-icon {
        display: none;
      }
      #image-spinner {
        display: block;
      }
    }

    .md-icon {
      color: white;
    }

    &:hover {
      opacity: 1;
      cursor: pointer;
    }
  }

  #tier-one {
    margin: 16px 0 16px;

    @media (min-width: 600px) {
      margin: 0 0 16px;
    }

    @media (min-width: 960px) {
      margin: 40px 0 16px;
    }
  }

</style>
