const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const distDir = path.join(projectRoot, "dist");

fs.mkdirSync(distDir, { recursive: true });

const filesToCopy = [
  {
    from: path.join(projectRoot, "src", "normalize.js"),
    to: path.join(distDir, "normalize.js"),
  },
  {
    from: path.join(projectRoot, "manifest.json"),
    to: path.join(distDir, "manifest.json"),
  },
];

for (const file of filesToCopy) {
  fs.copyFileSync(file.from, file.to);
}
