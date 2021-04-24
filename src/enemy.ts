import { Canvas, Flip } from "./core/canvas.js";
import { GameEvent } from "./core/core.js";
import { clamp } from "./core/mathext.js";
import { Sprite } from "./core/sprite.js";
import { Vector2 } from "./core/vector.js";
import { GameObject } from "./gameobject.js";


const ENEMY_TYPES = () : Array<Function> => [
    Cat, Fly, Mushroom,
    Dog, Duck,  
    Spikeball];

export const getEnemyType = (index : number) : Function => ENEMY_TYPES()[clamp(index, 0, ENEMY_TYPES().length-1) | 0];

export const getRandomEnemyType = () : Function => getEnemyType( (Math.random() * ENEMY_TYPES().length) | 0);


export class Enemy extends GameObject {


    protected startPos : Vector2;

    protected scale : number;
    protected flip : Flip;

    protected globalSpeed : number;

    protected hitbox : Vector2;


    constructor(globalSpeed : number,
        x : number, y : number, row = 0, frame = 0, scale = 0.5) {

        super(x, y);

        this.startPos = this.pos.clone();

        this.scale = scale;
        this.flip = Flip.None;
        this.globalSpeed = globalSpeed;

        this.spr = new Sprite(256, 256);
        this.spr.setFrame(frame, row);

        this.target.y = -this.globalSpeed;
        this.speed.y = this.target.y;

        this.exist = true;
        this.dying = false;

        this.friction = new Vector2(0.5, 0.5);

        this.pos.y += this.spr.height/2 * scale;

        this.hitbox = new Vector2(64, 64);
    }


    protected die(ev : GameEvent) : boolean {

        this.spr.animate(4, 0, 4, 5, ev.step);

        return this.spr.getColumn() == 4;
    }


    protected updateAI(ev : GameEvent) {}


    protected updateLogic(ev : GameEvent) {

        this.updateAI(ev);

        if (this.pos.y < -this.spr.height/2 * this.scale) {

            this.forceKill();
        }
    }


    protected baseDraw(c : Canvas, bmp : HTMLImageElement, offsetx = 0, offsety = 0) {

        c.drawScaledSprite(this.spr, bmp,
            offsetx + this.pos.x - this.spr.width/2 * this.scale, 
            offsety + this.pos.y - this.spr.height/2 * this.scale,
            this.spr.width*this.scale,
            this.spr.height*this.scale, this.flip);
    }


    public draw(c : Canvas) {

        if (!this.exist) return;

        this.baseDraw(c, c.getBitmap("enemies"));
    }


    public drawShadow(c : Canvas) {

        const SHADOW_OFFSET = 12;

        if (!this.exist) return;

        this.baseDraw(c, c.getBitmap("enemiesBlack"), SHADOW_OFFSET, SHADOW_OFFSET);
    }


    public kill(ev : GameEvent) {

        if (this.dying) return;
        
        this.dying = true;
        this.spr.setFrame(0, 4);
    }


    public getHitbox = () : Vector2 => this.hitbox.clone();
}


export class Duck extends Enemy {


    private waveTimer : number;


    constructor(globalSpeed : number, x : number, y : number) {

        super(globalSpeed, x, y, 0);

        this.waveTimer = 0;

        this.hitbox = new Vector2(56, 40);
    }


    protected updateAI(ev : GameEvent) {

        const WAVE_SPEED = 0.05;

        this.waveTimer = (this.waveTimer + WAVE_SPEED * this.globalSpeed * ev.step) % (Math.PI * 2);

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


    private waveTimer : number;


    constructor(globalSpeed : number, x : number, y : number) {

        super(globalSpeed, x, y, 1);

        this.friction.y = 0.05;

        this.speed.y *= 0.5;
        this.target.y *= 2.0;

        this.waveTimer = (Math.random() > 0.5 ? 1 : 0) * Math.PI;

        this.scale = 0.60;
    
        this.hitbox = new Vector2(48, 56);
    }


    protected updateAI(ev : GameEvent) {

        const WAVE_SPEED = 0.020;
  
        this.waveTimer = (this.waveTimer + WAVE_SPEED * this.globalSpeed * ev.step) % (Math.PI * 2);
        this.pos.x = this.startPos.x + Math.sin(this.waveTimer) * (this.spr.width/2 * this.scale);

        this.spr.animate(this.spr.getRow(), 0, 3, 6, ev.step);
    }
}


export class Fly extends Enemy {


    private dir : number;


    constructor(globalSpeed : number, x : number, y : number) {

        super(globalSpeed, x, y, 2);

        this.dir = x > 270 ? -1 : 1;
        this.target.x = globalSpeed * 2 * this.dir;
        this.friction.x = 0.1;

        this.scale = 0.60;

        this.hitbox = new Vector2(64, 48);
    }


    protected updateAI(ev : GameEvent) {

        if ((this.dir < 0 && this.pos.x < this.spr.width*this.scale) ||
            (this.dir > 0 && this.pos.x > 540 - this.spr.width*this.scale)) {

            this.dir *= -1;
            this.target.x *= -1;
        }

        this.spr.animate(this.spr.getRow(), 0, 3, 6, ev.step);
    }
}


export class Cat extends Enemy {


    private animDirection : number;


    constructor(globalSpeed : number, x : number, y : number) {

        super(globalSpeed, x, y, 3);

        this.animDirection = 0;

        this.hitbox = new Vector2(56, 40);
    }


    protected updateAI(ev : GameEvent) {
        
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


    constructor(globalSpeed : number, x : number, y : number) {

        super(globalSpeed, x, y, 5);

        this.scale = 0.60;

        this.hitbox = new Vector2(64, 48);
    }


    protected updateAI(ev : GameEvent) {

        this.spr.animate(this.spr.getRow(), 0, 3, 8, ev.step);
    }
}


export class Spikeball extends Enemy {


    private angle : number;
    private rotationDir : number;


    constructor(globalSpeed : number, x : number, y : number) {

        super(globalSpeed, x, y, 4, 4);

        this.rotationDir = Math.random() > 0.5 ? 1 : -1;
        this.angle = Math.random() * Math.PI * 2;

        this.hitbox = new Vector2(40, 40);

        this.target.x = this.rotationDir * this.globalSpeed;
    }


    protected updateAI(ev : GameEvent) {

        const ROTATION_SPEED = 0.025;


        if ((this.rotationDir < 0 && this.pos.x < this.spr.width/2*this.scale) ||
            (this.rotationDir > 0 && this.pos.x > 540 - this.spr.width/2*this.scale)) {

            this.rotationDir *= -1;
            this.target.x *= -1;
        }

        this.angle = 
            (this.angle + this.rotationDir * this.globalSpeed * ROTATION_SPEED * ev.step) % (Math.PI * 2);
    }


    protected baseDraw(c : Canvas, bmp : HTMLImageElement, offsetx = 0, offsety = 0) {

        c.drawRotatedScaledBitmapRegion(bmp,
            1024, 1024, 256, 256, 
            offsetx + this.pos.x,
            offsety + this.pos.y,
            this.spr.width * this.scale,
            this.spr.height * this.scale,
            this.angle, this.spr.width/2, this.spr.height/2);
    }


    public draw(c : Canvas) {

        if (!this.exist) return;

        this.baseDraw(c, c.getBitmap("enemies"));
    }


    public drawShadow(c : Canvas) {

        const SHADOW_OFFSET = 12;

        if (!this.exist) return;

        this.baseDraw(c, c.getBitmap("enemiesBlack"), SHADOW_OFFSET, SHADOW_OFFSET);
    }

}

