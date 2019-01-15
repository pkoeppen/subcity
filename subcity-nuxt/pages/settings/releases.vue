<template>
  <section class="container">

    <md-toolbar class="fullwidth-toolbar md-primary" md-elevation="0">
      <div class="container">
        <div style="display: flex; width: 100%; align-items: center;">
          <md-autocomplete id="release-select" @md-opened="autocompleteOpenedFix" @md-selected="selectRelease" v-model="selectedRelease" :md-options="releases.map(r => ({ title: r.title, time_created: r.time_created, toLowerCase: () => r.title.toLowerCase(), toString: () => r.title }))" :disabled="sending" md-layout="box" md-dense>
            <label>Find release</label>
            <template slot="md-autocomplete-item" slot-scope="{ item, term }">
              <md-highlight-text :md-term="term">{{ item.title }}</md-highlight-text>
            </template>
            <template slot="md-autocomplete-empty" slot-scope="{ term }">
              No releases matching "{{ term }}" were found.
            </template>
          </md-autocomplete>
          <div style="height: 20px; margin-left: 32px;" v-if="sending">
            <md-progress-spinner class="md-accent" :md-diameter="20" :md-stroke="3" md-mode="indeterminate"/>
          </div>
<!--           <div class="md-caption" style="margin-left: 32px" v-else>
            {{ releases.length }} release{{ !releases.length || releases.length > 1 ? "s" : "" }}
          </div> -->
        </div>
        <md-button @click="">
          Create New
        </md-button>
      </div>
    </md-toolbar>

    <div class="md-layout" style="margin-top: 64px;">
      <div v-if="releases.length" class="md-layout-item md-size-40" style="margin-top: 32px;">
        <div v-for="release in releases" style="margin: 0 16px 16px 0;">

          <md-card style="margin: 0;">
            <md-card-media-cover md-solid>
              <md-card-media class="ratio-widescreen">
                <img :src="bannerURL(release.time_created)" class="image"/>
              </md-card-media>
              <md-card-area>
                <md-card-header>
                  <span class="md-title">{{ release.title }}</span>
                  <nuxt-link :to="`https://sub.city/channels/${channel_slug}/${release.slug}`" style="margin-right: 80px;">
                    https://sub.city/channels/{{ channel_slug }}/{{ release.slug }}
                  </nuxt-link>
                </md-card-header>
              </md-card-area>
            </md-card-media-cover>

            <div class="speed-dial">
              <md-speed-dial md-direction="top">
                <md-speed-dial-target class="md-primary" @click="selectRelease(release)">
                  <md-icon>edit</md-icon>
                </md-speed-dial-target>

                <md-speed-dial-content class="md-primary">
                  <md-button class="md-icon-button" @click="confirmDelete = release.time_created">
                    <md-icon>delete</md-icon>
                  </md-button>

                  <md-button class="md-icon-button">
                    <md-icon>share</md-icon>
                  </md-button>
                </md-speed-dial-content>
              </md-speed-dial>
            </div>
          </md-card>

        </div>
      </div>

      <div v-else class="md-layout-item md-size-40">
        <md-empty-state
          md-icon="perm_media"
          md-label="Create your first release"
          md-description="Creating project, you'll be able to upload your design and collaborate with people."
          style="margin-top: 64px;">
          <md-button class="md-primary md-raised" @click="showDialog = true">Create new</md-button>
        </md-empty-state>
      </div>

      <div class="md-layout-item md-size-60">
        <form-release :release.sync="release" :slug="channel_slug"/>
      </div>
    </div>

    <md-dialog-confirm
      :md-active.sync="confirmDelete"
      md-title="Are you sure you want to delete this release?"
      md-content="Release deletion is forever. <br> All files and content will be <strong>permanently</strong> deleted from our servers."
      md-confirm-text="Confirm"
      md-cancel-text="Cancel"
      @md-cancel="confirmDelete = false"
      @md-confirm="deleteRelease()" />
  </section>
</template>

<script>
  import FormRelease from "~/components/FormRelease.vue";

  export default {
    name: "SettingsReleases",
    components: { FormRelease },

    data: () => ({
      channel_slug: null,
      confirmDelete: false,
      release: null,
      releases: [],
      selectedRelease: "",
      sending: true,
      DATA_HOST: process.env.DATA_HOST,
    }),

    watch: {
      release (release) {
        if (!release) {
          this.selectedRelease = "";
        }
      }
    },

    mounted () {

      const query = `
        query {
          getChannelByID {
            slug,
            releases {
              description { raw },
              payload,
              slug,
              tier,
              time_created,
              time_updated,
              title,
            }
          }
        }
      `;

      return this.$axios.post("/api/private", { query })
      .then(({ data: { getChannelByID: channel }}) => {
        this.channel_slug = channel.slug;
        this.releases = channel.releases;
      })
      .catch(error => this.$store.dispatch("error", error))
      .finally(() => { this.sending = false; });
    },

    methods: {

      autocompleteOpenedFix () {
        this.selectedRelease = this.selectedRelease ? this.selectedRelease + " " : " ";
        this.selectedRelease = this.selectedRelease.substring(0, this.selectedRelease.length - 1)
      },

      selectRelease ({ time_created }) {
        const release = this.releases.find(({ time_created: t }) => t === time_created);
        this.release = Object.assign({}, release);
      },

      deleteRelease () {
        this.sending = true;

        return this.$store.dispatch("deleteRelease", this.confirmDelete)
        .then(() => {
          this.$store.dispatch("success", {
            message: `Release deleted successfully.`,
            status: 200
          });
          this.$router.go({ path: "/settings/releases", force: true });
        })
        .catch(error => {
          this.$store.dispatch("error", error);
        })
        .finally(() => {
          this.sending = false;
          this.confirmDelete = false;
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
      },

      bannerURL (time_created) {
        return `${this.DATA_HOST}/channels/${this.$store.state.id}/releases/${time_created}/banner.jpeg`;
      },
    },

    computed: {

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

  .fullwidth-toolbar {
    position: absolute;
    top: 16px;
    width: 100vw;
    left: -8px;

    .container {
      width: 100%;
      display: flex;
      justify-content:
      space-between;
      align-items: center;
    }
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

  .speed-dial {
    z-index: 10;
    position: absolute;
    right: 0;
    top: 0;
    height: 100%;
    display: flex;
    align-items: center;
    padding-right:16px;

    .md-speed-dial-target {
      background: rgba(255,255,255,.1) !important;
    }
  }

</style>
