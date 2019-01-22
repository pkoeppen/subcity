<template>
  <div>
    <md-toolbar class="toolbar md-primary" md-elevation="0">
      <div class="container" style="display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; width: 100%; align-items: center;">
          <md-autocomplete id="syndicate-select" @md-opened="autocompleteOpenedFix" @md-selected="selectSyndicate" v-model="selectedSyndicate" :md-options="syndicates.map(s => ({ title: s.title, syndicate_id: s.syndicate_id, toLowerCase: () => s.title.toLowerCase(), toString: () => s.title }))" :disabled="sending" md-layout="box" md-dense>
            <label>Find syndicate</label>
            <template slot="md-autocomplete-item" slot-scope="{ item, term }">
              <md-highlight-text :md-term="term">{{ item.title }}</md-highlight-text>
            </template>
            <template slot="md-autocomplete-empty" slot-scope="{ term }">
              No syndicates matching "{{ term }}" were found.
            </template>
          </md-autocomplete>
          <div style="height: 20px; margin-left: 32px;" v-if="sending">
            <md-progress-spinner class="md-accent" :md-diameter="20" :md-stroke="3" md-mode="indeterminate"/>
          </div>
        </div>
        <div class="section-toolbar-end" style="display: flex;">
          <md-button @click="confirmLeave = syndicate.syndicate_id" :disabled="!syndicate">
            <md-icon>group</md-icon>
            <span style="top: 2px; position: relative;margin-left:6px;">Leave</span>
          </md-button>
          <md-button @click="confirmDissolve = syndicate.syndicate_id" :disabled="!syndicate">
            <md-icon>delete_forever</md-icon>
            <span style="top: 2px; position: relative;margin-left:3px;">Dissolve</span>
          </md-button>
        </div>
      </div>
    </md-toolbar>
    <section class="container">
      <div>
        <md-toolbar v-if="invitations.length" v-for="invitation in invitations" :key="invitation.syndicate_id" class="md-transparent" md-elevation="1" style="margin: 16px 0;">
          <div class="container" style="display: flex;">
            <div style="display: flex; align-items: center;">
              <span style="margin-right: 16px;">
                New invitation to join&nbsp;<nuxt-link :to="`/syndicates/${invitation.syndicate.slug}`">{{ invitation.syndicate.title }}</nuxt-link>.
              </span>
              <md-button class="md-raised" @click="answerInvitation(invitation.syndicate.syndicate_id, true)" :disabled="sending">Accept</md-button>
              <md-button @click="answerInvitation(invitation.syndicate.syndicate_id, false)" :disabled="sending">Decline</md-button>
            </div>
          </div>
        </md-toolbar>

        <form-syndicate :syndicate.sync="syndicate"/>
      </div>

      <md-dialog-confirm
        :md-active.sync="confirmLeave"
        md-title="Confirm abdication"
        md-content="<div style='max-width: 350px'>Syndicate abdication is forever.<br><br>You will be <strong>permanently</strong> removed as member of this syndicate, until reinvited.</div>"
        md-confirm-text="Confirm"
        md-cancel-text="Cancel"
        @md-cancel="confirmLeave = false"
        @md-confirm="leaveSyndicate()" />

        <md-dialog-confirm
          :md-active.sync="confirmDissolve"
          md-title="Confirm dissolution"
          md-content="<div style='max-width: 350px'>Syndicate dissolution is forever.<br><br>If approved, all subscriptions will be cancelled, and all content will be <strong>permanently</strong> deleted from our servers.</div>"
          md-confirm-text="Confirm"
          md-cancel-text="Cancel"
          @md-cancel="confirmDissolve = false"
          @md-confirm="dissolveSyndicate()" />
    </section>
  </div>
</template>

