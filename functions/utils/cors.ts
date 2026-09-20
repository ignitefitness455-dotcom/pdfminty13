/**
 * Strict CORS allowlist for PdfMinty Cloudflare Pages Functions.
 *
 * We use an explicit allowlist (not a regex that accepts any subdomain)
 * to prevent subdomain-takeover → CORS-trust escalation. If a subdomain is
 * ever decommissioned, removing it here is a single-line change.
 *
 * `Vary: Origin` is always emitted so CDN caches don't serve an ACAO header
 * from one origin's response to a different origin's request.
 */

const ALLOWED_ORIGINS = new Set<string>([
  'https://pdfminty.com',
  'https://www.pdfminty.com',
  'https://pdfminty.pages.dev',
]);

const LOCALHOST_PATTERN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function isAllowedOrigin(origin: string): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.has(origin)) return true;
  return LOCALHOST_PATTERN.test(origin);
}

export function getCorsOrigin(request: Request): string {
  const origin = request.headers.get('Origin') || '';
  // Only echo the origin if it's on the allowlist. For disallowed origins we
  // return an empty string so the caller knows not to set ACAO at all.
  return isAllowedOrigin(origin) ? origin : '';
}

export function getCorsHeaders(
  origin: string,
  contentType = 'application/json',
  methods = 'POST, GET, OPTIONS'
): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Allow-Headers': 'Content-Type, Origin',
    'Access-Control-Max-Age': '86400',
    'Content-Type': contentType,
    // Always Vary on Origin so caches don't accidentally serve an ACAO header
    // from one origin's response to a different origin's request.
    Vary: 'Origin',
  };
  // Only set ACAO when the origin is allowed. Setting ACAO: '' is harmless but
  // slightly cleaner is to omit the header entirely.
  if (origin) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}
