import os
import re
import json

with open('src/locales/en/common.json', 'r', encoding='utf-8') as f:
    en_common = json.load(f)
with open('src/locales/bn/common.json', 'r', encoding='utf-8') as f:
    bn_common = json.load(f)
with open('src/locales/de/common.json', 'r', encoding='utf-8') as f:
    de_common = json.load(f)

def get_nested(d, path):
    parts = path.split('.')
    curr = d
    for p in parts:
        if isinstance(curr, dict) and p in curr:
            curr = curr[p]
        else:
            return None
    return curr

tool_pages = [f for f in os.listdir('src/pages') if f.endswith('Page.tsx')]

all_t_keys = set()
page_keys = {}

for p in tool_pages:
    filepath = os.path.join('src/pages', p)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Matches t('key', ...) or t("key", ...)
    matches = re.findall(r"t\(\s*['\"]([a-zA-Z0-9_.-]+)['\"]", content)
    page_keys[p] = set(matches)
    all_t_keys.update(matches)

print(f"Total distinct t() keys found across all pages: {len(all_t_keys)}")

missing_in_bn = {}
missing_in_de = {}

for p, keys in page_keys.items():
    p_missing_bn = []
    p_missing_de = []
    for k in keys:
        if get_nested(bn_common, k) is None:
            p_missing_bn.append(k)
        if get_nested(de_common, k) is None:
            p_missing_de.append(k)
    if p_missing_bn:
        missing_in_bn[p] = p_missing_bn
    if p_missing_de:
        missing_in_de[p] = p_missing_de

print(f"\nPages with keys missing in BN ({len(missing_in_bn)}):")
for p, keys in missing_in_bn.items():
    print(f"  {p}: {keys}")

print(f"\nPages with keys missing in DE ({len(missing_in_de)}):")
for p, keys in missing_in_de.items():
    print(f"  {p}: {keys}")
