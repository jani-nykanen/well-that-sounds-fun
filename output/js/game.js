import { getRandomEnemyType } from "./enemy.js";
export class GameScene {
    constructor(param, ev) {
        this.enemies = new Array();
        this.enemyTimer = 0.0;
        this.globalSpeed = 8.0;
    }
    spawnEnemy() {
        let index = -1;
        for (let i = 0; i < this.enemies.length; ++i) {
            if (!this.enemies[i].doesExist()) {
                index = i;
                break;
            }
        }
        let x = 128 + Math.random() * (540 - 256);
        let y = 720;
        let o = new (getRandomEnemyType().prototype.constructor)(x, y);
        o.setGlobalSpeed(this.globalSpeed);
        if (index == -1) {
            this.enemies.push(o);
        }
        else {
            this.enemies[index] = o;
        }
    }
    update(ev) {
        if ((this.enemyTimer -= this.globalSpeed * ev.step) <= 0) {
            this.enemyTimer += GameScene.ENEMY_SPAWN_TIME;
            this.spawnEnemy();
        }
        for (let e of this.enemies) {
            e.update(ev);
        }
    }
    redraw(c) {
        c.moveTo();
        c.clear(170, 170, 170);
        for (let e of this.enemies) {
            e.draw(c);
        }
    }
    dispose() {
        return null;
    }
}
GameScene.ENEMY_SPAWN_TIME = 1200;
