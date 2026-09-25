/**
 * Escrow Service — orchestrates the Drunix smart contract, the pooled
 * escrow account, and milestone verification (buyer sign-off or oracle).
 */

const paymentsService = require("./paymentsService");
// const contract = require("../contracts/escrowContractClient"); // Drunix SDK client

async function createAgreement({ payerId, payeeId, totalAmount, milestones }) {
  // TODO: deploy/register agreement on the Drunix escrow contract
  // const { id } = await contract.createAgreement(payeeId, totalAmount, milestones);
  return {
    id: "AGREEMENT-STUB-ID",
    payerId,
    payeeId,
    totalAmount,
    milestones,
    status: "CREATED",
  };
}

async function markFunded(agreementId, upiTransactionRef) {
  // TODO: call contract.markFunded(agreementId) once UPI funds are confirmed
  return { agreementId, upiTransactionRef, status: "FUNDED" };
}

async function verifyMilestone(agreementId, milestoneIndex, { verifiedBy, evidence }) {
  // TODO: call contract.verifyMilestone(agreementId, milestoneIndex)
  // On the contract's MilestoneVerified event, trigger payout:
  const payout = await paymentsService.triggerImpsPayout({
    agreementId,
    payeeVpa: "payee@upi", // resolved from agreement record
    amountPaise: 0, // resolved from milestone share of totalAmount
  });

  return { agreementId, milestoneIndex, verifiedBy, evidence, payout };
}

async function raiseDispute(agreementId, raisedBy, reason) {
  // TODO: call contract.raiseDispute(agreementId)
  return { agreementId, raisedBy, reason, status: "DISPUTED" };
}

async function getAgreement(agreementId) {
  // TODO: read on-chain state via contract.getAgreement(agreementId)
  return { agreementId, status: "UNKNOWN" };
}

module.exports = {
  createAgreement,
  markFunded,
  verifyMilestone,
  raiseDispute,
  getAgreement,
};
