"use strict";

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");
const home = document.querySelector("#home");
const arcade = document.querySelector("#arcade");
const title = document.querySelector("#game-title");
const kicker = document.querySelector("#game-kicker");
const scoreLabel = document.querySelector("#game-score");
const controlsLabel = document.querySelector("#game-controls");
const pauseButton = document.querySelector("#pause-button");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const COLORS = {
  mint: "#78f0bd",
  purple: "#a99aff",
  white: "#edf1f8",
  muted: "#79849a",
  grid: "rgba(151, 165, 190, 0.08)",
  background: "#111827",
};

const gameInfo = {
  pong: {
    title: "Pong",
    kicker: "01 / DUEL",
    controls: "Joueur 1 : W / S     ·     Joueur 2 : ↑ / ↓     ·     P : pause",
  },
  tetris: {
    title: "Tetris",
    kicker: "02 / PUZZLE",
    controls: "← → déplacer     ·     ↑ tourner     ·     ↓ descendre     ·     Espace : chute",
  },
  snake: {
    title: "Snake",
    kicker: "03 / ARCADE",
    controls: "Flèches ou W A S D pour tourner     ·     P : pause",
  },
};

const keys = new Set();
let activeGame = null;
let game = null;
let paused = false;
let finished = false;
let accumulator = 0;
let lastFrame = 0;

function resetPong() {
  return {
    leftY: HEIGHT / 2 - 48,
    rightY: HEIGHT / 2 - 48,
    leftScore: 0,
    rightScore: 0,
    ballX: WIDTH / 2,
    ballY: HEIGHT / 2,
    ballVX: 330,
    ballVY: 145,
  };
}

const TETROMINOES = [
  { color: "#78f0bd", shape: [[1, 1, 1, 1]] },
  { color: "#a99aff", shape: [[1, 1], [1, 1]] },
  { color: "#ffcb74", shape: [[0, 1, 0], [1, 1, 1]] },
  { color: "#ff7f9d", shape: [[1, 0, 0], [1, 1, 1]] },
  { color: "#69c9ff", shape: [[0, 0, 1], [1, 1, 1]] },
  { color: "#f184e3", shape: [[0, 1, 1], [1, 1, 0]] },
  { color: "#8fda75", shape: [[1, 1, 0], [0, 1, 1]] },
];

function createTetrisPiece() {
  const piece = TETROMINOES[Math.floor(Math.random() * TETROMINOES.length)];
  return {
    shape: piece.shape.map((row) => row.slice()),
    color: piece.color,
    x: Math.floor((10 - piece.shape[0].length) / 2),
    y: 0,
  };
}

function resetTetris() {
  const state = {
    board: Array.from({ length: 20 }, () => Array(10).fill(null)),
    piece: null,
    score: 0,
    lines: 0,
    dropTimer: 0,
  };
  state.piece = createTetrisPiece();
  return state;
}

function resetSnake() {
  const snake = [{ x: 8, y: 10 }, { x: 7, y: 10 }, { x: 6, y: 10 }];
  return {
    snake,
    direction: { x: 1, y: 0 },
    nextDirection: { x: 1, y: 0 },
    food: randomFood(snake),
    score: 0,
    moveTimer: 0,
  };
}

function randomFood(snake) {
  let food;
  do {
    food = { x: Math.floor(Math.random() * 24), y: Math.floor(Math.random() * 20) };
  } while (snake.some((segment) => segment.x === food.x && segment.y === food.y));
  return food;
}

function startGame(name) {
  activeGame = name;
  game = name === "pong" ? resetPong() : name === "tetris" ? resetTetris() : resetSnake();
  paused = false;
  finished = false;
  accumulator = 0;
  keys.clear();

  home.classList.add("hidden");
  arcade.classList.remove("hidden");
  title.textContent = gameInfo[name].title;
  kicker.textContent = gameInfo[name].kicker;
  controlsLabel.textContent = gameInfo[name].controls;
  pauseButton.textContent = "Pause";
  updateScore();
  draw();
}

function returnHome() {
  activeGame = null;
  game = null;
  keys.clear();
  arcade.classList.add("hidden");
  home.classList.remove("hidden");
}

function restartGame() {
  if (activeGame) startGame(activeGame);
}

function togglePause() {
  if (!activeGame || finished) return;
  paused = !paused;
  pauseButton.textContent = paused ? "Reprendre" : "Pause";
  draw();
}

