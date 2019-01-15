module.exports = {
  axios: {
    baseURL: "http://localhost:3001"
  },
  build: {
    analyze: false,

    publicPath: `/static/`,
    vendor: ["vue-material"],
    // extend (config, { isDev, isClient }) {
    //   if (isDev && isClient) {
    //     config.module.rules.push({
    //       enforce: "pre",
    //       test: /\.(js|vue)$/,
    //       loader: "eslint-loader",
    //       exclude: /(node_modules)/
    //     })
    //   }
    // }
  },
  css: [
    { src: "vue-material/dist/vue-material.min.css", lang: "css" },
    { src: "~/assets/theme.scss", lang: "scss" },
    { src: "~/assets/fonts.scss", lang: "scss" }
  ],
  dev: false,
  env: {
    API_HOST: "http://localhost:3001",
    DATA_HOST: "https://s3.amazonaws.com/subcity-bucket-out-dev"
  },
  head: {
    title: "sub.city",
    meta: [
      { charset: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { hid: "description", name: "description", content: "A collaborative subscription platform." }
    ],
    link: [
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
      { rel: "stylesheet", href: "//fonts.googleapis.com/css?family=Material+Icons" }
    ],
    script: [
      { src: "https://js.stripe.com/v3", defer: true }
    ]
  },
  loading: { color: "#ff5252" },
  mode: "universal",
  router: {
    base: `/`
  },
  modules: [
    "@nuxtjs/axios"
  ],
  plugins: [
    { src: "~/plugins/directives.js" },
    { src: "~/plugins/axios.js" },
    { src: "~/plugins/bus-inject.js" },
    { src: "~/plugins/vue-material" }
  ],

  router: {
    middleware: ["slug-forward"],
  },
}
