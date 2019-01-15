<template>
  <section class="container">

    <div class="md-layout md-gutter" style="justify-content: space-around;margin-top:16px;">

      <div class="md-layout-item md-size-30 md-size-medium-33 md-small-size-100">
        <div class="md-layout md-gutter">
          <div class="md-layout-item md-small-size-40 md-xsmall-size-100">
            <md-card class="md-elevation-5" style="margin: 0;">
              <md-card-media md-ratio="1:1" style="position: relative;background-color: rgba(0, 0, 0, .26);">
                <div id="profile-upload" :class="{ loading: _imageProgress, 'no-click': !armed }" @click="openImageInput()">
                  <md-icon class="md-size-2x">library_add</md-icon>
                  <md-progress-spinner id="image-spinner" md-mode="determinate" :md-value="_imageProgress"></md-progress-spinner>
                  <input @change="setPreview"
                    ref="imageInput"
                    type="file"
                    accept="image/jpeg, image/png"
                    hidden/>
                </div>
                <img :src="form.profileURL" class="image" @error="this.style.display='none'"/>
              </md-card-media>
              <md-card-header>
                <md-card-header-text>
                  <div class="md-title">{{ form.title }}</div>
                  <nuxt-link class="link" :to="`/${form.slug}`">https://sub.city/{{ form.slug }}</nuxt-link>
                </md-card-header-text>
              </md-card-header>
              <md-divider/>
              <md-card-actions id="funding">
                <md-radio v-model="funding" value="per_month" class="md-primary" style="padding: 0 8px;" disabled>
                  Monthly
                </md-radio>
                <md-radio v-model="funding" value="per_release" class="md-primary" style="padding: 0 8px;" disabled>
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
                      <md-input name="tierOneRate" id="tierOneRate" v-model="form.tierOneRate" :disabled="sending || !armed" v-numbers="{ max: 6 }" />
                      <span class="md-helper-text">Enter amount in cents.</span>
                      <span class="md-error" v-if="!$v.form.tierOneRate.required">Rate is required.</span>
                      <span class="md-error" v-else-if="!$v.form.tierOneRate.between">Rate must be between 499 and 999999 cents.</span>
                    </md-field>
                  </div>
                </div>
                <md-field :class="getValidationClass('tierOneTitle')">
                  <label for="tierOneTitle">Title</label>
                  <md-input name="tierOneTitle" id="tierOneTitle" v-model="form.tierOneTitle" :disabled="sending || !armed" md-counter="25" />
                  <span class="md-error" v-if="!$v.form.tierOneTitle.required">Title is required.</span>
                  <span class="md-error" v-else-if="!$v.form.tierOneRate.maxLength">Title is too long.</span>
                </md-field>
                <md-field :class="getValidationClass('tierOneDescription')">
                  <label for="tierOneDescription">Description</label>
                  <md-textarea name="tierOneDescription" id="tierOneDescription" v-model="form.tierOneDescription" :disabled="sending || !armed" md-counter="120" md-autogrow></md-textarea>
                  <span class="md-error" v-if="!$v.form.tierOneDescription.required">Description is required.</span>
                  <span class="md-error" v-else-if="!$v.form.tierOneDescription.maxLength">Description is too long.</span>
                </md-field>
              </md-card-content>
            </md-card>

            <md-card class="md-elevation-2" style="margin: 0 0 16px;">
              <md-card-header>
                <md-card-header-text style="display: flex; justify-content: space-between;">
                  <div class="md-title">{{ form.tierTwoTitle || "Mid Tier" }}</div>  
                  <md-checkbox v-model="form.tierTwoActive" class="md-primary" style="margin-right: 0;" :disabled="sending || !armed">
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
                      <md-input name="tierTwoRate" id="tierTwoRate" v-model="form.tierTwoRate" :disabled="sending || !armed" v-numbers="{ max: 6 }" />
                      <span class="md-helper-text">Enter amount in cents.</span>
                      <span class="md-error" v-if="!$v.form.tierTwoRate.required">Rate is required.</span>
                      <span class="md-error" v-else-if="!$v.form.tierTwoRate.between">Rate must be between 499 and 999999 cents.</span>
                    </md-field>
                  </div>
                </div>
                <md-field :class="getValidationClass('tierTwoTitle')">
                  <label for="tierTwoTitle">Title</label>
                  <md-input name="tierTwoTitle" id="tierTwoTitle" v-model="form.tierTwoTitle" :disabled="sending || !armed" md-counter="25" />
                  <span class="md-error" v-if="!$v.form.tierTwoTitle.required">Title is required.</span>
                  <span class="md-error" v-else-if="!$v.form.tierTwoRate.maxLength">Title is too long.</span>
                </md-field>
                <md-field :class="getValidationClass('tierTwoDescription')">
                  <label for="tierTwoDescription">Description</label>
                  <md-textarea name="tierTwoDescription" id="tierTwoDescription" v-model="form.tierTwoDescription" :disabled="sending || !armed" md-counter="120" md-autogrow></md-textarea>
                  <span class="md-error" v-if="!$v.form.tierTwoDescription.required">Description is required.</span>
                  <span class="md-error" v-else-if="!$v.form.tierTwoDescription.maxLength">Description is too long.</span>
                </md-field>
              </md-card-content>
            </md-card>

            <md-card class="md-elevation-2" style="margin: 0 0 16px;">
              <md-card-header>
                <md-card-header-text style="display: flex; justify-content: space-between;">
                  <div class="md-title">{{ form.tierThreeTitle || "High Tier" }}</div>  
                  <md-checkbox v-model="form.tierThreeActive" class="md-primary" style="margin-right: 0;" :disabled="sending || !armed">
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
                      <md-input name="tierThreeRate" id="tierThreeRate" v-model="form.tierThreeRate" :disabled="sending || !armed" v-numbers="{ max: 6 }" />
                      <span class="md-helper-text">Enter amount in cents.</span>
                      <span class="md-error" v-if="!$v.form.tierThreeRate.required">Rate is required.</span>
                      <span class="md-error" v-else-if="!$v.form.tierThreeRate.between">Rate must be between 499 and 999999 cents.</span>
                    </md-field>
                  </div>
                </div>
                <md-field :class="getValidationClass('tierThreeTitle')">
                  <label for="tierThreeTitle">Title</label>
                  <md-input name="tierThreeTitle" id="tierThreeTitle" v-model="form.tierThreeTitle" :disabled="sending || !armed" md-counter="25" />
                  <span class="md-error" v-if="!$v.form.tierThreeTitle.required">Title is required.</span>
                  <span class="md-error" v-else-if="!$v.form.tierThreeRate.maxLength">Title is too long.</span>
                </md-field>
                <md-field :class="getValidationClass('tierThreeDescription')">
                  <label for="tierThreeDescription">Description</label>
                  <md-textarea name="tierThreeDescription" id="tierThreeDescription" v-model="form.tierThreeDescription" :disabled="sending || !armed" md-counter="120" md-autogrow></md-textarea>
                  <span class="md-error" v-if="!$v.form.tierThreeDescription.required">Description is required.</span>
                  <span class="md-error" v-else-if="!$v.form.tierThreeDescription.maxLength">Description is too long.</span>
                </md-field>
              </md-card-content>
            </md-card>
          </div>
        </div>
      </div>

      <div class="md-layout-item md-size-70 md-medium-size-66 md-small-size-100 content">
        <md-toolbar id="display-title" class="md-transparent" style="padding: 0;" md-elevation="0">
          <span class="md-display-3">{{ form.title || "Untitled" }}</span>
          <div class="md-toolbar-section-end">
            <md-switch v-if="syndicate" v-model="armed" class="md-primary">Arm</md-switch>
            <md-button class="md-primary md-raised md-icon-button" @click="validateFields()" :disabled="sending || !armed">
              <md-icon>save</md-icon>
            </md-button>
          </div>
        </md-toolbar>
        
        <md-divider class="divider"/>
        <div class="md-layout md-gutter">
          <div class="md-layout-item md-size-66">
            <md-field :class="getValidationClass('title')">
              <label for="title">Title</label>
              <md-input name="title" id="title" autocomplete="title" v-model="form.title" :disabled="sending || !armed" md-counter="30" max="30"/>
              <span class="md-error" v-if="!$v.form.title.required">Title is required.</span>
              <span class="md-error" v-else-if="!$v.form.title.maxLength">Title is too long.</span>
            </md-field>
            <md-field :class="getValidationClass('slug')">
              <label for="slug">Slug</label>
              <span class="md-prefix">https://sub.city/</span>
              <md-input name="slug" id="slug" autocomplete="slug" v-model="form.slug" :disabled="sending || !armed" md-counter="30" />
              <span class="md-error" v-if="!$v.form.slug.required">Slug is required.</span>
              <span class="md-error" v-else-if="!$v.form.slug.maxLength">Slug is too long.</span>
              <span class="md-error" v-else-if="!$v.form.slug.alphaNum">Slug must be alphanumerical characters only.</span>
            </md-field>
            <md-field :class="getValidationClass('description')">
              <label for="description">Description</label>
              <md-textarea name="description" id="description" v-model="form.description" :disabled="sending || !armed" md-counter="800" md-autogrow></md-textarea>
              <span class="md-error" v-if="!$v.form.description.required">Description is required.</span>
              <span class="md-error" v-else-if="!$v.form.description.maxLength">Description is too long.</span>
            </md-field>
            <md-field>
              <label>Payload file</label>
              <md-file v-model="form.payload" @md-change="setPayloadFile" :disabled="sending || !armed" />
            </md-field>

            <div class="md-display-1" style="margin: 32px 0 16px;">Proposals</div>
            <md-list v-if="syndicate && syndicate.proposals.length" md-expand-single>
              <md-card v-for="proposal in syndicate.proposals" :key="proposal.time_created" style="margin: 0 0 16px 0;">
                <form-proposal :proposal="proposal" :syndicate="syndicate"/>
              </md-card>
            </md-list>

            <md-empty-state
              v-else
              md-icon="perm_media"
              md-label="Create your first proposal"
              md-description="Creating project, you'll be able to upload your design and collaborate with people.">
              <md-button class="md-primary md-raised">Create release</md-button>
            </md-empty-state>
          </div>

          <div class="md-layout-item md-size-33 md-medium-size-100">
            <md-card style="margin: 0 0 16px;">
              <div style="display: flex;justify-content:space-between;align-items: center;padding:16px 0 16px;">
                <div style="display: flex; align-items: center;">
                  <md-icon style="margin: 0 16px;">attach_money</md-icon>
                  <span class="md-title">Payouts</span>
                </div>
                <md-badge v-if="syndicate" class="md-square md-primary" :md-content="syndicate.members.length" style="position: relative; right: 0;margin: 0 16px;"/>
              </div>
              <md-divider/> 

            </md-card>
            <md-card style="margin: 0;">
              <div style="display: flex;justify-content:space-between;align-items: center;padding:16px 0 16px;">
                <div style="display: flex; align-items: center;">
                  <md-icon style="margin: 0 16px;">group</md-icon>
                  <span class="md-title">Members</span>
                </div>
                <md-badge v-if="syndicate" class="md-square md-primary" :md-content="syndicate.members.length" style="position: relative; right: 0;margin: 0 16px;"/>
              </div>
              <md-divider/> 
              <md-list v-if="syndicate">
                <md-list-item v-for="member in syndicate.members" :key="member.channel_id" :to="`/channels/${ member.slug }`">{{ member.title }}</md-list-item>
              </md-list>
            </md-card>
          </div>
        </div>
      </div>
    </div>
   
  </section>
