pragma solidity ^0.4.11;

// import './W3CToken.sol'; <-- Include this for testing purposes

contract W3CToken {
    function transfer(address _to, uint256 _value) returns (bool success);
    function releasePublicToken() returns(bool);
    function addToTokenAllocation(uint256 _amount);
}

/**
 * Overflow aware uint math function.
 *
 * Inspired by https://github.com/MakerDAO/maker-otc/blob/master/contracts/simple_market.sol
 */
contract SafeMath {
  function safeMul(uint a, uint b) internal returns (uint) {
    uint c = a * b;
    assert(a == 0 || c / a == b);
    return c;
  }
}

contract W3CCrowdfund is SafeMath {

    // Reference to the Token contract
    W3CToken public token;
    // Flag to know if the token address is set
    bool public isTokenSet = false;
    // Flag to activate the token
    bool public isCrowdFundActive = false;
    // ICO conversion rate 1 eth = 50000 W3C
    uint public icoConversionRate = 50000;
    //End date of the ICO
    uint public icoEndDate;
    // Address of the Founder's MultiSignature Contract
    address public founderMultiSigAddress;
    // Address of the Token Buyer
    address public tokenBuyer;

    // Events
    event TokensBought(address indexed _buyer, uint _amount, bytes4 indexed _currencyUsed, bytes32 _txHash); 
    event CrowdFundActivated(uint unixTime);

    // Founders have special rights
    modifier onlyFounders {
        require(msg.sender == founderMultiSigAddress);
        _;
    }

    // Some functions are blocked to founders
    modifier notFounders {
        require(msg.sender != founderMultiSigAddress);
        _;
    }

    // Token Buyer has special rights
    modifier onlyTokenBuyer() {
        require(msg.sender == tokenBuyer);
        _;
    }

    // No dust transactions
    modifier nonZeroEth() {
        require(msg.value > 0);
        _;
    }

    // No zero address transaction
    modifier nonZeroAddress(address _to) {
        require(_to != 0x0);
        _;
    }

    // Ensures the token address is set
    modifier tokenIsSet() {
        assert(isTokenSet == true);
        _;
    }

    // Asserts the crowdfund is active
    modifier assertCrowdFundIsActive() {
        assert(isCrowdFundActive == true);
        _;
    }

    // Constructor
    function W3CCrowdfund(address _founderMultiSigAddress) {
        founderMultiSigAddress = _founderMultiSigAddress;
        icoEndDate = now + 30 * 1 days; // ICO ends in 30 days
    }

    // Allows founders to set the token buyer address
    function setTokenBuyer(address _newTokenBuyer) onlyFounders nonZeroAddress(_newTokenBuyer) {
        tokenBuyer = _newTokenBuyer;
    }

    // Allows founders to change their MultiSignature contract address
    function setFounderMultiSigAddress(address _newFounderAddress) onlyFounders nonZeroAddress(_newFounderAddress) {
        founderMultiSigAddress = _newFounderAddress;
    }

    // Sets the Address of the Token contract -- Can only be done once
    function setTokenAddress(address _tokenAddress) external onlyFounders nonZeroAddress(_tokenAddress) {
        assert(isTokenSet == false);
        token = W3CToken(_tokenAddress);
        isTokenSet = true;
    }

    // Activates the crowdfund. Can only be done by the owners
    function changeCrowdfundState() tokenIsSet onlyFounders {
        isCrowdFundActive = !isCrowdFundActive;
    }
    

    // When buying a token after the ICO, the W3C tokens will be pegged at 0.01$ USD.
    // To receive tokens, you will need to send any accepted currency to the one of the founder's address (in that specific currency of course)
    // and record the Transaction Hash. This transaction hash will need to be submitted as part of the transaction for everyone to see.
    // This is not a requirement for Ethereum Addresses.
    // Note: Further explanations will be given on the W3C wallet
    function buyTokens(address _to, uint256 _totalAmount, bytes4 _currency, bytes32 _txHash)
    external
    onlyTokenBuyer
    tokenIsSet
    notFounders
    nonZeroAddress(_to)
    returns(bool) {
        require(now > icoEndDate && _totalAmount > 0);
        
        if(token.transfer(_to, _totalAmount)) {
            token.addToTokenAllocation(_totalAmount);
            TokensBought(_to, _totalAmount, _currency, _txHash);
            return true;
        }
        throw;
    }

    function releasePublicAllocation() onlyTokenBuyer assertCrowdFundIsActive returns(bool) {
        require(now > icoEndDate);
        if(token.releasePublicToken()) {
            return true;
        }
        return false;
    }

    // Second entry to buy tokens, you can send a transaction to this function
    // Buying tokens is a transfer of tokens from the Crowdfund contract's balance to the investor's balance
    // Can only be done in the crowdfund period, and we are only accepting Ether
    function buyIcoTokens()
    nonZeroEth
    assertCrowdFundIsActive
    tokenIsSet
    notFounders
    payable
    returns(bool) {
        
        require(now < icoEndDate);
        founderMultiSigAddress.transfer(msg.value);
        uint amount = safeMul(msg.value, icoConversionRate);
        if(token.transfer(msg.sender, amount)) {
            token.addToTokenAllocation(amount);            
            TokensBought(msg.sender, amount, 'ETH', 'ICO TOKENS');
            return true;
        }
        throw;
    }

    // First entry to buy tokens. Here, all you have to do is send ether to the contract address
    // With at least 200 000 gas
    function() public payable {
        buyIcoTokens();
    }
}