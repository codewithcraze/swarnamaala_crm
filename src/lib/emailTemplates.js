// Starter email templates. Email clients ignore <style> blocks and modern
// CSS, so everything is table-based with inline styles.
const SITE = import.meta.env.VITE_SITE_URL || "https://www.swarnamaala.in";
const GOLD = "#b8860b";

const shell = (inner) => `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Swarnamaala</title>
</head>
<body style="margin:0;padding:0;background:#f6f4ef">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f4ef">
  <tr><td align="center" style="padding:24px 12px">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden">
      <tr><td style="background:#111111;padding:20px 28px;text-align:center">
        <a href="${SITE}" style="color:${GOLD};font:bold 22px Georgia,serif;text-decoration:none;letter-spacing:1px">SWARNAMAALA</a>
      </td></tr>
${inner}
      <tr><td style="padding:20px 28px;background:#faf8f3;text-align:center;font:12px/1.6 Arial,sans-serif;color:#888888">
        Swarnamaala · Custom photo magnets made in India<br>
        <a href="${SITE}" style="color:#888888">swarnamaala.in</a> · <a href="{{unsubscribe_url}}" style="color:#888888">Unsubscribe</a>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

const button = (label, href) => `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto"><tr>
  <td style="background:${GOLD};border-radius:8px">
    <a href="${href}" style="display:inline-block;padding:14px 28px;font:bold 16px Arial,sans-serif;color:#ffffff;text-decoration:none">${label}</a>
  </td></tr></table>`;

export const BUTTON_SNIPPET = button("Shop now", `${SITE}/products/custom-magnets`);

export const imageSnippet = (url) =>
  `<img src="${url}" width="600" alt="" style="display:block;width:100%;max-width:600px;height:auto;border:0">`;

export const TEMPLATES = [
  {
    id: "announcement",
    name: "Announcement",
    description: "Hero image, headline, short text and a button",
    subject: "Something new at Swarnamaala",
    html: shell(`      <tr><td><img src="${SITE}/showcase.jpg" width="600" alt="Custom photo magnets" style="display:block;width:100%;max-width:600px;height:auto;border:0"></td></tr>
      <tr><td style="padding:32px 28px 8px;font:16px/1.6 Arial,sans-serif;color:#333333">
        <h1 style="margin:0 0 12px;font:bold 26px/1.3 Georgia,serif;color:#111111">Your memories, on your fridge</h1>
        <p style="margin:0 0 12px">Hi {{first_name}},</p>
        <p style="margin:0">Write your news here. Keep it to two or three short sentences.</p>
        ${button("Make your magnets", `${SITE}/products/custom-magnets`)}
      </td></tr>`),
  },
  {
    id: "offer",
    name: "Offer",
    description: "Big offer banner with code and pack prices",
    subject: "A little something for you, {{first_name}}",
    html: shell(`      <tr><td style="background:${GOLD};padding:36px 28px;text-align:center;color:#ffffff">
        <div style="font:14px Arial,sans-serif;letter-spacing:2px;text-transform:uppercase">Limited offer</div>
        <div style="font:bold 40px/1.2 Georgia,serif;margin:8px 0">Write the offer here</div>
        <div style="font:16px Arial,sans-serif">Use code <b style="background:#ffffff;color:${GOLD};padding:4px 10px;border-radius:4px">CODE</b> at checkout</div>
      </td></tr>
      <tr><td style="padding:28px;font:16px/1.6 Arial,sans-serif;color:#333333">
        <p style="margin:0 0 16px">Hi {{first_name}},</p>
        <p style="margin:0 0 20px">Turn your favourite photos into premium fridge magnets.</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="text-align:center;font:14px Arial,sans-serif">
          <tr>
            <td style="padding:12px;border:1px solid #eee;border-radius:8px"><b style="font-size:20px">₹299</b><br>6 magnets</td>
            <td width="8"></td>
            <td style="padding:12px;border:1px solid #eee;border-radius:8px"><b style="font-size:20px">₹499</b><br>12 magnets</td>
            <td width="8"></td>
            <td style="padding:12px;border:1px solid #eee;border-radius:8px"><b style="font-size:20px">₹699</b><br>18 magnets</td>
          </tr>
        </table>
        ${button("Claim the offer", `${SITE}/products/custom-magnets`)}
      </td></tr>`),
  },
  {
    id: "letter",
    name: "Simple letter",
    description: "Plain, personal text email",
    subject: "A quick note from Swarnamaala",
    html: shell(`      <tr><td style="padding:32px 28px;font:16px/1.7 Arial,sans-serif;color:#333333">
        <p style="margin:0 0 14px">Hi {{first_name}},</p>
        <p style="margin:0 0 14px">Write your message here.</p>
        <p style="margin:0">Warmly,<br>Team Swarnamaala</p>
      </td></tr>`),
  },
];

export const PLACEHOLDERS = [
  { key: "{{first_name}}", label: "First name" },
  { key: "{{name}}", label: "Full name" },
  { key: "{{email}}", label: "Email" },
  { key: "{{site_url}}", label: "Site URL" },
  { key: "{{unsubscribe_url}}", label: "Unsubscribe link" },
];

// Fill placeholders with sample values for the live preview.
export function previewHtml(html, sample = { name: "Priya Sharma", email: "priya@example.com" }) {
  const values = {
    name: sample.name,
    first_name: sample.name.split(/\s+/)[0],
    email: sample.email,
    site_url: SITE,
    unsubscribe_url: "#unsubscribe",
  };
  return String(html || "").replace(/\{\{\s*(\w+)\s*\}\}/g, (m, k) => values[k] ?? m);
}
