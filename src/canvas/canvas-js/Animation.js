import { ThreeSixty } from "@mui/icons-material";


export class Animation {
    constructor() {
        this.frames = []
        this.activeFrame = 0;
        this.sign = 1;
    }

    playNextFrame(component) {
        const frame = this.frames[this.activeFrame];
        component.x = frame.x;
        component.y = frame.y;

        if (this.activeFrame >= this.frames.length-1) {
            // loop the animation
            this.sign = -1;
        } else if (this.activeFrame <= 0) {
            this.sign = 1
        }
        this.activeFrame = this.activeFrame + (1*this.sign);
    }

    addFrame(x, y) {
        this.frames.push({x: x, y: y})
    }
}