pragma solidity ^0.4.23;

import { Ownable } from "./openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract Randomness is Ownable {

  bytes32 private seed = "hحَi";

  function rand(bytes32 key) public onlyOwner returns (bytes32) {
    seed ^= key;
    return keccak256(abi.encodePacked(key, seed, block.timestamp, block.difficulty, "台灣きन्दी한حَNo.1 :) "));
  }
}