const generate = require("nanoid/generate");
const CHARS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";


////////////////////////////////////////////////////


function generateID() {
  return generate(CHARS, 16);
}


////////////////////////////////////////////////////


module.exports = generateID;