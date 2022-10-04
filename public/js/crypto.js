//import { Keypair, SystemProgram, Transaction } from '@solana/web3.js';
import * as solanaWeb3 from '@solana/web3.js';

async function connectWallet(){
    try {
       const resp = await window.solana.connect();
       pubKey = resp.publicKey.toString();
       //resp.connectWallet.
       console.log("Connected to the server? "+window.solana.isConnected+" and your public key is "+pubKey);   }catch (err) {
    }
 }

async function transferSOL(){
    const pubKey = window.solana.publicKey;   
    /*  
    const transferTransaction = new  web3.Transaction().add(web3.SystemProgram.transfer({
        fromPubkey: pubKey,
        toPubkey: new  web3.PublicKey("4GMEC5U6ka1AfeknaxcobGTL8WZxbVutYdRPsydvDSMu"), //public key of receive account in string
        lamports: 1000
    }))

            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: publicKey,
                    toPubkey: destAddress,
                    lamports: amount,
                })
            );

            signature = await sendTransaction(transaction, connection);

    */
    //const transferTransaction = new web3.Transaction();
    const transferTransaction = new SolanaWeb3.Transaction();
    transferTransaction.add(
        SolanaWeb3.SystemProgram.transfer({
            fromPubkey: pubKey,
            toPubkey: new  web3.PublicKey("4GMEC5U6ka1AfeknaxcobGTL8WZxbVutYdRPsydvDSMu"), //public key of receive account in string
            lamports: SolanaWeb3.LAMPORTS_PER_SOL * .01,
        })
        );

    //const txId = await sendTransaction(transaction, connection);



    const network = "https://api.devnet.solana.com";
    const connection = new web3.Connection(network);
    transferTransaction.feePayer = pubKey;
    let blockhash = (await connection.getLatestBlockhash("finalized")).blockhash;
    transferTransaction.recentBlockhash = blockhash;
    const {signature} = await
    window.solana.signAndSendTransaction(transferTransaction);
            console.log("test");
            await connection.confirmTransaction(signature);
            console.log(signature);
    }
