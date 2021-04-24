import { Canvas, Flip } from "./core/canvas.js";
import { GameEvent, Scene } from "./core/core.js";
import { State } from "./core/types.js";
import { Enemy, getEnemyType, getRandomEnemyType } from "./enemy.js";
import { Player } from "./player.js";


export class GameScene implements Scene {


    static ENEMY_SPAWN_TIME = [240, 300, 900];
    static INITIAL_SPAWN_TIME = [0, 300, 1200];
    static SPAWN_TIME_VARY = [60, 120, 300];

    private player : Player;
    private enemies : Array<Enemy>;
    private enemyGenTimers : Array<number>;

    private globalSpeed : number;
    private backgroundTimer : number;
    private backgroundFlip : boolean;

    private paused : boolean;


    constructor(param : any, ev : GameEvent) {

        this.player = new Player(270, 64);
        this.enemies = new Array<Enemy> ();
        this.enemyGenTimers = new Array<number> (GameScene.ENEMY_SPAWN_TIME.length);
        for (let i = 0; i < this.enemyGenTimers.length; ++ i) {

            this.enemyGenTimers[i] = GameScene.INITIAL_SPAWN_TIME[i];
        }

        this.globalSpeed = 2.0;
        this.backgroundTimer = 0;
        this.backgroundFlip = false;

        this.paused = false;
    }   


    private spawnEnemy(minIndex : number, maxIndex: number) {

        let index = -1;

        for (let i = 0; i < this.enemies.length; ++ i) {

            if (!this.enemies[i].doesExist()) {

                index = i;
                break;
            }
        }

        let x = 128 + Math.random() * (540 - 256);
        let y = 720;

        let o = new (getEnemyType(
            minIndex + Math.floor(Math.random() * ( (maxIndex+1) - minIndex))
        ).prototype.constructor) (this.globalSpeed, x, y);

        if (index == -1) {

            this.enemies.push(o);
        }
        else {

            this.enemies[index] = o;
        }
    }


    public update(ev : GameEvent) {

        const MIN_INDICES = [0, 3, 5];
        const MAX_INDICES = [2, 4, 6];
        const SPIKEBALL_TIMER_DELAY = 60;

        if (ev.getAction("start") == State.Pressed) {

            this.paused = !this.paused;
        }
        if (this.paused) return;

        for (let i = 0; i < this.enemyGenTimers.length; ++ i) {

            if ((this.enemyGenTimers[i] -= this.globalSpeed * ev.step) <= 0) {

                this.enemyGenTimers[i] += GameScene.ENEMY_SPAWN_TIME[i] + 
                    Math.floor(Math.random() * GameScene.SPAWN_TIME_VARY[i]);
                this.spawnEnemy(MIN_INDICES[i], MAX_INDICES[i]);

                if (i != this.enemyGenTimers.length-1) {

                    this.enemyGenTimers[this.enemyGenTimers.length-1] =
                        Math.max(SPIKEBALL_TIMER_DELAY, 
                            this.enemyGenTimers[this.enemyGenTimers.length-1]);
                }
            }
        }

        for (let e of this.enemies) {

            e.update(ev);
            this.player.enemyCollision(e, ev);
        }

        this.player.update(ev);

        this.backgroundTimer += this.globalSpeed * ev.step;
        if (this.backgroundTimer >= 1024) {

            this.backgroundTimer -= 1024;
            this.backgroundFlip = !this.backgroundFlip;
        }
    }


    public redraw(c : Canvas) {

        c.moveTo();

        c.clear(192, 192, 192);

        this.player.drawShadow(c);
        for (let e of this.enemies) {

            e.drawShadow(c);
        }

        let bmpBg = c.getBitmap("background");
        c.setGlobalAlpha(0.33);
        for (let i = 0; i < 2; ++ i) {
            
            c.drawBitmap(bmpBg, c.width/2 - bmpBg.width/2, 
                -this.backgroundTimer + i * bmpBg.height,
                ((this.backgroundFlip && i == 1) ||
                (!this.backgroundFlip && i == 0)) ? Flip.None : Flip.Horizontal);
        }
        c.setGlobalAlpha();


        for (let e of this.enemies) {

            e.draw(c);
        }
        this.player.draw(c);

        if (this.paused) {

            c.setFillColor(0, 0, 0, 0.67);
            c.fillRect(0, 0, c.width, c.height);
        }
    }


    public dispose() : any {

        return null;
    }
}
