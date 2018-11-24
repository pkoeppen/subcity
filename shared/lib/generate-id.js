const generate = require("nanoid/generate");

const CHARS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const ID_LENGTH = 16;

module.exports = generateID;

function generateID() {
  return generate(CHARS, ID_LENGTH);
}