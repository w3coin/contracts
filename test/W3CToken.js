var W3CToken = artifacts.require("./W3CToken.sol");
var BigNumber = require('bignumber.js');

contract("W3CToken", function(accounts) {
    const founderAddress = accounts[2];
    const executorAddress = accounts[3];
    const crowdFundAddress = accounts[5];
    const crowdfund = accounts[8];
//CREATION

    it("creation: should create an initial balance of 30 bil for the founder address", function(done) {
        W3CToken.new(founderAddress, crowdFundAddress, {from: accounts[0], gas: 1500000}).then(function(ctr) {
            return ctr.balanceOf.call(founderAddress);
    }).then(function (result) {
        assert.strictEqual(result.dividedBy(new BigNumber(10).pow(18)).toNumber(), 30000000000);
        done();
        }).catch(done);
    });

    it("creation: should create an initial balance of 5 bil for the crowdfund address", function(done) {
        W3CToken.new(founderAddress, crowdFundAddress, {from: accounts[0], gas: 2000000}).then(function(ctr) {
            return ctr.balanceOf.call(crowdFundAddress);
    }).then(function (result) {
        assert.strictEqual(result.dividedBy(new BigNumber(10).pow(18)).toNumber(), 5000000000);
        done();
        }).catch(done);
    });

    it("creation: should start with a totalSupply of 30 bil", function(done) {
        W3CToken.new(founderAddress, crowdFundAddress, {from: accounts[0], gas: 2000000}).then(function(ctr) {
            return ctr.totalSupply.call();
    }).then(function (result) {
        assert.strictEqual(result.dividedBy(new BigNumber(10).pow(18)).toNumber(), 30000000000);
        done();
        }).catch(done);
    });

    it("creation: test correct setting of vanity information", function(done) {
      var ctr;
        W3CToken.new(founderAddress, crowdFundAddress, {from: accounts[0]}).then(function(result) {
            ctr = result;
            return ctr.name.call();
    }).then(function (result) {
        assert.strictEqual(result, 'W3C');
        return ctr.decimals.call();
    }).then(function(result) {
        assert.strictEqual(result.toNumber(), 18);
        return ctr.symbol.call();
    }).then(function(result) {
        assert.strictEqual(result, 'W3C');
        done();
        }).catch(done);
    });


//TRANSFERS


    it("transfers: ether transfer should be reversed.", function(done) {
        var ctr;
        W3CToken.new(founderAddress, crowdFundAddress, {from: accounts[0],  gas: 2000000}).then(function(result) {
            ctr = result;
            return web3.eth.sendTransaction({from: accounts[0], to: ctr.address, value: web3.toWei("10", "Ether")});
        }).catch(function(result) {
            done();
        }).catch(done);
    });

    it("transfers: should transfer 10000 to accounts[1] with accounts[0] having 10000", function(done) {
        var ctr;
        W3CToken.new(founderAddress, crowdFundAddress, {from: founderAddress}).then(function(result) {
            ctr = result;
            return ctr.transfer(accounts[1], 10000, {from: founderAddress});
        }).then(function (result) {
            return ctr.balanceOf.call(accounts[1]);
        }).then(function (result) {
            assert.strictEqual(result.toNumber(), 10000);
            done();
        }).catch(done);
    });

    it("transfers: should fail transfer 10000 to accounts[1] with accounts[0] having 10000, inactive flag is on", function(done) {
        var ctr;
        W3CToken.new(founderAddress, crowdFundAddress, {from: founderAddress}).then(function(result) {
            ctr = result;
            return ctr.changeState({from: founderAddress});
        }).then(function (result) {
            return ctr.transfer(accounts[1], 10000, {from: founderAddress});
        }).then(function (result) {
            return ctr.balanceOf.call(accounts[1]);
        }).then(function (result) {
            assert.strictEqual(result.toNumber(), 0);
            done();
        }).catch(done);
    });

    it("transfers: should fail when trying to transfer 30000000001 to accounts[1] with accounts[0] having 30000000000", function(done) {
        var ctr;
        W3CToken.new(founderAddress, crowdFundAddress, {from: accounts[0]}).then(function(result) {
            ctr = result;
            return ctr.transfer.call(accounts[1], new BigNumber(30000000001).times(new BigNumber(10).pow(18)), {from: founderAddress});
        }).then(function (result) {
            assert.isFalse(result);
            done();
        }).catch(done);
    });

    it("transfers: should fail when trying to transfer zero.", function(done) {
        var ctr;
        W3CToken.new(founderAddress, crowdFundAddress, {from: accounts[0]}).then(function(result) {
            ctr = result;
            return ctr.transfer.call(accounts[1], 0, {from: accounts[0]});
        }).then(function (result) {
            assert.isFalse(result);
            done();
        }).catch(done);
    });


// APPROVALS

    it("approvals: msg.sender should approve 100 to accounts[1]", function(done) {
        var ctr = null;
        W3CToken.new(founderAddress, crowdFundAddress, {from: founderAddress}).then(function(result) {
            ctr = result;
            return ctr.approve(accounts[1], 100, {from: accounts[0]});
        }).then(function (result) {
            return ctr.allowance.call(accounts[0], accounts[1]);
        }).then(function (result) {
            assert.strictEqual(result.toNumber(), 100);
            done();
        }).catch(done);
    });

    it("approvals: msg.sender approves accounts[1] of 100 & withdraws 20 once.", function(done) {
        var ctr = null;
        W3CToken.new(founderAddress, crowdFundAddress, {from: accounts[0]}).then(function(result) {
            ctr = result;
            return ctr.balanceOf.call(accounts[0]);
        }).then(function (result) {
            assert.strictEqual(result.toNumber(), 0);
            return ctr.transfer(accounts[0], 10000, {from: founderAddress});
        }).then(function (result) {
            return ctr.balanceOf.call(accounts[0]);
        }).then(function (result) {
            assert.strictEqual(result.toNumber(), 10000);
            return ctr.approve(accounts[1], 100, {from: accounts[0]});
        }).then(function (result) {
            return ctr.balanceOf.call(accounts[4]);
        }).then(function (result) {
            assert.strictEqual(result.toNumber(), 0);
            return ctr.allowance.call(accounts[0], accounts[1]);
        }).then(function (result) {
            assert.strictEqual(result.toNumber(), 100);
            return ctr.transferFrom.call(accounts[0], accounts[4], 20, {from: accounts[1]});
        }).then(function (result) {
            return ctr.transferFrom(accounts[0], accounts[4], 20, {from: accounts[1]});
        }).then(function (result) {
            return ctr.allowance.call(accounts[0], accounts[1]);
        }).then(function (result) {
            assert.strictEqual(result.toNumber(), 80);
            return ctr.balanceOf.call(accounts[4]);
        }).then(function (result) {
            assert.strictEqual(result.toNumber(), 20);
            return ctr.balanceOf.call(accounts[0]);
        }).then(function (result) {
            assert.strictEqual(result.toNumber(), 9980);
            done();
        }).catch(done);
    });

    it("approvals: msg.sender approves accounts[1] of 100 & withdraws 20 twice.", function(done) {
        var ctr = null;
        W3CToken.new(founderAddress, crowdFundAddress, {from: accounts[0]}).then(function(result) {
            ctr = result;
            return ctr.approve(accounts[1], new BigNumber(100).times(new BigNumber(10).pow(18)), {from: founderAddress});
        }).then(function (result) {
            return ctr.allowance.call(founderAddress, accounts[1]);
        }).then(function (result) {
            assert.strictEqual(result.dividedBy(new BigNumber(10).pow(18)).toNumber(), 100);
            return ctr.transferFrom(founderAddress, accounts[0], new BigNumber(20).times(new BigNumber(10).pow(18)).toNumber(), {from: accounts[1]});
        }).then(function (result) {
            return ctr.allowance.call(founderAddress, accounts[1]);
        }).then(function (result) {
            assert.strictEqual(result.dividedBy(new BigNumber(10).pow(18)).toNumber(), 80);
            return ctr.balanceOf.call(accounts[0]);
        }).then(function (result) {
            assert.strictEqual(result.dividedBy(new BigNumber(10).pow(18)).toNumber(), 20);
            return ctr.balanceOf.call(founderAddress);
        }).then(function (result) {
            assert.strictEqual(result.dividedBy(new BigNumber(10).pow(18)).toNumber(), 29999999980);
            return ctr.transferFrom(founderAddress, accounts[0], new BigNumber(20).times(new BigNumber(10).pow(18)).toNumber(), {from: accounts[1]});
        }).then(function (result) {
            return ctr.allowance.call(founderAddress, accounts[1]);
        }).then(function (result) {
            assert.strictEqual(result.dividedBy(new BigNumber(10).pow(18)).toNumber(), 60);
            return ctr.balanceOf.call(accounts[0]);
        }).then(function (result) {
            assert.strictEqual(result.dividedBy(new BigNumber(10).pow(18)).toNumber(), 40);
            return ctr.balanceOf.call(founderAddress);
        }).then(function (result) {
            assert.strictEqual(result.dividedBy(new BigNumber(10).pow(18)).toNumber(), 29999999960);
            done();
        }).catch(done);
    });

    it("approvals: msg.sender approves accounts[1] of 100 & withdraws 50 & 60 (2nd tx should fail)", function(done) {
        var ctr = null;
        W3CToken.new(founderAddress, crowdFundAddress, {from: accounts[0]}).then(function(result) {
            ctr = result;
            return ctr.approve(accounts[1], new BigNumber(100).times(new BigNumber(10).pow(18)), {from: founderAddress});
        }).then(function (result) {
            return ctr.allowance.call(founderAddress, accounts[1]);
        }).then(function (result) {
            assert.strictEqual(result.dividedBy(new BigNumber(10).pow(18)).toNumber(), 100);
            return ctr.transferFrom(founderAddress, accounts[0], new BigNumber(50).times(new BigNumber(10).pow(18)), {from: accounts[1]});
        }).then(function (result) {
            return ctr.allowance.call(founderAddress, accounts[1]);
        }).then(function (result) {
            assert.strictEqual(result.dividedBy(new BigNumber(10).pow(18)).toNumber(), 50);
            return ctr.balanceOf.call(accounts[0]);
        }).then(function (result) {
            assert.strictEqual(result.dividedBy(new BigNumber(10).pow(18)).toNumber(), 50);
            return ctr.balanceOf.call(founderAddress);
        }).then(function (result) {
            assert.strictEqual(result.dividedBy(new BigNumber(10).pow(18)).toNumber(), 29999999950);
            //FIRST tx done.
            //onto next.
            return ctr.transferFrom.call(founderAddress, accounts[0], new BigNumber(60).times(new BigNumber(10).pow(18)), {from: accounts[1]});
        }).then(function (result) {
            assert.isFalse(result);
            done();
        }).catch(done);
    });

    it("approvals: attempt withdrawal from account with no allowance (should fail)", function(done) {
        var ctr = null;
        W3CToken.new(founderAddress, crowdFundAddress, {from: accounts[0]}).then(function(result) {
            ctr = result;
            return ctr.transferFrom.call(accounts[0], accounts[2], 60, {from: accounts[1]});
        }).then(function (result) {
              assert.isFalse(result);
              done();
        }).catch(done);
    });

    it("approvals: allow accounts[1] 100 to withdraw from accounts[0]. Withdraw 60 and then approve 0 & attempt transfer.", function(done) {
        var ctr = null;
        W3CToken.new(founderAddress, crowdFundAddress, {from: accounts[0]}).then(function(result) {
            ctr = result;
            return ctr.approve(accounts[1], 100, {from: accounts[0]});
        }).then(function (result) {
            return ctr.transferFrom(accounts[0], accounts[2], 60, {from: accounts[1]});
        }).then(function (result) {
            return ctr.approve(accounts[1], 0, {from: accounts[0]});
        }).then(function (result) {
            return ctr.transferFrom.call(accounts[0], accounts[2], 10, {from: accounts[1]});
        }).then(function (result) {
              assert.isFalse(result);
              done();
        }).catch(done);
    });

    it("approvals: approve max (2^256 - 1)", function(done) {
        var ctr = null;
        W3CToken.new(founderAddress, crowdFundAddress, {from: accounts[0]}).then(function(result) {
            ctr = result;
            return ctr.approve(accounts[1],'115792089237316195423570985008687907853269984665640564039457584007913129639935' , {from: accounts[0]});
        }).then(function (result) {
            return ctr.allowance(accounts[0], accounts[1]);
        }).then(function (result) {
            var match = result.equals('1.15792089237316195423570985008687907853269984665640564039457584007913129639935e+77');
            assert.isTrue(match);
            done();
        }).catch(done);
    });

    it("changeState: Should let the contract executor to change state of the contract", function(done) {
        var ctr = null;
        W3CToken.new(founderAddress, crowdFundAddress, {from: accounts[0]}).then(function(result) {
            ctr = result;
            return ctr.isActive.call();
        }).then(function (result) {
            assert.strictEqual(result, true);
            return ctr.changeState({from: founderAddress});
        }).then(function (result) {
            return ctr.isActive.call();
        }).then(function (result) {
            assert.strictEqual(result, false);
            return ctr.changeState({from: founderAddress});
        }).then(function (result) {
            return ctr.isActive.call();
        }).then(function (result) {
            assert.strictEqual(result, true);
            return ctr.changeState({from: accounts[0]});
        }).catch(function (result) {
            assert.strictEqual(true, true);
            done();
        });
    });

    it("setFounderMultiSigAddress: Should let the contract executor to change the founder address", function(done) {
        var ctr = null;
        W3CToken.new(founderAddress, crowdFundAddress, {from: accounts[0]}).then(function(result) {
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
        W3CToken.new(founderAddress, crowdFundAddress, {from: accounts[0]}).then(function(result) {
            ctr = result;
            return ctr.setFounderMultiSigAddress(accounts[0], {from: accounts[0]});
        }).catch(() => {
            assert(true, true);
            done();
        });
    });

    it("transferMarketMakersAllocation: should transfer 10000 to accounts[1]", function(done) {
        var ctr;
        W3CToken.new(founderAddress, crowdFundAddress, {from: founderAddress}).then(function(result) {
            ctr = result;
            return ctr.transferMarketMakersAllocation(accounts[1], 10000, {from: founderAddress});
        }).then(function (result) {
            return ctr.balanceOf.call(accounts[1]);
        }).then(function (result) {
            assert.strictEqual(result.toNumber(), 10000);
            done();
        }).catch(done);
    });

    it("transferMarketMakersAllocation: should transfer 10000 to accounts[1] -- Error", function(done) {
        var ctr;
        W3CToken.new(founderAddress, crowdFundAddress, {from: founderAddress}).then(function(result) {
            ctr = result;
            return ctr.transferMarketMakersAllocation(accounts[1], 10000, {from: accounts[0]});
        }).catch(function (result) {
            assert.equal(true, true);
            done();
        })
    });

    it("transferReserveFunds: should transfer 10000 to accounts[1]", function(done) {
        var ctr;
        W3CToken.new(founderAddress, crowdFundAddress, {from: founderAddress}).then(function(result) {
            ctr = result;
            return ctr.transferReserveFunds(accounts[1], 10000, {from: founderAddress});
        }).then(function (result) {
            return ctr.balanceOf.call(accounts[1]);
        }).then(function (result) {
            assert.strictEqual(result.toNumber(), 10000);
            done();
        }).catch(done);
    });

    it("transferReserveFunds: should transfer 10000 to accounts[1] -- Error", function(done) {
        var ctr;
        W3CToken.new(founderAddress, crowdFundAddress, {from: founderAddress}).then(function(result) {
            ctr = result;
            return ctr.transferReserveFunds(accounts[1], 10000, {from: accounts[0]});
        }).catch(function (result) {
            assert.equal(true, true);
            done();
        })
    });

    it("releasePublicToken: should release the 75% allocation to the public", function(done) {
        var ctr;
        W3CToken.new(founderAddress, crowdfund, {from: founderAddress}).then(function(result) {
            ctr = result;
            return ctr.isPublicTokenReleased.call();
        }).then(function (result) {
            assert.equal(result, false);
            return ctr.releasePublicToken({from: crowdfund});
        }).then(function (result) {
            return ctr.isPublicTokenReleased.call();
        }).then(function (result) {
            assert.equal(result, true);
            return ctr.balanceOf.call(crowdfund, {from: crowdfund});
        }).then(function (result) {
            assert.equal(result.dividedBy(new BigNumber(10).pow(18)).toNumber(), 155000000000);
            return ctr.releasePublicToken({from: crowdfund});
        }).then(function (result) {
            return ctr.isPublicTokenReleased.call();
        }).then(function (result) {
            assert.equal(result, true);
            return ctr.balanceOf.call(crowdfund);
        }).then(function (result) {
            assert.equal(result.dividedBy(new BigNumber(10).pow(18)).toNumber(), 155000000000);
            done();
        })
    });

    it("releasePublicToken: should NOT release the 75% allocation to the public -- not crowdfund address", function(done) {
        var ctr;
        W3CToken.new(founderAddress, crowdfund, {from: founderAddress}).then(function(result) {
            ctr = result;
            return ctr.isPublicTokenReleased.call();
        }).then(function (result) {
            assert.equal(result, false);
            return ctr.releasePublicToken({from: accounts[1]});
        }).catch(function (result) {
            return ctr.isPublicTokenReleased.call();
        }).then(function (result) {
            assert.equal(result, false);
            return ctr.balanceOf.call(crowdfund, {from: crowdfund});
        }).then(function (result) {
            assert.equal(result.dividedBy(new BigNumber(10).pow(18)).toNumber(), 5000000000);
            done();
        })
    });

    it("function(): should throw on an undetermined call", function(done) {
        var ctr;
        W3CToken.new(founderAddress, crowdFundAddress, {from: founderAddress}).then(function(result) {
            ctr = result;
            return ctr.call();
        }).catch(function (result) {
            assert.equal(true, true);
            done();
        })
    });
});
