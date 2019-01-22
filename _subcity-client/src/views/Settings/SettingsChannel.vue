<template>
  <section class="section p-0 settings">
    <div class="container">
      <div class="row">

        <!-- settings navigation -->
        <div class="col-lg-3">
          <settings-nav></settings-nav>
        </div>
        <!-- /settings navigation -->

        <div class="col-lg-9">

          <!-- profile image row -->
          <div class="row" style="margin-top:-1rem;">

            <!-- profile input -->
            <div class="col-lg-4 col-md-6 my-2 my-sm-3">
              <tile type="upload"
                    :state.sync="profileImage.state"
                    :url.sync="profileImage.url"
                    :file.sync="profileImage.file"
                    :parentBusy="busy"
                    @reset="resetState(false)">
              </tile>
            </div>
            <!-- /profile input -->

            <div class="col-lg-4 col-md-6 my-2 my-sm-3">
              <div class="w-100 tile shadow" style="padding-bottom:100%; background: #EEEEEE;">
                <div class="d-flex justify-content-center align-items-center controls">
                 ${{ (channel.subscription_rate * (channel.subscribers || []).length) / 100 || 0 }} / mo<br>
                 ${{ (channel.earnings_total || 0) / 100 }} total
                </div>
              </div>
            </div>
            <div class="col-lg-4 col-md-6 my-2 my-sm-3">
              <div class="w-100 tile shadow" style="padding-bottom:100%; background: #EEEEEE;">
                <div class="d-flex justify-content-center align-items-center controls">
                 {{ (channel.subscribers || []).length || 0 }} subscriber{{ (channel.subscribers || []).length === 1 ? "" : "s" }}
                </div>
              </div>
            </div>

          </div>
          <!-- /profile image row -->

          <!-- channel settings row -->
          <div class="row mt-3">
            <div class="col">

              <!-- form -->
              <form @submit="handleUpdate" ref="input" :class="[{ 'no-click': busy }]">

                <!-- rate -->
                <div class="row">
                  <div class="col-12" style="margin-bottom: 2.25rem;">
                    <base-slider v-model="accumulator.subscription_rate" :options="noUISliderOptions" :disabled="busy" type="warning"></base-slider>
                  </div>
                  <span class="h5 col-5 offset-1 text-right px-1 d-none d-sm-block mb-4">Subscription rate:</span>
                  <span class="h5 col-12  col-sm-5 text-center text-sm-left text-success px-1 mb-4">$ {{ accumulator.subscription_rate }} / month</span>
                </div>
                <!-- /rate -->

                <!-- title -->
                <label class="d-flex justify-content-between w-100">
                  <span>Title</span>
                  <span class="text-muted">{{ $config.maxLengthGeneral - (accumulator.title || "").length }}</span>
                </label>
                <base-input v-model="accumulator.title"
                            :valid="notEmpty(accumulator.title)"
                            :maxlength="$config.maxLengthGeneral"
                            class="mb-3"
                            placeholder="Title"
                            :addon-left-icon="dataFieldsIconClass">
                </base-input>
                <!-- /title -->

                <!-- slug -->
                <label class="d-flex justify-content-between w-100">
                  <span>Channel slug</span>
                  <span class="text-muted">{{ $config.maxLengthGeneral - (accumulator.slug || "").length }}</span>
                </label>
                <base-input v-model="accumulator.slug"
                            :valid="$config.slugRegex.test(accumulator.slug) && notEmpty(accumulator.slug)"
                            :maxlength="$config.maxLengthGeneral"
                            class="mb-3"
                            placeholder="unique-channel-slug"
                            :addon-left-icon="dataFieldsIconClass">
                </base-input>
                <!-- /slug -->

                <!-- description -->
                <label class="d-flex justify-content-between w-100">
                  <span>Description</span>
                  <span class="text-muted">{{ $config.maxLengthDescription - (accumulator.description || "").length }}</span>
                </label>
                <div :class="descriptionInputGroupClass">
                  <div class="input-group-prepend">
                    <span class="input-group-text" :class="descriptionInputTextareaClass">
                      <slot name="addonLeft">
                        <i :class="dataFieldsIconClass"></i>
                      </slot>
                    </span>
                  </div>
                  <textarea v-model="accumulator.description"
                            class="form-control"
                            :maxlength="$config.maxLengthDescription"
                            :class="descriptionInputTextareaClass"
                            rows="5"
                            placeholder="Description..."
                            spellcheck="false">
                  </textarea>
                </div>
                <!-- /description -->

                <!-- overview -->
                <label class="d-flex justify-content-between w-100">
                  <span>Overview</span>
                  <span class="text-muted">{{ $config.maxLengthOverview - (accumulator.overview || "").length }}</span>
                </label>
                <div :class="overviewInputGroupClass">
                  <div class="input-group-prepend">
                    <span class="input-group-text" :class="overviewInputTextareaClass">
                      <slot name="addonLeft">
                        <i :class="dataFieldsIconClass"></i>
                      </slot>
                    </span>
                  </div>
                  <textarea v-model="accumulator.overview"
                            class="form-control"
                            :maxlength="$config.maxLengthOverview"
                            :class="overviewInputTextareaClass"
                            rows="8"
                            placeholder="Overview (optional)..."
                            spellcheck="false">
                  </textarea>
                </div>
                <!-- /overview -->

                <!-- payload -->
                <label class="d-flex justify-content-between w-100">
                  <span>Payload</span>
                  <span :class="payloadFileValid ? 'text-muted' : 'text-danger'">{{ payloadFileSize }}</span>
                </label>
                <div class="form-group input-group upload-group mb-3">
                  <div class="input-group-prepend">
                    <span class="input-group-text">
                      <i :class="payloadFileIconClass"></i>
                    </span>
                  </div>
                  
                  <input v-model="accumulator.payload_url" placeholder="No file selected" class="form-control" disabled>
                  <base-button type="primary" @click="openPayloadFileInput()">
                    <small v-if="payloadFile.state === 'ready'">Select File</small>
                    <i v-else :class="payloadFileButtonIconClass"></i>
                  </base-button>

                  <input @change="setPayloadFile"
                          ref="payloadFileInput"
                          type="file"
                          accept="*"
                          hidden/>
                </div>
                <base-progress :value="payloadFileProgress" :height="2" :percentage="false" class="p-0"></base-progress>
                <!-- /payload -->

                <!-- switches -->
                <div class="form-group form-inline mt-5">
                  <label class="mr-3 p-0 col-2 justify-content-start">Adult content</label>
                  <base-switch class="mr-3" v-model="accumulator.is_nsfw" :disabled="busy"></base-switch>
                  <small class="text-muted">Turn on if your channel contains graphic content.</small>
                </div>

                <div class="form-group form-inline">
                  <label class="mr-3 p-0 col-2 justify-content-start">Unlisted</label>
                  <base-switch class="mr-3" v-model="accumulator.is_unlisted" :disabled="busy"></base-switch>
                  <small class="text-muted">Turn on if your channel is private.</small>
                </div>

                <div class="form-group form-inline">
                  <label class="mr-3 p-0 col-2 justify-content-start">Subscriber pays fee</label>
                  <base-switch class="mr-3" v-model="accumulator.subscriber_pays" :disabled="busy"></base-switch>
                  <small class="text-muted">Turn on to move payment processing fee to the subscriber.</small>
                  <!-- <small class="text-uppercase">Subscriber pays: $5.00 Channel earns: $4.55</small> -->
                </div>
                <!-- /switches -->

                <hr>

                <div class="form-group form-inline d-flex justify-content-center justify-content-lg-end">
                  <base-button :type="submitButtonType" native-type="submit" style="min-width:162px;" :disabled="submitButtonDisabled">
                    <span v-if="submitButtonText">{{ submitButtonText }}</span>
                    <i v-if="busy" :class="submitButtonIconClass"></i>
                  </base-button>
                </div>

              </form>
              <!-- /form -->
