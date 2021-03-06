import { AssetManager } from "./assets.js";
import { AudioPlayer } from "./audioplayer.js";
import { Canvas } from "./canvas.js";
import { InputManager } from "./input.js";
import { AudioSample } from "./sample.js";
import { TransitionEffectManager } from "./transition.js";
import { State } from "./types.js";
import { Vector2 } from "./vector.js";


export class GameEvent {


    public readonly step : number;
    public readonly transition : TransitionEffectManager;
    public readonly audio : AudioPlayer;

    private readonly input : InputManager;
    private readonly assets : AssetManager;
    private readonly core : Core;
    private readonly canvas : Canvas;


    constructor(step : number, core : Core, canvas : Canvas,
        input : InputManager, assets : AssetManager,
        transition : TransitionEffectManager,
        audio : AudioPlayer) {

        this.core = core;
        this.step = step;
        this.canvas = canvas;
        this.input = input;
        this.assets = assets;
        this.transition = transition;
        this.audio = audio;
    }


    public getStick() : Vector2 {

        return this.input.getStick();
    }


    public getAction(name : string) : State {

        return this.input.getAction(name);
    }


    public leftPress = () : boolean => this.input.leftPress();
    public rightPress = () : boolean => this.input.rightPress();
    public upPress = () : boolean => this.input.upPress();
    public downPress = () : boolean => this.input.downPress();


    public changeScene(newScene : Function) {

        this.core.changeScene(newScene);
    }


    public shake(shakeTime : number, magnitude : number) {

        this.canvas.shake(shakeTime, magnitude);
    }

    
    public getSample = (name : string) : AudioSample => this.assets.getSample(name);
}


export interface Scene {

    update(ev : GameEvent) : void;
    redraw(c : Canvas) : void;

    // TODO: Replace any with... something 
    dispose() : any;
}


export class Core {

    private canvas : Canvas;
    private assets : AssetManager;
    private input : InputManager;
    private transition : TransitionEffectManager;
    private ev : GameEvent;
    private audio : AudioPlayer;

    private activeScene : Scene;
    private activeSceneType : Function;

    private timeSum : number;
    private oldTime : number;

    private initialized : boolean;


    constructor(canvasWidth : number, canvasHeight : number, frameSkip = 0) {

        this.audio = new AudioPlayer();
        this.assets = new AssetManager(this.audio);
        this.canvas = new Canvas(canvasWidth, canvasHeight, this.assets);

        this.input = new InputManager();
        this.input.addAction("left", "ArrowLeft", 14)
            .addAction("up", "ArrowUp", 12)
            .addAction("right", "ArrowRight", 15)
            .addAction("down", "ArrowDown", 13),

        this.transition = new TransitionEffectManager();
        
        this.ev = new GameEvent(frameSkip+1, this, this.canvas, 
            this.input, this.assets, this.transition, this.audio);

        this.timeSum = 0.0;
        this.oldTime = 0.0;

        this.initialized = false;

        this.activeScene = null;
        this.activeSceneType = null;
    }


    private drawLoadingScreen(c : Canvas) {

        const BAR_BORDER_WIDTH = 1;

        let barWidth = c.width / 4;
        let barHeight = barWidth / 8;

        c.clear(0, 0, 0);
    
        let t = this.assets.dataLoadedUnit();
        let x = c.width/2 - barWidth/2;
        let y = c.height/2 - barHeight/2;

        x |= 0;
        y |= 0;
    
        // Outlines
        c.setFillColor(255);
        c.fillRect(x-BAR_BORDER_WIDTH*2, y-BAR_BORDER_WIDTH*2, 
            barWidth+BAR_BORDER_WIDTH*4, barHeight+BAR_BORDER_WIDTH*4);
        c.setFillColor(0);
        c.fillRect(x-BAR_BORDER_WIDTH, y-BAR_BORDER_WIDTH, 
            barWidth+BAR_BORDER_WIDTH*2, barHeight+BAR_BORDER_WIDTH*2);
    
        // Bar
        let w = (barWidth*t) | 0;
        c.setFillColor(255);
        c.fillRect(x, y, w, barHeight);
    }


    private loop(ts : number) {

        const MAX_REFRESH_COUNT = 5;
        const FRAME_WAIT = 16.66667 * this.ev.step;

        this.timeSum += ts - this.oldTime;
        this.timeSum = Math.min(MAX_REFRESH_COUNT * FRAME_WAIT, this.timeSum);
        this.oldTime = ts;

        let refreshCount = (this.timeSum / FRAME_WAIT) | 0;
        while ((refreshCount --) > 0) {

            if (!this.initialized && this.assets.hasLoaded()) {
                
                if (this.activeSceneType != null)
                    this.activeScene = new this.activeSceneType.prototype.constructor(null, this.ev);
                    
                this.initialized = true;
            }

            this.input.preUpdate();

            if (this.initialized && this.activeScene != null) {

                this.activeScene.update(this.ev);
            }
            this.canvas.update(this.ev);
            this.transition.update(this.ev);

            this.input.postUpdate();

            this.timeSum -= FRAME_WAIT;
        }

        if (this.initialized) {

            if (this.activeScene != null)
                this.activeScene.redraw(this.canvas);
            
            this.transition.draw(this.canvas);
        }
        else {

            this.drawLoadingScreen(this.canvas);
        }

        window.requestAnimationFrame(ts => this.loop(ts));
    }


    public addInputAction(name : string, key : string, 
        button1 : number, button2 = -1) : Core {

        this.input.addAction(name, key, button1, button2);

        return this;
    }


    public loadAssets(indexFilePath : string) : Core {

        this.assets.parseAssetIndexFile(indexFilePath);

        return this;
    }


    public run(initialScene : Function) {

        this.activeSceneType = initialScene;

        this.loop(0);
    }


    public changeScene(newScene : Function) {

        let param = this.activeScene.dispose();
        this.activeScene = new newScene.prototype.constructor(param, this.ev);
    }
    
}
