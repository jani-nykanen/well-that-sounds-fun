import { Sprite } from "./core/sprite.js";
import { State } from "./core/types.js";
import { Vector2 } from "./core/vector.js";
import { boxOverlay, ExistingObject, GameObject, nextObject } from "./gameobject.js";
class Ghost extends ExistingObject {
    constructor() {
        super();
        this.exist = false;
    }
    spawn(pos, scale, time, spr) {
        this.pos = pos.clone();
        this.timer = time;
        this.maxTime = time;
        this.scale = scale;
        this.spr = new Sprite(spr.width, spr.height);
        this.spr.setFrame(spr.getColumn(), spr.getRow());
        this.exist = true;
    }
    update(ev) {
        if (!this.exist)
            return;
        if ((this.timer -= ev.step) <= 0) {
            this.exist = false;
        }
    }
    draw(c, bmp) {
        if (!this.exist)
            return;
        c.setGlobalAlpha(this.timer / this.maxTime);
        c.drawScaledSprite(this.spr, bmp, this.pos.x - this.spr.width / 2 * this.scale, this.pos.y - this.spr.height / 2 * this.scale, this.spr.width * this.scale, this.spr.height * this.scale);
        c.setGlobalAlpha();
    }
}
export class Player extends GameObject {
    constructor(x, y) {
        super(x, y);
        this.spr = new Sprite(256, 256);
        this.scale = 0.5;
        this.diving = false;
        this.jumpTimer = 0;
        this.flapping = false;
        this.flapTimer = Player.FLAP_TIME;
        this.ghosts = new Array();
        this.ghostTimer = 0;
        this.friction = new Vector2(0.5, 0.5);
        this.hitbox = new Vector2(64, 96);
        this.hurtBox = new Vector2(48, 80);
        this.arrowWaveTimer = 0.0;
    }
    control(ev) {
        const BASE_GRAVITY = 6.0;
        const BASE_SPEED = 4.0;
        const DIVE_SPEED = 16.0;
        const JUMP_SPEED = -9.0;
        const FLAP_TARGET = -4.0;
        const BONUS_JUMP_TIME = 12;
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
                ev.audio.playSample(ev.getSample("dive"), 0.70);
                if (this.diving)
                    this.ghostTimer = 0;
                this.diving = true;
            }
            if (this.diving) {
                this.target.y = DIVE_SPEED;
                this.friction.y = 1.0;
                this.jumpTimer = 0;
                if (this.flapping) {
                    this.flapping = false;
                    this.flapTimer = 0;
                }
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
        const ARROW_WAVE_SPEED = 0.15;
        this.arrowWaveTimer = (this.arrowWaveTimer + ARROW_WAVE_SPEED * ev.step) % (Math.PI * 2);
        let oldFrame = this.spr.getColumn();
        if (this.flapping) {
            this.spr.animate(1, 0, 1, 4, ev.step);
            if (this.spr.getColumn() != oldFrame && oldFrame == 0) {
                ev.audio.playSample(ev.getSample("flap"), 0.50);
            }
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
    updateGhosts(ev) {
        const GHOST_SPAWN_TIME = 3;
        const GHOST_EXIST_TIME = 15;
        if (this.diving) {
            if ((this.ghostTimer -= ev.step) <= 0) {
                this.ghostTimer += GHOST_SPAWN_TIME;
                nextObject(this.ghosts, Ghost)
                    .spawn(this.pos, this.scale, GHOST_EXIST_TIME, this.spr);
            }
        }
        for (let g of this.ghosts) {
            g.update(ev);
        }
    }
    updateLogic(ev) {
        this.control(ev);
        this.animate(ev);
        this.updateGhosts(ev);
        if (this.speed.x < 0 && this.pos.x < this.hitbox.x / 2) {
            this.speed.x = 0;
            this.pos.x = this.hitbox.x / 2;
        }
        else if (this.speed.x > 0 && this.pos.x > 540 - this.hitbox.x / 2) {
            this.speed.x = 0;
            this.pos.x = 540 - this.hitbox.x / 2;
        }
        if (this.pos.y > 720 + this.spr.height / 2 * this.scale) {
            this.kill(ev);
        }
    }
    forceAnimateFlapping(ev) {
        const MOVE_SPEED = 1.0;
        this.spr.animate(1, 0, 1, 4, ev.step);
        this.pos.y += MOVE_SPEED * ev.step;
    }
    kill(ev) {
        if (this.dying)
            return;
        this.dying = true;
        this.diving = false;
        this.spr.setFrame(0, 2);
        ev.audio.playSample(ev.getSample("hurt"), 0.60);
        ev.shake(50, 16.0);
    }
    die(ev) {
        this.updateGhosts(ev);
        this.spr.animate(2, 0, 4, 5, ev.step);
        return this.spr.getColumn() == 4;
    }
    baseDraw(c, bmp, offsetx = 0, offsety = 0) {
        const ARROW_RANGE = 48;
        const ARROW_AMPLITUDE = 8;
        c.drawScaledSprite(this.spr, bmp, offsetx + this.pos.x - this.spr.width / 2 * this.scale, offsety + this.pos.y - this.spr.height / 2 * this.scale, this.spr.width * this.scale, this.spr.height * this.scale);
        let arrowY;
        if (this.pos.y < -ARROW_RANGE) {
            arrowY = Math.sin(this.arrowWaveTimer) * ARROW_AMPLITUDE;
            c.drawScaledSpriteFrame(this.spr, bmp, 2, 1, offsetx + this.pos.x - this.spr.width / 2 * this.scale, offsety + arrowY, this.spr.width * this.scale, this.spr.height * this.scale);
        }
    }
    draw(c) {
        for (let g of this.ghosts) {
            g.draw(c, c.getBitmap("player"));
        }
        this.baseDraw(c, c.getBitmap("player"));
    }
    drawShadow(c) {
        const SHADOW_OFFSET = 12;
        this.baseDraw(c, c.getBitmap("playerBlack"), SHADOW_OFFSET, SHADOW_OFFSET);
    }
    enemyCollision(e, ev) {
        const JUMP_TIME = 8;
        const DIVE_BONUS = 4;
        const JUMP_EPS = -0.5;
        const STOMP_RANGE = 16.0;
        let hbox;
        if (!e.doesExist() || e.isDying() || this.dying)
            return false;
        hbox = e.getHitbox();
        if (!e.isInvulnerable() &&
            boxOverlay(this.pos, new Vector2(0, 0), this.hitbox, e.getPos().x - hbox.x / 2, e.getPos().y - hbox.y / 2 - STOMP_RANGE, hbox.x, STOMP_RANGE + Math.abs(this.speed.y) * ev.step)) {
            if (this.speed.y > JUMP_EPS) {
                this.jumpTimer = JUMP_TIME;
                e.kill(ev);
                if (this.diving) {
                    this.jumpTimer += DIVE_BONUS;
                }
                this.flapTimer = Player.FLAP_TIME;
                this.flapping = false;
                this.diving = false;
                return true;
            }
        }
        if (boxOverlay(this.pos, new Vector2(0, 0), this.hurtBox, e.getPos().x - hbox.x / 2, e.getPos().y - hbox.y / 2, hbox.x, hbox.y)) {
            this.kill(ev);
            return true;
        }
        return false;
    }
}
Player.FLAP_TIME = 60;
