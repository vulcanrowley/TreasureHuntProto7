export default class WinnerScene extends Phaser.Scene {
    constructor() {
      super({ key: 'WinnerScene' })
  
    }
  
    preload() {
        
    }

    create(){
        //console.log(" lost because "+this.reasonCode)

        let text1 = this.add.text(400, 300, "Congrats - You Won!!", { font: '64px Arial' });
        text1.setTint(0xff00ff, 0xffff00, 0x0000ff, 0xff0000);
        text1.setOrigin(.5);
        const startButton = this.add.text(400,400, 'Claim Reward')
            .setOrigin(0.5)
            .setPadding(10)
            .setStyle({ backgroundColor: '#111' })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () =>{ this.claimReward() } )
            .on('pointerover', () => startButton.setStyle({ fill: '#f39c12' }))
            .on('pointerout', () => startButton.setStyle({ fill: '#FFF' }))

       

    }

    claimReward(){
        console.log(" jump to NFT mint website")
        this.scene.remove();
        //this.sys.game.destroy(true);
    }


}