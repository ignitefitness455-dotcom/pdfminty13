const fs = require("fs");
let content = fs.readFileSync("./src/App.tsx", "utf8");

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

fs.writeFileSync("./src/App.tsx", content, "utf8");
console.log("App.tsx redirects fixed.");
