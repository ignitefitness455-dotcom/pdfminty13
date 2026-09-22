import json

with open('src/locales/en/common.json', 'r', encoding='utf-8') as f:
    en_data = json.load(f)

with open('src/locales/bn/common.json', 'r', encoding='utf-8') as f:
    bn_data = json.load(f)

print("EN keys in tools:")
print(list(en_data.get('tools', {}).keys()))

print("\nBN keys in tools:")
print(list(bn_data.get('tools', {}).keys()))
