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
        }
    }

    static getRectangleGraphics(graphics, color, initialCursorPosition, currentCursorPosition) {
        const dist = distance(currentCursorPosition, initialCursorPosition);
        graphics.shouldCreate = dist > 5.0

        const minX = Math.min(initialCursorPosition.x, currentCursorPosition.x);
        const minY = Math.min(initialCursorPosition.y, currentCursorPosition.y);
        const w = Math.abs(initialCursorPosition.x - currentCursorPosition.x);
        const h = Math.abs(initialCursorPosition.y - currentCursorPosition.y);
        const cornerRadius = 6.0;

        graphics.center = new Point(minX + w / 2, minY + h / 2);

        if (graphics.shouldCreate) {
            graphics
                .beginFill(color)
                .lineStyle(1, 0x2c3e50, 1.0)
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
                .lineStyle(1, 0x2c3e50, 1.0)
                .drawEllipse(center.x, center.y, w / 2, h / 2)
                .endFill()

            graphics.shouldCreate = true;
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