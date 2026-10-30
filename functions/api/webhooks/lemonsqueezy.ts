import {
  mintServiceAccountAccessToken,
  patchFirestoreUserSubscription,
} from '../../utils/firebase-auth';

interface Env {
  LEMONSQUEEZY_WEBHOOK_SECRET?: string;
  FIREBASE_PROJECT_ID?: string;
  FIREBASE_CLIENT_EMAIL?: string;
  FIREBASE_PRIVATE_KEY?: string;
  RATELIMIT_KV?: KVNamespace;
}

interface LemonSqueezyWebhookPayload {
  meta?: {
    event_name?: string;
    webhook_id?: string;
    custom_data?: {
      uid?: unknown;
    };
  };
  data?: {
    id?: string | number;
    type?: string;
    attributes?: {
      status?: string;
      refunded?: boolean;
      ends_at?: string | null;
      updated_at?: string;
    };
  };
}

const MAX_WEBHOOK_BODY_BYTES = 256 * 1024;
const VALID_UID_PATTERN = /^[A-Za-z0-9_-]{4,128}$/;
const DEDUPE_TTL_SECONDS = 7 * 24 * 3600;

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

async function computeHmacSha256Hex(secret: string, rawBody: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret) as BufferSource,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(rawBody) as BufferSource
  );
  const bytes = new Uint8Array(sigBuffer);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

function timingSafeHexEquals(providedRaw: string, expectedHex: string): boolean {
  const provided = providedRaw.trim().toLowerCase();
  if (provided.length !== expectedHex.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < expectedHex.length; i++) {
    diff |= provided.charCodeAt(i) ^ expectedHex.charCodeAt(i);
  }
  return diff === 0;
}

interface ResolvedEntitlement {
  actionable: boolean;
  isPro: boolean;
  subscriptionStatus: string;
}

