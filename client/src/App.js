import React, { Component } from "react";
import { Route, Link, Switch } from "react-router-dom";
import { ParallaxProvider } from 'react-skrollr'
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

class App extends Component {
  state = {
    tronWebState: {
      installed: false,
      loggedIn: false,
    },
    tronWeb: null,
    defaultAddress: null,
    ContractJSON: ContractJSON,
    networkId: '2',
    abi: [],

    accounts: null,
    contract: null,

    drawCardPrice: 50000000,
    myCards: [],
    playerLastFreeDrawTime: 0,
    freeDrawTimeGap: 82800, // 23 hours
  };

  componentDidMount = async () => {
    try {
      const { networkId } = this.state;

      const tronWeb = await getTronWeb();

      const tronWebState = {
        installed: !!tronWeb,
        loggedIn: !!tronWeb && tronWeb.ready,
      }
      console.log("tronWebState", tronWebState);
      this.setState({
        tronWeb,
        tronWebState,
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
      freeDrawTimeGap:  freeDrawTimeGap.toNumber()
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
    const { tronWeb, networkId, ContractJSON, defaultAddress } = this.state;

    const contractAddressBase58 = ContractJSON.networks[networkId].addressBase58;

    const Http = new XMLHttpRequest();
    let url;
    if (networkId == '2') {
      url = 'https://api.shasta.trongrid.io/event/contract/'
        + contractAddressBase58
        + '/CardDrawn?since=1546530140000&size=200&page=1';
    }
    Http.open("GET", url);
    Http.send();
    Http.onreadystatechange=(e)=>{
      console.log(Http.responseText)
    }

    // const { tronWeb, networkId, ContractJSON, defaultAddress } = this.state;

    // const contractAddressBase58 = ContractJSON.networks[networkId].addressBase58;

    // console.log("getMyCards");

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

  getMyCardsFromRequest = async () => {
    const { tronWeb, networkId, ContractJSON, defaultAddress } = this.state;

    const contractAddressBase58 = ContractJSON.networks[networkId].addressBase58;

    const Http = new XMLHttpRequest();
    let url;
    if (networkId == '2') {
      url = 'https://api.shasta.trongrid.io/event/contract/'
        + contractAddressBase58
        + '/CardDrawn?since=1546530140000&size=200&page=1';
    }
    Http.open("GET", url);
    Http.send();
    Http.onreadystatechange=(e)=>{
      console.log(Http.responseText)
    }
  }

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

    const result = await contract.freeDrawCard(10000000).send({
      feeLimit: undefined,
      callValue: 0,
      shouldPollResponse: true
    });
    console.log(result);
    this.getPlayerLastFreeDrawTime();
    this.getMyCards();
    alert("抽卡完成，請點擊右上角 My Girls 前往查看");

    // this.triggerContract('freeDrawCard', [0], (transactionHash) => {
    //   console.log("freeDrawCard transactionHash", transactionHash);
    // });
  };

  drawCard = async () => {
    const { contract, drawCardPrice } = this.state;

    console.log("drawCard");

    const result = await contract.drawCard(0).send({
      feeLimit: undefined,
      callValue: drawCardPrice,
      shouldPollResponse: true
    });
    console.log("drawCard result", result);
    this.getMyCards();
    alert("抽卡完成，請點擊右上角 My Girls 前往查看");
  };

  draw10Cards = async () => {
    const { contract, drawCardPrice } = this.state;

    console.log("draw10Cards");
    const cardCount = 10
    const result = await contract.drawMultipleCards(0, cardCount).send({
      feeLimit: undefined,
      callValue: drawCardPrice * cardCount,
      shouldPollResponse: true
    });
    console.log("drawCard result", result);
    this.getMyCards();
    alert("抽卡完成，請點擊右上角 My Girls 前往查看");
  };

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
          <section id="header" className="appear"></section>
          <div className="navbar navbar-fixed-top" role="navigation" data-0="line-height:60px; height:60px; background-color:rgba(68,188,221,1);" data-300="line-height:40px; height:40px; background-color:rgba(68,188,221,0.6);">
            <div className="container">
              <div className="navbar-header">
                <button type="button" className="navbar-toggle" data-toggle="collapse" data-target=".navbar-collapse">
                    <span className="fa fa-bars color-white"></span>
                  </button>
                <h1>
                  <Link to="/" className="navbar-brand" data-0="line-height:60px;" data-300="line-height:50px;">CryptoBeauty</Link>
                </h1>
              </div>
              <div className="navbar-collapse collapse">
                <ul className="nav navbar-nav" data-0="margin-top:10px;" data-300="margin-top:5px;">
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
                </ul>
              </div>
            </div>
          </div>

          <Switch>
            <Route exact path="/asset"><div>

              <section id="section-works" className="section appear clearfix">
                <div className="container">

                  <div className="row mar-bot40">
                    <div className="col-md-offset-3 col-md-6">
                      <div className="section-header">
                        <h2 className="section-heading animated" data-animation="bounceInUp">Girls in the house</h2>
                      </div>
                    </div>
                  </div>

                  {
                  !this.state.tronWebState.loggedIn ?
                  <div>
                    <h2>您與密碼女孩的距離</h2>
                    <h2>只剩下一個已解鎖的 <a target="_blank" rel="noopener noreferrer"  href="https://chrome.google.com/webstore/detail/tronlink/ibnejdfjmmkpcnlpebklmnkoeoihofec">TronLink</a></h2>
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

                    <Cards cards={this.state.myCards}></Cards>
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
                    <img className="align-left"
                      style={{width: "400px", left: "60px", top: "35px", position: "absolute"}} src="img/logo/cryptobeautylogo01.png" alt="" />
                    <h1 className="align-left color-black pad-top20">Crypto Beauty <span className="color-2blue">密碼女孩</span></h1>
                    <h4 className="align-left color-black"><b>你專屬的區塊鏈少女卡片創作交易平台</b></h4>
                  </div>
                </div>
              </section>

              <section id="section-services" className="section pad-bot20 bg-white">
                <div className="container">

                  <h2 className="align-center color-swimsuitblue pad-bot20">你的女孩，一鍵擁有</h2>

                  {
                  !this.state.tronWebState.loggedIn ?
                  <div>
                    <h2>您與密碼女孩的距離</h2>
                    <h2>只剩下一個已解鎖的 <a target="_blank" rel="noopener noreferrer"  href="https://chrome.google.com/webstore/detail/tronlink/ibnejdfjmmkpcnlpebklmnkoeoihofec">TronLink</a></h2>
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
                              <i className="color-white">每日免費抽</i>
                            </div>
                          </div>
                        </div>
                        :
                        <div className="button-container">
                          <div className="">
                            <div className="button button-muted">
                              <i className="color-white">每日免費抽</i>
                            </div>
                          </div>
                        </div>
                        }


                        <h4 className="color-2blue">
                          <FreeDrawCountdown endTime={ canFreeDrawTime }></FreeDrawCountdown>
                        </h4>
                      </div>
                    </div>


                    <div className="col-lg-4">
                      <div className="align-center">
                        <div className="button-container button-slide-horizontal">
                          <div className="slider slider-horizontal">
                              <div className="button" onClick={this.drawCard}>
                                <i className="color-white">單張抽卡</i>
                              </div>
                            </div>
                        </div>
                        <h4 className="color-2blue">50 TRX</h4>
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
                        <h4 className="color-2blue">500 TRX</h4>
                      </div>
                    </div>

                    {/* tx state */}
                    <div>

                    </div>

                  </div>

                  }

                </div>
              </section>

              <section id="testimonials" className="section" data-stellar-background-ratio="0.5">
                <div className="container">
                  <div className="row">
                    <div className="col-lg-12">
                      <div className="align-center">
                        <div className="testimonial pad-top40 pad-bot40">
                          <h1 className="color-swimsuitblue">
                            取得網紅私密線下活動的專屬門票
                          </h1>
                          <br/>
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
                        <h2 className="section-heading animated" data-animation="bounceInUp">區塊鏈 X 模特</h2>
                        <p>清純制服 / 限量版型 / 區塊鏈 / 數位加密 / 私有資產 </p>
                      </div>
                    </div>
                  </div>

                  <div className="row align-center mar-bot40">
                    <div className="col-md-3">
                      <div className="team-member">
                        <figure className="member-photo"><img src="img/team/member5.jpg" alt="" /></figure>
                        <div className="team-detail">
                          <h4>婷婷</h4>
                          <span>IG:tinaaalee</span>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="team-member">
                        <figure className="member-photo"><img src="img/team/member6.jpg" alt="" /></figure>
                        <div className="team-detail">
                          <h4>思嫺</h4>
                          {/* <span>IG:xxx</span> */}
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="team-member">
                        <figure className="member-photo"><img src="img/team/member7.jpg" alt="" /></figure>
                        <div className="team-detail">
                          <h4>小敬</h4>
                          {/* <span>IG:xxx</span> */}
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="team-member">
                        <figure className="member-photo"><img src="img/team/member8.jpg" alt="" /></figure>
                        <div className="team-detail">
                          <h4>妤珊</h4>
                          {/* <span>IG:xxx</span> */}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </section>

            </div></Route>
          </Switch>



          <section id="footer" className="section footer">
            <div className="container">
              {/* <div className="row animated opacity mar-bot20" data-andown="fadeIn" data-animation="animation">
                <div className="col-sm-12 align-center">
                  <ul className="social-network social-circle">
                    <li><a href="#" className="icoRss" title="Rss"><i className="fa fa-rss"></i></a></li>
                    <li><a href="#" className="icoFacebook" title="Facebook"><i className="fa fa-facebook"></i></a></li>
                    <li><a href="#" className="icoTwitter" title="Twitter"><i className="fa fa-twitter"></i></a></li>
                    <li><a href="#" className="icoGoogle" title="Google +"><i className="fa fa-google-plus"></i></a></li>
                    <li><a href="#" className="icoLinkedin" title="Linkedin"><i className="fa fa-linkedin"></i></a></li>
                  </ul>
                </div>
              </div> */}

              <div className="row align-center copyright">
                <div className="col-sm-12">
                  <p>All rights reserved by CryptoBeauty</p>
                </div>
              </div>
            </div>
          </section>

          {/* <a href="#header" className="scrollup"><i className="fa fa-chevron-up"></i></a> */}

        </div>
      </ParallaxProvider>
    );
  }

  // componentDidUpdate = async () => {
  //   console.log("window.skrollr", window.skrollr);
  // }
}

export default App;
