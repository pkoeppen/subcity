<template>
  <section class="section p-0">
    
    <!-- container -->
    <div class="container">

          <!-- row -->
          <div class="row">

            <!-- banner image -->
            <div class="col-12">
              <div class="position-relative">
                <div v-if="release.is_nsfw" class="nsfw-pin">
                  <svg viewbox="0 0 100 100">
                    <polygon points="0,0 100,0 100,100"/>
                  </svg>
                  <span>18+</span>
                </div>

                <card class="border-0 rounded-0" shadow body-classes="h-100 m-4 p-0 position-relative">
                  
                  <img :src="release.banner_url"
                    class="img-fluid w-100"
                    v-show="bannerImageLoaded"
                    v-on:load="banner.state = 'loaded'"
                    v-on:error="banner.state = 'error'">
                  <content-loader v-if="banner.state === 'loading'"
                    primaryColor="#EEEEEE"
                    secondaryColor="#DDDDDD"
                    :speed=".5"
                    :width="100"
                    :height="42">
                  <rect x="0" y="0" width="100" height="100" />
                </content-loader>
                <div v-else-if="banner.state === 'error'">
                  <div class="d-flex justify-content-center align-items-center position-absolute w-100 h-100">
                    <i class="ni ni-image" style="font-size:4rem;"></i>
                  </div>
                  <svg viewBox="0 0 100 42" preserveAspectRatio="xMidYMin" class="img-fluid">
                    <rect x="0" y="0" width="100" height="42" fill="#EEEEEE"/>
                  </svg>
                </div>

              </card>
            </div>
          </div>
          <!-- /banner image -->
        </div>

        <!-- row -->
        <div class="row">

          <!-- release title, description -->
          <div class="col-12 mt-5">

            <h1 class="display-header text-center">{{ release.title }}</h1>
            <p v-html="release.description" class="text-justify px-4 my-0"></p>
            <div class="text-center mt-3">
              <a :href="release.download_url">{{ release.payload_url }}</a>
            </div>

            <content-loader
              v-if="content.state === '_loading'"
              primaryColor="#EEEEEE"
              secondaryColor="#DDDDDD"
              :speed=".5"
              :width="100"
              :height="82">
              <rect x="0" y="0" width="100" height="22" />
              <rect x="0" y="27" width="92" height="5" />
              <rect x="0" y="37" width="98" height="5" />
              <rect x="0" y="47" width="94" height="5" />
              <rect x="0" y="57" width="90" height="5" />
              <rect x="0" y="67" width="98" height="5" />
              <rect x="0" y="77" width="94" height="5" />
              <rect x="0" y="87" width="88" height="5" />
            </content-loader>

          </div>
          <!-- /release title, description -->

        </div>
        <!-- /row -->

        <div class="row">
          <div class="col-12">

            <div class="d-flex my-5 align-items-center">
              <hr class="flex-fill m-0">
              <h4 class="heading my-0 mx-3 text-muted">Payload</h4>
              <hr class="flex-fill m-0">
            </div>

            <div v-if="!channel.is_subscribed">
              not subscribed
            </div>

            <file-embed v-else-if="release.download_url"
                        :channel_id="channel.channel_id"
                        :display_url="release.payload_url"
                        :download_url="release.download_url">
            </file-embed>

            <div v-else class="text-center">
              <span>No payload to display.</span>
            </div>

          </div>
        </div>

        <div class="row">
          <div class="col-12">
            
            <div class="d-flex my-5 align-items-center">
              <hr class="flex-fill m-0">
              <h4 class="heading my-0 mx-3 text-muted">More from {{ channel.title }}</h4>
              <hr class="flex-fill m-0">
            </div>

          </div>
        </div>


    </div>
    <!-- /container -->
  </section>
</template>

<script>

import PaginatorRelease from "@/components/Paginators/PaginatorRelease.vue";
import FileEmbed from "@/components/FileEmbed.vue";
import { ContentLoader } from "vue-content-loader";
import auth from "@/auth/";

export default {

  components: {
    ContentLoader,
    FileEmbed
  },

  data () {
    return {
      banner: {
        state: "loading"
      },
      content: {
        state: "loading"
      },
      data: {
        state: "ready"
      },
      channel: {},
      release: {},
      modal: {
        subscribe: false,
        onetime: false,
        invite: false
      },
      onetime: {
        amount: 25,
        hasFocus: false
      },
      cardNumberValid: false,
      cardExpiryValid: false,
      cardCvcValid: false,
      authenticated: auth.isAuthenticated(),
      role: auth.getRole(),
      invitableSyndicates: [],
      hostSyndicate: null
    }
  },

  created () {
    this.fetchChannel();
  },

  computed: {

    bannerImageLoaded() {
      return this.banner.state === "loaded";
    },

    // Master State

    loading() {
      return (this.data.state === "loading" ||
              this.content.state === "loading");
    },
    success() {
      return (this.data.state === "success");
    },
    error() {
      return (this.data.state === "error" ||
              this.content.state === "error");
    },
    busy() {
      return (this.loading || this.success || this.error);
    },

  },

  methods: {

    fetchChannel() {
      //this.data.state = "loading";

      const channel_slug = this.$route.params.channel_slug;
      const release_slug = this.$route.params.release_slug;

      const vars = {
        channel_slug,
        release_slug
      };

      // If the user is authenticated, add a slot in the query for their
      // role, and send the request to the private API instead of the public.

      const role = this.authenticated && auth.getRole();
      let roleString1 = "";
      let roleString2 = "";

      if (role) {
        roleString1 = `, $${role}_id: ID`;
        roleString2 = `, ${role}_id: $${role}_id`;
      }

      const query = `
        query($channel_slug: String!${roleString1}, $release_slug: String!) {
          getChannelBySlug(slug: $channel_slug${roleString2}) {
            channel_id,
            slug,
            profile_url,
            payload_url,
            description,
            title,
            is_nsfw,
            subscription_rate,
            is_subscribed,
            release(slug: $release_slug) {
              title,
              description,
              banner_url,
              download_url,
              payload_url
            },
            syndicates {
              syndicate_id,
              title,
              channels {
                channel_id
              }
            }
          }
        }
      `;

      const url = `/api/${role ? "private" : "public"}`;

      return this.$http.post(url,
        { query, vars },
        { headers: this.$getHeaders() })
      .then(response => {
        if (response.data.errors) {

          // Error (release not found).

          throw new Error(response.data.errors[0].message);
          //this.$router.push("/404");
        }

        // Success.

        const channel = response.data.data.getChannelBySlug;
        this.channel = channel;
        this.release = channel.release;
        console.log("is_subscribed:", channel.is_subscribed)
        console.log("download_url:", channel.release.download_url)
        // this.content.state = "loaded";
        // this.data.state = "ready";

      }).catch(error => {        
        console.error(error);
      });
    }
  }
};

</script>
