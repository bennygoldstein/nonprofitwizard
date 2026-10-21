import { createHash } from 'node:crypto';
import { welcomeHtml } from '../templates/welcome-email.mjs';

const allowedOrigins = new Set(['https://nonprofitwizard.org', 'https://www.nonprofitwizard.org']);
const emailPattern = /^[^\s@<>\r\n]+@[^\s@<>\r\n]+\.[^\s@<>\r\n]+$/;
const unsubscribe = 'mailto:bennygoldstein@msn.com?subject=Unsubscribe%20from%20Nonprofit%20Wizard';

export const config = {
  rateLimit: { windowLimit: 10, windowSize: 60, aggregateBy: ['ip', 'domain'] }
};

function response(status, body, origin) {
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', Vary: 'Origin' };
  if (allowedOrigins.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type';
  }
  return new Response(status === 204 ? null : JSON.stringify(body), { status, headers });
}

export default async function handler(request) {
  const origin = request.headers.get('origin') || '';
  if (!allowedOrigins.has(origin)) return response(403, { ok: false }, origin);
  if (request.method === 'OPTIONS') return response(204, null, origin);
  if (request.method !== 'POST') return response(405, { ok: false }, origin);

  let input;
  try {
    const text = await request.text();
    if (text.length > 4096) return response(413, { ok: false }, origin);
    input = JSON.parse(text);
  } catch { return response(400, { ok: false }, origin); }

  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  if (input.website) return response(400, { ok: false }, origin);
  if (!emailPattern.test(email) || email.length > 254 || input.consent !== true) {
    return response(400, { ok: false, message: 'Enter a valid email and choose to subscribe.' }, origin);
  }

  const site = process.env.URL;
  if (!site || new URL(site).hostname.endsWith('.netlify.app') === false) {
    return response(503, { ok: false }, origin);
  }

  try {
    const stored = await fetch(new URL('/', site), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        'form-name': 'nw-newsletter', email, consent: 'Yes — Nonprofit Wizard weekly educational articles',
        source: 'nonprofitwizard.org', subscribed_at: new Date().toISOString(), 'bot-field': ''
      }),
      signal: AbortSignal.timeout(12000)
    });
    if (!stored.ok) return response(502, { ok: false }, origin);
  } catch { return response(502, { ok: false }, origin); }

  let welcomeSent = false;
  const key = process.env.RESEND_API_KEY;
  const from = process.env.NEWSLETTER_FROM;
  if (key && from) {
    const subject = 'Welcome to the Weekly Wizard';
    const text = `Free consultation & advice with Shai: 561-212-1192\nShai leads our consultations. He has over 20 years of experience and has helped thousands of people start their own nonprofits.\n\nWelcome to Nonprofit Wizard!\n\nYou signed up for our free weekly educational articles about starting and running a nonprofit.\n\nStart with our first article: Before You Start a Nonprofit: Seven Decisions to Make\nhttps://nonprofitwizard.org/article-before-you-start.html\n\nNeed to talk through the steps? Request a free consultation:\nhttps://nonprofitwizard.org/#contact\nSomeone will get back to you within a few hours. No purchase is required.\n\nTo unsubscribe at any time, reply with "Unsubscribe" or email bennygoldstein@msn.com from the subscribed address.\n\nNonprofit Wizard, a program of Benny Labs Foundation Inc.\n6772 Palmetto Cir S 201, Boca Raton, FL 33433\nhttps://nonprofitwizard.org/privacy.html`;
    try {
      const sent = await fetch('https://api.resend.com/emails', {
        method: 'POST', headers: {
          Authorization: `Bearer ${key}`, 'Content-Type': 'application/json',
          'Idempotency-Key': 'nw-welcome-' + createHash('sha256').update(email).digest('hex')
        },
        body: JSON.stringify({ from, to: [email], reply_to: 'bennygoldstein@msn.com', subject, text, html: welcomeHtml,
          headers: { 'List-Unsubscribe': `<${unsubscribe}>` }
        }),
        signal: AbortSignal.timeout(12000)
      });
      welcomeSent = sent.ok;
      if (!sent.ok) console.warn('Newsletter welcome email was not accepted by provider:', sent.status);
    } catch { console.warn('Newsletter welcome email delivery could not be confirmed.'); }
  }
  return response(200, { ok: true, welcomeSent,
    message: "You're on the list. Watch your inbox for Nonprofit Wizard's weekly articles."
  }, origin);
}
