import { getCorsOrigin, getCorsHeaders } from '../utils/cors';
import {
  sanitizeForStorage,
  sanitizeForHtml,
  isValidEmail,
  MAX_NAME_LENGTH,
} from '../utils/validation';

interface Env {
  RATELIMIT_KV?: KVNamespace;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  RESEND_AUDIENCE_ID?: string;
  NOTIFICATION_EMAIL?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const origin = getCorsOrigin(request);
  const corsHeaders = getCorsHeaders(origin);

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders as HeadersInit,
    });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed. Use POST.' }), {
      status: 405,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      } as HeadersInit,
    });
  }

  // Request size limit guard (32 KB)
  const MAX_BODY_BYTES = 32 * 1024;
  const contentLength = parseInt(request.headers.get('content-length') || '0', 10);
  if (contentLength > MAX_BODY_BYTES) {
    return new Response(JSON.stringify({ error: 'Payload too large.' }), {
      status: 413,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      } as HeadersInit,
    });
  }

  // Rate limiting (max 5 subscriptions per IP per hour)
  const ip = request.headers.get('cf-connecting-ip') || 'unknown-ip';
  const hourBlock = Math.floor(Date.now() / 3600000);
  const prefix = `rate_limit:subscribe:${ip}:${hourBlock}:`;
  const LIMIT_PER_HOUR = 5;

  if (env.RATELIMIT_KV) {
    try {
      const listed = await env.RATELIMIT_KV.list({ prefix, limit: LIMIT_PER_HOUR + 1 });
      if (listed.keys.length >= LIMIT_PER_HOUR) {
        return new Response(
          JSON.stringify({
            error: 'Too many subscription requests from this IP. Please try again later.',
          }),
          {
            status: 429,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            } as HeadersInit,
          }
        );
      }
      const uniqueKey = prefix + crypto.randomUUID();
      await env.RATELIMIT_KV.put(uniqueKey, '1', { expirationTtl: 3600 });
    } catch (kvErr) {
      console.error('KV rate limiting error:', kvErr);
    }
  }

  try {
    interface SubscribePayload {
      email?: unknown;
      name?: unknown;
    }

    const rawData = (await request.json()) as SubscribePayload;
    const email = sanitizeForStorage(typeof rawData.email === 'string' ? rawData.email : '');
    const name = sanitizeForStorage(
      typeof rawData.name === 'string' ? rawData.name : '',
      MAX_NAME_LENGTH
    ).replace(/[\r\n]+/g, ' ').trim();

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email address is required.' }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        } as HeadersInit,
      });
    }

    if (!isValidEmail(email)) {
      return new Response(JSON.stringify({ error: 'Please enter a valid email address.' }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        } as HeadersInit,
      });
    }

    const subscriptionId = crypto.randomUUID();
    let resendSuccess = false;

    if (env.RESEND_API_KEY) {
      // 1. Add contact to Resend Audience / Contacts List
      const resendApiKey = env.RESEND_API_KEY;
      const audienceId = env.RESEND_AUDIENCE_ID;

      try {
        let contactCreated = false;

        // Method A: Standard Resend Contacts API with optional audience_id
        const contactsBody: Record<string, unknown> = {
          email,
          unsubscribed: false,
        };
        if (name) {
          contactsBody.first_name = name;
        }
        if (audienceId) {
          contactsBody.audience_id = audienceId;
        }

        const contactRes = await fetch('https://api.resend.com/contacts', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(contactsBody),
        });

        if (contactRes.ok) {
          resendSuccess = true;
          contactCreated = true;
        } else {
          const contactErr = await contactRes.text();
          console.warn('Resend /contacts creation response:', contactErr);

          // Method B: Fallback to /audiences/:id/contacts if Method A failed and audienceId exists
          if (audienceId && !contactCreated) {
            const audienceRes = await fetch(
              `https://api.resend.com/audiences/${audienceId}/contacts`,
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${resendApiKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  email,
                  first_name: name || undefined,
                  unsubscribed: false,
                }),
              }
            );
            if (audienceRes.ok) {
              resendSuccess = true;
            } else {
              const audErrText = await audienceRes.text();
              console.warn('Resend /audiences/:id/contacts fallback failed:', audErrText);
            }
          }
        }
      } catch (audErr) {
        console.error('Resend audience/contacts exception:', audErr);
      }

      // 2. Send Welcome email if RESEND_FROM_EMAIL is set
      const fromEmail = env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
      try {
        const welcomeEmailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [email],
            subject: 'Welcome to PDFMinty Newsletter!',
            html: `
              <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #059669;">Welcome to PDFMinty!</h2>
                <p>Hello ${name ? sanitizeForHtml(name) : 'there'},</p>
                <p>Thank you for subscribing to the PDFMinty newsletter. You'll now receive our latest security updates, PDF productivity tips, and new feature announcements.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 12px; color: #666;">If you did not request this subscription, you can safely ignore this email.</p>
              </div>
            `,
          }),
        });

        if (welcomeEmailRes.ok) {
          resendSuccess = true;
        } else {
          const errText = await welcomeEmailRes.text();
          console.error('Resend welcome email delivery failed:', errText);
        }
      } catch (welcomeErr) {
        console.error('Resend welcome email exception:', welcomeErr);
      }

      // 3. Notify Admin if NOTIFICATION_EMAIL is configured
      if (env.NOTIFICATION_EMAIL) {
        try {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${env.RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: fromEmail,
              to: [env.NOTIFICATION_EMAIL],
              subject: `[PDFMinty] New Newsletter Subscriber: ${email}`,
              html: `<p>New newsletter subscriber joined!</p><p><b>Email:</b> ${sanitizeForHtml(email)}</p><p><b>Name:</b> ${sanitizeForHtml(name || 'N/A')}</p>`,
            }),
          });
        } catch (adminErr) {
          console.error('Failed to notify admin of subscriber:', adminErr);
        }
      }
    }

    // Storage fallback for KV if available
    if (env.RATELIMIT_KV) {
      try {
        await env.RATELIMIT_KV.put(
          `newsletter_subscriber:${email}`,
          JSON.stringify({
            id: subscriptionId,
            email,
            name,
            timestamp: new Date().toISOString(),
            deliveredViaResend: resendSuccess,
          })
        );
      } catch (kvErr) {
        console.error('KV subscriber store exception:', kvErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Thank you for joining! Check your inbox for confirmation.',
        delivered: resendSuccess,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        } as HeadersInit,
      }
    );
  } catch (err) {
    console.error('Subscribe exception:', err);
    return new Response(
      JSON.stringify({ error: 'Failed to process subscription. Please try again later.' }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        } as HeadersInit,
      }
    );
  }
};
