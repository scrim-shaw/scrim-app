import { Application } from '@pixi/app'
import { Canvas } from './canvas-js/Canvas.js'
import { utils } from 'pixi.js'

utils.skipHello();

let vw = window.innerWidth;
let vh = window.innerHeight;

const app = new Application({
    view: document.querySelector("#view"),
    width: vw,
    height: vh,
    backgroundAlpha: 0.0,
    antialias: true,
    resolution: window.devicePixelRatio,
    autoDensity: true, // !!!
});

const canvas = new Canvas(app, vw, vh);
const container = canvas.setupContainer();

app.stage.addChild(container);

app.ticker.add(update);
window.addEventListener("resize", onResize);

function update() {
  canvas.update();
}

function onResize() {
  vw = window.innerWidth;
  vh = window.innerHeight;
  canvas.resize(vw, vh);
  app.renderer.resize(vw, vh);
}

function updateActiveComponent(component) {
  canvas.setActiveComponent(component);
  //canvas.setActiveComponent(JSON.parse(window.atob(component)));
}

function updateTransparencyMode() {
  // TODO: would need to remove grid lines as well
  document.body.style.backgroundColor = "transparent"
}

function clearCanvas() {
  canvas.clear();
}

function updateParams(params) {
  canvas.setColor(params.color)
}

window.updateTransparencyMode = updateTransparencyMode;
window.updateActiveComponent = updateActiveComponent;
window.clearCanvas = clearCanvas;
window.updateParams = updateParams;

//updateTransparencyMode();