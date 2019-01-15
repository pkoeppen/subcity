const generate = require("nanoid/generate");
module.exports = {
  generateID
};

function generateID (length=16) {
  const characters = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return generate(characters, length);
}
