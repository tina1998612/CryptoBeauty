pragma solidity ^0.5.0;

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

  Randomness public randomnessContract;

  PhotoPool[] photoPools;
  Card[] public cards;
  Photo[] public photos;

  mapping (address => uint256) public playerLastDrawTime;

  uint256 drawCardPrice;

  /* events */

  event PoolAdded(
    uint256 indexed photoPoolId
  );

  event PhotoAdded(
    uint256 indexed photoId,
    uint256 indexed modelId,
    uint256 indexed photographerId
  );

  event Transfer(
    uint256 indexed cardId,
    address indexed from,
    address indexed to
  );

  constructor(uint256 _drawCardPrice) public {
    randomnessContract = new Randomness();
    drawCardPrice = _drawCardPrice;
  }

  // ------------ external functions -------------------

  /* manager methods */

  function addPhoto(uint256 _modelId, uint256 _photographerId) external onlyOwner {
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

  function addPhotoPool(uint256[] calldata _photoIds) external onlyOwner {
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

  /* user methods */

  function freeDrawCard(uint256 _photoPoolId) external {
    // free draw if play has not drew before or today is first draw  
    require(playerLastDrawTime[msg.sender] == 0 || playerLastDrawTime[msg.sender] + 1 days <= block.timestamp);
    _drawCard(_photoPoolId);
  }

  function drawCard(uint256 _photoPoolId) external payable {
    require(msg.value == drawCardPrice, "paying incorrect amount");
    _drawCard(_photoPoolId);
  }

  function drawMultipleCards(uint256 _photoPoolId, uint256 _amount) external payable {
    require(_amount > 0, "_amount can't be 0");
    require(msg.value == drawCardPrice.mul(_amount), "paying not correct amount");

    for (uint256 i = 0; i < _amount; i++) {
      _drawCard(_photoPoolId);
    }
  }

  // pool id can duplicate, ex. [0, 0, 1, 3]
  function drawMultipleCardsFromMultiplePools(uint256[] calldata _photoPoolIds) external payable {
    require(_photoPoolIds.length > 0, "no _photoPoolIds provided");
    require(msg.value == drawCardPrice.mul(_photoPoolIds.length), "paying not correct amount");

    for (uint256 i = 0; i < _photoPoolIds.length; i++) {
      _drawCard(_photoPoolIds[i]);
    }
  }

  function transfer(uint256 _cardId, address _to) external {
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

  // ---------------- internal functions -----------------

  function _drawCard(uint256 _photoPoolId) internal {
    // draw random photoId
    uint256 _photoId = _drawPhotoId(_photoPoolId);

    // draw random rarity
    uint256 _rarityScore = _drawRarityScore();

    // create card
    Card memory _card = Card({
      photoId: _photoId,
      rarityScore: _rarityScore,
      holder: msg.sender
    });
    uint256 _cardId = cards.length;
    cards.push(_card);

    // update last draw time
    playerLastDrawTime[msg.sender] = block.timestamp;

    emit Transfer(
      _cardId,    // cardId
      address(0), // from
      msg.sender  // to
    );
  }

  function _drawPhotoId(uint256 _photoPoolId) internal returns(uint256 _photoId) {
    uint256 _rand = _random();

    // if _photoPoolId is valid, draw from pool
    if (isValidPoolId(_photoPoolId)) {
      uint256[] storage _photoIds = photoPools[_photoPoolId].photoIds;
      require(_photoIds.length > 0, "There are no photos in pool");
      return _photoIds[ _rand % _photoIds.length ];
    }
    // if _photoPoolId is not valid, draw from all photos
    else {
      require(photos.length > 0, "There are no photos.");
      return _rand % photos.length;
    }
  }

  function _drawRarityScore() internal returns(uint256 _rarityScore) {
    _rarityScore = _random() % 1000;
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
  function _random() internal returns (uint256) {
    return uint256(randomnessContract.rand(
      keccak256(
        abi.encodePacked(
          msg.data,
          msg.sender
        )
      )
    ));
  }
}
