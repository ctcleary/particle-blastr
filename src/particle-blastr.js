class UUID {
  static makeUuid() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  }
}

function roundRand(maxNum) {
  return Math.round(Math.random() * maxNum);
}

function clamp(num, min, max) {
  return Math.min(Math.max(num, min), max);
}

class Particle {
  el;
  elId;

  startX = 0;
  startY = 0;

  endX = 100;
  endY = 100;

  width = 10;
  height = 10;

  fillColor = 'rgba(255, 0, 255, 1)';

  background = '#000000';

  constructor(cfg) {
    this.elId = cfg.elId || 0;

    this.x = cfg.x;
    this.y = cfg.y;

    this.dist = cfg.dist;

    this.resetDist();

    this.gravity = cfg.gravity;

    this.width = cfg.width;
    this.height = cfg.height;

    this.fillColor = cfg.fillColor;

    this.liveTime = cfg.blastLengthMs;
  }

  // Note: I barely understand this circle clamping math.
  clampToCircle(originX, originY, distX, distY) {
    let destXY = {
      x: originX + distX,
      y: originY + distY
    }

    function getAngle(dx, dy) {
      return (Math.atan2(dy, -dx) * 180 / Math.PI + 360) % 360;
    }

    const angle = getAngle(distX, distY);

    const maxX = Math.abs(this.dist * Math.cos(angle / 180 * Math.PI));
    const maxY = Math.abs(this.dist * Math.sin(angle / 180 * Math.PI));

    destXY.x = Math.min(Math.max(-maxX, destXY.x), maxX);
    destXY.y = Math.min(Math.max(-maxY, destXY.y), maxY);

    return destXY;
  }

  animate(ctx, gravity) {
    this.x = this.x + (this.distX / this.liveTime);
    this.y = this.y - (this.distY / this.liveTime);

    // this.y += gravFactor * this.gravity;
    this.y += gravity;
    // this.opacity = 1 * (this.dist / this.liveTime);

    ctx.fillStyle = this.fillColor;
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.width, this.height, 50);
    ctx.fill();
  }

  resetDist() {
    this.distX = roundRand(this.dist);
    this.distY = roundRand(this.dist);

    const isNeg = Math.random() > 0.5;
    if (isNeg) this.distX = this.distX * -1;

    const distXY = this.clampToCircle(this.x, this.y, this.distX, this.distY);

    this.distX = distXY.x;
    this.distY = distXY.y;
  }
}









class ParticleBlastr {
  cvs;
  ctx;

  prts = []; //Array of Particle objects
  numPrts = 100;

  originX = 0;
  originY = 0;

  // blastLengthMs = 1850;
  blastLengthMs = 1500;
  gravity = 2;

  fillColor = 'pink'; // Pink for debug.

  done = false;
  #isLooping = false;

  constructor(cfg = {}) {
    this.cvs = cfg && cfg.cvs ? cfg.cvs : document.createElement('canvas');
    this.ctx = this.cvs.getContext('2d');

    if (cfg.numPrts)       this.numPrts   = cfg.numPrts;
    if (cfg.particleColor) this.fillColor = cfg.particleColor;

    if (cfg.prtMaxWidth)   this.prtMaxWidth  = cfg.prtMaxWidth;
    if (cfg.prtMaxHeight)  this.prtMaxHeight = cfg.prtMaxHeight

    if (cfg.prtMaxDist)    this.prtMaxDist = cfg.prtMaxDist;
    if (cfg.gravity)       this.gravity    = cfg.gravity;   

    if (cfg.blastLengthMs) this.blastLengthMs = cfg.blastLengthMs; 

    // const halfW = this.cvs.innerWidth / 2;
    // const halfH = this.cvs.innerHeight / 2;

    this.generatePrts();
  }

  roundRand(maxNum) {
    return Math.round(Math.random() * maxNum);
  }

  generatePrts() {
    for (let i = 0; i < this.numPrts; i++) {
      let isNeg;
      const p = new Particle({
        x: 0, // May not be needed, set to clickLocation for now 
        y: 0,

        dist: roundRand(this.prtMaxDist),

        // gravity: clamp( roundRand(this.gravity), this.gravity/3, this.gravity ),
        gravity: roundRand(this.gravity),

        // min w/h is 1/2 of max
        width:  clamp( roundRand(this.prtMaxWidth), this.prtMaxWidth/2, this.prtMaxWidth ), 
        height: clamp( roundRand(this.prtMaxHeight), this.prtMaxHeight/2, this.prtMaxHeight ),

        fillColor:     this.fillColor,
        blastLengthMs: this.blastLengthMs
      });

      isNeg = Math.random() > 0.5;
      p.distX = !!isNeg ? p.distX * -1 : p.distX;
      // don't randomize pos/neg of distY, gravity will be responsible for -Y


      this.prts.push(p);
    }
  }

  startBlast(centerX, centerY) {
    // console.log("start blast!", centerX, centerY);
    this.originX = centerX;
    this.originY = centerY;
    
    this.ctx.fillStyle = 'red';
    this.ctx.fillRect(centerX, centerY, 10, 10);

    this.done = false;
    this.startTime = performance.now();
    this.prepForLoop();
    if (!this.#isLooping) {
      this.#isLooping = true;
      this.handleFrame();
    }
  }

  prepForLoop() {
    this.prts.forEach((p) => {
      p.x = this.originX;
      p.y = this.originY;

      p.resetDist();
    })
  }

  handleFrame() {
    const timeSinceStart = performance.now() - this.startTime;
    const overtime = timeSinceStart >= this.blastLengthMs;

    this.ctx.clearRect(0, 0, this.cvs.width, this.cvs.height)

    // this.ctx.fillStyle = "rgba(0,0,0,0.05)";
    // this.ctx.fillRect(0, 0, this.cvs.clientWidth, this.cvs.clientHeight);
    
    let gravFactor = (timeSinceStart / this.blastLengthMs) * (timeSinceStart / this.blastLengthMs);
    let gravity = gravFactor * this.gravity;

    let alphaFactor = 1 - (timeSinceStart / this.blastLengthMs);
    this.ctx.globalAlpha = alphaFactor;

    // let opacity = (timeSinceStart / this.blastLengthMs) * 1;

    this.prts.forEach((p) => p.animate(this.ctx, gravity));

    // Kill loop if done.
    if (overtime) {
      this.reset();
    } else {
      requestAnimationFrame(() => { this.handleFrame() });
    }
  }

  clampDistance(distX, distY, x, y) {
    const dist = this.distance(distX, distY, x, y);
    if (dist <= this.cvs.width / 2) {
      return [distX, distY]
    } else {
      return [0, 0];
    }
  }
  
  distance(distX, distY, x, y) {
    const x1 = distX;
    const y1 = distY;
    const x2 = x;
    const y2 = y;
    // const dist = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
    const dist = Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2);

    return dist;
  }

  reset() {
    this.done = true;
    this.#isLooping = false;

    this.ctx.clearRect(0, 0, this.cvs.clientWidth, this.cvs.clientHeight);
    // this.ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    // this.ctx.fillRect(0, 0, this.cvs.clientWidth, this.cvs.clientHeight);
  }
}