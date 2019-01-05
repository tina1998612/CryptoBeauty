// pragma solidity ^0.4.23;

// import { SafeMath } from "./openzeppelin-solidity/contracts/math/SafeMath.sol";

// contract Randomness {

//   address owner;

//   modifier onlyOwner(){
//     require(msg.sender == owner);
//     _;
//   }

//   constructor() public{
//     owner = msg.sender;
//   }

//   bytes32 private seed = "hi";
//   function rand(bytes32 key) public onlyOwner returns (bytes32) {
//     seed ^= key;
//     return keccak256(abi.encodePacked(key, seed, now, block.difficulty, "台灣きन्दी한حَNo.1 :) "));
//   }
// }

// contract CryptoBeauty {

//   using SafeMath for uint256;

//   struct Card {
//     uint256 id;
//     uint256 birthTime;
//     uint256 modelId; // from 1 to 2^256-1, 0 is unspecified
//     uint256 poolId;
//   }

//   address public owner;
//   uint256 public drawCardCost = 1;
//   uint256 public totalCardCount;
//   uint256 public totalModelCount;
//   uint256 public totalRareScore;

//   uint256 internal lastDrawCardId;
//   address internal randContractAddr;

//   // modelId map to card
//   mapping (uint256 => Card[]) public URcards;
//   mapping (uint256 => Card[]) public SSRcards;
//   mapping (uint256 => Card[]) public SRcards;
//   mapping (uint256 => Card[]) public Rcards;
//   mapping (uint256 => Card[]) public Ncards;

//   mapping (uint256 => address) public cardIndexToHolder;
//   mapping (address => uint256) public holdCardCount;
//   mapping (address => uint256) public playerDeposit;
//   mapping (address => uint256) public playerRareScore;
//   mapping (address => bool) public hasPlayed;

//   mapping (uint256 => uint256) public cardIndexToRareScore;
//   mapping (uint256 => bool) public modelCardHasCreated;

//   event TransferHolder(address from, address to, uint256 cardId);

//   modifier onlyOwner(){
//     require(msg.sender == owner);
//     _;
//   }

//   constructor() public {
//     owner = msg.sender;
//   }

//   // internal functions
//   // transfer card holder
//   function _transferHolder(address _to, uint256 _cardId) internal {
//     address _from = cardIndexToHolder[_cardId];
//     uint256 _rareScore = cardIndexToRareScore[_cardId];

//     holdCardCount[_from].sub(1);
//     cardIndexToHolder[_cardId] = _to;
//     holdCardCount[_to].add(1);

//     playerRareScore[_from].sub(_rareScore);
//     playerRareScore[_to].add(_rareScore);

//     emit TransferHolder(_from, _to, _cardId);
//   }

//   function random(uint256 seed) internal returns (uint) {
//     return uint(keccak256(abi.encodePacked(block.difficulty, block.timestamp, seed, Randomness(randContractAddr).rand(bytes32(seed)))));
//   }

//   function randNumToCardIndexByPool(uint randNum, uint poolId) internal returns (uint) {
//     uint256 newRandNum = random(randNum.add(uint256(msg.sender).div(1000)));
//     uint rareScore = randNum.mod(1000);

//     if(rareScore == 0) return URcards[poolId][newRandNum.mod(URcards[poolId].length)].id;
//     else if(rareScore > 0 && rareScore <= 20) return SSRcards[poolId][newRandNum.mod(SSRcards[poolId].length)].id;
//     else if(rareScore > 20 && rareScore <= 120) return SRcards[poolId][newRandNum.mod(SRcards[poolId].length)].id;
//     else if(rareScore > 120 && rareScore <= 370) return Rcards[poolId][newRandNum.mod(Rcards[poolId].length)].id;
//     else return Ncards[poolId][newRandNum.mod(Ncards[poolId].length)].id;
//   }

//   // public functions
//   function createNewCard (
//     uint _rareScore,
//     uint _poolId,
//     uint _modelId,
//     address _holder
//   )
//     public
//     onlyOwner
//     returns (uint)
//   {
//     uint256 newCardId = totalCardCount;

//     Card memory _card = Card({
//       id: newCardId,
//       modelId: _modelId,
//       poolId: _poolId,
//       birthTime: uint256(block.timestamp)
//     });

//     if(_rareScore == 1000) URcards[_poolId].push(_card);
//     else if(_rareScore == 50) SSRcards[_poolId].push(_card);
//     else if(_rareScore == 10) SRcards[_poolId].push(_card);
//     else if(_rareScore == 4) Rcards[_poolId].push(_card);
//     else if(_rareScore == 1) Ncards[_poolId].push(_card);
//     else revert("Invalid card rare score!");

//     cardIndexToRareScore[newCardId] = _rareScore;

//     // increment total
//     totalRareScore.add(_rareScore);
//     totalCardCount.add(1);
//     if(!modelCardHasCreated[_modelId]) {
//       modelCardHasCreated[_modelId] = true;
//       totalModelCount.add(1);
//     }

//     _transferHolder(_holder, newCardId);
//     return newCardId;
//   }

//   function drawCard(address _to, uint poolId) public returns (uint256 rareScore) {

//     // first visit -> draw card for free
//     if(hasPlayed[_to])
//       playerDeposit[_to].sub(drawCardCost);
//     else hasPlayed[_to] = true;

//     // rand draw a model if the given id is 0
//     // uint modelId;
//     // if(_modelId == 0){
//     //   modelId = random((lastDrawCardId).mod(totalModelCount)).add(1);
//     // }

//     uint index = randNumToCardIndexByPool(random(poolId), poolId);
//     _transferHolder(_to, index);

//     lastDrawCardId = index;

//     // return how rare the card is
//     return cardIndexToRareScore[index];
//   }

//   function drawCard10(address _to, uint poolId) public returns (uint256[10] memory rareScores) {
//     for(uint8 i=0;i<10;i++){
//       rareScores[i] = drawCard(_to, poolId);
//     }
//   }

//   function deposit() public payable {
//     playerDeposit[msg.sender].add(msg.value);
//   }

//   function withdrawDeposit(uint amount) public {
//     playerDeposit[msg.sender].sub(amount);
//     msg.sender.transfer(amount);
//   }

//   function setRandContractAddr(address _addr) public onlyOwner {
//     randContractAddr = _addr;
//   }
// }