<script>
  import FormSyndicate from "~/components/FormSyndicate.vue";

  export default {
    name: "SettingsSyndicates",
    components: { FormSyndicate },

    head () {
      return {
        title: `Syndicates || sub.city`,
      }
    },

    fetch ({ store, redirect }) {
      if (!store.state.role || store.state.role !== 'channel') {
        return redirect('/portal?login=true')
      }
    },

    data: () => ({
      confirmDissolve: false,
      confirmLeave: false,
      invitations: [],
      syndicate: null,
      syndicates: [],
      selectedSyndicate: "",
      sending: true,
      DATA_HOST: process.env.DATA_HOST,
    }),

    watch: {
      selectedSyndicate (selected, old) {
        if (!selected && selected !== old){
          this.syndicate = null;
        }
      },
      syndicate (syndicate, old) {
        if (!syndicate && syndicate !== old) {
          this.selectedSyndicate = "";
        }
      }
    },

    mounted () {

      const query = `
        query {
          getSyndicatesByChannelID {
            syndicate_id,
            description { raw },
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

            members {
              channel_id,
              slug,
              title,
              tiers {
                _1 {
                  active,
                  rate
                },
                _2 {
                  active,
                  rate
                },
                _3 {
                  active,
                  rate
                }
              }
            },

            proposals {
              stage,
              time_created,
              type,
              updates {
                description { rendered },
                links {
                  discord,
                  facebook,
                  instagram,
                  twitch,
                  twitter,
                  youtube,
                },
                new_profile,
                payload,
                slug,
                tiers {
                  _1 {
                    active,
                    title,
                    description { rendered },
                    rate
                  },
                  _2 {
                    active,
                    title,
                    description { rendered },
                    rate
                  },
                  _3 {
                    active,
                    title,
                    description { rendered },
                    rate
                  },
                },
                title,
                unlisted,
              },
              votes {
                channel_id,
                vote
              },

              channel {
                slug,
                title,
              },

              slave {
                slug,
                title,
              },

              master {
                slug,
                title,
              },
            },

            subscriptions {
              subscription_id,
              time_created,
            },

            transfers {
              amount,
              channel_id,
              fee_platform,
              fee_processor,
              time_created,
            },
          }
        }
      `;

      const _0 = this.$axios.post("/api/private", { query })
      .then(({ data: { getSyndicatesByChannelID: syndicates }}) => {
        this.syndicates = syndicates;
      })
      .catch(error => this.$store.dispatch("error", error))
      .finally(() => { this.sending = false });

      const _1 = this.getInvitations();

      return Promise.all([_0,_1]);
    },

    methods: {

      answerInvitation (syndicate_id, decision) {
        this.sending = true;

        return this.$store.dispatch("answerInvitation", { syndicate_id, decision })
        .then(() => {
          this.$store.dispatch("success", {
            message: "Decision submitted successfully.",
            status: 200
          });
          if (decision === true) {
            this.$router.go({ path: "/settings/syndicates", force: true });
          } else {
            this.invitations = this.invitations.filter(({ syndicate_id: id }) => id !== syndicate_id);
          }
        })
        .catch(error => this.$store.dispatch("error", error))
        .finally(() => { this.sending = false });
      },

      autocompleteOpenedFix () {
        this.selectedSyndicate = this.selectedSyndicate ? this.selectedSyndicate + " " : " ";
        this.selectedSyndicate = this.selectedSyndicate.substring(0, this.selectedSyndicate.length - 1)
      },

      selectSyndicate ({ syndicate_id }) {
        const syndicate = this.syndicates.find(({ syndicate_id: id }) => id === syndicate_id);
        this.syndicate = Object.assign({}, syndicate);
      },

      dissolveSyndicate () {
        this.sending = true;

        const data = {
          syndicate_id: this.confirmDissolve,
          type: "dissolve",
        };

        return this.$store.dispatch("createProposal", data)
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
          this.confirmDissolve = false;
        });
      },

      leaveSyndicate () {
        this.sending = true;

        return this.$store.dispatch("leaveSyndicate", this.confirmLeave)
        .then(() => {
          this.$store.dispatch("success", {
            message: "Syndicate abdication successful.",
            status: 200
          });
          this.$router.go({ path: "/settings/syndicates", force: true });
        })
        .catch(error => {
          this.$store.dispatch("error", error);
        })
        .finally(() => {
          this.sending = false;
          this.confirmLeave = false;
        });
      },

      getInvitations () {
        this.sending = true;

        const query = `
          query {
            getInvitationsByChannelID {
              syndicate {
                slug,
                syndicate_id,
                title,
              }
            }
          }
        `;

        return this.$axios.post("/api/private", { query })
        .then(({ data: { getInvitationsByChannelID: invitations }}) => {
          this.invitations = invitations;
        })
        .catch(error => this.$store.dispatch("error", error))
        .finally(() => { this.sending = false });
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

      bannerURL (syndicate_id) {
        return `${this.DATA_HOST}/channels/${this.$store.state.id}/syndicates/${syndicate_id}/banner.jpeg`;
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

  .md-button[disabled] i {
    color: rgba(0, 0, 0, .26) !important;
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

  #syndicate-select {
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

  .toolbar {
    width: calc(100% + 32px;);
    position: relative;
    left: -16px;
    padding-left: 16px;
    padding-right: 16px;
  }

</style>
