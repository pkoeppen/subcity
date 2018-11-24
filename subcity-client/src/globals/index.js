import "@/assets/vendor/nucleo/css/nucleo.css";
import "@/assets/vendor/font-awesome/css/all.css";
import "@/assets/vendor/font-awesome/css/font-awesome-animation.css";
import "@/assets/scss/argon.scss";
import globalComponents from "./globalComponents";
import globalDirectives from "./globalDirectives";
import config from "./config";

export default {

  install(Vue) {

    for (let [key, value] of Object.entries(config)) {
      Vue.prototype[key] = value;
    }
    
    Vue.use(globalComponents);
    Vue.use(globalDirectives);
   // Vue.use(VueLazyload);
  }
};
