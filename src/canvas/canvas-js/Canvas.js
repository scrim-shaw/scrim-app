
import { Shape, intersects, distance } from './Shape.ts';
import { BrushGenerator, Brush } from './BrushGenerator.js';
import { Sprite, Point, Container } from 'pixi.js';
import { SmoothGraphics as Graphics } from '@pixi/graphics-smooth';

export class Canvas {
  constructor(app, vw, vh) {
    this.app = app;
    this.vw = vw;
    this.vh = vh;

    this.activeComponent = null;
    this.activeTool = null;
    this.components = [];

    this.brushGenerator = new BrushGenerator(app.renderer);
    this.brushTexture = this.brushGenerator.get(0x000000, 1.0, false)

    this.color = 0x9b59b6
    this.setupKeyPress();
  }

  setupContainer() {
    this.container = new Container();

    this.setupGridLines(this.vw, this.vh);
    this.setupBackground(this.vw, this.vh);
    this.setupHighlighter();

    this.componentBox = new Graphics();
    this.container.addChild(this.componentBox);

    this.drawBuffer = new Container();
    this.container.addChild(this.drawBuffer);

    return this.container;
  }

  setActiveComponent(activeComponent) {
    this.activeComponent = activeComponent;
    var componentId = null

    if (activeComponent) {
      this.setupForeground(this.vw, this.vh);
      componentId = activeComponent.id
    } else {
      this.foreground.interactive = false;
    }

    window.activeComponentUpdated(componentId)
  }

  setActiveTool(activeTool) {
    this.activeTool = activeTool;
  }

  setupForeground(vw, vh) {
    if (this.foreground) {
      this.foreground.interactive = true;
      this.container.removeChild(this.foreground);
      this.container.addChild(this.foreground);
    } else {
      this.foreground = new Sprite();
      this.foreground.width = vw;
      this.foreground.height = vh;

      this.foreground.interactive = true;
      this.foreground.cursor = 'crosshair';
      this.foreground.canvas = this;
      this.foreground
        .on("pointerdown", this.onPointerDownForeground)
        .on("pointermove", this.onPointerMoveForeground)
        .on("pointerup", this.onPointerUpForeground)
        .on("pointerupoutside", this.onPointerUpForeground);

      this.container.addChild(this.foreground);
    }
  }

  setupHighlighter() {
    this.highlighter = new Graphics();
    this.container.addChild(this.highlighter);
  }

  setupGridLines(vw, vh) {
    if (!this.gridLines) {
      this.gridLines = new Graphics();
      this.container.addChild(this.gridLines)
    }
    
    this.gridLines
    .clear()

    const frequency = 35;
    for (var x = 0; x < vw; x++) {
      for (var y = 0; y < vh; y++) {
         if (x%frequency == 0 && y%frequency == 0) {
          this.gridLines
                  .beginFill(0x34495e, 0.2)
                  .drawCircle(x, y, 1)
                  .endFill()
         }
      }
    }
  }

  setupBackground(vw, vh) {
    this.background = new Sprite();
    this.background.width = vw;
    this.background.height = vh;

    this.background.interactive = true;
    this.background.canvas = this;
    this.background
      .on("pointerdown", this.onPointerDownBackground)
      .on("pointermove", this.onPointerMoveBackground)
      .on("pointerup", this.onPointerUpBackground)
      .on("pointerupoutside", this.onPointerUpBackground);

    this.container.addChild(this.background);
  }

