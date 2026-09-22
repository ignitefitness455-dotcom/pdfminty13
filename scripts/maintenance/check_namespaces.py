import json

for lang in ['en', 'bn', 'de']:
    try:
        with open(f'src/locales/{lang}/merge-pdf.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
            print(f"{lang} merge-pdf.json keys count: {len(data)}")
    except Exception as e:
        print(f"Error {lang}: {e}")

