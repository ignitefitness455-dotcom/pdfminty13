/**
 * Disposable & Temporary Email Blocker for PDFMinty
 * Prevents account creation using disposable, throwaway, or burner email addresses.
 */

// Allowlist of well-known trusted email providers & TLDs to avoid any false positives
const ALLOWED_MAJOR_DOMAINS = new Set<string>([
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'passport.com',
  'yahoo.com',
  'ymail.com',
  'rocketmail.com',
  'yahoo.co.uk',
  'yahoo.co.in',
  'yahoo.fr',
  'yahoo.ca',
  'yahoo.com.br',
  'yahoo.co.jp',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'aim.com',
  'zoho.com',
  'zohomail.com',
  'proton.me',
  'protonmail.com',
  'protonmail.ch',
  'pm.me',
  'tuta.com',
  'tutanota.com',
  'tutanota.de',
  'mail.com',
  'email.com',
  'gmx.com',
  'gmx.net',
  'gmx.de',
  'yandex.com',
  'yandex.ru',
  'ya.ru',
  'fastmail.com',
  'fastmail.fm',
  'hushmail.com',
  'hey.com',
]);

// Comprehensive set of known disposable, burner, and temporary email domains
const DISPOSABLE_DOMAINS = new Set<string>([
  // Common global temp-mail providers
  'mailinator.com',
  'mailinator.net',
  'mailinator2.com',
  'mailin8r.com',
  'notmailinator.com',
  'tempmail.com',
  'temp-mail.org',
  'temp-mail.io',
  'temp-mail.net',
  'temp-mails.com',
  'tempmail.net',
  'tempmail.ninja',
  'tempmail.dev',
  'tempmail.plus',
  'tempmail.alt',
  'tempmail.email',
  'tempmailaddress.com',
  'tempail.com',
  'tempm.com',
  '10minutemail.com',
  '10minutemail.net',
  '10minutemail.org',
  '10minemail.com',
  '20minutemail.com',
  'minutemailbox.com',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamail.biz',
  'guerrillamail.info',
  'guerrillamail.de',
  'guerrillamailblock.com',
  'sharklasers.com',
  'grr.la',
  'pokemail.net',
  'spam4.me',
  'throwawaymail.com',
  'throwawayemail.com',
  'throwawayemailaddress.com',
  'throwaway.email',
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
  'cool.fr.nf',
  'jetable.fr.nf',
  'courriel.fr.nf',
  'moncourrier.fr.nf',
  'monemail.fr.nf',
  'monmail.fr.nf',
  'trashmail.com',
  'trashmail.net',
  'trashmail.me',
  'trashmail.at',
  'trashmail.io',
  'trash-mail.com',
  'trashymail.com',
  'mytrashmail.com',
  'trashmail.club',
  'trashmail.app',
  'trashinbox.com',
  'getairmail.com',
  'dispostable.com',
  'fakeinbox.com',
  'fakemailgenerator.com',
  'fakemail.net',
  'fakemail.com',
  'emailfake.com',
  'emailfake.ml',
  'generator.email',
  'inboxkitten.com',
  'dropmail.me',
  'mohmal.com',
  'mohmal.in',
  'mohmal.im',
  'crazymailing.com',
  'crazymail.com',
  'getnada.com',
  'nada.ltd',
  'nada.email',
  'abacusmail.com',
  'emailondeck.com',
  'burnermail.io',
  'burnermail.com',
  'burner.email',
  'mytemp.email',
  'mytempemail.com',
  'maildrop.cc',
  'harakirimail.com',
  'mailnesia.com',
  'deadaddress.com',
  'instant-email.org',
  'mintemail.com',
  'discard.email',
  'discardmail.com',
  'spambog.com',
  'mailcatch.com',
  'mailnull.com',
  'spamgourmet.com',
  'meltmail.com',
  'tempinbox.com',
  'zillamail.com',
  'boun.cr',
  'mailscrap.com',
  'wegwerfmail.de',
  'wegwerfmail.net',
  'spambox.us',
  'jetable.org',
  'kasmail.com',
  'armyspy.com',
  'cuvox.de',
  'dayrep.com',
  'einrot.com',
  'fleckens.hu',
  'gustr.com',
  'jourrapide.com',
  'rhyta.com',
  'superrito.com',
  'teleworm.us',
  'inoutmail.de',
  'tempr.email',
  'mailseal.de',
  'tmailor.com',
  'emailtemporal.org',
  'tempmailo.com',
  'disposablemail.com',
  'disposable-email.ml',
  'disposable-mail.com',
  'disposableaddress.com',
  'tempmailer.com',
  'tempmailer.net',
  'mailtemp.net',
  'incognitoid.com',
  'mailsac.com',
  'anonbox.net',
  'emailthe.net',
  'anonymbox.com',
  'antichef.com',
  'antichef.net',
  'binkmail.com',
  'bobmail.info',
  'chacuo.net',
  'despam.it',
  'drdrb.net',
  'emailmiser.com',
  'front14.org',
  'ghostlymail.com',
  'hatespam.org',
  'hidemail.de',
  'instantmail.fr',
  'mailforspam.com',
  'mailmoat.com',
  'mailquack.com',
  'no-spam.ws',
  'nospam.ze.tc',
  'oneoffmail.com',
  'pookmail.com',
  'safetymail.info',
  'sogetthis.com',
  'soodonims.com',
  'spamfree24.org',
  'spaml.de',
  'spammotel.com',
  'suremail.info',
  'whyspam.me',
  'zippymail.info',
  'moakt.com',
  'moakt.ws',
  'moakt.co',
  'temporaryemail.org',
  'fake-box.com',
  'internxt.com',
  'tmpmail.org',
  'tmpmail.net',
  'tmpbox.net',
  'emlpro.com',
  'emlhub.com',
  '10mail.org',
  'mailpoof.com',
  'inboxbear.com',
  'quickmail.io',
  'mytempemail.net',
  'crazymailing.net',
  'dropmail.io',
  'burnermail.me',
]);

