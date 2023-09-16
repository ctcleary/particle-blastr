window.util = {
  roundRand: function(maxNum) {
    return Math.round(Math.random() * maxNum);
  },

  clamp: function(num, min, max) {
    return Math.min(Math.max(num, min), max);
  },

  isDef: function(toCheck) {
    return typeof toCheck !== 'undefined';
  },

  randomItem(arrOrStr) {
    return arrOrStr[ Math.round( Math.random() * (arrOrStr.length-1) )];
  }
}






class Particle {
  startX = 0;
  startY = 0;

  dist = 1000;

  endX = 100;
  endY = 100;

  width = 10;
  height = 10;
  borderRadius = 50;

  fillColor = 'rgb(255, 0, 255)';
  opacity = 1;

  shape = ParticleBlastr.SHAPE.CIRCLE;

  upwardThrustFactor;

  // background = '#000000';

  constructor(cfg) {
    this.x = cfg.x;
    this.y = cfg.y;

    this.startX = this.x;
    this.startY = this.y;

    this.gravity    = cfg.gravity;
    this.opacity    = cfg.opacity || 1;
    this.endOpacity = cfg.endOpacity || 0;


    this.dist = cfg.dist;
    this.resetDist();
    this.upwardThrustFactor = this.determineUpwardThrust();
    console.log("this.upwardThrustFactor ::", this.upwardThrustFactor);

    this.shape = cfg.shape;

    this.width  = cfg.width;
    this.height = cfg.height;
    this.borderRadius = cfg.borderRadius;
    this.radius = cfg.radius;

    this.fillColor = cfg.fillColor;

    this.allowNegY = cfg.allowNegY;

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

  determineUpwardThrust() {
    let upwardThrust;
    let upwardThrustFactor;

    upwardThrust = this.distY - this.startY;
    upwardThrustFactor = this.distY / this.dist;

    upwardThrustFactor = util.clamp(upwardThrustFactor, 0.45, 0.65); // clamp max upwardThrustFactor variance

    return upwardThrustFactor;
  }

  prepForAnimate(x, y) {
    this.startX = x;
    this.startY = y;
    this.x = x;
    this.y = y;
  }

  animate(ctx, lifetimeFactor) {
    console.log("animate!");
    // let lifetimeFactorInverse = 1 - lifetimeFactor; // lifetimeFactorInverse 1 approaches 0

    this.x = this.x + (this.distX / this.liveTime);
    this.y = this.y - (this.distY / this.liveTime);

    //Gravity
    // // TODO, factor in upward Y speed of particle
    // this.y += this.gravity * lifetimeFactor; // lifetimeFactor 0 Approaches 1
    let currGravityEffect = this.gravity * lifetimeFactor; // lifetimeFactor 0 Approaches 1
    currGravityEffect     = currGravityEffect * (this.upwardThrustFactor * lifetimeFactor);
    this.y += currGravityEffect

    // Opacity
    // // TODO, currently LINEAR, figure out how to make this a cubic-bezier or ease-out or whatever
    const currOpacity = this.opacity - ((this.opacity - this.endOpacity) * lifetimeFactor);
    

    // Set Color/Opacity
    const rgb = this.fillColor;
    ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${currOpacity})`;

    if (this.shape == ParticleBlastr.SHAPE.ROUND_RECT) {
      ctx.beginPath();
      ctx.roundRect(this.x, this.y, this.width, this.height, this.borderRadius);
      ctx.fill();
    } else if (this.shape == ParticleBlastr.SHAPE.CIRCLE) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      ctx.fillRect(this.x, this.y, this.width, this.height);  
    }
  }

  resetDist() {
    this.distX = util.roundRand(this.dist);
    this.distY = util.roundRand(this.dist);

    const isNeg = Math.random() > 0.5;
    if (isNeg) this.distX = this.distX * -1;

    if (util.isDef(this.allowNegY) && this.allowNegY) {
      const isYNeg = Math.random() > 0.5;
      if (isYNeg) this.distY = this.distY * -1;
    }

    const distXY = this.clampToCircle(this.x, this.y, this.distX, this.distY);

    this.distX = distXY.x;
    this.distY = distXY.y;
  }
}









class ParticleBlastr {
  canvas;
  ctx;

  prts = []; //Array of <Particle> objects
  numPrts = 100;

  originX = 0;
  originY = 0;

  blastLengthMs = 1500;
  gravity = 2;


  fillColor = 'pink'; // Pink for debug.
  fillColors = [];

  pWidth = 20;
  pHeight = 20;
  pSize = 20;
  pBorderRadius = 50;

  pShape = ParticleBlastr.CIRCLE;
  pDimensions = {
    width: 10,
    height: 10,
    borderRadius: 25,
    radius: 5
  }

  pRadius = 5

  pOpacity = 1;
  pEndOpacity = 0;

  done = false;
  #isLooping = false;

  // TODO implement
  static SHAPE = {
    SQUARE: 'square', // e.g. for faux "pixel-bursts"
    RECT: 'rect',
    ROUND_RECT: 'roundRect',
    CIRCLE: 'circle',
  };

  constructor(cfg = {}) {
    this.canvas = cfg && cfg.canvas ? cfg.canvas : document.createElement('canvas');
    this.ctx    = this.canvas.getContext('2d');

    //
    // console.log("this.ctx ::", this.ctx);
    this.ctx.fillStyle = `#ff0000`;
    this.ctx.fillRect(200, 200, 15, 15);
    this.ctx.fillText('Canvas context is functional.', 223, 214)
    //

    if (cfg.shape) this.pShape = cfg.shape;

    console.log("this.pShape ::", this.pShape);
    switch (this.pShape) {
      case ParticleBlastr.SHAPE.RECT:
        this.pDimensions.width  = cfg.particleWidth;
        this.pDimensions.height = cfg.particleHeight;
        break;
      case ParticleBlastr.SHAPE.ROUND_RECT:
        this.pDimensions.width  = cfg.particleWidth;
        this.pDimensions.height = cfg.particleHeight;
        this.pDimensions.borderRadius = cfg.particleBorderRadius;
        break;
      case ParticleBlastr.SHAPE.SQUARE:
        this.pDimensions.width  = cfg.particleSize;
        this.pDimensions.height = cfg.particleSize;
        break;
      case ParticleBlastr.SHAPE.CIRCLE:
        this.pDimensions.radius = cfg.particleRadius;
        break;
      default:
        console.warn('Bad config for ParticleBlastr. {shape} required.');
        break;
    }


    if (cfg.particleCount) this.numPrts   = cfg.particleCount;
    // if (cfg.particleCount) this.numPrts   = 10;

    if (cfg.particleColor) {
      this.fillColor = cfg.particleColor;
      this.fillColors = null;
    } else if (cfg.particleColors) {
      this.fillColors = cfg.particleColors;
      this.fillColor = null;
    }

    this.pOpacity    = cfg.particleOpacity || 1;
    this.pEndOpacity = cfg.particleEndOpacity || 0;
    console.log("this.pEndOpacity ::", this.pEndOpacity);

    if (cfg.particleMaxDistance)    this.pMaxDist = cfg.particleMaxDistance;

    if (util.isDef(cfg.particleBorderRadius)) this.pBorderRadius = cfg.particleBorderRadius; 

    if (util.isDef(cfg.gravity))   this.pGravity   = cfg.gravity;
    if (util.isDef(cfg.allowNegY)) this.allowNegY = cfg.allowNegY;


    if (cfg.blastLengthMs) this.blastLengthMs = cfg.blastLengthMs;

    this.generatePrts();
  }

