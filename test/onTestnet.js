const expectEvent = require('./helper/expectEvent');
const shouldFail = require('./helper/shouldFail');
const BigNumber = require('bignumber.js');

const CryptoBeauty = artifacts.require('./CryptoBeauty.sol');

contract('CryptoBeauty', accounts => {
  const drawCardPrice = 10;
  const [cryptoBeautyOwner, ownerWalletAddr, player1, player2, anyone] = accounts;

  // photo DB: https://docs.google.com/spreadsheets/d/1gHKmrKVQXR7GyR8diodVjkAP_QEN5tIBVi1o5Ix-VJw/edit#gid=978301067

  const modelIds = [0, 0, 0, 0, 0,
    1, 1, 1, 1, 1,
    2, 2, 2, 2, 2,
    3, 3, 3, 3, 3,
    4, 4, 4, 4, 4,
    5, 5, 5, 5, 5
  ];

  const photographerIds = [0, 0, 0, 0, 0,
    0, 0, 0, 0, 0,
    0, 0, 0, 0, 0,
    0, 0, 0, 0, 0,
    0, 0, 0, 0, 0,
    0, 0, 0, 0, 0
  ];

  const photoIds = [0, 1, 2, 3, 4,
    5, 6, 7, 8, 9,
    10, 11, 12, 13,
    14, 15, 16, 17,
    18, 19, 20, 21,
    22, 23, 24, 25,
    26, 27, 28, 29
  ];

  const poolId = 0;
  var receipt;

  // contract instance
  var cryptoBeauty;

  it('30 photos added', async () => {

    cryptoBeauty = await CryptoBeauty.new(
      drawCardPrice, ownerWalletAddr, {
        from: cryptoBeautyOwner
      });

    receipt = await cryptoBeauty.addPhotos(modelIds, photographerIds, {
      from: cryptoBeautyOwner
    });

    var _photoId = (await cryptoBeauty.getLatestPhotoId.call()).toNumber();
    assert(_photoId == photoIds.length);

  });

  it('owner add all photo to pool 0', async () => {

    receipt = await cryptoBeauty.addPhotoPool(photoIds, {
      from: cryptoBeautyOwner
    });

  });

});