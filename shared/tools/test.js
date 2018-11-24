import generateID from "../lib/generate-id";
console.log(generateID());
import loadEnv from "../lib/load-env";
console.log(loadEnv("development").__load__());