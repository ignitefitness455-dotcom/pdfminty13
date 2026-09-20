import fs from 'fs';
import path from 'path';

const seoDataPath = path.resolve('src/config/seo-data.ts');
let content = fs.readFileSync(seoDataPath, 'utf8');

// Change 1: Sanitize PDF Tool -> Guide
const sanitizeTarget = 'Read our detailed audit guide: <a href="/blog/is-it-safe-to-upload-pdf-to-online-tools/">How to Verify Client-Side Document Security in Browser DevTools</a>.</p>';
const sanitizeReplacement = 'Read our detailed audit guide: <a href="/blog/is-it-safe-to-upload-pdf-to-online-tools/">How to Verify Client-Side Document Security in Browser DevTools</a>. For a <a href="/blog/the-complete-guide-to-pdf-metadata-and-how-to-remove-it/">forensic breakdown of hidden PDF data</a>, read our full metadata guide.</p>';
content = content.replace(sanitizeTarget, sanitizeReplacement);

// Change 5: why-is-my-pdf-so-large -> Grayscale
const grayscaleTarget = 'Run the file through our <a href="/grayscale-pdf/" class="text-emerald-600 dark:text-emerald-400 font-bold underline hover:text-emerald-500">Grayscale PDF tool</a>. Converting the streams to 8-bit grayscale instantly discards';
const grayscaleReplacement = 'Fix it by <a href="/grayscale-pdf/" class="text-emerald-600 dark:text-emerald-400 font-bold underline hover:text-emerald-500">converting 24-bit streams to 8-bit</a> grayscale. This instantly discards';
content = content.replace(grayscaleTarget, grayscaleReplacement);

// Change 6: why-is-my-pdf-so-large -> Gateway guide
const gatewayTarget = 'Trying to fit a PDF into a strict 2MB or 5MB portal, or a 25MB email limit?</p>\n          <a href="/blog/how-to-fix-pdf-file-size-too-large-for-email-or-portal-upload/" class="text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:underline">Read the Gateway Guide →</a>';
const gatewayReplacement = 'Trying to navigate <a href="/blog/how-to-fix-pdf-file-size-too-large-for-email-or-portal-upload/" class="text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:underline">strict email and portal upload limits</a>? Read our dedicated gateway compression guide.</p>';
content = content.replace(gatewayTarget, gatewayReplacement);

// Change 7: why-is-my-pdf-so-large -> Flatten
const flattenTarget = 'Use our <a href="/flatten-pdf/" class="text-emerald-600 dark:text-emerald-400 font-bold underline hover:text-emerald-500">Flatten PDF tool</a>. Flattening acts like a steamroller—it takes all those interactive layers';
const flattenReplacement = 'Fix this by <a href="/flatten-pdf/" class="text-emerald-600 dark:text-emerald-400 font-bold underline hover:text-emerald-500">steamrolling interactive layers</a>. This process permanently paints all stamps and fields';
content = content.replace(flattenTarget, flattenReplacement);

fs.writeFileSync(seoDataPath, content, 'utf8');
console.log('Applied links!');
