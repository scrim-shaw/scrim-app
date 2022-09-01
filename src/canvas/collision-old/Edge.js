export class Edge {
  
    constructor(p1 = new PIXI.Point(), p2 = new PIXI.Point()) {
      this.p1 = p1;
      this.p2 = p2;
    }
    
    intersects(edge, asSegment = true, point = new PIXI.Point()) {
      
      const a = this.p1;
      const b = this.p2;
      const e = edge.p1;
      const f = edge.p2;
      
      const a1 = b.y - a.y;
      const a2 = f.y - e.y;
      const b1 = a.x - b.x;
      const b2 = e.x - f.x;
      const c1 = (b.x * a.y) - (a.x * b.y);
      const c2 = (f.x * e.y) - (e.x * f.y);
      const denom = (a1 * b2) - (a2 * b1);
      
      if (denom === 0) {
        return null;
      }
         
      point.x = ((b1 * c2) - (b2 * c1)) / denom;
      point.y = ((a2 * c1) - (a1 * c2)) / denom;
  
      if (asSegment) {
        const uc = ((f.y - e.y) * (b.x - a.x) - (f.x - e.x) * (b.y - a.y));
        const ua = (((f.x - e.x) * (a.y - e.y)) - (f.y - e.y) * (a.x - e.x)) / uc;
        const ub = (((b.x - a.x) * (a.y - e.y)) - ((b.y - a.y) * (a.x - e.x))) / uc;
  
        if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
          return point;
        } else {
          return null;
        }
      }
  
      return point;
    }
  }