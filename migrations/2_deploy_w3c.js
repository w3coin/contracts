var W3CTokens = artifacts.require("./W3CToken.sol");

module.exports = function(deployer) {
  deployer.deploy(W3CTokens);
};
