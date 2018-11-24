<template>

  <base-modal :show="show"
              @close="closeModal()"
              body-classes="p-0"
              modal-classes="modal-dialog-centered modal-lg">

    <h6 slot="header" class="modal-title">{{ modalTitle }}</h6>

    <card type="secondary" shadow
          header-classes="bg-white pb-5"
          class="border-0">

      <template>

        <form role="form" ref="input" :class="[{ 'no-click': busy }]">

          <!-- banner input -->
          <div  v-if="isReleaseType"
                @click="openBannerImageInput"
                :class="[{ error: bannerImageError }]"
                class="rounded w-100 mb-4 tile"
                style="padding-bottom: 42.55%; background: #EEEEEE;">

            <img v-if="hasBannerImage" :src="(bannerImage || {}).url" class="position-absolute w-100 h-100 object-cover" v-on:error="bannerImage.url = null;"/>
            <div :class="[{ 'has-image': hasBannerImage }]" class="d-flex justify-content-center align-items-center controls">
                <i :class="bannerImageIconClass"></i>
                <span v-if="!hasBannerImage && bannerImageReady"><small>Upload a banner (2.35 x 1)</small></span>
                <span v-else-if="!hasBannerImage && bannerImageError"><small>Upload failed.</small></span>
            </div>
            <input @change="setBannerImagePreview"
                    ref="bannerImageInput"
                    type="file"
                    accept="image/jpeg, image/png"
                    hidden/>
          </div>
          <!-- /banner input -->

          <!-- row 1 -->
          <div class="row mb-lg-4 mb-3">

            <!-- profile input -->
            <div class="col-lg-6 mb-4 mb-lg-0">
              <div @click="openProfileImageInput"
                   :class="[{ error: profileImageError }]"
                   class="rounded w-100 tile"
                   style="padding-bottom: 100%; background: #EEEEEE;">

                <img v-if="hasProfileImage" :src="profileImage.url" class="position-absolute w-100 h-100 object-cover" v-on:error="profileImage.url = null;"/>
                <div :class="[{ 'has-image': hasProfileImage }]" class="d-flex justify-content-center align-items-center controls">
                  <i :class="profileImageIconClass"></i>
                  <span v-if="!hasProfileImage && profileImageReady"><small>Upload a profile (1 x 1)</small></span>
                  <span v-else-if="!hasProfileImage && profileImageError"><small>Upload failed.</small></span>
                </div>

                <input @change="setProfileImagePreview"
                        ref="profileImageInput"
                        type="file"
                        accept="image/jpeg, image/png"
                        hidden/>
              </div>
            </div>
            <!-- /profile input -->

            <!-- side input -->
            <div class="col-lg-6">

              <!-- string fields -->
              <base-input v-model="accumulator.title"
                          alternative
                          :maxlength="$config.maxLengthTitle"
                          :valid="titleInputValid"
                          class="mb-3"
                          placeholder="Title"
                          :addon-left-icon="dataLoading ? 'fas fa-sync-alt fa-spin' : 'fa fa-angle-double-right'">
              </base-input>
              <base-input v-model="accumulator.slug"
                          alternative
                          :maxlength="$config.maxLengthSlug"
                          :valid="slugInputValid"
                          placeholder="unique-syndicate-slug"
                          :addon-left-icon="dataLoading ? 'fas fa-sync-alt fa-spin' : 'fa fa-angle-double-right'">
              </base-input>
              <!-- /string fields -->

              <!-- switches -->
              <div v-if="type !== 'release'">
                <div class="form-group form-inline mt-4">
                  <base-switch class="mr-3" v-model="accumulator.is_nsfw"></base-switch>
                  <label class="p-0 justify-content-start">Syndicate contains adult content</label>
                </div>
                <div class="form-group form-inline mt-lg-4">
                  <base-switch class="mr-3" v-model="accumulator.is_unlisted"></base-switch>
                  <label class="p-0 justify-content-start">Syndicate is unlisted</label>
                </div>
                <div class="form-group form-inline mt-lg-4 mb-2">
                  <base-switch class="mr-3" v-model="accumulator.subscriber_pays"></base-switch>
                  <label class="p-0 justify-content-start">Subscriber pays processing fees</label>
                </div>
              </div>
              <!-- /switches -->

            </div>
            <!-- /side input -->

          </div>
          <!-- /row 1 -->

          <!-- description input -->
          <div class="form-group input-group input-group-alternative"
              :class="[{ 'has-success': dataSuccess }, { 'has-danger': descriptionInputValid === false }]">
            <div class="input-group-prepend">
              <span class="input-group-text" :class="[{'is-valid': dataSuccess}, {'is-invalid': descriptionInputValid === false}]">
                <slot name="addonLeft">
                  <i :class="dataLoading ? 'fas fa-sync-alt fa-spin' : 'fa fa-angle-double-right'"></i>
                </slot>
              </span>
            </div>
            <textarea v-model="accumulator.description"
                      class="form-control"
                      :maxlength="$config.maxLengthDescription"
                      :class="[{'is-valid': dataSuccess}, {'is-invalid': descriptionInputValid === false}]"
                      rows="7"
                      placeholder="Description..."
                      spellcheck="false">
            </textarea>
          </div>
          <!-- /description input -->

          <!-- payload -->
          <div class="form-group input-group upload-group mb-3">
            <div class="input-group-prepend">
              <span class="input-group-text">
                <i :class="payloadFile.state === `loading` ? `fas fa-sync-alt fa-spin` : `fas fa-angle-double-right`"></i>
              </span>
            </div>
            
            <input v-model="accumulator.payload_url" placeholder="No file selected" class="form-control" disabled>
            <base-button type="primary" @click="openPayloadFileInput()">
              <small v-if="payloadFile.state === 'ready'">Select File</small>
              <i v-if="payloadFile.state !== 'ready'" :class="payloadFileIconClass"></i>
            </base-button>

            <input @change="setPayloadFile"
                    ref="payloadFileInput"
                    type="file"
                    accept="*"
                    hidden/>
          </div>
          <base-progress :value="payloadFileProgress" :height="2" :percentage="false" class="p-0"></base-progress>
          <!-- /payload -->

          <!-- rate input -->
          <div v-if="type !== 'release'" class="row mt-4">
            <div class="col-12" style="margin-bottom: 2.1rem;"><base-slider v-model="accumulator.subscription_rate" :options="noUISliderOptions"></base-slider></div>
            <span class="h5 col-5 offset-1 text-right px-1 d-none d-sm-block">Subscription rate:</span>
            <span class="h5 col-12  col-sm-5 text-center text-sm-left text-success px-1">$ {{ accumulator.subscription_rate }} / month</span>
          </div>
          <!-- /rate input -->

          <hr class="my-4 my-lg-4">

          <!-- submit -->
          <div class="text-center">
            <base-button @click="handler"
                        :type="error ? 'danger' : 'primary'"
                        :class="[{ 'loading': loading }]"
                        :disabled="!uploadEnabled"
                        class="mt-3 mb-3 mb-lg-0 submit-button">
              <span v-if="!busy">{{ modalSubmitText }}</span>
              <i :class="buttonIconClass"></i>
              <span v-if="error || success"><small>{{ error ? "Upload failed." : "Success!" }}</small></span>
            </base-button>
          </div>
          <base-progress :value="progress"></base-progress>
          <!-- /submit -->

        </form>
                  <div class="text-center">
                    <base-button @click="l" type="primary" class="my-1">Loading</base-button>
                  </div>
                  <div class="text-center">
                    <base-button @click="e" type="danger" class="my-1">Error</base-button>
                  </div>
                  <div class="text-center">
                    <base-button @click="s" type="success" class="my-1">Success</base-button>
                  </div>
      </template>
    </card>
  </base-modal>
