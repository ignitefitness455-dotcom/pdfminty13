import type { ToolSEOInfo } from './seo-data';

let cachedFullTools: ToolSEOInfo[] | null = null;
let pendingFullToolsPromise: Promise<ToolSEOInfo[]> | null = null;

export function getCachedFullTools(): ToolSEOInfo[] | null {
  return cachedFullTools;
}

export function loadFullToolsCatalog(): Promise<ToolSEOInfo[]> {
  if (cachedFullTools) {
    return Promise.resolve(cachedFullTools);
  }
  if (!pendingFullToolsPromise) {
    pendingFullToolsPromise = import('./seo-data').then((mod) => {
      cachedFullTools = mod.TOOLS;
      return mod.TOOLS;
    });
  }
  return pendingFullToolsPromise;
}
