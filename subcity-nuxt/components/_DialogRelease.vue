<template>

  <div>
    <md-dialog-title style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0; padding-top: 4px;">
      <span style="white-space: nowrap;">New Release</span>
      <md-field style="max-width: 80px;">
        <label for="tier">Tier</label>
        <md-select v-model="form.tier" name="tier" id="tier">
          <md-option value="1">1</md-option>
          <md-option value="2">2</md-option>
          <md-option value="3">3</md-option>
        </md-select>
      </md-field>
    </md-dialog-title>


    <md-card>
      <md-card-media-cover>
        <md-card-media class="ratio-widescreen">
          <div id="profile-upload" :class="{ loading: imageProgress2 }" @click="openImageInput()">
            <md-icon class="md-size-2x">library_add</md-icon>
            <md-progress-spinner id="image-spinner" md-mode="determinate" :md-value="imageProgress2"></md-progress-spinner>
            <input @change="setPreview"
              ref="imageInput"
              type="file"
              accept="image/jpeg, image/png"
              hidden/>
          </div>
          <img :src="profileURL" class="image"/>
        </md-card-media>
      </md-card-media-cover>
    </md-card>

    <div style="margin: 16px 16px 0;">
      <span class="md-display-3">{{ form.title || "Untitled " }}</span>
      <md-divider style="margin: 16px 0 16px;"/>

      <div class="md-layout md-gutter">
        <div class="md-layout-item md-size-50 md-small-size-100">
          <md-field :class="getValidationClass('title')" class="inline-field" md-inline>
            <label for="title">Title</label>
            <md-input type="title" name="title" id="title" autocomplete="title" v-model="form.title" :disabled="sending" />
            <span class="md-error" v-if="!$v.form.title.required">Title is required.</span>
            <span class="md-error" v-else-if="!$v.form.title.maxLength">Invalid title.</span>
          </md-field>
          <md-field :class="getValidationClass('slug')" class="inline-field" md-inline>
            <label for="slug">Slug</label>
            <md-input type="slug" name="slug" id="slug" autocomplete="slug" v-model="form.slug" :disabled="sending" />
            <span class="md-error" v-if="!$v.form.slug.required">Slug is required.</span>
            <span class="md-error" v-else-if="!$v.form.slug.maxLength">Invalid slug.</span>
          </md-field>
          <md-field>
            <label>Payload file</label>
            <md-file v-model="form.payload" />
          </md-field>
        </div>

        <div class="md-layout-item md-size-50 md-small-size-100">
          <md-field :class="getValidationClass('description')">
            <label for="description">Description</label>
            <md-textarea name="description" id="description" v-model="form.description" :disabled="sending" md-counter="800"></md-textarea>
            <span class="md-error" v-if="!$v.form.description.required">Description is required.</span>
            <span class="md-error" v-else-if="!$v.form.description.maxLength">Description is too long.</span>
          </md-field>
        </div>
      </div>
    </div>

    <md-dialog-actions>
      <md-button class="md-primary" @click="showDialog = false" :disabled="sending">Close</md-button>
      <md-button class="md-primary" @click="validateFields" :disabled="sending">Save</md-button>
    </md-dialog-actions>

  </div>

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
          maxLength: maxLength(800),
        },
        slug: {
          required,
          alphaNum,
          maxLength: maxLength(30),
        },
        tier: {
          required,
        },
        title: {
          required,
          maxLength: maxLength(30),
        },
      }
    },

    props: ["release"],

    data: () => ({
      form: {
        description: null,
        payload: null,
        slug: null,
        tier: null,
        title: null,
      },
      sending: false
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

      createRelease () {
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
          tiers: {
            _1: {
              active: true,
              title: this.form.tierOneTitle,
              description: this.form.tierOneDescription,
              rate: parseInt(this.form.tierOneRate)
            },
            _2: {
              active: this.form.tierTwoActive,
              title: this.form.tierTwoTitle,
              description: this.form.tierTwoDescription,
              rate: parseInt(this.form.tierTwoRate)
            },
            _3: {
              active: this.form.tierThreeActive,
              title: this.form.tierThreeTitle,
              description: this.form.tierThreeDescription,
              rate: parseInt(this.form.tierThreeRate)
            },
          },
          title: this.form.title,
          unlisted: this.form.unlisted
        };

        return Promise.all([
          this.$store.dispatch("updateChannel", data),
          this.uploadFiles()
        ])
        .then(() => {
          this.$store.dispatch("success", {
            message: "Channel updated successfully.",
            status: 200
          });
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
        if (!file) return Promise.resolve();

        const query = `
          query ($data: GetUploadURLInput!) {
            getUploadURL (data: $data)
          }
        `;

        const vars = {
          data: {
            upload_type: "profile",
            filename: file.name,
            mime_type: file.type
          }
        };

        const uploadURL = await this.$axios.post(`/api/private`,
          { query, vars }
        )
        .then(({ data: { getUploadURL }}) => getUploadURL);

        var onUploadProgress = e => {
          this.imageProgress = e.loaded / e.total * 100;
        };

        await this.$axios.put(uploadURL, file, {
          onUploadProgress,
          transformRequest: [
            (data, headers) => {
              delete headers.common;
              delete headers.put;
              headers["Content-Type"] = file.type;
              return data;
            }
          ]
        });

        this.imageProgress = 0;
      },

      uploadPayloadFile () {
        return Promise.resolve();
      },

      uploadFiles () {
        return Promise.all([
          this.uploadImageFile(),
          this.uploadPayloadFile()
        ]);
      }
    },

    computed: {

      profileURL: {
        get () {
          return "https://picsum.photos/400/?random"
          if (this.imageURL) {
            return this.imageURL;
          } else if (this.release.time_updated) {
            return `${process.env.DATA_HOST}/channels/${this.channel.channel_id}/profile.jpeg`;
          } else {
            return "https://picsum.photos/400/?random"
          }
        },
        set (url) {
          this.imageURL = url;
        }
      },

      imageProgress2: {
        get () {
          console.log(this.imageProgress)
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

  .inline-field {
    margin: 20px 0 16px;
    padding: 0;
    min-height: initial;

    label, &.md-focused label {
      top: 6px;
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

  .md-layout.md-gutter {
    margin-left: 0;
    margin-right: 0;
  }

  .ratio-widescreen {
    overflow: hidden;

    &:before {
      content: "";
      width: 100%;
      display: block;
      padding-top: 1px / 2.39px * 100%;
    }

    img {
      position: absolute;
      top: 50%;
      right: 0;
      left: 0;
      transform: translateY(-50%);
    }
  }

  #release-select {
    max-width: 33%;
  }

</style>