  createComponent(x, y, componentData, graphics = null, texture = null) {
    var component;
    var newTexture = null;
    if (componentData.type === 'shape') {
      if (graphics) {
        newTexture = this.app.renderer.generateTexture(graphics, { resolution: window.devicePixelRatio });
        component = new Sprite(newTexture);
      } else if (texture) {
        component = new Sprite(texture);
        newTexture = texture;
      }
    } else if (componentData.type === 'image') {
      var imageUrl;
      if (componentData.localUrl) {
        imageUrl = componentData.localUrl
      } else {
        imageUrl = componentData.icon
      }

      component = Sprite.from(imageUrl);
    } else if (componentData.type === 'brush') {
      if (texture) {
        component = new Sprite(texture);
        newTexture = texture;
      }
    }

    component.textureRef = newTexture;

    component.x = x;
    component.y = y;
    component.anchor.set(0.5, 0.5);
    component.l = new Point(x-(component.width/2), y-(component.height/2))
    component.r = new Point(x+(component.width/2), y+(component.height/2))

    component.canvas = this;
    component.selected = false;
    component.componentData = structuredClone(componentData);

    component.dragging = false;
    component.newPosition = new Point();
    component.lastPosition = new Point();

    component.interactive = true;
    component.buttonMode = true;
    component
      .on("pointerdown", this.onPointerDownComponent)
      .on("pointerup", this.onPointerUpComponent)
      .on("pointerupoutside", this.onPointerUpComponent)
      .on("pointermove", this.onPointerMoveComponent);

    if (graphics) {
      graphics.destroy();
    }

    return component;
  }

  addComponent(component, setFocus = true) {
    this.components.push(component);
    this.container.addChild(component);

    if (setFocus) {
      this.setComponentFocus(component)
    }

    this.container.removeChild(this.componentBox);
    this.container.addChild(this.componentBox);
  }

  highlight(lh, rh) {
    const w = Math.abs(lh.x - rh.x); const h = Math.abs(lh.y - rh.y); const a = w*h
    if (a > 20) {
      this.components.forEach((component) => {
        component.selected = intersects(lh, rh, component.l, component.r)
      })
    } else {
      this.clearFocus();
    }
  }

  clearFocus() {
    this.components.forEach((component) => {
      component.selected = false;
    })
  }

  setComponentFocus(component) {
    this.components.forEach((element) => {
      element.selected = false;
      if (element === component) {
        element.selected = true;
      }
    })

    this.container.removeChild(this.componentBox);
    this.container.addChild(this.componentBox);
  }

  onPointerDownComponent(event) {
    this.dragging = true;
    this.dragData = event.data;
    this.initialPosition = this.dragData.getLocalPosition(this.parent, this.initialPosition);
    this.lastPosition = this.dragData.getLocalPosition(this.parent, this.lastPosition);
    if (!this.selected) {
      this.canvas.setComponentFocus(this);
    }
  }

  onPointerMoveComponent(event) {
    if (this.dragging) {
      const newPosition = this.dragData.getLocalPosition(this.parent, this.newPosition);
      // this.position.x += (newPosition.x - this.lastPosition.x);
      // this.position.y += (newPosition.y - this.lastPosition.y);
      // this.l = new Point(this.x-(this.width/2), this.y-(this.height/2))
      // this.r = new Point(this.x+(this.width/2), this.y+(this.height/2))

      this.canvas.components.forEach((component) => {
        if (component.selected) {
          component.position.x += (newPosition.x - this.lastPosition.x);
          component.position.y += (newPosition.y - this.lastPosition.y);

          component.l = new Point(component.x-(component.width/2), component.y-(component.height/2))
          component.r = new Point(component.x+(component.width/2), component.y+(component.height/2))
        }
      })

      this.lastPosition.copyFrom(newPosition);
    }
  }

  onPointerUpComponent(event) {
    if (this.initialPosition && this.lastPosition) {
      const d = distance(this.initialPosition, this.lastPosition)
      if (d < 10) {
        this.canvas.setComponentFocus(this);
      }
    }
    this.dragData = null;
    this.dragging = false;
  }

