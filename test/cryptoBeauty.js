const expectEvent = require('./helper/expectEvent');
const shouldFail = require('./helper/shouldFail');
const BigNumber = require('bignumber.js');

const CryptoBeauty = artifacts.require('./CryptoBeauty.sol');
const Randomness = artifacts.require('./Randomness.sol');

contract('CryptoBeauty', accounts => {
  const drawCardPrice = 10;
  const [cryptoBeautyOwner, ownerWalletAddr, player1, player2, anyone] = accounts;
  const modelIds = [0, 1, 2, 3, 4, 5, 6];
  const photographerIds = [0, 1, 2, 3, 4, 5, 6];
  const poolId = 0;
  var receipt;

  // contract instance
  var randomness, cryptoBeauty;

  it('contract is deployed with correct owner', async () => {

    cryptoBeauty = await CryptoBeauty.new(
      drawCardPrice, ownerWalletAddr, {
        from: cryptoBeautyOwner
      });
    assert(cryptoBeautyOwner == (await cryptoBeauty.owner.call()));
  });

  it('owner can add new photo', async () => {
    var _photoId = (await cryptoBeauty.getLatestPhotoId.call()).toNumber();
    // console.log(_photoId, modelIds[0])

    assert(_photoId == 0);

    receipt = await cryptoBeauty.addPhoto(modelIds[0], photographerIds[0], {
      from: cryptoBeautyOwner
    });
    // console.log(receipt)

    _photoId = (await cryptoBeauty.getLatestPhotoId.call()).toNumber();
    assert(_photoId == 1);

    // not owner cannot execute this function
    await shouldFail.reverting(
      cryptoBeauty.addPhoto(
        modelIds[0], photographerIds[0], {
          from: anyone
        }
      )
    );

  });

  it('owner can add multiple new photos', async () => {

    var _photoId = (await cryptoBeauty.getLatestPhotoId.call()).toNumber();
    assert(_photoId == 1);

    receipt = await cryptoBeauty.addPhotos(modelIds, photographerIds, {
      from: cryptoBeautyOwner
    });

    _photoId = (await cryptoBeauty.getLatestPhotoId.call()).toNumber();
    assert(_photoId == 8);

  });

  it('owner can add new photo pool', async () => {

    var _photoPoolId = (await cryptoBeauty.getLatestPhotoPoolId.call()).toNumber();

    assert(_photoPoolId == 0);

    receipt = await cryptoBeauty.addPhotoPool([0], {
      from: cryptoBeautyOwner
    });
    // console.log(receipt)

    _photoPoolId = (await cryptoBeauty.getLatestPhotoPoolId.call()).toNumber();

    assert(_photoPoolId == 1);

    // cannot add invalid photo id to pool
    await shouldFail.reverting(
      cryptoBeauty.addPhotoPool(
        [0, 9]
      )
    );

    // not owner cannot execute this function
    await shouldFail.reverting(
      cryptoBeauty.addPhotoPool(
        [0], {
          from: anyone
        }
      )
    );
  });

  it('player can draw card for free per day and when first draw', async () => {

    // today first draw is free
    receipt = await cryptoBeauty.freeDrawCard(poolId, {
      from: player1
    });
    // console.log(await cryptoBeauty.playerLastDrawTime(player1));

    // second draw is not free
    await shouldFail.reverting(
      cryptoBeauty.freeDrawCard(poolId, {
        from: player1
      })
    );
  });

  it('player pay to draw second time', async () => {
    // second draw if paying
    receipt = await cryptoBeauty.drawCard(poolId, {
      from: player1,
      value: drawCardPrice
    });
  });

  it('player pay to draw 10 times', async () => {
    // draw 10 times
    var drawTime = 10;
    receipt = await cryptoBeauty.drawMultipleCards(poolId, drawTime, {
      from: player1,
      value: drawCardPrice * drawTime
    });
  });

  it('player pay to draw second time', async () => {
    // draw 3 times from pool id 0 
    receipt = await cryptoBeauty.drawMultipleCardsFromMultiplePools([0, 0, 0], {
      from: player1,
      value: drawCardPrice * 3
    });
  });

  it('player can transfer card to other player', async () => {
    // transfer card id 0 from player1 to player2
    var cardId = 0;
    var to = player2;
    receipt = await cryptoBeauty.transfer(cardId, to, {
      from: player1
    });
  });

  it('anyone can view card info', async () => {
    // get card holder from id
    var cardId = 0;
    var card = await cryptoBeauty.cards(cardId, {
      from: anyone
    });
    assert(card.holder == player2);
  });

  it('contract owner can withdraw to owner wallet', async () => {
    await cryptoBeauty.withdraw(1);

  });

});