# Getting Started with Bakong KHQR: Generate, Display, and Check a Payment

A beginner's guide to generating your first Bakong KHQR code and confirming when it's paid.

This guide covers **only the Individual-KHQR flow** — the goal is a working test page that shows a scannable KHQR code and tells you when it's been paid. It does not cover Merchant KHQR, production go-live, or batch status checks (those are follow-up guides).

> **Official reference:** This guide is a simplified teaching companion, not a replacement for the National Bank of Cambodia's own documentation. Before implementing anything for real, check the [Bakong Open API Document](https://bakong.nbc.gov.kh/download/KHQR/integration/Bakong%20Open%20API%20Document.pdf) and [KHQR SDK Document](https://bakong.nbc.gov.kh/download/KHQR/integration/KHQR%20SDK%20Document.pdf) for current field names and endpoint URLs — those details can change without notice, and this guide may lag behind them.

---

## 1. What You're Building

By the end of this guide, you'll have a simple web page that:

1. **Generates a KHQR code** — an EMVCo-format string that any Bakong-participating banking app can scan and pay
2. **Renders it as a scannable image** — the generated value is just text, not a picture
3. **Checks whether it's been paid** — by polling the Bakong Open API with a hash of the QR

You do **not** need any payment gateway account or secret key to do step 1 — that's the biggest difference from a typical payment integration, and worth sitting with before writing any code.

---

## 2. Key Concepts (Read This First)

Before touching code, understand these ideas — most beginner confusion comes from skipping this part.

