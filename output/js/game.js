import { Flip } from "./core/canvas.js";
import { getEnemyType } from "./enemy.js";
import { Player } from "./player.js";
export class GameScene {
    constructor(param, ev) {
        this.player = new Player(270, 64);
        this.enemies = new Array();
        this.enemyGenTimers = new Array(GameScene.ENEMY_SPAWN_TIME.length);
        for (let i = 0; i < this.enemyGenTimers.length; ++i) {
            this.enemyGenTimers[i] = GameScene.INITIAL_SPAWN_TIME[i];
        }
        this.globalSpeed = 2.0;
        this.backgroundTimer = 0;
        this.backgroundFlip = false;
    }
    spawnEnemy(minIndex, maxIndex) {
        let index = -1;
        for (let i = 0; i < this.enemies.length; ++i) {
            if (!this.enemies[i].doesExist()) {
                index = i;
                break;
            }
        }
        let x = 128 + Math.random() * (540 - 256);
        let y = 720;
        let o = new (getEnemyType(minIndex + Math.floor(Math.random() * ((maxIndex + 1) - minIndex))).prototype.constructor)(this.globalSpeed, x, y);
        if (index == -1) {
            this.enemies.push(o);
        }
        else {
            this.enemies[index] = o;
        }
    }
    update(ev) {
        const MIN_INDICES = [0, 3, 5];
        const MAX_INDICES = [2, 4, 5];
        const SPIKEBALL_TIMER_DELAY = 60;
        for (let i = 0; i < this.enemyGenTimers.length; ++i) {
            if ((this.enemyGenTimers[i] -= this.globalSpeed * ev.step) <= 0) {
                this.enemyGenTimers[i] += GameScene.ENEMY_SPAWN_TIME[i] +
                    Math.floor(Math.random() * GameScene.SPAWN_TIME_VARY[i]);
                this.spawnEnemy(MIN_INDICES[i], MAX_INDICES[i]);
                if (i != this.enemyGenTimers.length - 1) {
                    this.enemyGenTimers[this.enemyGenTimers.length - 1] =
                        Math.max(SPIKEBALL_TIMER_DELAY, this.enemyGenTimers[this.enemyGenTimers.length - 1]);
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
    redraw(c) {
        c.moveTo();
        c.clear(192, 192, 192);
        this.player.drawShadow(c);
        for (let e of this.enemies) {
            e.drawShadow(c);
        }
        let bmpBg = c.getBitmap("background");
        c.setGlobalAlpha(0.33);
        for (let i = 0; i < 2; ++i) {
            c.drawBitmap(bmpBg, c.width / 2 - bmpBg.width / 2, -this.backgroundTimer + i * bmpBg.height, ((this.backgroundFlip && i == 1) ||
                (!this.backgroundFlip && i == 0)) ? Flip.None : Flip.Horizontal);
        }
        c.setGlobalAlpha();
        for (let e of this.enemies) {
            e.draw(c);
        }
        this.player.draw(c);
    }
    dispose() {
        return null;
    }
}
GameScene.ENEMY_SPAWN_TIME = [240, 300, 900];
GameScene.INITIAL_SPAWN_TIME = [0, 300, 1200];
GameScene.SPAWN_TIME_VARY = [60, 120, 300];
