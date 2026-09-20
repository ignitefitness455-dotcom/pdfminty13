import re
import os
import json

with open('src/locales/en/common.json', 'r', encoding='utf-8') as f:
    en = json.load(f)
with open('src/locales/bn/common.json', 'r', encoding='utf-8') as f:
    bn = json.load(f)
with open('src/locales/de/common.json', 'r', encoding='utf-8') as f:
    de = json.load(f)

def get_key(d, key_path):
    parts = key_path.split('.')
    cur = d
    for p in parts:
        if isinstance(cur, dict) and p in cur:
            cur = cur[p]
        else:
            return None
    return cur

for fname in sorted(os.listdir('src/pages')):
    if not fname.endswith('Page.tsx'):
        continue
    fpath = os.path.join('src/pages', fname)
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find t('...') or t("...")
    keys = re.findall(r"t\(\s*['\"]([^'\"${}]+)['\"]", content)
    missing_bn = []
    missing_de = []
    for k in set(keys):
        # Ignore obvious non-i18n strings (like html tags or regex)
        if k in ['2d', 'canvas', 'a', '-', 'T', 'none']:
            continue
        if get_key(bn, k) is None and not k.startswith('common.'):
            missing_bn.append(k)
        if get_key(de, k) is None and not k.startswith('common.'):
            missing_de.append(k)
    
    if missing_bn:
        print(f"\n{fname}: MISSING IN BN ({len(missing_bn)}):")
        for k in sorted(missing_bn):
            print(f"   {k}")

