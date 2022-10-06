import LobbyScene from "../scenes/LobbyScene.js"
import DungeonScene from "../scenes/DungeonScene.js"
/*
import {
    Connection,
    Keypair,
    SystemProgram,
    LAMPORTS_PER_SOL,
    Transaction,
    sendAndConfirmTransaction,
  } from "@solana/web3.js";

 */
//(async () => { // function transferSOL
$(function () { // needs to have prepend $ to make load first
    $( '#solana-wallet' ).on( "click", function( event ) {
        event.preventDefault();
        console.log("Button pressed")
        // open Phantom Wallet   or got to download site 

    });
})      

/*
// opens Phantom Wallet    
const getProvider = () => {
    if ('phantom' in window) {
      const provider = window.phantom?.solana;
      if (provider?.isPhantom) {
          //console.log("FOund Phantom")
        return provider;
      }
    }
  }
const connection = new solanaWeb3.Connection(
    "https://api.devnet.solana.com",
    "confirmed"
  );
const provider = getProvider(); 

// see what account we are using
try {
    const resp = await provider.connect();
    console.log(`Public Key is ${resp.publicKey.toString()}`);
    // 26qv4GCcx98RihuK3c4T6ozB3J7L6VwCuFVc7Ta2A3Uo 
    } catch (err) {
    // { code: 4001, message: 'User rejected the request.' }
}

//provider.on("connect", () => console.log("connected!"));
// build transaction to send 1000 lamports to recPubkey from Wallet
const pubKey = window.solana.publicKey; 
const recPubkey = new  solanaWeb3.PublicKey("4GMEC5U6ka1AfeknaxcobGTL8WZxbVutYdRPsydvDSMu") //public key of receive account in string
const transaction = new solanaWeb3.Transaction();
transaction.add(
    solanaWeb3.SystemProgram.transfer({
    fromPubkey: pubKey, 
    toPubkey: recPubkey, 
    lamports: 1000,
  })
);

// some data that Sign needs
transaction.feePayer = pubKey;
let blockhash = (await connection.getLatestBlockhash("finalized")).blockhash;
transaction.recentBlockhash = blockhash;

// Ask wallet to sign transaction and , if approved, send SOL to recPubkey
const { signature } = await provider.signAndSendTransaction(transaction);
await connection.getSignatureStatus(signature);
//})();
*/


/*
    // test code for access to solanaWeb3  WORKS!!
  (async () => {
    const fromKeypair = solanaWeb3.Keypair.generate();
    const toKeypair = solanaWeb3.Keypair.generate();
  
    const connection = new solanaWeb3.Connection(
      "https://api.devnet.solana.com",
      "confirmed"
    );
  
    const airdropSignature = await connection.requestAirdrop(
      fromKeypair.publicKey,
      solanaWeb3.LAMPORTS_PER_SOL
    );
  
    await connection.confirmTransaction(airdropSignature);
  
    const lamportsToSend = 1_000_000;
  
    const transferTransaction = new solanaWeb3.Transaction().add(
        solanaWeb3.SystemProgram.transfer({
        fromPubkey: fromKeypair.publicKey,
        toPubkey: toKeypair.publicKey,
        lamports: lamportsToSend,
      })
    );
  console.log(" sent to "+toKeypair.publicKey)
    
    await solanaWeb3.sendAndConfirmTransaction(connection, transferTransaction, [
      fromKeypair,
    ]);
  })();
*/
const socket = io();
var minP =1;
(function (socket) {// runs immediately, once. if put $ in front, waits for web page to load
    /*  determine mobile device 
            const isMobile = () => {
        return !!navigator.userAgent.match(
            /(iPhone|iPod|Android|ios|iOS|iPad|Backerry|WebOS|Symbian|Windows Phone|Phone)/i
        );
        };
    */
    

    // handle when the create new game button is pressed
    $('#game-container').on('click', '#btn-new-game', function(event) {
        event.preventDefault;
        // create a new socket.io room and assign socket
        minP = $('#playerSelect').val()//    .selectedIndex(); 
        //console.log("minplayers "+minP)
        // minimum players for a this 
        socket.emit("newRoom", minP, (response) => {
           
          });
    });

    $('#game-container').on('click', '#btn-join-game', function() {
        var roomID = $(this).data('button');
        initGame(roomID,minP);
        
    });

    $('#game-container').on('submit', 'form', function() {

        socket.emit('chatMessage', $('#chat-box-input').val());

        $('#chat-box-input').val('');

        return false;
    });

    socket.on('debugMessage', function(msg) {
        $('#debug').append('<p>' + msg + '</p>');
    });

    /*
    socket.on('addChatMessage', function(msg, clientID, color) {
        $('#game').append('<p style="color:' + color + ';">' + clientID + ": " + '<span>' + msg);
        $('#game')[0].scrollTop = $('#game')[0].scrollHeight;
    });
    */

    socket.on('update', function(rooms) {
        var room, key;
        $('.room-list-item').remove();
        for (key in rooms) {
            if (rooms.hasOwnProperty(key)) {
                room = rooms[key];
                // keep adding players to count until fill, then don't display LOgin option
                if(room.clients.length < room.minPlayers){
                    addSingleRoomToList(room);
                }
            }
        }
    });

    function addSingleRoomToList(room) {
            $('#game-list-table').append(
                '<tr class="room-list-item">'
                + '<td>' + room.id + '</td>'
                + '<td>' + room.clients.length + '/'+room.minPlayers+'</td>'
                + '<td><button id=btn-join-game data-button=' + room.id + '>Join Game</button></td>'
            );
    }

    function initGame(gameKey, numPlayers) {
        $('#game-list-options').remove()
        $('#debug').remove()
        $('#game-container').append(
            '<div id=game></div>' );//+
            //'<div id=chat-box><form action=""><input autofocus id="chat-box-input" autocomplete="off" /><button>Send</button></form></div>');
   
            var config = {
                type: Phaser.AUTO,
                parent: "game",
                width: 800,
                height: 600,
                active: false,
                seed: 5,
                backgroundColor: '#ff0000',
                physics: {
                    default: "arcade",
                    arcade: {
                    debug: false,
                    gravity: { y: 0 },
                    },
                }
             }

            //console.log(" launching with "+seedList[gameKey]+" from game "+gameKey)
            //var game = new Phaser.Game(config);
            //game.scene.add('LobbyScene', LobbyScene, false);
            //game.scene.start('LobbyScene',{seed: seedList[gameKey]})
            //console.log("gameKey is "+gameKey)
            var game = new Phaser.Game(config);
            //console.log('sceneSeed in Game.js '+sceneSeed);
            // set active to false in config
            // dont set scene in config
            // add scene using key from scene modulle
            game.scene.add('DungeonScene', DungeonScene, false);
            //game.scene.start('DungeonScene',{seed: gameKey,gameRoom:gameKey})
            
            game.scene.start('DungeonScene',{seed:gameKey, playerID:socket.id, socket: socket,numPlayers:numPlayers })
    }
})(socket);
