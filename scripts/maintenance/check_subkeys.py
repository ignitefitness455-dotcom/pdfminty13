import json

with open('src/locales/en/common.json', 'r', encoding='utf-8') as f:
    en_data = json.load(f)

with open('src/locales/bn/common.json', 'r', encoding='utf-8') as f:
    bn_data = json.load(f)

for tool_slug in list(en_data.get('tools', {}).keys())[:3]:
    print(f"\nTool: {tool_slug}")
    print("EN keys:", list(en_data['tools'][tool_slug].keys()))
    print("BN keys:", list(bn_data['tools'].get(tool_slug, {}).keys()))
    if 'howTo' in en_data['tools'][tool_slug]:
        print("  EN howTo:", en_data['tools'][tool_slug]['howTo'])
        print("  BN howTo:", bn_data['tools'].get(tool_slug, {}).get('howTo'))
    if 'faqs' in en_data['tools'][tool_slug]:
        print("  EN faqs count:", len(en_data['tools'][tool_slug]['faqs']))
        print("  BN faqs count:", len(bn_data['tools'].get(tool_slug, {}).get('faqs', [])))
