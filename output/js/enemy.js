import { Flip } from "./core/canvas.js";
import { clamp } from "./core/mathext.js";
import { Sprite } from "./core/sprite.js";
import { Vector2 } from "./core/vector.js";
import { GameObject } from "./gameobject.js";
const ENEMY_TYPES = () => [
    Cat, Fly, Mushroom,
    Dog, Duck,
    Spikeball, Rat, CoolSpikeball
];
export const getEnemyType = (index) => ENEMY_TYPES()[clamp(index, 0, ENEMY_TYPES().length - 1) | 0];
export const getRandomEnemyType = () => getEnemyType((Math.random() * ENEMY_TYPES().length) | 0);
export class Enemy extends GameObject {
    constructor(globalSpeed, x, y, row = 0, frame = 0, scale = 0.5) {
        super(x, y);
        this.getHitbox = () => this.hitbox.clone();
        this.isInvulnerable = () => this.invulnerable;
        this.startPos = this.pos.clone();
        this.scale = new Vector2(scale, scale);
        this.flip = Flip.None;
        this.globalSpeed = globalSpeed;
        this.spr = new Sprite(256, 256);
        this.spr.setFrame(frame, row);
        this.target.y = -this.globalSpeed;
        this.speed.y = this.target.y;
        this.exist = true;
        this.dying = false;
        this.canBeKilled = true;
        this.invulnerable = false;
        this.friction = new Vector2(0.5, 0.5);
        this.pos.y += this.spr.height / 2 * scale;
        this.hitbox = new Vector2(64, 48);
    }
    die(ev) {
        this.spr.animate(4, 0, 4, 5, ev.step);
        return this.spr.getColumn() == 4;
    }
    updateAI(ev) { }
    updateLogic(ev) {
        this.updateAI(ev);
        if (this.pos.y < -this.spr.height / 2 * this.scale.y) {
            this.forceKill();
        }
    }
    baseDraw(c, bmp, offsetx = 0, offsety = 0) {
        c.drawScaledSprite(this.spr, bmp, offsetx + this.pos.x - this.spr.width / 2 * this.scale.x, offsety + this.pos.y - this.spr.height / 2 * this.scale.y, this.spr.width * this.scale.x, this.spr.height * this.scale.y, this.flip);
    }
    draw(c) {
        if (!this.exist)
            return;
        this.baseDraw(c, c.getBitmap("enemies"));
    }
    drawShadow(c) {
        const SHADOW_OFFSET = 12;
        if (!this.exist)
            return;
        this.baseDraw(c, c.getBitmap("enemiesBlack"), SHADOW_OFFSET, SHADOW_OFFSET);
    }
    knockbackEvent() { }
    kill(ev) {
        const KNOCKBACK = 8.0;
        if (this.dying)
            return;
        if (!this.canBeKilled) {
            this.speed.y = KNOCKBACK;
            this.knockbackEvent();
            return;
        }
        ev.audio.playSample(ev.getSample("kill"), 0.50);
        this.dying = true;
        this.spr.setFrame(0, 4);
    }
}
export class Duck extends Enemy {
    constructor(globalSpeed, x, y) {
        super(globalSpeed, x, y, 0);
        this.waveTimer = 0;
        this.hitbox = new Vector2(56, 28);
    }
    updateAI(ev) {
        const WAVE_SPEED = 0.1;
        this.waveTimer = (this.waveTimer + WAVE_SPEED * ev.step) % (Math.PI * 2);
        let speedMod = Math.sin(this.waveTimer) + 1.0;
        this.target.y = -this.globalSpeed * speedMod * 1.50;
        let frame = 0;
        if (speedMod >= 1.25)
            frame = 3;
        else if (speedMod <= 0.75)
            frame = 1;
        this.spr.setFrame(frame, this.spr.getRow());
        //this.spr.animate(this.spr.getRow(), 0, 3, 8, ev.step);
    }
}
export class Dog extends Enemy {
    constructor(globalSpeed, x, y) {
        super(globalSpeed, x, y, 1, 0, 0.60);
        this.friction.y = 0.05;
        this.speed.y *= 0.5;
        this.target.y *= 2.0;
        this.waveTimer = (Math.random() > 0.5 ? 1 : 0) * Math.PI;
        this.hitbox = new Vector2(48, 40);
    }
    updateAI(ev) {
        const WAVE_SPEED = 0.040;
        this.waveTimer = (this.waveTimer + WAVE_SPEED * ev.step) % (Math.PI * 2);
        this.pos.x = this.startPos.x + Math.sin(this.waveTimer) * (this.spr.width / 2 * this.scale.x);
        this.spr.animate(this.spr.getRow(), 0, 3, 6, ev.step);
    }
}
export class Fly extends Enemy {
    constructor(globalSpeed, x, y) {
        const MOVE_SPEED = 4;
        super(globalSpeed, x, y, 2, 0, 0.60);
        this.dir = x > 270 ? -1 : 1;
        this.target.x = MOVE_SPEED * this.dir;
        this.friction.x = 0.1;
        this.hitbox = new Vector2(64, 36);
    }
    updateAI(ev) {
        if ((this.dir < 0 && this.pos.x < this.spr.width * this.scale.x) ||
            (this.dir > 0 && this.pos.x > 540 - this.spr.width * this.scale.x)) {
            this.dir *= -1;
            this.target.x *= -1;
        }
        this.spr.animate(this.spr.getRow(), 0, 3, 6, ev.step);
    }
}
export class Cat extends Enemy {
    constructor(globalSpeed, x, y) {
        super(globalSpeed, x, y, 3);
        this.animDirection = 0;
        this.hitbox = new Vector2(56, 28);
        this.waveTimer = (Math.random() > 0.5 ? 1 : 0) * Math.PI;
    }
    updateAI(ev) {
        const WAVE_SPEED = 0.030;
        this.waveTimer = (this.waveTimer + WAVE_SPEED * ev.step) % (Math.PI * 2);
        this.pos.x = this.startPos.x + Math.sin(this.waveTimer) * (this.spr.width / 2 * this.scale.x);
        if (this.animDirection == 0) {
            this.spr.animate(this.spr.getRow(), 0, 4, 6, ev.step);
            if (this.spr.getColumn() == 4)
                this.animDirection = 1;
        }
        else {
            this.spr.animate(this.spr.getRow(), 4, 0, 6, ev.step);
            if (this.spr.getColumn() == 0)
                this.animDirection = 0;
        }
        this.flip = this.animDirection == 0 ? Flip.None : Flip.Horizontal;
    }
}
export class Mushroom extends Enemy {
    constructor(globalSpeed, x, y) {
        super(globalSpeed, x, y, 5, 0, 0.60);
        this.hitbox = new Vector2(64, 40);
        this.canBeKilled = false;
        this.bumpTimer = 0.0;
    }
    knockbackEvent() {
        this.bumpTimer = Mushroom.BUMP_TIME;
    }
    updateAI(ev) {
        this.spr.animate(this.spr.getRow(), 0, 3, 8, ev.step);
        let t;
        if (this.bumpTimer > 0) {
            this.bumpTimer -= ev.step;
            t = (this.bumpTimer / Mushroom.BUMP_TIME - 0.5) * 2;
            if (t >= 0) {
                this.scale.x = 0.60 + 0.30 * (1 - t);
                this.scale.y = 0.60 - 0.30 * (1 - t);
            }
            else {
                this.scale.x = 0.90 + 0.30 * t;
                this.scale.y = 0.30 - 0.30 * t;
            }
        }
        else {
            this.scale.x = 0.60;
            this.scale.y = 0.60;
        }
    }
}
Mushroom.BUMP_TIME = 30;
export class Spikeball extends Enemy {
    constructor(globalSpeed, x, y) {
        const MOVE_SPEED = 2.0;
        super(globalSpeed, x, y, 4, 4);
        this.rotationDir = Math.random() > 0.5 ? 1 : -1;
        this.angle = Math.random() * Math.PI * 2;
        this.hitbox = new Vector2(40, 40);
        this.target.x = this.rotationDir * MOVE_SPEED;
        this.canBeKilled = false;
        this.invulnerable = true;
    }
    updateAI(ev) {
        const ROTATION_SPEED = 0.05;
        if ((this.rotationDir < 0 && this.pos.x < this.spr.width / 2 * this.scale.x) ||
            (this.rotationDir > 0 && this.pos.x > 540 - this.spr.width / 2 * this.scale.x)) {
            this.rotationDir *= -1;
            this.target.x *= -1;
        }
        this.angle =
            (this.angle + this.rotationDir * ROTATION_SPEED * ev.step) % (Math.PI * 2);
    }
    baseDraw(c, bmp, offsetx = 0, offsety = 0) {
        c.drawRotatedScaledBitmapRegion(bmp, 1024, 1024, 256, 256, offsetx + this.pos.x, offsety + this.pos.y, this.spr.width * this.scale.x, this.spr.height * this.scale.y, this.angle, this.spr.width / 2, this.spr.height / 2);
    }
    draw(c) {
        if (!this.exist)
            return;
        this.baseDraw(c, c.getBitmap("enemies"));
    }
    drawShadow(c) {
        const SHADOW_OFFSET = 12;
        if (!this.exist)
            return;
        this.baseDraw(c, c.getBitmap("enemiesBlack"), SHADOW_OFFSET, SHADOW_OFFSET);
    }
}
export class CoolSpikeball extends Enemy {
    constructor(globalSpeed, x, y) {
        super(globalSpeed, x, y, 4, 4, 0.475);
        this.rotationDir = -1;
        this.angle = Math.random() * Math.PI * 2;
        this.hitbox = new Vector2(40, 40);
        this.canBeKilled = false;
        this.invulnerable = true;
        this.target.y *= 1.5;
    }
    updateAI(ev) {
        const ROTATION_SPEED = 0.025;
        this.angle =
            (this.angle + this.rotationDir * ROTATION_SPEED * ev.step) % (Math.PI * 2);
    }
    baseDraw(c, bmp, offsetx = 0, offsety = 0) {
        c.drawRotatedScaledBitmapRegion(bmp, 1024, 1536, 256, 256, offsetx + this.pos.x, offsety + this.pos.y, this.spr.width * this.scale.x, this.spr.height * this.scale.y, this.angle, this.spr.width / 2, this.spr.height / 2);
    }
    draw(c) {
        if (!this.exist)
            return;
        this.baseDraw(c, c.getBitmap("enemies"));
    }
    drawShadow(c) {
        const SHADOW_OFFSET = 12;
        if (!this.exist)
            return;
        this.baseDraw(c, c.getBitmap("enemiesBlack"), SHADOW_OFFSET, SHADOW_OFFSET);
    }
}
export class Rat extends Enemy {
    constructor(globalSpeed, x, y) {
        const MIN_Y = 256;
        const MAX_Y = 720 - 128;
        const TARGET_SPEED = 16.0;
        super(globalSpeed, x, y, 6, 0, 0.55);
        this.dir = x > 270 ? -1 : 1;
        if (this.dir < 0) {
            this.pos.x = 540 + this.spr.width / 2 * this.scale.x;
        }
        else {
            this.pos.x = -this.spr.width / 2 * this.scale.x;
        }
        this.pos.y = MIN_Y + (Math.random() * (MAX_Y - MIN_Y));
        this.friction.x = 0.15;
        this.target.x = this.dir * TARGET_SPEED;
        this.hitbox = new Vector2(56, 20);
        this.flip = this.dir < 0 ? Flip.None : Flip.Horizontal;
        this.appeared = false;
    }
    updateAI(ev) {
        const APPEAR_SPEED = 2.0;
        const APPEAR_RANGE = 32;
        if (!this.appeared) {
            this.speed.x = APPEAR_SPEED;
            if ((this.dir > 0 && this.pos.x > APPEAR_RANGE) ||
                (this.dir < 0 && this.pos.x < 720 + APPEAR_RANGE)) {
                this.speed.x = 0.0;
                this.appeared = true;
            }
        }
        else if ((this.dir < 0 && this.pos.x < -this.spr.width / 2 * this.scale.x) ||
            (this.dir > 0 && this.pos.x > 720 + this.spr.width / 2 * this.scale.x)) {
            this.forceKill();
        }
        this.spr.animate(this.spr.getRow(), 0, 3, 5, ev.step);
    }
}
