const fs = require("fs");
const apply = process.argv.includes("--apply");
let content = fs.readFileSync("./src/config/seo-data.ts", "utf8");

// Add trailing slash to any URL inside href="/..." or url: "/..." that doesn't end with slash, hash, query, or extension
let updated = content.replace(
  /href="(\/(?:blog|compare|sanitize-pdf|flatten-pdf|grayscale-pdf|edit-pdf-metadata)[^"#?.]*?[^/#?.])"/g,
  'href="$1/"'
);

updated = updated.replace(
  /url:\s*"(\/(?:blog|compare|sanitize-pdf|flatten-pdf|grayscale-pdf|edit-pdf-metadata)[^"#?.]*?[^/#?.])"/g,
  'url: "$1/"'
);

if (!apply) {
  console.log("[Dry Run] Pass --apply to write changes to src/config/seo-data.ts");
} else if (updated !== content) {
  fs.writeFileSync("./src/config/seo-data.ts", updated, "utf8");
  console.log("Fixed trailing slashes for all internal links.");
} else {
  console.log("No trailing slash changes needed.");
}
