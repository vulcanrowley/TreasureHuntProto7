
import DungeonScene from "../scenes/DungeonScene.js";
//import Game from "../scenes/Game.js";
//import Init from "../scenes/Init.js";

import Player from "/js/player.js";
import TILES from "/js/tile-mapping.js";
import TilemapVisibility from "/js/tilemap-visibility.js";


var config = {
  type: Phaser.AUTO,
  parent: "phaser-example",
  width: 800,
  height: 600,
  active: false,
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
      gravity: { y: 0 },
    },
  },
  /*
  scene: {
      preload: preload,
      create: create
  }
  */
  // need to add scene manually to enable data transfer from game.js
 //scene: [DungeonScene]
 
};


var game = new Phaser.Game(config);
console.log('sceneSeed in Game.js '+sceneSeed);
// set active to false in config
// dont set scene in config
// add scene using key from scene modulle
game.scene.add('DungeonScene', DungeonScene);
game.scene.start('DungeonScene',{seed: sceneSeed})

// LOCAL TEST CODE
/*
function preload(){
  this.load.image("tiles", "../assets/tilesets/buch-tileset-48px-extruded.png");
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

function create(){
  const socket = io();

    // Generate a random world with a few extra options:
  //  - Rooms should only have odd number dimensions so that they have a center tile.
  //  - Doors should be at least 2 tiles away from corners, so that we can place a corner tile on
  //    either side of the door location
  this.dungeon = new Dungeon({
    width: 50,
    height: 50,
    doorPadding: 2,
    randomSeed: 2,//this.sceneSeed,//this.level,
    rooms: {
        width: { min: 7, max: 15, onlyOdd: true },
        height: { min: 7, max: 15, onlyOdd: true },
    },
    });

    this.dungeon.drawToConsole();

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


}
*/
