import { getCorsOrigin, getCorsHeaders } from '../utils/cors';
import {
  sanitizeForStorage,
  sanitizeForHtml,
  isValidEmail,
  MAX_MESSAGE_LENGTH,
} from '../utils/validation';

interface Env {
  RATELIMIT_KV?: KVNamespace;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
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

  // Request body size guard — reject oversized payloads before parsing.
  const MAX_BODY_BYTES = 32 * 1024; // 32 KB (feedback form data is small)
  const contentLength = parseInt(request.headers.get('content-length') || '0', 10);
  if (contentLength > MAX_BODY_BYTES) {
    return new Response(
      JSON.stringify({ error: 'Request body too large.' }),
      {
        status: 413,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        } as HeadersInit,
      }
    );
  }

  // Rate Limiting — unique-key-per-request pattern (atomic, race-free).
  const ip = request.headers.get('cf-connecting-ip') || 'unknown-ip';
  const hourBlock = Math.floor(Date.now() / 3600000);
  const prefix = `rate_limit:feedback:${ip}:${hourBlock}:`;
  const LIMIT_PER_HOUR = 3;

  if (env.RATELIMIT_KV) {
    try {
      const listed = await env.RATELIMIT_KV.list({ prefix, limit: LIMIT_PER_HOUR + 1 });
      if (listed.keys.length >= LIMIT_PER_HOUR) {
        return new Response(
          JSON.stringify({
            error:
              'Too many feedback requests from this IP. Please wait an hour before trying again.',
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
    } catch (kvError) {
      console.error('KV rate limiting read/write error:', kvError);
    }
  }

  try {
    interface FeedbackPayload {
      rating?: unknown;
      comment?: unknown;
      email?: unknown;
    }
    const rawData = (await request.json()) as FeedbackPayload;
    const ratingRaw = parseInt(typeof rawData.rating === 'string' || typeof rawData.rating === 'number' ? String(rawData.rating) : '', 10);
    const comment = sanitizeForStorage(typeof rawData.comment === 'string' ? rawData.comment : '');
    const emailRaw = typeof rawData.email === 'string' ? sanitizeForStorage(rawData.email) : '';

    const errors: Record<string, string> = {};

    if (isNaN(ratingRaw) || ratingRaw < 1 || ratingRaw > 5) {
      errors.rating = 'Rating must be a whole number between 1 and 5.';
    }

    if (!comment) {
      errors.comment = 'Comment is required.';
    } else if (comment.length > MAX_MESSAGE_LENGTH) {
      errors.comment = `Comment cannot exceed ${MAX_MESSAGE_LENGTH} characters.`;
    }

    if (emailRaw && !isValidEmail(emailRaw)) {
      errors.email = 'Please provide a valid email address.';
    }

    if (Object.keys(errors).length > 0) {
      return new Response(JSON.stringify({ error: 'Validation failed', errors }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        } as HeadersInit,
      });
    }

    const submissionId = crypto.randomUUID();
    const payloadHtml = `
      <h3>New Feedback Submission</h3>
      <p><b>ID:</b> ${submissionId}</p>
      <p><b>Rating:</b> ${ratingRaw} / 5 Stars</p>
      <p><b>Email:</b> ${emailRaw ? sanitizeForHtml(emailRaw) : '<i>Not provided</i>'}</p>
      <p><b>Comment / Message:</b></p>
      <pre>${sanitizeForHtml(comment)}</pre>
    `;

    let emailSent = false;
    if (env.RESEND_API_KEY && env.RESEND_FROM_EMAIL && env.NOTIFICATION_EMAIL) {
      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: env.RESEND_FROM_EMAIL,
            to: [env.NOTIFICATION_EMAIL],
            subject: `[PDFMinty Feedback] ${ratingRaw} Star Rating`,
            html: payloadHtml,
            reply_to: emailRaw || undefined,
          }),
        });

        if (emailResponse.ok) {
          emailSent = true;
        } else {
          const errText = await emailResponse.text();
          console.error('Resend Feedback API failed:', errText);
        }
      } catch (emailError) {
        console.error('Resend delivery exception:', emailError);
      }
    }

    // Fallback: Store feedback in KV under feedback_submissions:{uuid}
    if (!emailSent && env.RATELIMIT_KV) {
      try {
        const storageKey = `feedback_submissions:${submissionId}`;
        await env.RATELIMIT_KV.put(
          storageKey,
          JSON.stringify({
            id: submissionId,
            rating: ratingRaw,
            comment,
            email: emailRaw,
            timestamp: new Date().toISOString(),
          }),
          { expirationTtl: 30 * 86400 } // 30 days
        );
      } catch (kvStoreError) {
        console.error('KV feedback storage failure:', kvStoreError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Thank you! Your feedback helps make PDFMinty better.',
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
    console.error('Feedback exception:', err);
    return new Response(
      JSON.stringify({
        error: 'Something went wrong. Please try again later.',
      }),
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
