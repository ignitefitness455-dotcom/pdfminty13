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

  it('handles simultaneous payments from multiple users concurrently with single OAuth token minting and isolated Firestore updates', async () => {
    let oauthCallCount = 0;
    const patchedUsers: Array<{ url: string; uid: string; subId: string }> = [];

    const fetchSpy = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === 'https://oauth2.googleapis.com/token') {
        oauthCallCount += 1;
        await new Promise((r) => setTimeout(r, 15));
        return new Response(
          JSON.stringify({ access_token: 'ya29.shared_sa_token', expires_in: 3600 }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (url.includes('firestore.googleapis.com') && init?.body) {
        const parsed = JSON.parse(String(init.body)) as {
          fields: { uid: { stringValue: string }; subscriptionId: { stringValue: string } };
        };
        patchedUsers.push({
          url,
          uid: parsed.fields.uid.stringValue,
          subId: parsed.fields.subscriptionId.stringValue,
        });
        return new Response(JSON.stringify({ name: url }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response('Not found', { status: 404 });
    });
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    const kvStore = new Map<string, string>();
    const kv = {
      get: vi.fn(async (k: string) => kvStore.get(k) ?? null),
      put: vi.fn(async (k: string, v: string) => {
        kvStore.set(k, v);
      }),
    } as unknown as KVNamespace;

    const users = [
      { uid: 'userAlpha_101', subId: 'sub_alpha_1' },
      { uid: 'userBravo_202', subId: 'sub_bravo_2' },
      { uid: 'userCharlie_303', subId: 'sub_charlie_3' },
    ];

    const requests = await Promise.all(
      users.map(async ({ uid, subId }) => {
        const body = JSON.stringify({
          meta: { event_name: 'subscription_created', custom_data: { uid } },
          data: {
            id: subId,
            attributes: { status: 'active', updated_at: '2026-11-02T15:00:00Z' },
          },
        });
        const sig = await signWebhookBody(webhookSecret, body);
        return new Request('https://pdfminty.com/api/webhooks/lemonsqueezy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Signature': sig },
          body,
        });
      })
    );

    const responses = await Promise.all(
      requests.map((req) => onRequest(makeWebhookContext(req, { RATELIMIT_KV: kv })))
    );

    for (const res of responses) {
      expect(res.status).toBe(200);
    }

    // All 3 concurrent webhooks share a single OAuth token minting call
    expect(oauthCallCount).toBe(1);
    expect(patchedUsers).toHaveLength(3);
    expect(patchedUsers.map((u) => u.uid).sort()).toEqual([
      'userAlpha_101',
      'userBravo_202',
      'userCharlie_303',
    ]);
  });

  it('deduplicates concurrent identical webhook deliveries arriving simultaneously in-flight', async () => {
    let firestorePatchCount = 0;
    const fetchSpy = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === 'https://oauth2.googleapis.com/token') {
        return new Response(
          JSON.stringify({ access_token: 'ya29.test_sa_token', expires_in: 3600 }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      firestorePatchCount += 1;
      await new Promise((r) => setTimeout(r, 20));
      return new Response(JSON.stringify({ name: 'users/concurrentUid99' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    const body = JSON.stringify({
      meta: { event_name: 'subscription_created', custom_data: { uid: 'concurrentUid99' } },
      data: {
        id: 'sub_concurrent_99',
        attributes: { status: 'active', updated_at: '2026-11-02T16:00:00Z' },
      },
    });
    const sig = await signWebhookBody(webhookSecret, body);
    const makeReq = () =>
      new Request('https://pdfminty.com/api/webhooks/lemonsqueezy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Signature': sig },
        body,
      });

    const [res1, res2] = await Promise.all([
      onRequest(makeWebhookContext(makeReq())),
      onRequest(makeWebhookContext(makeReq())),
    ]);

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    const json1 = (await res1.json()) as { duplicate?: boolean };
    const json2 = (await res2.json()) as { duplicate?: boolean };
    expect(Boolean(json1.duplicate) || Boolean(json2.duplicate)).toBe(true);
    expect(firestorePatchCount).toBe(1);
  });

  it('ignores stale out-of-order webhook events so older status cannot overwrite newer status', async () => {
    let firestorePatchCount = 0;
    const fetchSpy = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === 'https://oauth2.googleapis.com/token') {
        return new Response(
          JSON.stringify({ access_token: 'ya29.test_sa_token', expires_in: 3600 }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      firestorePatchCount += 1;
      return new Response(JSON.stringify({ name: 'users/orderTestUid' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    const kvStore = new Map<string, string>();
    const kv = {
      get: vi.fn(async (k: string) => kvStore.get(k) ?? null),
      put: vi.fn(async (k: string, v: string) => {
        kvStore.set(k, v);
      }),
    } as unknown as KVNamespace;

    // 1. Newer event arrives first (e.g. cancelled at 18:05:00Z)
    const newerBody = JSON.stringify({
      meta: { event_name: 'subscription_cancelled', custom_data: { uid: 'orderTestUid' } },
      data: {
        id: 'sub_order_77',
        attributes: { status: 'cancelled', updated_at: '2026-11-02T18:05:00Z' },
      },
    });
    const newerSig = await signWebhookBody(webhookSecret, newerBody);
    const newerRes = await onRequest(
      makeWebhookContext(
        new Request('https://pdfminty.com/api/webhooks/lemonsqueezy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Signature': newerSig },
          body: newerBody,
        }),
        { RATELIMIT_KV: kv }
      )
    );
    expect(newerRes.status).toBe(200);
    expect(firestorePatchCount).toBe(1);

    // 2. Older delayed event arrives second (e.g. created at 18:00:00Z)
    const olderBody = JSON.stringify({
      meta: { event_name: 'subscription_created', custom_data: { uid: 'orderTestUid' } },
      data: {
        id: 'sub_order_77',
        attributes: { status: 'active', updated_at: '2026-11-02T18:00:00Z' },
      },
    });
    const olderSig = await signWebhookBody(webhookSecret, olderBody);
    const olderRes = await onRequest(
      makeWebhookContext(
        new Request('https://pdfminty.com/api/webhooks/lemonsqueezy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Signature': olderSig },
          body: olderBody,
        }),
        { RATELIMIT_KV: kv }
      )
    );
    expect(olderRes.status).toBe(200);
    const olderJson = (await olderRes.json()) as { ignored?: boolean; reason?: string };
    expect(olderJson.ignored).toBe(true);
    expect(olderJson.reason).toBe('stale_out_of_order_event');
    expect(firestorePatchCount).toBe(1);
  });
});
