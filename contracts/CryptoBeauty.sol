/*
 *
*/
pragma solidity ^0.4.23;

import { SafeMath } from "./openzeppelin-solidity/contracts/math/SafeMath.sol";
import { Ownable } from "./openzeppelin-solidity/contracts/ownership/Ownable.sol";
import { Randomness } from "./Randomness.sol";

contract CryptoBeauty is Ownable {
  using SafeMath for uint256;

  struct PhotoPool {
    uint256[] photoIds;
  }

  struct Card {
    uint256 photoId;
    uint256 rarityScore;
    address holder;
  }

  struct Photo {
    uint256 modelId;
    uint256 photographerId;
  }

  Randomness randomnessContract;

  PhotoPool[] photoPools;
  Card[] public cards;
  Photo[] public photos;

  mapping (address => uint256) public playerLastFreeDrawTime;
  address public ownerWalletAddr;

  uint256 public drawCardPrice;

  /* events */

  event PoolAdded(
    uint256 indexed photoPoolId
  );

  event PhotoAdded(
    uint256 indexed photoId,
    uint256 indexed modelId,
    uint256 indexed photographerId
  );

  event CardDrawn(
    uint256 indexed cardId,
    uint256 indexed photoId,
    uint256 rarityScore,
    address indexed to
  );

  event Transfer(
    uint256 indexed cardId,
    address indexed from,
    address indexed to
  );

  constructor(uint256 _drawCardPrice, address _ownerWalletAddr) public {
    randomnessContract = new Randomness();
    drawCardPrice = _drawCardPrice;
    ownerWalletAddr = _ownerWalletAddr;
  }

  // ------------ external functions -------------------

  /* manager methods */

  function withdraw(uint256 amount) external onlyOwner {
    require(address(this).balance >= amount);
    ownerWalletAddr.transfer(amount);
  }

  function addPhoto(uint256 _modelId, uint256 _photographerId) public onlyOwner {
    Photo memory _photo = Photo({
      modelId: _modelId,
      photographerId: _photographerId
    });
    uint256 _photoId = getLatestPhotoId();
    photos.push(_photo);

    emit PhotoAdded(
      _photoId,
      _modelId,
      _photographerId
    );
  }

  function addPhotos(uint256[] _modelIds, uint256[] _photographerIds) external onlyOwner {
    require(_modelIds.length == _photographerIds.length);

    for (uint256 i = 0; i < _modelIds.length; i++) {
      addPhoto(_modelIds[i], _photographerIds[i]);
    }
  }

  function addPhotoPool(uint256[] _photoIds) external onlyOwner {
    // a pool must contain some photos
    require(_photoIds.length > 0, "_photoIds can't be empty.");

    // all photoIds in a pool must exist
    for (uint256 i = 0; i < _photoIds.length; i++) {
      require(isValidPhotoId(_photoIds[i]), "photoId doesn't exist");
    }

    PhotoPool memory _pool = PhotoPool({
      photoIds: _photoIds
    });
    uint256 _photoPoolId = photoPools.length;
    photoPools.push(_pool);

    emit PoolAdded(
      _photoPoolId
    );
  }

  /* EXTERNAL user methods */

  function freeDrawCard(uint256 _photoPoolId) external {
    // free draw if play has not drew before or today is first draw
    require(playerLastFreeDrawTime[msg.sender] == 0 || playerLastFreeDrawTime[msg.sender].add(1 days) <= block.timestamp);

    // MUST be valid photo pool ID
    require(isValidPhotoId(_photoPoolId));

    // update last draw time
    playerLastFreeDrawTime[msg.sender] = block.timestamp;

    _drawCard(_photoPoolId, block.timestamp);
  }

  function drawCard(uint256 _photoPoolId) external payable {
    require(msg.value == drawCardPrice, "paying incorrect amount");
    _drawCard(_photoPoolId, block.timestamp);
  }

  function drawMultipleCards(uint256 _photoPoolId, uint256 _amount) external payable {
    require(_amount > 0, "_amount can't be 0");
    require(msg.value == drawCardPrice.mul(_amount), "paying not correct amount");

    for (uint256 i = 0; i < _amount; i++) {
      _drawCard(_photoPoolId, i.mul(block.timestamp));
    }
  }

  // pool id can duplicate, ex. [0, 0, 1, 3]
  function drawMultipleCardsFromMultiplePools(uint256[] _photoPoolIds) external payable {
    require(_photoPoolIds.length > 0, "no _photoPoolIds provided");
    require(_photoPoolIds.length <= 10, "number of pool ids cannot exceed 10");
    require(msg.value == drawCardPrice.mul(_photoPoolIds.length), "paying not correct amount");

    for (uint256 i = 0; i < _photoPoolIds.length; i++) {
      _drawCard(_photoPoolIds[i], i.mul(block.timestamp));
    }
  }

  function transfer(uint256 _cardId, address _to) external {
    require(_to != address(0x0));
    require(isValidCardId(_cardId));
    require(cards[_cardId].holder == msg.sender);

    _transferCard(_cardId, msg.sender, _to);
  }

  // ------------ public view functions -------------------

  function getLatestPhotoId() public view returns (uint){
    return photos.length;
  }

  function getLatestPhotoPoolId() public view returns (uint){
    return photoPools.length;
  }

  function isValidPhotoId(uint256 _photoId) public view returns (bool) {
    return _photoId < photos.length;
  }

  function isValidPoolId(uint256 _photoPoolId) public view returns (bool) {
    return _photoPoolId < photoPools.length;
  }

  function isValidCardId(uint256 _cardId) public view returns (bool) {
    return _cardId < cards.length;
  }

  // ---------------- internal functions -----------------

  function _drawCard(uint256 _photoPoolId, uint256 _salt) internal {
    // draw random photoId
    uint256 _photoId = _drawPhotoId(_photoPoolId, _salt);

    // draw random rarity
    uint256 _rarityScore = _drawRarityScore(_salt);

    // create card
    Card memory _card = Card({
      photoId: _photoId,
      rarityScore: _rarityScore,
      holder: msg.sender
    });
    uint256 _cardId = cards.length;
    cards.push(_card);

    emit CardDrawn(
      _cardId,
      _photoId,
      _rarityScore,
      msg.sender  // to
    );

    emit Transfer(
      _cardId,    // cardId
      address(0), // from
      msg.sender  // to
    );
  }

  function _drawPhotoId(uint256 _photoPoolId, uint256 _salt) internal returns(uint256 _photoId) {
    require(isValidPoolId(_photoPoolId));  // if _photoPoolId is valid, draw from pool

    uint256[] storage _photoIds = photoPools[_photoPoolId].photoIds;
    require(_photoIds.length > 0, "There are no photos in pool");

    uint256 _rand = _random(_salt);

    return _photoIds[ _rand.mod(_photoIds.length) ];
  }

  function _drawRarityScore(uint256 _salt) internal returns(uint256 _rarityScore) {
    _rarityScore = _random(_salt) % 1000;
  }

  function _transferCard(uint256 _cardId, address _from, address _to) internal {
    cards[_cardId].holder = _to;

    emit Transfer(
      _cardId,
      _from,
      _to
    );
  }

  // TODO: add more entropy
  function _random(uint256 _salt) internal returns (uint256) {
    return uint256(randomnessContract.rand(
      keccak256(
        abi.encodePacked(
          msg.data,
          msg.sender,
          _salt
        )
      )
    ));
  }
}
