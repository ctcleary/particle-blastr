class Particle {
  startX = 0;
  startY = 0;

  dist = 1000;

  endX = 100;
  endY = 100;

  width = 10;
  height = 10;
  borderRadius = 50;

  fillColor = [255,  0, 255]; // Pink for debug
  img = null;
  opacity = 1;

  shape = ParticleBlastr.SHAPE.CIRCLE;

  upwardThrustFactor;

  constructor(cfg) {
    this.x = cfg.x;
    this.y = cfg.y;

    this.startX = this.x;
    this.startY = this.y;

    this.gravity    = cfg.gravity || 0;
    this.opacity    = cfg.opacity || 1;
    this.endOpacity = cfg.endOpacity || 0;


    this.dist = cfg.dist;
    this.resetDist();
    this.upwardThrustFactor = this.determineUpwardThrustFactor();

    if (cfg.img) {
      this.img = cfg.img;
    } else {
      //todo
    }

    this.shape = cfg.shape;  // Required

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

  determineUpwardThrustFactor() {
    let upwardThrust;
    let upwardThrustFactor;

    upwardThrust = this.distY - this.startY;
    upwardThrustFactor = this.distY / this.dist;

    upwardThrustFactor = ParticleBlastr.util.clamp(upwardThrustFactor, 0.45, 0.65); // clamp max upwardThrustFactor variance

    return upwardThrustFactor;
  }

  prepForAnimate(x, y) {
    this.startX = x;
    this.startY = y;
    this.x = x;
    this.y = y;
  }

  animate(ctx, lifetimeFactor) {
    // let lifetimeFactorInverse = 1 - lifetimeFactor; // lifetimeFactorInverse 1 approaches 0

    let newX = this.startX + (this.distX * lifetimeFactor); 
    let newY = this.startY - (this.distY * lifetimeFactor); 

    this.x = newX;
    this.y = newY;

    // Gravity
    // I'm not entirely sure why this math works the way I want it to in execution.
    // Which means I'm not sure why my gravity numbers need to be so high.
    let currGravityEffect;
    currGravityEffect = this.gravity * lifetimeFactor; // lifetimeFactor 0 Approaches 1
    currGravityEffect = currGravityEffect * (this.upwardThrustFactor * lifetimeFactor);
    this.y += currGravityEffect;

    // Opacity
    // // TODO, currently LINEAR, figure out how to make this a cubic-bezier or ease-out or whatever
    const currOpacity = this.opacity - ((this.opacity - this.endOpacity) * lifetimeFactor);
    

    // Set Color/Opacity
    const rgb = this.fillColor;
    ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${currOpacity})`;

    if (this.img) {
      ctx.drawImage(this.img, this.x, this.y);
      // TODO custom sizing // probably need to add this in makePrts in Blastr class
      // ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
    } else if (this.shape == ParticleBlastr.SHAPE.ROUND_RECT) {
      ctx.beginPath();
      ctx.roundRect(this.x, this.y, this.width, this.height, this.borderRadius);
      ctx.fill();
    } else if (this.shape == ParticleBlastr.SHAPE.CIRCLE) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
      ctx.fill();
    } else { 
      // RECT or SQUARE
      ctx.fillRect(this.x, this.y, this.width, this.height);  
    }
  }

  resetDist() {
    this.distX = ParticleBlastr.util.roundRand(this.dist);
    this.distY = ParticleBlastr.util.roundRand(this.dist);

    const distXY = this.clampToCircle(this.x, this.y, this.distX, this.distY);

    const isNeg = Math.random() > 0.5;
    if (isNeg) distXY.x = distXY.x * -1;

    if (ParticleBlastr.util.isDef(this.allowNegY) && this.allowNegY) {
      const isYNeg = Math.random() > 0.5;

      if (isYNeg) distXY.y = distXY.y * -1;
    }

    this.distX = distXY.x;
    this.distY = distXY.y;
  }
}









class ParticleBlastr {
  doDebug = false;

  canvas;
  ctx;

  prts = []; //Array of <Particle> objects
  numPrts = 100;

  originX = 0;
  originY = 0;

  blastLengthMs = 1500;
  gravity = 0;


  fillColor = [255, 0, 255]; // Pink for debug.
  fillColors = [];
  pImg;

  pWidth = 20;
  pHeight = 20;
  pSize = 20;
  pBorderRadius = 50;

  pShape = ParticleBlastr.CIRCLE;
  pDimensions = {
    width: 10,
    height: 10,
    borderRadius: 25,
    radius: 5,
    sizeVariance: 0,
  }

  pRadius = 5

  pMaxDist = 1000;
  pMinDist = 0;

  pOpacity = 1;
  pEndOpacity = 0;

  done = false;
  #isLooping = false;

  #currRotation = 0;

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
    if (this.doDebug) {
      this.ctx.fillStyle = `#ff0000`;
      this.ctx.fillRect(200, 200, 15, 15);
      this.ctx.fillText('Canvas context is functional.', 223, 214)
    }
    //

    if (cfg.shape) this.pShape = cfg.shape;

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

    if (cfg.sizeVariance) this.sizeVariance = cfg.sizeVariance;


    if (cfg.particleCount) this.numPrts   = cfg.particleCount;
    // if (cfg.particleCount) this.numPrts   = 10;

    // particleImg takes precedence
    if (cfg.particleImg) {
      this.pImg = cfg.particleImg;
    } else {
      if (cfg.particleColor) {
        this.fillColor = cfg.particleColor;
        this.fillColors = null;
      } else if (cfg.particleColors) {
        this.fillColors = cfg.particleColors;
        this.fillColor = null;
      }
    }

    this.pOpacity    = cfg.particleOpacity || 1;
    this.pEndOpacity = cfg.particleEndOpacity || 0;

    if (cfg.particleMaxDistance) this.pMaxDist = cfg.particleMaxDistance;
    if (cfg.particleMinDistance) this.pMinDist = cfg.particleMinDistance;

    if (ParticleBlastr.util.isDef(cfg.particleBorderRadius)) this.pBorderRadius = cfg.particleBorderRadius; 

    if (ParticleBlastr.util.isDef(cfg.gravity))   this.pGravity   = cfg.gravity;

    if (ParticleBlastr.util.isDef(cfg.allowNegY)) this.allowNegY = cfg.allowNegY;

    if (cfg.gravityVariance) this.pGravityVariance = cfg.gravityVariance;

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
      pCfg.shape = this.pShape;

      if (this.pImg) {
        pCfg.img = this.pImg;
      } else if (this.pShape == ParticleBlastr.SHAPE.CIRCLE) {
        pCfg.radius = this.pDimensions.radius;
      } else if (this.pShape == ParticleBlastr.SHAPE.ROUND_RECT) {
        pCfg.width  = this.pDimensions.width;
        pCfg.height = this.pDimensions.height;
        pCfg.borderRadius = this.pDimensions.borderRadius;
      } else {
        pCfg.width  = this.pDimensions.width;
        pCfg.height = this.pDimensions.height;
      }

      if (this.sizeVariance) {

        const changeBy = Math.random() * this.sizeVariance;
        if (this.pShape == ParticleBlastr.SHAPE.CIRCLE) {
          let newRadius = pCfg.radius;

          newRadius = this.addOrSubtract(newRadius, changeBy);
          newRadius = ParticleBlastr.util.clamp( newRadius, 1, pCfg.radius + changeBy);
          
          pCfg.radius = newRadius;

        } else if (this.pShape == ParticleBlastr.SHAPE.ROUND_RECT || this.pShape == ParticleBlastr.SHAPE.RECT) {
          let newWidth = pCfg.width;
          let newHeight = pCfg.height;

          newWidth  = this.addOrSubtract(newWidth, changeBy);
          newWidth  = ParticleBlastr.util.clamp(newWidth, 1, pCfg.width + changeBy);

          newHeight = this.addOrSubtract(newHeight, changeBy);
          newHeight = ParticleBlastr.util.clamp(newHeight, 1, pCfg.height + changeBy);

          pCfg.width  = newWidth;
          pCfg.height = newHeight;

        } else if (this.pShape == ParticleBlastr.SHAPE.SQUARE) {
          let newSize = pCfg.width;

          newSize = this.addOrSubtract(newSize, changeBy);
          newSize = ParticleBlastr.util.clamp(newSize, 1, pCfg.width + changeBy);
          
          pCfg.width  = newSize;
          pCfg.height = newSize;
        }
      }

      // Randomized values:
        // TODO improve clamping so there isn't a visible "ring" of particles at the min clamp dist at large pNums
        // dist: this.util.clamp( this.pMaxDist * Math.random(), this.pMaxDist/2, this.pMaxDist),
      

      if (this.pMinDist) {
        let newDist = this.pMinDist;

        newDist = ParticleBlastr.util.randomNumberBetween(this.pMinDist, this.pMaxDist);

        pCfg.dist = newDist;

      } else {
        pCfg.dist = Math.random() * this.pMaxDist;
      }
      

      pCfg.gravity   = this.pGravity;
      if (this.pGravityVariance) {
        let newGravity = pCfg.gravity;
        let gravChangeBy = Math.random() * this.pGravityVariance;

        newGravity = this.addOrSubtract(newGravity, gravChangeBy);

        pCfg.gravity = ParticleBlastr.util.clamp(newGravity, 0, pCfg.gravity + this.pGravityVariance);
      }

      if (this.fillColors && this.fillColors.length > 0) {
        pCfg.fillColor = ParticleBlastr.util.randomItem(this.fillColors);
      } else if (this.fillColor) {
        pCfg.fillColor = this.fillColor;
      } else {
        console.warn('Bad config. ParticleBlastr needs either a particleColor array or particleColors array.')
      }

      const p = new Particle(pCfg);
      this.prts.push(p);
    }
  }

  addOrSubtract(number, changeBy) {
    return (Math.random() > 0.5) ? number + changeBy : number - changeBy;
  }

  startBlast(centerX, centerY) {
    if (this.doDebug) console.log("Start blast! At:", centerX, centerY);
    this.originX = centerX;
    this.originY = centerY;

    this.done = false;
    this.startTime = performance.now();
    this.#currRotation = 0;
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
    const lifetimeFactor = (timeSinceStart / this.blastLengthMs); // lifetimeFactor 0 Approaches 1
    const overtime = timeSinceStart >= this.blastLengthMs;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    this.prts.forEach((p) => {
      p.animate(this.ctx, ParticleBlastr.util.clamp(lifetimeFactor, 0, 1));
    });

    // Kill loop if done.
    if (overtime) {
      if (this.doDebug) console.log("Overtime! Reset ParticleBlastr.");
      this.reset();
    } else {
      requestAnimationFrame(() => { this.handleFrame() });
    }
  }

  reset() {
    this.done = true;
    this.#isLooping = false;

    this.ctx.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
  }

  // UTIL

  static util = {
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
    },

    randomNumberBetween(min, max) {
      return Math.random() * (max - min) + min;
    }
  }
}