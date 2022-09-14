const crypto = require("crypto");

function Room(id){  //}, clientID) {
    this.id = id;
    const n = crypto.randomInt(0, 1000000);
    this.sceneCode = n.toString().padStart(6, "0");
    this.clients = [];
    this.ready = false;
    this.minPlayers =1;
    

};

Room.prototype.addClient = function(clientID) {
    this.clients.push(clientID);
};



module.exports = Room;