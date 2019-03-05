import React, { Component } from "react";
import { Route, Link, Switch } from "react-router-dom";
import { ParallaxProvider } from 'react-skrollr'
import { AlertList, Alert, AlertContainer } from "react-bs-notifier";
// const skrollr = require('skrollr');

import ContractJSON from "./contracts_for_client/CryptoBeauty.json";
// import ContractJSON from "./contracts/MetaCoin.json";
import getTronWeb from "./utils/getTronWeb";
import Cards from "./components/Cards";
import FreeDrawCountdown from "./components/FreeDrawCountdown";

// import 'bootstrap/dist/css/bootstrap.min.css';
import "./App.css";
// import "./css/animate.css";
// import "./css/bootstrap-theme.css";
// import "./css/bootstrap.css";
// import "./css/font-awesome.css";
// import "./css/isotope.css";
// import "./css/overwrite.css";
// import "./css/style.css";
// import "./css/default.css";

const pollingInterval = 2000;

class App extends Component {
  state = {
    tronWebState: {
      installed: false,
      loggedIn: false,
    },
    tronWeb: null,
    defaultAddress: null,
    ContractJSON: ContractJSON,
    networkId: '1',
    networkName: 'Mainnet',
    abi: [],

    accounts: null,
    contract: null,

    drawCardPrice: 20000000,
    myCards: [],
    // myCards: [
    //   {
    //     photoId: "0",
    //     rarityScore: "0",
    //   },
    //   {
    //     photoId: "7",
    //     rarityScore: "5",
    //   },
    //   {
    //     photoId: "14",
    //     rarityScore: "50",
    //   },
    //   {
    //     photoId: "21",
    //     rarityScore: "200",
    //   },
    //   {
    //     photoId: "28",
    //     rarityScore: "800",
    //   },
    // ],
    playerLastFreeDrawTime: 0,
    freeDrawTimeGap: 82800, // 23 hours
    alerts: [],
    isDrawingCard: false,
    isDrawingCardSent: false,
    isDrawingCardFailed: false,
    justDrawnCards: [],
  };

  componentDidMount = async () => {
    try {
      // const { networkId } = this.state;

      const tronWeb = await getTronWeb();

      // get networkId
      let networkId = '1';
      let networkName = 'Mainnet';
      if (tronWeb.fullNode.host.includes('shasta')) {
        networkId = '2';
        networkName = 'Shasta Testnet';
      } else if (tronWeb.fullNode.host.includes('api.trongrid.io')) {
        networkId = '1';
        networkName = 'Mainnet';
      } else {
        // networkId = '-1';
        networkName = 'Unknown Network';
      }
      console.log("networkId", networkId);

      const tronWebState = {
        installed: !!tronWeb,
        loggedIn: !!tronWeb && tronWeb.ready,
      }
      console.log("tronWebState", tronWebState);
      this.setState({
        tronWeb,
        tronWebState,
        networkId,
        networkName,
      });

      const abi = ContractJSON.abi;
      const contractAddress = ContractJSON.networks[networkId].address;
      const contractAddressHex = (contractAddress[0] === 'T') ?
        tronWeb.address.toHex(contractAddress) : contractAddress;
      console.log("contractAddressHex", contractAddressHex);
      const contract = await tronWeb.contract().at(contractAddressHex);
      console.log("contract", contract);

      this.setState({
        contract,
        abi
      });

      if (!tronWebState.loggedIn) {
        return;
      }

      const defaultAddress = tronWeb.defaultAddress;
      console.log("defaultAddress", defaultAddress);

      this.setState({
        defaultAddress,
      }, () => {
        this.getLatestPhotoId();
        this.getCardPrice();
        // this.getTransferEvents();
        // this.getCardDrawnEvents();
        this.getMyCards();
        this.getPlayerLastFreeDrawTime();
        // this.getFreeDrawTimeGap();
      });

    } catch (error) {
      // Catch any errors for any of the above operations.
      // alert(
      //   `Failed to load web3, accounts, or contract. Check console for details.`,
      // );
      console.error(error);
    }
  };

  triggerContract = async function (methodName, args, callback) {
    const { abi, contract } = this.state;

    var callSend = 'send'
    abi.forEach(function (val) {
      if (val.name === methodName) {
        callSend = /payable/.test(val.stateMutability) ? 'send' : 'call'
      }
    })

    contract[methodName](...args)[callSend]({
      feeLimit: this.feeLimit,
      callValue: this.callValue || 0,
    }).then(function (res) {
      if (res) {
        callback && callback(res);
      }
    })
  };

