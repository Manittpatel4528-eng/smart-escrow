# SmartEscrow API (draft)

Base path: `/api/escrow`

| Method | Path | Purpose |
|---|---|---|
| POST | `/agreements` | Create a new escrow agreement (payer, payee, amount, milestones) |
| POST | `/agreements/:id/fund` | Initiate UPI Collect to fund the agreement |
| POST | `/webhooks/upi/collect-confirmed` | PSP webhook: mark agreement funded on-chain |
| POST | `/agreements/:id/milestones/:index/verify` | Verify a milestone (buyer sign-off or oracle) and trigger IMPS payout |
| POST | `/agreements/:id/dispute` | Freeze remaining balance and open a dispute |
| GET | `/agreements/:id` | Fetch agreement status and on-chain audit trail |

See `backend/src/contracts/EscrowContract.sol` for the on-chain state machine
these endpoints drive, and `docs/ARCHITECTURE.md` (README) for the full flow.

## Notes on production access control

The stubs in this repo omit auth for clarity. In production:

- `markFunded` is called only by a trusted backend relayer after PSP webhook verification.
- `verifyMilestone` is called by an authenticated payee (sign-off) or a registered oracle service — never directly by the payer.
- All on-chain writes are signed by a backend-held key, not exposed to the client.
