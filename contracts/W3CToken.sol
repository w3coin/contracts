pragma solidity ^0.4.11;

contract Token {
    /// @return total supply of tokens
    function totalSupply() constant returns (uint256 supply);

    /// @param _owner The address from which the balance will be retrieved
    /// @return The balance
    function balanceOf(address _owner) constant returns (uint256 balance);

    /// @notice send `_value` token to `_to` from `msg.sender`
    /// @param _to The address of the recipient
    /// @param _value The amount of token to be transferred
    /// @return Whether the transfer was successful or not
    function transfer(address _to, uint256 _value) returns (bool success);

    /// @notice send `_value` token to `_to` from `_from` on the condition it is approved by `_from`
    /// @param _from The address of the sender
    /// @param _to The address of the recipient
    /// @param _value The amount of token to be transferred
    /// @return Whether the transfer was successful or not
    function transferFrom(address _from, address _to, uint256 _value) returns (bool success);

    /// @notice `msg.sender` approves `_spender` to spend `_value` tokens
    /// @param _spender The address of the account able to transfer the tokens
    /// @param _value The amount of tokens to be approved for transfer
    /// @return Whether the approval was successful or not
    function approve(address _spender, uint256 _value) returns (bool success);

    /// @param _owner The address of the account owning tokens
    /// @param _spender The address of the account able to transfer the tokens
    /// @return Amount of remaining tokens allowed to spent
    function allowance(address _owner, address _spender) constant returns (uint256 remaining);

    event Transfer(address indexed _from, address indexed _to, uint256 _value);
    event Approval(address indexed _owner, address indexed _spender, uint256 _value);
}

/**
 * ERC 20 token
 *
 * https://github.com/ethereum/EIPs/issues/20
 *
 * All functions are integer overflow aware
 * And has the ability to freeze transactions as needed
 */
contract StandardToken is Token {
    // Store of every account's balance
    mapping(address => uint256) balances;
    // Store of allowance that an account can give to another account
    mapping (address => mapping (address => uint256)) allowed;
    // Tracker of total current allocations
    uint256 public totalAllocatedTokens;
    // Flag for the transfers to be active or inactive
    bool public isActive = true;

    function transfer(address _to, uint256 _value) returns (bool success) {
        if (balances[msg.sender] >= _value && balances[_to] + _value > balances[_to]) {
            balances[msg.sender] -= _value;
            balances[_to] += _value;
            Transfer(msg.sender, _to, _value);
            return true;
        } else { return false; }
    }

    function transferFrom(address _from, address _to, uint256 _value) returns (bool success) {
        if (balances[_from] >= _value && allowed[_from][msg.sender] >= _value && balances[_to] + _value > balances[_to]) {
            balances[_to] += _value;
            balances[_from] -= _value;
            allowed[_from][msg.sender] -= _value;
            Transfer(_from, _to, _value);
            return true;
        } else { return false; }
    }

    function balanceOf(address _owner) constant returns (uint256 balance) {
        return balances[_owner];
    }

    function approve(address _spender, uint256 _value) returns (bool success) {
        // To change the approve amount you first have to reduce the addresses`
        //  allowance to zero by calling `approve(_spender, 0)` if it is not
        //  already 0 to mitigate the race condition described here:
        //  https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
        if ((_value != 0) && (allowed[msg.sender][_spender] != 0)) throw;

        allowed[msg.sender][_spender] = _value;
        Approval(msg.sender, _spender, _value);
        return true;
    }

    function allowance(address _owner, address _spender) constant returns (uint256 remaining) {
      return allowed[_owner][_spender];
    }

    function totalSupply() constant returns (uint256 supply){
        return totalAllocatedTokens;
    }

}

