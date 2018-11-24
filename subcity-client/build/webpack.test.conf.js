const utils      = require("./utils");
const webpack    = require("webpack");
const merge      = require("webpack-merge");
const baseConfig = require("./webpack.base.conf");

// This is the webpack config used for unit tests.

const webpackConfig = merge(baseConfig, {
  module: {
    rules: utils.styleLoaders()
  },

  // Use inline sourcemap for karma-sourcemap-loader.

  devtool: "#inline-source-map",
  plugins: [
    new webpack.DefinePlugin({
      "process.env": { NODE_ENV: `"testing"` }
    })
  ]
});

// No need for app entry during tests.

delete webpackConfig.entry;

module.exports = webpackConfig;
