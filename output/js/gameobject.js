import { Sprite } from "./core/sprite.js";
import { Vector2 } from "./core/vector.js";
export const updateSpeedAxis = (speed, target, step) => {
    if (speed < target) {
        return Math.min(target, speed + step);
    }
    return Math.max(target, speed - step);
};
// No better place for these
export const boxOverlay = (pos, center, hitbox, x, y, w, h) => {
    let px = pos.x + center.x - hitbox.x / 2;
    let py = pos.y + center.y - hitbox.y / 2;
    return px + hitbox.x >= x && px < x + w &&
        py + hitbox.y >= y && py < y + h;
};
export const boxOverlayRect = (rect, x, y, w, h) => {
    return boxOverlay(new Vector2(rect.x, rect.y), new Vector2(), new Vector2(rect.w, rect.h), x, y, w, h);
};
export class ExistingObject {
    constructor() {
        this.doesExist = () => this.exist;
        this.exist = false;
    }
}
export function nextObject(arr, type) {
    let o;
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
export class WeakGameObject extends ExistingObject {
    constructor(x, y) {
        super();
        this.getPos = () => this.pos.clone();
        this.isDying = () => this.dying;
        this.pos = new Vector2(x, y);
        this.center = new Vector2();
        this.spr = new Sprite(0, 0);
        this.dying = false;
        this.exist = true;
    }
    die(ev) {
        return true;
    }
    update(ev) {
        if (!this.exist)
            return;
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
    forceKill() {
        this.exist = false;
        this.dying = false;
    }
    updateLogic(ev) { }
    ;
    extendedLogic(ev) { }
    draw(c) { }
    postDraw(c) { }
}
export class GameObject extends WeakGameObject {
    constructor(x, y) {
        super(x, y);
        this.getSpeed = () => this.speed.clone();
        this.getTarget = () => this.target.clone();
        this.speed = new Vector2();
        this.target = this.speed.clone();
        this.friction = new Vector2(1, 1);
    }
    die(ev) {
        return true;
    }
    postUpdate(ev) { }
    updateMovement(ev) {
        this.speed.x = updateSpeedAxis(this.speed.x, this.target.x, this.friction.x * ev.step);
        this.speed.y = updateSpeedAxis(this.speed.y, this.target.y, this.friction.y * ev.step);
        this.pos.x += this.speed.x * ev.step;
        this.pos.y += this.speed.y * ev.step;
    }
    extendedLogic(ev) {
        this.updateMovement(ev);
        this.postUpdate(ev);
    }
    stopMovement() {
        this.speed.zeros();
        this.target.zeros();
    }
}