| Term | What it means |
|---|---|
| **KHQR** | Cambodia's standardized QR payment format (built on the EMVCo QR standard), issued by the National Bank of Cambodia. Any participating bank/e-wallet app can scan a KHQR code and pay it — it's not tied to one bank. |
| **Bakong Account ID** | The identifier of *who gets paid* — looks like `someone@devb`. It is **not secret**; it functions like a bank account number, not a password. |
| **KHQR string vs. KHQR image** | Generating a KHQR produces a plain text string in EMVCo format — not a picture. You must run that string through a separate QR-image library to get something a phone camera can actually scan. This trips up almost everyone the first time. |
| **Static vs. dynamic KHQR** | A KHQR with no amount (`amount` omitted/zero) is *static* — reusable, no expiry, the payer types in how much to pay. A KHQR with an `amount` set is *dynamic* — one specific charge, and it **requires an `expirationTimestamp`**. This guide builds a dynamic KHQR. |
| **MD5 hash** | Generating a KHQR also produces an MD5 hash of the QR string. This hash isn't shown to the payer — it's what *you* use afterward to ask the Bakong API "has this specific QR been paid yet?" |
| **Bearer token / access token** | A credential from the [Bakong Open API developer portal](https://api-bakong.nbc.gov.kh/) that authorizes calls to check payment status. Unlike the Account ID, this **is** sensitive — keep it server-side. Exactly how it's issued/renewed isn't fully confirmed in public docs; see the note in step 5. |

> **Note on packages:** This guide uses `ts-khqr`, a community reimplementation of the KHQR standard, instead of the officially-named `bakong-khqr` package. See [`CLAUDE.md`](../CLAUDE.md#known-intentional-gaps) in this repo for exactly why — short version: `bakong-khqr`'s public usage examples disagree with each other on its constructor signature, and its real source isn't publicly inspectable to resolve that.

**Important:** Whichever access token you use for the status-check step must only ever live on your **backend/server**, never in JavaScript that runs in the browser — and never committed to a git repo.

---

## 3. Prerequisites

- [ ] A Bakong Account ID — the account a generated KHQR will pay into
- [ ] A Bakong Open API access token — register at the [developer portal](https://api-bakong.nbc.gov.kh/); only needed for the status-check step (step 6), not for generating a KHQR
- [ ] A basic web page (HTML) you can edit
- [ ] A backend you can run locally (this guide's example uses Node.js/Express, but any language works)

---

## 4. The Flow, Step by Step

### Step 1 — Install the packages

```bash
npm install ts-khqr qrcode
```

`ts-khqr` builds the KHQR string; `qrcode` turns any string into a scannable image.

### Step 2 — Backend: generate the KHQR string and MD5 hash

This happens entirely offline — **no network call, no access token needed**:

```js
import { KHQR, CURRENCY, TAG } from 'ts-khqr';

const result = KHQR.generate({
  tag: TAG.INDIVIDUAL,
  accountID: process.env.BAKONG_ACCOUNT_ID,
  merchantName: process.env.BAKONG_MERCHANT_NAME,
  merchantCity: process.env.BAKONG_MERCHANT_CITY || 'Phnom Penh',
  currency: CURRENCY.KHR, // or CURRENCY.USD
  amount: 5000, // 5,000 KHR — set to make this a dynamic (single-charge) QR
  expirationTimestamp: Date.now() + 5 * 60 * 1000, // required whenever amount is set
});

// result.data.qr  -> the raw KHQR string (EMVCo format)
// result.data.md5 -> MD5 hash of that string, used in Step 6
```

Confirmed against the [KHQR SDK Document](https://bakong.nbc.gov.kh/download/KHQR/integration/KHQR%20SDK%20Document.pdf): `expirationTimestamp` is required whenever `amount` is non-zero — omit it on a dynamic QR and generation fails validation.

### Step 3 — Backend: render the string as a scannable image

`result.data.qr` is just text — a phone camera can't scan text. Convert it to an image:

```js
import QRCode from 'qrcode';

const qrImage = await QRCode.toDataURL(result.data.qr); // data:image/png;base64,...
```

### Step 4 — Backend: return everything the frontend needs

```js
res.json({
  qrImage,               // data URI, ready for an <img> tag
  md5: result.data.md5,  // needed to check payment status later
  expiresAt: Date.now() + 5 * 60 * 1000,
});
```

### Step 5 — Frontend: display the QR code

```html
<img id="khqr-image" alt="Scan to pay">
<p id="status">Waiting for payment...</p>

<script>
  const res = await fetch('/create-payment', { method: 'POST' });
  const data = await res.json();
  document.getElementById('khqr-image').src = data.qrImage;
  pollPaymentStatus(data.md5);
</script>
```

### Step 6 — Backend: check payment status

This is the one step that talks to Bakong's real API. Confirmed against the [Bakong Open API Document](https://bakong.nbc.gov.kh/download/KHQR/integration/Bakong%20Open%20API%20Document.pdf):

```js
const response = await fetch(`${process.env.BAKONG_API_BASE_URL}/check_transaction_by_md5`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.BAKONG_ACCESS_TOKEN}`,
  },
  body: JSON.stringify({ md5 }),
});
const result = await response.json();
// result.responseCode === 0 && result.data  -> paid; inspect result.data for amount, timestamps, etc.
// non-zero responseCode, or a 404          -> not paid yet
```

> **Unconfirmed (teaching note):** How exactly the `BAKONG_ACCESS_TOKEN` is meant to be issued and renewed isn't fully documented in public sources — the developer portal issues API access tied to a registered email, but whether that's a single long-lived token, a `/token` exchange, or a `/renew_token` flow isn't confirmed. This guide's example uses one static token from `.env`, obtained manually from the portal. Don't build a guessed token-refresh endpoint without checking the current official docs first.

Your frontend polls this endpoint every few seconds after showing the QR code, and stops once it gets a paid result or the QR's `expirationTimestamp` passes.

---

## 5. Testing Checklist

- [ ] Loading the page generates a KHQR image with no errors (this step needs no network access, so it should work even with a placeholder access token)
- [ ] The image is actually scannable by a QR-reading app (not just visually present)
- [ ] `/check-payment-status` returns a clean "not paid yet" response rather than crashing, given a valid but unpaid `md5`
- [ ] **Unconfirmed — verify before relying on it:** whether the sandbox base URL (`sit-api-bakong.nbc.gov.kh`) behaves like a consequence-free test environment, or requires an actual bank-linked Bakong account to complete a real payment into. This guide doesn't yet have a confirmed answer — see [`CLAUDE.md`](../CLAUDE.md#known-intentional-gaps).
- [ ] The page correctly shows an "expired" state once `expirationTimestamp` passes without payment

---

## 6. Common Beginner Mistakes

1. **Forgetting `expirationTimestamp` on a dynamic QR.** Required the moment `amount` is set — omitting it fails generation.
2. **Treating the raw `qr` string as something you can display directly.** It needs to go through a QR-image library first — see Step 3.
3. **Assuming KHQR generation needs network access or an access token.** It doesn't — only the status-check step (Step 6) does.
4. **Mixing up KHR and USD amount formatting.** KHR amounts are whole numbers (no decimals); USD amounts use decimals. Passing the wrong shape for the selected `currency` produces a malformed QR.
5. **Putting the Bakong access token in frontend JavaScript.** Like any API credential, it must stay server-side — unlike the Account ID, which is fine to be public.
6. **Polling forever.** Stop once you get a paid result or the QR expires — don't poll past `expirationTimestamp`.

---

## 7. What's Next (Not Covered Here)

- Merchant KHQR (a business account with a Merchant ID and acquiring bank, rather than an individual account)
- Checking multiple transactions at once (`check_transaction_by_md5_list`)
- Generating a deeplink instead of/alongside a QR image (`generate_deeplink_by_qr`)
- Going live: production API base URL, production account setup
- **Not yet confirmed firsthand:** the ABA PayWay tutorial in this series includes a section on the real-world, non-technical side of integration (contracts, support channels, design review) based on the author's own PayWay integration experience. No equivalent firsthand experience with Bakong's onboarding process exists yet to write honestly about here — this section will be added once that's actually been lived through, rather than guessed at.

---

*This guide is a teaching draft — verify exact field names, package behavior, and current API endpoints against the official [Bakong Open API Document](https://bakong.nbc.gov.kh/download/KHQR/integration/Bakong%20Open%20API%20Document.pdf) and [KHQR SDK Document](https://bakong.nbc.gov.kh/download/KHQR/integration/KHQR%20SDK%20Document.pdf) before publishing to students, since these details can change.*
