import { getCorsOrigin, getCorsHeaders } from '../utils/cors';

export const onRequest: PagesFunction = async (context) => {
  const { request } = context;
  const origin = getCorsOrigin(request);
  const corsHeaders = getCorsHeaders(origin, 'application/json', 'GET, OPTIONS');

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders as HeadersInit,
    });
  }

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed.' }), {
      status: 405,
      headers: {
        ...corsHeaders,
        Allow: 'GET, OPTIONS',
      } as HeadersInit,
    });
  }

  return new Response(
    JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: corsHeaders as HeadersInit,
    }
  );
};
