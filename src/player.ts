import { Canvas } from "./core/canvas.js";
import { GameEvent } from "./core/core.js";
import { Sprite } from "./core/sprite.js";
import { State } from "./core/types.js";
import { Vector2 } from "./core/vector.js";
import { Enemy } from "./enemy.js";
import { boxOverlay, GameObject } from "./gameobject.js";


export class Player extends GameObject {


    static FLAP_TIME = 60;


    private scale : number;
    private diving : boolean;
    private hitbox : Vector2;
    private jumpTimer : number;
    private bonusJumpTimer : number;
    private flapping : boolean;
    private flapTimer : number;


    constructor(x : number, y : number) {

        super(x, y);

        this.spr = new Sprite(256, 256);
        this.scale = 0.5;
        this.diving = false;
        this.jumpTimer = 0;
        this.flapping = false;
        this.flapTimer = Player.FLAP_TIME;

        this.friction = new Vector2(0.5, 0.5);

        this.hitbox = new Vector2(64, 96);
    }


    private control(ev : GameEvent) {

        const BASE_GRAVITY = 6.0;
        const BASE_SPEED = 4.0;
        const DIVE_SPEED = 16.0;
        const JUMP_SPEED = -10.0;
        const FLAP_TARGET = -4.0;
        const BONUS_JUMP_TIME = 8;

        this.target.y = BASE_GRAVITY;
        this.target.x = BASE_SPEED * ev.getStick().x;

        let fire1 = ev.getAction("fire1");

        // Jump
        let jumping = this.jumpTimer > 0 || this.bonusJumpTimer > 0;
        if (this.jumpTimer > 0 || this.bonusJumpTimer > 0) {

            if (this.bonusJumpTimer > 0 && (fire1 & State.DownOrPressed) == 0) {

                this.bonusJumpTimer = 0;
                jumping = false;
            }
            else {

                if (this.jumpTimer > 0)
                    this.jumpTimer -= ev.step;
                if (this.bonusJumpTimer > 0)
                    this.bonusJumpTimer -= ev.step;

                this.speed.y = JUMP_SPEED;

                if (this.jumpTimer > 0 && (fire1 & State.DownOrPressed) == 1) {

                    this.bonusJumpTimer = this.jumpTimer + BONUS_JUMP_TIME;
                    this.jumpTimer = 0;
                }
            }
        }

        // Flap
        if (!jumping &&
            this.flapTimer > 0 && fire1 == State.Pressed) {

            this.flapping = true;
        }

        if (this.flapping) {

            if ((fire1 & State.DownOrPressed) == 0) {

                this.flapping = false;
                this.flapTimer = 0;
            }
            else {
                
                this.target.y = FLAP_TARGET;
                if ((this.flapTimer -= ev.step) <= 0) {

                    this.flapping = false;
                }
            }
        }
        else {

            // Dive
            if (ev.downPress()) {

                this.diving = true;
            }

            if (this.diving) {

                this.target.y = DIVE_SPEED;
                this.friction.y = 1.0;
                this.jumpTimer = 0;
                this.flapping = false;
                this.flapTimer = 0;

                if (this.speed.y < 0.0)
                    this.speed.y = 0;

                if (ev.getStick().y < 0.25)
                    this.diving = false;
            }        
            else {

                this.friction.y = 0.33;
            }
        }
    }


    private animate(ev : GameEvent) {

        const SPEED_Y_EPS = 2.0;

        if (this.flapping) {

            this.spr.animate(1, 0, 1, 4, ev.step);
            return;
        }

        let frame = 0;

        if (this.diving)    
            frame = 3;
        else if (this.speed.y < -SPEED_Y_EPS)
            frame = 2;
        else if (this.speed.y > SPEED_Y_EPS)
            frame = 1;

        this.spr.setFrame(frame, 0);

    }


    public updateLogic(ev : GameEvent) {

        this.control(ev);
        this.animate(ev);

        // TEMP
        if (this.pos.y > 720 + this.spr.height/2 * this.scale) {

            this.pos = new Vector2(270, 64);
        }
    }


    public draw(c : Canvas) {

        c.drawScaledSprite(this.spr, c.getBitmap("player"),
            this.pos.x - this.spr.width/2 * this.scale, 
            this.pos.y - this.spr.height/2 * this.scale,
            this.spr.width*this.scale,
            this.spr.height*this.scale);
    }


    public enemyCollision(e : Enemy, ev : GameEvent) : boolean {

        const JUMP_TIME = 8;
        const JUMP_EPS = -0.5;

        let hbox : Vector2;

        if (!e.doesExist() || e.isDying() || this.dying) 
            return false;

        hbox = e.getHitbox();
            
        if (boxOverlay(this.pos, new Vector2(0, 0), this.hitbox,
            e.getPos().x - hbox.x/2,
            e.getPos().y - hbox.y,
            hbox.x, hbox.y)) {

            if (this.speed.y > JUMP_EPS) {

                this.jumpTimer = JUMP_TIME;
                e.kill(ev);

                this.flapTimer = Player.FLAP_TIME;
                this.flapping = false;
                this.diving = false;
            }
        }

        return false;
    }

}
