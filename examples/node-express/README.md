# Bakong KHQR Example (Node.js/Express)

A minimal, runnable companion to [`docs/01-getting-started.md`](../../docs/01-getting-started.md).

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

- Uses `ts-khqr` rather than the officially-named `bakong-khqr` package — its constructor contract is inconsistent across public examples and its real source isn't publicly inspectable to resolve that. See `CLAUDE.md` in the repo root for the full reasoning.
- How the Bakong access token is issued/renewed isn't confirmed from public docs — this example just reads a static token from `.env`, obtained manually from the developer portal.
- No callback/webhook route exists here — no such mechanism is confirmed for Bakong KHQR. `/check-payment-status` polling is the only status-check path implemented.
- Whether the sandbox base URL is a true consequence-free test environment is unconfirmed — see `docs/01-getting-started.md`'s Testing Checklist.
