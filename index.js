const trashField = document.getElementById("trashField");
const trashTypes = ["trash-bottle","trash-bag","trash-can","trash-cup","trash-ring"];
const trashSizes = {
  "trash-bottle": { width: 34, height: 94 },
  "trash-bag": { width: 60, height: 68 },
  "trash-can": { width: 50, height: 58 },
  "trash-cup": { width: 40, height: 54 },
  "trash-ring": { width: 54, height: 54 }
};
const maxTrash = 30;
const trashBodies = [];
let lastTime = 0;
let spawnTimer = 0;
let accumulator = 0;
const fixedStep = 1 / 60;
const gravity = 220;
const waterDrag = 0.989;
const floorPadding = 8;
const collisionIterations = 3;
const settleDrag = 0.94;
const angularDrag = 0.988;

function randomBetween(min,max){
  return Math.random() * (max - min) + min;
}

function createTrashItem(){
  if(trashBodies.length >= maxTrash) return;

  const type = trashTypes[Math.floor(Math.random() * trashTypes.length)];
  const size = trashSizes[type];
  const item = document.createElement("button");
  const fieldWidth = trashField.clientWidth;
  const xMax = Math.max(0, fieldWidth - size.width);

  item.type = "button";
  item.className = `trash-item ${type}`;
  item.setAttribute("aria-label","可點擊清除的海洋垃圾");
  trashField.appendChild(item);

  const body = {
    el: item,
    x: randomBetween(0, xMax),
    y: -size.height - randomBetween(10, 180),
    width: size.width,
    height: size.height,
    vx: randomBetween(-12, 12),
    vy: randomBetween(18, 26),
    swaySeed: randomBetween(0, Math.PI * 2),
    swayAmp: randomBetween(6, 16),
    rotation: randomBetween(-14, 14),
    tiltBias: randomBetween(-8, 8),
    targetRotation: randomBetween(-10, 10),
    rotationSpeed: randomBetween(-6, 6),
    mass: randomBetween(0.9, 1.25),
    resting:false,
    removed:false
  };

  body.el.addEventListener("click", () => popTrash(body));
  trashBodies.push(body);
  renderTrash(body);
}

function renderTrash(body){
  body.el.style.transform = `translate3d(${body.x}px, ${body.y}px, 0) rotate(${body.rotation}deg)`;
}

function getBodyCenter(body){
  return {
    x: body.x + body.width / 2,
    y: body.y + body.height / 2
  };
}

function resolveBounds(body){
  const maxX = trashField.clientWidth - body.width;
  const floorY = trashField.clientHeight - body.height - floorPadding;

  if(body.x < 0){
    body.x = 0;
    body.vx *= -0.35;
    body.rotationSpeed += 8;
  }

  if(body.x > maxX){
    body.x = maxX;
    body.vx *= -0.35;
    body.rotationSpeed -= 8;
  }

  if(body.y > floorY){
    body.y = floorY;
    if(body.vy > 8){
      body.vy *= -0.18;
      body.vx += randomBetween(-10, 10);
      body.rotationSpeed += randomBetween(-18, 18);
    }else{
      body.vy = 0;
    }
    body.vx *= settleDrag;
    body.rotationSpeed *= 0.9;
    body.targetRotation = body.tiltBias + body.vx * 0.35;
    body.resting = true;
  }
}

