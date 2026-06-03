const gameArea = document.getElementById("gameArea");
const scoreText = document.getElementById("score");
const livesText = document.getElementById("lives");
const timeText = document.getElementById("time");
const finalScore = document.getElementById("finalScore");
const endTitle = document.getElementById("endTitle");
const shield = document.getElementById("shield");

const directions = ["up","down","left","right"];
const trashTypes = ["trash-bottle","trash-bag","trash-can","trash-cup","trash-ring"];
const keyToDirection = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right"
};

let score = 0;
let lives = 5;
let time = 45;
let speed = 1.8;
let spawnDelay = 720;
let activeShield = "up";
let playing = false;
let trashList = [];
let gameLoop;
let timerLoop;
let spawnLoop;

function startGame(){
  document.getElementById("startScreen").style.display = "none";
  document.getElementById("endScreen").style.display = "none";

  score = 0;
  lives = 5;
  time = 45;
  speed = 1.8;
  spawnDelay = 720;
  activeShield = "up";
  playing = true;

  setShield("up");
  scoreText.innerText = score;
  livesText.innerText = lives;
  timeText.innerText = time;

  trashList.forEach((trash) => trash.el.remove());
  trashList = [];

  clearInterval(gameLoop);
  clearInterval(timerLoop);
  clearInterval(spawnLoop);

  gameLoop = setInterval(updateGame,16);
  spawnLoop = setInterval(createTrash,spawnDelay);
  timerLoop = setInterval(tickTimer,1000);
}

function tickTimer(){
  if(!playing) return;

  time--;
  timeText.innerText = time;
  speed += 0.12;

  if(time % 10 === 0 && spawnDelay > 400){
    spawnDelay -= 80;
    clearInterval(spawnLoop);
    spawnLoop = setInterval(createTrash,spawnDelay);
  }

  if(time <= 0){
    endGame(true);
  }
}

function createTrash(){
  if(!playing) return;

  const direction = directions[Math.floor(Math.random() * directions.length)];
  const type = trashTypes[Math.floor(Math.random() * trashTypes.length)];
  const trash = document.createElement("div");
  const areaWidth = gameArea.clientWidth;
  const areaHeight = gameArea.clientHeight;
  const centerX = areaWidth / 2;
  const centerY = areaHeight / 2;

  const item = {
    el: trash,
    direction,
    size: 56,
    removed: false
  };

  trash.className = `trash ${type}`;

  if(direction === "up"){
    item.x = centerX - 24;
    item.y = -70;
  }else if(direction === "down"){
    item.x = centerX - 24;
    item.y = areaHeight + 30;
  }else if(direction === "left"){
    item.x = -70;
    item.y = centerY - 24;
  }else{
    item.x = areaWidth + 30;
    item.y = centerY - 24;
  }

  renderTrash(item);
  gameArea.appendChild(trash);
  trashList.push(item);
}

function renderTrash(item){
  item.el.style.left = `${item.x}px`;
  item.el.style.top = `${item.y}px`;
}

function updateGame(){
  if(!playing) return;

  const centerX = gameArea.clientWidth / 2;
  const centerY = gameArea.clientHeight / 2;

  trashList = trashList.filter((item) => {
    if(item.removed) return false;

    if(item.direction === "up") item.y += speed;
    if(item.direction === "down") item.y -= speed;
    if(item.direction === "left") item.x += speed;
    if(item.direction === "right") item.x -= speed;

    renderTrash(item);

    const itemCenterX = item.x + item.size / 2;
    const itemCenterY = item.y + item.size / 2;
    const distance = Math.hypot(itemCenterX - centerX, itemCenterY - centerY);

    if(distance < 90 && item.direction === activeShield){
      blockTrash(item);
      return false;
    }

    if(distance < 58){
      item.el.remove();
      lives--;
      livesText.innerText = lives;
      pulsePlayer();

      if(lives <= 0){
        endGame(false);
      }

      return false;
    }

    return true;
  });
}

function setShield(direction){
  activeShield = direction;
  shield.className = `shield shield-${direction}`;
}

function blockTrash(item){
  item.removed = true;
  item.el.classList.add("pop");
  shield.classList.remove("guard-flash");
  void shield.offsetWidth;
  shield.classList.add("guard-flash");
  score += 20;
  scoreText.innerText = score;
  setTimeout(() => item.el.remove(),220);
}

function pulsePlayer(){
  const player = document.getElementById("player");
  player.animate([
    { transform: "translate(-50%,-50%) scale(1)" },
    { transform: "translate(-50%,-50%) scale(1.14)" },
    { transform: "translate(-50%,-50%) scale(1)" }
  ], {
    duration: 240,
    easing: "ease-out"
  });
}

function endGame(won){
  playing = false;

  clearInterval(gameLoop);
  clearInterval(timerLoop);
  clearInterval(spawnLoop);

  trashList.forEach((trash) => trash.el.remove());
  trashList = [];

  endTitle.innerText = won ? "防衛成功！" : "海洋失守！";
  finalScore.innerText = score;
  document.getElementById("endScreen").style.display = "flex";
}

document.addEventListener("keydown",(event) => {
  const direction = keyToDirection[event.key];
  if(!direction) return;

  event.preventDefault();
  setShield(direction);
});
