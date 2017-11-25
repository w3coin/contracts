var W3CCrowdfund = artifacts.require("./W3CCrowdfund.sol");
var W3CToken = artifacts.require("./W3CToken.sol");

var BigNumber = require('bignumber.js');

contract("W3CCrowdFund", function(accounts) {
    const founderAddress = accounts[2];
    const otherAddress = accounts[3];
    const crowdFundAddress = '0x0122';
//CREATION  
    it("creation: should create an initial contract with the right founder address and the right end date", function(done) {
        var ctr = null;       
        let now = Date.now();
        W3CCrowdfund.new(founderAddress, {from: accounts[0], gas: 1500000}).then(function(result) {
            ctr = result;            
            return ctr.founderMultiSigAddress.call();
    }).then(function (result) {
            return ctr.icoEndDate.call();
    }).then(function (result) {
        assert.strictEqual(Math.floor(now/1000 + 30*24*60*60), result.toNumber());
        done();
        }).catch(done);
    });

    it("setTokenBuyer: Should let the contract executor to change the tokenBuyer address", function(done) {
        var ctr = null;
        W3CCrowdfund.new(founderAddress, {from: accounts[0]}).then(function(result) {
            ctr = result;
            return ctr.setTokenBuyer(accounts[0], {from: founderAddress});
        }).then(function (result) {
            return ctr.tokenBuyer.call();
        }).then(function (result) {
            assert.strictEqual(result, accounts[0]);
            done();
        }).catch(done);
    });

    it("setTokenBuyer: Should NOT let a random address to change the tokenBuyer address", function(done) {
        var ctr = null;
        W3CCrowdfund.new(founderAddress, {from: accounts[0]}).then(function(result) {
            ctr = result;
            return ctr.setTokenBuyer(accounts[0], {from: accounts[0]});
        }).catch(() => {
            assert(true, true);
            done();
        });
    });

    it("setFounderMultiSigAddress: Should let the contract executor to change the founder address", function(done) {
        var ctr = null;
        W3CCrowdfund.new(founderAddress, {from: accounts[0]}).then(function(result) {
            ctr = result;
            return ctr.setFounderMultiSigAddress(accounts[0], {from: founderAddress});
        }).then(function (result) {
            return ctr.founderMultiSigAddress.call();
        }).then(function (result) {
            assert.strictEqual(result, accounts[0]);
            done();
        }).catch(done);
    });

    it("setFounderMultiSigAddress: Should NOT let a random address to change the founder address", function(done) {
        var ctr = null;
        W3CCrowdfund.new(founderAddress, {from: accounts[0]}).then(function(result) {
            ctr = result;
            return ctr.setFounderMultiSigAddress(accounts[0], {from: accounts[0]});
        }).catch(() => {
            assert(true, true);
            done();
        });
    });

    it("setTokenAddress: Should let the contract founder to set the token address", function(done) {
        var ctr = null;
        W3CCrowdfund.new(founderAddress, {from: accounts[0]}).then(function(result) {
            ctr = result;
            return ctr.setTokenAddress(accounts[1], {from: founderAddress});
        }).then(function (result) {
            return ctr.isTokenSet.call();
        }).then(function (result) {
            assert.strictEqual(result, true);
            return ctr.token.call();
        }).then(function (result) {
            assert.strictEqual(result, accounts[1]);
            done();
        }).catch(done);
    });

    it("setTokenAddress: Should NOT let a random address to set the token address", function(done) {
        var ctr = null;
        W3CCrowdfund.new(founderAddress, {from: accounts[0]}).then(function(result) {
            ctr = result;
            return ctr.setTokenAddress(accounts[1], {from: accounts[0]});
        }).catch(() => {
            assert(true, true);
            done();
        });
    });

    it("setTokenAddress: Should NOT let a founder address to set the token address when token is set", function(done) {
        var ctr = null;
        W3CCrowdfund.new(founderAddress, {from: founderAddress}).then(function(result) {
            ctr = result;
            return ctr.setTokenAddress(founderAddress, {from: accounts[0]});
        }).then(() => {
            return ctr.setTokenAddress(founderAddress, {from: accounts[0]});
        }).catch(() => {
            assert(true, true);
            done();
        });
    });

    it("changeCrowdfundState: Should let the contract founder to activate the crowdfund", function(done) {
        var ctr = null;
        W3CCrowdfund.new(founderAddress, {from: accounts[0]}).then(function(result) {
            ctr = result;
            return ctr.setTokenAddress(accounts[1], {from: founderAddress});
        }).then(function (result) {
            return ctr.isTokenSet.call();
        }).then(function (result) {
            assert.strictEqual(result, true);
            return ctr.token.call();
        }).then(function (result) {
            assert.strictEqual(result, accounts[1]);
            return ctr.changeCrowdfundState({from: founderAddress});
        }).then(function (result) {
            return ctr.isCrowdFundActive.call();
        }).then(function (result) {
            assert.strictEqual(result, true);
            done();
        }).catch(done);
    });

    it("changeCrowdfundState: Should NOT let a random address activate the crowdfund", function(done) {
        var ctr = null;
        W3CCrowdfund.new(founderAddress, {from: accounts[0]}).then(function(result) {
            ctr = result;
            return ctr.setTokenAddress(accounts[1], {from: founderAddress});
        }).then(function (result) {
            return ctr.isTokenSet.call();
        }).then(function (result) {
            assert.strictEqual(result, true);
            return ctr.token.call();
        }).then(function (result) {
            assert.strictEqual(result, accounts[1]);
            return ctr.changeCrowdfundState({from: accounts[3]});
        }).catch(() => {
            assert(true, true);
            done();
        });
    });

    it("changeCrowdfundState: Should NOT let the contract founder to activate the crowdfund if token is not set", function(done) {
        var ctr = null;
        W3CCrowdfund.new(founderAddress, {from: accounts[0]}).then(function(result) {
            ctr = result;
            return ctr.changeCrowdfundState({from: founderAddress});
         }).catch(() => {
            assert(true, true);
            done();
        });
    });

    it("buyIcoTokens: should let me buy tokens at the right conversion rate", function(done) {
        var ctr, token;
        let initialEth = web3.eth.getBalance(founderAddress);
        W3CCrowdfund.new(founderAddress, {from: founderAddress}).then(function(result) {
            let initialEth;
            ctr = result;
            return W3CToken.new(founderAddress, result.address, {from: accounts[0]})
        }).then(function (result) {
            token = result;
            return ctr.setTokenAddress(result.address, {from: founderAddress});
        }).then(function (result) {
            return ctr.changeCrowdfundState({from: founderAddress});
        }).then(function (result) {
            return ctr.buyIcoTokens(accounts[0], {value: new BigNumber(1).times(new BigNumber(10).pow(18)), from: accounts[0]});
        }).then(function (result) {
            return web3.eth.getBalance(founderAddress);
        }).then(function (result) {
            assert.closeTo((result.minus(initialEth).dividedBy(new BigNumber(10).pow(18))).toNumber(), 1, 0.1)
            return token.balanceOf.call(accounts[0]);
        }).then(function (result) {
            assert.strictEqual(result.dividedBy(new BigNumber(10).pow(18)).toNumber(), 50000);
            return token.totalAllocatedTokens.call();
        }).then(function (result) {
            assert.strictEqual(result.dividedBy(new BigNumber(10).pow(18)).toNumber(), 30000050000);
            done();
        }).catch(done);
    });

    it("buyIcoTokens: should NOT let me buy tokens at the right conversion rate -- crowdfund is done", function(done) {
        var ctr, token;
        let initialEth = web3.eth.getBalance(founderAddress);
        W3CCrowdfund.new(founderAddress, {from: founderAddress}).then(function(result) {
            let initialEth;
            ctr = result;
            return W3CToken.new(founderAddress, result.address, {from: accounts[0]})
        }).then(function (result) {
            token = result;
            return ctr.setTokenAddress(result.address, {from: founderAddress});
        }).then(function (result) {
            return ctr.changeCrowdfundState({from: founderAddress});
                   }).then(function (result) {
            assert.strictEqual(result, accounts[7]);
            return new Promise((resolve,reject) => {
                web3.currentProvider.sendAsync({
                jsonrpc: "2.0",
                method: "evm_increaseTime",
                params: [(30*24*60*60 + 100)] // 100 seconds after the crowdfund ended
            }, function(err, result) {
                if(err) {
                    reject(err);
                }
                resolve(result);
                });
            });
        }).then(function (result) {
            return ctr.buyIcoTokens(accounts[0], {value: new BigNumber(1).times(new BigNumber(10).pow(18)), from: accounts[0]});
        }).catch(function (result) {
            assert(true, true)
            done();
        })
    });

    it("buyIcoTokens: should NOT let me buy tokens at the right conversion rate -- no token address", function(done) {
        var ctr;
        var token;
        W3CCrowdfund.new(founderAddress, {from: founderAddress}).then(function(result) {
            let initialEth;
            ctr = result;
            return W3CToken.new(founderAddress, result.address, {from: accounts[0]})
        }).then(function (result) {
            token = result;
            return ctr.changeCrowdfundState({from: founderAddress});
        }).then(function (result) {
            return ctr.buyIcoTokens(accounts[0], {value: new BigNumber(1).times(new BigNumber(10).pow(18)), from: accounts[0]});
        }).catch(function (result) {
            assert(true, true)
            done();
        }).catch(done);
    });

    it("buyIcoTokens: should NOT let me buy tokens at the right conversion rate -- crowdfund not activated", function(done) {
        var ctr;
        var token;
        W3CCrowdfund.new(founderAddress, {from: founderAddress}).then(function(result) {
            let initialEth;
            ctr = result;
            return W3CToken.new(founderAddress, result.address, {from: accounts[0]})
        }).then(function (result) {
            token = result;
            return ctr.setTokenAddress(result.address, {from: founderAddress});
        }).then(function (result) {
            return ctr.buyIcoTokens(accounts[0], {value: new BigNumber(1).times(new BigNumber(10).pow(18)), from: accounts[0]});
         }).catch(function (result) {
            assert(true, true)
            done();
        }).catch(done);
    });

    it("buyTokens: should let me buy tokens with any crypto", function(done) {
        var ctr, token;
        let initialEth = web3.eth.getBalance(founderAddress);
        W3CCrowdfund.new(founderAddress, {from: founderAddress}).then(function(result) {
            let initialEth;
            ctr = result;
            return W3CToken.new(founderAddress, result.address, {from: accounts[0]})
        }).then(function (result) {
            token = result;
            return ctr.setTokenAddress(result.address, {from: founderAddress});
        }).then(function (result) {
            return ctr.changeCrowdfundState({from: founderAddress});
        }).then(function (result) {
            return ctr.setTokenBuyer(accounts[7], {from: founderAddress});
        }).then(function (result) {
            return ctr.tokenBuyer.call();
        }).then(function (result) {
            assert.strictEqual(result, accounts[7]);
            return new Promise((resolve,reject) => {
                web3.currentProvider.sendAsync({
                jsonrpc: "2.0",
                method: "evm_increaseTime",
                params: [(30*24*60*60 + 100)] // 100 seconds after the crowdfund ended
            }, function(err, result) {
                if(err) {
                    reject(err);
                }
                resolve(result);
                });
            });
        }).then(function (result) {
            return ctr.releasePublicAllocation({from: accounts[7]});
        }).then(function (result) {
            return ctr.buyTokens(accounts[0], (new BigNumber(10)).times(new BigNumber(10).pow(18)), 'BTC', '0x4ad593e3b0f41cecd0de314c8e701361d3ad850f6bf252af4da9ef3a39fc6988',  {from: accounts[7]}); // 1 BTC ~= 10 ETH
        }).then(function (result) {
            return token.balanceOf.call(accounts[0]);
        }).then(function (result) {
            assert.strictEqual(result.dividedBy(new BigNumber(10).pow(18)).toNumber(), 10);
            done();
        }).catch(done);
    });

    it("buyTokens: should NOT let me buy tokens with any crypto -- not buyer address", function(done) {
        var ctr, token;
        let initialEth = web3.eth.getBalance(founderAddress);
        W3CCrowdfund.new(founderAddress, {from: founderAddress}).then(function(result) {
            let initialEth;
            ctr = result;
            return W3CToken.new(founderAddress, result.address, {from: accounts[0]})
        }).then(function (result) {
            token = result;
            return ctr.setTokenAddress(result.address, {from: founderAddress});
        }).then(function (result) {
            return ctr.changeCrowdfundState({from: founderAddress});
        }).then(function (result) {
            return ctr.setTokenBuyer(accounts[7], {from: founderAddress});
        }).then(function (result) {
            return ctr.tokenBuyer.call();
        }).then(function (result) {
            assert.strictEqual(result, accounts[7]);
            return new Promise((resolve,reject) => {
                web3.currentProvider.sendAsync({
                jsonrpc: "2.0",
                method: "evm_increaseTime",
                params: [(31*24*60*60)]
            }, function(err, result) {
                if(err) {
                    reject(err);
                }
                resolve(result);
                });
            });
        }).then(function (result) {
            return ctr.releasePublicAllocation({from: accounts[7]});
        }).then(function (result) {
            return ctr.buyTokens(accounts[0], (new BigNumber(10)).times(new BigNumber(10).pow(18)), 'BTC', '0x4ad593e3b0f41cecd0de314c8e701361d3ad850f6bf252af4da9ef3a39fc6988',  {from: accounts[0]}); // 1 BTC ~= 10 ETH
        }).catch(function (result) {
            return token.balanceOf.call(accounts[0]);
        }).then(function (result) {
            assert.strictEqual(result.dividedBy(new BigNumber(10).pow(18)).toNumber(), 0);
            done();
        }).catch(done);
    });

    it("buyTokens: should NOT let me buy tokens with any crypto -- ICO not done", function(done) {
        var ctr, token;
        let initialEth = web3.eth.getBalance(founderAddress);
        W3CCrowdfund.new(founderAddress, {from: founderAddress}).then(function(result) {
            let initialEth;
            ctr = result;
            return W3CToken.new(founderAddress, result.address, {from: accounts[0]})
        }).then(function (result) {
            token = result;
            return ctr.setTokenAddress(result.address, {from: founderAddress});
        }).then(function (result) {
            return ctr.changeCrowdfundState({from: founderAddress});
        }).then(function (result) {
            return ctr.setTokenBuyer(accounts[7], {from: founderAddress});
        }).then(function (result) {
            return ctr.releasePublicAllocation({from: accounts[7]});
        }).catch((result) => {
            assert(true, true);
            done()
        });
    });

    it("function(): should throw on an undetermined call", function(done) {
        var ctr;
     W3CCrowdfund.new(founderAddress, {from: founderAddress}).then(function(result) {
            ctr = result;
            return ctr.call();
        }).catch(function (result) {
            assert.equal(true, true);
            done();
        })
    });

    it("releasePublicAllocation: should release public tokens", function(done) {
        var ctr, token;
        let initialEth = web3.eth.getBalance(founderAddress);
        W3CCrowdfund.new(founderAddress, {from: founderAddress}).then(function(result) {
            let initialEth;
            ctr = result;
            return W3CToken.new(founderAddress, result.address, {from: accounts[0]})
        }).then(function (result) {
            token = result;
            return ctr.setTokenAddress(result.address, {from: founderAddress});
        }).then(function (result) {
            return ctr.changeCrowdfundState({from: founderAddress});
        }).then(function (result) {
            return ctr.setTokenBuyer(accounts[7], {from: founderAddress});
        }).then(function (result) {
            return new Promise((resolve,reject) => {
                web3.currentProvider.sendAsync({
                jsonrpc: "2.0",
                method: "evm_increaseTime",
                params: [(31*24*60*60)]
            }, function(err, result) {
                if(err) {
                    reject(err);
                }
                resolve(result);
                });
            });
        }).then(function (result) {
            return ctr.releasePublicAllocation({from: accounts[7]});
        }).then(function (result) {
            return token.balanceOf(ctr.address);
        }).then((result) => {
            assert.deepEqual(result.dividedBy(new BigNumber(10).pow(18)).toNumber(), 155000000000);
            done();
        })
    });

    it("releasePublicAllocation: should NOT release the public tokens", function(done) {
        var ctr;
        W3CToken.new(founderAddress, crowdFundAddress, {from: founderAddress}).then(function(result) {
            ctr = result;
            return ctr.releasePublicAllocation({from: accounts[0]});
        }).catch(function (result) {
            assert.equal(true, true);
            done();
        })
    });
});