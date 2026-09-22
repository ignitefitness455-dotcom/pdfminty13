const fs = require("fs");
let content = fs.readFileSync("./src/config/seo-data.ts", "utf8");

// Catch single OR double quotes
content = content.replace(/url:\s*(['"])(\/blog\/[^'"]+?)(?<!\/)\1/g, 'url: $1$2/$1');

fs.writeFileSync("./src/config/seo-data.ts", content, "utf8");
console.log("Fixed trailing slashes for single-quoted url fields!");