  getLatestPhotoId = async () => {
    const { contract } = this.state;

    const latestPhotoId = await contract.getLatestPhotoId().call();
    console.log("latestPhotoId", latestPhotoId);
  };

  getFreeDrawTimeGap = async () => {
    const { contract } = this.state;

    const freeDrawTimeGap = await contract.freeDrawTimeGap().call();
    console.log("freeDrawTimeGap", freeDrawTimeGap, freeDrawTimeGap.toNumber());
    this.setState({
      freeDrawTimeGap: freeDrawTimeGap.toNumber()
    });
  };

  getCardPrice = async () => {
    const { contract } = this.state;

    const drawCardPrice = await contract.drawCardPrice().call();
    console.log("drawCardPrice", drawCardPrice);
    this.setState({
      drawCardPrice: drawCardPrice.toNumber()
    });
  };

  getTransferEvents = async () => {
    const { tronWeb, networkId, ContractJSON } = this.state;

    const contractAddressBase58 = ContractJSON.networks[networkId].addressBase58;

    console.log("getTransferEvents");

    const events = await tronWeb.getEventResult(
      contractAddressBase58,
      1546530140000, // sinceTimestamp
      "Transfer" // eventName
      // 6540, // blockNumber
      // 20, // size
      // 0 // page
    );
    console.log("events", events);
  };

  getCardDrawnEvents = async () => {
    const { tronWeb, networkId, ContractJSON } = this.state;

    const contractAddressBase58 = ContractJSON.networks[networkId].addressBase58;

    console.log("getCardDrawnEvents");

    const events = await tronWeb.getEventResult(
      contractAddressBase58,
      1546530140000, // sinceTimestamp
      "CardDrawn" // eventName
      // 6540, // blockNumber
      // 20, // size
      // 0 // page
    );
    console.log("events", events);
  };

  getMyCards = async () => {
    const { contract, defaultAddress } = this.state;

    console.log("getMyCards");

    const drawnCards = await contract.drawnCardsOf(defaultAddress.hex).call();
    console.log("drawnCards", drawnCards);

    let cards = [];
    for (let i = 0; i < drawnCards.cardIds.length; i++) {
      // for (let i = drawnCards.cardIds.length - 1; i >= 0; i--) {
      cards.push({
        cardId: drawnCards.cardIds[i].toNumber(),
        photoId: drawnCards.photoIds[i].toNumber(),
        rarityScore: drawnCards.rarityScores[i].toNumber(),
      })
    }
    this.setState({
      myCards: cards
    });

    return cards

    // const { tronWeb, networkId, ContractJSON, defaultAddress } = this.state;

    // const contractAddressBase58 = ContractJSON.networks[networkId].addressBase58;

    // const events = await tronWeb.getEventResult(
    //   contractAddressBase58,
    //   1546530140000, // sinceTimestamp
    //   "CardDrawn", // eventName
    //   undefined, // blockNumber
    //   200, // size
    //   1 // page
    // );
    // console.log("CardDrawn events", events);

    // let myCards = [];
    // const my0xAddress = "0x" + defaultAddress.hex.slice(2);
    // for (const event of events) {
    //   let card = Object.assign({}, event.result);
    //   card.transaction = event.transaction;
    //   card.timestamp = event.timestamp;
    //   if (card.to === my0xAddress) {
    //     myCards.push(card)
    //   }
    // }

    // this.setState({ myCards });
  };

  getPlayerLastFreeDrawTime = async () => {
    const { contract, defaultAddress } = this.state;

    const playerLastFreeDrawTime = await contract.playerLastFreeDrawTime(defaultAddress.hex).call();
    console.log("playerLastFreeDrawTime", playerLastFreeDrawTime, playerLastFreeDrawTime.toNumber());
    this.setState({
      playerLastFreeDrawTime: playerLastFreeDrawTime.toNumber()
    });
  }