function resolveCollisions(){
  for(let i = 0; i < trashBodies.length; i++){
    const a = trashBodies[i];
    if(a.removed) continue;

    for(let j = i + 1; j < trashBodies.length; j++){
      const b = trashBodies[j];
      if(b.removed) continue;

      const centerA = getBodyCenter(a);
      const centerB = getBodyCenter(b);
      const minDistanceX = (a.width + b.width) * 0.46;
      const minDistanceY = (a.height + b.height) * 0.42;
      const dx = centerB.x - centerA.x;
      const dy = centerB.y - centerA.y;
      const normalized = (dx * dx) / (minDistanceX * minDistanceX) + (dy * dy) / (minDistanceY * minDistanceY);

      if(normalized >= 1) continue;

      const distance = Math.sqrt(dx * dx + dy * dy) || 0.001;
      const nx = dx / distance;
      const ny = dy / distance;
      const penetration = (1 - normalized) * 14;
      const totalMass = a.mass + b.mass;
      const aShare = b.mass / totalMass;
      const bShare = a.mass / totalMass;
      const sideBias = Math.sign(dx || randomBetween(-1, 1)) * penetration * 0.22;

      a.x -= nx * penetration * aShare - sideBias * aShare;
      a.y -= ny * penetration * aShare;
      b.x += nx * penetration * bShare + sideBias * bShare;
      b.y += ny * penetration * bShare;

      const relativeVelocity = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
      if(relativeVelocity < 0){
        const impulse = relativeVelocity * -0.18;
        a.vx -= impulse * nx * aShare;
        a.vy -= impulse * ny * aShare;
        b.vx += impulse * nx * bShare;
        b.vy += impulse * ny * bShare;
      }

      a.vx -= sideBias * 0.12;
      b.vx += sideBias * 0.12;
      a.rotationSpeed -= sideBias * 0.55;
      b.rotationSpeed += sideBias * 0.55;
    }
  }
}

function popTrash(body){
  if(body.removed) return;
  body.removed = true;
  body.el.classList.add("is-popping");
  createBubbleBurst(body);
  setTimeout(() => body.el.remove(), 540);
}

function createBubbleBurst(body){
  const burst = document.createElement("div");
  burst.className = "bubble-burst";
  burst.style.left = `${body.x}px`;
  burst.style.top = `${body.y}px`;
  burst.style.width = `${body.width}px`;
  burst.style.height = `${body.height}px`;

  for(let i = 0; i < 7; i++){
    const bubble = document.createElement("span");
    bubble.className = "bubble";
    bubble.style.left = `${body.width / 2 - 7}px`;
    bubble.style.top = `${body.height / 2 - 7}px`;
    bubble.style.setProperty("--dx",`${randomBetween(-36,36)}px`);
    bubble.style.setProperty("--dy",`${randomBetween(-56,-18)}px`);
    burst.appendChild(bubble);
  }

  trashField.appendChild(burst);
  setTimeout(() => burst.remove(), 760);
}

function stepTrash(delta, time){
  for(let i = trashBodies.length - 1; i >= 0; i--){
    const body = trashBodies[i];

    if(body.removed){
      trashBodies.splice(i,1);
      continue;
    }

    const sway = Math.sin(time * 0.001 + body.swaySeed) * body.swayAmp;
    body.resting = false;
    body.vx += sway * delta * 0.2;
    body.vy = Math.min(body.vy + gravity * delta, 85);
    body.vx *= waterDrag;
    body.vy *= 0.998;
    body.x += body.vx * delta;
    body.y += body.vy * delta;
    body.targetRotation = Math.max(-26, Math.min(26, body.tiltBias + body.vx * 0.55));
    body.rotationSpeed += (body.targetRotation - body.rotation) * 0.09;
    body.rotation += body.rotationSpeed * delta * 60;
    body.rotationSpeed *= angularDrag;
    resolveBounds(body);
  }

  for(let i = 0; i < collisionIterations; i++){
    resolveCollisions();
    trashBodies.forEach((body) => {
      if(!body.removed) resolveBounds(body);
    });
  }

  trashBodies.forEach((body) => {
    if(body.removed) return;

    resolveBounds(body);

    if(body.resting){
      body.vx *= 0.96;
      body.rotation += (body.targetRotation - body.rotation) * 0.08;
    }

    if(Math.abs(body.vx) < 1.2 && Math.abs(body.vy) < 1.2){
      body.vx *= 0.92;
      body.vy *= 0.92;
      body.rotationSpeed *= 0.7;
    }

    renderTrash(body);
  });
}