function updateScore() {
  if (activeGame === "pong") {
    scoreLabel.textContent = `${game.leftScore}  —  ${game.rightScore}`;
  } else if (activeGame === "tetris") {
    scoreLabel.textContent = `SCORE  ${game.score}`;
  } else if (activeGame === "snake") {
    scoreLabel.textContent = `SCORE  ${game.score}`;
  }
}

function updatePong(delta) {
  const paddleHeight = 96;
  const paddleSpeed = 390;

  if (keys.has("w")) game.leftY -= paddleSpeed * delta;
  if (keys.has("s")) game.leftY += paddleSpeed * delta;
  if (keys.has("arrowup")) game.rightY -= paddleSpeed * delta;
  if (keys.has("arrowdown")) game.rightY += paddleSpeed * delta;
  game.leftY = Math.max(0, Math.min(HEIGHT - paddleHeight, game.leftY));
  game.rightY = Math.max(0, Math.min(HEIGHT - paddleHeight, game.rightY));

  game.ballX += game.ballVX * delta;
  game.ballY += game.ballVY * delta;
  if (game.ballY < 10 || game.ballY > HEIGHT - 10) game.ballVY *= -1;

  const paddleX = 25;
  const paddleWidth = 12;
  if (
    game.ballVX < 0 &&
    game.ballX - 10 <= paddleX + paddleWidth &&
    game.ballX > paddleX &&
    game.ballY >= game.leftY - 10 &&
    game.ballY <= game.leftY + paddleHeight + 10
  ) {
    game.ballVX = Math.abs(game.ballVX) * 1.06;
    game.ballVY = ((game.ballY - (game.leftY + paddleHeight / 2)) / (paddleHeight / 2)) * 300;
  } else if (
    game.ballVX > 0 &&
    game.ballX + 10 >= WIDTH - paddleX - paddleWidth &&
    game.ballX < WIDTH - paddleX &&
    game.ballY >= game.rightY - 10 &&
    game.ballY <= game.rightY + paddleHeight + 10
  ) {
    game.ballVX = -Math.abs(game.ballVX) * 1.06;
    game.ballVY = ((game.ballY - (game.rightY + paddleHeight / 2)) / (paddleHeight / 2)) * 300;
  }

  if (game.ballX < 0 || game.ballX > WIDTH) {
    const scoredRight = game.ballX < 0;
    if (scoredRight) game.rightScore += 1;
    else game.leftScore += 1;
    if (game.leftScore === 7 || game.rightScore === 7) {
      finished = true;
    } else {
      game.ballX = WIDTH / 2;
      game.ballY = HEIGHT / 2;
      game.ballVX = scoredRight ? -330 : 330;
      game.ballVY = (Math.random() * 220) - 110;
    }
    updateScore();
  }
}

function collides(piece, offsetX = 0, offsetY = 0, shape = piece.shape) {
  for (let y = 0; y < shape.length; y += 1) {
    for (let x = 0; x < shape[y].length; x += 1) {
      if (!shape[y][x]) continue;
      const boardX = piece.x + offsetX + x;
      const boardY = piece.y + offsetY + y;
      if (
        boardX < 0 ||
        boardX >= 10 ||
        boardY >= 20 ||
        (boardY >= 0 && game.board[boardY][boardX])
      ) return true;
    }
  }
  return false;
}

function lockTetrisPiece() {
  const { piece, board } = game;
  piece.shape.forEach((row, y) => row.forEach((cell, x) => {
    if (cell && piece.y + y >= 0) board[piece.y + y][piece.x + x] = piece.color;
  }));

  const remaining = board.filter((row) => row.some((cell) => !cell));
  const cleared = 20 - remaining.length;
  if (cleared) {
    game.board = Array.from({ length: cleared }, () => Array(10).fill(null)).concat(remaining);
    game.lines += cleared;
    game.score += [0, 100, 300, 500, 800][cleared] || cleared * 200;
    updateScore();
  }

  game.piece = createTetrisPiece();
  if (collides(game.piece)) finished = true;
}

function moveTetrisPiece(dx, dy) {
  if (!collides(game.piece, dx, dy)) {
    game.piece.x += dx;
    game.piece.y += dy;
    return true;
  }
  if (dy > 0) lockTetrisPiece();
  return false;
}

function rotateTetrisPiece() {
  const rotated = game.piece.shape[0].map((_, index) =>
    game.piece.shape.map((row) => row[index]).reverse(),
  );
  if (!collides(game.piece, 0, 0, rotated)) game.piece.shape = rotated;
}

