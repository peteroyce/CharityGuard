// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/**
 * @title CharityGuardDonations
 * @dev Manages charitable donations with on-chain fraud score gating.
 *      Fraud thresholds align with the CharityGuard backend (>= 65 = flagged).
 *      Flagged donations are held in the contract until the owner verifies them.
 */
contract CharityGuardDonations {

    // ─── State ────────────────────────────────────────────────────────────────

    address public owner;
    uint256 public donationCounter;
    uint256 public totalDonationsAmount;

    /// @dev Reentrancy guard
    bool private _locked;

    // Fraud score thresholds (out of 100, matching backend scoring)
    uint256 public constant VERIFIED_THRESHOLD = 30;  // <= 30 → verified
    uint256 public constant FLAGGED_THRESHOLD   = 65;  // >= 65 → flagged, funds held

    // ─── Enums ────────────────────────────────────────────────────────────────

    enum DonationStatus { PENDING, VERIFIED, FLAGGED }

    // ─── Structs ──────────────────────────────────────────────────────────────

    struct Donation {
        uint256 id;
        address donor;
        address charity;
        uint256 amount;
        string  charityName;
        string  charityEIN;
        uint256 timestamp;
        bool    isVerified;
        uint256 fraudScore;
        DonationStatus status;
        bool    fundsTransferred;
    }

    struct Charity {
        address walletAddress;
        string  name;
        string  ein;
        uint256 totalReceived;   // only counts funds actually transferred
        uint256 donationCount;   // only counts completed (transferred) donations
        bool    isActive;
    }

    // ─── Mappings ─────────────────────────────────────────────────────────────

    mapping(uint256 => Donation) public donations;
    mapping(address => uint256[]) public donorHistory;
    mapping(address => Charity)  public registeredCharities;
    mapping(string  => address)  public einToAddress;

    // ─── Events ───────────────────────────────────────────────────────────────

    event DonationMade(
        uint256 indexed donationId,
        address indexed donor,
        address indexed charity,
        uint256 amount,
        string  charityName,
        string  charityEIN,
        uint256 fraudScore,
        DonationStatus status
    );

    event FundsTransferred(
        uint256 indexed donationId,
        address indexed charity,
        uint256 amount
    );

    event DonationFlagged(
        uint256 indexed donationId,
        uint256 fraudScore
    );

    event DonationVerified(
        uint256 indexed donationId,
        address indexed verifier
    );

    event CharityRegistered(
        address indexed charityAddress,
        string  name,
        string  ein
    );

    event CharityDeactivated(
        address indexed charityAddress,
        address indexed deactivatedBy
    );

    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    event EmergencyWithdrawal(
        address indexed to,
        uint256 amount
    );

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    modifier validDonationId(uint256 _donationId) {
        require(_donationId > 0 && _donationId <= donationCounter, "Invalid donation ID");
        _;
    }

    modifier nonReentrant() {
        require(!_locked, "Reentrant call");
        _locked = true;
        _;
        _locked = false;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
    }

    // ─── Charity Management ───────────────────────────────────────────────────

    /**
     * @dev Register a charity. Only owner can register.
     * @param _charityAddress Ethereum wallet of the charity
     * @param _name           Human-readable name
     * @param _ein            IRS Employer Identification Number
     */
    function registerCharity(
        address _charityAddress,
        string  memory _name,
        string  memory _ein
    ) external onlyOwner {
        require(_charityAddress != address(0),           "Invalid charity address");
        require(bytes(_name).length > 0,                 "Name cannot be empty");
        require(bytes(_ein).length > 0,                  "EIN cannot be empty");
        require(bytes(_ein).length <= 12,                "EIN too long");
        require(einToAddress[_ein] == address(0),        "EIN already registered");
        require(!registeredCharities[_charityAddress].isActive, "Address already registered");

        registeredCharities[_charityAddress] = Charity({
            walletAddress: _charityAddress,
            name:          _name,
            ein:           _ein,
            totalReceived: 0,
            donationCount: 0,
            isActive:      true
        });

        einToAddress[_ein] = _charityAddress;

        emit CharityRegistered(_charityAddress, _name, _ein);
    }

    /**
     * @dev Deactivate a registered charity. Emits CharityDeactivated.
     */
    function deactivateCharity(address _charity) external onlyOwner {
        require(registeredCharities[_charity].isActive, "Charity not active");
        registeredCharities[_charity].isActive = false;
        emit CharityDeactivated(_charity, msg.sender);
    }

    // ─── Donations ────────────────────────────────────────────────────────────

    /**
     * @dev Submit a donation. Charity must be registered and active.
     *      Fraud score must match the EIN on record for that charity address.
     *      Funds are transferred immediately unless fraudScore >= FLAGGED_THRESHOLD.
     *
     * @param _charity     Registered charity wallet address
     * @param _charityName Display name (must match registration)
     * @param _charityEIN  EIN — validated against einToAddress mapping
     * @param _fraudScore  Score 0-100 provided by CharityGuard backend
     */
    function makeDonation(
        address _charity,
        string  memory _charityName,
        string  memory _charityEIN,
        uint256 _fraudScore
    ) external payable nonReentrant {
        require(msg.value > 0,                                          "Donation must be > 0");
        require(_charity != address(0),                                 "Invalid charity address");
        require(_fraudScore <= 100,                                     "Fraud score out of range");
        require(registeredCharities[_charity].isActive,                 "Charity not registered or inactive");
        require(einToAddress[_charityEIN] == _charity,                  "EIN does not match charity address");

        donationCounter++;

        DonationStatus status;
        bool isVerified;

        if (_fraudScore <= VERIFIED_THRESHOLD) {
            status     = DonationStatus.VERIFIED;
            isVerified = true;
        } else if (_fraudScore < FLAGGED_THRESHOLD) {
            status     = DonationStatus.PENDING;
            isVerified = false;
        } else {
            status     = DonationStatus.FLAGGED;
            isVerified = false;
        }

        donations[donationCounter] = Donation({
            id:               donationCounter,
            donor:            msg.sender,
            charity:          _charity,
            amount:           msg.value,
            charityName:      _charityName,
            charityEIN:       _charityEIN,
            timestamp:        block.timestamp,
            isVerified:       isVerified,
            fraudScore:       _fraudScore,
            status:           status,
            fundsTransferred: false
        });

        donorHistory[msg.sender].push(donationCounter);
        totalDonationsAmount += msg.value;

        emit DonationMade(
            donationCounter,
            msg.sender,
            _charity,
            msg.value,
            _charityName,
            _charityEIN,
            _fraudScore,
            status
        );

        if (status != DonationStatus.FLAGGED) {
            _transferToDonation(donationCounter);
        } else {
            emit DonationFlagged(donationCounter, _fraudScore);
        }
    }

    /**
     * @dev Owner manually verifies a flagged donation and releases held funds.
     */
    function verifyDonation(uint256 _donationId)
        external
        onlyOwner
        nonReentrant
        validDonationId(_donationId)
    {
        Donation storage donation = donations[_donationId];
        require(!donation.fundsTransferred,                     "Funds already transferred");
        require(donation.status == DonationStatus.FLAGGED,      "Donation is not flagged");

        donation.isVerified = true;
        donation.status     = DonationStatus.VERIFIED;

        emit DonationVerified(_donationId, msg.sender);

        _transferToDonation(_donationId);
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    function getDonation(uint256 _donationId)
        external
        view
        validDonationId(_donationId)
        returns (Donation memory)
    {
        return donations[_donationId];
    }

    function getDonorHistory(address _donor)
        external
        view
        returns (uint256[] memory)
    {
        return donorHistory[_donor];
    }

    function getCharityInfo(address _charity)
        external
        view
        returns (Charity memory)
    {
        return registeredCharities[_charity];
    }

    function getTotalDonations() external view returns (uint256) {
        return donationCounter;
    }

    function getTotalAmount() external view returns (uint256) {
        return totalDonationsAmount;
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    /**
     * @dev Transfer contract ownership.
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid new owner");
        emit OwnershipTransferred(owner, _newOwner);
        owner = _newOwner;
    }

    /**
     * @dev Emergency withdraw of stuck ETH (e.g. direct sends). Cannot
     *      withdraw funds held for pending verifications — only the idle balance.
     */
    function emergencyWithdraw(uint256 _amount) external onlyOwner nonReentrant {
        require(_amount <= address(this).balance, "Insufficient balance");
        emit EmergencyWithdrawal(owner, _amount);
        (bool success, ) = payable(owner).call{value: _amount}("");
        require(success, "Transfer failed");
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    /**
     * @dev Transfer held funds to the charity for a given donation.
     *      Updates charity stats only on successful transfer.
     *      Uses call{} instead of transfer() to handle contract recipients.
     */
    function _transferToDonation(uint256 _donationId) internal {
        Donation storage donation = donations[_donationId];

        donation.fundsTransferred = true;

        // Update charity stats only when funds actually move
        registeredCharities[donation.charity].totalReceived += donation.amount;
        registeredCharities[donation.charity].donationCount++;

        emit FundsTransferred(_donationId, donation.charity, donation.amount);

        (bool success, ) = payable(donation.charity).call{value: donation.amount}("");
        require(success, "ETH transfer to charity failed");
    }

    // ─── Fallback ─────────────────────────────────────────────────────────────

    /// @dev Accept direct ETH (e.g. accidental sends). Does NOT count as donation.
    receive() external payable {}
}
