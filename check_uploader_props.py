import re
import glob

for p in sorted(glob.glob('src/pages/*Page.tsx')):
    with open(p, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # find <FileUploader ... >
    matches = re.findall(r'<FileUploader\s+([^>]+)>', content, re.DOTALL)
    for m in matches:
        title_m = re.search(r'title=([^\s/>]+)', m)
        subtitle_m = re.search(r'subtitle=([^\s/>]+)', m)
        if title_m or subtitle_m:
            print(f"{p}: title={title_m.group(1) if title_m else 'None'}, subtitle={subtitle_m.group(1) if subtitle_m else 'None'}")