function updateTetris(delta) {
  game.dropTimer += delta;
  const dropInterval = Math.max(0.1, 0.55 - Math.floor(game.lines / 5) * 0.06);
  if (game.dropTimer >= dropInterval) {
    game.dropTimer = 0;
    moveTetrisPiece(0, 1);
  }
}

function updateSnake(delta) {
  game.moveTimer += delta;
  const interval = Math.max(0.065, 0.14 - game.score * 0.002);
  if (game.moveTimer < interval) return;
  game.moveTimer = 0;
  game.direction = game.nextDirection;

  const head = {
    x: game.snake[0].x + game.direction.x,
    y: game.snake[0].y + game.direction.y,
  };
  const ateFood = head.x === game.food.x && head.y === game.food.y;
  const body = ateFood ? game.snake : game.snake.slice(0, -1);
  if (
    head.x < 0 || head.x >= 24 || head.y < 0 || head.y >= 20 ||
    body.some((segment) => segment.x === head.x && segment.y === head.y)
  ) {
    finished = true;
    return;
  }

  game.snake.unshift(head);
  if (ateFood) {
    game.score += 1;
    game.food = randomFood(game.snake);
    updateScore();
  } else {
    game.snake.pop();
  }
}

function frame(timestamp) {
  const delta = lastFrame ? Math.min((timestamp - lastFrame) / 1000, 0.04) : 0;
  lastFrame = timestamp;

  if (activeGame && !paused && !finished) {
    if (activeGame === "pong") updatePong(delta);
    else if (activeGame === "tetris") updateTetris(delta);
    else updateSnake(delta);
    draw();
  }
  requestAnimationFrame(frame);
}

function drawGrid() {
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;
  for (let x = 0; x <= WIDTH; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y <= HEIGHT; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
    ctx.stroke();
  }
}

function drawPong() {
  drawGrid();
  ctx.setLineDash([9, 12]);
  ctx.strokeStyle = "rgba(151, 165, 190, 0.25)";
  ctx.beginPath();
  ctx.moveTo(WIDTH / 2, 0);
  ctx.lineTo(WIDTH / 2, HEIGHT);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = COLORS.mint;
  ctx.beginPath();
  ctx.roundRect(25, game.leftY, 12, 96, 6);
  ctx.fill();
  ctx.fillStyle = COLORS.purple;
  ctx.beginPath();
  ctx.roundRect(WIDTH - 37, game.rightY, 12, 96, 6);
  ctx.fill();
  ctx.fillStyle = COLORS.white;
  ctx.beginPath();
  ctx.arc(game.ballX, game.ballY, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.font = "500 56px 'DM Mono', monospace";
  ctx.textAlign = "center";
  ctx.fillText(game.leftScore, WIDTH / 2 - 56, 76);
  ctx.fillText(game.rightScore, WIDTH / 2 + 56, 76);
}

function drawTetrisCell(x, y, color, cellSize, offsetX, offsetY) {
  const inset = 2;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(offsetX + x * cellSize + inset, offsetY + y * cellSize + inset, cellSize - inset * 2, cellSize - inset * 2, 4);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.14)";
  ctx.fillRect(offsetX + x * cellSize + inset + 3, offsetY + y * cellSize + inset + 2, cellSize - inset * 2 - 6, 2);
}

function drawTetris() {
  const cellSize = 23;
  const offsetX = 285;
  const offsetY = 20;
  drawGrid();
  ctx.fillStyle = "#0c121e";
  ctx.fillRect(offsetX - 5, offsetY - 5, 10 * cellSize + 10, 20 * cellSize + 10);
  ctx.strokeStyle = "rgba(169, 154, 255, 0.25)";
  ctx.strokeRect(offsetX - 5, offsetY - 5, 10 * cellSize + 10, 20 * cellSize + 10);

  ctx.textAlign = "left";
  ctx.fillStyle = COLORS.muted;
  ctx.font = "500 12px 'DM Mono', monospace";
  ctx.fillText("SCORE", 80, 185);
  ctx.fillStyle = COLORS.white;
  ctx.font = "500 24px 'DM Mono', monospace";
  ctx.fillText(String(game.score).padStart(5, "0"), 80, 216);
  ctx.fillStyle = COLORS.muted;
  ctx.font = "500 12px 'DM Mono', monospace";
  ctx.fillText("LIGNES", 80, 265);
  ctx.fillStyle = COLORS.white;
  ctx.font = "500 24px 'DM Mono', monospace";
  ctx.fillText(String(game.lines).padStart(2, "0"), 80, 296);

  game.board.forEach((row, y) => row.forEach((color, x) => {
    if (color) drawTetrisCell(x, y, color, cellSize, offsetX, offsetY);
  }));
  game.piece.shape.forEach((row, y) => row.forEach((cell, x) => {
    if (cell && game.piece.y + y >= 0) {
      drawTetrisCell(game.piece.x + x, game.piece.y + y, game.piece.color, cellSize, offsetX, offsetY);
    }
  }));
}

