import { Sprite } from "./core/sprite.js";
import { Vector2 } from "./core/vector.js";
import { GameObject } from "./gameobject.js";
export class Player extends GameObject {
    constructor(x, y) {
        super(x, y);
        this.spr = new Sprite(256, 256);
        this.scale = 0.5;
        this.diving = false;
        this.friction = new Vector2(0.5, 0.5);
    }
    control(ev) {
        const BASE_GRAVITY = 8.0;
        const BASE_SPEED = 4.0;
        const DIVE_SPEED = 16.0;
        this.target.y = BASE_GRAVITY;
        // TEMP
        if (ev.getStick().y < -0.5) {
            this.speed.y = -8.0;
        }
        this.target.x = BASE_SPEED * ev.getStick().x;
        // Dive
        this.diving = ev.getStick().y > 0.5;
        if (this.diving) {
            this.target.y = DIVE_SPEED;
            this.friction.y = 1.0;
            if (this.speed.y < 0.0)
                this.speed.y = 0;
        }
        else {
            this.friction.y = 0.5;
        }
    }
    animate(ev) {
        const SPEED_Y_EPS = 2.0;
        let frame = 0;
        if (this.diving)
            frame = 3;
        else if (this.speed.y < -SPEED_Y_EPS)
            frame = 2;
        else if (this.speed.y > SPEED_Y_EPS)
            frame = 1;
        this.spr.setFrame(frame, 0);
    }
    updateLogic(ev) {
        this.control(ev);
        this.animate(ev);
    }
    draw(c) {
        c.drawScaledSprite(this.spr, c.getBitmap("player"), this.pos.x - this.spr.width / 2 * this.scale, this.pos.y - this.spr.height / 2 * this.scale, this.spr.width * this.scale, this.spr.height * this.scale);
    }
}
