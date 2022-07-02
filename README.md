Treasure Hunt base
first complete express, socketio, phaser and Dungeon with imports that can send
a random number to the master html file and get the same dungeon generated on each additional client.

Design: NPM kicks off the Exchange server which launches the client when a users signs in
The Dungeon is generated in the client from a random setting - 'dungeonCode' - assigned in the server
The clients collect user actions and send over socketio to the server, the server computes moves and returns to the clients who then repaint the client browser.[later add movement interpolation]

Multiprocesssor socket IO based on https://github.com/ivangfr/socketio-express-phaser3
Dungeon generation clbased on Mike West Dungeon see https://github.com/mikewesthad/dungeon
  and this article https://itnext.io/modular-game-worlds-in-phaser-3-tilemaps-3-procedural-dungeon-3bc19b841cd
