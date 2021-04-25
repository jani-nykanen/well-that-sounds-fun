import { Canvas, Flip } from "./core/canvas.js";
import { GameEvent, Scene } from "./core/core.js";
import { TransitionEffectType } from "./core/transition.js";
import { State } from "./core/types.js";
import { RGBA } from "./core/vector.js";
import { Enemy, getEnemyType, Mushroom } from "./enemy.js";
import { Ending } from "./ending.js";
import { Player } from "./player.js";


export class GameScene implements Scene {


    static READY_TIME = 60;
    static GUIDE_DISAPPEAR_TIME = 30;


    static ENEMY_SPAWN_TIME = [240, 360, 1200];
    static INITIAL_SPAWN_TIME = [240, 1200, 2400];
    static SPAWN_TIME_VARY = [60, 180, 499];

    private player : Player;
    private enemies : Array<Enemy>;
    private enemyGenTimers : Array<number>;

    private globalSpeed : number;
    private backgroundTimer : number;
    private backgroundFlip : boolean;

    private paused : boolean;
    private readyTimer : number;
    private readyPhase : number;
    private guideTimer : number;

    private depth : number;
    private speedUpgradeTime : number;

    private textWave : number;

    private monsterPos : number;
    private monsterActive : boolean;


    constructor(param : any, ev : GameEvent) {

        this.reset();
    }   


    private reset() {

        this.player = new Player(270, -32);
        this.enemies = new Array<Enemy> ();
        this.enemyGenTimers = new Array<number> (GameScene.ENEMY_SPAWN_TIME.length);
        for (let i = 0; i < this.enemyGenTimers.length; ++ i) {

            this.enemyGenTimers[i] = GameScene.INITIAL_SPAWN_TIME[i];
        }

        this.globalSpeed = 2.0;
        this.backgroundTimer = 0;
        this.backgroundFlip = false;

        this.depth = 0.0;
        this.speedUpgradeTime = 0.0;

        this.paused = false;

        this.readyPhase = 3;
        this.readyTimer = 1; // GameScene.READY_TIME;

        // Initial enemy
        this.enemies.push(
            new Mushroom(this.globalSpeed, 270, 720));

        this.textWave = 0.0;

        this.guideTimer = GameScene.GUIDE_DISAPPEAR_TIME;

        this.monsterActive = false;
        this.monsterPos = 720;
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
        const MAX_INDICES = [2, 4, 7];
        const SPIKEBALL_TIMER_DELAY = 60;
        const SLOW_DOWN_SPEED = 0.2;
        const DEPTH_SPEED = 0.005;
        const SPEED_UPGRADE_TIME = 300;
        const TEXT_WAVE_SPEED = 0.05;

        if (ev.transition.isActive()) return;

        this.textWave = (this.textWave + TEXT_WAVE_SPEED * ev.step) % (Math.PI * 2);

        if (ev.getAction("start") == State.Pressed) {

            ev.audio.playSample(ev.getSample("pause"), 0.50);
            this.paused = !this.paused;
        }
        if (this.paused) return;

        if (this.depth < 100.0) {

            this.depth += DEPTH_SPEED * this.globalSpeed * ev.step;
            if (this.depth >= 100.0) {

                this.depth = 100.0;
                this.monsterActive = true;
            }
        }

        if (this.monsterActive) {

            this.monsterPos -= 2 * this.globalSpeed * ev.step;

            if (this.monsterPos < -288) {

                ev.transition.activate(true, TransitionEffectType.Fade, 1.0/30.0,
                    ev => ev.changeScene(Ending), new RGBA(255, 255, 255));
                return;
            }
        }

        if ((this.speedUpgradeTime += ev.step) >= SPEED_UPGRADE_TIME) {

            this.speedUpgradeTime -= SPEED_UPGRADE_TIME;
            this.globalSpeed += 0.1;
        }

        if (!this.monsterActive) {

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
        }

        for (let e of this.enemies) {

            e.update(ev);

            if (!this.monsterActive)
                this.player.enemyCollision(e, ev);
        }

        if (this.readyPhase == 0) {

            if (!this.monsterActive)
                this.player.update(ev);

            if (this.guideTimer > 0) {

                this.guideTimer -= ev.step;
            }
        }
        else {

            this.player.forceAnimateFlapping(ev);
            if ((this.readyTimer -= ev.step) <= 0) {

                if (this.readyPhase > 1) {

                    ev.audio.playSample(ev.getSample(
                        ["start", "select"][this.readyPhase-2]
                    ), 0.50);
                }

                this.readyTimer += GameScene.READY_TIME;
                -- this.readyPhase;
            }
        }

        this.backgroundTimer += this.globalSpeed * ev.step;
        if (this.backgroundTimer >= 1024) {

            this.backgroundTimer -= 1024;
            this.backgroundFlip = !this.backgroundFlip;
        }

        // Slow down if the player is dying
        if (this.player.isDying() && this.globalSpeed > 0) {

            this.globalSpeed = Math.max(0, 
                this.globalSpeed - SLOW_DOWN_SPEED * ev.step);
        }

        if (!this.player.doesExist()) {

            ev.transition.activate(true, TransitionEffectType.Fade, 1.0/30.0,
                (ev : GameEvent) => this.reset(), new RGBA(192, 192, 192));
        }
    }