</template>

<script>
import BaseModal from "@/components/Base/BaseModal.vue";

export default {

  name: "upload-modal",
  props: {
    show: Boolean,
    type: String,
    new: Boolean,
    item: Object
  },

  components: {
    BaseModal
  },

  data () {    
    return this.getDefaultData();
  },

  created() {
    this.profileImage.reader = new FileReader();
    if (this.bannerImage) { this.bannerImage.reader = new FileReader(); }
  },

  watch: {
    show(modalVisible) {

      // If "edit mode", populate input fields.

      if (modalVisible && !this.new) {
        Object.keys(this.accumulator).map(key => { this.accumulator[key] = this.item[key]; });
        this.profileImage.url = `${this.item.profile_url}?${new Date().getTime()}`;
        if (this.bannerImage) {
          this.bannerImage.url = `${this.item.banner_url}?${new Date().getTime()}`;
        }
      }   
    }
  },

  computed: {

    // Handler

    handler() {
      return this.uploadEnabled ? this.handleUpload : this.noop;
    },

    // Type

    isReleaseType() {
      return this.type === "release";
    },
    isSyndicateType() {
      return this.type === "syndicate";
    },
    isProposalType() {
      return this.type === "proposal";
    },
    modalTitle() {
      if (this.isReleaseType) { return (this.new ? "Publish New Release" : "Edit Release"); }
      if (this.isSyndicateType) { return "Create New Syndicate"; }
      if (this.isProposalType) { return "Submit New Proposal"; }
    },
    modalSubmitText(){
      if (this.isReleaseType) { return (this.new ? "Publish" : "Save"); }
      if (this.isSyndicateType) { return "Create"; }
      if (this.isProposalType) { return "Submit"; }
    },

    // Data

    dataChanged() {
      if (this.new) {
        return (this.accumulator.title &&
                this.accumulator.slug &&
                this.accumulator.description);
      } else {
        return Object.keys(this.accumulator).map(key => {
          if (key === "subscription_rate") { return parseFloat(this.accumulator[key]) !== this.item[key]; }
          else { return (this.accumulator[key] !== this.item[key]); }
        }).filter(b => b).length > 0;
      }
    },
    dataSuccess() {
      return (this.data.state === "success");
    },
    dataLoading() {
      return (this.data.state === "loading");
    },
    dataError() {
      return (this.data.state === "error");
    },

    // Data Validation (adds success/error classes)
    // "null" is neutral (no error or success)

    dataInputValid() {
      if (this.data.state === "success") { return true; }
      if (this.data.state === "error") { return false; }
      return null;
    },
    titleInputValid() {
      if (this.accumulator.title === null) { return null; }
      if (this.accumulator.title.length === 0) { return false; }
      return this.dataInputValid;
    },
    slugInputValid() {
      if (this.accumulator.slug === null) { return null; }
      if (this.accumulator.slug.length === 0) { return false; }
      if (!this.$config.slugRegex.test(this.accumulator.slug)) { return false; }
      return this.dataInputValid;
    },
    descriptionInputValid() {
      if (this.accumulator.description === null) { return null; }
      if (this.accumulator.description.length === 0) { return false; }
      return this.dataInputValid;
    },

    // Images

    profileImageReady() {
      return (this.profileImage.state === "ready");
    },
    bannerImageReady() {
      return ((this.bannerImage || {}).state === "ready");
    },
    profileImageError() {
      return (this.profileImage.state === "error");
    },
    bannerImageError() {
      return ((this.bannerImage || {}).state === "error");
    },
    hasProfileImage() {
      return !!this.profileImage.url;
    },
    hasBannerImage() {
      return !!(this.bannerImage || {}).url;
    },
    profileImageChanged() {
      if (this.new) {
        return (this.hasProfileImage)
      } else {
        if (!this.hasProfileImage) { return false; }
        return (this.profileImage.url.replace(/\?.*$/g, "") !== this.item.profile_url);
      }
    },
    bannerImageChanged() {
      if (this.new) {
        return (this.hasBannerImage)
      } else {
        if (!this.hasBannerImage) { return false; }
        return (this.bannerImage.url.replace(/\?.*$/g, "") !== this.item.banner_url);
      }
    },
    imagesChanged() {
      return (this.profileImageChanged || this.bannerImageChanged);
    },
    imagesLoading() {
      return (this.profileImage.state === "loading" ||
              (this.bannerImage || {}).state === "loading");
    },
    imagesError() {
      return (this.profileImageError || this.bannerImageError);
    },

    // Payload File

    payloadFileValid() {
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
      return (100 * this.payloadFile.uploadProgress / this.payloadFile.uploadTotal);
    },

    // All

    busy() {
      return (this.loading ||
              this.error ||
              this.success);
    },
    loading() {
      return (this.dataLoading ||
              this.imagesLoading);
    },
    error() {
      return (this.dataError ||
              this.imagesError);
    },
    progress() {
      var progress = 0;
      var total = 1;
      if (this.dataChanged && !this.imagesChanged) {
        progress = this.data.uploadProgress;
        total = this.data.uploadTotal;
      } else if (this.dataChanged && this.profileImageChanged) {
        progress = this.data.uploadProgress + this.profileImage.uploadProgress;
        total = this.data.uploadTotal + this.profileImage.uploadTotal;
      } else if (this.dataChanged && this.bannerImageChanged) {
        progress = this.data.uploadProgress + this.bannerImage.uploadProgress;
        total = this.data.uploadTotal + this.bannerImage.uploadTotal;
      } else if (this.profileImageChanged && this.bannerImageChanged) {
        progress = this.profileImage.uploadProgress + this.bannerImage.uploadProgress;
        total = this.profileImage.uploadTotal + this.bannerImage.uploadTotal;
      } else if (this.profileImageChanged) {
        progress = this.profileImage.uploadProgress;
        total = this.profileImage.uploadTotal;
      } else if (this.bannerImageChanged) {
        progress = this.bannerImage.uploadProgress;
        total = this.bannerImage.uploadTotal;
      }
      return parseInt(Math.round((progress*100 )/total));
    },

    // Upload Enabled

    uploadEnabled() {

      // If already busy...

      if (this.busy) {
        return false;
      }

      // If inputs are wonky...

      if (this.titleInputValid === false ||
          this.slugInputValid === false ||
          this.descriptionInputValid === false ||
          this.payloadFileValid === false) {
        return false;
      }

      // If the required images are missing...

      if (!this.hasProfileImage ||
          (this.isReleaseType && !this.hasBannerImage)) {
        return false;
      }

      if (this.new) {
        return (this.dataChanged && this.imagesChanged && this.payloadFileChanged);
      } else {
        return (this.dataChanged || this.imagesChanged || this.payloadFileChanged);
      }
    },

    // CSS

    profileImageIconClass() {
      if (this.profileImage.state === "ready") { return "ni ni-fat-add ni-4x"; }
      if (this.profileImage.state === "loading") { return "fas fa-sync-alt fa-spin fa-4x"; }
      if (this.profileImage.state === "success") { return "fas fa-check fa-4x faa-bounce animated text-success"; }
      if (this.profileImage.state === "error") { return "fa fa-exclamation-triangle faa-flash animated red"
                                                    + (this.hasProfileImage ? " fa-4x" : " fa-2x mr-2"); }
    },
    bannerImageIconClass() {
      if ((this.bannerImage || {}).state === "ready") { return "ni ni-fat-add ni-4x"; }
      if ((this.bannerImage || {}).state === "loading") { return "fas fa-sync-alt fa-spin fa-4x"; }
      if ((this.bannerImage || {}).state === "success") { return "fas fa-check fa-4x faa-bounce animated text-success"; }
      if ((this.bannerImage || {}).state === "error") { return "fa fa-exclamation-triangle faa-flash animated red"
                                                    + (this.hasBannerImage ? " fa-4x" : " fa-2x mr-2"); }
    },
    buttonIconClass() {
      if (this.loading) { return "fas fa-sync-alt fa-spin"; }
      if (this.error) { return "fas fa-exclamation-triangle"; }
      if (this.success) { return "fas fa-check text-success"; }
      return "d-none";
    },
    payloadFileIconClass() {
      if (this.payloadFile.state === "loading") { return "fas fa-sync-alt fa-spin"; }
      if (this.payloadFile.state === "error") { return "fas fa-exclamation-triangle"; }
      if (this.payloadFile.state === "success") { return "fas fa-check text-success"; }
      return "d-none";
    }
  },

  methods: {

    noop () {},

    getDefaultData() {

      // Default accumulator with conditional extra properties.

      const accumulator = {
        title: null,
        slug: null,
        description: null,
        payload_url: null,
        ...(this.type !== "release" && { is_nsfw: false }),
        ...(this.type !== "release" && { is_unlisted: false }),
        ...(this.type !== "release" && { subscriber_pays: false }),
        ...(this.type !== "release" && { subscription_rate: 4.99 }),
      };

      // NoUISlider stuff.

      const noUISliderOptions = {
        step: 5,
        start: 4.99,
        range: {
          min: 4.99,
          max: 99.99
        },
        pips: {
          mode: 'steps',
          stepped: true,
          density: 1
        }
      };

      // The whole shebang.

      const data = {
        accumulator,
        success: false,
        data: {
          state: "ready",
          uploadProgress: 0,
          uploadTotal: 1
        },
        profileImage: {
          state: "ready",
          reader: new FileReader(),
          url: null,
          uploadProgress: 0,
          uploadTotal: 1
        },
        payloadFile: {
          state: "ready",
          size: null,
          uploadProgress: 0,
          uploadTotal: 1
        },
        ...(this.type === "release" && {
          bannerImage: {
          state: "ready",
          reader: new FileReader(),
          url: null,
          uploadProgress: 0,
          uploadTotal: 1
        }
      }),
        ...(this.type !== "release" && { noUISliderOptions })
      };
      return data;
    },

    closeModal(success=false) {
      if (success) { this.$emit("upload"); }

      // Close the modal.

      this.$emit("update:show", false);

      // Clear all file inputs.

      this.$refs.input.reset();

      // Reset all fields.

      const defaults = this.getDefaultData();
      for (let key in this.getDefaultData()) {
        this[key] = defaults[key];
      }
    },

    // Profile Image

    openProfileImageInput() {
      this.$refs.profileImageInput.click();
    },
    setProfileImagePreview(event) {
      if (event.target.files && event.target.files[0]) {
        var file = event.target.files[0];
        this.profileImage.reader.onload = e => {
          this.profileImage.url = e.target.result;
          this.profileImage.state = "ready";
        };
        this.profileImage.reader.readAsDataURL(file);
      }
    },

    // Banner Image
    
    openBannerImageInput() {
      this.$refs.bannerImageInput.click();
    },
    setBannerImagePreview(event) {
      if (event.target.files && event.target.files[0]) {
        var file = event.target.files[0];
        this.bannerImage.reader.onload = e => {
          this.bannerImage.url = e.target.result;
          this.bannerImage.state = "ready";
        };
        this.bannerImage.reader.readAsDataURL(file);
      }
    },

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

    // DEVELOPMENT BUTTONS
    l() {
      this.success = false;
      this.data.state = "loading";
      this.profileImage.state = "loading";
      if (this.bannerImage) { this.bannerImage.state = "loading" }
    },
    e() {
      this.success = false;
      this.data.state = "error";
      this.profileImage.state = "error";
      if (this.bannerImage) { this.bannerImage.state = "error" }
    },
    s() {
      this.success = true;
      this.data.state = "success";
      this.profileImage.state = "success";
      if (this.bannerImage) { this.bannerImage.state = "success" }
    },
    /////////////////////

    handleUpload() {
      if (this.dataChanged) { this.data.state = "loading" }
      if (this.profileImageChanged) { this.profileImage.state = "loading"; }
      if (this.bannerImageChanged) { this.bannerImage.state = "loading"; }
      if (this.payloadFileChanged) { this.payloadFile.state = "loading"; }

      // Execute the upload process.

      this.saveItem()
      .then(item_id => this.uploadFiles(item_id))
      .then(values => {

        // Success.

        this.success = true;
        setTimeout(() => this.closeModal(true), 2000);
      }).catch(error => {

        // Error.

        console.error(error);
        setTimeout(() => this.closeModal(false), 4000);
      });
    },

    saveItem() {

      // If release type "edit" and data not changed, skip this method.

      if (this.isReleaseType &&
         !this.new &&
         !this.dataChanged &&
         !this.payloadFileChanged) { return Promise.resolve(this.item.release_id); }

      const data = Object.assign({}, this.accumulator);

      // Possible data mutations...

      const mutations = {
        createRelease: `
          mutation($data: ReleaseInput!) {
            createRelease(data: $data) {
              release_id
            }
          }
        `,
        updateRelease: `
          mutation($data: ReleaseInput!) {
            updateRelease(data: $data) {
              release_id
            }
          }
        `,
        createSyndicate: `
          mutation($data: SyndicateInput!) {
            createSyndicate(data: $data) {
              syndicate_id
            }
          }
        `,
        createProposal: `
          mutation($data: ProposalInput!) {
            createProposal(data: $data) {
              proposal_id
            }
          }
        `
      };

      // Determine the correct mutation.

      var mutation;
      switch(true) {

        // createRelease

        case (this.new && this.isReleaseType):
          mutation = mutations.createRelease;
          break;

        // updateRelease

        case (!this.new && this.isReleaseType):
          mutation = mutations.updateRelease;
          data.release_id = this.item.release_id;
          break;

        // createSyndicate

        case (this.new && this.isSyndicateType):
          mutation = mutations.createSyndicate;
          data.subscription_rate = parseFloat(data.subscription_rate);
          break;

        // createProposal

        case (!this.new && this.isProposalType):
          mutation = mutations.createProposal;
          Object.keys(data).map(key => (data[key] === this.item[key] ? delete data[key] : null));
          if (data.subscription_rate) { data.subscription_rate = parseFloat(data.subscription_rate); }
          if (this.imagesChanged) { data.new_profile = true; }
          data.syndicate_id = this.item.syndicate_id;
          break;
      }

      // Execute the mutation.

      return this.$http.post(`${this.$config.host}/api/private`, {
          query: mutation,
          vars: { data }
        },
        {
          headers: this.$getHeaders(),
          onUploadProgress: e => {
            this.data.uploadProgress = e.loaded;
            this.data.uploadTotal = e.total;
          }
        }
      ).then(response => {

        // Extract the appropriate item_id.

        const item_id = (((response.data || {}).data || {}).createRelease || {}).release_id ||
                        (((response.data || {}).data || {}).updateRelease || {}).release_id ||
                        (((response.data || {}).data || {}).createSyndicate || {}).syndicate_id ||
                        (((response.data || {}).data || {}).createProposal || {}).proposal_id;

        if (!item_id || response.status !== 200 || response.data.errors) {
          this.data.state = "error";
          this.profileImage.state = "ready";
          if (this.bannerImage) { this.bannerImage.state = "ready" }
          throw new Error("Something went wrong.");
        } else {
          this.data.state = "success";
          return item_id;
        }
      });
    },

    async uploadFile(item_id, upload_type) {

      // Get the correct image file.

      var file;
      switch(upload_type) {
        case "profileImage":
          file = this.$refs.profileImageInput.files[0];
          break;
        case "bannerImage":
          file = this.$refs.bannerImageInput.files[0];
          break;
        case "payloadFile":
          file = this.$refs.payloadFileInput.files[0];
          break;
      }

      // Compose params to retrieve the correct upload URL.

      const data = {
        upload_type,
        filename: file.name,
        mime_type: file.type,
        ...(this.isReleaseType && { release_id: item_id }),
        ...(this.type === "syndicate" && { syndicate_id: item_id }),
        ...((!this.new && this.type === "proposal") && { syndicate_id: this.item.syndicate_id, proposal_id: item_id })
      };
      const query = `
        query($data: GetUploadURLInput!) {
          getUploadURL(data: $data)
        }
      `;

      // Retrieve the URL.

      const uploadURL = await this.$http.post(`${this.$config.host}/api/private`, {
          query,
          vars: { data }
        },
        {
          headers: this.$getHeaders(),
          onUploadProgress: e => {
            this[upload_type].uploadProgress = e.loaded;
            this[upload_type].uploadTotal = e.total;
          }
        }
      ).then(response => ((response.data || {}).data || {}).getUploadURL);

      // Upload the image to the retrieved URL.

      return this.$http.put(uploadURL, file)
      .then(response => {
        if (response.status !== 200) {
          this[upload_type].state = "error";
          throw new Error("Something went wrong.");
        } else {
          this[upload_type].state = "success";
        }
      });
    },

    uploadFiles(item_id) {

      // Compose array of images to be uploaded.

      const filesToUpload = [
        ...[this.profileImageChanged && this.uploadFile(item_id, "profileImage")],
        ...[this.bannerImageChanged && this.uploadFile(item_id, "bannerImage")],
        ...[this.payloadFileChanged && this.uploadFile(item_id, "payloadFile")]
      ].filter(b => b);
      return Promise.all(filesToUpload);
    }
  }
};
</script>