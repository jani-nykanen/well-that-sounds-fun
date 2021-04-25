import { Canvas } from "./core/canvas.js";
import { GameEvent } from "./core/core.js";
import { Sprite } from "./core/sprite.js";
import { Scene } from "./core/core.js";



export class Ending implements Scene {


    private sprDog : Sprite;


    constructor(params : any, ev : GameEvent) {

        this.sprDog = new Sprite(384, 288);
    }


    public update(ev : GameEvent) { 

        this.sprDog.animate(0, 0, 3, 8, ev.step);
    }


    public redraw(c : Canvas) {

        c.clear(255, 255, 255);

        c.drawBitmap(c.getBitmap("skull"), 368, 160 + 144);

        c.drawSprite(this.sprDog, c.getBitmap("dog"),
            0, 160);

        c.drawText(c.getBitmap("font"), "THE END",
            c.width/2, c.height/4*3, -28, 0, true, 1.5, 1.5);
    }


    public dispose = () : any => null;
}
