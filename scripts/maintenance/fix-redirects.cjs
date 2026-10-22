const fs = require("fs");
const isApply = process.argv.includes("--apply");
const original = fs.readFileSync("./src/App.tsx", "utf8");
let content = original;

content = content.replace(
  /to="\/blog\/how-to-compress-a-pdf-without-losing-quality-2026"/g,
  'to="/blog/how-to-compress-a-pdf-without-losing-quality-2026/"'
);
content = content.replace(
  /to="\/blog\/how-to-password-protect-a-pdf-offline"/g,
  'to="/blog/how-to-password-protect-a-pdf-offline/"'
);
content = content.replace(
  /to="\/blog\/secure-pdf-editing-without-uploading"/g,
  'to="/blog/secure-pdf-editing-without-uploading/"'
);
content = content.replace(
  /to="\/blog\/why-privacy-first-pdf-tools-matter-in-2026"/g,
  'to="/blog/why-privacy-first-pdf-tools-matter-in-2026/"'
);

if (content === original) {
  console.log("[NO-OP] App.tsx redirects already canonical.");
} else if (isApply) {
  fs.writeFileSync("./src/App.tsx", content, "utf8");
  console.log("[APPLIED] App.tsx redirects fixed.");
} else {
  console.log("[DRY-RUN] App.tsx has non-canonical blog links. Re-run with --apply to write changes.");
}
