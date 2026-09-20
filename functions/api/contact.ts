import { getCorsOrigin, getCorsHeaders } from '../utils/cors';
import {
  sanitizeForStorage,
  sanitizeForHtml,
  isValidEmail,
  MAX_NAME_LENGTH,
  MAX_SUBJECT_LENGTH,
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
  const MAX_BODY_BYTES = 32 * 1024; // 32 KB (contact form data is small)
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
  const prefix = `rate_limit:contact:${ip}:${hourBlock}:`;
  const LIMIT_PER_HOUR = 3;

  if (env.RATELIMIT_KV) {
    try {
      const listed = await env.RATELIMIT_KV.list({ prefix, limit: LIMIT_PER_HOUR + 1 });
      if (listed.keys.length >= LIMIT_PER_HOUR) {
        return new Response(
          JSON.stringify({
            error:
              'Too many contact requests from this IP. Please wait an hour before trying again.',
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
      // Fail-open: log but allow the request through. We do NOT want to silently
      // reject legitimate contact submissions because of a transient KV issue.
    }
  }

  try {
    interface ContactPayload {
      name?: unknown;
      email?: unknown;
      subject?: unknown;
      message?: unknown;
    }
    const rawData = (await request.json()) as ContactPayload;
    // Strip CR/LF to prevent email header injection. sanitizeForStorage preserves
    // \r and \r\n because they're legal inside message bodies, but they MUST NOT
    // appear in any field that becomes an email header (subject, from, to).
    const name = sanitizeForStorage(typeof rawData.name === 'string' ? rawData.name : '').replace(/[\r\n]+/g, ' ').trim();
    const email = sanitizeForStorage(typeof rawData.email === 'string' ? rawData.email : '');
    const subject = sanitizeForStorage(typeof rawData.subject === 'string' ? rawData.subject : '').replace(/[\r\n]+/g, ' ').trim();
    const message = sanitizeForStorage(typeof rawData.message === 'string' ? rawData.message : '');

    // Validation
    const errors: Record<string, string> = {};

    if (!name) {
      errors.name = 'Name is required.';
    } else if (name.length > MAX_NAME_LENGTH) {
      errors.name = `Name cannot exceed ${MAX_NAME_LENGTH} characters.`;
    }

    if (!email) {
      errors.email = 'Email is required.';
    } else if (!isValidEmail(email)) {
      errors.email = 'Please provide a valid email address.';
    }

    if (!subject) {
      errors.subject = 'Subject is required.';
    } else if (subject.length > MAX_SUBJECT_LENGTH) {
      errors.subject = `Subject cannot exceed ${MAX_SUBJECT_LENGTH} characters.`;
    }

    if (!message) {
      errors.message = 'Message is required.';
    } else if (message.length > MAX_MESSAGE_LENGTH) {
      errors.message = `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters.`;
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
      <h3>New Contact Submission</h3>
      <p><b>ID:</b> ${submissionId}</p>
      <p><b>Name:</b> ${sanitizeForHtml(name)}</p>
      <p><b>Email:</b> ${sanitizeForHtml(email)}</p>
      <p><b>Subject:</b> ${sanitizeForHtml(subject)}</p>
      <p><b>Message:</b></p>
      <pre>${sanitizeForHtml(message)}</pre>
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
            subject: `[PDFMinty Contact] ${subject}`,
            html: payloadHtml,
            reply_to: email,
          }),
        });

        if (emailResponse.ok) {
          emailSent = true;
        } else {
          const errText = await emailResponse.text();
          console.error('Resend API failed:', errText);
        }
      } catch (emailError) {
        console.error('Resend delivery exception:', emailError);
      }
    }

    // Fallback: If email has not succeeded or wasn't configured, or just for persistence
    if (!emailSent && env.RATELIMIT_KV) {
      try {
        const storageKey = `contact_submissions:${submissionId}`;
        await env.RATELIMIT_KV.put(
          storageKey,
          JSON.stringify({
            id: submissionId,
            name,
            email,
            subject,
            message,
            timestamp: new Date().toISOString(),
          }),
          { expirationTtl: 30 * 86400 } // 30 days
        );
      } catch (kvStoreError) {
        console.error('KV fallback storage failure:', kvStoreError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Your message has been sent successfully!',
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
    console.error('Contact exception:', err);
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
