/**
 * Edge-compatible Firebase Auth RS256 ID Token verifier and Firestore REST client
 * built exclusively on Web Crypto (`crypto.subtle`) with zero Node-only SDK dependencies.
 */

const GOOGLE_SECURETOKEN_JWK_URL =
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
const GOOGLE_OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const FIRESTORE_SCOPE = 'https://www.googleapis.com/auth/datastore';

export interface FirebaseIdTokenClaims {
  iss: string;
  aud: string;
  sub: string;
  iat: number;
  exp: number;
  email?: string;
  email_verified?: boolean;
}

interface GoogleJwk extends JsonWebKey {
  kid?: string;
}

interface JwkCacheState {
  keys: GoogleJwk[];
  fetchedAtMs: number;
  expiresAtMs: number;
}

interface OAuthTokenCacheState {
  clientEmail: string;
  accessToken: string;
  expiresAtMs: number;
}

let jwkCache: JwkCacheState | null = null;
let oauthTokenCache: OAuthTokenCacheState | null = null;

export function _clearFirebaseAuthCacheForTesting(): void {
  jwkCache = null;
  oauthTokenCache = null;
}

export function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const normalized = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const paddingLength = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + '='.repeat(paddingLength);
  const binary = atob(padded);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function uint8ArrayToBase64Url(bytes: Uint8Array): string {
  const chunks: string[] = [];
  for (let i = 0; i < bytes.byteLength; i += 8192) {
    chunks.push(String.fromCharCode(...bytes.subarray(i, i + 8192)));
  }
  return btoa(chunks.join('')).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeBase64UrlJson<T>(segment: string): T {
  const bytes = base64UrlToUint8Array(segment);
  const jsonText = new TextDecoder().decode(bytes);
  return JSON.parse(jsonText) as T;
}

function parseMaxAgeMs(cacheControlHeader: string | null): number {
  if (!cacheControlHeader) return 3600_000;
  const match = cacheControlHeader.match(/max-age=(\d+)/i);
  if (!match) return 3600_000;
  const seconds = parseInt(match[1], 10);
  if (!Number.isFinite(seconds) || seconds < 60) return 60_000;
  return Math.min(seconds * 1000, 6 * 3600_000);
}

async function fetchGoogleSecureTokenJwks(forceRefresh = false): Promise<GoogleJwk[]> {
  const now = Date.now();
  if (!forceRefresh && jwkCache && jwkCache.expiresAtMs > now) {
    return jwkCache.keys;
  }

  const res = await fetch(GOOGLE_SECURETOKEN_JWK_URL, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch Firebase public JWKs (${res.status}).`);
  }

  const body = (await res.json()) as { keys?: GoogleJwk[] };
  if (!Array.isArray(body.keys) || body.keys.length === 0) {
    throw new Error('Firebase public JWK response contained no keys.');
  }

  const ttlMs = parseMaxAgeMs(res.headers.get('Cache-Control'));
  jwkCache = {
    keys: body.keys,
    fetchedAtMs: now,
    expiresAtMs: now + ttlMs,
  };
  return body.keys;
}

/**
 * Cryptographically verifies a Firebase Authentication ID token (RS256) against
 * Google's SecureToken JWK set and validates `iss`, `aud`, `sub`, `iat`, and `exp`.
 */
export async function verifyFirebaseIdToken(
  idToken: string,
  expectedProjectId: string
): Promise<FirebaseIdTokenClaims> {
  const trimmed = idToken.trim();
  const segments = trimmed.split('.');
  if (segments.length !== 3) {
    throw new Error('Malformed Firebase ID token.');
  }

  const [headerB64, payloadB64, signatureB64] = segments;
  let header: { alg?: string; kid?: string };
  let claims: FirebaseIdTokenClaims;
  try {
    header = decodeBase64UrlJson<{ alg?: string; kid?: string }>(headerB64);
    claims = decodeBase64UrlJson<FirebaseIdTokenClaims>(payloadB64);
  } catch {
    throw new Error('Malformed Firebase ID token JSON.');
  }

  if (header.alg !== 'RS256' || typeof header.kid !== 'string' || header.kid.length === 0) {
    throw new Error('Unsupported Firebase ID token algorithm or missing key ID.');
  }

  const expectedIssuer = `https://securetoken.google.com/${expectedProjectId}`;
  if (claims.aud !== expectedProjectId || claims.iss !== expectedIssuer) {
    throw new Error('Firebase ID token project audience or issuer mismatch.');
  }

  if (typeof claims.sub !== 'string' || claims.sub.length === 0 || claims.sub.length > 128) {
    throw new Error('Firebase ID token subject (uid) is invalid.');
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (typeof claims.exp !== 'number' || claims.exp <= nowSec) {
    throw new Error('Firebase ID token has expired.');
  }
  if (typeof claims.iat !== 'number' || claims.iat > nowSec + 60) {
    throw new Error('Firebase ID token issued-at timestamp is invalid.');
  }

  let keys = await fetchGoogleSecureTokenJwks(false);
  let matchingJwk = keys.find((k) => k.kid === header.kid);
  if (!matchingJwk && jwkCache && Date.now() - jwkCache.fetchedAtMs > 60_000) {
    keys = await fetchGoogleSecureTokenJwks(true);
    matchingJwk = keys.find((k) => k.kid === header.kid);
  }
  if (!matchingJwk || !matchingJwk.n || !matchingJwk.e) {
    throw new Error('Firebase ID token signing key not found in Google JWK set.');
  }

  const publicKey = await crypto.subtle.importKey(
    'jwk',
    {
      kty: 'RSA',
      n: matchingJwk.n,
      e: matchingJwk.e,
      alg: 'RS256',
      ext: true,
    },
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const signedContent = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const signatureBytes = base64UrlToUint8Array(signatureB64);
  const isValid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    publicKey,
    signatureBytes as BufferSource,
    signedContent as BufferSource
  );

  if (!isValid) {
    throw new Error('Firebase ID token cryptographic signature verification failed.');
  }

  return claims;
}

/**
 * Extracts a `Bearer <token>` credential from an HTTP `Authorization` header.
 * Returns `null` when no Authorization header is present, or throws if malformed.
 */
export function extractBearerToken(request: Request): string | null {
  const rawHeader = request.headers.get('Authorization');
  if (!rawHeader) return null;
  const trimmed = rawHeader.trim();
  if (!trimmed.toLowerCase().startsWith('bearer ')) {
    throw new Error('Authorization header must use Bearer scheme.');
  }
  const token = trimmed.slice(7).trim();
  if (!token) {
    throw new Error('Bearer token is empty.');
  }
  return token;
}

interface FirestoreDocumentResponse {
  fields?: {
    isPro?: { booleanValue?: boolean };
    plan?: { stringValue?: string };
  };
}

/**
 * Queries Firestore REST API using the caller's verified Firebase ID token
 * (`allow read: if isOwner(userId)` in `firestore.rules`) to verify `isPro === true`.
 */
export async function verifyFirestoreProStatus(
  projectId: string,
  uid: string,
  userIdToken: string
): Promise<boolean> {
  const docUrl = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
    projectId
  )}/databases/(default)/documents/users/${encodeURIComponent(uid)}`;

  const res = await fetch(docUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${userIdToken}`,
      Accept: 'application/json',
    },
  });

  if (res.status === 404 || res.status === 403) {
    return false;
  }
  if (!res.ok) {
    throw new Error(`Firestore profile verification failed (${res.status}).`);
  }

  const doc = (await res.json()) as FirestoreDocumentResponse;
  return doc.fields?.isPro?.booleanValue === true;
}