function drawSnake() {
  const cellSize = 22;
  const offsetX = 136;
  const offsetY = 30;
  drawGrid();
  ctx.fillStyle = "#0c121e";
  ctx.fillRect(offsetX, offsetY, 24 * cellSize, 20 * cellSize);
  ctx.strokeStyle = "rgba(120, 240, 189, 0.25)";
  ctx.strokeRect(offsetX, offsetY, 24 * cellSize, 20 * cellSize);

  ctx.fillStyle = "#ff8099";
  ctx.beginPath();
  ctx.arc(
    offsetX + game.food.x * cellSize + cellSize / 2,
    offsetY + game.food.y * cellSize + cellSize / 2,
    cellSize * 0.34,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  game.snake.forEach((segment, index) => {
    drawTetrisCell(
      segment.x,
      segment.y,
      index === 0 ? "#a4ffd5" : COLORS.mint,
      cellSize,
      offsetX,
      offsetY,
    );
  });
}

function drawOverlay(message, hint) {
  ctx.fillStyle = "rgba(10, 14, 23, 0.72)";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.textAlign = "center";
  ctx.fillStyle = COLORS.white;
  ctx.font = "600 38px 'Space Grotesk', sans-serif";
  ctx.fillText(message, WIDTH / 2, HEIGHT / 2 - 4);
  ctx.fillStyle = "#aab3c4";
  ctx.font = "14px 'DM Mono', monospace";
  ctx.fillText(hint, WIDTH / 2, HEIGHT / 2 + 30);
}

function draw() {
  if (!activeGame || !game) return;
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  if (activeGame === "pong") drawPong();
  else if (activeGame === "tetris") drawTetris();
  else drawSnake();

  if (finished) {
    const message = activeGame === "pong"
      ? `${game.leftScore > game.rightScore ? "Joueur 1" : "Joueur 2"} gagne !`
      : "Partie terminée";
    drawOverlay(message, "Entrée pour recommencer  ·  Échap pour les jeux");
  } else if (paused) {
    drawOverlay("Pause", "Appuie sur P ou clique sur Reprendre");
  }
}

function onKeyDown(event) {
  const key = event.key.toLowerCase();
  if (activeGame && ["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) {
    event.preventDefault();
  }

  if (!activeGame) return;
  if (key === "escape") {
    returnHome();
    return;
  }
  if (key === "enter" && finished) {
    restartGame();
    return;
  }
  if (key === "p") {
    togglePause();
    return;
  }
  if (paused || finished || keys.has(key)) return;
  keys.add(key);

  if (activeGame === "tetris") {
    if (key === "arrowleft" || key === "a") moveTetrisPiece(-1, 0);
    else if (key === "arrowright" || key === "d") moveTetrisPiece(1, 0);
    else if (key === "arrowup" || key === "w" || key === "x") rotateTetrisPiece();
    else if (key === "arrowdown" || key === "s") moveTetrisPiece(0, 1);
    else if (key === " ") {
      while (moveTetrisPiece(0, 1)) game.score += 2;
      updateScore();
    }
    draw();
  } else if (activeGame === "snake") {
    const directions = {
      arrowup: { x: 0, y: -1 }, w: { x: 0, y: -1 },
      arrowdown: { x: 0, y: 1 }, s: { x: 0, y: 1 },
      arrowleft: { x: -1, y: 0 }, a: { x: -1, y: 0 },
      arrowright: { x: 1, y: 0 }, d: { x: 1, y: 0 },
    };
    const direction = directions[key];
    if (direction && direction.x !== -game.direction.x && direction.y !== -game.direction.y) {
      game.nextDirection = direction;
    }
  }
}

document.querySelectorAll("[data-game]").forEach((button) => {
  button.addEventListener("click", () => startGame(button.dataset.game));
});
document.querySelector("#back-button").addEventListener("click", returnHome);
document.querySelector("#restart-button").addEventListener("click", restartGame);
pauseButton.addEventListener("click", togglePause);
document.addEventListener("keydown", onKeyDown);
document.addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));
window.addEventListener("blur", () => keys.clear());

requestAnimationFrame(frame);
