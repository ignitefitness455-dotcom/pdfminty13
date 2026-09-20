const fs = require('fs');
const content = fs.readFileSync('src/config/seo-data.ts', 'utf8');
const id1 = 'blog-pdf-privacy-benchmark-2026';
const id2 = 'blog-client-side-pdf-processing-explained';
console.log('ID 1 index:', content.indexOf(id1));
console.log('ID 2 index:', content.indexOf(id2));
