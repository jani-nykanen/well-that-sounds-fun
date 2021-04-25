import { Canvas } from "./core/canvas.js";
import { GameEvent } from "./core/core.js";
import { Scene } from "./core/core.js";
import { TransitionEffectType } from "./core/transition.js";
import { State } from "./core/types.js";
import { RGBA } from "./core/vector.js";
import { Intro } from "./intro.js";



export class AudioIntro implements Scene {


    private cursorPos : number;


    constructor(params : any, ev : GameEvent) {

        this.cursorPos = 0;
    }


    public update(ev : GameEvent) { 

        if (ev.downPress() || ev.upPress()) {

            this.cursorPos = Number(!Boolean(this.cursorPos));
        }

        if (ev.getAction("start") == State.Pressed) {

            ev.audio.toggle(this.cursorPos == 0);
            ev.audio.playSample(ev.getSample("select"), 0.50);

            ev.changeScene(Intro);
            ev.transition.activate(false, TransitionEffectType.Fade,
                1.0/30.0, null, new RGBA(128, 128, 128));
        }
    }


    public redraw(c : Canvas) {

        c.clear(128, 128, 128);

        let bmpFont = c.getBitmap("font");

        c.drawText(bmpFont,
            "WOULD YOU LIKE\nTO ENABLE AUDIO?\nPRESS ENTER TO\nCONFIRM.",
            24, 128, -26, -4, false, 0.750, 0.750);

        let str = "";
        if (this.cursorPos == 0) {
            
            str = "@YES\n NO";
        }
        else {

            str = " YES\n@NO";
        }

        c.drawText(bmpFont,
            str, 128, 352, -26, -4, false, 1, 1);
    }


    public dispose = () : any => null;
}
