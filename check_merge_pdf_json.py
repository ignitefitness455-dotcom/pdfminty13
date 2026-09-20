import json

with open('src/locales/en/merge-pdf.json', 'r', encoding='utf-8') as f:
    en_merge = json.load(f)

with open('src/locales/bn/merge-pdf.json', 'r', encoding='utf-8') as f:
    bn_merge = json.load(f)

with open('src/locales/de/merge-pdf.json', 'r', encoding='utf-8') as f:
    de_merge = json.load(f)

print("EN merge keys:", list(en_merge.keys()))
print("BN merge keys:", list(bn_merge.keys()))
print("DE merge keys:", list(de_merge.keys()))
