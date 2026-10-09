import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { join, relative, resolve } from "node:path";

const source = resolve("public");
const destination = resolve("dist/build/h5");

if (!existsSync(source)) {
  throw new Error("PWA public directory is missing");
}

mkdirSync(destination, { recursive: true });
cpSync(source, destination, { recursive: true, force: true });

const walkFiles = (directory) => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const absolutePath = join(directory, entry.name);
  return entry.isDirectory() ? walkFiles(absolutePath) : [absolutePath];
});

const serviceWorkerPath = join(destination, "sw.js");
const manifestPath = join(destination, "precache-manifest.json");
const files = walkFiles(destination)
  .filter((file) => file !== serviceWorkerPath && file !== manifestPath)
  .map((file) => relative(destination, file).replaceAll("\\", "/"))
  .sort();

const buildHash = createHash("sha256");
files.forEach((file) => {
  buildHash.update(file);
  buildHash.update(readFileSync(join(destination, file)));
});
const version = buildHash.digest("hex").slice(0, 12);

writeFileSync(manifestPath, `${JSON.stringify({ version, files }, null, 2)}\n`);
const serviceWorker = readFileSync(serviceWorkerPath, "utf8").replace("__BUILD_VERSION__", version);
writeFileSync(serviceWorkerPath, serviceWorker);

console.log(`PWA assets copied and precached (${files.length} files, ${version})`);
