# Bakong KHQR Tutorial

A beginner-friendly, end-to-end guide to generating and checking Bakong KHQR payments — written for students, with a runnable code example.

📖 **The written tutorial lives at [mengsreang-chhoeung.work/tutorials/bakong-khqr-tutorial](https://mengsreang-chhoeung.work/tutorials/bakong-khqr-tutorial).** This repo holds only the companion code.

## Structure

```
bakong-khqr-tutorial/
├── examples/
│   └── node-express/           # Runnable Individual-KHQR example (Node.js/Express)
└── README.md
```

## Status

- [x] [Written tutorial](https://mengsreang-chhoeung.work/tutorials/bakong-khqr-tutorial) — hosted on the site, not in this repo
- [x] `examples/node-express` — working Individual-KHQR generate-and-check starter

## Prerequisites

- A Bakong Account ID (the payee identifier a KHQR pays into)
- A Bakong Open API access token, obtained by registering at the [Bakong Open API developer portal](https://api-bakong.nbc.gov.kh/) — only needed for checking payment status, not for generating a KHQR
- Node.js installed, if running the example

## Getting Started

1. Read the [tutorial](https://mengsreang-chhoeung.work/tutorials/bakong-khqr-tutorial) first — it explains the concepts before any code.
2. Then walk through [`examples/node-express`](./examples/node-express) to see it running.

## Disclaimer

This repo uses `ts-khqr`, a community reimplementation of the KHQR standard, rather than the officially-named `bakong-khqr` npm package — see [`CLAUDE.md`](./CLAUDE.md#known-intentional-gaps) for why. Field names, endpoint URLs, and package behavior referenced here should be verified against the National Bank of Cambodia's official documentation before being taught or used in production:

- [Bakong Open API Document (PDF)](https://bakong.nbc.gov.kh/download/KHQR/integration/Bakong%20Open%20API%20Document.pdf)
- [KHQR SDK Document (PDF)](https://bakong.nbc.gov.kh/download/KHQR/integration/KHQR%20SDK%20Document.pdf)

Unlike ABA PayWay's HTML developer portal, Bakong's canonical docs are PDFs — easy for a guide like this one to silently drift from as they're updated.
