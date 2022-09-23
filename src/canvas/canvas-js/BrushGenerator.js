
import { Filter, Sprite, RenderTexture } from 'pixi.js'
import { BLEND_MODES } from 'pixi.js';

const fragment = `
uniform float size;
uniform float erase;
uniform vec3 color;
uniform float smoothing;
void main(){
	vec2 uv = vec2(gl_FragCoord.xy) / size;
	float dst = distance(uv, vec2(0.5, 0.5)) * 2.;
	float alpha = max(0., 1. - dst);
	alpha = pow(alpha, smoothing);
	if(erase == 0.)
		gl_FragColor = vec4(color, 1) * alpha;
	else
		gl_FragColor = vec4(alpha);
}
`;

const brushSize = 8.0

export class BrushGenerator {
    constructor(renderer) {
        this.renderer = renderer;

        this.filter = new Filter(null, fragment, {
            color: [1, 1, 1],
            size: brushSize,
            erase: 0,
            smoothing: 0.5
        });
    }

    get(color, smoothing, isEraser) {
        this.filter.uniforms.size = brushSize;
        this.filter.uniforms.color = this.hexToArray(color);
        this.filter.uniforms.erase = +isEraser;
        this.filter.uniforms.smoothing = smoothing;

        const texture = RenderTexture.create({ width: brushSize, height: brushSize });
        texture.baseTexture.premultipliedAlpha = true;
        const sprite = new Sprite();
        sprite.width = brushSize;
        sprite.height = brushSize;

        sprite.filters = [this.filter];

        this.renderer.render(sprite, {renderTexture: texture});

        return texture;
    }

    hexToArray(color) {
        const r = color >> 16;
        const g = (color & 0x00ffff) >> 8;
        const b = color & 0x0000ff;

        return [r / 255, g / 255, b / 255];
    }
}

export class Brush {
    static drawPoint(drawBuffer, brushTexture, x, y, disappear) {
        const sprite = new Sprite();
		sprite.anchor.set(0.5);
        sprite.x = x;
        sprite.y = y;
        sprite.texture = brushTexture;

        if (disappear) {
            sprite.disappear = function(){
                if (sprite.parent) {
                    sprite.parent.removeChild(sprite);
                }
            };
        }

        if (false/*guiParams.useEraser*/) {
            // sprite.filter = new PIXI.filters.AlphaFilter();
            // sprite.blendMode = BLEND_MODES.ERASE;
        } else {
            sprite.blendMode = BLEND_MODES.NORMAL;
        }

        drawBuffer.addChild(sprite);
    }

    static drawPointLine(drawBuffer, brushTexture, oldPos, newPos, disappear=false) {
        const delta = {
            x: oldPos.x - newPos.x,
            y: oldPos.y - newPos.y,
        };
        const deltaLength = Math.sqrt(delta.x ** 2 + delta.y ** 2);

        Brush.drawPoint(drawBuffer, brushTexture, newPos.x, newPos.y, disappear);

        if (deltaLength >= brushSize / (brushSize*2)) {
            const additionalPoints = Math.ceil(deltaLength / (brushSize / (brushSize*2)));

            for (let i = 1; i < additionalPoints; i++) {
                const pos = {
                    x: newPos.x + delta.x * (i / additionalPoints),
                    y: newPos.y + delta.y * (i / additionalPoints),
                };

                Brush.drawPoint(drawBuffer, brushTexture, pos.x, pos.y, disappear);
            }
        }
    }
}