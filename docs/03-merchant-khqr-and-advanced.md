# Merchant KHQR & Advanced Topics

*Not yet written — placeholder for the next chapter.*

Planned topics:
- Merchant KHQR (`TAG.MERCHANT`) — adds a Merchant ID and acquiring bank, for businesses rather than individual accounts
- Checking multiple transactions in one call (`check_transaction_by_md5_list`)
- Generating a deeplink instead of/alongside a QR image (`generate_deeplink_by_qr`)
- Access token renewal (`renew_token`) — mechanism not yet confirmed, see [`CLAUDE.md`](../CLAUDE.md#known-intentional-gaps)
- Callback/webhook notifications — **no such mechanism has been confirmed to exist for Bakong KHQR** in the sources reviewed while writing this repo, unlike ABA PayWay's documented `return_url` callback. If one is confirmed later, it belongs here.
