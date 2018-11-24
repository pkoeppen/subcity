require("./check-versions")();

const config           = require("../config");
const env              = config.build.env.__load__();
const opn              = require("opn");
const path             = require("path");
const express          = require("express");
const webpack          = require("webpack");
const proxy_middleware = require("http-proxy-middleware");
const webpack_config   = process.env.NODE_ENV === "testing"
  ? require("./webpack.prod.conf")
  : require("./webpack.dev.conf");

// Default port to listen on.

const port = process.env.PORT || config.dev.port

// Auto-open browser (defaults to false).
const autoOpenBrowser = !!config.dev.autoOpenBrowser;

// HTTP proxies to API backend.

const proxy_table = config.dev.proxyTable;

const app = express();
const compiler = webpack(webpack_config);

const dev_middleware = require("webpack-dev-middleware")(compiler, {
  publicPath: webpack_config.output.publicPath,
  quiet: true
});

var hot_middleware = require("webpack-hot-middleware")(compiler, {
  log: () => {}
});

// Force page reload when html-webpack-plugin template changes.

compiler.plugin("compilation", function (compilation) {
  compilation.plugin("html-webpack-plugin-after-emit", function(data, callback) {
    hot_middleware.publish({ action: "reload" });
    callback();
  });
});

// Proxy API requests.

Object.keys(proxy_table).forEach(function(context) {
  var options = proxy_table[context];
  if (typeof options === "string") {
    options = { target: options };
  }
  app.use(proxy_middleware(options.filter || context, options));
})

// Handle fallback for HTML5 history API.

app.use(require("connect-history-api-fallback")())

// Serve bundled output.

app.use(dev_middleware)

// Enable hot-reload and state-preserving.

app.use(hot_middleware)

// Serve static assets.

const static_path = path.posix.join(config.dev.assetsPublicPath, config.dev.assetsSubDirectory);
app.use(static_path, express.static("./static"));

const uri = "http://localhost:" + port;

dev_middleware.waitUntilValid(function () {
  console.log("> Listening at " + uri + "\n")
});

module.exports = app.listen(port, function(error) {
  if (error) {
    console.log(error);
    return;
  }

  if (autoOpenBrowser && process.env.NODE_ENV !== "testing") {
    opn(uri);
  }
});