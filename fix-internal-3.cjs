const fs = require("fs");
let content = fs.readFileSync("./src/config/seo-data.ts", "utf8");

// Add trailing slash to any URL inside href=" /..." or url: " /... " that doesn't end with slash
// For href
content = content.replace(/href="(\/(?:blog|compare|sanitize-pdf|flatten-pdf|grayscale-pdf|edit-pdf-metadata)[^"]*?[^/])"/g, 'href="$1/"');

// For url:
content = content.replace(/url:\s*"(\/(?:blog|compare|sanitize-pdf|flatten-pdf|grayscale-pdf|edit-pdf-metadata)[^"]*?[^/])"/g, 'url: "$1/"');

fs.writeFileSync("./src/config/seo-data.ts", content, "utf8");
console.log("Fixed trailing slashes for all internal links.");
