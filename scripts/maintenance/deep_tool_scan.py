import os
import re

scan_dirs = ['src/components', 'src/pages']
results = {}

# Patterns for hardcoded English strings
# 1. JSX text: >Some English text<
# 2. Attributes: placeholder="...", title="...", aria-label="..."
for sdir in scan_dirs:
    for root, _, files in os.walk(sdir):
        for f in sorted(files):
            if not (f.endswith('.tsx') or f.endswith('.ts')):
                continue
            if f.endswith('.d.ts') or '__tests__' in root or f.endswith('.test.tsx'):
                continue
            fpath = os.path.join(root, f)
            with open(fpath, 'r', encoding='utf-8') as file:
                lines = file.readlines()
            
            file_issues = []
            for i, line in enumerate(lines):
                stripped = line.strip()
                # Skip comments, imports, logs
                if stripped.startswith('//') or stripped.startswith('/*') or stripped.startswith('*') or stripped.startswith('import ') or stripped.startswith('export type ') or stripped.startswith('console.'):
                    continue
                
                # Check placeholder="Literal"
                ph_matches = re.findall(r'placeholder=["\']([^"\']*[a-zA-Z]{3,}[^"\']*)["\']', line)
                for ph in ph_matches:
                    if not ph.startswith('{') and not ph.startswith('t('):
                        file_issues.append((i + 1, 'placeholder', ph))
                
                # Check title="Literal" (exclude SVG or standard HTML types)
                title_matches = re.findall(r'title=["\']([^"\']*[a-zA-Z]{3,}[^"\']*)["\']', line)
                for tm in title_matches:
                    if tm not in ['button', 'dialog', 'document', 'checkbox'] and not tm.startswith('{'):
                        file_issues.append((i + 1, 'title', tm))

                # Check aria-label="Literal"
                aria_matches = re.findall(r'aria-label=["\']([^"\']*[a-zA-Z]{3,}[^"\']*)["\']', line)
                for am in aria_matches:
                    if not am.startswith('{'):
                        file_issues.append((i + 1, 'aria-label', am))

                # Check JSX text >English Word ...<
                # Exclude lines that already have {t(
                if '{t(' not in line and '{ t(' not in line:
                    jsx_texts = re.findall(r'>\s*([A-Za-z][A-Za-z0-9 ,.!?\'"()/:–—\-]{2,})\s*<', line)
                    for jt in jsx_texts:
                        jt_clean = jt.strip()
                        # Ignore common non-display tokens
                        if jt_clean not in ['PDF', 'MB', 'KB', 'GB', 'px', 'A4', 'OCR', 'AI', 'URL', 'PNG', 'JPG', 'JPEG', 'SVG', 'ZIP', 'JSON', 'Markdown', 'ID', 'FAQ', 'SEO', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '1', '2', '3', '4', '5', 'X', 'Y', 'W', 'H', 'Pt', 'OK']:
                            # Check if it has at least one space or is a standard word
                            if len(jt_clean) > 2 and not jt_clean.startswith('http'):
                                file_issues.append((i + 1, 'jsx-text', jt_clean))

            if file_issues:
                results[fpath] = file_issues

print(f"Total files with potential hardcoded strings: {len(results)}\n")
for fpath, issues in sorted(results.items()):
    print(f"File: {fpath} ({len(issues)} issues)")
    for line_no, kind, val in issues[:5]:
        print(f"   L{line_no} [{kind}]: {val}")
    if len(issues) > 5:
        print(f"   ... and {len(issues) - 5} more")
