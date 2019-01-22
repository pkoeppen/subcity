module.exports = {
  axios: {
    baseURL: process.env.NODE_ENV === 'prod' ? 'https://api.sub.city' : 'http://localhost:3001',
  },
  build: {
    analyze: false,
    publicPath: '/static/',
    vendor: ['vue-material'],
    extend (config, { isDev, isClient }) {
      if (isDev && isClient) {
        config.module.rules.push({
          enforce: 'pre',
          test: /\.(js|vue)$/,
          loader: 'eslint-loader',
          exclude: /(node_modules)/
        })
      }
    },
  },
  transition: 'fade',
  css: [
    { src: 'vue-material/dist/vue-material.min.css', lang: 'css' },
    { src: '~/assets/theme.scss', lang: 'scss' },
    { src: '~/assets/main.scss', lang: 'scss' },
    { src: '~/assets/fonts.scss', lang: 'scss' },
  ],
  dev: false,
  env: {
    DATA_HOST: process.env.NODE_ENV === 'prod' ? 'https://data.sub.city' : 'https://data-dev.sub.city',
    STRIPE_PUBLIC_KEY: process.env.NODE_ENV === 'prod' ? 'pk_live_knI7jgJ9opsDLcuDWerIoVK6' : 'pk_test_7yS5dDjXxrthjZg8ninXVLUK',
  },
  head: {
    title: 'sub.city',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: 'A collaborative subscription platform.' },
    ],
    link: [
      { rel: 'icon', type: 'image/png', href: '/favicon.png' },
      { rel: 'stylesheet', href: '//fonts.googleapis.com/css?family=Material+Icons' },
    ],
    script: [
      { src: 'https://js.stripe.com/v3', defer: true },
    ],
  },
  loading: { color: '#ff5252' },
  mode: 'universal',
  modules: [
    '@nuxtjs/axios',
  ],
  plugins: [
    { src: '~/plugins/directives.js' },
    { src: '~/plugins/axios.js' },
    { src: '~/plugins/bus-inject.js' },
    { src: '~/plugins/vue-material' },
  ],
  router: {
    scrollBehavior,
    base: `/`,
    middleware: ['slug-forward'],
  },
};

function scrollBehavior(to, from, savedPosition) {
const wrapper = document.getElementsByClassName('md-app-scroller')[0];
  return new Promise(resolve => {
    window.$nuxt.$once('triggerScroll', () => {
      wrapper.scrollTop = 0;
    });
  });
}
