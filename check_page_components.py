import re
import glob

for p in sorted(glob.glob('src/pages/*Page.tsx')):
    with open(p, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # find components rendered
    comps = re.findall(r'<([A-Z][a-zA-Z0-9]+)', content)
    unique_comps = sorted(list(set(comps)))
    print(f"{p}: {', '.join(unique_comps)}")
