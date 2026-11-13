import { describe, it, expect } from 'vitest';

import { normalizeClientIp, checkRateLimit } from '../utils/rate-limiter';

describe('Rate Limiter Utility', () => {
  describe('normalizeClientIp', () => {
    it('normalizes standard IPv4 addresses', () => {
      expect(normalizeClientIp('192.168.1.1')).toBe('192.168.1.1');
      expect(normalizeClientIp(' 10.0.0.1 ')).toBe('10.0.0.1');
    });

    it('truncates IPv6 addresses to canonical zero-padded /64 routing prefix to block rotating subnet abuse', () => {
      const ipv6A = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
      const ipv6B = '2001:0db8:85a3:0000:ffff:8a2e:0370:9999';
      expect(normalizeClientIp(ipv6A)).toBe('2001:0db8:85a3:0000');
      expect(normalizeClientIp(ipv6B)).toBe('2001:0db8:85a3:0000');
      // Compressed :: addresses in the same /64 subnet must normalize to identical zero-padded prefix
      expect(normalizeClientIp('2001:db8::1')).toBe('2001:0db8:0000:0000');
      expect(normalizeClientIp('2001:db8::9999')).toBe('2001:0db8:0000:0000');
    });

    it('canonicalizes compressed, expanded, uppercase, bracketed, and zone-indexed equivalent IPv6 addresses to identical /64 key', () => {
      const canonicalPrefix = '2001:0db8:0001:0000';
      const variants = [
        '2001:db8:1::1',
        '2001:0db8:0001::1',
        '2001:db8:1:0::1',
        '2001:0db8:0001:0000:0000:0000:0000:0001',
        '2001:DB8:1:0:DEAD:BEEF:CAFE:9999',
        '[2001:db8:1::abcd]',
        '2001:db8:001:0000:1234:5678:9abc:def0%eth0',
        '[2001:0DB8:0001:0::1]%en0',
      ];
      for (const variant of variants) {
        expect(normalizeClientIp(variant)).toBe(canonicalPrefix);
      }
    });

    it('canonicalizes leading ::, trailing ::, loopback ::1, and IPv4-mapped IPv6 addresses', () => {
      expect(normalizeClientIp('::1')).toBe('0000:0000:0000:0000');
      expect(normalizeClientIp('0:0:0:0:0:0:0:1')).toBe('0000:0000:0000:0000');
      expect(normalizeClientIp('::')).toBe('0000:0000:0000:0000');
      expect(normalizeClientIp('2001:db8:a:b::')).toBe('2001:0db8:000a:000b');
      expect(normalizeClientIp('2001:0db8:000a:000b:0000:0000:0000:0000')).toBe('2001:0db8:000a:000b');
      // IPv4-mapped IPv6 address (::ffff:192.0.2.128 -> 0000:0000:0000:0000:0000:ffff:c000:0280)
      expect(normalizeClientIp('::ffff:192.0.2.128')).toBe('0000:0000:0000:0000');
      expect(normalizeClientIp('2001:db8:1:2::192.0.2.33')).toBe('2001:0db8:0001:0002');
    });

    it('handles empty, missing, or malformed IPv6 client IPs safely', () => {
      expect(normalizeClientIp('')).toBe('unknown-client');
      expect(normalizeClientIp('unknown-ip')).toBe('unknown-client');
      expect(normalizeClientIp('2001:db8::1::2')).toBe('unknown-client');
      expect(normalizeClientIp('2001:db8:12345::1')).toBe('unknown-client');
      expect(normalizeClientIp('2001:db8:zzzz::1')).toBe('unknown-client');
      expect(normalizeClientIp('1:2:3:4:5:6:7:8:9')).toBe('unknown-client');
    });
  });

  describe('checkRateLimit without KV (Signed Edge State & Burst Protection)', () => {
    it('allows initial requests under limit and returns rate limit headers', async () => {
      const request = new Request('https://pdfminty.com/api/gemini-proxy', {
        method: 'POST',
        headers: {
          'cf-connecting-ip': '203.0.113.10',
        },
      });

      const result = await checkRateLimit({
        request,
        scope: 'test-ai',
        limit: 5,
        windowSec: 3600,
        burstLimit: 10,
      });

      expect(result.allowed).toBe(true);
      expect(result.currentCount).toBe(1);
      expect(result.remaining).toBe(4);
      expect(result.limit).toBe(5);
      expect(result.responseHeaders['X-RateLimit-Limit']).toBe('5');
      expect(result.responseHeaders['X-RateLimit-Remaining']).toBe('4');
      expect(result.responseHeaders['Set-Cookie']).toBeDefined();
      expect(result.responseHeaders['Set-Cookie']).toContain('__cf_rl_test-ai=');
    });

    it('persists count across requests using signed cookie when KV is absent', async () => {
      const ip = '203.0.113.20';
      const secret = 'custom_test_secret_123';

      // 1st request
      const req1 = new Request('https://pdfminty.com/api/gemini-proxy', {
        headers: { 'cf-connecting-ip': ip },
      });
      const res1 = await checkRateLimit({
        request: req1,
        scope: 'test-cookie',
        limit: 2,
        windowSec: 3600,
        burstLimit: 10,
        secret,
      });
      expect(res1.allowed).toBe(true);
      expect(res1.currentCount).toBe(1);

      // Extract cookie from Set-Cookie header
      const setCookie = res1.responseHeaders['Set-Cookie'];
      const cookieValue = setCookie.split(';')[0]; // e.g. "__cf_rl_test-cookie=1.12345.sig"

      // 2nd request with the cookie attached
      const req2 = new Request('https://pdfminty.com/api/gemini-proxy', {
        headers: {
          'cf-connecting-ip': ip,
          Cookie: cookieValue,
        },
      });
      const res2 = await checkRateLimit({
        request: req2,
        scope: 'test-cookie',
        limit: 2,
        windowSec: 3600,
        burstLimit: 10,
        secret,
      });
      expect(res2.allowed).toBe(true);
      expect(res2.currentCount).toBe(2);
      expect(res2.remaining).toBe(0);

      // Extract updated cookie
      const cookieValue2 = res2.responseHeaders['Set-Cookie'].split(';')[0];

      // 3rd request should be blocked (limit is 2)
      const req3 = new Request('https://pdfminty.com/api/gemini-proxy', {
        headers: {
          'cf-connecting-ip': ip,
          Cookie: cookieValue2,
        },
      });
      const res3 = await checkRateLimit({
        request: req3,
        scope: 'test-cookie',
        limit: 2,
        windowSec: 3600,
        burstLimit: 10,
        secret,
      });
      expect(res3.allowed).toBe(false);
      expect(res3.remaining).toBe(0);
      expect(res3.responseHeaders['Retry-After']).toBeDefined();
    });

    it('rejects tampered cookies gracefully and resets count safely', async () => {
      const ip = '203.0.113.30';
      const secret = 'custom_test_secret_123';

      const tamperedCookie = '__cf_rl_tamper=1.9999999999.invalidhmacsignature';
      const req = new Request('https://pdfminty.com/api/gemini-proxy', {
        headers: {
          'cf-connecting-ip': ip,
          Cookie: tamperedCookie,
        },
      });

      const res = await checkRateLimit({
        request: req,
        scope: 'tamper',
        limit: 5,
        windowSec: 3600,
        burstLimit: 10,
        secret,
      });

      // Should not crash, and should start a fresh counter rather than accepting fraudulent values
      expect(res.allowed).toBe(true);
      expect(res.currentCount).toBe(1);
    });

    it('triggers burst protection on excessive rapid requests', async () => {
      const ip = '203.0.113.40';

      // Fire 4 requests with burstLimit: 3
      for (let i = 0; i < 3; i++) {
        const req = new Request('https://pdfminty.com/api/test', {
          headers: { 'cf-connecting-ip': ip },
        });
        const res = await checkRateLimit({
          request: req,
          scope: 'test-burst',
          limit: 100,
          windowSec: 3600,
          burstLimit: 3,
          burstWindowSec: 5,
        });
        expect(res.allowed).toBe(true);
      }

      // 4th request exceeds burstLimit (3)
      const reqBlocked = new Request('https://pdfminty.com/api/test', {
        headers: { 'cf-connecting-ip': ip },
      });
      const resBlocked = await checkRateLimit({
        request: reqBlocked,
        scope: 'test-burst',
        limit: 100,
        windowSec: 3600,
        burstLimit: 3,
        burstWindowSec: 5,
      });

      expect(resBlocked.allowed).toBe(false);
      expect(resBlocked.error).toContain('Too many rapid requests');
      expect(resBlocked.responseHeaders['Retry-After']).toBeDefined();
    });
  });

  describe('checkRateLimit with KV Mock', () => {
    it('uses KV when available and enforces limit correctly', async () => {
      const kvStore = new Map<string, string>();
      const mockKv: unknown = {
        get: async (key: string) => kvStore.get(key) || null,
        put: async (key: string, val: string) => {
          kvStore.set(key, val);
        },
        delete: async (key: string) => {
          kvStore.delete(key);
        },
      };

      const ip = '203.0.113.50';
      for (let i = 1; i <= 3; i++) {
        const req = new Request('https://pdfminty.com/api/gemini-proxy', {
          headers: { 'cf-connecting-ip': ip },
        });
        const res = await checkRateLimit({
          request: req,
          kv: mockKv as KVNamespace,
          scope: 'kv-test',
          limit: 3,
          windowSec: 3600,
          burstLimit: 10,
        });

        expect(res.allowed).toBe(true);
        expect(res.currentCount).toBe(i);
      }

      // 4th request hits limit in KV
      const reqBlocked = new Request('https://pdfminty.com/api/gemini-proxy', {
        headers: { 'cf-connecting-ip': ip },
      });
      const resBlocked = await checkRateLimit({
        request: reqBlocked,
        kv: mockKv as KVNamespace,
        scope: 'kv-test',
        limit: 3,
        windowSec: 3600,
        burstLimit: 10,
      });

      expect(resBlocked.allowed).toBe(false);
      expect(resBlocked.currentCount).toBe(3);
      expect(resBlocked.remaining).toBe(0);
      expect(resBlocked.error).toContain('Rate limit exceeded');
    });

    it('enforces a single shared rate-limit bucket across compressed and expanded IPv6 addresses in the same /64 subnet', async () => {
      const kvStore = new Map<string, string>();
      const mockKv: unknown = {
        get: async (key: string) => kvStore.get(key) || null,
        put: async (key: string, val: string) => {
          kvStore.set(key, val);
        },
        delete: async (key: string) => {
          kvStore.delete(key);
        },
      };

      const subnetVariants = [
        '2001:db8:1::1',
        '2001:0db8:0001:0000:0000:0000:0000:0001',
        '2001:DB8:1:0:dead:beef:cafe:9999',
      ];

      // First 2 requests with different notations of the same /64 subnet succeed (limit: 2)
      const res1 = await checkRateLimit({
        request: new Request('https://pdfminty.com/api/gemini-proxy', {
          headers: { 'cf-connecting-ip': subnetVariants[0] },
        }),
        kv: mockKv as KVNamespace,
        scope: 'ipv6-subnet-kv',
        limit: 2,
        windowSec: 3600,
        burstLimit: 10,
      });
      expect(res1.allowed).toBe(true);
      expect(res1.currentCount).toBe(1);

      const res2 = await checkRateLimit({
        request: new Request('https://pdfminty.com/api/gemini-proxy', {
          headers: { 'cf-connecting-ip': subnetVariants[1] },
        }),
        kv: mockKv as KVNamespace,
        scope: 'ipv6-subnet-kv',
        limit: 2,
        windowSec: 3600,
        burstLimit: 10,
      });
      expect(res2.allowed).toBe(true);
      expect(res2.currentCount).toBe(2);

      // 3rd request from another address/notation in the same /64 subnet is blocked
      const res3 = await checkRateLimit({
        request: new Request('https://pdfminty.com/api/gemini-proxy', {
          headers: { 'cf-connecting-ip': subnetVariants[2] },
        }),
        kv: mockKv as KVNamespace,
        scope: 'ipv6-subnet-kv',
        limit: 2,
        windowSec: 3600,
        burstLimit: 10,
      });
      expect(res3.allowed).toBe(false);
      expect(res3.remaining).toBe(0);
      expect(kvStore.size).toBe(1);
      expect(Array.from(kvStore.keys())[0]).toContain('2001:0db8:0001:0000');
    });
  });
});
