Treasure Hunt base
first complete express, socketio, phaser and Dungeon with imports that can send
a random number to the master html file and get the same dungeon generated on each additional client.

Design: NPM kicks off the Exchange server which launches the client when a users connects
(TBD - add lobby)
The Dungeon is generated in the client from a random setting - 'dungeonCode' - assigned in the server so all clients create the same world
The clients collect user actions and send over socketio to the server, the server computes moves and returns to the clients who then repaint the client browser.[later add movement interpolation]

Multiprocesssor socket IO based on https://github.com/ivangfr/socketio-express-phaser3
Dungeon generation clbased on Mike West Dungeon see https://github.com/mikewesthad/dungeon
  and this article https://itnext.io/modular-game-worlds-in-phaser-3-tilemaps-3-procedural-dungeon-3bc19b841cd

DevLog:7/9/22
Most of localhost version running except combat and health decay disabled during dev

All functions operational

App is deployed on Render.com as RowleyCryptoGames.com or https://treasurehuntproto.onrender.com/


