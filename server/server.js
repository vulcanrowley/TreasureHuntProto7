// use express to initialize a function handler to be passed to a new node HTTP server
process.env.PORT = process.env.PORT || 3000;

var Server = function() {
    var express = require('express');
    var app = express();
    var http = require('http').Server(app);
    var io = require('socket.io')(http);
/*
// possible hack for Render lack of socket IO on free tier after 5 minites
    var ReconnectingWebSocket = require('reconnecting-websocket');

    const rws = new ReconnectingWebSocket('ws://treasurehuntproto6.onrender.com');

    rws.addEventListener('open', () => {
        rws.send('hello!');
    });
*/
    // express static file middleware
    app.use(express.static(__dirname + '/../public'));

    // listen for get requests on the root directory and respond
    app.get('/', function (req, res) {
        res.sendFile(__dirname + '/../public/index.html');
    });

    // listen on port 3000 for user connections
    //app.listen(process.env.PORT);
    http.listen(process.env.PORT, function () {
        console.log('listening on *:' + process.env.PORT);
    });

    // all we need is the io handle for client sever communication - encapsulate the rest
    return io;
};

module.exports = Server;


