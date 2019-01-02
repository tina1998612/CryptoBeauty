pragma solidity ^0.5.0;

import { Ownable } from "./openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract Randomness is Ownable {

  bytes32 private seed = "hi";

  function rand(bytes32 key) public onlyOwner returns (bytes32) {
    seed ^= key;
    return keccak256(abi.encodePacked(key, seed, now, block.difficulty, "台灣きन्दी한حَNo.1 :) "));
  }
}