  setupKeyPress() {
    document.addEventListener('keyup', (event) => {
      if (event.key === ' ') {
        this.components.forEach((component) => {
          if (component.selected) {
            const newComponent = this.createComponent(component.x, component.y, component.componentData, null, component.textureRef);
            this.addComponent(newComponent, false);

            this.container.removeChild(component);
            this.container.addChild(component);
          }
        })
      }

      if (event.key === 'Backspace') {
        var newComponents = []
        for (let i = 0; i < this.components.length; i++) {
          const component = this.components[i];
          if (component.selected) {
            component.parent.removeChild(component);
          } else {
            newComponents.push(component)
          }
        }
        this.components = newComponents
      }

      if (event.key === 'Escape') {
        this.setActiveComponent(null);
      }

      if (event.key === '-' || event.key === '=' || event.key === '+') {
        for (let i = 0; i < this.components.length; i++) {
          const component = this.components[i];
          if (component.selected) {
          var increase = event.key === '=' || event.key === '+'
          var s = increase ? 1.1 : 0.9

          component.scale.x *= s
          component.scale.y *= s
          }
        }
      }

      // var one = {
      //   "options": {
      //       "disappear": true
      //   },
      //   "id": "18",
      //   "icon": "https://scrimage-icons.s3.amazonaws.com/icons8-pen-disappear-64.png",
      //   "name": "Disappearing Pen",
      //   "type": "brush"
      // }
      // var two = {
      //   "options": {
      //       "disappear": false
      //   },
      //   "id": "16",
      //   "icon": "https://scrimage-icons.s3.amazonaws.com/icons8-pen-64.png",
      //   "name": "Pen",
      //   "type": "brush"
      // }

      // if (event.key === '1') {
      //   this.setActiveComponent(one)
      // }

      // if (event.key === '2') {
      //   this.setActiveComponent(two)
      // }
    }, false);
  }

  resize(vw, vh) {
    this.vw = vw;
    this.vh = vh;
    this.background.width = vw;
    this.background.height = vh;
    if (this.foreground) {
      this.foreground.width = vw;
      this.foreground.height = vw;
    }
    this.setupGridLines(vw, vh);
  }

  onPointerDownForeground(event) {
    if (this.canvas.activeComponent.type === 'shape') {
      this.dragging = true;
      this.dragData = event.data;
      this.initialPosition = this.dragData.getLocalPosition(this.parent, this.initialPosition);
    } else if (this.canvas.activeComponent.type === 'brush') {
      this.dragging = true;
      this.dragData = event.data;
      const initialPosition = this.dragData.getLocalPosition(this.parent, this.initialPosition);
      this.lastPosition = initialPosition;
      this.canvas.container.removeChild(this.canvas.drawBuffer);
      this.canvas.container.addChild(this.canvas.drawBuffer);

      this.minX = initialPosition.x;
      this.maxX = initialPosition.x;

      this.minY = initialPosition.y;
      this.maxY = initialPosition.y;
    }
  }

  onPointerMoveForeground(event) {
    if (this.canvas.activeComponent.type === 'shape') {
      if (this.dragging) {
        const newPosition = this.dragData.getLocalPosition(this.parent, this.newPosition);

        if (!this.drawingGraphics) {
          this.drawingGraphics = new Graphics();
          this.canvas.container.addChild(this.drawingGraphics);
        }

        Shape.updateGraphics(this.canvas.activeComponent, this.drawingGraphics, this.canvas.color, this.initialPosition, newPosition);
      }
    } else if (this.canvas.activeComponent.type === 'brush') {
      if (this.dragging) {
        const newPosition = this.dragData.getLocalPosition(this.parent, this.newPosition);
        this.minX = Math.min(this.minX, newPosition.x);
        this.maxX = Math.max(this.maxX, newPosition.x);

        this.minY = Math.min(this.minY, newPosition.y);
        this.maxY = Math.max(this.maxY, newPosition.y);

        Brush.drawPointLine(this.canvas.drawBuffer, this.canvas.brushTexture, this.lastPosition, newPosition, this.canvas.activeComponent.options.disappear)
        this.lastPosition = newPosition;
      }
    }
  }

