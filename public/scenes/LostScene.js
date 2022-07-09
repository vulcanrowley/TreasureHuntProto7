export default class LostScene extends Phaser.Scene {
    constructor() {
      super({ key: 'LostScene' })
  
    }
  
    init (data)// used to transfer data into scene from scene.start
    {
        //console.log('reason transferred from Dungeon', data.reason);
        // reasonCode set from DungeonScene with 3 possibiities:
        // starved - ran out of health
        // lost - another player escaped with Treasure
        // combat - combat death
        this.reasonCode = data.reason;
  
        //game.stage.disableVisibilityChange = true;// maybe game.scene???
  };
        
  
    preload() {
        
    }

    create(){
        //console.log(" lost because "+this.reasonCode)

        let text1 = this.add.text(400, 300, "Sorry- You Lost ", { font: '64px Arial',fill: '#000000' });
        //text1.setTint(0x000000);
        text1.setOrigin(.5);

        if(this.reasonCode == 'lost'){
            let text2 = this.add.text(400,400, "Another player escaped with Treasure", { font: '32px Arial',fill: '#000000' });
            
            text2.setOrigin(.5);

        }
        if(this.reasonCode == 'starved'){
            let text2 = this.add.text(400,400, "You starved!", { font: '32px Arial',fill: '#ffffff' });
            
            text2.setOrigin(.5);

        }
        if(this.reasonCode == 'combat'){
            let text2 = this.add.text(400,400, "You were killed by another player", { font: '32px Arial',fill: '#ff0000' });
            
            text2.setOrigin(.5);

        }
        
        //this.player.freeze();
        const cam = this.cameras.main;
        cam.fade(250, 0, 0, 0);
        cam.fadeOut(10000,0xff0000)
        cam.once("camerafadeoutcomplete", () => {
            
            this.scene.remove();
            this.sys.game.destroy(true);
        });

    }


}