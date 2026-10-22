const fs = require("fs");
const apply = process.argv.includes("--apply");
let content = fs.readFileSync("./src/config/seo-data.ts", "utf8");

// This regex finds href="/path/something" and replaces it with href="/path/something/"
// Make sure it doesn't add double slashes or touch /api/ paths
const updated = content.replace(/href="(\/[a-zA-Z0-9\-_/]+[a-zA-Z0-9\-_])"/g, (m, p1) => {
  if (p1.startsWith("/api/")) return m;
  return `href="${p1}/"`;
});

if (!apply) {
  console.log("[Dry Run] Pass --apply to write changes to src/config/seo-data.ts");
} else if (updated !== content) {
  fs.writeFileSync("./src/config/seo-data.ts", updated, "utf8");
  console.log("Internal links in seo-data.ts fixed again!");
} else {
  console.log("No changes needed in seo-data.ts.");
}
