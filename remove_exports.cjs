const fs = require("fs");

const log = fs.readFileSync(process.argv[2], "utf8");
const lines = log.split("\n");

const exportsIdx = lines.findIndex((l) => l.startsWith("Unused exports"));
const typesIdx = lines.findIndex((l) => l.startsWith("Unused exported types"));

const toModify = {};

for (let i = exportsIdx + 1; i < typesIdx; i++) {
  if (!lines[i].trim()) continue;
  const parts = lines[i].trim().split(/\s+/);
  const name = parts[0];
  const fileAndLine = parts[parts.length - 1];
  if (!fileAndLine.includes(":")) continue;

  const [file, lineStr] = fileAndLine.split(":");
  const lineNum = parseInt(lineStr, 10);

  if (!toModify[file]) toModify[file] = [];
  toModify[file].push(lineNum);
}

for (let i = typesIdx + 1; i < lines.length; i++) {
  if (!lines[i].trim() || lines[i].startsWith("Configuration hints")) break;
  const parts = lines[i].trim().split(/\s+/);
  const name = parts[0];
  const fileAndLine = parts[parts.length - 1];
  if (!fileAndLine.includes(":")) continue;

  const [file, lineStr] = fileAndLine.split(":");
  const lineNum = parseInt(lineStr, 10);

  if (!toModify[file]) toModify[file] = [];
  toModify[file].push(lineNum);
}

for (const [file, lineNums] of Object.entries(toModify)) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, "utf8").split("\n");

  // Sort descending so we don't mess up line numbers if we delete
  // Wait, if we just remove 'export ', line numbers don't change!
  for (const lineNum of lineNums) {
    const idx = lineNum - 1;
    if (content[idx]) {
      content[idx] = content[idx].replace(/export\s+/, "");
    }
  }

  fs.writeFileSync(file, content.join("\n"));
  console.log("Cleaned exports in: " + file);
}
