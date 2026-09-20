import re
import glob

for p in sorted(glob.glob('src/pages/*Page.tsx')):
    with open(p, 'r', encoding='utf-8') as f:
        content = f.read()
    
    matches = re.findall(r'<ToolHeader\s+([^>]+)>', content, re.DOTALL)
    for m in matches:
        title_m = re.search(r'overrideTitle=([^\s/>]+)', m)
        desc_m = re.search(r'overrideDesc=([^\s/>]+)', m)
        if title_m or desc_m:
            print(f"{p}: overrideTitle={title_m.group(1) if title_m else 'None'}, overrideDesc={desc_m.group(1) if desc_m else 'None'}")
