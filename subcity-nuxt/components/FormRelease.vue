<template>

  <md-card style="margin: 0; box-shadow: none;">

    <md-card-header style="display: flex; justify-content: space-between; align-items: center; margin: 0; padding: 0 16px;">
      <span style="white-space: nowrap;">{{ release ? "Edit Release" : "New Release" }}</span>
      <div style="position: relative;">
        <span class="md-error" v-if="!$v.form.tier.required" id="tier-label">Tier is required.</span>
        <md-field style="max-width: 80px;">
          <label for="tier">Tier</label>
          <md-select v-model="form.tier" name="tier" id="tier">
            <md-option value="1">1</md-option>
            <md-option value="2">2</md-option>
            <md-option value="3">3</md-option>
          </md-select>
        </md-field>
      </div>
    </md-card-header>

    <md-card>
      <md-card-media-cover>
        <md-card-media class="ratio-widescreen">
          <div id="profile-upload" :class="{ loading: imageProgress }" @click="openImageInput()">
            <md-icon class="md-size-2x">library_add</md-icon>
            <md-progress-spinner id="image-spinner" md-mode="determinate" :md-value="imageProgress"></md-progress-spinner>
            <input @change="setPreview"
              ref="imageInput"
              type="file"
              accept="image/jpeg, image/png"
              hidden/>
          </div>
          <img :src="form.bannerURL" class="image" @error="this.style.display='none'"/>
        </md-card-media>
      </md-card-media-cover>
    </md-card>

    <div style="margin: 16px 16px 40px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
      <span class="md-display-2" style="flex: 1;">{{ form.title || "Untitled " }}</span>
        <span v-show="form.slug" class="md-caption" style="margin-right: 16px;">https://sub.city/channels/{{ slug }}/{{ form.slug }}</span>
        <md-badge class="md-square md-primary" :md-content="`TIER ${ form.tier || 1 }`" style="position: relative; right: 0;"/>
    </div>
      <md-divider style="margin: 16px 0 16px;"/>

        <md-field :class="getValidationClass('title')">
          <label for="title">Title</label>
          <md-input type="title" name="title" id="title" autocomplete="title" v-model="form.title" md-counter="30" :disabled="sending" />
          <span class="md-error" v-if="!$v.form.title.required">Title is required.</span>
          <span class="md-error" v-else-if="!$v.form.title.maxLength">Invalid title.</span>
        </md-field>
        <md-field :class="getValidationClass('slug')">
          <label for="slug">Slug</label>
          <md-input type="slug" name="slug" id="slug" autocomplete="slug" v-model="form.slug" md-counter="30" :disabled="sending" />
          <span class="md-error" v-if="!$v.form.slug.required">Slug is required.</span>
          <span class="md-error" v-else-if="!$v.form.slug.maxLength">Invalid slug.</span>
        </md-field>

        <md-field>
          <label>Payload file</label>
          <md-file v-model="form.payload" @md-change="setPayloadFile" :disabled="sending" />
        </md-field>

        <md-field :class="getValidationClass('description')">
            <label for="description">Description</label>
            <md-textarea name="description" id="description" v-model="form.description" :disabled="sending" md-counter="5000" md-autogrow></md-textarea>
            <span class="md-error" v-if="!$v.form.description.required">Description is required.</span>
            <span class="md-error" v-else-if="!$v.form.description.maxLength">Description is too long.</span>
          </md-field>
      </div>
    </div>

    <md-card-actions style="justify-content: center;">
      <md-button class="md-primary" @click="resetRelease" :disabled="sending">Reset</md-button>
      <md-button class="md-primary" @click="validateFields" :disabled="sending">Save</md-button>
    </md-card-actions>

  </md-card>

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
    name: "FormRelease",
    mixins: [validationMixin],
    validations: {
      form: {
        bannerURL: {
          required,
        },
        description: {
          required,
          maxLength: maxLength(5000),
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

    props: ["release", "slug"],

    watch: {
      release (release) {
        if (release) {
          this.form = release;
          this.form.description = release.description.raw;
          this.form.bannerURL = `${this.DATA_HOST}/channels/${this.channel_id}/releases/${this.release.time_created}/banner.jpeg`;
        } else {
          Object.keys(this.form).map(key => {
            this.form[key] = null;
          });
        }
      }
    },

    created () {
      this.channel_id = this.$store.state.id;
    },

    data: () => ({
      channel_id: null,
      form: {
        bannerURL: null,
        description: null,
        payload: null,
        slug: null,
        tier: null,
        title: null,
      },
      imageProgress: 0,
      imageURL: null,
      payload: null,
      payloadProgress: 0,
      sending: false,
      DATA_HOST: process.env.DATA_HOST,
    }),

    methods: {

      setPayloadFile (files) {
        this.payload = files[0];
      },

      getValidationClass (fieldName) {
        const field = this.$v.form[fieldName];

        if (field) {
          return {
            "md-invalid": field.$invalid && field.$dirty
          };
        }
      },

      saveRelease () {
        this.sending = true;

        const action = this.release ? "updateRelease" : "createRelease";
        const verb = this.release ? "updated" : "created";

        const data = {        
          description: this.form.description,
          payload: this.form.payload,
          slug: this.form.slug,
          tier: parseInt(this.form.tier),
          title: this.form.title,
          ...(this.release && { time_created: this.release.time_created })
        };

        return this.$store.dispatch(action, data)
        .then(({ data }) => {
          const time_created = data[action].time_created;
          return this.uploadFiles(time_created);
        })
        .then(() => {
          this.$store.dispatch("success", {
            message: `Release ${verb} successfully.`,
            status: 200
          });
          setTimeout(() => this.$router.go({ path: "/settings/releases", force: true }), 100);
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
          this.saveRelease();
        }
      },

      openImageInput () {
        this.$refs.imageInput.click();
      },

      resetRelease () {
        this.$emit("update:release", null);
      },

      setPreview (event) {
        if (event.target.files && event.target.files[0]) {
          const file = event.target.files[0];
          const reader = new FileReader();
          reader.onload = event => {
            this.form.bannerURL = event.target.result;
            this.$forceUpdate();
          };
          reader.readAsDataURL(file);
        }
      },

      async uploadImageFile (time_created) {
        const file = this.$refs.imageInput.files[0];
        if (!file) return Promise.resolve();

        const data = {
          file,
          type: "banner",
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

      uploadPayloadFile (time_created) {
        if (!this.payload) return Promise.resolve();

        const data = {
          file: this.payload,
          type: "payload",
          time_created,
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
        get () { return this.imageProgress; },
        set (progress) { this.imageProgress = progress; }
      },

      _payloadProgress: {
        get () { return this.payloadProgress; },
        set (progress) { this.payloadProgress = progress; }
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

  #image-spinner {
    display: none;
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
    background-color: #DDD;

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

  #tier-label {
    color: #ff1744;
    font-size: 12px;
    position: absolute;
    left: -86px;
    top: 28px;
  }

</style>