// Keyword patterns that strongly indicate disposable email services
const DISPOSABLE_KEYWORDS = [
  'tempmail',
  'throwaway',
  'fakeinbox',
  'disposable',
  'trashmail',
  'mailinator',
  'guerrillamail',
  '10minutemail',
  '20minutemail',
  'burnermail',
  'mohmal',
  'mytempemail',
  'wegwerfmail',
  'fakemail',
  'dropmail',
  'sharklaser',
  'inboxkitten',
  'emailondeck',
  'maildrop',
  'mailnesia',
  'tempinbox',
  'tmpmail',
  'tempm',
];

/**
 * Checks whether an email address originates from a temporary or disposable email service.
 */
export function isDisposableEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;

  const trimmed = email.trim().toLowerCase();
  const parts = trimmed.split('@');
  if (parts.length !== 2) return false;

  const domain = parts[1].trim();
  if (!domain) return false;

  // 1. If domain is a recognized major trustworthy email provider, allow immediately
  if (ALLOWED_MAJOR_DOMAINS.has(domain)) {
    return false;
  }

  // 1b. Allow standard educational and government domains
  if (
    domain.endsWith('.edu') ||
    domain.endsWith('.ac.uk') ||
    domain.endsWith('.edu.bd') ||
    domain.endsWith('.gov') ||
    domain.endsWith('.gov.bd') ||
    domain.endsWith('.mil')
  ) {
    return false;
  }

  // 2. Direct domain match
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return true;
  }

  // 3. Subdomain check (e.g. sub.mailinator.com)
  for (const known of DISPOSABLE_DOMAINS) {
    if (domain.endsWith('.' + known)) {
      return true;
    }
  }

  // 4. Keyword matching on host segment (excluding genuine email domains)
  const hostSegment = domain.split('.')[0] || '';
  for (const keyword of DISPOSABLE_KEYWORDS) {
    if (hostSegment.includes(keyword) || domain.includes(keyword)) {
      return true;
    }
  }

  return false;
}

/**
 * Basic email syntax validation
 */
export function isEmailSyntaxValid(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

/**
 * Returns localized error message if the email is disposable.
 */
export function getDisposableEmailError(email: string, isBn: boolean): string | null {
  if (isDisposableEmail(email)) {
    return isBn
      ? 'টেম্পোরারি বা ডিসপোজেবল ইমেইল দিয়ে অ্যাকাউন্ট তৈরি করা যাবে না। অনুগ্রহ করে একটি আসল জিমেইল বা পার্সোনাল ইমেইল ব্যবহার করুন।'
      : 'Temporary or disposable email addresses are not permitted. Please use a valid personal or business email address (e.g., Gmail, Outlook, Yahoo).';
  }
  return null;
}