  freeDrawCard = async () => {
    const { contract } = this.state;

    console.log("freeDrawCard");

    this.onDrawingCard();

    // contract.freeDrawCard(0).send({
    //   feeLimit: undefined,
    //   callValue: 0,
    //   shouldPollResponse: true
    // })
    // .then((result) => {
    //   console.log("freeDrawCard result", result);
    //   // onFreeCardDrawn
    //   this.getPlayerLastFreeDrawTime();
    //   this.onCardDrawn(1);
    // }, (error) => {
    //   console.log("freeDrawCard error", error);
    //   this.onDrawingCardFailed();
    // });

    contract.freeDrawCard(0).send({
      feeLimit: undefined,
      callValue: 0,
      shouldPollResponse: false // resolve when tx broadcasted
    })
      .then((result) => {
        console.log("freeDrawCard result", result);
        // onFreeCardDrawn
        // this.getPlayerLastFreeDrawTime();
        this.onDrawingCardSent(1);
      }, (error) => {
        console.log("freeDrawCard error", error);
        this.onDrawingCardFailed();
      });

    // const result = await contract.freeDrawCard(0).send({
    //   feeLimit: undefined,
    //   callValue: 0,
    //   shouldPollResponse: true
    // });
    // console.log("freeDrawCard result", result);

    // // onFreeCardDrawn
    // this.getPlayerLastFreeDrawTime();

    // this.onCardDrawn(1);
  };

  drawCard = async () => {
    const { contract, drawCardPrice } = this.state;

    console.log("drawCard");

    this.onDrawingCard();

    // contract.drawCard(0).send({
    //   feeLimit: undefined,
    //   callValue: drawCardPrice,
    //   shouldPollResponse: true
    // })
    // .then((result) => {
    //   console.log("drawCard result", result);
    //   this.onCardDrawn(1);
    // }, (error) => {
    //   console.log("drawCard error", error);
    //   this.onDrawingCardFailed();
    // });


    contract.drawCard(0).send({
      feeLimit: undefined,
      callValue: drawCardPrice,
      shouldPollResponse: false // resolve when tx broadcasted
    })
      .then((result) => {
        console.log("drawCard result", result); // tx id

        this.onDrawingCardSent(1);
      }, (error) => {
        console.log("drawCard error", error);
        this.onDrawingCardFailed();
      });

    // const result = await contract.drawCard(0).send({
    //   feeLimit: undefined,
    //   callValue: drawCardPrice,
    //   shouldPollResponse: true
    // });
    // console.log("drawCard result", result);

    // this.onCardDrawn(1);
  };

  draw10Cards = async () => {
    const { contract, drawCardPrice } = this.state;

    console.log("draw10Cards");

    this.onDrawingCard();

    const cardCount = 10;

    // contract.drawMultipleCards(0, cardCount).send({
    //   feeLimit: undefined,
    //   callValue: drawCardPrice * cardCount,
    //   shouldPollResponse: true
    // })
    // .then((result) => {
    //   console.log("draw10Cards result", result);
    //   this.onCardDrawn(10);
    // }, (error) => {
    //   console.log("draw10Cards error", error);
    //   this.onDrawingCardFailed();
    // });

    contract.drawMultipleCards(0, cardCount).send({
      feeLimit: undefined,
      callValue: drawCardPrice * cardCount,
      shouldPollResponse: false // resolve when tx broadcasted
    })
      .then((result) => {
        console.log("draw10Cards result", result);
        this.onDrawingCardSent(10);
      }, (error) => {
        console.log("draw10Cards error", error);
        this.onDrawingCardFailed();
      });

    // const result = await contract.drawMultipleCards(0, cardCount).send({
    //   feeLimit: undefined,
    //   callValue: drawCardPrice * cardCount,
    //   shouldPollResponse: true
    // });
    // console.log("drawCard result", result);

    // this.onCardDrawn(10);
  };

  onDrawingCard = async () => {
    this.setState({
      isDrawingCard: true,
    });
  }

  onDrawingCardSent = async (cardCount) => {
    this.setState({
      isDrawingCardSent: true,
    });

    // this.pollDrawingCard(cardCount);
    setTimeout(() => {
      this.pollDrawingCard(cardCount)
    }, pollingInterval);
  }

  pollDrawingCard = async (cardCount) => {
    console.log("pollDrawingCard");

    const oldMyCardsLength = this.state.myCards.length;

    const newMyCards = await this.getMyCards();

    if (newMyCards.length > oldMyCardsLength) {
      this.onPollCardDrawn(cardCount);
    } else {
      setTimeout(() => {
        this.pollDrawingCard(cardCount)
      }, pollingInterval);
    }
  }

