# Maintenance & Migration Scripts

This directory contains one-off maintenance, audit, and migration scripts used during initial setup, translation audits, key validation, and tool structure analysis.

## Categories

### 1. Tool & Localization Audits (Python)
- `check_all_t_calls.py`: Audits translation `t()` function calls.
- `check_all_tools_keys.py`: Checks presence of all required tool translation keys.
- `check_faqs.py`: Validates FAQ translation keys.
- `check_tools_json.py`, `check_tools_structure.py`: Validates JSON schema of tool definitions.
- `deep_tool_scan.py`: Deep scan of tool UI props, headings, and descriptions.
- `generate_tools_translations.py`: Generates missing locale strings for tool cards.
- `patch.py`, `replace_adobe_more.py`, `replace_final.py`: Text replacement and migration patches.

### 2. Migration & Scratch Helpers (CJS / JSON)
- `expand.cjs`, `fix-internal-*.cjs`, `fix-redirects.cjs`: Internal link and redirect repair helpers.
- `auto-keys.json`, `extracted-keys.json`, `patch_common_en.json`: Scratch JSON files from extraction runs.
