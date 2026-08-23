const express = require('express');
const QRCode = require('qrcode');
const { KHQR, CURRENCY, TAG } = require('ts-khqr');
const router = express.Router();

const {
  BAKONG_ACCOUNT_ID,
  BAKONG_MERCHANT_NAME,
  BAKONG_MERCHANT_CITY,
  BAKONG_CURRENCY,
  BAKONG_ACCESS_TOKEN,
  BAKONG_API_BASE_URL,
} = process.env;

const CHECK_TRANSACTION_URL = `${BAKONG_API_BASE_URL}/check_transaction_by_md5`;

const DEMO_AMOUNT = 5000; // 5,000 KHR, hardcoded for this teaching example
const EXPIRATION_MS = 5 * 60 * 1000; // 5 minutes

/**
 * POST /create-payment
 *
 * Generates a dynamic Individual KHQR for a fixed demo amount. This whole
 * handler runs OFFLINE — no network call, no access token needed. That's
 * the biggest structural difference from a typical payment gateway
 * integration (e.g. this repo's sibling, aba-payway-tutorial): a KHQR
 * doesn't require asking any server to create a transaction, because the
 * QR payload itself just names who gets paid, how much, and until when.
 *
 * PACKAGE CHOICE (teaching note, see CLAUDE.md "Known intentional gaps"
 * for the full reasoning): this uses `ts-khqr`, a community reimplementation
 * with an unambiguous functional API, rather than the officially-named
 * `bakong-khqr` package — whose constructor signature disagrees across
 * public usage examples, and whose real source lives on NBC's private
 * GitLab rather than a publicly inspectable repo. Confirm ts-khqr's output
 * against the official KHQR SDK Document
 * (https://bakong.nbc.gov.kh/download/KHQR/integration/KHQR%20SDK%20Document.pdf)
 * before relying on it for anything beyond this teaching example.
 *
 * Confirmed against the KHQR SDK Document: `expirationTimestamp` is
 * required whenever `amount` is set (a "dynamic" KHQR, one specific
 * charge) — omit it and generation fails validation. A KHQR with no
 * amount is "static" (reusable, payer enters the amount) and has no
 * such requirement.
 *
 * The generated `data.qr` is a plain EMVCo-format STRING, not an image —
 * unlike PayWay's Purchase API, which returns a ready-made QR PNG directly.
 * We render it into a scannable image ourselves with `qrcode` below.
 */
router.post('/create-payment', async (req, res) => {
  const expiresAt = Date.now() + EXPIRATION_MS;

  const result = KHQR.generate({
    tag: TAG.INDIVIDUAL,
    accountID: BAKONG_ACCOUNT_ID,
    merchantName: BAKONG_MERCHANT_NAME,
    merchantCity: BAKONG_MERCHANT_CITY || 'Phnom Penh',
    currency: BAKONG_CURRENCY === 'USD' ? CURRENCY.USD : CURRENCY.KHR,
    amount: DEMO_AMOUNT,
    expirationTimestamp: expiresAt,
  });

  if (result.status.code !== 0) {
    return res.status(400).json({ error: result.status.message });
  }

  const qrImage = await QRCode.toDataURL(result.data.qr);

  res.json({
    qrImage,
    md5: result.data.md5,
    amount: DEMO_AMOUNT,
    currency: BAKONG_CURRENCY || 'KHR',
    expiresAt,
  });
});

/**
 * POST /check-payment-status
 *
 * The one handler in this example that talks to Bakong's real
 * infrastructure. Confirmed against the Bakong Open API Document
 * (https://bakong.nbc.gov.kh/download/KHQR/integration/Bakong%20Open%20API%20Document.pdf):
 * POST { md5 } with an Authorization: Bearer header to
 * `${BAKONG_API_BASE_URL}/check_transaction_by_md5`. A `responseCode: 0`
 * response with a populated `data` object means the transaction was found
 * and paid; a non-zero `responseCode` (or a 404) means it hasn't been paid
 * yet — the frontend polls this on an interval until it gets a paid result
 * or the QR's expirationTimestamp passes.
 *
 * UNCONFIRMED (teaching note, see CLAUDE.md): exactly how
 * BAKONG_ACCESS_TOKEN is meant to be issued/renewed isn't documented in
 * public sources reviewed while writing this example — it's read here as
 * a static value from .env, obtained manually via the developer portal
 * (https://api-bakong.nbc.gov.kh/). Don't build a guessed token-refresh
 * flow without checking the current official docs first.
 */
router.post('/check-payment-status', async (req, res) => {
  const { md5 } = req.body;

  const bakongRes = await fetch(CHECK_TRANSACTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${BAKONG_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ md5 }),
  });

  if (bakongRes.status === 404) {
    return res.json({ paid: false });
  }

  const data = await bakongRes.json();

  if (data.responseCode === 0 && data.data) {
    return res.json({ paid: true, transaction: data.data });
  }

  res.json({ paid: false, responseMessage: data.responseMessage });
});

module.exports = router;
