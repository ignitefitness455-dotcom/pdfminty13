import { getCorsOrigin, getCorsHeaders } from '../utils/cors';
import {
  extractBearerToken,
  verifyFirebaseIdToken,
  mintServiceAccountAccessToken,
  patchFirestoreUserSubscription,
} from '../utils/firebase-auth';

interface Env {
  FIREBASE_PROJECT_ID?: string;
  VITE_FIREBASE_PROJECT_ID?: string;
  FIREBASE_CLIENT_EMAIL?: string;
  FIREBASE_PRIVATE_KEY?: string;
  LEMONSQUEEZY_API_KEY?: string;
  VITE_LEMON_SQUEEZY_BILLING_PORTAL_URL?: string;
}

interface SubscriptionActionRequest {
  action?: 'cancel' | 'resume' | 'portal';
}

interface FirestoreUserDoc {
  fields?: {
    isPro?: { booleanValue?: boolean };
    plan?: { stringValue?: string };
    subscriptionId?: { stringValue?: string };
    subscriptionStatus?: { stringValue?: string };
    renewsAt?: { stringValue?: string };
    endsAt?: { stringValue?: string };
    customerPortalUrl?: { stringValue?: string };
    updatePaymentMethodUrl?: { stringValue?: string };
  };
}

interface LemonSqueezySubscriptionResponse {
  data?: {
    id?: string;
    attributes?: {
      status?: string;
      cancelled?: boolean;
      renews_at?: string | null;
      ends_at?: string | null;
      urls?: {
        customer_portal?: string;
        update_payment_method?: string;
      };
    };
  };
}