  generatePrts() {
    let pCfg = {
        x: 0,
        y: 0,

        opacity:         this.pOpacity,
        endOpacity:      this.pEndOpacity,

        blastLengthMs: this.blastLengthMs,

        allowNegY: this.allowNegY, 
    };


    for (let i = 0; i < this.numPrts; i++) {
      // TODO add sizeVariance option
        // TODO add size variance option
        // min w/h is 1/2 of max
        // width:  util.clamp( util.roundRand(this.pWidth),  this.pWidth/2,  this.pWidth ), 
        // height: util.clamp( util.roundRand(this.pHeight), this.pHeight/2, this.pHeight ),
      pCfg.shape = this.pShape;

      if (this.pShape == ParticleBlastr.SHAPE.CIRCLE) {
        console.log("this.pDimensions.radius ::", this.pDimensions.radius);
        pCfg.radius = this.pDimensions.radius;
      } else if (this.pShape == ParticleBlastr.SHAPE.ROUND_RECT) {
        pCfg.width  = this.pDimensions.width;
        pCfg.height = this.pDimensions.height;
        pCfg.borderRadius = this.pDimensions.borderRadius;
      } else {
        pCfg.width  = this.pDimensions.width;
        pCfg.height = this.pDimensions.height;
      }

      // Randomized values:
        // TODO improve clamping so there isn't a visible "ring" of particles at the min clamp dist
        // dist: util.clamp( this.pMaxDist * Math.random(), this.pMaxDist/2, this.pMaxDist),
      pCfg.dist      = util.clamp( Math.random() * this.pMaxDist, this.pMaxDist/2, this.pMaxDist);
      pCfg.gravity   = util.clamp( Math.random() * this.pGravity, this.pGravity/2, this.pGravity);
      pCfg.fillColor = !this.fillColors.length > 0 ? this.fillColor : util.randomItem(this.fillColors);

      if (this.pGravityVariance) {
        pCfg.gravity = util.clamp( Math.random() * this.pGravity, this.pGravity/2, this.pGravity );
      } else {
        pCfg.gravity = this.pGravity;
      }

      const p = new Particle(pCfg);
      this.prts.push(p);
    }
  }

  startBlast(centerX, centerY) {
    console.log("start blast!", centerX, centerY);
    this.originX = centerX;
    this.originY = centerY;

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
      p.prepForAnimate(this.originX, this.originY)
      p.resetDist();
    })
  }

  handleFrame() {
    const timeSinceStart = performance.now() - this.startTime;
    const lifetimeFactor = (timeSinceStart / this.blastLengthMs);
    const overtime = timeSinceStart >= this.blastLengthMs;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    this.prts.forEach((p) => {
      p.animate(this.ctx, lifetimeFactor);
    });

    // Kill loop if done.
    if (overtime) {
      console.log("overtime!");
      this.reset();
    } else {
      requestAnimationFrame(() => { this.handleFrame() });
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

    this.ctx.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
  }
}