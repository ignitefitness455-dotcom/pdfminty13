import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { onRequest } from '../api/webhooks/lemonsqueezy';
import { _clearFirebaseAuthCacheForTesting } from '../utils/firebase-auth';

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function generateTestServiceAccountPem(): Promise<string> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify']
  );
  const pkcs8 = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
  const b64 = arrayBufferToBase64(pkcs8);
  return `-----BEGIN PRIVATE KEY-----\n${b64}\n-----END PRIVATE KEY-----`;
}

async function signWebhookBody(secret: string, rawBody: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret) as BufferSource,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(rawBody) as BufferSource);
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function createInMemoryKv(): KVNamespace {
  const store = new Map<string, string>();
  return {
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    put: vi.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
  } as unknown as KVNamespace;
}

describe('Lemon Squeezy webhook verification & Firestore Pro sync (TASK-P0-02)', () => {
  const originalFetch = globalThis.fetch;
  const webhookSecret = 'ls_whsec_unit_test_secret_987654321';
  let privateKeyPem = '';

  beforeEach(async () => {
    vi.restoreAllMocks();
    _clearFirebaseAuthCacheForTesting();
    if (!privateKeyPem) {
      privateKeyPem = await generateTestServiceAccountPem();
    }
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    _clearFirebaseAuthCacheForTesting();
  });

  function makeWebhookContext(
    request: Request,
    overrides: Record<string, unknown> = {}
  ): Parameters<typeof onRequest>[0] {
    return {
      request,
      env: {
        LEMONSQUEEZY_WEBHOOK_SECRET: webhookSecret,
        FIREBASE_PROJECT_ID: 'pdfminty-9836d',
        FIREBASE_CLIENT_EMAIL: 'firebase-adminsdk@pdfminty-9836d.iam.gserviceaccount.com',
        FIREBASE_PRIVATE_KEY: privateKeyPem,
        ...overrides,
      },
      params: {},
      data: {},
      functionPath: '/api/webhooks/lemonsqueezy',
      waitUntil: vi.fn(),
      passThroughOnException: vi.fn(),
      next: vi.fn(),
    } as unknown as Parameters<typeof onRequest>[0];
  }

  it('rejects missing or invalid HMAC-SHA256 X-Signature with 401', async () => {
    const body = JSON.stringify({
      meta: { event_name: 'subscription_created', custom_data: { uid: 'uid_user_12345' } },
      data: { id: 'sub_1', attributes: { status: 'active' } },
    });

    const missingSigReq = new Request('https://pdfminty.com/api/webhooks/lemonsqueezy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    const resMissing = await onRequest(makeWebhookContext(missingSigReq));
    expect(resMissing.status).toBe(401);

    const invalidSigReq = new Request('https://pdfminty.com/api/webhooks/lemonsqueezy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': 'deadbeef'.repeat(8),
      },
      body,
    });
    const resInvalid = await onRequest(makeWebhookContext(invalidSigReq));
    expect(resInvalid.status).toBe(401);
  });

  it('rejects demo_* or invalid UIDs even with a valid signature (400)', async () => {
    const body = JSON.stringify({
      meta: { event_name: 'subscription_created', custom_data: { uid: 'demo_173000000' } },
      data: { id: 'sub_demo', attributes: { status: 'active' } },
    });
    const sig = await signWebhookBody(webhookSecret, body);

    const req = new Request('https://pdfminty.com/api/webhooks/lemonsqueezy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': sig,
      },
      body,
    });
    const res = await onRequest(makeWebhookContext(req));
    expect(res.status).toBe(400);
  });

  it('activates Pro in Firestore on signed subscription_created and deduplicates replays via KV', async () => {
    const fetchSpy = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === 'https://oauth2.googleapis.com/token') {
        return new Response(
          JSON.stringify({ access_token: 'ya29.test_sa_token', expires_in: 3600 }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (url.includes('firestore.googleapis.com/v1/projects/pdfminty-9836d')) {
        return new Response(JSON.stringify({ name: 'users/firebaseUidAbc123' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`Unexpected fetch URL: ${url}`);
    });
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    const kv = createInMemoryKv();
    const body = JSON.stringify({
      meta: {
        event_name: 'subscription_created',
        custom_data: { uid: 'firebaseUidAbc123' },
      },
      data: {
        id: 'sub_99001',
        attributes: { status: 'active', updated_at: '2026-10-30T10:00:00Z' },
      },
    });
    const sig = await signWebhookBody(webhookSecret, body);

    const makeReq = () =>
      new Request('https://pdfminty.com/api/webhooks/lemonsqueezy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Signature': sig,
          'X-Event-Name': 'subscription_created',
        },
        body,
      });

    const firstRes = await onRequest(makeWebhookContext(makeReq(), { RATELIMIT_KV: kv }));
    expect(firstRes.status).toBe(200);
    const firstJson = (await firstRes.json()) as {
      received: boolean;
      uid: string;
      isPro: boolean;
      duplicate?: boolean;
    };
    expect(firstJson.received).toBe(true);
    expect(firstJson.uid).toBe('firebaseUidAbc123');
    expect(firstJson.isPro).toBe(true);
    expect(firstJson.duplicate).toBeUndefined();

    // Verify OAuth exchange + Firestore PATCH
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    const [patchUrl, patchInit] = fetchSpy.mock.calls[1] as [string, RequestInit];
    expect(patchUrl).toContain('/documents/users/firebaseUidAbc123?');
    expect(patchUrl).toContain('updateMask.fieldPaths=isPro');
    expect(patchInit.method).toBe('PATCH');
    const patchBody = JSON.parse(String(patchInit.body)) as {
      fields: {
        isPro: { booleanValue: boolean };
        plan: { stringValue: string };
        subscriptionId: { stringValue: string };
      };
    };
    expect(patchBody.fields.isPro.booleanValue).toBe(true);
    expect(patchBody.fields.plan.stringValue).toBe('pro');
    expect(patchBody.fields.subscriptionId.stringValue).toBe('sub_99001');

    // Replay identical signed payload -> deduplicated without hitting Firestore again
    const replayRes = await onRequest(makeWebhookContext(makeReq(), { RATELIMIT_KV: kv }));
    expect(replayRes.status).toBe(200);
    const replayJson = (await replayRes.json()) as { duplicate?: boolean };
    expect(replayJson.duplicate).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('revokes Pro (isPro: false, plan: free) on signed subscription_expired event', async () => {
    const fetchSpy = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === 'https://oauth2.googleapis.com/token') {
        return new Response(
          JSON.stringify({ access_token: 'ya29.test_sa_token', expires_in: 3600 }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(JSON.stringify({ name: 'users/firebaseUidAbc123' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    const body = JSON.stringify({
      meta: {
        event_name: 'subscription_expired',
        custom_data: { uid: 'firebaseUidAbc123' },
      },
      data: {
        id: 'sub_99001',
        attributes: { status: 'expired', updated_at: '2026-11-30T10:00:00Z' },
      },
    });
    const sig = await signWebhookBody(webhookSecret, body);

    const req = new Request('https://pdfminty.com/api/webhooks/lemonsqueezy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': sig,
      },
      body,
    });

    const res = await onRequest(makeWebhookContext(req));
    expect(res.status).toBe(200);
    const json = (await res.json()) as { isPro: boolean; status: string };
    expect(json.isPro).toBe(false);
    expect(json.status).toBe('expired');

    const [, patchInit] = fetchSpy.mock.calls[1] as [string, RequestInit];
    const patchBody = JSON.parse(String(patchInit.body)) as {
      fields: { isPro: { booleanValue: boolean }; plan: { stringValue: string } };
    };
    expect(patchBody.fields.isPro.booleanValue).toBe(false);
    expect(patchBody.fields.plan.stringValue).toBe('free');
  });
});
