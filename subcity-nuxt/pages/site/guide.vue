<template>
  <div>
    <md-toolbar class="toolbar" md-elevation="0">
      <div class="container" style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <nuxt-link to="/">&raquo; site</nuxt-link>
          <nuxt-link to="/site/guide" style="margin-left: 8px;">&raquo; guide</nuxt-link>
        </div>
        <md-badge class="badge md-square md-primary" md-content="Updated: 16 Jan 2019" />
      </div>
    </md-toolbar>
    <section class="container" style="margin-top: 32px;">
      <div class="md-layout md-gutter" style="justify-content: center;">
        <div class="md-layout-item md-size-50 md-small-size-100" style="display: flex; justify-content: center; margin-bottom: 16px;">
          <img src="~/static/images/guide.png" style="height: 100%; width: 100%;"/>
        </div>
        <div id="signup" class="md-layout-item md-size-80 md-small-size-100">
          <md-card>
            <md-card-content>
              <div class="md-display-2 bold-italic" style="text-transform: uppercase; margin-bottom: 16px;">Signing up</div>
              <md-divider style="margin-bottom: 32px;"/>
              <p>For channels, <nuxt-link to="/">sub.city</nuxt-link> is invite-only. However, you can <a href="mailto:apply@sub.city">submit an application for direct approval</a> if you're one of the following &mdash; 1) A <strong>content creator with a demonstrable track record</strong>, 2) an <strong>online business with existing subscribers</strong>, or 3) otherwise able to prove your ability to draw traffic. We essentially just need proof that you have content to publish and won't pollute the platform with a vacant account. To apply, send an informal letter of introduction to <a href="mailto:apply@sub.city">apply@sub.city</a>, and we'll continue the conversation from there. Once you've received an invite from the sub.city staff or an existing member channel, simply visit your secret link to initialize your account.</p>
              <p>Subscribers with a valid credit card can sign up any time at <nuxt-link to="/portal">https://sub.city/portal</nuxt-link>.</p>
            </md-card-content>
          </md-card>
        </div>
        <div id="channels" class="md-layout-item md-size-80 md-small-size-100">
          <md-card>
            <md-card-content>
              <div class="md-display-2 bold-italic" style="text-transform: uppercase; margin-bottom: 16px;">Getting started</div>
              <md-divider style="margin-bottom: 32px;"/>
              <div class="md-title">Publishing your channel</div>
              <p>The first step you should take after creating your account and verifying your email address is publishing your channel. You can find all details related to your channel's appearance content on the <nuxt-link to="/settings/channel">channel settings</nuxt-link> page, where you can update your channel's title, slug, description, profile image, payload file, tiers, and funding type. The following is a closer explanation of each of these attributes.</p>
              <div style="padding: 0 16px;">
                <p><strong>Title.</strong> The public title of your channel.</p>
                <p><strong>Slug.</strong> The URL endpoint for your channel on the sub.city platform.&nbsp;&nbsp;<span class="md-caption">https://sub.city/{yourslughere}</span></p>
                <p><strong>Description.</strong> A description of your channel, up to 5000 characters long. You can elaborate on your channel's purpose, history, and aims in the description. You can also style its content with limited <a href="https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet">Markdown</a>.</p>
                <p><strong>Profile.</strong> Your channel's public avatar. All uploaded images are cropped to a <strong>1 : 1</strong> ratio.</p>
                <p><strong>Payload.</strong> Your channel comes with an optional slot to upload a file of your choice, such as a welcome video or sample pack. The file type is unrestricted. Note that, unlike release payload files, your channel's payload file is <em>publicly accessible.</em></p>
                <p><strong>Tiers.</strong> The platform provides <em>three tier levels</em> that can be activated or deactivated at will, with the exception of the base tier, which is always active and cannot be turned off. Active tiers are visible to prospective subscribers and can enroll new subscribers at any time, while deactivated tiers remain hidden and closed to subscription. Each release you publish is assigned a tier that designates your subscribers' level of access. When a subscriber subscribes to one of your tiers, they unlock every release at or below the tier level to which they subscribed. For example, if I subscribe to Tier 2 on your channel, I gain access to all of your channel's Tier 1 and Tier 2 releases, with Tier 3 releases remaining locked. Deactivating an active tier does not affect existing subscribers.</p>
                <p><strong>Funding.</strong> You can fund your channel on either a <em>monthly</em> or <em>per release</em> basis. Under the monthly model, your subscribers are charged recurrently every thirty days from the moment they subscribe to your channel. Under the per-release model, your subscribers are charged every time you publish a release according to the tier to which they subscribed. To protect subscribers, the per-release model carries a maximum of two published releases per week.</p>
              </div>
            </md-card-content>
          </md-card>
        </div>
        <div id="syndicates" class="md-layout-item md-size-80 md-small-size-100">
          <md-card>
            <md-card-content>
              <div class="md-display-2 bold-italic" style="text-transform: uppercase; margin-bottom: 16px;">Syndicates</div>
              <md-divider style="margin-bottom: 32px;"/>
              <div class="md-title">Starting a syndicate</div>
              <p>The sub.city platform is build around collaboration between channels. Channels are able to earn mutually by creating a <em>syndicate</em>, a grouping of channels to which subscribers can subscribe <strong>to gain access to all member channels simultaneously</strong>. Syndicate subscriptions work in exactly the same manner as those of channels, with the exception that their funding type is restricted to the monthly model. When a subscriber subscribes to a given tier of a syndicate, the subscriber unlocks every tier at or below that level in each of the syndicate's member channels. A syndicate's tiers function as a pass-through, superseding the tiers of each of its members. Subscription payments gathered by the syndicate are then split and distributed equally between all member channels. The following are points to keep in mind when operating a syndicate.</p>
              <div style="padding: 0 16px;">
                <p><strong>Changing the syndicate.</strong> After initial creation, changes to the syndicate must undergo a democratic approval process in the form of <em>proposals</em>. Changing the syndicate's title for instance requires a member channel to explicitly submit a proposal to change the title, which will then only be implemented if votes to approve the proposal surpass two-thirds of the channel's total membership. Likewise for proposal rejection. Proposals that are neither approved nor rejected within a twenty-four hour window receive a status of <em>expired</em>, no longer able to accept votes of either kind. Proposals are deleted one week after the moment they are approved, rejected, or expired.</p>
                <p><strong>Adding new members.</strong> Member channels can invite channels to join the syndicate by visiting the receiving channel's page, clicking the "invite" button under the channel's profile image, and selecting the target syndicate from the list of joinable syndicates. This creates a new proposal in the target syndicate that must be approved before an invite is sent to the receiving channel for secondary approval. If the approval process succeeds, the channel in question is effectively added as the newest member of the syndicate.</p>
                <p><strong>Merging syndicates.</strong> In the event that one syndicate wishes to merge with another, any member of the parent syndicate can visit the page of the child syndicate and submit a <em>merge request</em> proposal. After the proposal is approved within the parent syndicate, a second <em>merge approval</em> proposal is generated in the child syndicate. If this second proposal is approved, all memberships and subscriptions to the child syndicate are transferred to the parent syndicate, after which the child syndicate is permanently dissolved.</p>
                <p><strong>Abdication &amp; dissolution.</strong> Member channels can disband their syndicate at any time with a <em>dissolution proposal</em>. Upon approval, all memberships and subscriptions to the syndicate are terminated and the syndicate itself is permanently deleted. Additionally, single channels can leave the syndicate at will by clicking the "leave syndicate" button on the syndicate's settings page.</p>
              </div>
            </md-card-content>
          </md-card>
        </div>

        <div id="subscribers" class="md-layout-item md-size-80 md-small-size-100">
          <md-card>
            <md-card-content>
              <div class="md-display-2 bold-italic" style="text-transform: uppercase; margin-bottom: 16px;">Subscribers</div>
              <md-divider style="margin-bottom: 32px;"/>
              <div class="md-title">Managing subscribers</div>
              <p>You can find a list of subscribers on your <nuxt-link to="/settings/subscribers">subscriber settings</nuxt-link> page, which contains a table with information about each of your subscribers, including their name, email, subscribed tier, and shipping address, if supplied. The nature of their subscription, be it direct or via syndicate, is also displayed.</p>
            </md-card-content>
          </md-card>
        </div>
      </div>
    </section>
  </div>
</template>

<script>

  export default {
    name: "Guide",
    head () {
      return {
        title: `Guide || sub.city`,
      }
    },
  }
</script>

<style lang="scss" scoped>

  .badge {
    color: white !important;
    background-color: #666 !important;
    text-transform: uppercase;
    position: relative;
    right: 0;
  }

  .md-layout-item {
    margin-bottom: 40px;
  }

  .md-card {

    .md-card-content {
      padding: 32px;
    }

    @media screen and (max-width: 600px) {
      margin: 0;

      .md-card-content {
        padding: 16px;
      }
    }
  }
  
  p {
    line-height: 28px;
  }

  .toolbar {
    width: calc(100% + 32px;);
    position: relative;
    left: -16px;
    padding-left: 16px;
    padding-right: 16px;
  }

</style>