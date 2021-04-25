import { Core } from "./core/core.js";
import { Intro } from "./intro.js";
window.onload = () => (new Core(540, 720))
    .addInputAction("fire1", "ArrowUp", 0)
    .addInputAction("start", "Enter", 9, 7)
    .addInputAction("back", "Escape", 8, 6)
    .addInputAction("select", "ShiftLeft", 4, 5)
    .loadAssets("assets/index.json")
    .run(Intro);
