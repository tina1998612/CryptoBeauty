// import tronweb from "tronweb";

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const getTronWeb = () =>
  new Promise((resolve, reject) => {
    // Wait for loading completion to avoid race conditions with web3 injection timing.
    window.addEventListener("load", async () => {

      // wait for 0.1 second to let TronLink initiate
      await sleep(100);

      if (window.tronWeb) {
        const tronWeb = window.tronWeb;
        resolve(tronWeb);
      }
      else {
        // alert("Please install Tron Link and sign in.");
        reject("no tron link");
      }

      // // Legacy dapp browsers...
      // else if (window.web3) {
      //   // Use Mist/MetaMask's provider.
      //   const web3 = window.web3;
      //   console.log("Injected web3 detected.");
      //   resolve(web3);
      // }
      // // Fallback to localhost; use dev console port by default...
      // else {
      //   const provider = new Web3.providers.HttpProvider(
      //     "http://127.0.0.1:9545"
      //   );
      //   const web3 = new Web3(provider);
      //   console.log("No web3 instance injected, using Local web3.");
      //   resolve(web3);
      // }
    });
  });

export default getTronWeb;
