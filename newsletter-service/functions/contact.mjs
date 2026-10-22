import { createHash } from 'node:crypto';

const origins = new Set(['https://nonprofitwizard.org', 'https://www.nonprofitwizard.org']);
const recipients = ['pobox50@gmail.com', 'bennygoldstein@msn.com'];
const limits = { full_name: 160, phone: 160, email: 254, state: 160, org_name: 160, mission: 3000, notes: 3000, wizard_transcript: 6000, source: 100, type: 20 };
const emailPattern = /^[^\s@<>\r\n]+@[^\s@<>\r\n]+\.[^\s@<>\r\n]+$/;

export const config = { rateLimit: { windowLimit: 5, windowSize: 60, aggregateBy: ['ip', 'domain'] } };

function reply(status, body, origin) {
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', Vary: 'Origin' };
  if (origins.has(origin)) Object.assign(headers, {
    'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  return new Response(status === 204 ? null : JSON.stringify(body), { status, headers });
}

export default async function handler(request) {
  const origin = request.headers.get('origin') || '';
  if (!origins.has(origin)) return reply(403, { ok: false }, origin);
  if (request.method === 'OPTIONS') return reply(204, null, origin);
  if (request.method !== 'POST') return reply(405, { ok: false }, origin);
  let input;
  try {
    const raw = await request.text();
    if (raw.length > 20000) return reply(413, { ok: false }, origin);
    input = JSON.parse(raw);
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid input');
  } catch { return reply(400, { ok: false }, origin); }
  if (input.website) return reply(400, { ok: false }, origin);
  const data = {};
  for (const [field, max] of Object.entries(limits)) {
    if (input[field] != null && typeof input[field] !== 'string') return reply(400, { ok: false }, origin);
    data[field] = (input[field] || '').trim();
    if (data[field].length > max) return reply(400, { ok: false }, origin);
  }
  const isQuestion = data.type === 'question';
  data.type = isQuestion ? 'question' : 'consultation';
  const digits = data.phone.replace(/\D/g, '');
  const badPhone = isQuestion ? (digits.length > 0 && (digits.length < 7 || digits.length > 15)) : (digits.length < 7 || digits.length > 15);
  if (!data.full_name || /[\r\n]/.test(data.full_name) || badPhone || (data.email && !emailPattern.test(data.email))) {
    return reply(400, { ok: false, message: isQuestion
      ? 'Please enter your name, your question, and a valid email or phone number if you include one.'
      : 'Please enter your name, a valid callback number, and a valid email if you include one.' }, origin);
  }
  if (isQuestion && data.mission.length < 5) {
    return reply(400, { ok: false, message: 'Please type your question.' }, origin);
  }
  const site = process.env.URL, key = process.env.RESEND_API_KEY, from = process.env.NEWSLETTER_FROM;
  try {
    if (!site || !new URL(site).hostname.endsWith('.netlify.app') || !key || !from) throw new Error('Not configured');
  } catch { return reply(503, { ok: false }, origin); }

  const reference = createHash('sha256').update(JSON.stringify(data)).digest('hex');
  try {
    const saved = await fetch(new URL('/', site), {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ 'form-name': 'nw-consultation', 'bot-field': '', ...data,
        reference, submitted_at: new Date().toISOString() }), signal: AbortSignal.timeout(12000)
    });
    if (!saved.ok) throw new Error('Storage failed');
    const text = isQuestion
      ? `NONPROFIT WIZARD — QUESTION FROM THE WEBSITE\n\nName: ${data.full_name}\nEmail: ${data.email || 'Not provided'}\nPhone: ${data.phone || 'Not provided'}\n\nQuestion:\n${data.mission}\n\nSource: ${data.source || 'Website'}\nReference: ${reference.slice(0, 12)}\n\n${data.email || data.phone ? 'Please reply within a few hours.' : 'No contact details were left, so this cannot be answered personally; consider it for a weekly article.'} Common questions become weekly articles. This message does not subscribe the visitor to the newsletter.`
      : `NONPROFIT WIZARD — FREE CONSULTATION REQUEST\n\nName: ${data.full_name}\nCallback number: ${data.phone}\nEmail: ${data.email || 'Not provided'}\nState: ${data.state || 'Not provided'}\nNonprofit / working name: ${data.org_name || 'Not provided'}\n\nIdea or question:\n${data.mission || 'Not provided'}\n\nBest time to call / notes:\n${data.notes || 'Not provided'}\n\nSource: ${data.source || 'Website'}\n${data.wizard_transcript ? '\nOptional Wizard conversation:\n' + data.wizard_transcript + '\n' : ''}\nReference: ${reference.slice(0, 12)}\n\nPlease respond within a few hours. This request does not subscribe the visitor to the newsletter.`;
    const sent = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json',
        'Idempotency-Key': 'nw-consultation-' + reference },
      body: JSON.stringify({ from, to: recipients, ...(data.email ? { reply_to: data.email } : {}),
        subject: isQuestion ? `Nonprofit Wizard — QUESTION from ${data.full_name}` : `Nonprofit Wizard — callback request: ${data.full_name}`, text }),
      signal: AbortSignal.timeout(12000)
    });
    if (!sent.ok) throw new Error('Email not accepted');
  } catch {
    return reply(502, { ok: false, message: 'We could not confirm that your request was sent. Please try again or call Shai at 561-212-1192.' }, origin);
  }
  return reply(200, { ok: true, message: isQuestion
    ? 'Thank you. Your question has reached our team. A real person will reply within a few hours, and common questions become our weekly articles.'
    : 'Thank you. Your request has been sent to our team. Someone will get back to you within a few hours for your free consultation.' }, origin);
}