  onDrawingCardFailed = async () => {
    // this.pushAlert({
    //   id: Date.now(),
    //   type: "error",
    //   message: "抽卡失敗，請確定你的 TronLink 連接到主網上，並且擁有足夠的 TRX"
    // });

    this.setState({
      isDrawingCard: false,
      isDrawingCardSent: false,
      isDrawingCardFailed: true,
    });
  }

  onCardDrawn = async (cardCount) => {
    console.log("onCardDrawn");

    await this.getMyCards();

    const { myCards } = this.state;
    const justDrawnCards = myCards.slice(Math.max(myCards.length - cardCount, 0));
    console.log("justDrawnCards", justDrawnCards);
    this.setState({
      isDrawingCard: false,
      isDrawingCardSent: false,
      justDrawnCards
    });

    // this.pushAlert({
    //   id: Date.now(),
    //   type: "success",
    //   message:"抽卡完成，請點擊右上角 My Girls 前往查看"
    // });
  }

  onPollCardDrawn = async (cardCount) => {
    console.log("onPollCardDrawn");

    setTimeout(async () => {
      await this.getMyCards();

      const { myCards } = this.state;
      const justDrawnCards = myCards.slice(Math.max(myCards.length - cardCount, 0));
      console.log("justDrawnCards", justDrawnCards);
      this.setState({
        isDrawingCard: false,
        isDrawingCardSent: false,
        justDrawnCards
      });

      this.getPlayerLastFreeDrawTime();
    }, pollingInterval);
  }

  pushAlert = async (alertObj) => {
    this.state.alerts.push(alertObj);

    this.setState({
      alerts: this.state.alerts
    });
  }

  dismissAlert = async (input) => {
    console.log("input", input);

    const alerts = this.state.alerts.filter((alertObj) => {
      return alertObj.id != input.id;
    });

    this.setState({
      alerts
    });
  }

