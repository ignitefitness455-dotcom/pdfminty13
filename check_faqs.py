import json

with open('src/locales/en/faq.json', 'r', encoding='utf-8') as f:
    en_faq = json.load(f)

with open('src/locales/bn/faq.json', 'r', encoding='utf-8') as f:
    bn_faq = json.load(f)

print("en faq keys:", list(en_faq.keys()))
print("bn faq keys:", list(bn_faq.keys()))
