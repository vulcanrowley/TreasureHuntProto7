import Player from "/js/player.js";
import LostScene from "/scenes/LostScene.js";
import WinnerScene from "/scenes/WinnerScene.js";
//import LobbyScene from "/scenes/LobbyScene.js";
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
// Globals
var GameReady = false;
var GameRoom = null;
var tween = null;
var stopTween = false;

export default class DungeonScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DungeonScene' })
    //put common variables here

  }

  init (data)// used to transfer data into scene from scene.start
  {
      //console.log('seed transfered to Dungeon', data.seed);
      // sceneSeed set by server to make all client scenes the same
      this.sceneSeed = data.seed;
      this.gameKey = data.seed; // game room is the same as the sceneSeed
      this.playerID = data.playerID;
      this.socket = data.socket;
      this.numPlayers = data.numPlayers;

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
      this.load.atlas('explosion', '../assets/explosion.png', '../assets/explosion.json');
  }

  create() {
    var self = this;

    // MAX of 20 players per game
    this.opponentCnt = -1;
    
      // Generate a random world based on sceneSeed with a few extra options:
      //  - Rooms should only have odd number dimensions so that they have a center tile.
      //  - Doors should be at least 2 tiles away from corners, so that we can place a corner tile on
      //    either side of the door location
      this.dungeon = new Dungeon({
      width: 100 + (self.numPlayers-1)*50,// 200 generate ~300 rooms; 250 creates ~450; 150 creates ~150 ; 100 about 70 rooms
      height:100 + (self.numPlayers-1)*50,
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

      //console.log(`scene seed is ${this.sceneSeed}`)
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
      //  - the last room generated is the GOAL
      //  - the next two rooms farest from the start are assigned as EXIT rooms
      //  - all othe rooms are assigned a number of food pots depending on their size
      const rooms = this.dungeon.rooms.slice();
      // segregate special rooms
      const startRoom = rooms.shift();
      this.goalRoom =Phaser.Utils.Array.RemoveAt(rooms,rooms.length-1);
      //const goalRoom = Phaser.Utils.Array.RemoveRandomElement(rooms);
      const endRoom1 =Phaser.Utils.Array.RemoveAt(rooms,rooms.length-1);
      //const endRoom1 = Phaser.Utils.Array.RemoveRandomElement(rooms);
      const endRoom2 =Phaser.Utils.Array.RemoveAt(rooms,rooms.length-1);
      //const endRoom2 = Phaser.Utils.Array.RemoveRandomElement(rooms);

      //const otherRooms = Phaser.Utils.Array.Shuffle(rooms).slice(0, rooms.length * 0.98);
      this.px = map.tileToWorldX(startRoom.centerX);
      this.py = map.tileToWorldY(startRoom.centerY)-300;

      // Place the Treasure
      this.stuffLayer.putTileAt(TILES.CHEST, this.goalRoom.centerX, this.goalRoom.centerY);

      // Place the Exits
      this.stuffLayer.putTilesAt([152,153], endRoom1.centerX, endRoom1.centerY);
      this.stuffLayer.putTilesAt(TILES.EXIT, endRoom2.centerX, endRoom2.centerY);

      
      
      // Place food pots in all rooms
      rooms.forEach((room) => {  
          //console.log("room "+room.centerX);
          let width = room.right-room.left;
          let height = room.bottom-room.top;

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

      });

      // Not exactly correct for the tileset since there are more possible floor tiles, but this will
      // do for the example.
      this.groundLayer.setCollisionByExclusion([-1, 6, 7, 8, 26]);
      //this.stuffLayer.setCollisionByExclusion([-1, 6, 7, 8, 26]);

      // more collision stuff
      // collision with jug tile
      this.stuffLayer.setTileIndexCallback(13, this.hitJug, this);
      //collision with Treasure Cheast tile
      this.stuffLayer.setTileIndexCallback(166, this.hitTreasure, this);
      //collision with Exit tile
      this.stuffLayer.setTileIndexCallback(TILES.EXIT, this.hitExit, this);
      //collision player with wall
      this.groundLayer.setTileIndexCallback([39,57, 58, 59,21,76, 95, 114,19,77, 96, 115,1,78, 79, 80,3,4,22,23], this.hitWall, this);

      const particles = this.add.particles('explosion');
    
      this.stuffLayer.e = particles.createEmitter({
        frame: 'muzzleflash2',
        lifespan: 200,
        scale: { start: 2, end: 0 },
        rotate: { start: 0, end: 180 },
        on: false
      });


      /*
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

      // Added for click recognition
      
      this.input.on('pointerdown', function (pointer) {
        let gameX = Math.floor(pointer.worldX);// not Tile loc
        let gameY = Math.floor(pointer.worldY);

        /*  checking to see if pointer is in room doesn't work- keeps from getting to other rooms
        //check for legal click

        // convert to local coord
        let pointerTileX = this.groundLayer.worldToTileX(gameX);
        let pointerTileY = this.groundLayer.worldToTileY(gameY);
        // get room sprite is in
        const playerTileX = this.groundLayer.worldToTileX(this.player.sprite.x);
        const playerTileY = this.groundLayer.worldToTileY(this.player.sprite.y);
        const pointerRoom = this.dungeon.getRoomAt(playerTileX, playerTileY);

        
        // test for between left and right wall
        let sideTest = pointerTileX >= pointerRoom.x && pointerTileX <= pointerRoom.x+pointerRoom.width ? true : false;
        let vertTest = pointerTileY >= pointerRoom.y && pointerTileY <= pointerRoom.y+pointerRoom.height ? true : false;

        let doorTest = false;
        const doors = pointerRoom.getDoorLocations();
        for (let i = 0; i < doors.length; i++) {
          if(doors[i].x +pointerRoom.x == pointerTileX  && doors[i].y+pointerRoom.y == pointerTileY){
            doorTest = true;
          }
        }

        //const doorTest = doors.includes({pointerTileX,pointerTileY})
        // test if between top and botton walls

        console.log(` worldX ${pointerTileX}, worldY ${pointerTileY}`)
        console.log(`left is ${pointerRoom.x}, right ${pointerRoom.x+pointerRoom.width}, top ${pointerRoom.y}, bottom ${pointerRoom.y+pointerRoom.height}`)
        console.log(`test ${sideTest}, ${vertTest}, ${doorTest}`)
        //console.log(`down at ${gameX} = ${}, ${gameY} = ${}`);
        // not sure why has to be 10X
        if(doorTest || sideTest && vertTest){
          self.movePlayer(self, {x:gameX,y:gameY})
        }
        

        // set flag to let Phaser update and Player update know that click has set new target
        //self.socket.emit('clickLocation', { "x": pointer.x, "y": pointer.y})
        //self.socket.emit('playerLocation', { "x": pointer.x, "y": pointer.y})
        */ // end of room check idea
        self.movePlayer(self, {x:gameX,y:gameY})

      }, this);

      this.scene.add('WinnerScene', WinnerScene);
      this.scene.add('LostScene', LostScene);

      // Phaser supports multiple cameras, but you can access the default camera like this:
      this.camera = this.cameras.main;

      // Constrain the camera so that it isn't allowed to move outside the width/height of tilemap
      self.camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
      

      // Help text that has a "fixed" position on the screen
      this.add
      .text(16, 16, `Find the TREASURE and carry to the EXIT`, {
          font: "18px monospace",
          fill: "#000000",
          padding: { x: 20, y: 10 },
          backgroundColor: "#ffffff",
      })
      .setScrollFactor(0);
      // collison with other player
      this.otherPlayers = this.physics.add.group({defaultKey:'otherPlayer'//,
      //bounceX: 1,
      //bounceY: 1.
    });


    //!!!!!!!!!!!! SocketIO Setup
    // Drived From https://github.com/ivangfr/socketio-express-phaser3

    // ask server for the player to join this room
    this.socket.emit('join', this.gameKey, function(data) {
    
    });

      // this msg from server lists all current players including us
      // sent when we first join the game room
    
      let PlayerID =this.playerID
      var roomKey = this.gameKey
      
      
      this.socket.on('currentPlayers', function (people) {
          //console.log(" in client currentPlayers")
          //console.log("total number of people "+Object.keys(people).length)
          //console.log(" this player "+people[PlayerID].playerId)
        Object.keys(people).forEach(function (id) {
            //console.log(` players in LobbyScene ${people[id].playerId} in game ${people[id].gameRoom}`);
            //console.log(" socket ID in cP "+PlayerID)
          if(people[id].gameRoom == roomKey){
              if (people[id].playerId == PlayerID ) {
                  
                  GameRoom =people[id].gameRoom;
                  self.addPlayer(self, people[id]);
              } else{
                  self.addOtherPlayer(self, people[id]);
              }
          }  

        });
      });

    
      // this msg tells us that a new client/player has joined
      this.socket.on('newPlayer', function (playerInfo) {
        if (roomKey == playerInfo.gameRoom) {
          self.addOtherPlayer(self, playerInfo)
        }
      });

      

    
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

/*  Code below not needed if rely on update from player thru server      
// added to use mouse click as imputs - should be able to consolidate with 'playerMoved'
      this.socket.on('clickMove', function (playerInfo) {
        self.otherPlayers.getChildren().forEach(function (otherPlayer) {
          if (playerInfo.playerId === otherPlayer.playerId) {
            //console.log( " told "+otherPlayer.playerId+" moved to "+playerInfo.x);
            // otherPlayer is just a sprite without animation at this point
            // so setPosition works

            //otherPlayer.setPosition(playerInfo.x, playerInfo.y)  // uses arrow keys

            let distance = Phaser.Math.Distance.Between(otherPlayer.x,otherPlayer.y,playerInfo.x,playerInfo.y);
            let duration = Math.floor(distance*10);
            
            this.tweens.add({
              targets: otherPlayer, //self.player.sprite.anims.play("player-walk", true),
              ease: 'Linear',
              x:playerInfo.x,
              y:playerInfo.y,
              duration:duration
              
            });




          }
        })
      })
*/
      this.socket.on('jugRemoved', function(jug){
        //console.log('other jug '+jug.x+" , "+jug.y);
        self.removeItem(jug);

      })

      this.socket.on('treasureFound', function(info){
        console.log(`Treasure Found by ${info.player}`)
        self.otherPlayers.getChildren().forEach(function (otherPlayer) {
          if (otherPlayer.playerId === info.player) {
            //console.log(" color changed")
            otherPlayer.setTint("0xfafad2");
            //console.log(" player: "+self.player.id+" health is "+self.player.health)
          }
          // save chest location to update late joiner
         // self.treasureChest = info.jug;
          //console.log("removing Treasure")
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

      // server says someone died while carring the Treasure, so replace itat original spot
      this.socket.on('replaceTreasure', function (players) {
        Object.keys(players).forEach(function (id) {
          if (players[id].playerId === self.socket.id) {
            self.placeTreasure();
          }
         })
        })    

      this.socket.on('healthUpdate', function (players) {
       // console.log("in health update")
        Object.keys(players).forEach(function (id) {
          // test if this is me and am I in a room
          if (players[id].playerId === self.socket.id && players[id].gameRoom != null) {
            self.player.health =players[id].health;
            //self.player.sprite.setTint(players[id].color)
            if(players[id].playerKilled){
              //console.log(id+" killed")
              self.changeScene('combat')
            }
            if(players[id].playerStarved){
              //if player has treasure, return it to original spot and tell all otherPlayers
              //possibe hack path
              if(players[id].hasTreasure){
                // Tell server to move Treasure
                self.moveTreasure();
              }
              self.changeScene('starved')
            }
            //console.log(" player: "+self.player.id+" health is "+self.player.health)
          } 
        })
      })

      
      this.socket.on('gameReady', function (rooms) {
        //console.log("In player gameReady")
        Object.keys(rooms).forEach(function (rm) {
          
          if(rooms[rm].id == self.player.gameRoom && rooms[rm].ready ==true){
            //ready to play - set local flag for UPdate function
            
            GameReady = true;
            //self.gameReady = true;
          }
        })
      })



  }// end of Phaser create function

  /*
    Helper Functions
  */ 
  movePlayer(self, pointer){


      let distance = Phaser.Math.Distance.Between(self.player.sprite.x,self.player.sprite.y,pointer.x,pointer.y);
      let duration = Math.floor(distance*5);
      
      tween = this.tweens.add({
        targets: self.player.sprite.anims.play("player-walk", true),
        ease: 'Linear',
        x:pointer.x,
        y:pointer.y,
        duration:duration//,
        //onComplete: _=> console.log("tween ends"),
        //onUpdate: self.onCompleteHandler,
        //onUpdateParams: [ pointer.x,pointer.y ]
        
      });

  }// end of movePlayer

  addPlayer(self, playerInfo) {
    // Place the player in the first room
    
    var first_x =self.px+playerInfo.x;
    var first_y =self.py+playerInfo.y;
    
    self.player = new Player(self,first_x, first_y);

    self.player.id = playerInfo.playerId;
    self.player.gameRoom = playerInfo.gameRoom

    self.camera.startFollow(self.player.sprite);

    //console.log("Player being added "+self.player.id)

    //Watch the player and tilemap layers for collisions, for the duration of the scene:
    // Floor collisions excluded, only WALL collisions at this layer

    self.physics.add.collider(self.player.sprite, self.groundLayer)
    /*
    , (player, wall) => {
      
      let pX = this.groundLayer.worldToTileX(player.x);
      let pY = this.groundLayer.worldToTileY(player.y);
      console.log(`hit wall at ${pX}, ${pY}`)
      let tileBounce = 5;
      if(pX >= wall.x){
        this.player.sprite.x += tileBounce;
      } else{this.player.sprite.x -= tileBounce;}
  
      if(pY >= wall.y){
        this.player.sprite.y += tileBounce;
      } else{this.player.sprite.y -= tileBounce;} 
    });
*/

    //self.physics.add.overlap(self.player.sprite, self.groundLayer, overlapHappened, null, this);

    self.physics.add.collider(self.player.sprite, self.stuffLayer);

    // combat collison handler
    let debounceX = 0
    let debounceY = 0
    self.physics.add.collider(self.player.sprite, self.otherPlayers, (obj1, obj2) => {
      let id =0;
 
      if (debounceX != obj2.x || debounceY != obj2.y){

        this.stuffLayer.e.emitParticleAt(obj2.x, obj2.y);
        // get id of obj2(target)
        // search otherplayer for the same x,y as the target, to get its Id
        self.otherPlayers.getChildren().forEach(function (otherPlayer) {
          if (otherPlayer.x == obj2.x && otherPlayer.y == obj2.y) {
            id = otherPlayer.playerId;
          }
       });
      
        debounceX = obj2.x
        debounceY = obj2.y
        // tell server we hit target
        self.socket.emit('combatHit', { "attacker": self.player.id, "target": id})
     } 

    });

  };
  
  addOtherPlayer(self, playerInfo) {
    const playerColors =['0xff0000','0x00ff00','0xcdcdcd','0x0000ff','0x6495ED' ,'0x3366ff','0x33ccff','0xE06F8B']
    
    this.opponentCnt++ // used to assign colors
    //console.log(`other Player added ${playerInfo.playerId}`)
    // setPushable(false) prevents collision from pushing otherPlayer away
    const otherPlayer = self.physics.add.sprite(self.px+playerInfo.x, self.py+playerInfo.y, "other").setPushable(false);  
    otherPlayer.playerId = playerInfo.playerId
    otherPlayer.setTint(playerColors[this.opponentCnt]);
    if(playerInfo.hasTreasure){
      otherPlayer.setTint("0xfafad2");
      //self.removeItem({x:self.treasureChest.x,y:self.treasureChest.y});
      //  self.stuffLayer.putTileAt(TILES.CHEST, this.goalRoom.centerX, this.goalRoom.centerY);
     // this.stuffLayer.removeTileAt(this.goalRoom.centerX, this.goalRoom.centerY,false,false,this.stuffLayer);
     self.removeItem({x: self.goalRoom.centerX, y: self.goalRoom.centerY});
    }
    self.otherPlayers.add(otherPlayer)

  }// end of addOtherPlayer

 moveTreasure(){
   // tells server to reset Treasure to original location in server  DB
  this.socket.emit('resetTreasure')
 } 
 placeTreasure(){
  // display Treasure in correct location (local effect only)
 self.stuffLayer.putTileAt(TILES.CHEST, this.goalRoom.centerX, this.goalRoom.centerY);
} 

 changeScene(reason){ 
  this.scene.start('LostScene',{reason: reason})
  this.endPlayer();
 }

 changeWinScene(){
  this.scene.start('WinScene')
  this.endPlayer();
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

  onCompleteHandler (tween, targets, Tx,Ty)
  {
      console.log(`Update tween at ${Tx}, ${Ty}`);
  
  }
  

  hitWall (sprite, tile)
  // callback on sprite/layer collision
  // stop the tween movement at the wall
  // backup slightly to break collision
  {
    stopTween = true;
    //tween.stop(); 
    //tween.on('update', (tween, targets, Tx,Ty) =>{
    //  console.log(`update x is ${Tx}`)
    //});
    //tween.on('stop', listener);

    const pX = this.groundLayer.worldToTileX(this.player.sprite.x);
    const pY = this.groundLayer.worldToTileY(this.player.sprite.y);
    //console.log(`in hitWall at ${pX}, ${pY} : wall at ${tile.x}, ${tile.y}`)
    let tileBounce = 10;
    if(pX > tile.x){
      console.log(`bounce right`)
      this.player.sprite.x += tileBounce;

    } else if (pX < tile.x){
      console.log(`bounce left`)
      this.player.sprite.x -= tileBounce;
    }
    

    if(pY > tile.y){
      console.log(`bounce down`)
      this.player.sprite.y += tileBounce +3;
    } else if(pY < tile.y){
      console.log(`bounce up`)
      this.player.sprite.y -= tileBounce;}
    
  }

  hitExit (sprite, tile)
  {
    if(this.player.hasTreasure){
      this.stuffLayer.removeTileAt(tile.x,tile.y,false,false,this.stuffLayer);
      // not elegant but works
      this.stuffLayer.removeTileAt(tile.x-1,tile.y,false,false,this.stuffLayer);
      this.stuffLayer.removeTileAt(tile.x+1,tile.y,false,false,this.stuffLayer);
    
   

      //this.changeWinScene()
      this.scene.start('WinnerScene')
      this.socket.disconnect(true)
     // this.scene.destroy();
      this.scene.remove(DungeonScene);
      

      //tell everybody game over
      this.socket.emit('exitHit')


    }
  }

  hitTreasure (sprite, tile)
  {
    this.socket.emit('treasureHit', { x: tile.x,y: tile.y})
    this.stuffLayer.removeTileAt(tile.x, tile.y,false,false,this.stuffLayer);
    // change player color to GOLD indicating has Treasure
    //this.player.sprite.setTint(0xfafad2);
    this.player.hasTreasure= true; 
    // playered slowed down by weight of Treasure
    this.player.speed = 270; 
    
  }

  // needed this function to wrap this.stuff.remove... - not sure why
  removeItem (item)
  { 
    this.stuffLayer.removeTileAt(item.x, item.y,false,false,this.stuffLayer);
   // console.log("remove tile at"+item.x+" , "+item.y)
  }



  // this is the Phaser update per cycle, not the Room update function
  update() {
    //console.log(`Game is Ready ${GameReady} `) 
      if( GameReady){//this.player != null){// this.player.gameRoom == GameRoom &&
        
        if(this.player.health < 0){
          console.log("Dead!!");
          
          this.player.destroy();
          //Switch to exit scene
        }else{
          //this.player.update();
        }
      
      //check if tween needs to be stopped
      if(stopTween){
        tween.stop();
        stopTween = false;
      }
      
      // send update to server
      var x = this.player.sprite.x
      var y = this.player.sprite.y
      
      
      if (this.player.oldPosition && (x !== this.player.oldPosition.x || y !== this.player.oldPosition.y )) {
        // move player health value with player
        //console.log(" text"+this.player.text.x)
        //this.player.text = this.player.health;
        this.player.Htext.text =this.player.health;
        this.player.Htext.x = x -10
        this.player.Htext.y = y -30
        this.player.Htext.setTintFill(0x00ff00)
        if(this.player.health < 30){this.player.Htext.setTintFill(0xff0000);}

        //console.log(" player: "+this.player.id+"  "+x+" , "+y);
        // tell server where we moved to UPDATE moved to tween
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
    
  }// end of Phaser Update function

}//end of Dungeon class

      // SocketIO setup
      
      // based on https://gamedevacademy.org/create-a-basic-multiplayer-game-in-phaser-3-with-socket-io-part-2/
      //and https://github.com/ivangfr/socketio-express-phaser3
      // see also https://www.dynetisgames.com/2017/03/06/how-to-make-a-multiplayer-online-game-with-phaser-socket-io-and-node-js/
