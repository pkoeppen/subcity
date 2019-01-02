const generate = require("nanoid/generate");


module.exports = {
  generateID
};


function generateID() {
  const characters = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const id_length  = 16;
  return generate(characters, id_length);
}