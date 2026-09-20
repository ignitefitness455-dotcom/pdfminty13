import re

files_to_check = [
    'src/pages/AboutUsPage.tsx',
    'src/pages/PrivacyPolicyPage.tsx',
    'src/pages/TermsOfServicePage.tsx',
    'src/pages/AdobeAlternativePage.tsx',
    'src/pages/IsSafePdfArticlePage.tsx',
    'src/pages/ContactPage.tsx',
    'src/pages/SanitizePdfPage.tsx',
    'src/pages/EditMetadataPage.tsx'
]

for fpath in files_to_check:
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    # Find all strings inside <p>...</p>, <span>...</span>, <li>...</li>, <h2>...</h2>, <h3>...</h3> that don't have t(
    tags = re.findall(r'<(h[1-6]|p|li|span|label|button|option)[^>]*>([^<>{}]*[a-zA-Z]{3,}[^<>{}]*)</\1>', content)
    print(f"\n=== {fpath} ({len(tags)} raw text tags) ===")
    for tag, text in tags[:10]:
        text_clean = text.strip()
        if text_clean and not text_clean.startswith('{'):
            print(f"  <{tag}>: {text_clean}")

