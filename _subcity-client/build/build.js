require("./check-versions")();

const ora            = require("ora");
const rm             = require("rimraf");
const path           = require("path");
const chalk          = require("chalk");
const webpack        = require("webpack");
const config         = require("../config");
const env            = config.build.env.__load__();
const webpack_config = require("./webpack.prod.conf");

var spinner = ora("Building for production...");
spinner.start();

rm(path.join(config.build.assetsRoot, config.build.assetsSubDirectory), (error) => {
  if (error) {
    throw error;
  }

  webpack(webpack_config, function (error, stats) {
    spinner.stop();
    if (error) {
      throw error;
    }
    process.stdout.write(stats.toString({
      colors:       true,
      modules:      false,
      children:     false,
      chunks:       false,
      chunkModules: false
    }) + "\n\n");

    console.log(chalk.cyan("  Build complete.\n"));
    console.log(chalk.yellow(
      "  Tip: built files are meant to be served over an HTTP server.\n" +
      "  Opening index.html over file:// won\"t work.\n"
    ));
  });
});