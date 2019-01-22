const path = require("path");
const { readFileSync } = require("fs");
const { load } = require("js-yaml");

////////////////////////////////////////////////////////////

module.exports = loadEnv;

////////////////////////////////////////////////////////////

function loadEnv(env) {
  try {
    env = parseYaml(readFileSync(path.join(__dirname, "../../env.yml"), { encoding: "utf-8" }))[env];
  } catch(error) {
    throw new Error(`Error parsing env.yml.\n${error}`);
  }
  
  return Object.assign(env, {

    __load__: function() {

      // Load environment variables into memory (unwrapped).
      
      try {
        Object.keys(env).forEach(function(key) {
          if (key === "__load__") return;
          process.env[key] = env[key];
        });
        return this;
      } catch(error) {
        throw new Error(`Error loading environment variables into memory.\n${error}`);
      }
    },

    __wrap__: function() {

      // Wrap in double quotes.

      try {
        const wrapped = {};
        Object.keys(env).forEach(function(key) {
          if (key === "__load__" || key === "__wrap__") return;       
          wrapped[key] = `"${env[key]}"`;
        });
        return wrapped;
      } catch(error) {
        throw new Error(`Error wrapping environment variables object.\n${error}`);
      }
    }
  });
};

function parseYaml(src) {
  const result = load(src);
  return result ? result : {};
}