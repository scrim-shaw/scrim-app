import { Point } from "pixi.js";

export class Shape {
    static updateGraphics(component, graphics, color, initialCursorPosition, currentCursorPosition) {
        graphics.clear();

        switch (component.name) {
            case 'Rectangle':
                this.getRectangleGraphics(graphics, color, initialCursorPosition, currentCursorPosition);
                break;
            case 'Ellipse':
                this.getEllipseGraphics(graphics, color, initialCursorPosition, currentCursorPosition);
                break;
            case 'Arrow':
                this.getArrowGraphics(graphics, 0x2c3e50, initialCursorPosition, currentCursorPosition)
        }
    }

    static getRectangleGraphics(graphics, color, initialCursorPosition, currentCursorPosition) {
        const dist = distance(currentCursorPosition, initialCursorPosition);
        graphics.shouldCreate = dist > 5.0

        const minX = Math.min(initialCursorPosition.x, currentCursorPosition.x);
        const minY = Math.min(initialCursorPosition.y, currentCursorPosition.y);
        const w = Math.abs(initialCursorPosition.x - currentCursorPosition.x);
        const h = Math.abs(initialCursorPosition.y - currentCursorPosition.y);
        const center = new Point(minX + w / 2, minY + h / 2);

        const cornerRadius = 6.0;

        graphics.center = center;

        if (graphics.shouldCreate) {
            graphics
                .beginFill(color)
                .lineStyle(1, 0x2c3e50, 0.0)
                .drawRoundedRect(minX, minY, w, h, cornerRadius)
                .endFill()

            graphics.shouldCreate = true;
        }
    }

    static getEllipseGraphics(graphics, color, initialCursorPosition, currentCursorPosition) {
        const dist = distance(currentCursorPosition, initialCursorPosition);
        graphics.shouldCreate = dist > 5.0

        const minX = Math.min(initialCursorPosition.x, currentCursorPosition.x);
        const minY = Math.min(initialCursorPosition.y, currentCursorPosition.y);
        const w = Math.abs(initialCursorPosition.x - currentCursorPosition.x);
        const h = Math.abs(initialCursorPosition.y - currentCursorPosition.y);
        const center = new Point(minX + w / 2, minY + h / 2);

        graphics.center = center;

        if (graphics.shouldCreate) {
            graphics
                .beginFill(color)
                .lineStyle(1, 0x2c3e50, 0.0)
                .drawEllipse(center.x, center.y, w / 2, h / 2)
                .endFill()

            graphics.shouldCreate = true;
        }
    }

    static getArrowGraphics(graphics, color, initialCursorPosition, currentCursorPosition) {
        const dist = distance(currentCursorPosition, initialCursorPosition);
        graphics.shouldCreate = dist > 5.0

        const minX = Math.min(initialCursorPosition.x, currentCursorPosition.x);
        const minY = Math.min(initialCursorPosition.y, currentCursorPosition.y);
        const w = Math.abs(initialCursorPosition.x - currentCursorPosition.x);
        const h = Math.abs(initialCursorPosition.y - currentCursorPosition.y);
        const center = new Point(minX + w / 2, minY + h / 2);

        const theta = Math.atan((currentCursorPosition.x - initialCursorPosition.x) / (currentCursorPosition.y - initialCursorPosition.y))
        const l = 20.0
        const angle = 60

        // arrow ends calculations
        const theta2 = angle * (Math.PI / 180)
        const theta3 = Math.PI - (Math.PI / 2) - theta2 - theta

        const dx1 = l * Math.sin(theta3)
        const dy1 = l * Math.cos(theta3)

        const theta4 = angle * -1 * (Math.PI / 180)
        const theta5 = Math.PI - (Math.PI / 2) - theta4 - theta

        const dx2 = l * Math.sin(theta5)
        const dy2 = l * Math.cos(theta5)

        var arrowEnd1: Point;
        if (currentCursorPosition.y >= initialCursorPosition.y) {
            arrowEnd1 = new Point(currentCursorPosition.x + dx1 , currentCursorPosition.y - dy1)
        } else {
            arrowEnd1 = new Point(currentCursorPosition.x - dx1 , currentCursorPosition.y + dy1)
        }

        var arrowEnd2: Point;
        if (currentCursorPosition.y >= initialCursorPosition.y) {
            arrowEnd2 = new Point(currentCursorPosition.x - dx2 , currentCursorPosition.y + dy2)
        } else {
            arrowEnd2 = new Point(currentCursorPosition.x + dx2 , currentCursorPosition.y - dy2)
        }

        graphics.center = center

        if (graphics.shouldCreate) {
            graphics
                .lineStyle(4, color, 1.0)
                .moveTo(initialCursorPosition.x, initialCursorPosition.y)
                .drawCircle(initialCursorPosition.x, initialCursorPosition.y, 2)
                .lineTo(currentCursorPosition.x, currentCursorPosition.y)
                .lineTo(arrowEnd1.x, arrowEnd1.y)
                .moveTo(currentCursorPosition.x, currentCursorPosition.y)
                .lineTo(arrowEnd2.x, arrowEnd2.y)
        }
    }
}

export function distance(a, b) {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

export function intersects(l1, r1, l2, r2 ) {
    const aLeftOfB = r1.x < l2.x;
    const aRightOfB = l1.x > r2.x;
    const aAboveB = l1.y > r2.y;
    const aBelowB = r1.y < l2.y;

    return !( aLeftOfB || aRightOfB || aAboveB || aBelowB );
}