</template>

<script>
  import FormProposal from "~/components/FormProposal.vue";
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
    name: "FormSyndicate",
    mixins: [validationMixin],
    validations: {
      form: {
        description: {
          required,
          maxLength: maxLength(800),
        },
        linkDiscord: { url },
        linkFacebook: { url },
        linkInstagram: { url },
        linkTwitch: { url },
        linkTwitter: { url },
        linkYoutube: { url },
        profileURL: {
          required
        },
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
          maxLength: maxLength(25),
        },
        tierOneDescription: {
          required,
          maxLength: maxLength(120)
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
          maxLength: maxLength(25),
        },
        tierTwoDescription: {
          required: requiredIf(({ tierTwoActive }) => tierTwoActive),
          maxLength: maxLength(120)
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
          maxLength: maxLength(25),
        },
        tierThreeDescription: {
          required: requiredIf(({ tierThreeActive }) => tierThreeActive),
          maxLength: maxLength(120)
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
    components: {
      FormProposal,
    },
    props: ["syndicate"],

    watch: {
      syndicate (syndicate) {
        if (syndicate) {
          this.armed = false;
          this.form = {
            description: syndicate.description.raw,
            linkDiscord: syndicate.links.discord,
            linkFacebook: syndicate.links.facebook,
            linkInstagram: syndicate.links.instagram,
            linkTwitch: syndicate.links.twitch,
            linkTwitter: syndicate.links.twitter,
            linkYoutube: syndicate.links.youtube,
            payload: syndicate.payload,
            profileURL: `${this.DATA_HOST}/syndicates/${syndicate.syndicate_id}/profile.jpeg`,
            slug: syndicate.slug,
            tierOneActive: syndicate.tiers._1.active,
            tierOneTitle: syndicate.tiers._1.title,
            tierOneDescription: syndicate.tiers._1.description.raw,
            tierOneRate: syndicate.tiers._1.rate,
            tierTwoActive: syndicate.tiers._2.active,
            tierTwoTitle: syndicate.tiers._2.title,
            tierTwoDescription: syndicate.tiers._2.description.raw,
            tierTwoRate: syndicate.tiers._2.rate,
            tierThreeActive: syndicate.tiers._3.active,
            tierThreeTitle: syndicate.tiers._3.title,
            tierThreeDescription: syndicate.tiers._3.description.raw,
            tierThreeRate: syndicate.tiers._3.rate,
            title: syndicate.title,
            unlisted: syndicate.unlisted
          };
        } else {
          this.armed = true;
          Object.keys(this.form).map(key => {
            this.form[key] = null;
          });
        }
      }
    },

    data: () => ({
      armed: true,
      form: {
        description: null,
        linkDiscord: null,
        linkFacebook: null,
        linkInstagram: null,
        linkTwitch: null,
        linkTwitter: null,
        linkYoutube: null,
        payload: null,
        profileURL: null,
        slug: null,
        tierOneActive: true,
        tierOneTitle: null,
        tierOneDescription: null,
        tierOneRate: null,
        tierTwoActive: false,
        tierTwoTitle: null,
        tierTwoDescription: null,
        tierTwoRate: null,
        tierThreeActive: false,
        tierThreeTitle: null,
        tierThreeDescription: null,
        tierThreeRate: null,
        title: null,
        unlisted: false
      },
      funding: "per_month",
      imageProgress: 0,
      payload: null,
      payloadProgress: 0,
      sending: false,
      DATA_HOST: process.env.DATA_HOST,
    }),

    methods: {

      getValidationClass (fieldName) {
        const field = this.$v.form[fieldName];

        if (field) {
          return {
            "md-invalid": field.$invalid && field.$dirty
          };
        }
      },

      createUpdateProposal () {
        this.sending = true;

        const updates = {};

        // Files

        if (this.payload && this.form.payload) {
          updates.payload = this.form.payload;
        }

        const imageFile = this.$refs.imageInput.files[0];
        if (imageFile && imageFile.size) {
          updates.new_profile = true;
        }

        // Description

        if (this.form.description !== this.syndicate.description.raw) {
          updates.description = this.form.description;
        }

        // Links

        if (this.form.linkDiscord !== this.syndicate.links.discord) {
          updates.links = updates.links || {};
          updates.links.discord = this.form.linkDiscord;
        }

        if (this.form.linkFacebook !== this.syndicate.links.facebook) {
          updates.links = updates.links || {};
          updates.links.facebook = this.form.linkFacebook;
        }

        if (this.form.linkInstagram !== this.syndicate.links.instagram) {
          updates.links = updates.links || {};
          updates.links.instagram = this.form.linkInstagram;
        }

        if (this.form.linkTwitch !== this.syndicate.links.twitch) {
          updates.links = updates.links || {};
          updates.links.twitch = this.form.linkTwitch;
        }

        if (this.form.linkTwitter !== this.syndicate.links.twitter) {
          updates.links = updates.links || {};
          updates.links.twitter = this.form.linkTwitter;
        }

        if (this.form.linkYoutube !== this.syndicate.links.youtube) {
          updates.links = updates.links || {};
          updates.links.youtube = this.form.linkYoutube;
        }

        // Slug

        if (this.form.slug !== this.syndicate.slug) {
          updates.slug = this.form.slug;
        }

        // Tier 1

        if (this.form.tierOneTitle !== this.syndicate.tiers._1.title) {
          updates.tiers = updates.tiers || {};
          updates.tiers._1 = updates.tiers._1 || {};
          updates.tiers._1.title = this.form.tierOneTitle;
        }

        if (this.form.tierOneDescription !== this.syndicate.tiers._1.description.raw) {
          updates.tiers = updates.tiers || {};
          updates.tiers._1 = updates.tiers._1 || {};
          updates.tiers._1.description = this.form.tierOneDescription;
        }

        if (parseInt(this.form.tierOneRate) !== this.syndicate.tiers._1.rate) {
          updates.tiers = updates.tiers || {};
          updates.tiers._1 = updates.tiers._1 || {};
          updates.tiers._1.rate = parseInt(this.form.tierOneRate);
        }

        // Tier 2

        if (this.form.tierTwoActive !== this.syndicate.tiers._2.active) {
          updates.tiers = updates.tiers || {};
          updates.tiers._2 = updates.tiers._2 || {};
          updates.tiers._2.active = this.form.tierTwoActive;
        }

        if (this.form.tierTwoActive && this.form.tierTwoTitle !== this.syndicate.tiers._2.title) {
          updates.tiers = updates.tiers || {};
          updates.tiers._2 = updates.tiers._2 || {};
          updates.tiers._2.title = this.form.tierTwoTitle;
        }

        if (this.form.tierTwoActive && this.form.tierTwoDescription !== this.syndicate.tiers._2.description.raw) {
          updates.tiers = updates.tiers || {};
          updates.tiers._2 = updates.tiers._2 || {};
          updates.tiers._2.description = this.form.tierTwoDescription;
        }

        if (this.form.tierTwoActive && parseInt(this.form.tierTwoRate) !== this.syndicate.tiers._2.rate) {
          updates.tiers = updates.tiers || {};
          updates.tiers._2 = updates.tiers._2 || {};
          updates.tiers._2.rate = parseInt(this.form.tierTwoRate);
        }

        // Tier 3

        if (this.form.tierThreeActive !== this.syndicate.tiers._3.active) {
          updates.tiers = updates.tiers || {};
          updates.tiers._3 = updates.tiers._3 || {};
          updates.tiers._3.active = this.form.tierThreeActive;
        }

        if (this.form.tierThreeActive && this.form.tierThreeTitle !== this.syndicate.tiers._3.title) {
          updates.tiers = updates.tiers || {};
          updates.tiers._3 = updates.tiers._3 || {};
          updates.tiers._3.title = this.form.tierThreeTitle;
        }

        if (this.form.tierThreeActive && this.form.tierThreeDescription !== this.syndicate.tiers._3.description.raw) {
          updates.tiers = updates.tiers || {};
          updates.tiers._3 = updates.tiers._3 || {};
          updates.tiers._3.description = this.form.tierThreeDescription;
        }

        if (this.form.tierThreeActive && parseInt(this.form.tierThreeRate) !== this.syndicate.tiers._3.rate) {
          updates.tiers = updates.tiers || {};
          updates.tiers._3 = updates.tiers._3 || {};
          updates.tiers._3.rate = parseInt(this.form.tierThreeRate);
        }

        // Title

        if (this.form.title !== this.syndicate.title) {
          updates.title = this.form.title;
        }

        // Unlisted

        if (this.form.unlisted !== this.syndicate.unlisted) {
          updates.unlisted = this.form.unlisted;
        }

        if (!Object.keys(updates).length) {
          this.sending = false;
          return;
        }

        const data = {
          syndicate_id: this.syndicate.syndicate_id,
          type: "update",
          updates
        };

        console.log(JSON.stringify(data,null,2))

        return this.$store.dispatch("createProposal", data)
        .then(({ data: { createProposal: { time_created }}}) => {
          return this.uploadFiles(this.syndicate.syndicate_id, time_created);
        })
        .then(() => {
          this.$store.dispatch("success", {
            message: "Proposal created successfully.",
            status: 200
          });
          this.$router.go({ path: "/settings/syndicates", force: true });
        })
        .catch(error => {
          this.$store.dispatch("error", error);
        })
        .finally(() => {
          this.sending = false;
        });
      },

      createSyndicate () {
        this.sending = true;

        const data = {        
          description: this.form.description,
          links: {
            discord: this.form.linkDiscord,
            facebook: this.form.linkFacebook,
            instagram: this.form.linkInstagram,
            twitch: this.form.linkTwitch,
            twitter: this.form.linkTwitter,
            youtube: this.form.linkYoutube,
          },
          payload: this.form.payload,
          slug: this.form.slug,
          tiers: {
            _1: {
              active: true,
              title: this.form.tierOneTitle,
              description: this.form.tierOneDescription,
              rate: parseInt(this.form.tierOneRate)
            },
          },
          title: this.form.title,
          unlisted: this.form.unlisted
        };

        // Tier 2

        if (this.form.tierTwoActive) {
          data.tiers._2 = {
            active: this.form.tierTwoActive,
            title: this.form.tierTwoTitle,
            description: this.form.tierTwoDescription,
            rate: parseInt(this.form.tierTwoRate)
          };
        }

        // Tier 3

        if (this.form.tierThreeActive) {
          data.tiers._3 = {
            active: this.form.tierThreeActive,
            title: this.form.tierThreeTitle,
            description: this.form.tierThreeDescription,
            rate: parseInt(this.form.tierThreeRate)
          };
        }

        return this.$store.dispatch("createSyndicate", data)
        .then(({ data: { createSyndicate: { syndicate_id }}}) => {
          return this.uploadFiles(syndicate_id);
        })
        .then(() => {
          this.$store.dispatch("success", {
            message: "Syndicate created successfully.",
            status: 200
          });
          this.$router.go({ path: "/settings/syndicates", force: true });
        })
        .catch(error => {
          this.$store.dispatch("error", error);
        })
        .finally(() => {
          this.sending = false;
        });
      },

      displayProposalType (type) {
        switch(type) {
          case "update":
            return "Update Proposal";
          case "join":
            return "Join Proposal";
          case "slave":
            return "Merge Request";
          case "master":
            return "Merge Approval";
        }
      },

      filterUpdates (updates) {
        return Object.keys(updates).map(key => {
          if (updates[key]) {

            // If update value is not null.

            const mappings = {
              description: "Description",
              links: "Links",
              new_profile: "Profile",
              payload: "Payload File",
              slug: "Slug",
              tiers: "Tiers",
              title: "Title",
              unlisted: "Unlisted Status"
            };

            return {
              key: mappings[key],
              value: updates[key]
            };
          }
        }).filter(x => x);
      },

      validateFields () {
        this.$v.$touch();

        if (!this.$v.$invalid) {
          if (this.syndicate) this.createUpdateProposal();
          else this.createSyndicate();
        }
      },

      getApprovalPercentage (votes) {
        if (!votes.length) return 0;
        return votes.filter(({ vote }) => vote).length / votes.length * 100;
      },

      openImageInput () {
        this.$refs.imageInput.click();
      },

      setPayloadFile (file) {
        this.payload = file[0];
      },

      setPreview (event) {
        if (event.target.files && event.target.files[0]) {
          const file = event.target.files[0];
          const reader = new FileReader();
          reader.onload = event => {
            this.form.profileURL = event.target.result;
            this.$forceUpdate();
          };
          reader.readAsDataURL(file);
        }
      },

      async uploadImageFile (syndicate_id, time_created) {
        const file = this.$refs.imageInput.files[0];
        if (!file || !file.size) return Promise.resolve();

        const data = {
          file,
          type: "profile",
          syndicate_id,
          time_created,
          progress (event) {
            this.imageProgress = event.loaded / event.total * 100;
          }
        };

        return this.$store.dispatch("uploadFile", data)
        .finally(() => {
          this.imageProgress = 0;
        });
      },

      uploadPayloadFile (syndicate_id, time_created) {
        if (!this.payload) return Promise.resolve();

        const data = {
          file: this.payload,
          type: "payload",
          syndicate_id,
          time_created,
          progress (event) {
            this.imageProgress = event.loaded / event.total * 100;
            console.log(event.loaded / event.total * 100)
          }
        };

        return this.$store.dispatch("uploadFile", data)
        .finally(() => {
          this.payloadProgress = 0;
        });
      },

      uploadFiles (syndicate_id, time_created) {
        return Promise.all([
          this.uploadImageFile(syndicate_id, time_created),
          this.uploadPayloadFile(syndicate_id, time_created)
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

  .badge .md-badge {
    color: white;
    background-color: #ff5252;
    min-width: 22px;
    width: auto;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
  }

  .content {
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

  .no-click {
    pointer-events: none;
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
