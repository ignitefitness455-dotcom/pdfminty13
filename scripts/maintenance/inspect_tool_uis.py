import re

tool_pages = [
  'MergePage.tsx', 'SplitPage.tsx', 'RotatePage.tsx', 'DeletePagesPage.tsx',
  'ExtractPagesPdfPage.tsx', 'ReorderPdfPage.tsx', 'GrayscalePdfPage.tsx',
  'FlattenPdfPage.tsx', 'ImgToPdfPage.tsx', 'PdfToImgPage.tsx', 'ProtectPage.tsx',
  'UnlockPage.tsx', 'WatermarkPage.tsx', 'PageNumbersPage.tsx', 'AddBlankPage.tsx',
  'EditMetadataPage.tsx', 'SanitizePdfPage.tsx', 'PdfToMarkdownPage.tsx',
  'OcrPdfPage.tsx', 'AiAnalyzePage.tsx', 'RepairPdfPage.tsx'
]

for p in tool_pages:
    filepath = f'src/pages/{p}'
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # find lines with raw English text between tags or in attributes
    raw = []
    for idx, l in enumerate(lines[:250]): # check top 250 lines (where the tool UI lives before SEO/ContentSection)
        matches = re.findall(r'>([^<>{}\n]+[a-zA-Z]{3,}[^<>{}\n]*)<', l)
        for m in matches:
            t = m.strip()
            if not any(k in t for k in ['t(', 'className', 'http', 'px', 'svg', '//', '/*', 'ROUTES']):
                if len(t) > 3:
                    raw.append((idx + 1, t))
    if raw:
        print(f"=== {p} ({len(raw)} raw UI strings in top 250 lines) ===")
        for line_no, text in raw[:10]:
            print(f"  Line {line_no}: {text}")
