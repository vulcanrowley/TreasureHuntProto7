export default class LobbyScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LobbyScene' })
      
    }
    
    init (data)// used to transfer data into scene from scene.start
    {
        console.log('seed in Lobby ', data.seed);
        const sceneSeed = data.seed;

    }
  
    preload() {
        //this.load.image("ship", "assets/spaceShips_001.png");
        //this.load.image("otherPlayer", "assets/enemyBlack5.png");
        //this.load.image("star", "assets/star_gold.png");
      }
    

    create(){

        //console.log(" in the app")
        this.text1 = this.add.text(50, 100, 'Rainbow Text', { font: "74px Arial Black", fill: "#fff" });
        this.text1.setStroke('#00f', 16);
        this.text1.setShadow(2, 2, "#333333", 2, true, true);


        const helloButton = this.add.text(300, 300, 'Back to Lobby', { fill: '#0f0' });
        helloButton.setInteractive();
    
        helloButton.on('pointerover', () => { console.log('Back to Lobby');
        //window.location.href = 'http://localhost:3000/';
        window.location.replace('http://localhost:3000/')
        this.scene.remove();
        });
    }
}