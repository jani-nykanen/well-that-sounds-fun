import { Canvas, Flip } from "./core/canvas.js";
import { GameEvent } from "./core/core.js";
import { clamp } from "./core/mathext.js";
import { Sprite } from "./core/sprite.js";
import { Vector2 } from "./core/vector.js";
import { GameObject } from "./gameobject.js";


const ENEMY_TYPES = () : Array<Function> => [Duck, Dog, Fly, Cat, Spikeball];

export const getEnemyType = (index : number) : Function => ENEMY_TYPES()[clamp(index, 0, ENEMY_TYPES().length-1) | 0];

export const getRandomEnemyType = () : Function => getEnemyType( (Math.random() * ENEMY_TYPES().length) | 0);


export class Enemy extends GameObject {


    protected scale : number;
    protected flip : Flip;

    protected globalSpeed : number;


    constructor(x : number, y : number, row = 0, frame = 0, scale = 0.5) {

        super(x, y);

        this.scale = scale;
        this.flip = Flip.None;
        this.globalSpeed = 1;

        this.spr = new Sprite(256, 256);
        this.spr.setFrame(frame, row);

        this.target.y = -this.globalSpeed;
        this.speed.y = this.target.y;

        this.exist = true;
        this.dying = false;

        this.friction = new Vector2(0.5, 0.5);

        this.pos.y += this.spr.height/2 * scale;
    }


    protected updateAI(ev : GameEvent) {}


    protected updateLogic(ev : GameEvent) {

        this.updateAI(ev);

        if (this.pos.y < -this.spr.height/2 * this.scale) {

            this.forceKill();
        }
    }


    public draw(c : Canvas) {

        if (!this.exist) return;

        c.drawScaledSprite(this.spr, c.getBitmap("enemies"),
            this.pos.x - this.spr.width/2 * this.scale,
            this.pos.y - this.spr.height/2 * this.scale,
            this.spr.width * this.scale,
            this.spr.height * this.scale, this.flip);
    }


    public setGlobalSpeed(speed = 1.0) {

        this.globalSpeed = speed;
    }
}


export class Duck extends Enemy {


    constructor(x : number, y : number) {

        super(x, y, 0);
    }


    protected updateAI(ev : GameEvent) {

        this.spr.animate(this.spr.getRow(), 0, 3, 8, ev.step);
    }
}


export class Dog extends Enemy {


    constructor(x : number, y : number) {

        super(x, y, 1);

        this.friction.y = 0.1;
        this.target.y *= 2.0;
    }


    protected updateAI(ev : GameEvent) {

        this.spr.animate(this.spr.getRow(), 0, 3, 6, ev.step);
    }
}


export class Fly extends Enemy {


    constructor(x : number, y : number) {

        super(x, y, 2);
    }


    protected updateAI(ev : GameEvent) {

        this.spr.animate(this.spr.getRow(), 0, 3, 6, ev.step);
    }
}



export class Cat extends Enemy {


    private animDirection : number;


    constructor(x : number, y : number) {

        super(x, y, 3);

        this.animDirection = 0;
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



export class Spikeball extends Enemy {


    constructor(x : number, y : number) {

        super(x, y, 4, 4);
    }


    protected updateAI(ev : GameEvent) {

        
    }
}

