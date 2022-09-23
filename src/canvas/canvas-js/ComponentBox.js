import { Point, Container, Graphics, Circle } from 'pixi.js';

export class ComponentBox {
    constructor() {
        /*
        p1------------p2
        |             |
        |             |
        |             |
        |             |
        p3------------p4
        */

        // TODO: there is a lot of point specific code here. check to see if it can be made generic

        this.container = new Container();
        this.boxGraphics = new Graphics();

        this.childrenRemoved = true;

        this.p1 = new Graphics();
        this.p2 = new Graphics();
        this.p3 = new Graphics();
        this.p4 = new Graphics();

        this.addAllChildren();

        this.p1
            .on("pointerdown", this.onPointerDownForeground)
            .on("pointermove", this.onPointerMoveForeground)
            .on("pointerup", this.onPointerUpForeground)
            .on("pointerupoutside", this.onPointerUpForeground);

        this.p2
            .on("pointerdown", this.onPointerDownForeground)
            .on("pointermove", this.onPointerMoveForeground)
            .on("pointerup", this.onPointerUpForeground)
            .on("pointerupoutside", this.onPointerUpForeground);

        this.p3
            .on("pointerdown", this.onPointerDownForeground)
            .on("pointermove", this.onPointerMoveForeground)
            .on("pointerup", this.onPointerUpForeground)
            .on("pointerupoutside", this.onPointerUpForeground);

        this.p4
            .on("pointerdown", this.onPointerDownForeground)
            .on("pointermove", this.onPointerMoveForeground)
            .on("pointerup", this.onPointerUpForeground)
            .on("pointerupoutside", this.onPointerUpForeground);

        this.color =  Number("0x" + "3498db")
    }

    addAllChildren() {
        this.childrenRemoved = false

        this.container.addChild(this.boxGraphics);
        this.container.addChild(this.p1)
        this.container.addChild(this.p2)
        this.container.addChild(this.p3)
        this.container.addChild(this.p4)
    }

    removeAllChildren() {
        this.childrenRemoved = true

        this.container.removeChild(this.boxGraphics);
        this.container.removeChild(this.p1)
        this.container.removeChild(this.p2)
        this.container.removeChild(this.p3)
        this.container.removeChild(this.p4)
    }

    getBox() {
        return this.container;
    }

    setupPoints() {
        this.p1
            .clear()
            .lineStyle(2, this.color, 1.0)
            .beginFill(0xFFFFFF)
            .drawCircle(this.dim.minX, this.dim.minY, 6.0)
            .endFill()
    
        var p1Hitarea = new Circle(this.dim.minX, this.dim.minY, 6.0);
        this.p1.hitArea = p1Hitarea
        this.p1.interactive = true;
        this.p1.buttonMode = true;
        this.p1.box = this
        this.p1.point = "p1"

        this.p2
            .clear()
            .lineStyle(2, this.color, 1.0)
            .beginFill(0xFFFFFF)
            .drawCircle(this.dim.maxX, this.dim.minY, 6.0)
            .endFill()

        var p2Hitarea = new Circle(this.dim.maxX, this.dim.minY, 6.0);
        this.p2.hitArea = p2Hitarea
        this.p2.interactive = true;
        this.p2.buttonMode = true;
        this.p2.box = this
        this.p2.point = "p2"
        
        this.p3
            .clear()
            .lineStyle(2, this.color, 1.0)
            .beginFill(0xFFFFFF)
            .drawCircle(this.dim.minX, this.dim.maxY, 6.0)
            .endFill()

        var p3Hitarea = new Circle(this.dim.minX, this.dim.maxY, 6.0);
        this.p3.hitArea = p3Hitarea
        this.p3.interactive = true;
        this.p3.buttonMode = true;
        this.p3.box = this
        this.p3.point = "p3"
        
        this.p4
            .clear()
            .lineStyle(2, this.color, 1.0)
            .beginFill(0xFFFFFF)
            .drawCircle(this.dim.maxX, this.dim.maxY, 6.0)
            .endFill()

        var p4Hitarea = new Circle(this.dim.maxX, this.dim.maxY, 6.0);
        this.p4.hitArea = p4Hitarea
        this.p4.interactive = true;
        this.p4.buttonMode = true;
        this.p4.box = this
        this.p4.point = "p4"
    }

    update(components) {
        this.components = components
        this.boxGraphics
        .clear()
        .lineStyle(1, this.color, 1.0)

        var minX = Number.MAX_VALUE; var minY = Number.MAX_VALUE; var maxX = Number.MIN_VALUE; var maxY = Number.MIN_VALUE;

        var shouldDraw = false;
        for (let i = 0; i < components.length; i++) {
            const component = components[i];
            if (component.selected) {
                shouldDraw = true;

                const x = component.x - (component.width * 0.5)
                const y = component.y - (component.height * 0.5)

                const x2 = component.x + (component.width * 0.5)
                const y2 = component.y + (component.height * 0.5)

                minX = Math.min(minX, x)
                minY = Math.min(minY, y)

                maxX = Math.max(maxX, x2)
                maxY = Math.max(maxY, y2)

                // add a box to each individual component
                if (shouldDraw) {
                    this.boxGraphics.drawRect(component.x - (component.width * 0.5), component.y - (component.height * 0.5), component.width, component.height);
                }
            }
        }

        this.dim = {
            minX: minX,
            minY: minY,
            maxX: maxX,
            maxY: maxY
        }

        if (shouldDraw) {
            this.addAllChildren();
            this.setupPoints();

            this.boxGraphics
                .lineStyle(2, this.color, 1.0)
                .drawRect(minX, minY, maxX-minX, maxY-minY)
        } else {
            if (!this.childrenRemoved) {
                this.removeAllChildren();
            }
        }
    }

