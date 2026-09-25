/**
 * Delivery Oracle — bridges off-chain delivery/logistics/GST e-invoice
 * signals to the escrow contract's milestone verification.
 *
 * Example sources: logistics partner webhook, GST e-invoice (IRN) lookup,
 * or a marketplace's own delivery-confirmation event.
 */

const escrowService = require("../services/escrowService");

async function onDeliveryConfirmed({ agreementId, milestoneIndex, proof }) {
  // `proof` might be a signed logistics webhook payload, an IRN reference,
  // or a delivery photo hash — whatever the milestone's condition specifies.
  return escrowService.verifyMilestone(agreementId, milestoneIndex, {
    verifiedBy: "oracle:delivery",
    evidence: proof,
  });
}

module.exports = { onDeliveryConfirmed };
