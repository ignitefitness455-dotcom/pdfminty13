const fs = require("fs");
const apply = process.argv.includes("--apply");
let content = fs.readFileSync("./src/config/seo-data.ts", "utf8");

// Catch single OR double quotes, excluding hash/query/extensions
const updated = content.replace(/url:\s*(['"])(\/blog\/[^'"#?.]+?)(?<!\/)\1/g, 'url: $1$2/$1');

if (!apply) {
  console.log("[Dry Run] Pass --apply to write changes to src/config/seo-data.ts");
} else if (updated !== content) {
  fs.writeFileSync("./src/config/seo-data.ts", updated, "utf8");
  console.log("Fixed trailing slashes for single-quoted url fields!");
} else {
  console.log("No single-quoted url changes needed.");
}
