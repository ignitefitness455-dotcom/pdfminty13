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
      plan?: unknown;
    };
  };
  data?: {
    id?: string | number;
    type?: string;
    attributes?: {
      status?: string;
      refunded?: boolean;
      renews_at?: string | null;
      ends_at?: string | null;
      updated_at?: string;
      variant_name?: string;
      product_name?: string;
      first_order_item?: {
        variant_name?: string;
        product_name?: string;
      };
      urls?: {
        customer_portal?: string;
        update_payment_method?: string;
      };
    };
  };
}

const MAX_WEBHOOK_BODY_BYTES = 256 * 1024;
const VALID_UID_PATTERN = /^[A-Za-z0-9_-]{4,128}$/;
const DEDUPE_TTL_SECONDS = 7 * 24 * 3600;
const inflightDedupeKeys = new Set<string>();

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
  const sigBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody) as BufferSource);
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
  plan: 'free' | 'pro' | 'lifetime';
  subscriptionStatus: string;
}

function resolveSubscriptionEntitlement(
  eventName: string,
  attributes: NonNullable<LemonSqueezyWebhookPayload['data']>['attributes'],
  customPlanHint?: string
): ResolvedEntitlement {
  const rawStatus = (attributes?.status || '').trim().toLowerCase();
  const variantOrProduct = [
    customPlanHint || '',
    attributes?.variant_name || '',
    attributes?.product_name || '',
    attributes?.first_order_item?.variant_name || '',
    attributes?.first_order_item?.product_name || '',
  ]
    .join(' ')
    .toLowerCase();
  const isLifetimeOrder = variantOrProduct.includes('lifetime');

  if (eventName === 'order_created') {
    const isPaid = (!rawStatus || rawStatus === 'paid') && attributes?.refunded !== true;
    return {
      actionable: true,
      isPro: isPaid,
      plan: isPaid ? (isLifetimeOrder ? 'lifetime' : 'pro') : 'free',
      subscriptionStatus: isPaid ? (isLifetimeOrder ? 'lifetime' : 'paid') : rawStatus || 'pending',
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
      plan: 'free',
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
    } else if (rawStatus === 'cancelled' || eventName === 'subscription_cancelled') {
      if (attributes?.ends_at) {
        const endsAtMs = Date.parse(attributes.ends_at);
        isPro = Number.isFinite(endsAtMs) && endsAtMs > Date.now();
      } else {
        // Grace period fallback if ends_at was not populated yet on cancellation event
        isPro = true;
      }
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
      plan: isPro ? 'pro' : 'free',
      subscriptionStatus: rawStatus || eventName,
    };
  }

  return {
    actionable: false,
    isPro: false,
    plan: 'free',
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

  const eventName = (request.headers.get('X-Event-Name') || payload.meta?.event_name || '')
    .trim()
    .toLowerCase();

  if (!eventName) {
    return jsonResponse({ error: 'Missing webhook event_name.' }, 400);
  }

  const customPlanHint =
    typeof payload.meta?.custom_data?.plan === 'string'
      ? payload.meta.custom_data.plan.trim()
      : '';
  const attrs = payload.data?.attributes;
  const entitlement = resolveSubscriptionEntitlement(eventName, attrs, customPlanHint);
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
  const orderingKey = `ls_sub_updated_at:${uid}:${subscriptionId}`;
  const rawEventUpdatedAt = payload.data?.attributes?.updated_at;
  const parsedEventUpdatedAtMs =
    typeof rawEventUpdatedAt === 'string' && rawEventUpdatedAt.trim().length > 0
      ? Date.parse(rawEventUpdatedAt)
      : NaN;

  if (inflightDedupeKeys.has(dedupeKey)) {
    return jsonResponse(
      {
        received: true,
        duplicate: true,
        inFlight: true,
        uid,
        isPro: entitlement.isPro,
        status: entitlement.subscriptionStatus,
      },
      200
    );
  }

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

      if (Number.isFinite(parsedEventUpdatedAtMs)) {
        const lastUpdatedAtRaw = await env.RATELIMIT_KV.get(orderingKey);
        if (lastUpdatedAtRaw) {
          const lastUpdatedAtMs = Number(lastUpdatedAtRaw);
          if (Number.isFinite(lastUpdatedAtMs) && parsedEventUpdatedAtMs < lastUpdatedAtMs) {
            return jsonResponse(
              {
                received: true,
                ignored: true,
                reason: 'stale_out_of_order_event',
                uid,
                event: eventName,
              },
              200
            );
          }
        }
      }
    } catch (kvReadErr) {
      console.warn('Webhook KV idempotency read warning:', kvReadErr);
    }
  }

  inflightDedupeKeys.add(dedupeKey);
  try {
    const accessToken = await mintServiceAccountAccessToken(clientEmail, privateKey);
    const effectiveUpdatedAtIso = Number.isFinite(parsedEventUpdatedAtMs)
      ? new Date(parsedEventUpdatedAtMs).toISOString()
      : new Date().toISOString();

    await patchFirestoreUserSubscription({
      projectId,
      accessToken,
      uid,
      isPro: entitlement.isPro,
      plan: entitlement.plan,
      subscriptionStatus: entitlement.subscriptionStatus,
      subscriptionId,
      updatedAtIso: effectiveUpdatedAtIso,
      renewsAt: attrs?.renews_at ?? undefined,
      endsAt: attrs?.ends_at ?? undefined,
      customerPortalUrl: attrs?.urls?.customer_portal || null,
      updatePaymentMethodUrl: attrs?.urls?.update_payment_method || null,
    });

    if (env.RATELIMIT_KV) {
      try {
        await env.RATELIMIT_KV.put(dedupeKey, '1', { expirationTtl: DEDUPE_TTL_SECONDS });
        if (Number.isFinite(parsedEventUpdatedAtMs)) {
          await env.RATELIMIT_KV.put(orderingKey, String(parsedEventUpdatedAtMs), {
            expirationTtl: DEDUPE_TTL_SECONDS,
          });
        }
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
  } finally {
    inflightDedupeKeys.delete(dedupeKey);
  }
};