  onPointerUpForeground(event) {
    if (this.canvas.activeComponent.type === 'shape') {
      this.dragging = false;
      const newPosition = this.dragData.getLocalPosition(this.parent, this.newPosition);

      if (this.drawingGraphics && this.drawingGraphics.shouldCreate) {
        this.drawingGraphics.parent.removeChild(this.drawingGraphics);
        var newComponent = this.canvas.createComponent(this.drawingGraphics.center.x, this.drawingGraphics.center.y, this.canvas.activeComponent, this.drawingGraphics);
        this.canvas.addComponent(newComponent);
      }

      this.drawingGraphics = null;
      this.draggingComponent = null;
      this.initialPosition = null;
      this.canvas.setActiveComponent(null);
    } else if (this.canvas.activeComponent.type == 'image') {
      const pos = event.data.getLocalPosition(this.parent, new Point());

      var newComponent = this.canvas.createComponent(pos.x, pos.y, this.canvas.activeComponent);
      this.canvas.addComponent(newComponent);

      this.canvas.setActiveComponent(null);
    } else if (this.canvas.activeComponent.type == 'brush') {
      this.dragging = false;
      const drawTexture = this.canvas.app.renderer.generateTexture(this.canvas.drawBuffer, { resolution: window.devicePixelRatio * 2 });

      const x = (this.minX + this.maxX) / 2;
      const y = (this.minY + this.maxY) / 2;

      if (!this.canvas.activeComponent.options.disappear) {
        while(this.canvas.drawBuffer.children[0]) { 
          this.canvas.drawBuffer.removeChild(this.canvas.drawBuffer.children[0]);
        }

        var newComponent = this.canvas.createComponent(x, y, this.canvas.activeComponent, null, drawTexture)
        this.canvas.addComponent(newComponent, false);
      }
      this.canvas.setActiveComponent(this.canvas.activeComponent);
    }
  }

  onPointerDownBackground(event) {
    this.dragging = true;
    this.dragData = event.data;
    this.initialPosition = this.dragData.getLocalPosition(this.parent, this.initialPosition);

    this.canvas.container.removeChild(this.canvas.highlighter);
    this.canvas.container.addChild(this.canvas.highlighter);
  }

  onPointerMoveBackground(event) {
    if (this.dragging) {
      const initialCursorPosition = this.initialPosition;
      const currentCursorPosition = this.dragData.getLocalPosition(this.parent, this.newPosition);
      const minX = Math.min(initialCursorPosition.x, currentCursorPosition.x);
      const minY = Math.min(initialCursorPosition.y, currentCursorPosition.y);
      const w = Math.abs(initialCursorPosition.x - currentCursorPosition.x);
      const h = Math.abs(initialCursorPosition.y - currentCursorPosition.y);

      this.canvas.highlighter
                  .clear()
                  .beginFill(0x3498db, 0.2)
                  .lineStyle(1, 0x3498db, 1.0)
                  .drawRect(minX, minY, w, h)
                  .endFill()
    }
  }

  onPointerUpBackground(event) {
    const initialCursorPosition = this.initialPosition;
    if (this.dragData) {
      const currentCursorPosition = this.dragData.getLocalPosition(this.parent, this.newPosition);

      const l = new Point(Math.min(initialCursorPosition.x, currentCursorPosition.x), Math.min(initialCursorPosition.y, currentCursorPosition.y))
      const r = new Point(Math.max(initialCursorPosition.x, currentCursorPosition.x), Math.max(initialCursorPosition.y, currentCursorPosition.y))

      this.canvas.highlight(l, r)

      this.dragging = false;
      this.canvas.highlighter.clear();

      this.dragData = null;
      this.initialPosition = null;
    }
  }

  update() {
    this.componentBox
      .clear()
      .lineStyle(1, Number("0x" + "3498db"), 1.0)

    var minX = Number.MAX_VALUE; var minY = Number.MAX_VALUE; var maxX = Number.MIN_VALUE; var maxY = Number.MIN_VALUE;

    for (let i = 0; i < this.components.length; i++) {
      const component = this.components[i];
      if (component.selected) {
        const x = component.x - (component.width * 0.5)
        const y = component.y - (component.height * 0.5)

        const x2 = component.x + (component.width * 0.5)
        const y2 = component.y + (component.height * 0.5)

        minX = Math.min(minX, x)
        minY = Math.min(minY, y)

        maxX = Math.max(maxX, x2)
        maxY = Math.max(maxY, y2)

        // add a box to each individual component
        //this.componentBox.drawRect(component.x - (component.width * 0.5), component.y - (component.height * 0.5), component.width, component.height);
      }
    }

    // if (!this.resizeBox) {
    //   const component = {type: "shape", name: "Rectangle"}
    //   const boxGraphics = new Graphics()
    //   boxGraphics.drawRect()
    //   this.resizeBox = this.createComponent(maxX, maxY, component, , )
    // }

    this.componentBox
    .lineStyle(2, Number("0x" + "3498db"), 1.0)
    .drawRect(minX, minY, maxX-minX, maxY-minY)
  }
}