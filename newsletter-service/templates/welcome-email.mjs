export const welcomeHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Welcome to the Weekly Wizard</title></head>
<body style="margin:0;padding:0;background-color:#f3effa;color:#29243c;font-family:Arial,Helvetica,sans-serif;">
<div style="display:none;font-size:1px;color:#f3effa;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">Free nonprofit know-how, a helpful first article, and a real person to talk to.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3effa;"><tr><td align="center" style="padding:24px 12px;">
<!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background-color:#ffffff;border:1px solid #e4dcef;">
<tr><td align="center" style="padding:15px 20px;background-color:#fff1c7;color:#302050;font-size:14px;line-height:22px;">
Free consultation &amp; advice with <strong>Shai</strong><br>
<a href="tel:+15612121192" style="color:#4b34b8;font-size:24px;line-height:32px;font-weight:bold;text-decoration:underline;">561-212-1192</a>
</td></tr>
<tr><td style="padding:28px 28px 25px;background-color:#1d1646;">
<p style="margin:0 0 12px;color:#ffd875;font-size:12px;line-height:18px;font-weight:bold;letter-spacing:2px;">NONPROFIT WIZARD</p>
<h1 style="margin:0 0 10px;color:#ffffff;font-family:Georgia,'Times New Roman',serif;font-size:38px;line-height:44px;font-weight:bold;">The Weekly Wizard</h1>
<p style="margin:0;color:#e4dcff;font-size:17px;line-height:26px;">A little nonprofit know-how.<br>A clearer next step.</p>
</td></tr>
<tr><td style="background-color:#1d1646;">
<a href="https://nonprofitwizard.org/" style="text-decoration:none;"><img src="https://nonprofitwizard.org/assets/hero.jpg" width="600" alt="A friendly wizard helping community organizations take their first steps" border="0" style="display:block;width:100%;max-width:600px;height:auto;"></a>
</td></tr>
<tr><td style="padding:30px 28px 12px;">
<h2 style="margin:0 0 16px;color:#302050;font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:35px;">Welcome. Your good idea belongs here.</h2>
<p style="margin:0 0 18px;font-size:16px;line-height:26px;">Thank you for joining our free weekly educational articles about starting and running a nonprofit. We help you understand the steps, ask useful questions, and move forward at your own pace.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:22px;background-color:#f4efff;border-left:4px solid #7654ca;">
<p style="margin:0 0 8px;color:#6344aa;font-size:12px;line-height:18px;font-weight:bold;letter-spacing:1px;">YOUR FIRST READ</p>
<h3 style="margin:0 0 12px;color:#302050;font-family:Georgia,'Times New Roman',serif;font-size:23px;line-height:30px;">Before You Start a Nonprofit: Seven Decisions to Make</h3>
<p style="margin:0 0 18px;font-size:15px;line-height:24px;">Start with your purpose, the people you will serve, your board, your budget, and a manageable first program.</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="#f3bc45" style="border-radius:8px;"><a href="https://nonprofitwizard.org/article-before-you-start.html" style="display:inline-block;padding:13px 20px;border:1px solid #f3bc45;border-radius:8px;color:#2a1d05;font-size:15px;line-height:20px;font-weight:bold;text-decoration:none;">Read the first article &rarr;</a></td></tr></table>
</td></tr></table>
</td></tr>
<tr><td style="padding:18px 28px 30px;">
<h2 style="margin:0 0 12px;color:#302050;font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:31px;">A real person. A helpful conversation.</h2>
<p style="margin:0 0 16px;font-size:16px;line-height:26px;">Shai leads our consultations. He has over 20 years of experience and has helped thousands of people start their own nonprofits.</p>
<p style="margin:0 0 16px;font-size:16px;line-height:26px;">For free consultation and advice, call <a href="tel:+15612121192" style="color:#4b34b8;font-weight:bold;">561-212-1192</a>, or <a href="https://nonprofitwizard.org/#contact" style="color:#4b34b8;font-weight:bold;">request a callback</a>. Someone will get back to you within a few hours. No purchase is required.</p>
<p style="margin:0;font-size:15px;line-height:24px;"><a href="https://nonprofitwizard.org/#learn" style="color:#4b34b8;">Explore the free learning library</a></p>
</td></tr>
<tr><td align="center" style="padding:24px;background-color:#1d1646;color:#e4dcff;font-size:12px;line-height:20px;">
<p style="margin:0 0 12px;font-weight:bold;color:#ffd875;">A nonprofit helping nonprofits</p>
<p style="margin:0 0 12px;">Nonprofit Wizard, a program of Benny Labs Foundation Inc.<br>6772 Palmetto Cir S 201, Boca Raton, FL 33433</p>
<p style="margin:0 0 12px;">You received this email because you joined our free article list.<br>To unsubscribe, reply with &ldquo;Unsubscribe&rdquo; or <a href="mailto:bennygoldstein@msn.com?subject=Unsubscribe%20from%20Nonprofit%20Wizard" style="color:#ffd875;">email us to unsubscribe</a>.</p>
<p style="margin:0;"><a href="https://nonprofitwizard.org/privacy.html" style="color:#ffd875;">Privacy &amp; email choices</a> &nbsp;&middot;&nbsp; <a href="https://nonprofitwizard.org/" style="color:#ffd875;">Visit Nonprofit Wizard</a></p>
</td></tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr></table>
</body></html>`;


function swap(src, from, to) { if (!src.includes(from)) throw new Error('template changed: ' + from.slice(0, 40)); return src.replace(from, to); }
const kitButton = '<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="#f3bc45" style="border-radius:8px;"><a href="https://nonprofitwizard.org/nonprofit-startup-kit.html" style="display:inline-block;padding:13px 20px;border:1px solid #f3bc45;border-radius:8px;color:#2a1d05;font-size:15px;line-height:20px;font-weight:bold;text-decoration:none;">Open your Startup Kit &rarr;</a></td></tr></table><p style="margin:14px 0 0;font-size:15px;line-height:24px;"><a href="https://nonprofitwizard.org/assets/Nonprofit-Startup-Kit.pdf" style="color:#4b34b8;font-weight:bold;">Download the PDF</a></p>';
let k = welcomeHtml;
k = swap(k, 'Welcome to the Weekly Wizard</title>', 'Your free Nonprofit Startup Kit</title>');
k = swap(k, 'YOUR FIRST READ', 'YOUR FREE STARTUP KIT');
k = swap(k, 'Before You Start a Nonprofit: Seven Decisions to Make</h3>', 'The Nonprofit Startup Kit: from idea to 501(c)(3)</h3>');
k = swap(k, 'Start with your purpose, the people you will serve, your board, your budget, and a manageable first program.', 'A printable checklist and workbook covering your mission, name, incorporation, board, bylaws, EIN, IRS application, state registrations, and annual filings.');
const btnRe = /<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="#f3bc45"[\s\S]*?<\/table>/;
if (!btnRe.test(k)) throw new Error('template changed: button');
k = k.replace(btnRe, kitButton);
export const kitHtml = k;
