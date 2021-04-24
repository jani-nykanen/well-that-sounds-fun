import { Canvas } from "./core/canvas.js";
import { GameEvent, Scene } from "./core/core.js";
import { Enemy, getEnemyType, getRandomEnemyType } from "./enemy.js";
import { nextObject } from "./gameobject.js";


export class GameScene implements Scene {


    static ENEMY_SPAWN_TIME = 1200;


    private enemies : Array<Enemy>;
    private enemyTimer : number;

    private globalSpeed : number;


    constructor(param : any, ev : GameEvent) {

        this.enemies = new Array<Enemy> ();

        this.enemyTimer = 0.0;
        this.globalSpeed = 8.0;
    }   


    private spawnEnemy() {

        let index = -1;

        for (let i = 0; i < this.enemies.length; ++ i) {

            if (!this.enemies[i].doesExist()) {

                index = i;
                break;
            }
        }

        let x = 128 + Math.random() * (540 - 256);
        let y = 720;

        let o = new (getRandomEnemyType().prototype.constructor) (x, y);
        o.setGlobalSpeed(this.globalSpeed);

        if (index == -1) {

            this.enemies.push(o);
        }
        else {

            this.enemies[index] = o;
        }
    }


    public update(ev : GameEvent) {

        if ((this.enemyTimer -= this.globalSpeed * ev.step) <= 0) {

            this.enemyTimer += GameScene.ENEMY_SPAWN_TIME;
            this.spawnEnemy();
        }

        for (let e of this.enemies) {

            e.update(ev);
        }
    }


    public redraw(c : Canvas) {

        c.moveTo();

        c.clear(170, 170, 170);

        for (let e of this.enemies) {

            e.draw(c);
        }
    }


    public dispose() : any {

        return null;
    }
}