    onPointerDownForeground(event) {
        this.dragging = true;
        this.dragData = event.data;
        this.latestPosition = this.dragData.getLocalPosition(this.parent, this.initialPosition);
        this.boxDim = this.box.dim
        this.box.startResizing();
    }

    onPointerMoveForeground(event) {
        if (this.dragging) {
            const newPosition = this.dragData.getLocalPosition(this.parent, this.newPosition);
            const scaledDim = this.box.getScaledDim(this.point, this.boxDim, newPosition)

            const scale = this.box.findScale(this.boxDim, scaledDim)
            this.box.resize(this.point, this.boxDim, scale.scaleX, scale.scaleY)

            this.latestPosition = newPosition;
        }
    }

    onPointerUpForeground() {
        this.dragging = false;
        this.box.finishResizing();
    }

    findScale(initialDim, scaledDim) {
        const scaleX = (scaledDim.maxX - scaledDim.minX) / (initialDim.maxX - initialDim.minX)
        const scaleY = (scaledDim.maxY - scaledDim.minY) / (initialDim.maxY - initialDim.minY)

        return {scaleX: scaleX, scaleY: scaleY}
    }

    startResizing() {
        for (let i = 0; i < this.components.length; i++) {
            var component = this.components[i];
            if (component.selected) {
                component.startingDim = {
                    x: component.x,
                    y: component.y,
                    width: component.width,
                    height: component.height
                }
            }
        }
    }

    resize(point, boxDim, scaleX, scaleY) {
        for (let i = 0; i < this.components.length; i++) {
            var component = this.components[i];
            if (component.selected) {
                var updateX = () => {};
                var updateY = () => {};
                var updateWidth = () => {
                    const newWidth = component.startingDim.width * scaleX;
                    component.width = newWidth
                }
                var updateHeight = () => {
                    const newHeight = component.startingDim.height * scaleY;
                    component.height = newHeight
                }

                if (point === 'p1') {
                    updateX = () => {
                        const dx = (boxDim.maxX - component.startingDim.x) * scaleX
                        component.x = boxDim.maxX - dx
                    }
                    updateY = () => {
                        const dy = (boxDim.maxY - component.startingDim.y) * scaleY
                        component.y = boxDim.maxY - dy
                    }
                } else if (point == 'p2') {
                    updateX = () => {
                        const dx = (component.startingDim.x - boxDim.minX) * scaleX
                        component.x = boxDim.minX + dx
                    }
                    updateY = () => {
                        const dy = (boxDim.maxY - component.startingDim.y) * scaleY
                        component.y = boxDim.maxY - dy
                    }

                } else if (point === 'p3') {
                    updateX = () => {
                        const dx = (boxDim.maxX - component.startingDim.x) * scaleX
                        component.x = boxDim.maxX - dx
                    }
                    updateY = () => {
                        const dy = (component.startingDim.y - boxDim.minY) * scaleY
                        component.y = boxDim.minY + dy
                    }
                } else if (point === 'p4') {
                    updateX = () => {
                        const dx = (component.startingDim.x - boxDim.minX) * scaleX
                        component.x = boxDim.minX + dx
                    }

                    updateY = () => {
                        const dy = (component.startingDim.y - boxDim.minY) * scaleY
                        component.y = boxDim.minY + dy
                    }
                }

                // TODO: this shouldn't be based on scale but the resulting width
                if (scaleX > 0.01) {
                    updateX();
                    updateWidth();
                    component.l = new Point(component.x-(component.width/2), component.y-(component.height/2))
                }
                if (scaleY > 0.01) {
                    updateY();
                    updateHeight();
                    component.r = new Point(component.x+(component.width/2), component.y+(component.height/2))
                }

                if ((scaleX*10) % 0.5 == 0 || (scaleY*10) % 0.5 == 0) {
                    this.canvas.updateGraphics(component)
                }
            }
        }
    }

    finishResizing() {
        for (let i = 0; i < this.components.length; i++) {
            var component = this.components[i];
            if (component.startingDim) {
                this.canvas.updateGraphics(component)
                delete component.startingDim
            }
        }
    }

    getScaledDim(point, boxDim, newPosition) {
        switch (point) {
            case "p1":
                return ({
                    minX: newPosition.x,
                    minY: newPosition.y,
                    maxX: boxDim.maxX,
                    maxY: boxDim.maxY
                })
            case "p2":
                return ({
                    minX: boxDim.minX,
                    minY: newPosition.y,
                    maxX: newPosition.x,
                    maxY: boxDim.maxY
                })
            case "p3":
                return ({
                    minX: newPosition.x,
                    minY: boxDim.minY,
                    maxX: boxDim.maxX,
                    maxY: newPosition.y
                })
            case "p4":
                return ({
                    minX: boxDim.minX,
                    minY: boxDim.minY,
                    maxX: newPosition.x,
                    maxY: newPosition.y
                })
        }
    }
}

