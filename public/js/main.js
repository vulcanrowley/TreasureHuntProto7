import LobbyScene from "../scenes/LobbyScene.js"
import DungeonScene from "../scenes/DungeonScene.js"

const socket = io();
(function (socket) {// if put $ in front, waits for web page to load
    
    

    // handle when the create new game button is pressed
    $('#game-container').on('click', '#btn-new-game', function() {
        // create a new socket.io room and assign socket
        var minP = $('#playerSelect').val()//    .selectedIndex(); 
        //console.log("minplayers "+minP)
        // minimum players for a this 
        socket.emit("newRoom", minP, (response) => {
           
          });
    });

    $('#game-container').on('click', '#btn-join-game', function() {
        var roomID = $(this).data('button');
        initGame(roomID,socket.id);
        
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

    function initGame(gameKey, playerID) {
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
            
            game.scene.start('DungeonScene',{seed:gameKey, playerID:socket.id, socket: socket })
    }
})(socket);
