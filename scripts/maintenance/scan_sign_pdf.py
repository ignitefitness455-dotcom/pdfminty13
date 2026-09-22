import os
import re

sign_dir = 'src/components/sign-pdf'
for fname in os.listdir(sign_dir):
    if fname.endswith('.tsx') or fname.endswith('.ts'):
        fpath = os.path.join(sign_dir, fname)
        with open(fpath, 'r', encoding='utf-8') as f:
            content = f.read()
        print(f"\n--- {fname} (useTranslation: {'useTranslation' in content}) ---")
        # find string literals in JSX or buttons
        texts = re.findall(r'>([^<>{}\n]+[a-zA-Z]{3,}[^<>{}\n]*)<', content)
        for t in texts[:12]:
            clean = t.strip()
            if not any(k in clean for k in ['className', 'http', 'px', 'svg', '//', '/*']):
                print(f"  • {clean}")
