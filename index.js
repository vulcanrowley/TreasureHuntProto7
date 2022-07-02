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


//app.get('/', function (req, res) {
//  res.sendFile(__dirname + '/index.html');
//});

// using render instead of sendFile to enable server set random seed for all clients
// which enbles the Dungeon generator to build the same scene for every user
app.get('/', (req, res) => {
  res.render('index', { SceneCode: verificationCode});
});

io.on('connection', function (socket) {
  console.log('a user connected');
  socket.on('disconnect', function () {
    console.log('user disconnected');
  });
});


server.listen(8000, function () {
  console.log(`Listening on ${server.address().port}`);
});