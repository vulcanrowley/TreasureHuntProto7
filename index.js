// index.js
var express = require('express');
const crypto = require("crypto");
const path = require('path');

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


server.listen(8000, function () {
  console.log(`Listening on ${server.address().port}`);
});

// Server Game code maintaining player's states and using socketIO to update clients
/////////////////////////////////////////////////////////////////////////////////
var players = {}// in memory player table

// repeating timer to reduce all players health by 1 point every 1 second (final parameters 
// to be set in playtesting)
/*  DISABLED DURING DEVELOPMENT
setInterval(()=> {
  if(players){
    Object.keys(players).forEach( function (id) {
      players[id].health -= 1;
    if(players[id].health< 0){
      
      // tell every client that a player is dead
      io.emit('playerDisconnected', players[id].playerId);
      delete players[players[id]];
      console.log('player [' + players[id].playerId + '] disconnected')
    }
  });
  // send msg to reduce health for all clients
  io.emit('healthUpdate',players);
 }
},1000)// reduce health for all players once per second
*/


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
  console.log('player [' + socket.id + '] connected')

  players[socket.id] = {
    health: 100,
    hasTreasure: false,
    x: Math.floor(Math.random() * 150) -75,// initial x position
    y: Math.floor(Math.random() * 150) -75,// initial y position
    playerId: socket.id,
    color: getRandomColor()// but not gold
  }
  socket.emit('currentPlayers', players)
  socket.broadcast.emit('newPlayer', players[socket.id])
 
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
    
    console.log(socket.id+ " found treasure ");
    io.emit('treasureFound', jug) //socket.broadcast.emit
  })

    // When player touches player, reduce both players by random amount and tell all clients
  socket.on('combatHit', function (jug) {
    // debounce so only initial contact matters
    // reduce health in both players by random amount in range 0-2
    //Math.floor(Math.random() * 3)
    
    console.log(socket.id+ " COMBAT!! ");
    io.emit('healthUpdate', players)//socket.broadcast.emit
  })

    // When player finds Exit and has treasure, transfer to winner/loser scene and end gane
  socket.on('exitHit', function (jug) {
    if(players[socket.id].hasTreasure == true)
      {// declare winner in new screen and end game
      };
    
    console.log(socket.id+ " found exit ");
    socket.broadcast.emit('gameOver', jug)
  })



})

function getRandomColor() {
  // but not gold 0x0xfafad2; reserved for player carrying treasure

  varColor = '0x' + Math.floor(Math.random() * 16777215).toString(16);
  while(varColor == "0xfafad2"){
      varColor = '0x' + Math.floor(Math.random() * 16777215).toString(16);
    }
  return varColor;
}