import { Point, Container, Graphics, Circle } from 'pixi.js';

export class ComponentBox {
    constructor(resizeCallback) {
        /*
        p1------------p2
        |             |
        |             |
        |             |
        |             |
        p3------------p4
        */

        this.container = new Container();
        this.boxGraphics = new Graphics();

        this.childrenRemoved = true;

        this.p1 = new Graphics();
        this.p2 = new Graphics();
        this.p3 = new Graphics();
        this.p4 = new Graphics();

        this.addAllChildren();

        this.p4
            .on("pointerdown", this.onPointerDownForeground)
            .on("pointermove", this.onPointerMoveForeground)
            .on("pointerup", this.onPointerUpForeground)
            .on("pointerupoutside", this.onPointerUpForeground);

        this.p4.resizeCallback = resizeCallback;

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

    update(components) {
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
                //this.componentBox.drawRect(component.x - (component.width * 0.5), component.y - (component.height * 0.5), component.width, component.height);
            }
        }

        if (shouldDraw) {
            this.addAllChildren();
            this.p1
                .clear()
                .lineStyle(2, this.color, 1.0)
                .beginFill(0xFFFFFF)
                // .beginFill(this.color)
                // .drawRect(minX-6, minY-6, 12, 12)
                .drawCircle(minX, minY, 6.0)
                .endFill()

            this.p2
                .clear()
                .lineStyle(2, this.color, 1.0)
                .beginFill(0xFFFFFF)
                // .beginFill(this.color)
                // .drawRect(minX-6, minY-6, 12, 12)
                .drawCircle(maxX, minY, 6.0)
                .endFill()
            
            this.p3
                .clear()
                .lineStyle(2, this.color, 1.0)
                .beginFill(0xFFFFFF)
                // .beginFill(this.color)
                // .drawRect(minX-6, minY-6, 12, 12)
                .drawCircle(minX, maxY, 6.0)
                .endFill()
            
            this.p4
                .clear()
                .lineStyle(2, this.color, 1.0)
                .beginFill(0xFFFFFF)
                // .beginFill(this.color)
                // .drawRect(minX-6, minY-6, 12, 12)
                .drawCircle(maxX, maxY, 6.0)
                .endFill()

            var hitarea = new Circle(maxX, maxY, 6.0);
            this.p4.hitArea = hitarea
            this.p4.interactive = true;
            this.p4.buttonMode = true;

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
    }

    onPointerMoveForeground(event) {
        if (this.dragging) {
            const newPosition = this.dragData.getLocalPosition(this.parent, this.newPosition);
            const dx = newPosition.x - this.latestPosition.x
            const dy = newPosition.y - this.latestPosition.y

            this.latestPosition = newPosition;

            this.resizeCallback(dx, dy)
        }
    }

    onPointerUpForeground() {
        this.dragging = false;
    }
}