contract W3CToken is StandardToken {
    // Standard ERC20 Contract Variables
    string public constant name = 'W3C';
    uint8 public constant decimals = 18;
    string public constant symbol = 'W3C';


    // Address of the founder's multi signature wallet
    // All deposited Ether will be forwarded to it
    // Also has special access rights
    address public founderMultiSigAddress;
    // Address of the crowdfund contract
    address public crowdFundAddress;
    // reserve fund, released by W3
    uint256 public reserveFund;
    // Market Makers Allocation, released by W3
    uint256 public marketMakersAllocation;
    // Total amount of Public Tokens released by W3 for the public
    uint256 public amountOfPublicTokensToAllocate;
    // Total amount of tokens
    uint256 public maxSupply;
    // Flag that informs on if the 75% of the tokens are released to the public
    bool public isPublicTokenReleased = false;

    // Events
    event PublicTokensReleased(uint _blockNumber);
    event founderMultiSigAddressChanged(address _to);
    event MarketMakerAllocationTransferred(uint _blockNumber, uint _amount);
    event ReserveFundTransferred(uint _blockNumber, uint _amount);
    
    // Only the founder's address has special rights
    modifier onlyFounders() {
        require(msg.sender == founderMultiSigAddress);
        _;
    }

    // Ensure no zero address, for user protection
    modifier nonZeroAddress(address _to) {
        require(_to != 0x0);
        _;
    }
    // Can only be done by the crowdfunding contract
    modifier onlyCrowdfundContract() {
        require(msg.sender == crowdFundAddress);
        _;
    }

    // Constructor
    function W3CToken(address _founderMultiSigAddress, address _crowdFundAddress) {
        founderMultiSigAddress = _founderMultiSigAddress;
        crowdFundAddress = _crowdFundAddress;
        maxSupply = 2 * 10**29; // 100% of the tokens
        amountOfPublicTokensToAllocate = 1.5 * 10**29; // 75%
        balances[_founderMultiSigAddress] = 3 * 10**28; // 15%
        reserveFund = 1 * 10**28; // 5%
        marketMakersAllocation = 5 * 10**27; // 2.5%
        balances[crowdFundAddress] = 5 * 10**27; // 2.5%
        totalAllocatedTokens = balances[_founderMultiSigAddress];
    }

    // Changes the state from active to inactive to allow transactions
    function changeState() onlyFounders {
        isActive = !isActive;
    }

    // Called to keep track of tokens in circulation
    function addToTokenAllocation(uint256 _amount) onlyCrowdfundContract {
        totalAllocatedTokens += _amount;
    }

    // Allows the founders to change the address that receives ether and has special permissions
    function setFounderMultiSigAddress(address _newfounderMultiSigAddress) onlyFounders nonZeroAddress(_newfounderMultiSigAddress) {
        founderMultiSigAddress = _newfounderMultiSigAddress;
        founderMultiSigAddressChanged(founderMultiSigAddress);
    }

    // Extra logic added to transfer
    function transfer(address _to, uint256 _value) returns (bool success) {
        if(msg.sender == crowdFundAddress || isActive) {
            return super.transfer(_to, _value);
        } else {
            return false;
        }
    }

    // Extra logic added to transferFrom
    function transferFrom(address _from, address _to, uint256 _value) returns (bool success) {
        if(msg.sender == crowdFundAddress || isActive) {
            return super.transferFrom(_from, _to, _value);
        } else {
            return false;
        }
    }

    // Allows the founders to transfer tokens for Market Makers
    function transferMarketMakersAllocation(address _to, uint _value) onlyFounders nonZeroAddress(_to) returns(bool) {
        if (marketMakersAllocation >= _value) {
            marketMakersAllocation -= _value;
            balances[_to] += _value;
            totalAllocatedTokens += _value;
            MarketMakerAllocationTransferred(now, _value);
            return true;
        }
        return false;
    }

    // Allows the founders to transfer the Reserve tokens
    function transferReserveFunds(address _to, uint _value) onlyFounders  nonZeroAddress(_to) returns(bool) {
        if (reserveFund >= _value) {
            reserveFund -= _value;
            balances[_to] += _value;
            totalAllocatedTokens += _value;
            ReserveFundTransferred(now, _value);
            return true;
        }
        return false;
    }

    // Releases the 75% of Tokens allocated to the public. Can only be called once
    // and only by the crowdfunding contract
    function releasePublicToken() onlyCrowdfundContract returns(bool) {
        if(isPublicTokenReleased) {
            return false;
        }
        isPublicTokenReleased = true;
        balances[crowdFundAddress] += amountOfPublicTokensToAllocate;
        amountOfPublicTokensToAllocate = 0;
        PublicTokensReleased(now);
        return true;
    }

    // No direct contract deposits are allowed
    function() {
        throw;
    }
}
