const utils         = require("./utils");
const config        = require("../config");
const is_production = process.env.NODE_ENV === "production";

module.exports = {
  loaders: utils.cssLoaders({
    sourceMap: is_production
      ? config.build.productionSourceMap
      : config.dev.cssSourceMap,
    extract: is_production
  })
};