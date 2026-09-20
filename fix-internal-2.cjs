const fs = require("fs");
let content = fs.readFileSync("./src/config/seo-data.ts", "utf8");

// This regex finds href="/path/something" and replaces it with href="/path/something/"
// Make sure it doesn't add double slashes
content = content.replace(/href="(\/[a-zA-Z0-9\-_/]+[a-zA-Z0-9\-_])"/g, 'href="$1/"');

fs.writeFileSync("./src/config/seo-data.ts", content, "utf8");
console.log("Internal links in seo-data.ts fixed again!");
