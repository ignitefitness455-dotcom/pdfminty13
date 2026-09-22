import os
import glob

tool_pages = glob.glob('src/pages/*Page.tsx')
for tp in sorted(tool_pages):
    with open(tp, 'r', encoding='utf-8') as f:
        content = f.read()
    # Check if this page uses t(
    has_use_translation = 'useTranslation' in content
    # Check what tool-specific components it uses
    has_workspace = 'ToolWorkspace' in content
    has_content_section = 'ToolContentSection' in content
    has_long_form = 'ToolLongForm' in content
    print(f"{os.path.basename(tp)}: useTranslation={has_use_translation}, Workspace={has_workspace}, ContentSection={has_content_section}, LongForm={has_long_form}")
