import { Flip } from "./core/canvas.js";
import { TransitionEffectType } from "./core/transition.js";
import { State } from "./core/types.js";
import { RGBA } from "./core/vector.js";
import { getEnemyType, Mushroom } from "./enemy.js";
import { Player } from "./player.js";
export class GameScene {
    constructor(param, ev) {
        this.reset();
    }
    reset() {
        this.player = new Player(270, -32);
        this.enemies = new Array();
        this.enemyGenTimers = new Array(GameScene.ENEMY_SPAWN_TIME.length);
        for (let i = 0; i < this.enemyGenTimers.length; ++i) {
            this.enemyGenTimers[i] = GameScene.INITIAL_SPAWN_TIME[i];
        }
        this.globalSpeed = 2.0;
        this.backgroundTimer = 0;
        this.backgroundFlip = false;
        this.depth = 0.0;
        this.speedUpgradeTime = 0.0;
        this.paused = false;
        this.readyPhase = 2;
        this.readyTimer = GameScene.READY_TIME;
        // Initial enemy
        this.enemies.push(new Mushroom(this.globalSpeed, 270, 720));
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
        const MAX_INDICES = [2, 4, 7];
        const SPIKEBALL_TIMER_DELAY = 60;
        const SLOW_DOWN_SPEED = 0.2;
        const DEPTH_SPEED = 0.005;
        const SPEED_UPGRADE_TIME = 300;
        if (ev.transition.isActive())
            return;
        if (ev.getAction("start") == State.Pressed) {
            this.paused = !this.paused;
        }
        if (this.paused)
            return;
        this.depth += DEPTH_SPEED * this.globalSpeed * ev.step;
        if ((this.speedUpgradeTime += ev.step) >= SPEED_UPGRADE_TIME) {
            this.speedUpgradeTime -= SPEED_UPGRADE_TIME;
            this.globalSpeed += 0.1;
        }
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
        if (this.readyPhase == 0) {
            this.player.update(ev);
        }
        else {
            this.player.forceAnimateFlapping(ev);
            if ((this.readyTimer -= ev.step) <= 0) {
                this.readyTimer += GameScene.READY_TIME;
                --this.readyPhase;
            }
        }
        this.backgroundTimer += this.globalSpeed * ev.step;
        if (this.backgroundTimer >= 1024) {
            this.backgroundTimer -= 1024;
            this.backgroundFlip = !this.backgroundFlip;
        }
        // Slow down if the player is dying
        if (this.player.isDying() && this.globalSpeed > 0) {
            this.globalSpeed = Math.max(0, this.globalSpeed - SLOW_DOWN_SPEED * ev.step);
        }
        if (!this.player.doesExist()) {
            ev.transition.activate(true, TransitionEffectType.Fade, 1.0 / 30.0, (ev) => this.reset(), new RGBA(192, 192, 192));
        }
    }
    genDepthString() {
        let s = String(Math.floor(this.depth * 10) / 10);
        if (!s.includes("."))
            s += ".0";
        return s;
    }
    redraw(c) {
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
        for (let i = 0; i < 2; ++i) {
            c.drawBitmap(bmpBg, c.width / 2 - bmpBg.width / 2, -this.backgroundTimer + i * bmpBg.height, ((this.backgroundFlip && i == 1) ||
                (!this.backgroundFlip && i == 0)) ? Flip.None : Flip.Horizontal);
        }
        c.setGlobalAlpha();
        for (let e of this.enemies) {
            e.draw(c);
        }
        this.player.draw(c);
        if (this.readyPhase > 0) {
            c.drawText(c.getBitmap("font"), READY_TEXT[this.readyPhase - 1], c.width / 2, 128, -28, 0, true, 1.0, 1.0);
        }
        c.moveTo();
        c.setFillColor(0, 0, 0, 0.33);
        c.fillRect(0, 0, c.width, 32);
        c.drawText(c.getBitmap("font"), "DEPTH: " + this.genDepthString() + "%", c.width / 2, 0, -22, -2, true, 0.5, 0.5);
        if (this.paused) {
            c.setFillColor(0, 0, 0, 0.67);
            c.fillRect(0, 0, c.width, c.height);
            c.drawText(c.getBitmap("font"), "GAME PAUSED", c.width / 2, c.height / 2 - 32, -28, 0, true);
        }
    }
    dispose() {
        return null;
    }
}
GameScene.READY_TIME = 60;
GameScene.ENEMY_SPAWN_TIME = [240, 360, 1200];
GameScene.INITIAL_SPAWN_TIME = [240, 1200, 2400];
GameScene.SPAWN_TIME_VARY = [60, 180, 499];
