export default class LobbyScene extends Phaser.Scene {
    constructor() {
        super({ key: 'Lobby' })
      
    }
    
    init (data)// used to transfer data into scene from scene.start
    {
        console.log('seed in Lobby ', data.seed);


    }
  
    preload() {
        this.load.image("ship", "assets/spaceShips_001.png");
        this.load.image("otherPlayer", "assets/enemyBlack5.png");
        this.load.image("star", "assets/star_gold.png");
      }
    

    create(){
        // Player's sign in to Lobby by connecting a Solana wallet
        // and player indicates when ready.
        // When sufficient players a ready, Dungeon Scene is loaded and we're off
    }
}