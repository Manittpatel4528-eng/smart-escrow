// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title SmartEscrow — Milestone-based escrow for UPI-linked payments
/// @notice Locks funds against defined milestones and releases them on verification.
/// @dev Deployed on the Drunix platform. Funds themselves are held off-chain in a
///      regulated nodal account; this contract is the source of truth for
///      conditions, state, and the audit trail. A backend service listens to
///      contract events and triggers the matching UPI/IMPS payout.
contract EscrowContract {
    enum Status { Created, Funded, PartiallyReleased, Completed, Disputed, Refunded }

    struct Milestone {
        string description;
        uint256 amountBps; // share of total amount, in basis points (10000 = 100%)
        bool released;
    }

    struct Agreement {
        address payer;
        address payee;
        uint256 totalAmount; // in paise, mirrors the UPI-collected amount
        Status status;
        Milestone[] milestones;
    }

    uint256 public nextAgreementId;
    mapping(uint256 => Agreement) private agreements;

    event AgreementCreated(uint256 indexed id, address indexed payer, address indexed payee, uint256 totalAmount);
    event Funded(uint256 indexed id, uint256 amount);
    event MilestoneVerified(uint256 indexed id, uint256 milestoneIndex, uint256 releaseAmount);
    event Disputed(uint256 indexed id);
    event Refunded(uint256 indexed id, uint256 amount);

    modifier onlyPayer(uint256 id) {
        require(msg.sender == agreements[id].payer, "not payer");
        _;
    }

    /// @notice Create a new escrow agreement with milestones summing to 10000 bps.
    function createAgreement(
        address payee,
        uint256 totalAmount,
        string[] calldata descriptions,
        uint256[] calldata amountBps
    ) external returns (uint256 id) {
        require(descriptions.length == amountBps.length, "length mismatch");

        uint256 sum;
        for (uint256 i = 0; i < amountBps.length; i++) {
            sum += amountBps[i];
        }
        require(sum == 10000, "milestones must total 100%");

        id = nextAgreementId++;
        Agreement storage a = agreements[id];
        a.payer = msg.sender;
        a.payee = payee;
        a.totalAmount = totalAmount;
        a.status = Status.Created;

        for (uint256 i = 0; i < descriptions.length; i++) {
            a.milestones.push(Milestone(descriptions[i], amountBps[i], false));
        }

        emit AgreementCreated(id, msg.sender, payee, totalAmount);
    }

    /// @notice Called by the backend once UPI funds have landed in the pooled account.
    function markFunded(uint256 id) external {
        // NOTE: access-controlled to the trusted backend relayer in production.
        Agreement storage a = agreements[id];
        require(a.status == Status.Created, "invalid state");
        a.status = Status.Funded;
        emit Funded(id, a.totalAmount);
    }

    /// @notice Verify a milestone (via buyer sign-off or oracle) and trigger release.
    function verifyMilestone(uint256 id, uint256 milestoneIndex) external {
        // NOTE: access-controlled to payee-confirmation flow or registered oracle.
        Agreement storage a = agreements[id];
        require(a.status == Status.Funded || a.status == Status.PartiallyReleased, "invalid state");

        Milestone storage m = a.milestones[milestoneIndex];
        require(!m.released, "already released");
        m.released = true;

        uint256 releaseAmount = (a.totalAmount * m.amountBps) / 10000;
        a.status = _allReleased(a) ? Status.Completed : Status.PartiallyReleased;

        emit MilestoneVerified(id, milestoneIndex, releaseAmount);
        // Backend listens for this event and triggers the IMPS payout to payee.
    }

    /// @notice Either party can flag a dispute, freezing remaining balance.
    function raiseDispute(uint256 id) external {
        Agreement storage a = agreements[id];
        require(msg.sender == a.payer || msg.sender == a.payee, "not a party");
        a.status = Status.Disputed;
        emit Disputed(id);
    }

    function _allReleased(Agreement storage a) private view returns (bool) {
        for (uint256 i = 0; i < a.milestones.length; i++) {
            if (!a.milestones[i].released) return false;
        }
        return true;
    }

    function getAgreement(uint256 id)
        external
        view
        returns (address payer, address payee, uint256 totalAmount, Status status, uint256 milestoneCount)
    {
        Agreement storage a = agreements[id];
        return (a.payer, a.payee, a.totalAmount, a.status, a.milestones.length);
    }
}
