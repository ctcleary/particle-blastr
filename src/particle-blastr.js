class Particle {
  startX = 0;
  startY = 0;

  dist = 1000;

  endX = 100;
  endY = 100;

  opacity = 1;
  endOpacity = 0;

  endScale = 0;

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

    this.endScale = cfg.endScale || 0;

    this.dist = cfg.dist;
    this.resetDist();
    this.upwardThrustFactor = this.determineUpwardThrustFactor();

    this.shape = cfg.shape;  // Required

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

  animate(ctx, lifetimeFactor) { // lifetimeFactor 0 approaches 1
    // let lifetimeFactorInverse = 1 - lifetimeFactor; // lifetimeFactorInverse 1 approaches 0

    let newX = this.startX + (this.distX * lifetimeFactor); 
    let newY = this.startY - (this.distY * lifetimeFactor); 

    this.x = newX;
    this.y = newY;

    // Gravity
    let currGravityEffect = this.getCurrGravityEffect(lifetimeFactor);
    this.y += currGravityEffect;

    // Draw operation performed by child classes.
  }

  getCurrOpacity(lifetimeFactor) {
    // // TODO, currently LINEAR, figure out how to make this a cubic-bezier or ease-out or whatever
    return this.opacity - ((this.opacity - this.endOpacity) * lifetimeFactor);
  }

  getCurrScale(lifetimeFactor) {
    const lifetimeFactorInverse = 1 - lifetimeFactor;

    if (this.endScale < 1) {
      return 1 - ((1 - this.endScale) * lifetimeFactor);
    } else {
      let startScale = 1; // 1.0
      let endScale = this.endScale; // 3

      // 0% - scale should = 1.0
      //50% - scale should = 2.0
      //100%- scale should = 3.0
      return this.endScale - ((this.endScale - 1) * lifetimeFactorInverse);
    }
  }

  getCurrGravityEffect(lifetimeFactor) {
    // I'm not entirely sure why this math works, but it does work the way I want it to in execution.
    // But that means I'm not sure why my gravity numbers need to be so high.
    let currGravityEffect = this.gravity * lifetimeFactor; // lifetimeFactor 0 Approaches 1
    currGravityEffect = currGravityEffect * (this.upwardThrustFactor * lifetimeFactor);
    return currGravityEffect
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




class ParticleImage extends Particle {
  img;
  width;
  height;

  constructor(cfg) {
    super(cfg);

    this.img = cfg.img;
    this.width = cfg.width;
    this.height = cfg.height;
  }

  animate(ctx, lifetimeFactor) {
    super.animate(ctx, lifetimeFactor);

    const currOpacity = super.getCurrOpacity(lifetimeFactor);
    ctx.globalAlpha = currOpacity;
    if (this.width && this.height) {

      let currScale = this.getCurrScale(lifetimeFactor);
      
      ctx.drawImage(this.img, this.x, this.y, this.width * currScale, this.height * currScale);
    } else {
      ctx.drawImage(this.img, this.x, this.y);
    }
  }
}



// --- Drawn particle classes:
class ParticleDrawn extends Particle {
  fillColor = [255,  0, 255]; // Pink for debug
  strokeColor = null; // Default: no stroke

  constructor(cfg) {
    super(cfg);

    this.fillColor = cfg.fillColor;

    if (cfg.strokeColor) this.strokeColor = cfg.strokeColor;
  }

  animate(ctx, lifetimeFactor) {
    super.animate(ctx, lifetimeFactor);

    const currOpacity = super.getCurrOpacity(lifetimeFactor);
    const rgb = this.fillColor;
    ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${currOpacity})`;

    if (this.strokeColor) {
      const strokeRgb = this.strokeColor;
      ctx.strokeStyle = `rgba(${strokeRgb[0]}, ${strokeRgb[1]}, ${strokeRgb[2]}, ${currOpacity})`;
    }

    // Draw operation performed by child class.
  }

  getCurrScale(lifetimeFactor) {
    return super.getCurrScale(lifetimeFactor);
  }

  prepForAnimate(x, y) {
    super.prepForAnimate(x, y);
  }

}

class ParticleCircle extends ParticleDrawn {
  radius;

  constructor(cfg) {
    super(cfg);

    this.radius = cfg.radius;
  }

  animate(ctx, lifetimeFactor) {
    super.animate(ctx, lifetimeFactor);

    const currScale = this.getCurrScale(lifetimeFactor);

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * currScale, 0, 2 * Math.PI);
    ctx.fill();
    
    if (this.strokeColor) {
      ctx.stroke();
    }
  }
}

class ParticleRect extends ParticleDrawn {
  width;
  height;

  constructor(cfg) {
    super(cfg);

    this.width = cfg.width;
    this.height = cfg.height;
  }

  animate(ctx, lifetimeFactor) {
    super.animate(ctx, lifetimeFactor);

    const currScale = this.getCurrScale(lifetimeFactor);
    const w = this.width * currScale;
    const h = this.height * currScale;

    ctx.fillRect(this.x, this.y, w, h);  

    if (this.strokeColor) {
      ctx.strokeRect(this.x, this.y, w, h);
    }
  }
}

class ParticleRoundRect extends ParticleDrawn {
  width;
  height;
  borderRadius;

  constructor(cfg) {
    super(cfg);

    this.width = cfg.width;
    this.height = cfg.height;
    this.borderRadius = cfg.borderRadius;
  }

  animate(ctx, lifetimeFactor) {
    super.animate(ctx, lifetimeFactor);

    const currScale = this.getCurrScale(lifetimeFactor);

    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.width * currScale, this.height * currScale, this.borderRadius);
    ctx.fill();

    if (this.strokeColor) {
      ctx.stroke();
    }
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
  gravityVariance = 0;

  compositeOperation = 'source-over'; // Default canvas composite operation.
  backgroundImg = null;

  pFillColor = [255, 0, 255]; // Pink for debug.
  pFillColors = [];

  pImg;

  pShape = ParticleBlastr.SHAPE.CIRCLE;
  pDimensions = {
    width: 10,
    height: 10,

    borderRadius: 25,

    radius: 5,

    sizeVariance: 0,
    proportionalSizeVariance: true,

    particleEndScale: 0
  }

  pRadius = 5

  pMaxDist = 1000;
  pMinDist = 0;

  pOpacity = 1;
  pEndOpacity = 0;

  done = false;
  #isLooping = false;

  #currRotation = 0;

  static SHAPE = {
    SQUARE: 'square', // e.g. for faux "pixel-bursts"
    RECT: 'rect',
    ROUND_RECT: 'roundRect',
    CIRCLE: 'circle',
    IMAGE: 'image' // required 'particleImage' config key/value
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

    if (cfg.backgroundImg) this.backgroundImg = cfg.backgroundImg;

    if (cfg.particleCount) this.numPrts = cfg.particleCount;
    if (cfg.particleShape) this.pShape  = cfg.particleShape;

    if (!this.pShape) {
        console.warn('Bad config for ParticleBlastr. {particleShape} required.');
    }

    // Properties unique to shape type
    switch (this.pShape) {
      case ParticleBlastr.SHAPE.ROUND_RECT:
        this.pDimensions.borderRadius = cfg.particleBorderRadius;
        break;
      case ParticleBlastr.SHAPE.CIRCLE:
        this.pDimensions.radius = cfg.particleRadius;
        break;
      case ParticleBlastr.SHAPE.IMAGE:
        this.pImg = cfg.particleImg;
        break;
      default:
        break;
    }

    if (this.pShape == ParticleBlastr.SHAPE.SQUARE) {
      this.pDimensions.width  = cfg.particleSize;
      this.pDimensions.height = cfg.particleSize;
    } else if (this.pShape != ParticleBlastr.SHAPE.CIRCLE) {
      this.pDimensions.width  = cfg.particleWidth;
      this.pDimensions.height = cfg.particleHeight;
    }

    if (cfg.particleSizeVariance) this.pDimensions.sizeVariance = cfg.particleSizeVariance;
    if (cfg.particleProportionalSizeVariance) this.pDimensions.proportionalSizeVariance = cfg.particleProportionalSizeVariance

    if (ParticleBlastr.util.isDef(cfg.particleEndScale)) this.pDimensions.particleEndScale = cfg.particleEndScale;

    if (this.pShape != ParticleBlastr.SHAPE.IMAGE) {
      if (cfg.particleColor) {
        this.pFillColor = cfg.particleColor;
        this.pFillColors = null;
      } else if (cfg.particleColors) {
        this.pFillColors = cfg.particleColors;
        this.pFillColor = null;
      }

      if (cfg.particleStrokeColor) this.pStrokeColor = cfg.particleStrokeColor;
    }

    this.pOpacity    = cfg.particleOpacity || 1;
    this.pEndOpacity = cfg.particleEndOpacity || 0;

    if (cfg.particleMaxDistance) this.pMaxDist = cfg.particleMaxDistance;
    if (cfg.particleMinDistance) this.pMinDist = cfg.particleMinDistance;

    if (ParticleBlastr.util.isDef(cfg.gravity))   this.pGravity   = cfg.gravity;
    if (cfg.gravityVariance) this.gravityVariance = cfg.gravityVariance;

    if (ParticleBlastr.util.isDef(cfg.allowNegY)) this.allowNegY = cfg.allowNegY;

    if (cfg.compositeOperation) this.compositeOperation = cfg.compositeOperation;

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

      // Unique to these SHAPE options
      switch (this.pShape) {
        case ParticleBlastr.SHAPE.CIRCLE:
          pCfg.radius = this.pDimensions.radius;
          break;
        case ParticleBlastr.SHAPE.ROUND_RECT:
          pCfg.borderRadius = this.pDimensions.borderRadius;
          break;
        case ParticleBlastr.SHAPE.IMAGE: 
          pCfg.img = this.pImg;
          break;
      }


      if (this.pShape != ParticleBlastr.SHAPE.CIRCLE) {
          pCfg.width  = this.pDimensions.width;
          pCfg.height = this.pDimensions.height;
      }


      // Handle sizeVariance randomization
      // if (this.pDimensions.sizeVariance) {
      if (this.sizeVariance) {
        const changeBy = Math.random() * this.sizeVariance;

        if (this.pShape == ParticleBlastr.SHAPE.CIRCLE) {
          let newRadius = pCfg.radius;

          newRadius = this.addOrSubtract(newRadius, changeBy);
          newRadius = ParticleBlastr.util.clamp( newRadius, 1, pCfg.radius + changeBy);
          
          pCfg.radius = newRadius;

        } else if (this.pShape == ParticleBlastr.SHAPE.ROUND_RECT || 
                    this.pShape == ParticleBlastr.SHAPE.RECT ||
                    this.pShape == ParticleBlastr.SHAPE.IMAGE) {
          let newWidth = pCfg.width;
          let newHeight = pCfg.height;

          if (this.pDimensions.proportionalSizeVariance) { // width and height change by the same amount
            let add = Math.random() > 0.5;
            newWidth  = add ? newWidth  + changeBy : newWidth  - changeBy;
            newHeight = add ? newHeight + changeBy : newHeight - changeBy;
          } else { // randomize width and height independently
            newWidth  = this.addOrSubtract(newWidth, changeBy);
            newHeight = this.addOrSubtract(newHeight, changeBy);
          }

          newWidth  = ParticleBlastr.util.clamp(newWidth, 1, pCfg.width + changeBy);
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
      

      // Handle gravity randomization.
      pCfg.gravity   = this.pGravity;
      if (this.gravityVariance) {
        let newGravity = pCfg.gravity;
        let gravChangeBy = Math.random() * this.gravityVariance;

        newGravity = this.addOrSubtract(newGravity, gravChangeBy);

        pCfg.gravity = ParticleBlastr.util.clamp(newGravity, 0, pCfg.gravity + this.gravityVariance);
      }


      if (this.pShape != ParticleBlastr.SHAPE.IMAGE) {
        if (this.pFillColors && this.pFillColors.length > 0) {
          pCfg.fillColor = ParticleBlastr.util.randomItem(this.pFillColors);
        } else if (this.pFillColor) {
          pCfg.fillColor = this.pFillColor;
        } else {
          console.warn('Bad config. ParticleBlastr needs either a particleColor array or particleColors array.')
        }

        if (this.pStrokeColor) pCfg.strokeColor = this.pStrokeColor;
      }

      pCfg.endScale = this.pDimensions.particleEndScale;

      let p;
      switch (this.pShape) {
        case ParticleBlastr.SHAPE.IMAGE:
          p = new ParticleImage(pCfg);
          break;
        case ParticleBlastr.SHAPE.CIRCLE:
          p = new ParticleCircle(pCfg);
          break;
        case ParticleBlastr.SHAPE.ROUND_RECT:
          p = new ParticleRoundRect(pCfg);
          break;
        case ParticleBlastr.SHAPE.RECT:
        case ParticleBlastr.SHAPE.SQUARE:
          p = new ParticleRect(pCfg)
          break;
        default:
          console.warn('Bad particle config!');
          break;
      }

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
    this.ctx.globalAlpha = 1;
    this.ctx.globalCompositeOperation = this.compositeOperation;

    this.prts.forEach((p) => {
      p.prepForAnimate(this.originX, this.originY)
      p.resetDist();
    })
  }

  handleFrame() {
    const timeSinceStart = performance.now() - this.startTime;
    const lifetimeFactor = (timeSinceStart / this.blastLengthMs); // lifetimeFactor 0 Approaches 1
    const overtime = timeSinceStart >= this.blastLengthMs;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (this.backgroundImg) {
      this.ctx.globalCompositeOperation = 'source-over'; // Default
      this.ctx.drawImage(this.backgroundImg, 0, 0);
      this.ctx.globalCompositeOperation = this.compositeOperation;
    }

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
    if (this.backgroundImg) {
      this.ctx.globalCompositeOperation = 'source-over'; // Default
      this.ctx.drawImage(this.backgroundImg, 0, 0);
      this.ctx.globalCompositeOperation = this.compositeOperation;
    }
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