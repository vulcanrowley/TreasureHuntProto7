/*
<<<< code from Lobby for socket handling
*/
// node module includes
var uuid = require('node-uuid');

// include our custom server configuration
var Server = require('./server.js');
var Room = require('./room.js');

// local variables
var rooms = {};
var clients = {};

var server = new Server();


server.on('connection', function (client) {
    clients[client.id] = {id: client.id, room: null, color: '#' + ('00000' + (Math.random() * 16777216 << 0).toString(16)).substr(-6)};
    client.emit('update', rooms);
    broadcastDebugMsg(client.id + ' has joined the server');


    client.on('disconnect', function() {

        //if (clients[client.id].isHost) {
        //console.log("client "+client.id+" is disconnecting")
        var room = findRoomByID(client.id, rooms);
        //console.log(" client "+client.id+" and room deletion candidate "+room.id)
        if(room != null){
            //console.log(" client "+client.id+" and room deletion candidate "+room.id)
            room.clients.splice(client.id, 1)
            //console.log("players in room "+room.clients.length)
            if(room.clients.length == 0){
                //console.log("room being deleted "+room.id)
                delete rooms[room.id];
            }
            
        server.sockets.emit('update', rooms);

        }else{
            console.log(" no room to delete")
        }

        //}

        broadcastDebugMsg(client.id + ' has disconnected from the server');
        delete clients[client.id];
        
    });

    client.on('join', function(roomID, callback) {
        // join existing room
        //console.log(" in join socket for room "+roomID)
        if (connectClientToRoom(roomID, client.id)) {//, false)) {
            callback(roomID);
        }
    });

    // assign new room at server level
    client.on('new', function(data, callback) {
        // create new room ID on host
        var newRoomID = uuid.v4();
        //if (connectClientToRoom(newRoomID, client.id, true)) {
        if(creatNewRoom(newRoomID)){
            callback(newRoomID);
        }
    });

    client.on('chatMessage', function(msg) {
        // find out which room the client is in
        var room = findRoomByID(client.id, rooms);
        
        server.sockets.in(room.id).emit('addChatMessage', msg, client.id, clients[client.id].color);


    });

    function creatNewRoom(roomID){
        
        rooms[roomID] = new Room(roomID); //, clientID);
        broadcastDebugMsg('new room created '  + roomID);
        server.sockets.emit('update', rooms);
    }

    function connectClientToRoom(roomID, clientID) {//, isNew ) { //isHost) {
        // if the client is already a host, or already connected to a room
        if ( clients[clientID].room) {  // clients[clientID].isHost ||
            console.log(" already in a room")
            return false;
        }

        //console.log("in connect client "+clientID)
        client.join(roomID);//, function(err) {
        //    console.log(" client error "+err)
        
           // if (!err) {
                //console.log("No Err ")
                //clients[client.id].isHost = isHost;
                clients[clientID].room = roomID;
                //clients[client.id].room = roomID;
                //rooms[roomID] = new Room(roomID, clientID, isHost);

                // deprecated - function moved to seperate element
                
                //if (isNew){ //(isHost) {
                   // rooms[roomID] = new Room(roomID, clientID);
                    
                   // broadcastDebugMsg(clientID + ' has created room: ' + roomID);
                //} else {
                
                rooms[roomID].addClient(clientID);
                //console.log("client added to room "+rooms[roomID].clients[0])    
                broadcastDebugMsg(client.id + ' has joined room: ' + roomID);

                //}
                //console.log(" room update "+roomID)
                server.sockets.emit('update', rooms);

            //} else {
            //   console.log("problem joining room")

           // }


        //};


        return true;
    }

    function broadcastDebugMsg(msg) {
        server.sockets.emit('debugMessage', msg);
    }

    function findRoomByID(clientID, rooms) {
        var key, room;
        for (key in rooms) {
            if (rooms.hasOwnProperty(key)) {
                room = rooms[key];
               // console.log(" room ID",room.id)
                //if (room.hostID === hostID) {
                //    return room;
                //}
                //console.log(" deleting room length "+room.clients.length)
                for (var i = 0; i < room.clients.length; i++) {
                    if (room.clients[i] === clientID) {
                        return room;
                    }
                }
            }
        }
        return null;
    }

    function findRoomByroomID(roomid, rooms) {
        var key, room;
        for (key in rooms) {
            if (rooms.hasOwnProperty(key)) {
                room = rooms[key];
                if (room.id === roomid) {
                    return room;
                }

            }
        }
        return null;
    }
});
////////////////////////////////////////////////////
// end of Lobby code
/////////////////////////////////////////

