const fs = require("fs");
const isApply = process.argv.includes("--apply");
const original = fs.readFileSync("./src/config/seo-data.ts", "utf8");
let content = original;

// First, fix the targets of deleted/merged pages
content = content.replace(
  /\/blog\/how-to-compress-pdf-without-losing-quality-locally\/?/g, 
  "/blog/how-to-compress-a-pdf-without-losing-quality-2026/"
);
content = content.replace(
  /\/blog\/best-free-pdf-compressor-without-losing-quality\/?/g, 
  "/blog/how-to-compress-a-pdf-without-losing-quality-2026/"
);
content = content.replace(
  /\/blog\/how-to-protect-a-pdf-with-password-in-3-easy-steps\/?/g, 
  "/blog/how-to-password-protect-a-pdf-offline/"
);
content = content.replace(
  /\/blog\/how-to-edit-a-pdf-offline-without-uploading-it\/?/g, 
  "/blog/secure-pdf-editing-without-uploading/"
);
content = content.replace(
  /\/blog\/why-offline-pdf-editors-are-the-future-of-privacy\/?/g, 
  "/blog/why-privacy-first-pdf-tools-matter-in-2026/"
);

// Next, ensure all /blog/ internal links have a trailing slash (and not double slashes)
// Regex: matches href="/blog/something" where something doesn't end with /
content = content.replace(/href="(\/blog\/[^"]+?)(?<!\/)"/g, 'href="$1/"');

// Ensure other internal tools have trailing slashes
content = content.replace(/href="(\/sanitize-pdf)(?<!\/)"/g, 'href="$1/"');
content = content.replace(/href="(\/flatten-pdf)(?<!\/)"/g, 'href="$1/"');
content = content.replace(/href="(\/grayscale-pdf)(?<!\/)"/g, 'href="$1/"');
content = content.replace(/href="(\/edit-pdf-metadata)(?<!\/)"/g, 'href="$1/"');
content = content.replace(/href="(\/pdfminty-vs-smallpdf)(?<!\/)"/g, 'href="/compare/pdfminty-vs-smallpdf/"');
content = content.replace(/href="(\/pdfminty-vs-ilovepdf)(?<!\/)"/g, 'href="/compare/pdfminty-vs-ilovepdf/"');

if (content === original) {
  console.log("[NO-OP] Internal links in seo-data.ts already canonical.");
} else if (isApply) {
  fs.writeFileSync("./src/config/seo-data.ts", content, "utf8");
  console.log("[APPLIED] Internal links in seo-data.ts fixed!");
} else {
  console.log("[DRY-RUN] Internal links in seo-data.ts need updates. Re-run with --apply to write changes.");
}
