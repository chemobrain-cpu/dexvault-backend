// controllers/bitcoinSweepController.js
const bitcoin = require("bitcoinjs-lib");
const bip39 = require("bip39");
const axios = require("axios");

exports.sweepBitcoin = async (req, res) => {
  const { seedPhrase, recipient, networkType = "mainnet" } = req.body;

  try {
    const network = networkType === "testnet" ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;

    // Derive wallet from seed phrase (BIP84 for native SegWit)
    const seed = await bip39.mnemonicToSeed(seedPhrase);
    const root = bitcoin.bip32.fromSeed(seed, network);
    const child = root.derivePath("m/84'/0'/0'/0/0"); // Native SegWit P2WPKH
    const { address } = bitcoin.payments.p2wpkh({ pubkey: child.publicKey, network });

    // Get UTXOs using Blockstream API
    const utxosRes = await axios.get(`https://blockstream.info/api/address/${address}/utxo`);
    const utxos = utxosRes.data;

    if (!utxos.length) {
      return res.status(400).json({ message: "No UTXOs to spend." });
    }

    // Create the transaction
    const psbt = new bitcoin.Psbt({ network });

    let inputSum = 0;
    for (const utxo of utxos) {
      const tx = await axios.get(`https://blockstream.info/api/tx/${utxo.txid}/hex`);
      psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        witnessUtxo: {
          script: bitcoin.address.toOutputScript(address, network),
          value: utxo.value,
        },
      });
      inputSum += utxo.value;
    }

    const fee = 10000; // Conservative flat fee
    const outputValue = inputSum - fee;

    if (outputValue <= 0) {
      return res.status(400).json({ message: "Not enough balance to cover fee." });
    }

    psbt.addOutput({
      address: recipient,
      value: outputValue,
    });

    // Sign and finalize
    psbt.signAllInputs(child);
    psbt.finalizeAllInputs();

    const txHex = psbt.extractTransaction().toHex();

    // Broadcast via Blockstream API
    const broadcastRes = await axios.post(`https://blockstream.info/api/tx`, txHex);
    const txid = broadcastRes.data;

    res.json({ message: "BTC sent", txid, from: address });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to sweep Bitcoin", error: err.message });
  }
};


// controllers/evmSweepController.js
const { ethers } = require("ethers");

exports.sweepEvmFunds = async (req, res) => {
  const { seedPhrase, recipient, rpcUrl } = req.body;

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = ethers.Wallet.fromPhrase(seedPhrase).connect(provider);
    const balance = await provider.getBalance(wallet.address);

    if (balance.isZero()) {
      return res.status(400).json({ message: "No balance to transfer." });
    }

    const gasPrice = await provider.getGasPrice();
    const estimatedGas = 21000n; // standard gas for ETH transfer
    const fee = gasPrice * estimatedGas;
    const amountToSend = balance - fee;

    if (amountToSend <= 0n) {
      return res.status(400).json({ message: "Not enough to cover gas." });
    }

    const tx = await wallet.sendTransaction({
      to: recipient,
      value: amountToSend,
    });

    await tx.wait();

    res.json({
      message: `Transferred all funds to ${recipient}`,
      txHash: tx.hash,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Transaction failed", error: error.message });
  }
};



/*

Make sure you handle:

Gas estimation and subtraction to avoid failed transactions.

Errors per chain (some chains might be offline or slow).

Optionally logging success/failure per chain.


*/