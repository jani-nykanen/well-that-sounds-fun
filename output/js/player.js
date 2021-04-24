import { Sprite } from "./core/sprite.js";
import { State } from "./core/types.js";
import { Vector2 } from "./core/vector.js";
import { boxOverlay, GameObject } from "./gameobject.js";
export class Player extends GameObject {
    constructor(x, y) {
        super(x, y);
        this.spr = new Sprite(256, 256);
        this.scale = 0.5;
        this.diving = false;
        this.jumpTimer = 0;
        this.flapping = false;
        this.flapTimer = Player.FLAP_TIME;
        this.friction = new Vector2(0.5, 0.5);
        this.hitbox = new Vector2(64, 96);
    }
    control(ev) {
        const BASE_GRAVITY = 6.0;
        const BASE_SPEED = 4.0;
        const DIVE_SPEED = 16.0;
        const JUMP_SPEED = -10.0;
        const FLAP_TARGET = -4.0;
        const BONUS_JUMP_TIME = 8;
        this.target.y = BASE_GRAVITY;
        this.target.x = BASE_SPEED * ev.getStick().x;
        let fire1 = ev.getAction("fire1");
        // Jump
        let jumping = this.jumpTimer > 0 || this.bonusJumpTimer > 0;
        if (this.jumpTimer > 0 || this.bonusJumpTimer > 0) {
            if (this.bonusJumpTimer > 0 && (fire1 & State.DownOrPressed) == 0) {
                this.bonusJumpTimer = 0;
                jumping = false;
            }
            else {
                if (this.jumpTimer > 0)
                    this.jumpTimer -= ev.step;
                if (this.bonusJumpTimer > 0)
                    this.bonusJumpTimer -= ev.step;
                this.speed.y = JUMP_SPEED;
                if (this.jumpTimer > 0 && (fire1 & State.DownOrPressed) == 1) {
                    this.bonusJumpTimer = this.jumpTimer + BONUS_JUMP_TIME;
                    this.jumpTimer = 0;
                }
            }
        }
        // Flap
        if (!jumping &&
            this.flapTimer > 0 && fire1 == State.Pressed) {
            this.flapping = true;
        }
        if (this.flapping) {
            if ((fire1 & State.DownOrPressed) == 0) {
                this.flapping = false;
                this.flapTimer = 0;
            }
            else {
                this.target.y = FLAP_TARGET;
                if ((this.flapTimer -= ev.step) <= 0) {
                    this.flapping = false;
                }
            }
        }
        else {
            // Dive
            if (ev.downPress()) {
                this.diving = true;
            }
            if (this.diving) {
                this.target.y = DIVE_SPEED;
                this.friction.y = 1.0;
                this.jumpTimer = 0;
                this.flapping = false;
                this.flapTimer = 0;
                if (this.speed.y < 0.0)
                    this.speed.y = 0;
                if (ev.getStick().y < 0.25)
                    this.diving = false;
            }
            else {
                this.friction.y = 0.33;
            }
        }
    }
    animate(ev) {
        const SPEED_Y_EPS = 2.0;
        if (this.flapping) {
            this.spr.animate(1, 0, 1, 4, ev.step);
            return;
        }
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
        // TEMP
        if (this.pos.y > 720 + this.spr.height / 2 * this.scale) {
            this.pos = new Vector2(270, 64);
        }
    }
    draw(c) {
        c.drawScaledSprite(this.spr, c.getBitmap("player"), this.pos.x - this.spr.width / 2 * this.scale, this.pos.y - this.spr.height / 2 * this.scale, this.spr.width * this.scale, this.spr.height * this.scale);
    }
    enemyCollision(e, ev) {
        const JUMP_TIME = 8;
        const JUMP_EPS = -0.5;
        let hbox;
        if (!e.doesExist() || e.isDying() || this.dying)
            return false;
        hbox = e.getHitbox();
        if (boxOverlay(this.pos, new Vector2(0, 0), this.hitbox, e.getPos().x - hbox.x / 2, e.getPos().y - hbox.y, hbox.x, hbox.y)) {
            if (this.speed.y > JUMP_EPS) {
                this.jumpTimer = JUMP_TIME;
                e.kill(ev);
                this.flapTimer = Player.FLAP_TIME;
                this.flapping = false;
                this.diving = false;
            }
        }
        return false;
    }
}
Player.FLAP_TIME = 60;
