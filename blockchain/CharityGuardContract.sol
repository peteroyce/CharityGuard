// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CharityGuardDonations {
    // State variables
    address public owner;
    uint256 public donationCounter;
    uint256 public totalDonationsAmount;
    
    // Structs
    struct Donation {
        uint256 id;
        address donor;
        address charity;
        uint256 amount;
        string charityName;
        string charityEIN;
        uint256 timestamp;
        bool isVerified;
        uint256 fraudScore; // Score out of 100 (0 = no fraud, 100 = high fraud)
        string status; // "pending", "verified", "flagged"
    }
    
    struct Charity {
        address walletAddress;
        string name;
        string ein;
        uint256 totalReceived;
        uint256 donationCount;
        bool isActive;
    }
    
    // Mappings
    mapping(uint256 => Donation) public donations;
    mapping(address => uint256[]) public donorHistory;
    mapping(address => Charity) public registeredCharities;
    mapping(string => address) public einToAddress;
    
    // Events
    event DonationMade(
        uint256 indexed donationId,
        address indexed donor,
        address indexed charity,
        uint256 amount,
        string charityName,
        string charityEIN,
        uint256 fraudScore,
        string status
    );
    
    event CharityRegistered(
        address indexed charityAddress,
        string name,
        string ein
    );
    
    event DonationVerified(
        uint256 indexed donationId,
        address indexed verifier
    );
    
    event DonationFlagged(
        uint256 indexed donationId,
        string reason
    );
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only contract owner can call this function");
        _;
    }
    
    modifier validDonationId(uint256 _donationId) {
        require(_donationId > 0 && _donationId <= donationCounter, "Invalid donation ID");
        _;
    }
    
    modifier registeredCharity(address _charity) {
        require(registeredCharities[_charity].isActive, "Charity not registered or inactive");
        _;
    }
    
    // Constructor
    constructor() {
        owner = msg.sender;
        donationCounter = 0;
        totalDonationsAmount = 0;
    }
    
    // Functions
    
    /**
     * @dev Register a new charity
     * @param _charityAddress Ethereum address of the charity
     * @param _name Name of the charity
     * @param _ein Employer Identification Number
     */
    function registerCharity(
        address _charityAddress,
        string memory _name,
        string memory _ein
    ) public onlyOwner {
        require(_charityAddress != address(0), "Invalid charity address");
        require(bytes(_name).length > 0, "Charity name cannot be empty");
        require(bytes(_ein).length > 0, "EIN cannot be empty");
        require(einToAddress[_ein] == address(0), "EIN already registered");
        
        registeredCharities[_charityAddress] = Charity({
            walletAddress: _charityAddress,
            name: _name,
            ein: _ein,
            totalReceived: 0,
            donationCount: 0,
            isActive: true
        });
        
        einToAddress[_ein] = _charityAddress;
        
        emit CharityRegistered(_charityAddress, _name, _ein);
    }
    
    /**
     * @dev Make a donation to a registered charity
     * @param _charity Address of the charity
     * @param _charityName Name of the charity
     * @param _charityEIN EIN of the charity
     * @param _fraudScore Fraud score from 0-100
     */
    function makeDonation(
        address _charity,
        string memory _charityName,
        string memory _charityEIN,
        uint256 _fraudScore
    ) public payable {
        require(msg.value > 0, "Donation amount must be greater than 0");
        require(_charity != address(0), "Invalid charity address");
        require(_fraudScore <= 100, "Fraud score must be between 0-100");
        
        donationCounter++;
        
        // Determine status based on fraud score
        string memory status;
        bool isVerified;
        
        if (_fraudScore <= 20) {
            status = "verified";
            isVerified = true;
        } else if (_fraudScore <= 50) {
            status = "pending";
            isVerified = false;
        } else {
            status = "flagged";
            isVerified = false;
        }
        
        // Create donation record
        donations[donationCounter] = Donation({
            id: donationCounter,
            donor: msg.sender,
            charity: _charity,
            amount: msg.value,
            charityName: _charityName,
            charityEIN: _charityEIN,
            timestamp: block.timestamp,
            isVerified: isVerified,
            fraudScore: _fraudScore,
            status: status
        });
        
        // Update mappings
        donorHistory[msg.sender].push(donationCounter);
        totalDonationsAmount += msg.value;
        
        // Update charity stats if registered
        if (registeredCharities[_charity].isActive) {
            registeredCharities[_charity].totalReceived += msg.value;
            registeredCharities[_charity].donationCount++;
        }
        
        // Transfer funds to charity (only if not flagged)
        if (_fraudScore <= 70) {
            payable(_charity).transfer(msg.value);
        }
        
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
        
        // Emit additional event if flagged
        if (_fraudScore > 70) {
            emit DonationFlagged(donationCounter, "High fraud score detected");
        }
    }
    
    /**
     * @dev Manually verify a donation (owner only)
     * @param _donationId ID of the donation to verify
     */
    function verifyDonation(uint256 _donationId) 
        public 
        onlyOwner 
        validDonationId(_donationId) 
    {
        Donation storage donation = donations[_donationId];
        donation.isVerified = true;
        donation.status = "verified";
        
        // Transfer funds if they were held due to fraud concerns
        if (donation.fraudScore > 70) {
            payable(donation.charity).transfer(donation.amount);
        }
        
        emit DonationVerified(_donationId, msg.sender);
    }
    
    /**
     * @dev Get donation details by ID
     * @param _donationId ID of the donation
     * @return Donation struct
     */
    function getDonation(uint256 _donationId) 
        public 
        view 
        validDonationId(_donationId) 
        returns (Donation memory) 
    {
        return donations[_donationId];
    }
    
    /**
     * @dev Get all donation IDs for a specific donor
     * @param _donor Address of the donor
     * @return Array of donation IDs
     */
    function getDonorHistory(address _donor) 
        public 
        view 
        returns (uint256[] memory) 
    {
        return donorHistory[_donor];
    }
    
    /**
     * @dev Get charity information
     * @param _charity Address of the charity
     * @return Charity struct
     */
    function getCharityInfo(address _charity) 
        public 
        view 
        returns (Charity memory) 
    {
        return registeredCharities[_charity];
    }
    
    /**
     * @dev Get total number of donations
     * @return Total donation count
     */
    function getTotalDonations() public view returns (uint256) {
        return donationCounter;
    }
    
    /**
     * @dev Get total amount donated
     * @return Total amount in wei
     */
    function getTotalAmount() public view returns (uint256) {
        return totalDonationsAmount;
    }
    
    /**
     * @dev Emergency function to withdraw stuck funds (owner only)
     * @param _amount Amount to withdraw
     */
    function emergencyWithdraw(uint256 _amount) public onlyOwner {
        require(_amount <= address(this).balance, "Insufficient contract balance");
        payable(owner).transfer(_amount);
    }
    
    /**
     * @dev Change contract ownership
     * @param _newOwner Address of the new owner
     */
    function transferOwnership(address _newOwner) public onlyOwner {
        require(_newOwner != address(0), "Invalid new owner address");
        owner = _newOwner;
    }
    
    /**
     * @dev Deactivate a charity (owner only)
     * @param _charity Address of the charity to deactivate
     */
    function deactivateCharity(address _charity) public onlyOwner {
        registeredCharities[_charity].isActive = false;
    }
    
    // Fallback function to receive ETH
    receive() external payable {
        totalDonationsAmount += msg.value;
    }
}