import { Canvas } from "./core/canvas.js";
import { GameEvent, Scene } from "./core/core.js";
import { TransitionEffectType } from "./core/transition.js";
import { State } from "./core/types.js";
import { RGBA, Vector2 } from "./core/vector.js";
import { GameScene } from "./game.js";
import { updateSpeedAxis } from "./gameobject.js";


export class Intro implements Scene {


    private logoWave : number;
    private animationPlaying : boolean;
    private animationPos : number;
    private animationSpeed : number;


    constructor(params : any, ev : GameEvent) {

        this.logoWave = 0.0;
        this.animationPos = 0;
        this.animationSpeed = 0;
    }


    public update(ev : GameEvent) {

        const LOGO_WAVE_SPEED = 0.05;
        const BUNNY_GRAVITY = 12.0;
        const JUMP_FRICTION = 0.5;

        if (ev.transition.isActive()) return;

        if (!this.animationPlaying) {

            if (ev.getAction("start") == State.Pressed) {

                this.animationPlaying = true;
                this.animationSpeed = -12.5;

                ev.audio.playSample(ev.getSample("jump"), 0.50);
            }
        }
        else {

            this.animationPos += this.animationSpeed * ev.step;
            this.animationSpeed = updateSpeedAxis(this.animationSpeed, BUNNY_GRAVITY, JUMP_FRICTION*ev.step);

            if (this.animationPos > 128) {

                ev.audio.playSample(ev.getSample("well"), 0.60);
                ev.transition.activate(true, TransitionEffectType.CirleIn, 1.0/30.0,
                    ev => {

                        ev.changeScene(GameScene);
                        ev.transition.activate(false, TransitionEffectType.Fade, 1.0/30.0, null, new RGBA(0, 0, 0));
                    }, new RGBA(0, 0, 0))
                    .setCenter(new Vector2(270, 400));
            }
        }

        this.logoWave = (this.logoWave + LOGO_WAVE_SPEED * ev.step) % (Math.PI * 2);
    }


    public redraw(c : Canvas) {

        const BASE_WIDTH = 400;
        const BASE_HEIGHT = BASE_WIDTH / 2;
        const WELL_Y = 352;
        const ENTER_Y_OFF = 120;

        let bmpIntro = c.getBitmap("intro");
        let bmpBunny = c.getBitmap("player");

        let logoScaleX : number;
        let logoScaleY : number;

        logoScaleY = 1.0 - 0.125 * Math.sin(this.logoWave);
        logoScaleX = 1.0 + 0.125 * Math.sin(this.logoWave);

        let logoY = 56 + BASE_HEIGHT - (BASE_HEIGHT * logoScaleY);

        c.clear(255, 255, 255);

        c.drawScaledBitmapRegion(bmpIntro, 0, 0, 512, 256, 
            c.width/2 - (BASE_WIDTH*logoScaleX)/2, logoY, 
            BASE_WIDTH * logoScaleX, BASE_HEIGHT*logoScaleY);

        let frame = 0;
        if (this.animationSpeed < -2.0)
            frame = 2;
        else if (this.animationSpeed > 2.0)
            frame = 1;

        if (!this.animationPlaying || this.animationSpeed < 0.0) {

            c.drawBitmapRegion(bmpBunny, frame*256, 0, 256, 256, c.width/2-128, WELL_Y-88 + this.animationPos);
            c.drawBitmapRegion(bmpIntro, 0, 256, 480, 256, c.width/2-240, WELL_Y);
        }
        else {

            c.drawBitmapRegion(bmpIntro, 0, 256, 480, 256, c.width/2-240, WELL_Y);
            c.drawBitmapRegion(bmpBunny, frame*256, 0, 256, 256, c.width/2-128, WELL_Y-88 + this.animationPos);
            c.drawBitmapRegion(bmpIntro, 0, 512, 480, 256, c.width/2-240, WELL_Y);

            c.setFillColor(255);
            c.fillRect(0, WELL_Y+256, c.width, c.height - (WELL_Y+256));
        }

        c.drawText(c.getBitmap("font"), "©2021 JANI NYKäNEN",
            c.width/2, c.height-36, -20, 0, true, 0.5, 0.5);

        if (!this.animationPlaying) {

            c.drawText(c.getBitmap("font"), "PRESS ENTER",
            c.width/2, c.height-ENTER_Y_OFF, -28, 0, true, 1.0, 1.0,
                this.logoWave, 8, Math.PI*2/5);
        }
    }


    public dispose = () : any => null;
}
