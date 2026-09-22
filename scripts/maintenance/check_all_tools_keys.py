import json

with open('src/locales/en/common.json', 'r', encoding='utf-8') as f:
    en = json.load(f)
with open('src/locales/bn/common.json', 'r', encoding='utf-8') as f:
    bn = json.load(f)
with open('src/locales/de/common.json', 'r', encoding='utf-8') as f:
    de = json.load(f)

tool_namespaces = [
  'mergePdf', 'splitPdf', 'rotatePdf', 'deletePages', 'extractPages',
  'reorderPdf', 'grayscalePdf', 'flattenPdf', 'imgToPdf', 'pdfToImg',
  'protectPdf', 'unlockPdf', 'watermarkPdf', 'pageNumbers', 'addBlankPage',
  'editMetadata', 'sanitizePdf', 'pdfToMarkdown', 'signPdf', 'ocrPdf',
  'aiAnalyze', 'repairPdf'
]

for tn in tool_namespaces:
    print(f"{tn:15} | EN: {bool(en.get(tn)):5} | BN: {bool(bn.get(tn)):5} | DE: {bool(de.get(tn)):5}")
