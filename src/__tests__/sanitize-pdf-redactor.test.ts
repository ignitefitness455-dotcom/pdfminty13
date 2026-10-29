import { describe, it, expect } from 'vitest';

import { detectPiiInTextItem, normalizeDigitsToAscii } from '../pages/SanitizePdfPage';

describe('Sanitize PDF — Privacy Shield PII Detection & Bengali Numeral Support', () => {
  it('normalizes Bengali (০-৯) and Devanagari (०-९) digits 1-to-1 to ASCII without changing string length', () => {
    const raw = 'মোবাইলঃ ০১৯৮৯-২৫০১৫৭ এবং তারিখ ১১/০৮/২০২৩ (०१२३४५६७८९)';
    const normalized = normalizeDigitsToAscii(raw);

    expect(normalized.length).toBe(raw.length);
    expect(normalized).toContain('01989-250157');
    expect(normalized).toContain('11/08/2023');
    expect(normalized).toContain('(0123456789)');
  });

  it('detects Bangladeshi phone numbers written in Bengali numerals with or without hyphens', () => {
    const entities = detectPiiInTextItem(
      'যোগাযোগ মোবাইল: ০১৯৮৯-২৫০১৫৭ অথবা +৮৮০ ১৭১২৩৪৫৬৭৮',
      1,
      50,
      700,
      300,
      14
    );

    const phones = entities.filter((e) => e.category === 'phone');
    expect(phones.length).toBe(2);
    expect(phones[0].text).toBe('০১৯৮৯-২৫০১৫৭');
    expect(phones[1].text).toBe('+৮৮০ ১৭১২৩৪৫৬৭৮');
    expect(phones[0].pageIndex).toBe(1);
    expect(phones[0].selected).toBe(true);
  });

  it('detects 10-digit, 13-digit, and 17-digit NID numbers in Bengali and English digits', () => {
    const entities = detectPiiInTextItem(
      'জাতীয় পরিচয় পত্র নং: ১৯৯০১২৩৪৫৬৭৮৯০১২৩ এবং স্মার্ট কার্ড ৮২৩৪৫৬৭৮৯০',
      0,
      40,
      500,
      360,
      12
    );

    const nids = entities.filter((e) => e.category === 'nid');
    expect(nids.length).toBe(2);
    expect(nids[0].text).toBe('১৯৯০১২৩৪৫৬৭৮৯০১২৩');
    expect(nids[1].text).toBe('৮২৩৪৫৬৭৮৯০');
  });

  it('detects credit cards, emails, and bearer secrets in selectable text', () => {
    const entities = detectPiiInTextItem(
      'Card: 4532 0151 1283 0366, Email: user@pdfminty.com, Token: sk-1234567890abcdefghijkl',
      2,
      30,
      400,
      400,
      12
    );

    expect(entities.some((e) => e.category === 'card' && e.text === '4532 0151 1283 0366')).toBe(
      true
    );
    expect(entities.some((e) => e.category === 'email' && e.text === 'user@pdfminty.com')).toBe(
      true
    );
    expect(
      entities.some((e) => e.category === 'secret' && e.text === 'sk-1234567890abcdefghijkl')
    ).toBe(true);
  });
});
