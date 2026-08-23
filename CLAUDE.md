# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A beginner-facing tutorial for generating and checking Bakong KHQR payments, written for students. It pairs written guides in `docs/` with a single runnable example in `examples/node-express/`. This is **teaching material, not a production SDK or library** — code correctness for students learning the concepts matters more than completeness.

Unlike a payment gateway that signs and submits a request server-side (e.g. ABA PayWay), generating a KHQR code is an entirely **offline** operation — no Bakong API call is involved. So most of this repo's "don't silently guess" caution applies to two things: the QR-image-rendering step (Bakong only gives you a string) and the one real network call in the example, checking payment status.

## Repo structure

```
docs/                                  # Written guides, meant to be read in order
├── 01-getting-started.md              # Generate + display + check an Individual KHQR — the only complete guide
├── 02-going-live.md                   # Stub — not yet written
└── 03-merchant-khqr-and-advanced.md   # Stub — not yet written

examples/node-express/                 # Runnable Individual-KHQR example (Node.js/Express)
├── src/server.js                      # Express app entrypoint
├── src/routes/payment.js              # POST /create-payment, POST /check-payment-status
└── src/public/index.html              # Page that displays the KHQR image and polls for payment
```

## Running the example

```bash
cd examples/node-express
nvm use && npm install
cp .env.example .env
# edit .env — at minimum set BAKONG_ACCOUNT_ID (not secret; it's the payee
# identifier). BAKONG_ACCESS_TOKEN can stay a placeholder unless you're
# testing /check-payment-status against the real API.
npm start        # or: npm run dev  (auto-restart via --watch)
```

No test suite, linter, or build step exists in this repo — there is nothing to run beyond starting the server and clicking through the flow in a browser.

Always run `nvm use` before any `npm` command in `examples/node-express` (the Node version is pinned via `.nvmrc`).

## Architecture of the example

1. **Backend `POST /create-payment`** (`src/routes/payment.js`) — generates the KHQR payload with `ts-khqr`'s `KHQR.generate()` (see the [KHQR SDK Document](https://bakong.nbc.gov.kh/download/KHQR/integration/KHQR%20SDK%20Document.pdf)). This call is **entirely offline** — no network request happens here, and no access token is needed. The result is a raw EMVCo string (`data.qr`) and an MD5 hash of it (`data.md5`) used later to check payment status. Since a KHQR string is not an image, the handler then runs it through the `qrcode` package (`QRCode.toDataURL()`) to produce a displayable PNG data URI before returning `{ qrImage, khqrString, md5, expiresAt }` to the frontend.
2. **Backend `POST /check-payment-status`** (`src/routes/payment.js`) — the one real call to Bakong's infrastructure. `POST`s `{ md5 }` to `${BAKONG_API_BASE_URL}/check_transaction_by_md5` with `Authorization: Bearer <BAKONG_ACCESS_TOKEN>` (see the [Bakong Open API Document](https://bakong.nbc.gov.kh/download/KHQR/integration/Bakong%20Open%20API%20Document.pdf)). A `responseCode: 0` with a populated `data` object means the transaction was found and paid; a 404 or non-zero `responseCode` means not paid yet — the frontend polls this every few seconds after showing the QR, the same pattern as PayWay's Check Transaction step.

Nothing about the Bakong Account ID is secret (it identifies who gets paid, like a bank account number), so KHQR generation doesn't strictly need to happen server-side the way PayWay's HMAC-signed purchase request did. This example still does it server-side for architectural consistency with the sibling `aba-payway-tutorial` example and to keep `expirationTimestamp` server-controlled — not because the account ID needs protecting.

## Known intentional gaps

These are teaching gaps, flagged in code/docs, not bugs to silently "fix":

- **Package choice: `ts-khqr`, not `bakong-khqr`.** The officially-named `bakong-khqr` npm package's constructor signature is inconsistent across public examples (`new BakongKHQR(accessToken)` in some, `new BakongKHQR()` in others), and its canonical source lives on NBC's private GitLab (`gitlab.nbc.gov.kh/khqr/sdk-javascript`), not a publicly inspectable repo — so that inconsistency can't be resolved by reading the source. `ts-khqr` exposes an unambiguous functional API (`KHQR.generate({...})`) and is used here instead. This is a deliberate substitution for teaching clarity, **not confirmation that the two packages produce identical output** — treat any change here as needing a fresh check against the KHQR SDK Document before publishing to students.
- **Bearer token acquisition is unconfirmed.** The developer portal (https://api-bakong.nbc.gov.kh/) issues API access via a registered email, but whether that's a one-time long-lived token, a `/token` exchange, or a `/renew_token` flow keyed on your email isn't confirmed from public sources. This example uses a single static `BAKONG_ACCESS_TOKEN` from `.env`, obtained manually — it does **not** implement a guessed token-fetch endpoint.
- **No callback/webhook mechanism confirmed for KHQR.** Unlike PayWay's documented `return_url` callback, no equivalent server-to-server notification was confirmed for Bakong KHQR in the sources reviewed while writing this repo. `check_transaction_by_md5` polling is the only status-check mechanism implemented. If a callback mechanism is confirmed later, document it in `docs/03-merchant-khqr-and-advanced.md`.
- **Merchant KHQR, batch status checks, and deeplinks aren't implemented.** The official docs reference `TAG.MERCHANT`-style Merchant KHQR, a `check_transaction_by_md5_list` batch endpoint, and a `generate_deeplink_by_qr` endpoint — confirmed to exist, not yet implemented here. See `docs/03-merchant-khqr-and-advanced.md`.
- **Sandbox realism is unconfirmed.** Whether `sit-api-bakong.nbc.gov.kh` behaves like PayWay's consequence-free sandbox, or is a staging surface that still requires a real bank-linked Bakong account to actually complete a payment into, hasn't been confirmed — flagged in the Testing Checklist in `docs/01-getting-started.md` rather than assumed either way.

When editing this repo, preserve this teaching intent: don't quietly "complete" the token-fetch logic, add a callback route, or swap in `bakong-khqr` without flagging that it needs verification against Bakong's current official docs.
