import { cpSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const source = resolve("public");
const destination = resolve("dist/build/h5");

if (!existsSync(source)) {
  throw new Error("PWA public directory is missing");
}

mkdirSync(destination, { recursive: true });
cpSync(source, destination, { recursive: true, force: true });

console.log("PWA assets copied to dist/build/h5");
