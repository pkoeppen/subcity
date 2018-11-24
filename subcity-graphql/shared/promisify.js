const promisify = f => new Promise((resolve, reject) => {
  f((error, result) => {
    if (error) { reject(error); }
    else { resolve(result); }
  });
});

////////////////////////////////////////////////////

module.exports = promisify;