function animateTrash(time){
  if(!lastTime) lastTime = time;
  const delta = Math.min((time - lastTime) / 1000, 0.03);
  lastTime = time;
  spawnTimer += delta;
  accumulator += delta;

  if(spawnTimer >= 0.9){
    createTrashItem();
    spawnTimer = 0;
  }

  while(accumulator >= fixedStep){
    stepTrash(fixedStep, time);
    accumulator -= fixedStep;
  }

  requestAnimationFrame(animateTrash);
}

for(let i = 0; i < 10; i++){
  createTrashItem();
}
requestAnimationFrame(animateTrash);

window.addEventListener("resize", () => {
  trashBodies.forEach((body) => {
    const maxX = Math.max(0, trashField.clientWidth - body.width);
    body.x = Math.min(maxX, Math.max(0, body.x));
    if(body.y + body.height > trashField.clientHeight - floorPadding){
      body.y = trashField.clientHeight - body.height - floorPadding;
      body.resting = true;
    }
    renderTrash(body);
  });
});

const aboutSection = document.getElementById("about");

if(aboutSection){
  const aboutObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if(entry.isIntersecting){
        aboutSection.classList.add("is-visible");
      }else{
        aboutSection.classList.remove("is-visible");
      }
    });
  }, {
    threshold: 0.35
  });

  aboutObserver.observe(aboutSection);
}

const openingScene = document.getElementById("openingScene");
const introStartBtn = document.getElementById("introStartBtn");
const navigationEntry = performance.getEntriesByType("navigation")[0];

if(navigationEntry && navigationEntry.type === "reload"){
  sessionStorage.removeItem("oceanIntroSeen");
}

if(openingScene && introStartBtn){
  if(sessionStorage.getItem("oceanIntroSeen") === "true"){
    openingScene.classList.add("is-finished");
    document.body.classList.remove("intro-active");
  }else{
    introStartBtn.addEventListener("click", () => {
    openingScene.classList.add("is-diving");
    introStartBtn.disabled = true;

    setTimeout(() => {
      openingScene.classList.add("is-revealing");
    }, 1450);

    setTimeout(() => {
      openingScene.classList.add("is-curtain-up");
    }, 3650);

    setTimeout(() => {
      openingScene.classList.add("is-finished");
      document.body.classList.remove("intro-active");
      sessionStorage.setItem("oceanIntroSeen","true");
    }, 4700);
    });
  }
}

const sandCreatures = document.querySelectorAll(".sand-creature");

function randomFrom(values){
  return values[Math.floor(Math.random() * values.length)];
}

function startSandCreatureWalk(creature, firstRun = false){
  const delay = firstRun ? Math.random() * 2400 : 1600 + Math.random() * 5200;
  const duration = 9500 + Math.random() * 5200;
  const y = randomFrom([-8, -4, 0, 5, 10]);
  const tiltStart = randomFrom([-8, -5, -3, 2]);
  const tiltMid = randomFrom([-2, 3, 6, 9]);
  const tiltEnd = randomFrom([-7, -2, 4, 8]);
  const walkLeft = Math.random() > 0.5;

  setTimeout(() => {
    creature.classList.remove("is-walking");
    creature.classList.remove("walk-left");
    creature.style.setProperty("--walk-duration", `${duration}ms`);
    creature.style.setProperty("--walk-y", `${y}px`);
    creature.style.setProperty("--walk-tilt-start", `${tiltStart}deg`);
    creature.style.setProperty("--walk-tilt-mid", `${tiltMid}deg`);
    creature.style.setProperty("--walk-tilt-end", `${tiltEnd}deg`);

    void creature.offsetWidth;
    if(walkLeft){
      creature.classList.add("walk-left");
    }
    creature.classList.add("is-walking");
  }, delay);
}

sandCreatures.forEach((creature) => {
  creature.addEventListener("animationend", () => startSandCreatureWalk(creature));
  startSandCreatureWalk(creature, true);
});
