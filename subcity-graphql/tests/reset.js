const clear = require("./clear");
const seed = require("./seed");

(async function() {
  console.log(`=========================== CLEAR ==========================\n`);
  await clear();
  console.log(`\n=========================== SEED ===========================\n`);
  const ITERATION_COUNT = 5;
  const iterations = (new Array(ITERATION_COUNT).fill("")).map((_, iteration) => seed(iteration));
  
  try {
  	await Promise.all(iterations);
  } catch(error) {
  	console.error(error);
  }
  
})();