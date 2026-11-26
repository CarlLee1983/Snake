(() => {
  "use strict";

  const backdrops = new WeakMap();
  const grassColors = ["#adca7d", "#a7c578", "#b0cc81", "#abc97b"];
  const petalColors = [
    ["#fff0cf", "#dbd58e"], ["#f8baaf", "#d98683"],
    ["#ffdc8a", "#eab968"], ["#e6cee8", "#beaacf"]
  ];
  const apple = [
    "...........lLL..",
    "..........lLLLl.",
    ".......db.lLll..",
    ".......dbll.....",
    "........db......",
    "...ooo..dooo....",
    "..orrrooorrro...",
    ".orHHrrrrrrrso..",
    ".orHrRrrrrrrsso.",
    "orrrrRrrrrrrsso.",
    "orrrrRrrrrrssso.",
    "orrrrrrrrrrssso.",
    ".orrrrrrrsssso..",
    ".orrrrrssssso...",
    "..ooossssooo....",
    ".....oooo......."
  ];
  const appleColors = {
    o: "#823239", d: "#79543a", b: "#af7949", l: "#3d7b57", L: "#93bd60",
    r: "#ef534b", R: "#fa7960", s: "#c43646", H: "#ffd39f"
  };

  function rect(ctx, color, x, y, width, height) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
  }

  // Horizontal scan lines pin the curves to the same pixel grid as the sprite art.
  function ovalPath(ctx, x, y, rx, ry) {
    const first = Math.ceil(y - ry);
    const last = Math.floor(y + ry);
    for (let row = first; row <= last; row++) {
      const half = rx * Math.sqrt(Math.max(0, 1 - ((row - y) / ry) ** 2));
      const left = Math.ceil(x - half);
      const right = Math.floor(x + half);
      if (right >= left) ctx.rect(left, row, right - left + 1, 1);
    }
  }

  function oval(ctx, color, x, y, rx, ry) {
    ctx.beginPath();
    ovalPath(ctx, x, y, rx, ry);
    ctx.fillStyle = color;
    ctx.fill();
  }

  function randomizer(seed) {
    return () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }

  function grass(ctx, x, y, size, light = false) {
    rect(ctx, light ? "#c1d490" : "#89ad61", x - size, y - size, size, size * 2);
    rect(ctx, light ? "#a9c574" : "#7ca15a", x, y, size, size * 2);
    rect(ctx, light ? "#c8d894" : "#96b66a", x + size, y - size * 2, size, size * 3);
    rect(ctx, "#a0bc70", x + 2 * size, y - size, size, size);
  }

  function blossom(ctx, x, y, size, palette) {
    const [petal, shade] = palette;
    rect(ctx, "#82a95e", x, y, size, size * 4);
    rect(ctx, "#97b866", x + size, y + size, size * 2, size);
    rect(ctx, shade, x - size * 2, y - size, size * 5, size * 2);
    rect(ctx, petal, x - size, y - size * 2, size * 3, size * 4);
    rect(ctx, petal, x - size * 2, y - size, size * 5, size);
    rect(ctx, "#edb966", x, y - size, size, size);
  }

  function shrub(ctx, x, y, size, color, light, shade) {
    oval(ctx, "#778d54", x + size * .16, y + size * .32, size * .94, size * .55);
    oval(ctx, shade, x, y + size * .05, size * .90, size * .65);
    oval(ctx, color, x - size * .27, y - size * .12, size * .59, size * .51);
    oval(ctx, color, x + size * .25, y - size * .15, size * .63, size * .51);
    oval(ctx, light, x - size * .19, y - size * .30, size * .40, size * .24);
    oval(ctx, light, x + size * .38, y - size * .22, size * .25, size * .19);
    const fleck = Math.max(1, Math.round(size / 9));
    rect(ctx, "#c1cc72", Math.round(x - size * .48), Math.round(y - size * .26), fleck * 2, fleck);
    rect(ctx, "#bdcd72", Math.round(x + size * .44), Math.round(y - size * .35), fleck, fleck);
  }

  function orchardTree(ctx, x, y, size, seed) {
    const random = randomizer(seed);
    oval(ctx, "#8ca768", x + size * .3, y + size * .35, size * 1.12, size * .76);
    oval(ctx, "#78975c", x + size * .23, y + size * .25, size * .89, size * .69);
    oval(ctx, "#426e4c", x, y + size * .08, size, size * .86);
    const crowns = [
      [-.55, .14, .48], [.40, .24, .52], [-.14, .39, .49],
      [.47, -.21, .60], [-.50, -.29, .54], [-.01, -.04, .63],
      [.11, -.46, .61], [-.30, -.52, .42]
    ];
    crowns.forEach(([dx, dy, radius], i) => {
      const cx = x + dx * size;
      const cy = y + dy * size;
      const r = radius * size;
      oval(ctx, "#507b4d", cx, cy + r * .11, r, r * .74);
      oval(ctx, ["#6e9955", "#71a158", "#73a052"][i % 3], cx - r * .06, cy, r * .93, r * .69);
      oval(ctx, ["#8db45d", "#9bbf66", "#86b15c"][i % 3], cx - r * .17, cy - r * .23, r * .74, r * .47);
      for (let n = 0; n < 2; n++) {
        const leafX = cx + (random() - .55) * r * .72;
        const leafY = cy - (.20 + n * .16) * r;
        oval(ctx, i % 3 ? "#acc971" : "#a1c16a", leafX, leafY, r * .22, r * .095);
      }
    });
    for (const [dx, dy] of [[-.44, .11], [-.16, -.4], [.36, -.25], [.51, .13], [.02, .26]]) {
      const ox = x + dx * size;
      const oy = y + dy * size;
      const r = Math.max(1, size / 12);
      oval(ctx, "#85613c", ox, oy, r * 1.35, r);
      oval(ctx, "#d28b55", ox - .4, oy - .5, r, r * .83);
      rect(ctx, "#f3b878", Math.round(ox - r * .45), Math.round(oy - r * .4), 1, 1);
    }
  }

  function groundDetail(ctx, x, y, scale, type) {
    if (type === 0) {
      oval(ctx, "#86a568", x + scale, y + scale, scale * 3, scale * 1.5);
      oval(ctx, "#8b9a76", x, y, scale * 2.4, scale * 1.65);
      oval(ctx, "#b9bd98", x - scale * .5, y - scale * .7, scale * 1.7, scale);
    } else {
      oval(ctx, "#8aa769", x + scale, y + scale, scale * 3, scale * 1.5);
      rect(ctx, "#e4ce9c", x - scale, y - scale, scale * 2, scale * 3);
      oval(ctx, "#a67855", x, y - scale, scale * 2.8, scale * 1.45);
      oval(ctx, "#e0a071", x - scale * .4, y - scale * 1.6, scale * 2.3, scale * 1.3);
      rect(ctx, "#f7d3a4", x - scale, y - scale * 2, scale, scale);
    }
  }

  function fern(ctx, x, y, size) {
    oval(ctx, "#9cb46c", x, y + size * 2, size * 8, size * 3);
    rect(ctx, "#729257", x, y - size * 5, size, size * 10);
    for (let leaf = 1; leaf <= 3; leaf++) {
      const row = y + (leaf - 2) * size * 2;
      const span = size * (leaf + 2);
      rect(ctx, "#81a658", x - span, row, span, size);
      rect(ctx, "#a7bc64", x - span - size, row - size, span, size);
      rect(ctx, "#739a54", x + size, row + size, span - size, size);
      rect(ctx, "#95b25f", x + size * 2, row, span - size, size);
    }
    rect(ctx, "#a5bb66", x, y - size * 6, size * 2, size * 2);
  }

  function lily(ctx, x, y, size, bloom) {
    oval(ctx, "#5b9585", x + size * .13, y + size * .19, size, size * .66);
    oval(ctx, "#6ba36f", x, y, size, size * .64);
    oval(ctx, "#98c37c", x - size * .10, y - size * .15, size * .81, size * .41);
    rect(ctx, "#77bcab", Math.round(x + size * .45), Math.round(y - size * .15), Math.max(1, Math.round(size * .58)), Math.max(1, Math.round(size * .23)));
    rect(ctx, "#577d5f", Math.round(x + size * .24), Math.round(y - size * .06), Math.max(1, Math.round(size * .32)), 1);
    if (bloom) {
      oval(ctx, "#b97d90", x - size * .1, y - size * .35, size * .52, size * .29);
      oval(ctx, "#f0bec4", x - size * .16, y - size * .56, size * .48, size * .22);
      oval(ctx, "#fbe0d0", x - size * .22, y - size * .71, size * .21, size * .29);
      oval(ctx, "#ffe296", x - size * .12, y - size * .48, size * .19, size * .11);
    }
  }

  function cattail(ctx, x, y, size, flip) {
    const left = flip ? -1 : 1;
    rect(ctx, "#607d54", x, y - size * 8, size, size * 9);
    rect(ctx, "#7b9e60", x + size * left, y - size * 4, size, size * 4);
    rect(ctx, "#8eae62", x + size * 2 * left, y - size * 5, size, size * 2);
    rect(ctx, "#799658", x - size * left, y - size * 3, size, size * 3);
    rect(ctx, "#89a95e", x - size * 2 * left, y - size * 4, size, size * 2);
    oval(ctx, "#946541", x, y - size * 8, size * .92, size * 2.08);
    rect(ctx, "#b78b56", x, y - size * 9, size, size * 2);
  }

  function lilyPond(ctx, x, y, unit) {
    const layers = [
      ["#85a561", 1.13, .075], ["#769d68", 1.04, .027],
      ["#c4c185", 1, 0], ["#9eb585", .94, .017],
      ["#589f94", .90, .038], ["#74c3b5", .82, .006],
      ["#84cebf", .67, -.043]
    ];
    for (const [color, radius, offset] of layers) {
      ctx.beginPath();
      ovalPath(ctx, x - unit * .34, y + unit * offset, unit * 1.67 * radius, unit * 1.03 * radius);
      ovalPath(ctx, x + unit * .52, y + unit * (.27 + offset), unit * 1.24 * radius, unit * .82 * radius);
      ctx.fillStyle = color;
      ctx.fill();
    }
    for (const [dx, dy, stretch] of [[-.41, -.62, .21], [.65, -.39, .28], [1.23, .28, .16], [-.09, .33, .37], [.76, .72, .20]]) {
      const px = Math.round(x + unit * dx);
      const py = Math.round(y + unit * dy);
      const line = Math.max(2, Math.round(unit * stretch));
      oval(ctx, "#a8dac3", px, py, line, Math.max(1, unit * .018));
      oval(ctx, "#8dcab7", px - line * .6, py + unit * .07, line * .7, Math.max(1, unit * .016));
    }
    lily(ctx, x - unit * .41, y - unit * .24, unit * .22, true);
    lily(ctx, x + unit * .27, y + unit * .27, unit * .17, false);
    lily(ctx, x + unit * .85, y + unit * .45, unit * .23, true);
    const reed = Math.max(1, Math.round(unit / 24));
    cattail(ctx, Math.round(x + unit * .55), Math.round(y - unit * .70), reed, false);
    cattail(ctx, Math.round(x + unit * .77), Math.round(y - unit * .62), reed, true);
    cattail(ctx, Math.round(x + unit * 1.42), Math.round(y + unit * .12), reed, false);
    groundDetail(ctx, Math.round(x + unit * 1.58), Math.round(y + unit * .32), reed, 0);
    groundDetail(ctx, Math.round(x + unit * 1.37), Math.round(y + unit * .45), reed, 0);
  }

  function flowerCarpet(ctx, x, y, unit) {
    const size = Math.max(1, Math.round(unit / 27));
    for (const [dx, dy, palette] of [[-.71,.08,0],[-.42,-.27,0],[-.28,.18,2],[.02,-.15,0],[.36,-.34,1],[.31,.23,0],[.57,.03,2]]) {
      const px = Math.round(x + unit * dx);
      const py = Math.round(y + unit * dy);
      grass(ctx, px - size * 2, py + size * 2, size, true);
      blossom(ctx, px, py, size, petalColors[palette]);
    }
    for (const [dx, dy] of [[-.49,.48],[.54,.39]]) {
      const px = Math.round(x + unit * dx);
      const py = Math.round(y + unit * dy);
      oval(ctx, "#80a658", px - size * 1.4, py, size * 1.5, size);
      oval(ctx, "#8cb15d", px + size * 1.3, py, size * 1.5, size);
      oval(ctx, "#a0bf6d", px, py - size * 1.35, size * 1.4, size * 1.3);
    }
  }

  function orchard(ctx, width, height, board, cols, rows) {
    const { x, y, dx, dy, unit } = board;
    const random = randomizer(794117);
    rect(ctx, "#a0be72", 0, 0, width, height);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const left = Math.round(x + col * dx);
        const top = Math.round(y + row * dy);
        const tone = (row + col) % 2 + (Math.sin(col * .55 + row * .41) > .78 ? 2 : 0);
        rect(ctx, grassColors[tone], left, top, Math.round(x + (col + 1) * dx) - left, Math.round(y + (row + 1) * dy) - top);
      }
    }

    const flecks = Math.ceil(width * height / 155);
    for (let i = 0; i < flecks; i++) {
      const px = Math.floor(random() * width);
      const py = Math.floor(random() * height);
      const dark = i % 6 === 0;
      rect(ctx, dark ? "#a0bd73" : "#b3cf85", px, py, i % 9 === 0 ? 2 : 1, 1);
    }

    const sprig = Math.max(1, Math.round(unit / 23));
    const treeSize = Math.min(unit * 1.16, width * .065, height * .085);
    const groves = [
      [.025, .075, 1.05], [.101, -.013, 1.02],
      [1.002, .152, 1.29], [.945, .027, 1.46], [.870, -.020, .98],
      [.965, .99, 1.11], [1.018, .80, .85]
    ];
    const clearings = [
      [.14, .24, 1.6], [.62, .14, 1.28], [.9, .47, 1.8], [.28, .79, 1.45],
      [.05, .60, 1.22], [.76, .88, 1.31], [.44, .36, 1.33], [.49, .67, 1.42]
    ];
    ctx.globalAlpha = .16;
    clearings.forEach(([fx, fy, radius], index) => {
      const color = index % 3 === 0 ? "#93b768" : "#bfd47e";
      const r = unit * radius;
      oval(ctx, color, width * fx, height * fy, r * 1.4, r * .69);
      oval(ctx, color, width * fx + r * .9, height * fy + r * .19, r * .63, r * .37);
      oval(ctx, color, width * fx - r * .65, height * fy - r * .51, r * .61, r * .32);
    });
    ctx.globalAlpha = 1;

    for (let i = 0; i < 24; i++) {
      const px = Math.round(width * random());
      const py = Math.round(height * random());
      if (i % 3 === 0) {
        oval(ctx, "#afc879", px, py, unit * .36, unit * .19);
        grass(ctx, px, py, sprig, true);
        grass(ctx, px + sprig * 5, py + sprig * 3, sprig, true);
      } else {
        rect(ctx, "#b6ce82", px, py, sprig * 3, sprig);
        rect(ctx, "#a0bb6f", px + sprig, py + sprig, sprig, sprig);
      }
    }

    flowerCarpet(ctx, width - unit * 2.38, unit * 1.35, unit);
    flowerCarpet(ctx, width - unit * .87, unit * 2.81, unit * .71);
    for (const [fx, fy, radius] of groves) {
      const px = Math.round(width * fx);
      const py = Math.round(height * fy);
      orchardTree(ctx, px, py, treeSize * radius, Math.round((fx + fy * 9) * 11141));
      const shrubX = Math.round(px + (fx > .5 ? -1 : 1) * treeSize * .96);
      const shrubY = Math.round(py + (fy > .5 ? -1 : 1) * treeSize * .66);
      shrub(ctx, shrubX, shrubY, treeSize * .39, "#82a24e", "#9bb557", "#62864c");
    }

    lilyPond(ctx, Math.max(unit * .60, width * .045), height - unit * .77, unit * 1.10);

    const beds = [
      [.19, .04], [.32, .016], [.60, .041], [.79, .016],
      [.04, .255], [.026, .52], [.043, .68], [.976, .34], [.958, .54], [.984, .67],
      [.28, .981], [.43, .974], [.67, .960], [.83, .974]
    ];
    beds.forEach(([fx, fy], index) => {
      const cx = width * fx;
      const cy = height * fy;
      if (index % 3 !== 1) fern(ctx, Math.round(cx - unit * .55), Math.round(cy + unit * .1), sprig);
      for (let i = 0; i < 8; i++) {
        const px = Math.round(cx + (random() - .5) * unit * 1.18);
        const py = Math.round(cy + (random() - .5) * unit * .76);
        if (i % 3) grass(ctx, px, py, sprig, i % 4 === 0);
        else blossom(ctx, px, py, sprig, petalColors[(index + i) % petalColors.length]);
      }
      if (index % 2 === 0) groundDetail(ctx, Math.round(cx + unit * .28), Math.round(cy - unit * .19), sprig, index % 4);
    });
  }

  function landscape(canvas, width, height, cols, rows) {
    const cached = backdrops.get(canvas);
    if (cached?.width === width && cached.height === height && cached.cols === cols && cached.rows === rows) return cached;

    const x = Math.round(width * .022);
    const y = Math.round(height * .022);
    const dx = (width - x * 2) / cols;
    const dy = (height - y * 2) / rows;
    const board = { x, y, dx, dy, unit: Math.min(dx, dy) };
    const buffer = canvas.ownerDocument.createElement("canvas");
    buffer.width = width;
    buffer.height = height;
    orchard(buffer.getContext("2d"), width, height, board, cols, rows);
    const current = { buffer, board, width, height, cols, rows };
    backdrops.set(canvas, current);
    return current;
  }

  function centerOf(board, cell) {
    return {
      x: Math.round(board.x + board.dx * (cell.x + .5)),
      y: Math.round(board.y + board.dy * (cell.y + .5))
    };
  }

  function bodyPoints(board, snake) {
    const points = [];
    const unit = board.unit;
    let previous;
    for (let i = 0; i < snake.length; i++) {
      const cell = snake[i];
      const center = centerOf(board, cell);
      const cellsBeforeTail = snake.length - i - 1;
      const radius = unit * Math.min(.36, .15 + cellsBeforeTail * .11);
      const current = { ...center, radius };
      const priorCell = snake[i - 1];
      if (priorCell && Math.abs(priorCell.x - cell.x) + Math.abs(priorCell.y - cell.y) === 1) {
        if (!cellsBeforeTail) {
          current.x -= (cell.y - priorCell.y) * unit * .12;
          current.y += (cell.x - priorCell.x) * unit * .12;
        }
        const count = Math.max(1, Math.ceil(Math.hypot(current.x - previous.x, current.y - previous.y) / Math.max(1, unit * .13)));
        for (let j = 1; j < count; j++) {
          const t = j / count;
          points.push({
            x: previous.x + (current.x - previous.x) * t,
            y: previous.y + (current.y - previous.y) * t,
            radius: previous.radius + (current.radius - previous.radius) * t
          });
        }
      }
      points.push(current);
      previous = current;
    }
    return points;
  }

  function bodyLayer(ctx, points, color, dx, dy, scale, flatness = 1) {
    ctx.beginPath();
    for (const point of points) {
      ovalPath(ctx, point.x + dx, point.y + dy, Math.max(.7, point.radius * scale), Math.max(.65, point.radius * scale * flatness));
    }
    ctx.fillStyle = color;
    ctx.fill();
  }

  function drawHead(ctx, board, cell, direction) {
    const { x, y } = centerOf(board, cell);
    const unit = board.unit;
    const { x: forwardX, y: forwardY } = direction;
    const dot = Math.max(1, Math.round(unit / 22));
    oval(ctx, "#6e9861", x + dot, y + dot * 2, unit * .47, unit * .41);
    ctx.save();
    ctx.transform(forwardX, forwardY, -forwardY, forwardX, x, y);

    oval(ctx, "#254f42", 0, 0, unit * .47, unit * .40);
    oval(ctx, "#367e5c", -.065 * unit, 0, unit * .39, unit * .35);
    oval(ctx, "#56ae77", .060 * unit, -.016 * unit, unit * .35, unit * .31);
    oval(ctx, "#84ca89", .074 * unit, -.048 * unit, unit * .30, unit * .23);
    oval(ctx, "#a4d69b", .137 * unit, -.077 * unit, unit * .23, unit * .14);
    oval(ctx, "#a84c49", -.249 * unit, .016 * unit, unit * .090, unit * .34);
    oval(ctx, "#ec765d", -.249 * unit, -.027 * unit, unit * .077, unit * .294);
    oval(ctx, "#ffaf80", -.267 * unit, -.083 * unit, unit * .034, unit * .207);
    oval(ctx, "#aa5144", -.312 * unit, .230 * unit, unit * .129, unit * .101);
    oval(ctx, "#ec8063", -.324 * unit, .22 * unit, unit * .095, unit * .067);
    rect(ctx, "#ffb086", Math.round(-unit * .374), Math.round(unit * .19), dot * 2, dot);

    for (const side of [-1, 1]) {
      const eyeX = unit * .136;
      const eyeY = side * unit * .182;
      oval(ctx, "#376b53", eyeX, eyeY, unit * .120, unit * .114);
      oval(ctx, "#fff3d4", eyeX + dot * .32, eyeY - dot * .23, unit * .101, unit * .093);
      oval(ctx, "#233c36", eyeX + dot * 1.37, eyeY, unit * .059, unit * .074);
      rect(ctx, "#fff8e3", Math.round(eyeX + dot * 1.49), Math.round(eyeY - dot), dot, dot);
      oval(ctx, "#7fb77a", eyeX + unit * .065, eyeY + side * unit * .133, unit * .070, unit * .035);
    }
    rect(ctx, "#51865b", Math.round(unit * .31), -dot * 2, dot, dot);
    rect(ctx, "#51865b", Math.round(unit * .31), dot, dot, dot);
    ctx.restore();
  }

  function drawSnake(ctx, board, snake, direction) {
    if (!snake.length) return;
    const unit = board.unit;
    const points = bodyPoints(board, snake);
    bodyLayer(ctx, points, "#7e9f66", unit * .04, unit * .11, 1.09);
    bodyLayer(ctx, points, "#285648", 0, 0, 1.04);
    bodyLayer(ctx, points, "#428b66", 0, -unit * .016, .86);
    bodyLayer(ctx, points, "#57a876", -unit * .038, -unit * .046, .68);
    bodyLayer(ctx, points, "#78bf88", -unit * .051, -unit * .085, .40, .86);
    const dot = Math.max(1, Math.round(unit / 24));
    for (let i = 1; i + 1 < snake.length; i++) {
      const center = centerOf(board, snake[i]);
      rect(ctx, "#a1cca0", center.x - dot * 3, center.y - dot * 3, dot * 3, dot);
      rect(ctx, "#8bc395", center.x - dot * 2, center.y - dot * 2, dot * 3, dot);
      rect(ctx, "#4d976e", center.x + dot, center.y + dot * 2, dot * 2, dot);
      rect(ctx, "#4d976e", center.x + dot * 2, center.y + dot, dot * 2, dot);
    }
    drawHead(ctx, board, snake[0], direction);
  }

  function drawApple(ctx, board, food) {
    const { x, y } = centerOf(board, food);
    const unit = board.unit;
    const size = Math.max(8, Math.round(unit * .81));
    const firstX = Math.round(x - size / 2);
    const firstY = Math.round(y - size / 2 - unit * .05);
    oval(ctx, "#83a461", x + unit * .038, y + unit * .28, unit * .34, unit * .14);
    oval(ctx, "#73955a", x + unit * .044, y + unit * .25, unit * .25, unit * .10);
    apple.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) {
        const color = appleColors[row[i]];
        if (!color) continue;
        const left = Math.round(i * size / 16);
        const top = Math.round(j * size / 16);
        rect(ctx, color, firstX + left, firstY + top, Math.round((i + 1) * size / 16) - left, Math.round((j + 1) * size / 16) - top);
      }
    });
  }

  window.drawScene = (canvas, { cols, rows, snake, food, direction }) => {
    const cssWidth = canvas.clientWidth;
    const cssHeight = canvas.clientHeight;
    if (!cssWidth || !cssHeight) return;
    const dpr = window.devicePixelRatio || 1;
    const width = Math.round(cssWidth * dpr);
    const height = Math.round(cssHeight * dpr);
    const scale = Math.max(1, Math.round(Math.max(width, height) / 640));
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { buffer, board } = landscape(canvas, Math.ceil(width / scale), Math.ceil(height / scale), cols, rows);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(buffer, 0, 0);
    if (food) drawApple(ctx, board, food);
    drawSnake(ctx, board, snake, direction);
  };
})();