const DEFAULT_PORTAL_URL = 'https://pdfminty.lemonsqueezy.com/billing';

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  corsHeaders: Record<string, string>
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const origin = getCorsOrigin(request);
  const corsHeaders = getCorsHeaders(origin, 'application/json', 'POST, OPTIONS');

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed. Use POST.' }, 405, corsHeaders);
  }

  const projectId = (env.FIREBASE_PROJECT_ID || env.VITE_FIREBASE_PROJECT_ID || 'pdfminty-9836d').trim();

  let idToken: string | null = null;
  try {
    idToken = extractBearerToken(request);
  } catch (err) {
    return jsonResponse(
      { error: err instanceof Error ? err.message : 'Invalid Authorization header.' },
      401,
      corsHeaders
    );
  }

  if (!idToken) {
    return jsonResponse({ error: 'Missing Authorization Bearer token.' }, 401, corsHeaders);
  }

  let uid: string;
  try {
    const claims = await verifyFirebaseIdToken(idToken, projectId);
    uid = claims.sub;
  } catch (err) {
    return jsonResponse(
      { error: err instanceof Error ? err.message : 'Invalid Firebase ID token.' },
      401,
      corsHeaders
    );
  }

  let body: SubscriptionActionRequest;
  try {
    body = (await request.json()) as SubscriptionActionRequest;
  } catch {
    return jsonResponse({ error: 'Malformed JSON body.' }, 400, corsHeaders);
  }

  const action = body.action;
  if (action !== 'cancel' && action !== 'resume' && action !== 'portal') {
    return jsonResponse(
      { error: 'Invalid action. Expected "cancel", "resume", or "portal".' },
      400,
      corsHeaders
    );
  }

  // Fetch user's Firestore document using their verified ID token (allowed by isOwner(userId))
  const docUrl = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
    projectId
  )}/databases/(default)/documents/users/${encodeURIComponent(uid)}`;

  let userDoc: FirestoreUserDoc | null = null;
  try {
    const docRes = await fetch(docUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${idToken}`,
        Accept: 'application/json',
      },
    });
    if (docRes.ok) {
      userDoc = (await docRes.json()) as FirestoreUserDoc;
    }
  } catch (err) {
    console.warn('[Subscription API] Firestore read warning:', err);
  }

  const subscriptionId = (userDoc?.fields?.subscriptionId?.stringValue || '').trim();
  const storedPortalUrl =
    (userDoc?.fields?.customerPortalUrl?.stringValue || '').trim() ||
    (env.VITE_LEMON_SQUEEZY_BILLING_PORTAL_URL || '').trim() ||
    DEFAULT_PORTAL_URL;
  const currentPlan = (userDoc?.fields?.plan?.stringValue || 'pro') as 'free' | 'pro' | 'lifetime';

  if (action === 'portal' || currentPlan === 'lifetime') {
    return jsonResponse(
      {
        ok: true,
        action: 'portal',
        plan: currentPlan,
        portalUrl: storedPortalUrl,
      },
      200,
      corsHeaders
    );
  }

  const lsApiKey = (env.LEMONSQUEEZY_API_KEY || '').trim();

  // If Lemon Squeezy API key and a valid numeric subscriptionId are available, perform direct API mutation
  if (lsApiKey && subscriptionId && /^\d+$/.test(subscriptionId)) {
    try {
      const shouldCancel = action === 'cancel';
      const lsRes = await fetch(
        `https://api.lemonsqueezy.com/v1/subscriptions/${encodeURIComponent(subscriptionId)}`,
        {
          method: 'PATCH',
          headers: {
            Accept: 'application/vnd.api+json',
            'Content-Type': 'application/vnd.api+json',
            Authorization: `Bearer ${lsApiKey}`,
          },
          body: JSON.stringify({
            data: {
              type: 'subscriptions',
              id: String(subscriptionId),
              attributes: {
                cancelled: shouldCancel,
              },
            },
          }),
        }
      );

      if (lsRes.ok) {
        const lsPayload = (await lsRes.json()) as LemonSqueezySubscriptionResponse;
        const attrs = lsPayload.data?.attributes;
        const status = (attrs?.status || (shouldCancel ? 'cancelled' : 'active')).toLowerCase();
        const renewsAt = attrs?.renews_at ?? null;
        const endsAt = attrs?.ends_at ?? null;
        const portalUrl = attrs?.urls?.customer_portal || storedPortalUrl;
        const updatePaymentMethodUrl = attrs?.urls?.update_payment_method || null;

        let isPro = status === 'active' || status === 'on_trial';
        if (status === 'cancelled') {
          if (endsAt) {
            const endsMs = Date.parse(endsAt);
            isPro = Number.isFinite(endsMs) && endsMs > Date.now();
          } else {
            isPro = true;
          }
        }

        const clientEmail = (env.FIREBASE_CLIENT_EMAIL || '').trim();
        const privateKey = (env.FIREBASE_PRIVATE_KEY || '').trim();
        if (clientEmail && privateKey) {
          const accessToken = await mintServiceAccountAccessToken(clientEmail, privateKey);
          await patchFirestoreUserSubscription({
            projectId,
            accessToken,
            uid,
            isPro,
            plan: isPro ? 'pro' : 'free',
            subscriptionStatus: status,
            subscriptionId,
            updatedAtIso: new Date().toISOString(),
            renewsAt,
            endsAt,
            customerPortalUrl: portalUrl,
            updatePaymentMethodUrl,
          });
        }

        return jsonResponse(
          {
            ok: true,
            updatedViaApi: true,
            action,
            isPro,
            subscriptionStatus: status,
            renewsAt,
            endsAt,
            portalUrl,
          },
          200,
          corsHeaders
        );
      }
    } catch (lsErr) {
      console.warn('[Subscription API] Lemon Squeezy PATCH fallback to customer portal:', lsErr);
    }
  }

  // Fallback when LEMONSQUEEZY_API_KEY is not configured or subscription is managed via Customer Portal:
  // Return the verified Lemon Squeezy Customer Portal URL so the client can open it directly (never faking localStorage state).
  return jsonResponse(
    {
      ok: true,
      updatedViaApi: false,
      requiresPortalRedirect: true,
      action,
      portalUrl: storedPortalUrl,
      subscriptionStatus: userDoc?.fields?.subscriptionStatus?.stringValue || 'active',
      renewsAt: userDoc?.fields?.renewsAt?.stringValue || null,
      endsAt: userDoc?.fields?.endsAt?.stringValue || null,
    },
    200,
    corsHeaders
  );
};