function pemPrivateKeyToArrayBuffer(pem: string): ArrayBuffer {
  const normalized = pem
    .replace(/\\n/g, '\n')
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '');

  const binary = atob(normalized);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return buffer;
}

/**
 * Mints a Google OAuth 2.0 Service Account access token scoped to Cloud Datastore / Firestore
 * using an RS256 PKCS#8 private key assertion (`urn:ietf:params:oauth:grant-type:jwt-bearer`).
 */
export async function mintServiceAccountAccessToken(
  clientEmail: string,
  privateKeyPem: string
): Promise<string> {
  const nowMs = Date.now();
  if (
    oauthTokenCache &&
    oauthTokenCache.clientEmail === clientEmail &&
    oauthTokenCache.expiresAtMs - 60_000 > nowMs
  ) {
    return oauthTokenCache.accessToken;
  }

  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    pemPrivateKeyToArrayBuffer(privateKeyPem),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const nowSec = Math.floor(nowMs / 1000);
  const headerB64 = uint8ArrayToBase64Url(
    new TextEncoder().encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  );
  const claimsB64 = uint8ArrayToBase64Url(
    new TextEncoder().encode(
      JSON.stringify({
        iss: clientEmail,
        sub: clientEmail,
        aud: GOOGLE_OAUTH_TOKEN_URL,
        iat: nowSec,
        exp: nowSec + 3600,
        scope: FIRESTORE_SCOPE,
      })
    )
  );

  const signingInput = new TextEncoder().encode(`${headerB64}.${claimsB64}`);
  const signatureBuffer = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    signingInput as BufferSource
  );
  const signatureB64 = uint8ArrayToBase64Url(new Uint8Array(signatureBuffer));
  const assertion = `${headerB64}.${claimsB64}.${signatureB64}`;

  const tokenRes = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=${encodeURIComponent(
      'urn:ietf:params:oauth:grant-type:jwt-bearer'
    )}&assertion=${encodeURIComponent(assertion)}`,
  });

  if (!tokenRes.ok) {
    throw new Error(`Google OAuth service account token exchange failed (${tokenRes.status}).`);
  }

  const tokenData = (await tokenRes.json()) as { access_token?: string; expires_in?: number };
  if (!tokenData.access_token) {
    throw new Error('Google OAuth response did not include an access_token.');
  }

  const expiresInMs = Math.max(120, tokenData.expires_in || 3600) * 1000;
  oauthTokenCache = {
    clientEmail,
    accessToken: tokenData.access_token,
    expiresAtMs: nowMs + expiresInMs,
  };
  return tokenData.access_token;
}

export interface PatchSubscriptionParams {
  projectId: string;
  accessToken: string;
  uid: string;
  isPro: boolean;
  subscriptionStatus: string;
  subscriptionId: string;
  updatedAtIso: string;
}

/**
 * Atomically upserts privileged subscription fields on `users/{uid}` via Firestore REST API
 * using an explicit `updateMask` so user profile metadata (`email`, `displayName`, `photoURL`)
 * is never overwritten.
 */
export async function patchFirestoreUserSubscription(
  params: PatchSubscriptionParams
): Promise<void> {
  const {
    projectId,
    accessToken,
    uid,
    isPro,
    subscriptionStatus,
    subscriptionId,
    updatedAtIso,
  } = params;

  const maskFields = [
    'uid',
    'isPro',
    'plan',
    'subscriptionStatus',
    'subscriptionId',
    'subscriptionUpdatedAt',
  ];
  const maskQuery = maskFields
    .map((field) => `updateMask.fieldPaths=${encodeURIComponent(field)}`)
    .join('&');

  const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
    projectId
  )}/databases/(default)/documents/users/${encodeURIComponent(uid)}?${maskQuery}`;

  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: {
        uid: { stringValue: uid },
        isPro: { booleanValue: isPro },
        plan: { stringValue: isPro ? 'pro' : 'free' },
        subscriptionStatus: { stringValue: subscriptionStatus },
        subscriptionId: { stringValue: subscriptionId },
        subscriptionUpdatedAt: { timestampValue: updatedAtIso },
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Firestore subscription PATCH failed (${res.status}): ${errText.slice(0, 200)}`);
  }
}
