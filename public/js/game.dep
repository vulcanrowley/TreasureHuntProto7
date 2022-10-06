
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
  seed: 5,
  backgroundColor: '#ffffff',
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
      gravity: { y: 0 },
    },
  }
  // need to add scene manually to enable data transfer from game.js

 
};


var game = new Phaser.Game(config);
//console.log('sceneSeed in Game.js '+sceneSeed);
// set active to false in config
// dont set scene in config
// add scene using key from scene modulle
game.scene.add('DungeonScene', DungeonScene);
//game.scene.start('DungeonScene',{seed: sceneSeed})
