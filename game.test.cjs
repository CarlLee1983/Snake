const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createGame } = require('./game.js');

test('a started game advances one cell in the requested direction', () => {
  const game = createGame({ cols: 17, rows: 11 });
  const initial = game.state;
  game.tick();
  assert.deepEqual(game.state.snake, initial.snake);

  game.start();
  game.steer('up');
  game.tick();

  assert.equal(game.state.status, 'running');
  assert.deepEqual(game.state.snake[0], { x: 9, y: 4 });
  assert.deepEqual(game.state.snake[1], { x: 9, y: 5 });
  assert.equal(game.state.snake.length, initial.snake.length);
});

test('eating grows the snake, scores a point and places an apple in a free cell', () => {
  const game = createGame({ cols: 17, rows: 11, random: () => 0 });
  game.start();
  game.tick();
  game.tick();

  assert.equal(game.state.score, 1);
  assert.equal(game.state.snake.length, 7);
  assert.deepEqual(game.state.snake[0], { x: 11, y: 5 });
  assert.deepEqual(game.state.food, { x: 0, y: 0 });
});

for (const [edge, headings, expected] of [
  ['right', [['right', 8]], { x: 0, y: 5 }],
  ['left', [['up', 1], ['left', 10]], { x: 16, y: 4 }],
  ['top', [['up', 6]], { x: 9, y: 10 }],
  ['bottom', [['down', 6]], { x: 9, y: 0 }],
]) {
  test(`crossing the ${edge} edge wraps to the opposite side`, () => {
    const game = createGame({ cols: 17, rows: 11, random: () => 0 });
    game.start();
    for (const [direction, count] of headings) {
      game.steer(direction);
      for (let step = 0; step < count; step += 1) game.tick();
    }

    assert.equal(game.state.status, 'running');
    assert.deepEqual(game.state.snake[0], expected);
  });
}

test('turning into the snake body ends the game', () => {
  const game = createGame({ cols: 17, rows: 11 });
  game.start();
  game.tick();
  for (const direction of ['down', 'left', 'up']) {
    game.steer(direction);
    game.tick();
  }

  assert.equal(game.state.status, 'lost');
  assert.deepEqual(game.state.snake[0], { x: 9, y: 6 });
});

test('a wrapped move into the snake body still ends the game', () => {
  const game = createGame({ cols: 7, rows: 5 });
  game.start();
  game.steer('up');
  game.tick();
  game.tick();
  game.steer('right');
  game.tick();
  game.steer('down');
  for (let step = 0; step < 4; step += 1) game.tick();

  assert.equal(game.state.status, 'running');
  assert.deepEqual(game.state.snake[0], { x: 5, y: 4 });
  game.tick();
  assert.equal(game.state.status, 'lost');
  assert.deepEqual(game.state.snake[0], { x: 5, y: 4 });
});

test('replaying restores a fresh board and resets the score after a loss', () => {
  const game = createGame({ cols: 17, rows: 11, random: () => 0 });
  const fresh = game.state;
  game.start();
  game.tick();
  game.tick();
  for (const direction of ['down', 'left', 'up']) {
    game.steer(direction);
    game.tick();
  }
  assert.equal(game.state.score, 1);
  assert.equal(game.state.status, 'lost');

  game.start();

  assert.equal(game.state.score, 0);
  assert.equal(game.state.status, 'running');
  assert.deepEqual(game.state.snake, fresh.snake);
  assert.deepEqual(game.state.food, fresh.food);
  game.tick();
  assert.deepEqual(game.state.snake[0], { x: 10, y: 5 });
});

test('the snake ignores a turn that would immediately reverse its last move', () => {
  const game = createGame({ cols: 17, rows: 11 });
  game.start();
  game.steer('left');
  game.tick();

  assert.equal(game.state.status, 'running');
  assert.deepEqual(game.state.snake[0], { x: 10, y: 5 });
});

test('two quick turns run in order on successive ticks', () => {
  const game = createGame({ cols: 17, rows: 11 });
  game.start();
  game.steer('up');
  game.steer('down');
  game.steer('left');
  game.tick();

  assert.equal(game.state.status, 'running');
  assert.deepEqual(game.state.snake[0], { x: 9, y: 4 });
  game.tick();
  assert.deepEqual(game.state.snake[0], { x: 8, y: 4 });
});

test('changing orientation preserves the round and remaps buffered turns', () => {
  const game = createGame({ cols: 17, rows: 11, random: () => 0.25 });
  game.start();
  game.tick();
  game.tick();
  game.steer('up');
  game.steer('right');

  game.orient(false);
  game.orient(false);
  assert.equal(game.state.status, 'running');
  assert.equal(game.state.score, 1);
  assert.deepEqual([game.state.cols, game.state.rows], [11, 17]);
  assert.deepEqual(game.state.snake.slice(0, 3), [{ x: 5, y: 11 }, { x: 5, y: 10 }, { x: 5, y: 9 }]);
  assert.deepEqual(game.state.food, { x: 2, y: 11 });
  assert.deepEqual(game.state.direction, { x: 0, y: 1 });
  game.tick();
  assert.deepEqual(game.state.snake[0], { x: 4, y: 11 });
  game.tick();
  assert.deepEqual(game.state.snake[0], { x: 4, y: 12 });

  game.pause();
  game.orient(true);
  assert.equal(game.state.status, 'paused');
  assert.equal(game.state.score, 1);
  assert.deepEqual([game.state.cols, game.state.rows], [17, 11]);
  assert.deepEqual(game.state.snake[0], { x: 12, y: 4 });
  game.start();
  game.tick();
  assert.deepEqual(game.state.snake[0], { x: 13, y: 4 });
});
