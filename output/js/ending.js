import { Sprite } from "./core/sprite.js";
export class Ending {
    constructor(params, ev) {
        this.dispose = () => null;
        this.sprDog = new Sprite(384, 288);
    }
    update(ev) {
        this.sprDog.animate(0, 0, 3, 8, ev.step);
    }
    redraw(c) {
        c.clear(255, 255, 255);
        c.drawBitmap(c.getBitmap("skull"), 368, 160 + 144);
        c.drawSprite(this.sprDog, c.getBitmap("dog"), 0, 160);
        c.drawText(c.getBitmap("font"), "THE END", c.width / 2, c.height / 4 * 3, -28, 0, true, 1.5, 1.5);
    }
}
