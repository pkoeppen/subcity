export default function ({ $axios, app, store }) {
  $axios.onRequest(config => {
    if (store.state.token) {
      config.headers.common['Authorization'] = `Bearer ${store.state.token}`;
    }
    //console.log(`${process.browser ? "browser" : "server"} - ${config.method.toUpperCase()} ${config.url}\n${JSON.stringify(config.headers.common, null, 2)}`);
  });
  $axios.onError(error => {
  	//console.log(`${process.browser ? "browser" : "server"} - ${error}`);
  });
};