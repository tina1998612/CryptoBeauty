var ConvertLib = artifacts.require("./ConvertLib.sol");
var MetaCoin = artifacts.require("./MetaCoin.sol");

module.exports = function(deployer) {
  deployer.deploy(ConvertLib);
  deployer.link(ConvertLib, MetaCoin);
  deployer.deploy(MetaCoin, 10000, {
    fee_limit: 0.9e8,
    userFeePercentage: 29,
    originEnergyLimit: 1.5e6
  });
};
