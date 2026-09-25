/**
 * Payments Service — UPI Collect/AutoPay for funding, IMPS for payout.
 *
 * Wraps NPCI-facing APIs so the rest of the backend never talks to the
 * payment rails directly. In production this integrates with a licensed
 * PSP/bank partner (per NPCI's participation model) rather than calling
 * NPCI endpoints directly.
 */

async function initiateUpiCollect({ agreementId }) {
  // TODO: call PSP's UPI Collect API, request funds into the pooled
  // nodal/escrow account, tag the request with agreementId for reconciliation.
  return {
    agreementId,
    collectRequestId: `UPI-COLLECT-${agreementId}`,
    status: "PENDING",
  };
}

async function triggerImpsPayout({ agreementId, payeeVpa, amountPaise }) {
  // TODO: call PSP's IMPS/UPI payout API to release funds to payee's VPA
  // once the escrow contract emits a MilestoneVerified event.
  return {
    agreementId,
    payoutRef: `IMPS-PAYOUT-${agreementId}-${Date.now()}`,
    payeeVpa,
    amountPaise,
    status: "INITIATED",
  };
}

module.exports = { initiateUpiCollect, triggerImpsPayout };