  render() {
    // if (!this.state.tronWeb) {
    //   return <div className="App">
    //     Loading tronWeb, accounts, and contract...
    //   </div>;
    // }
    // else if (!this.state.tronWebState.loggedIn) {
    //   return <div className="App">
    //     <h1>Please install and unlock TronLink.</h1>
    //   </div>;
    // }

    const canFreeDrawTime = this.state.playerLastFreeDrawTime + this.state.freeDrawTimeGap;
    const canFreeDrawNow = (Date.now() / 1000) > canFreeDrawTime;

    return (
      <ParallaxProvider
        init={{
          smoothScrollingDuration: 500,
          smoothScrolling: true,
          forceHeight: false
        }}
      >
        <div className="App">
          <AlertList
            timeout={5000}
            onDismiss={this.dismissAlert}
            position="bottom-left"
            alerts={this.state.alerts}
          />

          <section id="header" className="appear"></section>
          <div className="navbar navbar-fixed-top navbar-default-style"
            style={{ backgroundColor: "rgba(68,188,221,1)", paddingLeft: "15px" }}
            role="navigation" data-0="line-height:60px; height:60px; background-color:rgba(68,188,221,1);" data-300="line-height:40px; height:40px; background-color:rgba(68,188,221,0.6);">
            <div className="container">
              <div className="navbar-header">
                <button type="button" className="navbar-toggle" data-toggle="collapse" data-target=".navbar-collapse">
                  <span className="fa fa-bars color-white"></span>
                </button>
                <h1>
                  <Link to="/" className="navbar-brand navbar-brand-default-style" data-0="line-height:60px;" data-300="line-height:50px;">CryptoBeauty</Link>
                </h1>
              </div>
              <div className="navbar-collapse collapse">
                <ul className="nav navbar-nav" data-0="margin-top:10px;" data-300="margin-top:5px;">
                  <li>
                    <a style={{ color: "#DDD" }}>on {this.state.networkName}</a>
                  </li>
                  <li>
                    <Switch>
                      <Route exact path="/asset">
                        <Link to="/">Own A Girl</Link>
                      </Route>
                      <Route>
                        <Link to="/asset">My Girls</Link>
                      </Route>
                    </Switch>
                  </li>
                  <li>
                    <Route>
                        <Link to="/trade">Trade!</Link>
                    </Route>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <Switch>
            <Route exact path="/trade">
              <div>
              <section id="section-works" className="section appear clearfix">
                <div className="container">

                  <div className="row mar-bot40">
                    <div className="col-md-offset-3 col-md-6">
                      <div className="section-header">
                        <h2 className="section-heading animated pad-top40" data-animation="bounceInUp">The Market of Cards</h2>
                      </div>
                    </div>
                  </div>

                </div>
              </section>
              </div>
            </Route>

            <Route exact path="/asset"><div>

              <section id="section-works" className="section appear clearfix">
                <div className="container">

                  <div className="row mar-bot40">
                    <div className="col-md-offset-3 col-md-6">
                      <div className="section-header">
                        <h2 className="section-heading animated pad-top40" data-animation="bounceInUp">Girls in the house</h2>
                      </div>
                    </div>
                  </div>

                  {
                    !this.state.tronWebState.loggedIn ?
                      <div>
                        <h3>请在电脑上用 <a target="_blank" rel="noopener noreferrer" href="https://www.google.com/chrome/">Chrome</a> 开启网页</h3>
                        <h3>并安装与解锁 <a target="_blank" rel="noopener noreferrer" href="https://chrome.google.com/webstore/detail/tronlink/ibnejdfjmmkpcnlpebklmnkoeoihofec">TronLink</a></h3>
                      </div>
                      :
                      <div className="row">
                        {/* <nav id="filter" className="col-md-12 text-center">
                      <ul>
                        <li><a className="current btn-theme btn-small" data-filter="*">All</a></li>
                        <li><a className="btn-theme btn-small" data-filter=".normal">Normal</a></li>
                        <li><a className="btn-theme btn-small" data-filter=".rare">Rare</a></li>
                        <li><a className="btn-theme btn-small" data-filter=".sr">SR</a></li>
                        <li><a className="btn-theme btn-small" data-filter=".ssr">SSR</a></li>
                        <li><a className="btn-theme btn-small" data-filter=".ur">Ultra Rare</a></li>
                      </ul>
                    </nav> */}

                        {
                          this.state.myCards.length === 0 ?
                            <h3>你还没有卡片，快<Link to="/">回到首页</Link>抽一张吧！</h3>
                            :
                            <Cards cards={this.state.myCards} reversed={true}></Cards>
                        }

                      </div>
                  }

                </div>
              </section>


            </div></Route>

            {/* show this by default */}
            <Route><div>

              <section id="parallax4" className="section pad-top150 pad-bot150" data-stellar-background-ratio="0.5">
                <div className="container">
                  <div className="align-center pad-top150 pad-bot150">
                    <img className="align-left cryptobeauty-logo-img"
                      style={{ width: "400px", left: "40px", top: "45px", position: "absolute" }} src="img/logo/cryptobeautylogo01.png" alt="" />
                    <h1 className="align-left text-white-outlined pad-top20">Crypto Beauty <span className="cryptobeauty-title">密码女孩</span></h1>
                    <h3 className="align-left text-white-outlined"><b>你专属的区块链少女卡片创作交易平台</b></h3>
                  </div>
                </div>
              </section>

              <section id="section-services" className="section pad-bot20 bg-white">
                <div className="container">

                  <h2 className="align-center color-swimsuitblue pad-bot20">你的女孩，一键拥有</h2>

                  {
                    !this.state.tronWebState.loggedIn ?
                      // <div>
                      //   <h3>您與密碼女孩的距離</h3>
                      //   <h3>只剩下一個已解鎖的 <a target="_blank" rel="noopener noreferrer"  href="https://chrome.google.com/webstore/detail/tronlink/ibnejdfjmmkpcnlpebklmnkoeoihofec">TronLink</a></h3>
                      // </div>
                      <div>
                        <h3>请在电脑上用 <a target="_blank" rel="noopener noreferrer" href="https://www.google.com/chrome/">Chrome</a> 开启网页</h3>
                        <h3>并安装与解锁 <a target="_blank" rel="noopener noreferrer" href="https://chrome.google.com/webstore/detail/tronlink/ibnejdfjmmkpcnlpebklmnkoeoihofec">TronLink</a></h3>
                        <h4 className="align-center color-swimsuitblue pad-top20"><b>若网页无法自动跳转，请点击此 <a target="_blank" rel="noopener noreferrer" href="https://tronbeauty.github.io/CryptoBeauty/#/">连结</a> 加速</b></h4>
                      </div>
                      :
                      <div className="row mar-bot40">

                        <div className="col-lg-4">
                          <div className="align-center">
                            {
                              canFreeDrawNow ?
                                <div className="button-container button-slide-horizontal">
                                  <div className="slider slider-horizontal">
                                    <div className="button" onClick={this.freeDrawCard}>
                                      <i className="color-white">每日免费抽</i>
                                    </div>
                                  </div>
                                </div>
                                :
                                <div className="button-container">
                                  <div className="">
                                    <div className="button button-muted">
                                      <i className="color-white">每日免费抽</i>
                                    </div>
                                  </div>
                                </div>
                            }


                            <h4 className="color-2blue">
                              <FreeDrawCountdown endTime={canFreeDrawTime}></FreeDrawCountdown>
                            </h4>
                          </div>
                        </div>


                        <div className="col-lg-4">
                          <div className="align-center">
                            <div className="button-container button-slide-horizontal">
                              <div className="slider slider-horizontal">
                                <div className="button" onClick={this.drawCard}>
                                  <i className="color-white">单张抽卡</i>
                                </div>
                              </div>
                            </div>
                            <h4 className="color-2blue">{this.state.drawCardPrice / 1000000} TRX</h4>
                          </div>
                        </div>

                        <div className="col-lg-4">
                          <div className="align-center">
                            <div className="button-container button-slide-horizontal">
                              <div className="slider slider-horizontal">
                                <div className="button" onClick={this.draw10Cards}>
                                  <i className="color-white">超值卡包</i>
                                </div>
                              </div>
                            </div>
                            <h4 className="color-2blue">{this.state.drawCardPrice / 1000000 * 10} TRX</h4>
                          </div>
                        </div>

                      </div>
                  }

                  {/* state of drawing */}
                  {
                    this.state.isDrawingCard ?
                      <div>
                        <div className="spinner"></div>
                        {
                          this.state.isDrawingCardSent &&
                          <h3 className="">抽卡中，若卡片久未出现，请手动<Link to="/asset">跳转至 My Girls 查看</Link></h3>
                        }
                      </div>
                      : (
                        this.state.isDrawingCardFailed ?
                          <div>
                            <h3>抽卡失败</h3>
                            <h4>请确定 TronLink 连接到主网上，并且拥有足够的 TRX</h4>
                          </div>
                          :
                          <Cards cards={this.state.justDrawnCards} reversed={true}></Cards>
                      )}

                </div>
              </section>

              <section id="testimonials" className="section" data-stellar-background-ratio="0.5">
                <div className="container">
                  <div className="row">
                    <div className="col-lg-12">
                      <div className="align-center">
                        <div className="testimonial pad-top40 pad-bot40">
                          <h1 className="text-white-outlined">
                            取得网红私密线下活动的专属门票
                          </h1>
                          <br />
                        </div>

                      </div>
                    </div>

                  </div>
                </div>
              </section>

              <section id="section-about" className="section appear clearfix">
                <div className="container">

                  <div className="row mar-bot40">
                    <div className="col-md-offset-3 col-md-6">
                      <div className="section-header">
                        <h2 className="section-heading animated" data-animation="bounceInUp">区块链 X 模特</h2>
                        <p>清纯制服 / 限量版型 / 区块链 / 数位加密 / 私有资产 </p>
                      </div>
                    </div>
                  </div>

                  <div className="row align-center mar-bot40">
                    <div className="col-md-3">
                      <div className="team-member">
                        <figure className="member-photo"><img src="img/team/member5.jpg" alt="" /></figure>
                        <div className="team-detail">
                          <h4>婷婷</h4>
                          <a href="https://www.instagram.com/tinaaaaalee/">IG:tinaaaaalee</a>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="team-member">
                        <figure className="member-photo"><img src="img/team/member6.jpg" alt="" /></figure>
                        <div className="team-detail">
                          <h4>思嫺</h4>
                          <a href="https://www.instagram.com/sixian0909/">IG:sixian0909</a>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="team-member">
                        <figure className="member-photo"><img src="img/team/member7.jpg" alt="" /></figure>
                        <div className="team-detail">
                          <h4>小敬</h4>
                          <a href="https://www.facebook.com/profile.php?id=100001603870154">FB:小敬</a>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="team-member">
                        <figure className="member-photo"><img src="img/team/member8.jpg" alt="" /></figure>
                        <div className="team-detail">
                          <h4>妤珊</h4>
                          <a href="https://www.instagram.com/nnszea/">IG:nnszea</a>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="row mar-bot40 bg-grey pad-bot40 pad-top40 div-round">
                    <div className="section-header">
                      <h2 className="section-heading animated" data-animation="bounceInUp">捕获珍稀女孩</h2>
                      <div className="col-md-6">
                        <figure className="card-photo"><img src="img/cards/URcard.png" alt="" /></figure>
                      </div>
                      <div className="col-md-6 align-left color-near-black">
                        <br />
                        <br />
                        <br />
                        <h3 className="color-near-black">❤ 免费抽卡即刻拥有<span className="color-swimsuitblue">高清原图</span></h3>
                        <br />
                        <br />
                        <h3 className="mar-left60 color-near-black">❤ 卡牌即女孩<span className="color-swimsuitblue">私人见面会</span>门票</h3>
                        <br />
                        <br />
                        <h3 className="mar-left120 color-near-black">❤ 稀有卡可兑女孩<span className="color-swimsuitblue">专属悄悄话</span></h3>
                      </div>

                    </div>
                  </div>

                  <div className="row align-center mar-bot70 pad-top40">
                    <div className="section-header">
                      <h2 className="section-heading animated pad-bot40" data-animation="bounceInUp">成为套卡搜藏专家！</h2>
                      <figure className="card-photo-small"><img src="img/cards/cards_level.png" alt="" /></figure>
                    </div>
                  </div>

                  <div className="col-lg-4"></div>

                  <div className="col-lg-3 bg-grey mar-left45  mar-bot30 div-round">
                    <div className="row align-center mar-bot40 pad-top40">
                      <div className="section-header">
                        <h2 className="section-heading animated " data-animation="bounceInUp">成为卡牌</h2>
                        <figure><img className="pad-bot20 pad-top20" src="img/logo/qmark.png"></img></figure>
                        <div className="button-container button-slide-horizontal">
                          <div className="slider slider-horizontal">
                            <a href="https://cryptobeautyart.typeform.com/to/DDxyFG">
                              <div className="button">
                                <i className="color-white">点我申请</i>
                              </div>
                            </a>
                          </div>
                        </div>
                        <p > 女孩 / 摄影师</p>
                      </div>
                    </div>
                  </div>

                  <div className="col-lg-3"></div>

                </div>
              </section>

            </div></Route>
          </Switch>



          <section id="footer" className="section footer">
            <div className="container">
              <div className="row animated opacity mar-bot20" data-andown="fadeIn" data-animation="animation">
                <div className="col-sm-12 align-center">
                  <ul className="social-network social-circle">
                    {/*<li><a href="#" className="icoRss" title="Rss"><i className="fa fa-rss"></i></a></li>*/}
                    <li><a href="https://www.facebook.com/CryptoBeauty.Art" className="icoFacebook" title="Facebook"><i className="fa fa-facebook"></i></a></li>
                    <li><a href="https://github.com/TronBeauty/CryptoBeauty" className="icoGithub" title="Github"><i className="fa fa-github"></i></a></li>
                    <li><a href="https://tronscan.org/#/contract/TXh5o25svsvgmxqDG35gU1Xcq5BcmwmcqS" className="icoTron" title="Tron"><i className="fa fa-bitcoin"></i></a></li>
                    <li><a href="https://www.youtube.com/watch?v=0EHjpbdWvhc" className="icoYoutube" title="Youtube"><i className="fa fa-youtube"></i></a></li>
                    {/*<li><a href="#" className="icoTwitter" title="Twitter"><i className="fa fa-twitter"></i></a></li>*/}
                    {/*<li><a href="#" className="icoGoogle" title="Google +"><i className="fa fa-google-plus"></i></a></li>*/}
                    {/*<li><a href="#" className="icoLinkedin" title="Linkedin"><i className="fa fa-linkedin"></i></a></li>*/}
                  </ul>
                </div>
              </div>

              <div className="row align-center copyright">
                <div className="col-sm-12">
                  <p>All rights reserved by CryptoBeauty</p>
                </div>
              </div>
            </div>
          </section>

          {/* <a href="#header" className="scrollup"><i className="fa fa-chevron-up"></i></a> */}

        </div>
      </ParallaxProvider >
    );
  }

  // componentDidUpdate = async () => {
  //   console.log("window.skrollr", window.skrollr);
  // }
}

export default App;
