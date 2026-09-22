const fs = require("fs");
let content = fs.readFileSync("./src/config/seo-data.ts", "utf8");

function getBlock(id) {
  const marker = "id: '" + id + "'";
  const idx = content.indexOf(marker);
  if (idx === -1) return null;
  const start = content.lastIndexOf("{", idx);
  const nextStart = content.indexOf("\n  {\n    id:", idx);
  return content.slice(start, nextStart !== -1 ? nextStart : content.length);
}

const blockRemoveMeta = getBlock("blog-remove-metadata");
if (blockRemoveMeta) {
  let newBlock = blockRemoveMeta;
  const mobileExpansion = `
      <h2>Removing PDF Metadata on Mobile Devices (iOS & Android)</h2>
      <p>Mobile devices often embed even more metadata than desktop computers, especially if the PDF was created from photos. Camera EXIF data can include exact GPS coordinates, camera models, and timestamps.</p>
      <p>To safely remove this on mobile, navigate to PDFMinty in your mobile browser. Because our tool runs locally using WebAssembly, you don't need to upload your sensitive mobile documents over cellular networks. Simply select the file, hit sanitize, and save the clean version back to your device storage.</p>
  `;
  newBlock = newBlock.replace(/<h2>How to Remove PDF Metadata for Free \(Without Uploading Anywhere\)<\/h2>/, mobileExpansion + "\n      <h2>How to Remove PDF Metadata for Free (Without Uploading Anywhere)</h2>");
  
  const toolCta = `
      <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg my-8">
        <h3 className="text-xl font-bold mb-4">Ready to clean your PDF?</h3>
        <p className="mb-4">Use our 100% offline, browser-side tools to protect your privacy.</p>
        <div className="flex gap-4">
          <a href="/sanitize-pdf" className="bg-security-green text-white px-4 py-2 rounded font-bold hover:bg-green-700">Sanitize PDF (Remove All Hidden Scripts)</a>
          <a href="/edit-pdf-metadata" className="border border-security-green text-security-green px-4 py-2 rounded font-bold hover:bg-green-50">Edit Metadata Manually</a>
        </div>
      </div>
  `;
  newBlock = newBlock.replace(/<h2>A Quick Pre-Send Checklist<\/h2>/, toolCta + "\n      <h2>A Quick Pre-Send Checklist</h2>");
  content = content.replace(blockRemoveMeta, newBlock);
}

const blockSafe = getBlock("trust-article");
if (blockSafe) {
  let newBlock = blockSafe;
  const complianceExpansion = `
      <h2>Corporate Compliance: HIPAA and Legal Confidentiality</h2>
      <p>For healthcare professionals bound by HIPAA, or legal teams dealing with attorney-client privilege, uploading unencrypted documents to random internet servers is a severe compliance violation. Browser-side processing guarantees that no protected health information (PHI) or confidential case files ever leave the local network environment.</p>
  `;
  newBlock = newBlock.replace(/<h2>Real-World Consequences of PDF Data Breaches<\/h2>/, complianceExpansion + "\n      <h2>Real-World Consequences of PDF Data Breaches</h2>");
  content = content.replace(blockSafe, newBlock);
}

const blockCompress = getBlock("blog-how-to-compress-a-pdf-without-losing-quality-2026");
if (blockCompress) {
  let newBlock = blockCompress;
  const faqExpansion = `
      <div className="faq-item mt-6">
        <h3 className="text-lg font-bold">What is the difference between Flattening and Compressing?</h3>
        <p>Flattening a PDF merges interactive elements (like form fields, dropdowns, and annotations) directly into the visual page layer, making them non-editable. This often reduces file size significantly. Compressing, on the other hand, reduces the quality or resolution of images and streams without changing the interactive nature of the document. For maximum size reduction, you can <a href="/flatten-pdf" className="text-security-green hover:underline">Flatten your PDF</a> first, and then compress it.</p>
      </div>
      <div className="faq-item mt-6">
        <h3 className="text-lg font-bold">Can converting to Grayscale help reduce size?</h3>
        <p>Yes. Stripping color profiles and converting your document to black and white using a <a href="/grayscale-pdf" className="text-security-green hover:underline">Grayscale PDF Converter</a> can drastically shrink file size, especially for scanned documents or image-heavy presentations.</p>
      </div>
  `;
  newBlock = newBlock.replace(/<h2>Optimize Your PDFs Privately<\/h2>/, faqExpansion + "\n      <h2>Optimize Your PDFs Privately</h2>");
  content = content.replace(blockCompress, newBlock);
}

fs.writeFileSync("./src/config/seo-data.ts", content, "utf8");
console.log("Expansions completed in seo-data.ts.");
