// Import everything
import { ethers } from "ethers";

import dotenv from "dotenv";

dotenv.config();
const { RPC_URL, PRIVATE_KEY } = process.env;

const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

// Get write access as an account by getting the signer
const signer = await provider.getSigner();

const wallet = new ethers.Wallet(PRIVATE_KEY);

// const balance = await provider.getBalance(wallet.address);
// console.log("balance", balance / 1e18 );

const nonce = await provider.getTransactionCount(wallet.address, "latest");
console.log("nonce", nonce);

const exampleTx = {    
    to: "0xaE1f70DfD271B8be3f0122Ec291D3c43C3290d5A",
    value: ethers.utils.parseEther("0.001"),    // specified in wei where 10^18 wei = 1 ETH
    gasLimit: "21000",    // Standard limit is 21000 units
    maxFeePerGas: ethers.utils.parseUnits('2000', 'gwei'), // total amount you are willing to pay per gas for the transaction to execute
    nonce: nonce, // security purposes and to prevent replay attacks
    type: 2,  // https://eips.ethereum.org/EIPS/eip-2718
    chainId: 11155111,    // Sepolia Testnet
    //chainId: 80001,   // Polygon Testnet (Mumbai) 
  };

//const rawTransaction = await wallet.signTransaction(exampleTx);
//console.log("rawTransaction ", rawTransaction);




import { FlashbotsBundleProvider } from "@flashbots/ethers-provider-bundle";

// `authSigner` is an Ethereum private key that does NOT store funds and is NOT your bot's primary key.
// This is an identifying key for signing payloads to establish reputation and whitelisting
// In production, this should be used across multiple bundles to build relationship. In this example, we generate a new wallet each time
const authSigner = ethers.Wallet.createRandom();
//console.log("authSigner ", authSigner);

// Flashbots provider requires passing in a standard provider
const flashbotsProvider = await FlashbotsBundleProvider.create(
    provider, // a normal ethers.js provider, to perform gas estimiations and nonce lookups
    authSigner, // ethers.js signer wallet, only for signing request payloads, not transactions
    "https://relay-sepolia.flashbots.net",
    "sepolia"
  );
//console.log("flashbotsProvider ", flashbotsProvider);

const signedBundle = await flashbotsProvider.signBundle([
    {
        signer: wallet,
        transaction: exampleTx,
    },
    // we need this second tx because flashbots only accept bundles that use at least 42000 gas.
    {
        signer: wallet,
        transaction: exampleTx,
    },
]);

//console.log("signedBundle ", signedBundle);

// Look up the current block number (i.e. height)
const blockNumber = await provider.getBlockNumber() + 1;
// console.log("blockNumber", blockNumber);

const simulation = await flashbotsProvider.simulate(signedBundle, blockNumber);
console.log("simulation ", JSON.stringify(simulation, null, 2));

// const bundleSubmission = await flashbotsProvider.sendRawBundle(signedBundle, blockNumber);
// console.log("bundleSubmission ", bundleSubmission);