    private genDepthString() : String {

        let s = String(Math.floor(this.depth*10)/10);
        if (!s.includes(".")) s += ".0";

        return s;
    }


    public redraw(c : Canvas) {

        const READY_TEXT = ["GO!", "READY?"];

        c.moveTo();

        c.clear(192, 192, 192);

        if (!this.paused)
            c.applyShake();

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

        // Underlying part
        if (this.monsterActive) {

            c.drawBitmapRegion(c.getBitmap("monster"), 0, 0, 540, 288,
                0, this.monsterPos);
        }

        for (let e of this.enemies) {

            e.draw(c);
        }
        this.player.draw(c);

        // Overlaying part
        if (this.monsterActive) {

            c.drawBitmapRegion(c.getBitmap("monster"), 0, 288, 540, 288,
                0, this.monsterPos);

            if (this.monsterPos < 720-288) {

                c.setFillColor(255);
                c.fillRect(0, this.monsterPos + 288, c.width, c.height);
            }
        }

        let bmpGuide = c.getBitmap("guide");
        if (this.readyPhase > 0 && this.readyPhase < 3) {
            
            c.drawText(c.getBitmap("font"), READY_TEXT[this.readyPhase-1],
                c.width/2, 128, -28, 0, true, 1.0, 1.0,
                this.readyTimer / GameScene.READY_TIME * Math.PI * 1.5, 8, 
                Math.PI*2/ READY_TEXT[this.readyPhase-1].length);
        }

        let t : number;
        if (this.guideTimer > 0) {

            t = this.guideTimer / GameScene.GUIDE_DISAPPEAR_TIME;
            c.drawBitmapRegion(bmpGuide, 0, 0, 128, 320, 
                -bmpGuide.width/2 + bmpGuide.width/2*t, c.height-bmpGuide.height);
            c.drawBitmapRegion(bmpGuide, 128, 0, 128, 320, 
                c.width-bmpGuide.width/2*t, c.height-bmpGuide.height);
        }

        c.moveTo();
        c.setFillColor(0, 0, 0, 0.33);
        c.fillRect(0, 0, c.width, 32);
        c.drawText(c.getBitmap("font"), "DEPTH: " + this.genDepthString() + "%",
            c.width/2, 0, -26, -2, true, 0.5, 0.5);

        if (this.paused) {

            c.setFillColor(0, 0, 0, 0.67);
            c.fillRect(0, 0, c.width, c.height);

            c.drawText(c.getBitmap("font"), "GAME PAUSED",
                c.width/2, c.height/2 - 32, -28, 0, true, 1, 1,
                this.textWave, 8, Math.PI*2/5);
        }
    }


    public dispose() : any {

        return null;
    }
}
