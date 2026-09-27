# Bakong KHQR Example (Node.js/Express)

A minimal, runnable companion to the [Bakong KHQR tutorial](https://mengsreang-chhoeung.work/tutorials/bakong-khqr-tutorial).

## Setup

```bash
cd examples/node-express
nvm use && npm install
cp .env.example .env
# then edit .env — at minimum set BAKONG_ACCOUNT_ID (not secret). Leave
# BAKONG_ACCESS_TOKEN as a placeholder unless you're testing payment-status
# checks against the real Bakong Open API.
npm start
```

Visit `http://localhost:3000` — a KHQR code should render immediately (generation needs no network access).

## What's here

```
node-express/
├── src/
│   ├── server.js          # Express app entrypoint
│   ├── routes/
│   │   └── payment.js     # /create-payment and /check-payment-status
│   └── public/
│       └── index.html     # Page showing the KHQR image and payment status
├── package.json
└── .env.example
```

## Known gaps (intentional, for teaching)

- Uses the `bakong-khqr` package. Its constructor takes **no arguments** (`new BakongKHQR()`) — some public examples pass an access token, but the published source ignores it.
- `bakong-khqr` depends on an old `axios` (`^0.24.0`) with known advisories. This example never triggers it (axios is only used by the SDK's deeplink/account-check helpers), but `npm audit` will flag it.
- How the Bakong access token is issued/renewed isn't confirmed from public docs — this example just reads a static token from `.env`, obtained manually from the developer portal.
- No callback/webhook route exists here — no such mechanism is confirmed for Bakong KHQR. `/check-payment-status` polling is the only status-check path implemented.
- Whether the sandbox base URL is a true consequence-free test environment is unconfirmed — see the Testing Checklist in the [tutorial](https://mengsreang-chhoeung.work/tutorials/bakong-khqr-tutorial).
