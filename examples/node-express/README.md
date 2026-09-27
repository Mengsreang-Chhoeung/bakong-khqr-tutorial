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
