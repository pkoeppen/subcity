const path   = require("path");
const slsw   = require("serverless-webpack");

// The UglifyJS plugin MUST be version 1.1.6, otherwise it spits
// out some error about "Unexpected token: punc ([)".

const UglifyJsPlugin = require("uglifyjs-webpack-plugin");

module.exports = {
  mode: "development",
  entry: slsw.lib.entries,
  target: "node",
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "babel-loader",
            options: {
              presets: [
                ["@babel/preset-env", {
                  targets: {
                    node: true
                  }
                }]
              ],
              plugins: [
                "@babel/plugin-proposal-object-rest-spread",
                "@babel/plugin-proposal-export-default-from"
              ]
            }
          }
        ],
      }
    ]
  },
  output: {
    libraryTarget: "commonjs",
    path: path.join(__dirname, ".webpack"),
    filename: "[name].js"
  },
  plugins: [

    // Basically just removes comments, because the Webpack comments option
    // was giving me grief, so I gave up and just started using this.

    new UglifyJsPlugin({
      sourceMap: false,
      uglifyOptions: {
        parse: {},
        compress: {},
        mangle: false
      }
    })
  ]
};