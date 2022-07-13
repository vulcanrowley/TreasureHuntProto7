import Player from "/js/player.js";
import LostScene from "/scenes/LostScene.js";
import WinnerScene from "/scenes/WinnerScene.js";
import LobbyScene from "/scenes/LobbyScene.js";
import TILES from "/js/tile-mapping.js";
import TilemapVisibility from "/js/tilemap-visibility.js";
//import {Scene} from 'phaser'

/******************************************************
 * Massive Base Class and supporting function
 * ------------------------------------------
 * Has two main sections
 * - DungeonGeneration - builds a dungeon and populates rooms with
 * -- food jugs, a Treasure and two Exits
 * -- each client generates and has his own copy of the dungeon map but size all
 * --- clients use the same scene seed, they are all the same
 * - Player functions controlled by server
 * -- movement, collisions, etc
 */
export default class DungeonScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DungeonScene' })

  }

  init (data)// used to transfer data into scene from scene.start
  {
      //console.log('seed transfered to Dungeon', data.seed);
      // sceneSeed set by server to make all client scenes the same
      this.sceneSeed = data.seed;

      //game.stage.disableVisibilityChange = true;// maybe game.scene???
};
      

  preload() {
      this.load.image("tiles", "../assets/tilesets/buch-tileset-48px-extruded.png");
      this.load.image("other", "../assets/star_gold.png");
      this.load.image("enemy", "../assets/enemyBlack5.png");
      this.load.spritesheet(
      "characters",
      "../assets/spritesheets/buch-characters-64px-extruded.png",
      {
          frameWidth: 64,
          frameHeight: 64,
          margin: 1,
          spacing: 2,
      }
      );

  }

  create() {
    var self = this;
    this.socket = io();
      // Generate a random world based on sceneSeed with a few extra options:
      //  - Rooms should only have odd number dimensions so that they have a center tile.
      //  - Doors should be at least 2 tiles away from corners, so that we can place a corner tile on
      //    either side of the door location
      this.dungeon = new Dungeon({
      width: 30,
      height: 30,
      doorPadding: 2,
      randomSeed: this.sceneSeed,//this.level,
      rooms: {
          width: { min: 7, max: 15, onlyOdd: true },
          height: { min: 7, max: 15, onlyOdd: true },
      },
      });

      // draw diagnostic map in console
      //this.dungeon.drawToConsole();

      // Creating a blank tilemap with dimensions matching the dungeon
      const map = this.make.tilemap({
          tileWidth: 48,
          tileHeight: 48,
          width: this.dungeon.width,
          height: this.dungeon.height,
      });
      console.log(' number of rooms - '+this.dungeon.rooms.length);
      const tileset = map.addTilesetImage("tiles", null, 48, 48, 1, 2); // 1px margin, 2px spacing
      this.groundLayer = map.createBlankLayer("Ground", tileset).fill(TILES.BLANK);
      this.stuffLayer = map.createBlankLayer("Stuff", tileset);
      const shadowLayer = map.createBlankLayer("Shadow", tileset).fill(TILES.BLANK);

      this.tilemapVisibility = new TilemapVisibility(shadowLayer);

      // Use the array of rooms generated to place tiles in the map
      // Note: using an arrow function here so that "this" still refers to our scene
      this.dungeon.rooms.forEach((room) => {
          const { x, y, width, height, left, right, top, bottom } = room;

          // Fill the floor with mostly clean tiles
          this.groundLayer.weightedRandomize(TILES.FLOOR, x + 1, y + 1, width - 2, height - 2);

          // Place the room corners tiles
          this.groundLayer.putTileAt(TILES.WALL.TOP_LEFT, left, top);
          this.groundLayer.putTileAt(TILES.WALL.TOP_RIGHT, right, top);
          this.groundLayer.putTileAt(TILES.WALL.BOTTOM_RIGHT, right, bottom);
          this.groundLayer.putTileAt(TILES.WALL.BOTTOM_LEFT, left, bottom);

          // Fill the walls with mostly clean tiles
          this.groundLayer.weightedRandomize(TILES.WALL.TOP, left + 1, top, width - 2, 1);
          this.groundLayer.weightedRandomize(TILES.WALL.BOTTOM, left + 1, bottom, width - 2, 1);
          this.groundLayer.weightedRandomize(TILES.WALL.LEFT, left, top + 1, 1, height - 2);
          this.groundLayer.weightedRandomize(TILES.WALL.RIGHT, right, top + 1, 1, height - 2);

          // Dungeons have rooms that are connected with doors. Each door has an x & y relative to the
          // room's location. Each direction has a different door to tile mapping.
          const doors = room.getDoorLocations(); // → Returns an array of {x, y} objects
          for (let i = 0; i < doors.length; i++) {
              if (doors[i].y === 0) {
              this.groundLayer.putTilesAt(TILES.DOOR.TOP, x + doors[i].x - 1, y + doors[i].y);
              } else if (doors[i].y === room.height - 1) {
              this.groundLayer.putTilesAt(TILES.DOOR.BOTTOM, x + doors[i].x - 1, y + doors[i].y);
              } else if (doors[i].x === 0) {
              this.groundLayer.putTilesAt(TILES.DOOR.LEFT, x + doors[i].x, y + doors[i].y - 1);
              } else if (doors[i].x === room.width - 1) {
              this.groundLayer.putTilesAt(TILES.DOOR.RIGHT, x + doors[i].x, y + doors[i].y - 1);
              }
          }
      });

      // Separate out the rooms into:
      //  - The starting room (index = 0)
      //  - A random room to be designated as the end room (with stairs and nothing else)
      //  - An array of 90% of the remaining rooms, for placing random stuff (leaving 10% empty)
      const rooms = this.dungeon.rooms.slice();
      // segregate special rooms
      const startRoom = rooms.shift();
      const goalRoom =Phaser.Utils.Array.RemoveAt(rooms,rooms.length-1);
      //const goalRoom = Phaser.Utils.Array.RemoveRandomElement(rooms);
      const endRoom1 =Phaser.Utils.Array.RemoveAt(rooms,rooms.length-1);
      //const endRoom1 = Phaser.Utils.Array.RemoveRandomElement(rooms);
      const endRoom2 =Phaser.Utils.Array.RemoveAt(rooms,rooms.length-1);
      //const endRoom2 = Phaser.Utils.Array.RemoveRandomElement(rooms);

      const otherRooms = Phaser.Utils.Array.Shuffle(rooms).slice(0, rooms.length * 0.98);
      this.px = map.tileToWorldX(startRoom.centerX);
      this.py = map.tileToWorldY(startRoom.centerY);
      // Place the Treasure
      this.stuffLayer.putTileAt(TILES.CHEST, goalRoom.centerX, goalRoom.centerY);

      // Place the Exits
      this.stuffLayer.putTilesAt([152,153], endRoom1.centerX, endRoom1.centerY);
      this.stuffLayer.putTilesAt(TILES.EXIT, endRoom2.centerX, endRoom2.centerY);

      

      // Place stuff in the 90% "otherRooms"
      otherRooms.forEach((room) => {
          //console.log("room "+room.centerX);
          let width = room.right-room.left;
          let height = room.bottom-room.top;
          //console.log("width "+ width +" height "+ height );
          const rand = Math.floor(Math.random()*3) // random between 0-2 inclusive
          if(width*height > 100){
            this.stuffLayer.putTilesAt([13], room.centerX - 1, room.centerY + 1);
            this.stuffLayer.putTilesAt([13], room.centerX + 1, room.centerY + 1);
            this.stuffLayer.putTilesAt([13], room.centerX - 2, room.centerY - 2);
            this.stuffLayer.putTilesAt([13], room.centerX + 2, room.centerY - 2);
          }else if(width*height< 50){
            this.stuffLayer.putTilesAt([13], room.centerX, room.centerY );
          }else{
            this.stuffLayer.putTilesAt([13], room.centerX + 1, room.centerY + 1);
            this.stuffLayer.putTilesAt([13], room.centerX - 1, room.centerY - 2);
          }
          /*
          const rand = Math.random();
          
          this.stuffLayer.putTilesAt(TILES.POT, room.centerX - 1, room.centerY + 1);
          this.stuffLayer.putTilesAt(TILES.POT, room.centerX + 1, room.centerY + 1);
          this.stuffLayer.putTilesAt(TILES.POT, room.centerX - 1, room.centerY - 2);
          this.stuffLayer.putTilesAt(TILES.POT, room.centerX + 1, room.centerY - 2);
      
          if (rand <= 0.25) {
              // 25% chance of chest
              this.stuffLayer.putTileAt(TILES.CHEST, room.centerX, room.centerY);
          } else if (rand <= 0.5) {
              // 50% chance of a pot anywhere in the room... except don't block a door!
              const x = Phaser.Math.Between(room.left + 2, room.right - 2);
              const y = Phaser.Math.Between(room.top + 2, room.bottom - 2);
              this.stuffLayer.weightedRandomize(x, y, 1, 1, TILES.POT);
          } else {
              // 25% of either 2 or 4 towers, depending on the room size
              if (room.height >= 9) {
                  this.stuffLayer.putTilesAt(TILES.TOWER, room.centerX - 1, room.centerY + 1);
                  this.stuffLayer.putTilesAt(TILES.TOWER, room.centerX + 1, room.centerY + 1);
                  this.stuffLayer.putTilesAt(TILES.TOWER, room.centerX - 1, room.centerY - 2);
                  this.stuffLayer.putTilesAt(TILES.TOWER, room.centerX + 1, room.centerY - 2);
              } else {
                  this.stuffLayer.putTilesAt(TILES.TOWER, room.centerX - 1, room.centerY - 1);
                  this.stuffLayer.putTilesAt(TILES.TOWER, room.centerX + 1, room.centerY - 1);
              }
          }
      */
      });

      // Not exactly correct for the tileset since there are more possible floor tiles, but this will
      // do for the example.
      this.groundLayer.setCollisionByExclusion([-1, 6, 7, 8, 26]);
      this.stuffLayer.setCollisionByExclusion([-1, 6, 7, 8, 26]);

      // more collision stuff
      // collision with jug tile
      this.stuffLayer.setTileIndexCallback(13, this.hitJug, this);
      //collision with Treasure Cheast tile
      this.stuffLayer.setTileIndexCallback(166, this.hitTreasure, this);
      //collision with Exit tile
      this.stuffLayer.setTileIndexCallback(TILES.EXIT, this.hitExit, this);




      /*
      this.stuffLayer.setTileIndexCallback([13], (tile) => {
          this.stuffLayer.setTileIndexCallback([13], null);
          console.log("hit jug "+tile.x+" , "+tile.y);
          //this.stuffLayer.removeTileAt(tile.x, tile.y);
          //this.stuffLayer.removeTileAtWorldXY(tile.x, tile.y);
          map.removeTileAt(tile.x, tile.y,false,false,this.stuffLayer);
          this.player.health += 10;
          console.log("player health "+ this.player.health);
          //this.hasPlayerReachedStairs = true;
          //this.player.freeze();
          //const cam = this.cameras.main;
          //cam.fade(250, 0, 0, 0);
          //cam.once("camerafadeoutcomplete", () => {
              //this.player.destroy();
              //this.scene.restart();
          //});
      });
      */

      ////// END of DUNGEON GENERATION
      this.scene.add('WinnerScene', WinnerScene);
      this.scene.add('LostScene', LostScene);

      // Phaser supports multiple cameras, but you can access the default camera like this:
      this.camera = this.cameras.main;

      // Constrain the camera so that it isn't allowed to move outside the width/height of tilemap
      self.camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
      

      // Help text that has a "fixed" position on the screen
      this.add
      .text(16, 16, `Get the TREASURE and carry to the EXIT`, {
          font: "18px monospace",
          fill: "#000000",
          padding: { x: 20, y: 10 },
          backgroundColor: "#ffffff",
      })
      .setScrollFactor(0);

    //SocketIO Setup
    // Drived From https://github.com/ivangfr/socketio-express-phaser3

      // collison with other player
      this.otherPlayers = this.physics.add.group({defaultKey:'otherPlayer'//,
      //bounceX: 1,
      //bounceY: 1.
    });
     

      // this msg from server lists all current players including us
      // sent when we first join the game
    this.socket.on('currentPlayers', function (players) {
        Object.keys(players).forEach(function (id) {
          if (players[id].playerId === self.socket.id) {
            self.addPlayer(self, players[id])
          } else {
            self.addOtherPlayers(self, players[id])
          }
        })
      })
    
      // this msg tells us that a new client/player has joined
      this.socket.on('newPlayer', function (playerInfo) {
        self.addOtherPlayers(self, playerInfo)
      })
    
      // msg to remove other player who died
      this.socket.on('playerDisconnected', function (playerId) {
        self.otherPlayers.getChildren().forEach(function (otherPlayer) {
          if (playerId === otherPlayer.playerId) {
            otherPlayer.destroy()
          }
        })
      })
    
    
    
      this.socket.on('playerMoved', function (playerInfo) {
        self.otherPlayers.getChildren().forEach(function (otherPlayer) {
          if (playerInfo.playerId === otherPlayer.playerId) {
            //console.log( " told "+otherPlayer.playerId+" moved to "+playerInfo.x);
            // otherPlayer is just a sprite without animation at this point
            // so setPosition works
            otherPlayer.setPosition(playerInfo.x, playerInfo.y)
          }
        })
      })

      this.socket.on('jugRemoved', function(jug){
        //console.log('other jug '+jug.x+" , "+jug.y);
        self.removeItem(jug);

      })

      this.socket.on('treasureFound', function(info){
        self.otherPlayers.getChildren().forEach(function (otherPlayer) {
          if (otherPlayer.playerId === info.player) {
            otherPlayer.setTint("0xfafad2");
            //console.log(" player: "+self.player.id+" health is "+self.player.health)
          }
          self.removeItem(info.jug);
        })
      });  

      this.socket.on('gameOver', function(info){
        
        // move to LOST scene with reasonCode in info
        //this.scene.add('LostScene', LostScene);
        //this.scene.start('LostScene')//,{reason: reason})
        self.changeScene(info.reason)
        self.endPlayer();
        
      })

      this.socket.on('healthUpdate', function (players) {
        Object.keys(players).forEach(function (id) {
          if (players[id].playerId === self.socket.id) {
            self.player.health =players[id].health;
            //self.player.sprite.setTint(players[id].color)
            if(players[id].playerKilled){
              //console.log(id+" killed")
              self.changeScene('combat')
            }
            if(players[id].playerStarved){
              self.changeScene('starved')
            }
            console.log(" player: "+self.player.id+" health is "+self.player.health)
          } else {
            self.otherPlayers.getChildren().forEach(function (otherPlayer) {
              if(otherPlayer.playerId === players[id].playerId){
                otherPlayer.setTint(players[id].color)
              }// end of if
            })// end of iter
          }// end else - sets color of other player

        })
      })

  }// end of create function

 changeScene(reason){
  //console.log("got to change scene") 
  
  this.scene.start('LostScene',{reason: reason})
  this.endPlayer();
 }

 changeWinScene(){
  this.scene.add('WinScene', WinScene);
  this.scene.start('WinScene')
 }

 endPlayer(){
  this.player.freeze();
  this.player.destroy();
  this.socket.disconnect(true)
  this.scene.destroy();

 }

 hitJug (sprite, tile)
  {
    this.socket.emit('jugHit', { x: tile.x,y: tile.y})
    this.stuffLayer.removeTileAt(tile.x, tile.y,false,false,this.stuffLayer);
    //console.log("hit jug at"+tile.x+" , "+tile.y)
  }

  hitExit (sprite, tile)
  {
    if(this.player.hasTreasure){
      this.stuffLayer.removeTileAt(tile.x,tile.y,false,false,this.stuffLayer);
      // not elegant but works
      this.stuffLayer.removeTileAt(tile.x-1,tile.y,false,false,this.stuffLayer);
      this.stuffLayer.removeTileAt(tile.x+1,tile.y,false,false,this.stuffLayer);
    
      //this.scene.add('LostScene', LostScene);
      //this.scene.start('LostScene',{reason: 'combat'})

      
      this.scene.start('WinnerScene')

      //tell everybody game over
      this.socket.emit('exitHit')

      //this.player.freeze();
      //this.player.destroy();
      //this.socket.emit('disconnect')
      this.scene.destroy();

    }
  }

  hitTreasure (sprite, tile)
  {
    this.socket.emit('treasureHit', { x: tile.x,y: tile.y})
    this.stuffLayer.removeTileAt(tile.x, tile.y,false,false,this.stuffLayer);
    
    this.player.sprite.setTint(0xfafad2);
    this.player.hasTreasure= true; 
    this.player.speed = 270; 
    
  }

  // needed this function to wrap this.stuff.remove... - not sure why
  removeItem (item)
  { 
    this.stuffLayer.removeTileAt(item.x, item.y,false,false,this.stuffLayer);
   // console.log("remove tile at"+item.x+" , "+item.y)
  }


  addPlayer(self, playerInfo) {
    // Place the player in the first room
    
    var first_x =self.px+playerInfo.x;
    var first_y =self.py+playerInfo.y;
    
    self.player = new Player(self,first_x, first_y);
    self.player.id = playerInfo.playerId;
    self.camera.startFollow(this.player.sprite);

    //Watch the player and tilemap layers for collisions, for the duration of the scene:
    this.physics.add.collider(self.player.sprite, this.groundLayer);
    this.physics.add.collider(self.player.sprite, this.stuffLayer);
    let debounceX = 0
    let debounceY = 0
    this.physics.add.overlap(this.player.sprite, this.otherPlayers, (obj1, obj2) => {
      let id =0;
      if (debounceX != obj2.x || debounceY != obj2.y){
        // get id of obj2
        // search otherplayer for the same x.y as the target, to get its Id
        self.otherPlayers.getChildren().forEach(function (otherPlayer) {
          if (otherPlayer.x == obj2.x && otherPlayer.y == obj2.y) {
            id = otherPlayer.playerId;
            
          }
        });
        
      
        debounceX = obj2.x
        debounceY = obj2.y
        this.socket.emit('combatHit', { "attacker": this.player.id, "target": id})
      } 

    });

  }
  
  addOtherPlayers(self, playerInfo) {
    
    //const otherPlayer = self.physics.add.image(self.px+playerInfo.x, self.py+playerInfo.y, 'other')
    const otherPlayer = this.physics.add.sprite(self.px+playerInfo.x, self.py+playerInfo.y, "other");  
    otherPlayer.playerId = playerInfo.playerId
    otherPlayer.setTint(playerInfo.color)
    self.otherPlayers.add(otherPlayer)


  }

  update() {
      if(this.player){
        if(this.player.health < 0){
          console.log("Dead!!");
          
          this.player.destroy();
          //Switch to exit scene
        }else{
          this.player.update();
        }
         
      
      // send update to server
      var x = this.player.sprite.x
      var y = this.player.sprite.y
      //console.log(" player: "+this.player.id+"  "+x+" , "+y);
      if (this.player.oldPosition && (x !== this.player.oldPosition.x || y !== this.player.oldPosition.y )) {
        // move player health value with player
        //console.log(" text"+this.player.text.x)
        //this.player.text = this.player.health;
        this.player.Htext.text =this.player.health;
        this.player.Htext.x = x -10
        this.player.Htext.y = y -30
        this.player.Htext.setTintFill(0x00ff00)
        if(this.player.health < 30){this.player.Htext.setTintFill(0xff0000);}
        // tell server where we moved to
        this.socket.emit('playerMovement', { x: this.player.sprite.x, y: this.player.sprite.y})
      }
  
      this.player.oldPosition = {
        x: this.player.sprite.x,
        y: this.player.sprite.y
      }


      // visability control
      // Find the player's room using another helper method from the dungeon that converts from
      // dungeon XY (in grid units) to the corresponding room object
      const playerTileX = this.groundLayer.worldToTileX(this.player.sprite.x);
      const playerTileY = this.groundLayer.worldToTileY(this.player.sprite.y);
      const playerRoom = this.dungeon.getRoomAt(playerTileX, playerTileY);

      this.tilemapVisibility.setActiveRoom(playerRoom);
    }  
  }

}//end of Dungeon class

      // SocketIO setup
      
      // based on https://gamedevacademy.org/create-a-basic-multiplayer-game-in-phaser-3-with-socket-io-part-2/
      //and https://github.com/ivangfr/socketio-express-phaser3
      // see also https://www.dynetisgames.com/2017/03/06/how-to-make-a-multiplayer-online-game-with-phaser-socket-io-and-node-js/
