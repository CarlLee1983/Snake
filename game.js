'use strict';

(() => {
  const directions = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };

  function sameCell(first, second) {
    return first.x === second.x && first.y === second.y;
  }

  function transpose({ x, y }) {
    return { x: y, y: x };
  }

  function transposeBoard(board) {
    return {
      ...board,
      cols: board.rows,
      rows: board.cols,
      snake: board.snake.map(transpose),
      food: board.food && transpose(board.food),
      direction: transpose(board.direction),
    };
  }

  function createGame({ cols, rows, random = Math.random }) {
    const x = Math.floor(cols / 2);
    const y = Math.floor(rows / 2);
    let initialState = {
      cols, rows,
      snake: [
        { x: x + 1, y }, { x, y }, { x: x - 1, y },
        { x: x - 1, y: y + 1 }, { x: x - 1, y: y + 2 }, { x: x - 2, y: y + 2 },
      ],
      food: { x: x + 3, y },
      direction: directions.right,
      score: 0,
      status: 'ready',
    };
    let state = initialState;
    const turns = [];

    function placeFood(snake) {
      const openCells = [];
      for (let y = 0; y < state.rows; y += 1) {
        for (let x = 0; x < state.cols; x += 1) {
          const cell = { x, y };
          if (!snake.some((segment) => sameCell(segment, cell))) openCells.push(cell);
        }
      }
      return openCells[Math.floor(random() * openCells.length)] ?? null;
    }

    return {
      get state() { return state; },
      start() {
        if (state.status === 'lost' || state.status === 'won') {
          state = initialState;
          turns.length = 0;
        }
        state = { ...state, status: 'running' };
      },
      pause() {
        if (state.status !== 'running') return;
        turns.length = 0;
        state = { ...state, status: 'paused' };
      },
      orient(wide) {
        if (state.cols === state.rows || wide === (state.cols > state.rows)) return;
        state = transposeBoard(state);
        initialState = transposeBoard(initialState);
        for (let index = 0; index < turns.length; index += 1) {
          turns[index] = transpose(turns[index]);
        }
      },
      steer(heading) {
        const direction = directions[heading];
        const current = turns.at(-1) ?? state.direction;
        if (turns.length < 2 && direction && direction.x * current.x + direction.y * current.y === 0) {
          turns.push(direction);
        }
      },
      tick() {
        if (state.status !== 'running') return;
        const nextDirection = turns.shift() ?? state.direction;
        const { cols, rows } = state;
        const head = {
          x: (state.snake[0].x + nextDirection.x + cols) % cols,
          y: (state.snake[0].y + nextDirection.y + rows) % rows,
        };
        const ate = sameCell(head, state.food);
        const body = ate ? state.snake : state.snake.slice(0, -1);
        if (body.some((segment) => sameCell(head, segment))) {
          state = { ...state, status: 'lost' };
          return;
        }
        const snake = [head, ...body];
        const food = ate ? placeFood(snake) : state.food;
        state = {
          ...state, snake, food,
          direction: nextDirection,
          score: state.score + Number(ate),
          status: food ? 'running' : 'won',
        };
      },
    };
  }

  if (typeof module !== 'undefined') module.exports = { createGame };
  if (typeof document === 'undefined') return;

  const canvas = document.getElementById('scene');
  const start = document.getElementById('start');
  const startLabel = document.getElementById('start-label');
  const sound = document.getElementById('sound');
  const fullscreen = document.getElementById('fullscreen');
  const score = document.getElementById('score');
  const best = document.getElementById('best');
  const status = document.getElementById('status');
  const compact = window.matchMedia('(max-width: 48rem), (max-height: 34rem)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const boardInset = 0.022;
  const pickupEase = 'cubic-bezier(0.23, 1, 0.32, 1)';
  const bestKey = 'snake-meadow-best';
  const messages = {
    ready: { action: '開始遊戲', status: '就緒' },
    running: { action: '暫停遊戲', status: '進行中' },
    paused: { action: '繼續遊戲', status: '已暫停' },
    lost: { action: '再玩一次', status: '遊戲結束' },
    won: { action: '再玩一次', status: '完成草地' },
  };
  const arrowKeys = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  };

  let game = createGame(boardSize());
  let bestScore = readBest();
  let tickId;
  let swipe;
  let audio;
  let soundEnabled = false;
  let pickupLayer;
  let scorePop;

  function boardSize() {
    const { clientWidth: width, clientHeight: height } = canvas;
    const playableFraction = 1 - boardInset * 2;
    const cellSize = compact.matches ? 37 : Math.min(56, Math.max(40, width / 28));
    return {
      cols: Math.max(7, Math.round(width * playableFraction / cellSize)),
      rows: Math.max(5, Math.round(height * playableFraction / cellSize)),
    };
  }

  function fitNewRound() {
    const size = boardSize();
    if (size.cols !== game.state.cols || size.rows !== game.state.rows) {
      game = createGame(size);
    }
  }

  function readBest() {
    try {
      const value = Number(window.localStorage.getItem(bestKey));
      if (Number.isSafeInteger(value) && value > 0) return value;
    } catch {
      // The current session can keep its own record when storage is unavailable.
    }
    return 0;
  }

  function updateBest(value) {
    if (value <= bestScore) return;
    bestScore = value;
    try {
      window.localStorage.setItem(bestKey, String(value));
    } catch {
      // Gameplay continues when storage is unavailable.
    }
  }

  function updateText(element, text) {
    if (element.textContent !== text) element.textContent = text;
  }

  function render() {
    const state = game.state;
    const message = messages[state.status];
    start.dataset.state = state.status;
    status.dataset.state = state.status;
    updateText(startLabel, message.action);
    updateText(status, message.status);
    updateText(score, String(state.score).padStart(2, '0'));
    updateText(best, String(bestScore).padStart(2, '0'));
    window.drawScene(canvas, state);
  }

  function playSound(frequencies) {
    if (!soundEnabled || audio?.state !== 'running') return;
    frequencies.forEach((frequency, index) => {
      const time = audio.currentTime + index * 0.085;
      const oscillator = audio.createOscillator();
      const envelope = audio.createGain();
      oscillator.type = 'triangle';
      oscillator.frequency.value = frequency;
      envelope.gain.setValueAtTime(0.001, time);
      envelope.gain.exponentialRampToValueAtTime(0.11, time + 0.012);
      envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.105);
      oscillator.connect(envelope).connect(audio.destination);
      oscillator.start(time);
      oscillator.stop(time + 0.11);
    });
  }

  function clearPickupEffects() {
    pickupLayer?.getAnimations?.({ subtree: true }).forEach((animation) => animation.cancel());
    pickupLayer?.remove();
    pickupLayer = undefined;
    scorePop?.cancel();
    scorePop = undefined;
  }

  function showPickup({ cols, rows, food }) {
    if (!score.animate) return;
    if (!pickupLayer) {
      pickupLayer = document.createElement('div');
      pickupLayer.setAttribute('aria-hidden', 'true');
      pickupLayer.style.cssText = 'position:absolute;inset:0;overflow:hidden;pointer-events:none';
      canvas.after(pickupLayer);
    }

    const group = document.createElement('div');
    const playableFraction = 1 - boardInset * 2;
    const x = boardInset + playableFraction * (food.x + 0.5) / cols;
    const y = boardInset + playableFraction * (food.y + 0.5) / rows;
    group.style.cssText = `position:absolute;left:${x * 100}%;top:${y * 100}%`;
    pickupLayer.append(group);

    const label = document.createElement('span');
    label.textContent = '+1';
    label.style.cssText = 'position:absolute;white-space:nowrap;color:#ffe59c;font:800 14px/1 var(--mono);text-shadow:1px 2px #3d321d;opacity:0';
    group.append(label);

    const reduced = reducedMotion.matches;
    const labelY = food.y === 0 ? 5 : -10;
    const labelStart = `translate(-50%, ${labelY}px)`;
    const labelEnd = `translate(-50%, ${reduced ? labelY : labelY - 18}px)`;
    const labelAnimation = label.animate([
      { transform: labelStart, opacity: 1 },
      { opacity: 1, offset: 0.45 },
      { transform: labelEnd, opacity: 0 },
    ], { duration: reduced ? 160 : 340, easing: pickupEase });
    labelAnimation.onfinish = () => {
      group.remove();
      if (pickupLayer && !pickupLayer.firstChild) {
        pickupLayer.remove();
        pickupLayer = undefined;
      }
    };
    if (reduced) return;

    for (const [dx, dy, color] of [
      [-14, -12, '#ffe59c'], [16, -13, '#ffe59c'],
      [-19, 3, '#edb84f'], [20, 4, '#edb84f'], [3, 17, '#ffe59c'],
    ]) {
      const pixel = document.createElement('span');
      pixel.style.cssText = `position:absolute;left:-2px;top:-2px;width:4px;height:4px;background:${color};box-shadow:1px 1px #7e592f;opacity:0`;
      group.append(pixel);
      pixel.animate([
        { transform: `translate(${dx / 3}px, ${dy / 3}px)`, opacity: 1 },
        { transform: `translate(${dx}px, ${dy}px) scale(0.75)`, opacity: 0 },
      ], { duration: 235, easing: pickupEase });
    }

    scorePop?.cancel();
    const pop = score.animate([
      { transform: 'scale(1)' },
      { transform: 'scale(1.16)', offset: 0.36 },
      { transform: 'scale(1)' },
    ], { duration: 160, easing: pickupEase });
    scorePop = pop;
    pop.onfinish = () => {
      if (scorePop === pop) scorePop = undefined;
    };
  }

  function tick() {
    const previous = game.state;
    game.tick();
    const state = game.state;
    const ate = state.score > previous.score;
    if (ate) {
      updateBest(state.score);
      playSound([550, 740]);
    }
    if (state.status === 'lost') playSound([260, 155]);
    render();
    if (ate) showPickup(previous);
    if (state.status === 'running') scheduleTick();
  }

  function scheduleTick() {
    const delay = Math.max(90, 250 - game.state.score * 8);
    tickId = window.setTimeout(tick, delay);
  }

  function begin(heading) {
    if (game.state.status !== 'paused') {
      clearPickupEffects();
      fitNewRound();
    }
    game.start();
    if (heading) game.steer(heading);
    render();
    scheduleTick();
  }

  function pause() {
    game.pause();
    window.clearTimeout(tickId);
    render();
  }

  function activate() {
    if (game.state.status === 'running') pause();
    else begin();
  }

  function steer(heading) {
    if (game.state.status === 'ready') begin(heading);
    else if (game.state.status === 'running') game.steer(heading);
  }

  start.addEventListener('click', activate);
  document.querySelectorAll('[data-dir]').forEach((button) => {
    button.addEventListener('click', () => steer(button.dataset.dir));
  });

  document.addEventListener('keydown', (event) => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
    if (Object.hasOwn(arrowKeys, event.key)) {
      event.preventDefault();
      if (!event.repeat) steer(arrowKeys[event.key]);
    } else if (event.code === 'Space' && !event.target.closest?.('button, a')) {
      event.preventDefault();
      if (!event.repeat) activate();
    }
  });

  canvas.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary || event.button !== 0) return;
    swipe = { id: event.pointerId, x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
  });

  function trackSwipe(event) {
    if (!swipe || swipe.id !== event.pointerId) return;
    const x = event.clientX - swipe.x;
    const y = event.clientY - swipe.y;
    if (Math.max(Math.abs(x), Math.abs(y)) < 18) return;
    if (Math.abs(x) > Math.abs(y)) steer(x > 0 ? 'right' : 'left');
    else steer(y > 0 ? 'down' : 'up');
    swipe = undefined;
  }

  canvas.addEventListener('pointermove', trackSwipe);
  canvas.addEventListener('pointerup', trackSwipe);
  canvas.addEventListener('lostpointercapture', (event) => {
    if (swipe?.id === event.pointerId) swipe = undefined;
  });

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  sound.disabled = !AudioContext;
  sound.addEventListener('click', async () => {
    soundEnabled = !soundEnabled;
    sound.setAttribute('aria-pressed', String(soundEnabled));
    if (!soundEnabled) return;
    try {
      audio ??= new AudioContext();
      await audio.resume();
      playSound([500]);
    } catch {
      soundEnabled = false;
      sound.setAttribute('aria-pressed', 'false');
    }
  });

  const fullscreenRoot = document.documentElement;
  fullscreen.disabled = !document.fullscreenEnabled || !fullscreenRoot.requestFullscreen;
  fullscreen.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await fullscreenRoot.requestFullscreen();
    } catch {
      updateText(status, '無法切換全螢幕');
    }
  });
  document.addEventListener('fullscreenchange', () => {
    fullscreen.setAttribute('aria-pressed', String(Boolean(document.fullscreenElement)));
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && game.state.status === 'running') pause();
  });
  function resize() {
    clearPickupEffects();
    const { status } = game.state;
    if (status === 'ready') {
      fitNewRound();
    } else if (status === 'running' || status === 'paused') {
      const { clientWidth: width, clientHeight: height } = canvas;
      if (width && height && Math.max(width, height) > Math.min(width, height) * 1.05) {
        game.orient(width > height);
      }
    }
    render();
  }

  compact.addEventListener('change', resize);
  reducedMotion.addEventListener('change', clearPickupEffects);
  window.addEventListener('resize', resize);
  new ResizeObserver(resize).observe(canvas);
  render();
})();
