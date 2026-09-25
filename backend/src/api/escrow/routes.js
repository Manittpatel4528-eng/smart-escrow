/**
 * Escrow API — contract creation, milestone verification, release triggers.
 *
 * These endpoints sit between the frontend, the Drunix escrow smart contract,
 * and the payments service. They do not hold funds themselves — the payments
 * service and pooled nodal account are the source of truth for money movement;
 * this layer keeps that in sync with on-chain contract state.
 */

const express = require("express");
const router = express.Router();

const escrowService = require("../../services/escrowService");
const paymentsService = require("../../services/paymentsService");

// Create a new escrow agreement (payer defines payee, amount, milestones)
router.post("/agreements", async (req, res) => {
  const { payerId, payeeId, totalAmount, milestones } = req.body;

  const agreement = await escrowService.createAgreement({
    payerId,
    payeeId,
    totalAmount,
    milestones, // [{ description, amountBps }]
  });

  res.status(201).json(agreement);
});

// Payer funds the agreement via UPI Collect
router.post("/agreements/:id/fund", async (req, res) => {
  const { id } = req.params;

  const collectRequest = await paymentsService.initiateUpiCollect({
    agreementId: id,
  });

  res.json(collectRequest);
});

// Webhook: UPI payment confirmation -> mark agreement funded on-chain
router.post("/webhooks/upi/collect-confirmed", async (req, res) => {
  const { agreementId, upiTransactionRef } = req.body;

  await escrowService.markFunded(agreementId, upiTransactionRef);

  res.sendStatus(200);
});

// Buyer confirms a milestone (or an oracle calls this internally)
router.post("/agreements/:id/milestones/:index/verify", async (req, res) => {
  const { id, index } = req.params;
  const { verifiedBy, evidence } = req.body; // evidence: oracle payload or buyer sign-off

  const result = await escrowService.verifyMilestone(id, Number(index), {
    verifiedBy,
    evidence,
  });

  // escrowService triggers the IMPS payout once the on-chain event confirms
  res.json(result);
});

// Raise a dispute — freezes remaining balance pending arbitration
router.post("/agreements/:id/dispute", async (req, res) => {
  const { id } = req.params;
  const { raisedBy, reason } = req.body;

  const result = await escrowService.raiseDispute(id, raisedBy, reason);
  res.json(result);
});

// Fetch agreement status + on-chain audit trail
router.get("/agreements/:id", async (req, res) => {
  const { id } = req.params;
  const agreement = await escrowService.getAgreement(id);
  res.json(agreement);
});

module.exports = router;
