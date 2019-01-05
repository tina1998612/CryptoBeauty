pragma solidity ^0.4.23;

// File: contracts/openzeppelin-solidity/contracts/math/SafeMath.sol

/**
 * @title SafeMath
 * @dev Math operations with safety checks that revert on error
 */
library SafeMath {
    int256 constant private INT256_MIN = -2**255;

    /**
    * @dev Multiplies two unsigned integers, reverts on overflow.
    */
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
        // benefit is lost if 'b' is also tested.
        // See: https://github.com/OpenZeppelin/openzeppelin-solidity/pull/522
        if (a == 0) {
            return 0;
        }

        uint256 c = a * b;
        require(c / a == b);

        return c;
    }

    /**
    * @dev Multiplies two signed integers, reverts on overflow.
    */
    function mul(int256 a, int256 b) internal pure returns (int256) {
        // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
        // benefit is lost if 'b' is also tested.
        // See: https://github.com/OpenZeppelin/openzeppelin-solidity/pull/522
        if (a == 0) {
            return 0;
        }

        require(!(a == -1 && b == INT256_MIN)); // This is the only case of overflow not detected by the check below

        int256 c = a * b;
        require(c / a == b);

        return c;
    }

    /**
    * @dev Integer division of two unsigned integers truncating the quotient, reverts on division by zero.
    */
    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        // Solidity only automatically asserts when dividing by 0
        require(b > 0);
        uint256 c = a / b;
        // assert(a == b * c + a % b); // There is no case in which this doesn't hold

        return c;
    }

    /**
    * @dev Integer division of two signed integers truncating the quotient, reverts on division by zero.
    */
    function div(int256 a, int256 b) internal pure returns (int256) {
        require(b != 0); // Solidity only automatically asserts when dividing by 0
        require(!(b == -1 && a == INT256_MIN)); // This is the only case of overflow

        int256 c = a / b;

        return c;
    }

    /**
    * @dev Subtracts two unsigned integers, reverts on overflow (i.e. if subtrahend is greater than minuend).
    */
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b <= a);
        uint256 c = a - b;

        return c;
    }

    /**
    * @dev Subtracts two signed integers, reverts on overflow.
    */
    function sub(int256 a, int256 b) internal pure returns (int256) {
        int256 c = a - b;
        require((b >= 0 && c <= a) || (b < 0 && c > a));

        return c;
    }

    /**
    * @dev Adds two unsigned integers, reverts on overflow.
    */
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a);

        return c;
    }

    /**
    * @dev Adds two signed integers, reverts on overflow.
    */
    function add(int256 a, int256 b) internal pure returns (int256) {
        int256 c = a + b;
        require((b >= 0 && c >= a) || (b < 0 && c < a));

        return c;
    }

    /**
    * @dev Divides two unsigned integers and returns the remainder (unsigned integer modulo),
    * reverts when dividing by zero.
    */
    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b != 0);
        return a % b;
    }
}

// File: contracts/openzeppelin-solidity/contracts/ownership/Ownable.sol

/**
 * @title Ownable
 * @dev The Ownable contract has an owner address, and provides basic authorization control
 * functions, this simplifies the implementation of "user permissions".
 */
contract Ownable {
  address private _owner;

  event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

  /**
    * @dev The Ownable constructor sets the original `owner` of the contract to the sender
    * account.
    */
  constructor() internal {
    _owner = msg.sender;
    emit OwnershipTransferred(address(0), _owner);
  }

  /**
    * @return the address of the owner.
    */
  function owner() public view returns (address) {
    return _owner;
  }

  /**
    * @dev Throws if called by any account other than the owner.
    */
  modifier onlyOwner() {
    require(isOwner());
    _;
  }

  /**
    * @return true if `msg.sender` is the owner of the contract.
    */
  function isOwner() public view returns (bool) {
    return msg.sender == _owner;
  }

  /**
    * @dev Allows the current owner to relinquish control of the contract.
    * @notice Renouncing to ownership will leave the contract without an owner.
    * It will not be possible to call the functions with the `onlyOwner`
    * modifier anymore.
    */
  function renounceOwnership() public onlyOwner {
    emit OwnershipTransferred(_owner, address(0));
    _owner = address(0);
  }

  /**
    * @dev Allows the current owner to transfer control of the contract to a newOwner.
    * @param newOwner The address to transfer ownership to.
    */
  function transferOwnership(address newOwner) public onlyOwner {
    _transferOwnership(newOwner);
  }

  /**
    * @dev Transfers control of the contract to a newOwner.
    * @param newOwner The address to transfer ownership to.
    */
  function _transferOwnership(address newOwner) internal {
    require(newOwner != address(0));
    emit OwnershipTransferred(_owner, newOwner);
    _owner = newOwner;
  }
}

// File: contracts/Randomness.sol

contract Randomness is Ownable {

  bytes32 private seed = "hحَi";

  function rand(bytes32 key) public onlyOwner returns (bytes32) {
    seed ^= key;
    return keccak256(abi.encodePacked(key, seed, block.timestamp, block.difficulty, "台灣きन्दी한حَNo.1 :) "));
  }
}

// File: contracts/CryptoBeauty.sol

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

  /* user methods */

  function freeDrawCard(uint256 _photoPoolId) external {
    // free draw if play has not drew before or today is first draw
    require(playerLastFreeDrawTime[msg.sender] == 0 || playerLastFreeDrawTime[msg.sender].add(1 days) <= block.timestamp);

    // update last draw time
    playerLastFreeDrawTime[msg.sender] = block.timestamp;

    _drawCard(_photoPoolId, 0);
  }

  function drawCard(uint256 _photoPoolId) external payable {
    require(msg.value == drawCardPrice, "paying incorrect amount");
    _drawCard(_photoPoolId, 0);
  }

  function drawMultipleCards(uint256 _photoPoolId, uint256 _amount) external payable {
    require(_amount > 0, "_amount can't be 0");
    require(msg.value == drawCardPrice.mul(_amount), "paying not correct amount");

    for (uint256 i = 0; i < _amount; i++) {
      _drawCard(_photoPoolId, i.mul(now).mod(_amount));
    }
  }

  // pool id can duplicate, ex. [0, 0, 1, 3]
  function drawMultipleCardsFromMultiplePools(uint256[] _photoPoolIds) external payable {
    require(_photoPoolIds.length > 0, "no _photoPoolIds provided");
    require(_photoPoolIds.length <= 10, "number of pool ids cannot exceed 10");
    require(msg.value == drawCardPrice.mul(_photoPoolIds.length), "paying not correct amount");

    for (uint256 i = 0; i < _photoPoolIds.length; i++) {
      _drawCard(_photoPoolIds[i], i.mul(now).mod(_photoPoolIds.length));
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
    uint256 _rand = _random(_salt);

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
