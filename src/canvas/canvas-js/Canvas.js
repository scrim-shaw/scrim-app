
import { Shape, intersects, distance } from './Shape.js';
import { BrushGenerator, Brush } from './BrushGenerator.js';
import { Sprite, Point, Container, Texture, Text } from 'pixi.js';
import { SmoothGraphics as Graphics } from '@pixi/graphics-smooth';
import { ComponentBox } from './ComponentBox.js';
import { TextBox } from './TextBox'
import { debounce } from '../../Utils.js';

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

    this.colors = [0x3498db, 0x9b59b6, 0x2ecc71, 0xe67e22, 0xe74c3c, 0xf1c40f]

    this.color = this.colors[0]
    this.setupKeyPress();
  }

  setupContainer() {
    this.container = new Container();

    this.setupGridLines(this.vw, this.vh);
    this.setupBackground(this.vw, this.vh);
    this.setupHighlighter();

    this.componentBox = new ComponentBox();
    this.componentBox.scrimCanvas = this;

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

  clear() {
    this.components.forEach(component => {
      component.parent.removeChild(component);
    })
    this.components = []
  }

  randomColor() {
    // TODO: make it a smart shuffle?
    return this.colors[Math.floor(Math.random()*this.colors.length)]
  }

  setColor(color) {
    var random = false;
    if (color === "#random") {
      color = this.randomColor()
      random = true
    } else {
      this.color = color;
    }
    this.components.forEach(component => {
      if (component.selected) {
        component.color = color
        this.updateGraphics(component);
        if (random) {
          color = this.randomColor()
        }
      } 
    })
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
      this.foreground.scrimCanvas = this;
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
    this.background.scrimCanvas = this;
    this.background
      .on("pointerdown", this.onPointerDownBackground)
      .on("pointermove", this.onPointerMoveBackground)
      .on("pointerup", this.onPointerUpBackground)
      .on("pointerupoutside", this.onPointerUpBackground);

    this.container.addChild(this.background);
  }

  createComponent(duplicated, x, y, componentData, graphics = null, texture = null, width = null, height = null) {
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
      component.resizable = true;
    } else if (componentData.type === 'image') {
      var imageUrl;
      if (componentData.localUrl) {
        imageUrl = componentData.localUrl
      } else {
        imageUrl = componentData.icon
      }

      const texture = new Texture.from(imageUrl)
      component = new Sprite(texture);
      component.resizable = true;
    } else if (componentData.type === 'brush') {
      if (texture) {
        component = new Sprite(texture);
        newTexture = texture;
      }
      component.resizable = true
    } else if (componentData.type === 'text') {
      component = new TextBox(componentData.content, {
        fontFamily : 'Arial',
        fontSize: 24,
        // fill : 0xff1010,
        align : 'left',
        wordWrap : true,
  	    wordWrapWidth: 500
      });

      component.resizable = false

      if (!duplicated) {
        setTimeout(() => {
          component.selected = true
          this.keyDetectionSuspended = true
          component.edit()
        }, 100);
      }
    }

    component.textureRef = newTexture;

    component.x = x;
    component.y = y;
    if (width) { component.width = width; }
    if (height) { component.height = height; }
    component.anchor.set(0.5, 0.5);
    component.l = new Point(x-(component.width/2), y-(component.height/2))
    component.r = new Point(x+(component.width/2), y+(component.height/2))

    component.scrimCanvas = this;
    component.selected = false;
    component.componentData = structuredClone(componentData);

    component.dragging = false;
    component.newPosition = new Point();
    component.lastPosition = new Point();

    component.interactive = true;
    component.taps = 0
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

    this.container.removeChild(this.componentBox.getBox())
    this.container.addChild(this.componentBox.getBox())
  }

  highlight(lh, rh) {
    const w = Math.abs(lh.x - rh.x); const h = Math.abs(lh.y - rh.y); const a = w*h
    if (a > 20) {
      this.components.forEach((component) => {
        component.selected = intersects(lh, rh, component.l, component.r)
      })
    } else {
      this.clearFocus();
      this.stopEditing();
    }
  }

  clearFocus() {
    this.components.forEach((component) => {
      component.selected = false;
    })
  }

  stopEditing() {
    this.components.forEach(component => {
      if (component.componentData.type === 'text') {
        if (!component.selected && component.editing) {
          this.keyDetectionSuspended = false
          component.stopEditing()
        }
      }
    })
  }

  detectDoubleTap = debounce(function(element) {
    element.taps = 0
  }, 300);

  setComponentFocus(component) {
    this.components.forEach((element) => {
      if (element === component) {
        if (element.selected) {
          // detect a double tap
          if (element.componentData.type === 'text') {
            element.taps += 1
            this.detectDoubleTap(element)
            if (element.taps === 2) {
              element.taps = 0
              
              element.edit()
              this.keyDetectionSuspended = true
            }
          }          
        } else {
          element.selected = true;
        }
      } else {
        element.selected = false;
        this.stopEditing()
      }
    })

    this.container.removeChild(this.componentBox.getBox())
    this.container.addChild(this.componentBox.getBox())
  }

  onPointerDownComponent(event) {
    this.dragging = true;
    this.dragData = event.data;
    this.initialPosition = this.dragData.getLocalPosition(this.parent, this.initialPosition);
    this.lastPosition = this.dragData.getLocalPosition(this.parent, this.lastPosition);
    if (!this.selected) {
      this.scrimCanvas.setComponentFocus(this);
    }
  }

  onPointerMoveComponent(event) {
    if (this.dragging) {
      const newPosition = this.dragData.getLocalPosition(this.parent, this.newPosition);
      this.scrimCanvas.components.forEach((component) => {
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
        this.scrimCanvas.setComponentFocus(this);
      }
    }
    this.dragData = null;
    this.dragging = false;
  }

  setupKeyPress() {
    document.addEventListener('keyup', (event) => {
      if (this.keyDetectionSuspended) { return }
      if (event.key === ' ') {
        this.components.forEach((component) => {
          if (component.selected) {
            this.duplicate(component, false)
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

  duplicate(component, intelligent) {
    var randomColor = this.randomColor()
    var color = intelligent ? randomColor : component.color

    const graphics = Shape.graphicsFromComponent(component, color)
    
    var newComponent;
    if (graphics !== null) {
      newComponent = this.createComponent(true, graphics.center.x, graphics.center.y, component.componentData, graphics)
      newComponent.color = color
    } else {
      newComponent = this.createComponent(true, component.x, component.y, component.componentData, null, component.textureRef, component.width, component.height);
    }

    this.addComponent(newComponent, false);

    this.container.removeChild(component);
    this.container.addChild(component);

    this.container.removeChild(this.componentBox.getBox());
    this.container.addChild(this.componentBox.getBox())
  }

  updateGraphics(component) {
    const graphics = Shape.graphicsFromComponent(component, component.color)
    if (graphics !== null) {
      const texture = this.app.renderer.generateTexture(graphics, { resolution: window.devicePixelRatio });

      component.texture = texture;
      component.textureRef = texture;
    }
  }

  onPointerDownForeground(event) {
    if (this.scrimCanvas.activeComponent.type === 'shape') {
      this.dragging = true;
      this.dragData = event.data;
      this.initialPosition = this.dragData.getLocalPosition(this.parent, this.initialPosition);
    } else if (this.scrimCanvas.activeComponent.type === 'brush') {
      this.dragging = true;
      this.dragData = event.data;
      const initialPosition = this.dragData.getLocalPosition(this.parent, this.initialPosition);
      this.lastPosition = initialPosition;
      this.scrimCanvas.container.removeChild(this.scrimCanvas.drawBuffer);
      this.scrimCanvas.container.addChild(this.scrimCanvas.drawBuffer);

      this.minX = initialPosition.x;
      this.maxX = initialPosition.x;

      this.minY = initialPosition.y;
      this.maxY = initialPosition.y;
    }
  }

  onPointerMoveForeground(event) {
    if (this.scrimCanvas.activeComponent.type === 'shape') {
      if (this.dragging) {
        const newPosition = this.dragData.getLocalPosition(this.parent, this.newPosition);

        if (!this.drawingGraphics) {
          this.drawingGraphics = new Graphics();
          this.scrimCanvas.container.addChild(this.drawingGraphics);
        }

        Shape.updateGraphics(this.scrimCanvas.activeComponent, this.drawingGraphics, this.scrimCanvas.color, this.initialPosition, newPosition);
      }
    } else if (this.scrimCanvas.activeComponent.type === 'brush') {
      if (this.dragging) {
        const newPosition = this.dragData.getLocalPosition(this.parent, this.newPosition);
        this.minX = Math.min(this.minX, newPosition.x);
        this.maxX = Math.max(this.maxX, newPosition.x);

        this.minY = Math.min(this.minY, newPosition.y);
        this.maxY = Math.max(this.maxY, newPosition.y);

        Brush.drawPointLine(this.scrimCanvas.drawBuffer, this.scrimCanvas.brushTexture, this.lastPosition, newPosition, this.scrimCanvas.activeComponent.options.disappear)
        this.lastPosition = newPosition;
      }
    }
  }

  onPointerUpForeground(event) {
    if (this.scrimCanvas.activeComponent.type === 'shape') {
      this.dragging = false;
      const newPosition = this.dragData.getLocalPosition(this.parent, this.newPosition);

      if (this.drawingGraphics && this.drawingGraphics.shouldCreate) {
        this.drawingGraphics.parent.removeChild(this.drawingGraphics);
        var newComponent = this.scrimCanvas.createComponent(false, this.drawingGraphics.center.x, this.drawingGraphics.center.y, this.scrimCanvas.activeComponent, this.drawingGraphics);
        newComponent.color = this.scrimCanvas.color;
        this.scrimCanvas.addComponent(newComponent);
      }

      this.drawingGraphics = null;
      this.draggingComponent = null;
      this.initialPosition = null;
      this.scrimCanvas.setActiveComponent(null);
    } else if (this.scrimCanvas.activeComponent.type === 'image') {
      const pos = event.data.getLocalPosition(this.parent, new Point());

      var newComponent = this.scrimCanvas.createComponent(false, pos.x, pos.y, this.scrimCanvas.activeComponent);
      this.scrimCanvas.addComponent(newComponent);

      this.scrimCanvas.setActiveComponent(null);
    } else if (this.scrimCanvas.activeComponent.type === 'brush') {
      this.dragging = false;
      const drawTexture = this.scrimCanvas.app.renderer.generateTexture(this.scrimCanvas.drawBuffer, { resolution: window.devicePixelRatio * 2 });

      const x = (this.minX + this.maxX) / 2;
      const y = (this.minY + this.maxY) / 2;

      if (!this.scrimCanvas.activeComponent.options.disappear) {
        while(this.scrimCanvas.drawBuffer.children[0]) { 
          this.scrimCanvas.drawBuffer.removeChild(this.scrimCanvas.drawBuffer.children[0]);
        }

        var newComponent = this.scrimCanvas.createComponent(false, x, y, this.scrimCanvas.activeComponent, null, drawTexture)
        this.scrimCanvas.addComponent(newComponent, false);
      } else {
        this.scrimCanvas.drawBuffer.children.forEach((sprite, i) => {
          if (sprite.disappear) {
            setTimeout(sprite.disappear,1000+((i+1)*0.1));
          }
        })
      }
      this.scrimCanvas.setActiveComponent(this.scrimCanvas.activeComponent);
    } else if (this.scrimCanvas.activeComponent.type === 'text') {
      const pos = event.data.getLocalPosition(this.parent, new Point());
      var newComponent = this.scrimCanvas.createComponent(false, pos.x, pos.y, this.scrimCanvas.activeComponent)
      this.scrimCanvas.addComponent(newComponent, false);

      this.scrimCanvas.setActiveComponent(null);
    }
  }

  onPointerDownBackground(event) {
    this.dragging = true;
    this.dragData = event.data;
    this.initialPosition = this.dragData.getLocalPosition(this.parent, this.initialPosition);

    this.scrimCanvas.container.removeChild(this.scrimCanvas.highlighter);
    this.scrimCanvas.container.addChild(this.scrimCanvas.highlighter);
  }

  onPointerMoveBackground(event) {
    if (this.dragging) {
      const initialCursorPosition = this.initialPosition;
      const currentCursorPosition = this.dragData.getLocalPosition(this.parent, this.newPosition);
      const minX = Math.min(initialCursorPosition.x, currentCursorPosition.x);
      const minY = Math.min(initialCursorPosition.y, currentCursorPosition.y);
      const w = Math.abs(initialCursorPosition.x - currentCursorPosition.x);
      const h = Math.abs(initialCursorPosition.y - currentCursorPosition.y);

      this.scrimCanvas.highlighter
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

      this.scrimCanvas.highlight(l, r)

      this.dragging = false;
      this.scrimCanvas.highlighter.clear();

      this.dragData = null;
      this.initialPosition = null;
    }
  }

  update() {
    this.componentBox.update(this.components);
  }
}