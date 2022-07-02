export default class Init extends Phaser.Scene {
    constructor() {
        super({ key: 'Init' })
      
    }
    
    init (data)// used to transfer data into scene from scene.start
    {
        console.log('seed in Init ', data.seed);


    }
  
    preload() {
        this.load.image("ship", "assets/spaceShips_001.png");
        this.load.image("otherPlayer", "assets/enemyBlack5.png");
        this.load.image("star", "assets/star_gold.png");
      }
    

    create(){
        this.socket = io();
    }
}