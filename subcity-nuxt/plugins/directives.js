import Vue from "vue";

Vue.directive("cents", function (el, { value }) {

  // Convert cents amount to dollars amount.

  const display = (value / 100).toFixed(2).replace(/(\d)(?=(\d{3})+(?:\.\d+)?$)/g, "$1,");
  el.innerHTML = `$ ${display}`;
});

Vue.directive("numbers", function (el) {

  // Only allow number keypresses.

  el.onkeydown = function (event) {
  	const { keyCode } = event;
    const { target: { value }} = event;

    if (keyCode === 8) return true;

    if (value.length + 1 > 6) {
      event.preventDefault();
    } else if (keyCode < 32 || keyCode > 46 && keyCode < 58) {
      return true;
    } else {
      event.preventDefault();
    }
  }
});

Vue.directive("image-src", function (el, { value }) {

  const {
    channel_id,
    syndicate_id,
    time_created
  } = value;

  if (channel_id) {
    if (time_created) {
      el.src = `https://s3.amazonaws.com/subcity-bucket-out-dev/channels/${channel_id}/releases/${time_created}/banner.jpeg`; 
    } else {
      el.src = `https://s3.amazonaws.com/subcity-bucket-out-dev/channels/${channel_id}/profile.jpeg`
    }
    
  } else if (syndicate_id) {
    if (time_created) {
      el.src = `https://s3.amazonaws.com/subcity-bucket-out-dev/syndicates/${syndicate_id}/proposals/${time_created}/profile.jpeg`; 
    } else {
      el.src = `https://s3.amazonaws.com/subcity-bucket-out-dev/syndicates/${syndicate_id}/profile.jpeg`
    }
  }
});