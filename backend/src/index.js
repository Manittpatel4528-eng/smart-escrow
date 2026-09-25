require("dotenv").config();
const express = require("express");
const escrowRoutes = require("./api/escrow/routes");

const app = express();
app.use(express.json());

app.use("/api/escrow", escrowRoutes);
// app.use("/api/payments", require("./api/payments/routes"));
// app.use("/api/kyc", require("./api/kyc/routes"));

app.get("/health", (_req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`SmartEscrow backend listening on :${PORT}`));