function resolveSubscriptionEntitlement(
  eventName: string,
  attributes: NonNullable<LemonSqueezyWebhookPayload['data']>['attributes']
): ResolvedEntitlement {
  const rawStatus = (attributes?.status || '').trim().toLowerCase();

  if (eventName === 'order_created') {
    const isPaid = (!rawStatus || rawStatus === 'paid') && attributes?.refunded !== true;
    return {
      actionable: true,
      isPro: isPaid,
      subscriptionStatus: isPaid ? 'paid' : rawStatus || 'pending',
    };
  }

  if (
    eventName === 'subscription_expired' ||
    eventName === 'order_refunded' ||
    eventName === 'subscription_payment_refunded'
  ) {
    return {
      actionable: true,
      isPro: false,
      subscriptionStatus: rawStatus || eventName,
    };
  }

  if (
    eventName === 'subscription_created' ||
    eventName === 'subscription_updated' ||
    eventName === 'subscription_resumed' ||
    eventName === 'subscription_unpaused' ||
    eventName === 'subscription_cancelled' ||
    eventName === 'subscription_payment_success' ||
    eventName === 'subscription_payment_recovered'
  ) {
    let isPro = false;
    if (rawStatus === 'active' || rawStatus === 'on_trial') {
      isPro = true;
    } else if (rawStatus === 'cancelled' && attributes?.ends_at) {
      const endsAtMs = Date.parse(attributes.ends_at);
      isPro = Number.isFinite(endsAtMs) && endsAtMs > Date.now();
    } else if (
      (eventName === 'subscription_payment_success' ||
        eventName === 'subscription_payment_recovered') &&
      (rawStatus === 'paid' || !rawStatus)
    ) {
      isPro = true;
    }

    return {
      actionable: true,
      isPro,
      subscriptionStatus: rawStatus || eventName,
    };
  }

  return {
    actionable: false,
    isPro: false,
    subscriptionStatus: rawStatus || eventName || 'ignored',
  };
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed. Use POST.' }, 405);
  }

  const contentLength = parseInt(request.headers.get('content-length') || '0', 10);
  if (contentLength > MAX_WEBHOOK_BODY_BYTES) {
    return jsonResponse({ error: 'Webhook payload exceeds maximum allowed size.' }, 413);
  }

  const webhookSecret = (env.LEMONSQUEEZY_WEBHOOK_SECRET || '').trim();
  if (!webhookSecret) {
    console.error('Lemon Squeezy webhook rejected: LEMONSQUEEZY_WEBHOOK_SECRET is not configured.');
    return jsonResponse({ error: 'Webhook verification secret is not configured.' }, 503);
  }

  const providedSignature = request.headers.get('X-Signature') || '';
  if (!providedSignature.trim()) {
    return jsonResponse({ error: 'Missing X-Signature header.' }, 401);
  }

  const rawBody = await request.text();
  if (rawBody.length > MAX_WEBHOOK_BODY_BYTES) {
    return jsonResponse({ error: 'Webhook payload exceeds maximum allowed size.' }, 413);
  }

  const expectedSignature = await computeHmacSha256Hex(webhookSecret, rawBody);
  if (!timingSafeHexEquals(providedSignature, expectedSignature)) {
    return jsonResponse({ error: 'Invalid webhook signature.' }, 401);
  }

  let payload: LemonSqueezyWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as LemonSqueezyWebhookPayload;
  } catch {
    return jsonResponse({ error: 'Malformed JSON body.' }, 400);
  }

  const eventName = (
    request.headers.get('X-Event-Name') ||
    payload.meta?.event_name ||
    ''
  )
    .trim()
    .toLowerCase();

  if (!eventName) {
    return jsonResponse({ error: 'Missing webhook event_name.' }, 400);
  }

  const entitlement = resolveSubscriptionEntitlement(eventName, payload.data?.attributes);
  if (!entitlement.actionable) {
    return jsonResponse({ received: true, ignored: true, event: eventName }, 200);
  }

  const rawUid = payload.meta?.custom_data?.uid;
  const uid = typeof rawUid === 'string' ? rawUid.trim() : '';
  if (!uid || !VALID_UID_PATTERN.test(uid) || uid.startsWith('demo_')) {
    return jsonResponse({ error: 'Missing or invalid meta.custom_data.uid.' }, 400);
  }

  const projectId = (env.FIREBASE_PROJECT_ID || '').trim();
  const clientEmail = (env.FIREBASE_CLIENT_EMAIL || '').trim();
  const privateKey = (env.FIREBASE_PRIVATE_KEY || '').trim();

  if (!projectId || !clientEmail || !privateKey) {
    console.error(
      'Lemon Squeezy webhook error: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY missing.'
    );
    return jsonResponse({ error: 'Server Firestore credentials are not configured.' }, 503);
  }

  const subscriptionId = String(payload.data?.id || 'unknown');
  const dedupeKey = `ls_webhook:${eventName}:${subscriptionId}:${expectedSignature.slice(0, 32)}`;

  if (env.RATELIMIT_KV) {
    try {
      const existing = await env.RATELIMIT_KV.get(dedupeKey);
      if (existing === '1') {
        return jsonResponse(
          {
            received: true,
            duplicate: true,
            uid,
            isPro: entitlement.isPro,
            status: entitlement.subscriptionStatus,
          },
          200
        );
      }
    } catch (kvReadErr) {
      console.warn('Webhook KV idempotency read warning:', kvReadErr);
    }
  }

  try {
    const accessToken = await mintServiceAccountAccessToken(clientEmail, privateKey);
    await patchFirestoreUserSubscription({
      projectId,
      accessToken,
      uid,
      isPro: entitlement.isPro,
      subscriptionStatus: entitlement.subscriptionStatus,
      subscriptionId,
      updatedAtIso: new Date().toISOString(),
    });

    if (env.RATELIMIT_KV) {
      try {
        await env.RATELIMIT_KV.put(dedupeKey, '1', { expirationTtl: DEDUPE_TTL_SECONDS });
      } catch (kvWriteErr) {
        console.warn('Webhook KV idempotency write warning:', kvWriteErr);
      }
    }

    return jsonResponse(
      {
        received: true,
        uid,
        isPro: entitlement.isPro,
        status: entitlement.subscriptionStatus,
      },
      200
    );
  } catch (err) {
    console.error(
      'Lemon Squeezy Firestore sync failure:',
      err instanceof Error ? err.message : String(err)
    );
    return jsonResponse({ error: 'Failed to synchronize subscription state.' }, 502);
  }
};
