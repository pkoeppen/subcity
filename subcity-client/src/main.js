import Vue from "vue";
import subcity from "@/subcity.vue";
import router from "@/router";
import globals from "@/globals";

Vue.config.productionTip = false;
Vue.use(globals);
new Vue({
  router,
  render: h => h(subcity)
}).$mount("#subcity");