<!-- 
              <hr>
              <base-button type="primary" style="min-width:162px;" @click="r()">Ready</base-button>
              <base-button type="primary" style="min-width:162px;" @click="l()">Loading</base-button>
              <base-button type="primary" style="min-width:162px;" @click="s()">Success</base-button>
              <base-button type="primary" style="min-width:162px;" @click="e()">Error</base-button> -->

            </div>
          </div>
          <!-- /channel settings row -->

        </div>
      </div>
    </div>
  </section>
</template>

<script>
import SettingsNav from "@/views/Settings/SettingsNav.vue";
import Tile from "@/components/Tiles/Tile.vue";

export default {
  name: "settings-channel",
  components: {
    SettingsNav,
    Tile
  },

  data () {
    return {
      channel: {},
      data: {
        state: "ready"
      },
      profileImage: {
        state: "ready",
        url: null,
        file: null
      },
      payloadFile: {
        state: "ready",
        size: null,
        progress: 0,
        total: 1
      },
      accumulator: {
        title: null,
        slug: null,
        description: null,
        overview: null,
        payload_url: null,
        is_nsfw: false,
        is_unlisted: false,
        subscriber_pays: false,
        subscription_rate: 4.99
      },
      noUISliderOptions: {
        step: 5,
        range: {
          min: 4.99,
          max: 99.99
        },
        pips: {
          mode: 'steps',
          stepped: true,
          density: 1
        }
      }
    }
  },

  created() {
    this.fetchChannelSettings();
  },

  watch: {
    channel() {

      // When the channel object comes through, populate input fields.

      Object.keys(this.accumulator).map(key => {
        if (key === "subscription_rate") {
          this.accumulator[key] = this.channel[key] / 100;
        } else {
          this.accumulator[key] = this.channel[key];
        }
      });
      if (this.channel.profile_url) {
        this.profileImage.url = `${this.channel.profile_url}?${new Date().getTime()}`;
      } else {
        this.profileImage.url = false;
      }     
    }
  },

  computed: {

    hasBeenPublished() {
      return !!this.channel.updated_at;
    },

    // Data Fields

    dataInputValid() {
      return (this.notEmpty(this.accumulator.title) !== false &&
              this.notEmpty(this.accumulator.description) !== false &&
              this.notEmpty(this.accumulator.slug) !== false &&
              this.$config.slugRegex.test(this.accumulator.slug));
    },
    dataChanged() {
      return Object.keys(this.accumulator).map(key => {
        if (key === "subscription_rate") { return parseFloat(this.accumulator[key]) * 100 !== this.channel[key]; }
        else { return (this.accumulator[key] !== this.channel[key]); }
      }).filter(b => b).length > 0;
    },
    dataFieldsIconClass() {
      if (this.data.state === "loading") { return "fas fa-sync-alt fa-spin"; }
      return "fas fa-angle-double-right";
    },
    descriptionInputGroupClass() {
      const valid = this.notEmpty(this.accumulator.description);
      if (valid === false) { return "has-danger form-group input-group"; }
      if (valid === true) { return "has-success form-group input-group"; }
      return "form-group input-group";
    },
    descriptionInputTextareaClass() {
      const valid = this.notEmpty(this.accumulator.description);
      if (valid === false) { return "is-invalid"; }
      if (valid === true) { return "is-valid"; }
    },
    overviewInputGroupClass() {
      if (this.data.state === "success") { return "has-success form-group input-group"; }
      if (this.data.state === "error")   { return "has-danger form-group input-group"; }
      return "form-group input-group";
    },
    overviewInputTextareaClass() {
      if (this.data.state === "success") { return "is-valid"; }
      if (this.data.state === "error")   { return "is-invalid"; }
    },

    // Profile Image

    hasProfileImage() {
      return !!this.profileImage.url && this.profileImage.state !== "error";
    },
    profileImageChanged() {
      if (!this.profileImage.url) { return false; }
      return (this.profileImage.url.replace(/\?.*$/g, "") !== this.channel.profile_url);
    },

    // Payload File

    payloadFileValid() {
      if (!this.payloadFile.size) { return true; }
      return (this.payloadFile.size < 1000000000 * 5); // 5 GB (S3 maximum for one POST)
    },
    payloadFileSize() {
      if (this.payloadFile.size === null) return;
      if (this.payloadFile.size > 1000000000) { return `${(this.payloadFile.size / 1000000000).toFixed(2)} GB`; }
      if (this.payloadFile.size > 1000000) { return `${(this.payloadFile.size / 1000000).toFixed(2)} MB`; }
      if (this.payloadFile.size > 1000) { return `${(this.payloadFile.size / 1000).toFixed(2)} KB`; }
      return `${this.payloadFile.size} B`;
    },
    payloadFileChanged() {
      return !!this.payloadFile.size; // There being a size means the file was changed.
    },
    payloadFileProgress() {
      return (100 * this.payloadFile.progress / this.payloadFile.total);
    },
    payloadFileIconClass() {
      if (this.payloadFile.state === "loading") { return "fas fa-sync-alt fa-spin"; }
      return "fas fa-angle-double-right";
    },
    payloadFileButtonIconClass() {
      if (this.payloadFile.state === "loading") { return "fas fa-sync-alt fa-spin"; }
      if (this.payloadFile.state === "error") { return "fas fa-exclamation-triangle"; }
      if (this.payloadFile.state === "success") { return "fas fa-check text-success"; }
    },

    // Master State

    loading() {
      return (this.data.state === "loading" ||
              this.profileImage.state === "loading" ||
              this.payloadFile.state === "loading");
    },
    success() {
      if (this.loading || this.error) { return false; }
      return (this.data.state === "success" ||
              this.profileImage.state === "success" ||
              this.payloadFile.state === "success");
    },
    error() {
      return (this.data.state === "error" ||
              this.profileImage.state === "error" ||
              this.payloadFile.state === "error");
    }, 
    busy() {
      return (this.loading || this.success || this.error);
    },

    // Submit Button

    submitButtonText() {
      if (!this.busy) { return this.hasBeenPublished ? "Save" : "Publish"; }
    },
    submitButtonDisabled() {
      if (this.busy ||
          !this.dataInputValid ||
          !this.hasProfileImage ||
          !this.payloadFileValid) {
        return true;
      }
      return (!this.dataChanged && !this.profileImageChanged && !this.payloadFileChanged);
    },
    submitButtonType() {
      if (this.success) { return "success"; }
      if (this.error) { return "danger"; }
      return "default";
    },
    submitButtonIconClass() {
      if (this.loading) { return "fas fa-sync-alt fa-spin"; }
      if (this.success) { return "fas fa-check"; }
      if (this.error) { return "fas fa-exclamation-triangle"; }
      return "d-none";
    },    
  },

  methods: {

    notEmpty(field) {

      // "null"  = neutral
      // "true"  = success
      // "false" = danger

      if (field === null) { return null; }
      if ((field || "").length === 0) { return false; }
      
      // General data.state fallback.

      if (this.data.state === "success") { return true; }
      if (this.data.state === "error")   { return false; }

      return null;
    },

    resetState(success=false) {
      if (success) {

        // Reset file inputs and reload settings.

        this.$refs.input.reset();
        this.payloadFile.size = null;
        this.payloadFile.progress = 0;
        this.fetchChannelSettings();
      } else {

        // Reset input state for re-submit.

        this.data.state = "ready";
        this.profileImage.state = "ready";
        this.payloadFile.state = "ready";
      }
    },

    // DEVELOPMENT
    r() {
      this.data.state = "ready";
      this.profileImage.state = "ready";
      this.payloadFile.state = "ready";
    },
    l() {
      this.data.state = "loading";
      this.profileImage.state = "loading";
      this.payloadFile.state = "loading";
    },
    e() {
      this.data.state = "error";
      this.profileImage.state = "error";
      this.payloadFile.state = "error";
    },
    s() {
      this.data.state = "success";
      this.profileImage.state = "success";
      this.payloadFile.state = "success";
    },
    ///////////////////////

    // Payload File

    openPayloadFileInput() {
      this.$refs.payloadFileInput.click();
    },

    setPayloadFile(event) {
      if (event.target.files && event.target.files[0]) {
        var file = event.target.files[0];
        this.accumulator.payload_url = file.name;
        this.payloadFile.size = file.size;
      }
    },

    // Handler

    handleUpdate(e) {
      e.preventDefault();

      if (this.dataChanged)         { this.data.state = "loading" }
      if (this.profileImageChanged) { this.profileImage.state = "loading" }
      if (this.payloadFileChanged)  { this.payloadFile.state = "loading" }

      // Execute the upload process.

      this.saveChannelSettings()
      .then(() => this.uploadFiles())
      .then(() => {

        // Success.

        setTimeout(() => this.resetState(true), 2000);
      }).catch(error => {

        // Error.
        
        setTimeout(() => this.resetState(false), 4000);
        console.error(error);
      });

    },

    fetchChannelSettings() {

      this.profileImage.state = "ready";
      this.payloadFile.state  = "loading";
      this.data.state         = "loading";

      const query = `
        query($channel_id: ID!) {
          getChannelById(channel_id: $channel_id) {
            channel_id,
            slug,
            title,
            description,
            overview,
            earnings_total,
            is_nsfw,
            is_unlisted,
            subscribers,
            profile_url,
            updated_at,
            subscription_rate,
            subscriber_pays,
            payload_url
          }
        }
      `;

      return this.$http.post(`/api/private`,
        { query, vars: {}},
        { headers: this.$getHeaders() })
      .then(response => {
        if (response.data.errors) {

          // There really shouldn't ever be an error here, but whatever.

          // TODO: If "Channel not found", logout().

          this.data.state = "error";
          this.payloadFile.state = "error";
          throw new Error(response.data.errors[0].message);
        }

        const channel = response.data.data.getChannelById;

        // If the channel hasn't been published yet, set its profile_url to false
        // so the profile image tile doesn't freak out about it not having an image.

        if (!channel.updated_at) {
          channel.profile_url = false;
        }

        this.data.state = "ready";
        this.payloadFile.state = "ready";
        this.channel = channel;

      })
      .catch(error => {
        console.error(error);
      });
    },

    saveChannelSettings() {
      if (!this.dataChanged && !this.payloadFileChanged) {
        return Promise.resolve(this.channel.channel_id);
      }

      // Prepare data for GQL.

      const data = Object.assign({}, this.accumulator);

      // Parse subscription rate into integer.

      data.subscription_rate = Math.ceil(parseFloat(data.subscription_rate) * 100);
      if (data.subscription_rate === this.channel.subscription_rate) {
        delete data.subscription_rate;
      }

      const query = `
        mutation($data: ChannelInput!) {
          updateChannel(data: $data) {
            channel_id
          }
        }
      `;

      // Off it goes.
      
      return this.$http.post(`/api/private`,
        { query, vars: { data }},
        { headers: this.$getHeaders() })
      .then(response => {
        if (response.data.errors) {

          // Error.

          this.data.state = "error";
          this.profileImage.state = "ready";
          this.payloadFile.state = "ready";
          throw new Error(response.data.errors[0].message);
        }

        // Success.

        this.data.state = "success";
      });
    },

    async uploadFile(upload_type) {

      // Get the correct file.

      var file;
      switch(upload_type) {
        case "profileImage":
          file = this.profileImage.file;
          break;
        case "payloadFile":
          file = this.$refs.payloadFileInput.files[0];
          break;
      }

      // Prepare data for the upload-URL endpoint.

      const data = {
        upload_type,
        filename: file.name,
        mime_type: file.type
      };

      const query = `
        query($data: GetUploadURLInput!) {
          getUploadURL(data: $data)
        }
      `;

      // Retrieve the upload URL.

      const uploadURL = await this.$http.post(`/api/private`,
        { query, vars: { data }},
        { headers: this.$getHeaders() }
      ).then(response => {
        if (response.data.errors) {

          // Error.

          this[upload_type].state = "error";
          throw new Error(response.data.errors[0].message);
        }

        // Success.

        return response.data.data.getUploadURL;
      })
      .catch(error => {
        console.error(error);
      });

      const onUploadProgress = upload_type === "payloadFile"
                             ? e => {
                               this.payloadFile.progress = e.loaded;
                               this.payloadFile.total = e.total; }
                             : null;

      // Upload the image to the retrieved URL.

      return this.$http.put(uploadURL, file, {
        onUploadProgress,
        transformRequest: [
          (data, headers) => {
            delete headers.common;
            delete headers.put;
            headers["Content-Type"] = file.type;
            return data;
          }
        ]
      })
      .then(response => {

        // Success.

        this[upload_type].state = "success";
      });
    },

    uploadFiles() {

      // Compose array of files to be uploaded.

      const filesToUpload = [
        ...[this.profileImageChanged && this.uploadFile("profileImage")],
        ...[this.payloadFileChanged && this.uploadFile("payloadFile")]
      ].filter(b => b);
      return Promise.all(filesToUpload);
    }
  }
};
</script>