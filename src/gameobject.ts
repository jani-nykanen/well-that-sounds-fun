import { Canvas } from "./core/canvas.js";
import { GameEvent } from "./core/core.js";
import { Sprite } from "./core/sprite.js";
import { Rect, Vector2 } from "./core/vector.js";


export const updateSpeedAxis = (speed : number, target : number, step : number) : number => {
		
    if (speed < target) {
        
        return Math.min(target, speed+step);
    }
    return Math.max(target, speed-step);
}


// No better place for these

export const boxOverlay = (pos : Vector2, center : Vector2, hitbox : Vector2, 
    x : number, y : number, w : number, h : number) : boolean => {

    let px = pos.x + center.x - hitbox.x/2;
    let py = pos.y + center.y - hitbox.y/2;

    return px + hitbox.x >= x && px < x+w &&
           py + hitbox.y >= y && py < y+h;
}


export const boxOverlayRect = (rect : Rect, 
    x : number, y : number, w : number, h : number) : boolean => {

    return boxOverlay(
        new Vector2(rect.x, rect.y), 
        new Vector2(), 
        new Vector2(rect.w, rect.h), 
        x, y, w, h);
}


export abstract class ExistingObject {


    protected exist : boolean;


    constructor() {

        this.exist = false;
    }
    

    public doesExist = () : boolean => this.exist;
}


export function nextObject<T extends ExistingObject> (arr : Array<T>, type : Function) {

    let o : T;

    o = null;
    for (let a of arr) {

        if (!a.doesExist()) {

            o = a;
            break;
        }
    }

    if (o == null) {

        o = new type.prototype.constructor();
        arr.push(o);
    }

    return o;
}


export abstract class WeakGameObject extends ExistingObject {


    protected pos : Vector2;
    protected center : Vector2;

    protected dying : boolean;

    protected spr : Sprite;


    constructor(x : number, y : number) {

        super();

        this.pos = new Vector2(x, y);
        this.center = new Vector2();

        this.spr = new Sprite(0, 0);

        this.dying = false;
        this.exist = true;
    }


    protected die (ev : GameEvent) : boolean {

        return true;
    }


    public update(ev : GameEvent) {

        if (!this.exist) return;

        if (this.dying) {

            if (this.die(ev)) {

                this.exist = false;
                this.dying = false;
            }
            return;
        }

        this.updateLogic(ev);
        this.extendedLogic(ev);
    }


    public forceKill() {

        this.exist = false;
        this.dying = false;
    }


    protected updateLogic(ev : GameEvent) {};
    protected extendedLogic(ev : GameEvent) {}

    public draw(c : Canvas) {}
    public postDraw(c : Canvas) {}

    public getPos = () => this.pos.clone();
    public isDying = () => this.dying;
    
    
}


export abstract class GameObject extends WeakGameObject {
    

    protected speed : Vector2;
    protected target : Vector2;
    protected friction : Vector2;


    constructor(x : number, y : number) {

        super(x, y);

        this.speed = new Vector2();
        this.target = this.speed.clone();
        this.friction = new Vector2(1, 1);
    }


    protected die (ev : GameEvent) : boolean {

        return true;
    }


    protected postUpdate(ev : GameEvent) {}


    protected updateMovement(ev : GameEvent) {

        this.speed.x = updateSpeedAxis(this.speed.x,
            this.target.x, this.friction.x*ev.step);
        this.speed.y = updateSpeedAxis(this.speed.y,
            this.target.y, this.friction.y*ev.step);

        this.pos.x += this.speed.x * ev.step;
        this.pos.y += this.speed.y * ev.step;
    }


    public extendedLogic(ev : GameEvent) {

        this.updateMovement(ev);
        this.postUpdate(ev);
    }


    public stopMovement() {

        this.speed.zeros();
        this.target.zeros();
    }


    public getSpeed = () : Vector2 => this.speed.clone();
    public getTarget = () : Vector2 => this.target.clone();
}
