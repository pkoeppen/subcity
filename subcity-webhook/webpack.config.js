const path   = require("path");
const slsw   = require("serverless-webpack");

module.exports = {
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
              "@babel/preset-env", 
              ],
              plugins: [
                "@babel/plugin-proposal-object-rest-spread",
                "@babel/plugin-proposal-export-default-from"
              ],
              minified: true,
              comments: false
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
  }
};