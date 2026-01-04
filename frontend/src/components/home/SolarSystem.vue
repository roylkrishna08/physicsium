<template>
  <div class="solar-system">
     <div class="sun"></div>
     
     <!-- Orbits & Planets with Eclipse Logic -->
     <div class="orbit mercury-orbit" style="--duration: 4s">
        <div class="planet-wrapper">
            <div class="planet mercury"><div class="shadow"></div></div>
        </div>
     </div>
     
     <div class="orbit venus-orbit" style="--duration: 7s">
        <div class="planet-wrapper">
            <div class="planet venus"><div class="shadow"></div></div>
        </div>
     </div>
     
     <div class="orbit earth-orbit" style="--duration: 12s">
        <div class="planet-wrapper">
            <div class="planet earth"><div class="shadow"></div></div>
        </div>
     </div>
     
     <div class="orbit mars-orbit" style="--duration: 16s">
        <div class="planet-wrapper">
            <div class="planet mars"><div class="shadow"></div></div>
        </div>
     </div>
     
     <!-- Asteroid Belt -->
     <div class="asteroid-belt"></div>

     <div class="orbit jupiter-orbit" style="--duration: 30s">
        <div class="planet-wrapper">
            <div class="planet jupiter"><div class="shadow"></div></div>
        </div>
     </div>
     
     <div class="orbit saturn-orbit" style="--duration: 40s">
        <div class="planet-wrapper">
            <div class="planet saturn">
                <div class="saturn-rings"></div>
                <div class="shadow"></div>
            </div>
        </div>
     </div>
     
     <div class="orbit uranus-orbit" style="--duration: 50s">
        <div class="planet-wrapper">
            <div class="planet uranus"><div class="shadow"></div></div>
        </div>
     </div>
     
     <div class="orbit neptune-orbit" style="--duration: 60s">
        <div class="planet-wrapper">
            <div class="planet neptune"><div class="shadow"></div></div>
        </div>
     </div>
   </div>
</template>

<style scoped>
/* Solar System Animation */
.solar-system {
  position: relative;
  width: 550px;
  height: 550px;
  transform-style: preserve-3d;
  transform: rotateX(65deg) rotateZ(-10deg);
}

.sun {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 50px;
  height: 50px;
  background: radial-gradient(circle at 30% 30%, #ffd700, #ff8c00, #ff4500);
  border-radius: 50%;
  transform: translate(-50%, -50%) rotateX(-65deg);
  box-shadow: 0 0 60px rgba(255, 140, 0, 0.8), 0 0 90px rgba(255, 69, 0, 0.4);
  z-index: 10;
  animation: sun-pulse 4s ease-in-out infinite;
}

@keyframes sun-pulse {
    0%, 100% { box-shadow: 0 0 60px rgba(255, 140, 0, 0.7), 0 0 90px rgba(255, 69, 0, 0.3); }
    50% { box-shadow: 0 0 80px rgba(255, 140, 0, 0.85), 0 0 120px rgba(255, 69, 0, 0.5); }
}

.orbit {
  position: absolute;
  top: 50%;
  left: 50%;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transform-style: preserve-3d;
  animation: orbit var(--duration) linear infinite;
}

/* Asteroid Belt */
.asteroid-belt {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 250px; /* Between Mars (200) and Jupiter (300) */
    height: 250px;
    border: 1px dashed rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transform-style: preserve-3d;
    animation: orbit 60s linear infinite;
    box-shadow: 0 0 15px rgba(255,255,255,0.1);
}

.mercury-orbit { width: 80px; height: 80px; }
.venus-orbit { width: 120px; height: 120px; }
.earth-orbit { width: 160px; height: 160px; }
.mars-orbit { width: 200px; height: 200px; }
.jupiter-orbit { width: 300px; height: 300px; }
.saturn-orbit { width: 380px; height: 380px; }
.uranus-orbit { width: 460px; height: 460px; }
.neptune-orbit { width: 540px; height: 540px; }

/* Wrapper to counter-rotate planet so texture doesn't spin */
.planet-wrapper {
    position: absolute;
    top: 0;
    left: 50%;
    width: 30px;
    height: 30px;
    transform: translate(-50%, -50%);
    transform-style: preserve-3d;
    animation: counter-orbit var(--duration) linear infinite;
}

.planet {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  transform: translate(-50%, -50%) rotateX(-65deg);
  box-shadow: inset -2px -2px 5px rgba(0,0,0,0.6);
  transform-style: preserve-3d;
  overflow: hidden;
}

/* Shadow for Phases */
.shadow {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: 
        linear-gradient(to bottom, rgba(0,0,0,0.85) 35%, transparent 60%, transparent 100%),
        linear-gradient(to top, rgba(255, 240, 200, 0.5) 0%, transparent 50%);
    border-radius: 50%;
    animation: shadow-rotate var(--duration) linear infinite;
    mix-blend-mode: normal;
}

.mercury { width: 6px; height: 6px; background: #a5a5a5; }
.venus { width: 10px; height: 10px; background: #e3bb76; }
.earth { width: 12px; height: 12px; background: radial-gradient(circle, #4facfe, #0a468c); }
.mars { width: 8px; height: 8px; background: #ff6b6b; }
.jupiter { width: 28px; height: 28px; background: repeating-linear-gradient(45deg, #d4a373, #bc6c25 4px, #d4a373 8px); }
.saturn { width: 24px; height: 24px; background: #f4d03f; }
.uranus { width: 14px; height: 14px; background: #a2d9ff; }
.neptune { width: 14px; height: 14px; background: #4b7bec; }

.saturn-rings {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 50px;
    height: 50px;
    border: 6px solid rgba(220, 190, 100, 0.7);
    border-radius: 50%;
    transform: translate(-50%, -50%) rotateX(75deg);
    box-shadow: 0 0 5px rgba(220, 190, 100, 0.3);
}

@keyframes orbit {
  0% { transform: translate(-50%, -50%) rotateZ(0deg); }
  100% { transform: translate(-50%, -50%) rotateZ(360deg); }
}

@keyframes counter-orbit {
  0% { transform: translate(-50%, -50%) rotateZ(360deg); }
  100% { transform: translate(-50%, -50%) rotateZ(0deg); }
}

@keyframes shadow-rotate {
  0% { transform: rotateZ(0deg); }
  100% { transform: rotateZ(360deg); }
}

/* Mobile Tweaks propagated */
@media (max-width: 400px) {
    .solar-system {
            transform: scale(0.55) rotateX(65deg) rotateZ(-10deg);
    }
}
@media (max-width: 768px) and (min-width: 401px) {
    .solar-system {
        transform: scale(0.65) rotateX(65deg) rotateZ(-10deg);
    }
}
</style>
