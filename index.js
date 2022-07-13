// index.js
var express = require('express');
const crypto = require("crypto");
const path = require('path');
const port = process.env.PORT || 8000;

var app = express();
var server = require('http').Server(app);
//var io = require('socket.io').listen(server);

// revised socketio code
const socketio = require("socket.io");
const io = socketio(server);

const n = crypto.randomInt(0, 1000000);
const verificationCode = n.toString().padStart(6, "0");

app.use(express.json());
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');

var players = {};  // in-memory database of players
//app.get('/', function (req, res) {
//  res.sendFile(__dirname + '/index.html');
//});

// using render instead of sendFile to enable server set random seed for all clients
// which enbles the Dungeon generator to build the same scene for every user
app.get('/', (req, res) => {
  res.render('index', { SceneCode: verificationCode});
});




server.listen(port, () => console.log(`Treasure Hunt listening on port ${port}!`));
//server.listen(8000, function () {
  //console.log(`Listening on ${server.address().port}`);
//});

// Server Game code maintaining player's states and using socketIO to update clients
/////////////////////////////////////////////////////////////////////////////////

var playerColors =['0xff0000','0x00ff00','0xcdcdcd','0x0000ff','0x6495ED' ,'0x3366ff','0x33ccff','0xE06F8B']
var playerCnt = 0;
// repeating timer to reduce all players health by 1 point every 1 second (final parameters 
// to be set in playtesting)
//  DISABLED DURING DEVELOPMENT
setInterval(()=> {
  if(players){
    Object.keys(players).forEach( function (id) {
      players[id].health -= 1;
    if(players[id].health< 0){
      players[id].playerStarved = true;
      // tell every client that a player is dead
      //io.emit('playerDisconnected', players[id].playerId);
      //delete players[players[id]];
      //console.log('player [' + players[id].playerId + '] disconnected')
    }
  });
  // send msg to reduce health for all clients
  io.emit('healthUpdate',players);
 }
},1000)// reduce health for all players once per second



// creates player when client connects
// sets up server commands to:
// - tell all players that a new player has arrived ("newPlayer")
// --- defines inital player state in the server
// - send list of all players to new client connection
// - relay each player movement to all other("playerMoved") when notified bu msg ("playerMovement")
// --- NEEDS CHECKS FOR LEGIT MOVEMENT
// - sets up collision responses for:
// --- "jugHit" to deal with gathering food
// --- "treasureHit" to deal with gathering treasure setting player color to GOLD
// --- "combatHit" to deal with player vs player contact
// --- "exitHit" ends game if player hasTreasure is true

io.on('connection', function (socket) {
  playerCnt += 1;
  if (playerCnt <9){
    console.log('player [' + socket.id + '] connected')

    var playerColor ='0xffffff'
    if(playerColors.length>0){
      playerColor =playerColors.pop();
    }
   
    console.log("color is "+playerColor)
    players[socket.id] = {
      health: 100,
      playerKilled: false,
      playerStarved: false,
      hasTreasure: false,
      x: Math.floor(Math.random() * 150) -75,// initial x position
      y: Math.floor(Math.random() * 150) -75,// initial y position
      playerId: socket.id,
      color: playerColor//getPlayerColor()//getRandomColor()// but not gold
    }
    socket.emit('currentPlayers', players)
    socket.broadcast.emit('newPlayer', players[socket.id])

  }else{
    // over max connection - 8 
    this.socket.disconnect(true);
    console.log("No player slot available")
  }


 
  socket.on('disconnect', function () {
    console.log('player [' + socket.id + '] disconnected')
    delete players[socket.id]
    io.emit('playerDisconnected', socket.id)
  })

  socket.on('playerMovement', function (movementData) {
    players[socket.id].x = movementData.x
    players[socket.id].y = movementData.y
    //console.log(socket.id+ " moved "+ movementData.x);
    socket.broadcast.emit('playerMoved', players[socket.id])
  })

  // When player encounters a jug, increase health on server and tell all clients that jug is gone
  socket.on('jugHit', function (jug) {
    players[socket.id].health += 10;
    
    console.log(socket.id+ " health "+ players[socket.id].health);
    socket.broadcast.emit('jugRemoved', jug)
  })

  // When player finds treasure, delete treasure, change player icon to gold, set has Treasure flag
  // which slows down player speed
  socket.on('treasureHit', function (jug) {
    players[socket.id].hasTreasure = true;
    players[socket.id].color = "0xFFFF00";
    console.log(socket.id+ " found treasure ");
    socket.broadcast.emit('treasureFound',{ jug:jug, player:socket.id} ) //socket.broadcast.emit
  })

    // When player touches player, reduce both players by random amount and tell all clients
  socket.on('combatHit', function (fighters) {
   
    // reduce health in both players by random amount in range 0-2
    //console.log(" attacker "+fighters.attacker+" target "+fighters.target)
    players[fighters.attacker].health -= Math.floor(Math.random() * 5)
    
    if(players[fighters.attacker].health<0){
      players[fighters.attacker].playerKilled=true;
      players[fighters.attacker].color = "0x000000"
      // test if carrying treasure
      if(players[fighters.attacker].hasTreasure){
        // give treasure other player
        //console.log(fighters.attacker+" killed and has treasure")
        players[fighters.attacker].hasTreasure= false
        players[fighters.target].hasTreasure = true
        players[fighters.target].color = "0xfafad2"
        
      }// end Treasure check
    }// end attacker check
    
    players[fighters.target].health -= Math.floor(Math.random() * 5)
    
    if(players[fighters.target].health<0){
      players[fighters.target].playerKilled=true;
      players[fighters.target].color = "0x000000"

      if(players[fighters.target].hasTreasure){
        // give treasure other player
        console.log(fighters.target+" killed and had treasure")
        players[fighters.target].hasTreasure= false
        players[fighters.attacker].hasTreasure = true
        players[fighters.attacker].color = "0xfafad2"
        
      }
    }
    //edge conditions
    //  - when both layer die in same combat collision
    //  -- drop treasure at spot? or back at original spot??
    //  - has does melee work?
    io.emit('healthUpdate', players)//socket.broadcast.emit wouldn't update player sending msg
  })

    // When player finds Exit and has treasure, transfer to winner/loser scene and end gane
  socket.on('exitHit', function () {
    //console.log(" in server");
    if(players[socket.id].hasTreasure == true)
      {// declare winner in new screen and end game
        console.log(socket.id+ " took the Treasure - has left the Game ");
        // tell everybody else, game over
        let reasonCode ='lost'
        socket.broadcast.emit('gameOver',{reason:reasonCode})// means another player escaped with treasure
      };
    
    
  })// end of exitHit



})// end of socketIO section

function getRandomColor() {
  // but not gold 0xfafad2; reserved for player carrying treasure

  varColor = '0x' + Math.floor(Math.random() * 16777215).toString(16);
  while(varColor == "0xFFFF00"){
      varColor = '0x' + Math.floor(Math.random() * 16777215).toString(16);
    }
  return varColor;
}