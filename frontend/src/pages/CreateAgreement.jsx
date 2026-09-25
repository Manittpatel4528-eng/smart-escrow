import { useState } from "react";

/**
 * Payer flow: define payee, total amount, and milestones, then fund via UPI.
 */
export default function CreateAgreement() {
  const [milestones, setMilestones] = useState([
    { description: "", amountBps: 0 },
  ]);

  const addMilestone = () =>
    setMilestones([...milestones, { description: "", amountBps: 0 }]);

  const submit = async () => {
    const res = await fetch("/api/escrow/agreements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        payerId: "current-user",
        payeeId: "payee-id",
        totalAmount: 0,
        milestones,
      }),
    });
    const agreement = await res.json();
    console.log("Created agreement:", agreement);
  };

  return (
    <div>
      <h1>Create Escrow Agreement</h1>
      {milestones.map((m, i) => (
        <div key={i}>
          <input placeholder="Milestone description" value={m.description} readOnly />
          <input placeholder="Share (bps)" value={m.amountBps} readOnly />
        </div>
      ))}
      <button onClick={addMilestone}>Add milestone</button>
      <button onClick={submit}>Create & fund via UPI</button>
    </div>
  );
}
