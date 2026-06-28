import { useEffect, useRef } from 'react';

export function SimulationCanvas({ grid, start, goal, path, dynamicObstacles, robotIndex, running, editMode, onEditCell }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const hoverRef = useRef(null);
  const stateRef = useRef({ grid, start, goal, path, dynamicObstacles, robotIndex, running, editMode });

  stateRef.current = { grid, start, goal, path, dynamicObstacles, robotIndex, running, editMode, hover: hoverRef.current };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvas.parentElement;
    const ctx = canvas.getContext('2d', { alpha: false });
    const size = { width: 1, height: 1, dpr: window.devicePixelRatio || 1 };
    let raf = 0;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      size.dpr = window.devicePixelRatio || 1;
      size.width = Math.max(1, Math.round(rect.width));
      size.height = Math.max(1, Math.round(rect.height));
      const pixelWidth = Math.max(1, Math.round(size.width * size.dpr));
      const pixelHeight = Math.max(1, Math.round(size.height * size.dpr));
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
    };

    const draw = () => {
      ctx.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);
      renderScene(ctx, { width: size.width, height: size.height }, stateRef.current);
      raf = requestAnimationFrame(draw);
    };

    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize);
    observer?.observe(container);
    window.addEventListener('resize', resize);
    resize();
    draw();
    return () => {
      cancelAnimationFrame(raf);
      observer?.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, []);

  function updateHover(event) {
    const point = pointFromEvent(event, canvasRef.current, grid.length);
    hoverRef.current = point;
    stateRef.current.hover = point;
    return point;
  }

  function commitEdit(event) {
    if (!onEditCell) return;
    const point = updateHover(event);
    if (point) onEditCell(point, editMode);
  }

  return (
    <canvas
      ref={canvasRef}
      className={`simulation-canvas edit-${editMode}`}
      onPointerDown={event => {
        drawingRef.current = true;
        event.currentTarget.setPointerCapture?.(event.pointerId);
        commitEdit(event);
      }}
      onPointerMove={event => {
        updateHover(event);
        if (!drawingRef.current || !['draw', 'erase'].includes(editMode)) return;
        commitEdit(event);
      }}
      onPointerUp={() => { drawingRef.current = false; }}
      onPointerCancel={() => { drawingRef.current = false; }}
      onPointerLeave={() => {
        drawingRef.current = false;
        hoverRef.current = null;
        stateRef.current.hover = null;
      }}
    />
  );
}

function renderScene(ctx, rect, state) {
  const { grid, start, goal, path, dynamicObstacles, robotIndex, running, editMode, hover } = state;
  const geometry = getBoardGeometry(rect, grid.length);
  const time = performance.now();

  ctx.clearRect(0, 0, rect.width, rect.height);
  ctx.fillStyle = getCss('--map-bg');
  ctx.fillRect(0, 0, rect.width, rect.height);
  drawBackdropGrid(ctx, rect, time, running);
  drawBoardShell(ctx, geometry);
  drawCells(ctx, grid, geometry);
  if (path.length > 1) drawEnergyPath(ctx, path, geometry, time, running);
  if (robotIndex > 0) drawTrail(ctx, path.slice(0, robotIndex + 1), geometry);
  drawDynamicObstacles(ctx, dynamicObstacles, geometry, time, running);
  drawEditPreview(ctx, hover, geometry, editMode, time);
  marker(ctx, start, geometry, getCss('--map-start'), 'S');
  marker(ctx, goal, geometry, getCss('--map-goal'), 'G');
  const robot = path[Math.min(robotIndex, path.length - 1)] || start;
  marker(ctx, robot, geometry, getCss('--map-robot'), 'R', running ? 1.12 + Math.sin(time * 0.008) * 0.08 : 1);
  drawEditHint(ctx, geometry, editMode);
}

function pointFromEvent(event, canvas, size) {
  const rect = canvas.getBoundingClientRect();
  const geometry = getBoardGeometry(rect, size);
  const x = Math.floor((event.clientX - rect.left - geometry.ox) / geometry.cell);
  const y = Math.floor((event.clientY - rect.top - geometry.oy) / geometry.cell);
  if (x < 0 || y < 0 || x >= size || y >= size) return null;
  return { x, y };
}

function getBoardGeometry(rect, size) {
  const padding = rect.width < 700 ? 16 : 28;
  const cell = Math.max(6, Math.floor(Math.min((rect.width - padding * 2) / size, (rect.height - padding * 2) / size)));
  const board = cell * size;
  return {
    size,
    cell,
    board,
    ox: (rect.width - board) / 2,
    oy: (rect.height - board) / 2,
  };
}

function drawBackdropGrid(ctx, rect, time, running) {
  const gap = 34;
  ctx.save();
  ctx.globalAlpha = running ? 0.34 : 0.22;
  ctx.strokeStyle = getCss('--border');
  ctx.lineWidth = 1;
  for (let x = (time * 0.01) % gap; x < rect.width; x += gap) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, rect.height);
    ctx.stroke();
  }
  for (let y = (time * 0.006) % gap; y < rect.height; y += gap) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(rect.width, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBoardShell(ctx, geometry) {
  ctx.save();
  ctx.fillStyle = 'rgba(251,250,249,0.54)';
  ctx.strokeStyle = getCss('--border');
  ctx.lineWidth = 1;
  roundRect(ctx, geometry.ox - 12, geometry.oy - 12, geometry.board + 24, geometry.board + 24, 12, true, true);
  ctx.restore();
}

function drawCells(ctx, grid, geometry) {
  const { cell, ox, oy } = geometry;
  for (let y = 0; y < geometry.size; y += 1) {
    for (let x = 0; x < geometry.size; x += 1) {
      const px = ox + x * cell;
      const py = oy + y * cell;
      ctx.fillStyle = grid[y][x] ? getCss('--map-obstacle') : 'rgba(251,250,249,0.72)';
      roundRect(ctx, px + 1, py + 1, cell - 2, cell - 2, Math.min(4, cell * 0.18), true, false);
    }
  }
}

function drawEnergyPath(ctx, path, geometry, time, running) {
  const first = toCanvas(path[0], geometry);
  const last = toCanvas(path[path.length - 1], geometry);
  const gradient = ctx.createLinearGradient(first.x, first.y, last.x, last.y);
  gradient.addColorStop(0, getCss('--map-start'));
  gradient.addColorStop(0.45, getCss('--map-path'));
  gradient.addColorStop(1, getCss('--map-goal'));
  drawPath(ctx, path, geometry, gradient, running ? 5 : 4, 0.34);
  drawPath(ctx, path, geometry, gradient, 2.3, 0.92);

  if (running) {
    const pulse = path[Math.floor((time * 0.012) % path.length)];
    const center = toCanvas(pulse, geometry);
    ctx.save();
    ctx.strokeStyle = getCss('--map-path');
    ctx.globalAlpha = 0.28;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(center.x, center.y, geometry.cell * (0.65 + Math.sin(time * 0.01) * 0.12), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawTrail(ctx, path, geometry) {
  const color = getCss('--map-robot');
  drawPath(ctx, path, geometry, color, 8, 0.14);
  drawPath(ctx, path, geometry, color, 3, 0.88);
}

function drawDynamicObstacles(ctx, obstacles, geometry, time, running) {
  obstacles.forEach((obs, index) => {
    const center = toCanvas(obs, geometry);
    const pulse = running ? 1 + Math.sin(time * 0.005 + index) * 0.16 : 1;
    ctx.save();
    ctx.strokeStyle = getCss('--danger');
    ctx.globalAlpha = 0.24;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(center.x, center.y, geometry.cell * 0.84 * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    marker(ctx, obs, geometry, getCss('--danger'), '!', pulse);
  });
}

function drawEditHint(ctx, geometry, editMode) {
  const labels = { draw: '绘制障碍', erase: '擦除障碍', start: '设置起点', goal: '设置终点' };
  const text = labels[editMode] || '地图编辑';
  ctx.save();
  ctx.font = '600 12px Fraunces, serif';
  const width = Math.max(86, ctx.measureText(text).width + 26);
  const x = geometry.ox + geometry.board - width;
  const y = Math.max(10, geometry.oy - 34);
  ctx.fillStyle = 'rgba(251, 250, 249, 0.72)';
  ctx.strokeStyle = getCss('--border');
  ctx.shadowColor = 'rgba(155, 150, 95, 0.18)';
  ctx.shadowBlur = 14;
  roundRect(ctx, x, y, width, 24, 999, true, true);
  ctx.shadowBlur = 0;
  ctx.fillStyle = getCss('--text');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + width / 2, y + 12);
  ctx.restore();
}

function drawEditPreview(ctx, hover, geometry, editMode, time) {
  if (!hover) return;
  const { cell, ox, oy } = geometry;
  const x = ox + hover.x * cell;
  const y = oy + hover.y * cell;
  const color = editMode === 'draw'
    ? getCss('--map-obstacle')
    : editMode === 'erase'
      ? getCss('--primary')
      : editMode === 'start'
        ? getCss('--map-start')
        : getCss('--map-goal');
  const pulse = 0.5 + Math.sin(time * 0.01) * 0.12;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.16;
  roundRect(ctx, x + 2, y + 2, cell - 4, cell - 4, Math.min(8, cell * 0.26), true, false);
  ctx.globalAlpha = 0.78;
  ctx.lineWidth = 2;
  roundRect(ctx, x + 1.5, y + 1.5, cell - 3, cell - 3, Math.min(8, cell * 0.26), false, true);
  ctx.globalAlpha = 0.22;
  ctx.beginPath();
  ctx.arc(x + cell / 2, y + cell / 2, cell * pulse, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = getCss('--text');
  ctx.font = '600 11px Fraunces, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${hover.x},${hover.y}`, x + cell / 2, y - 9);
  ctx.restore();
}

function getCss(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function toCanvas(point, geometry) {
  return {
    x: geometry.ox + point.x * geometry.cell + geometry.cell / 2,
    y: geometry.oy + point.y * geometry.cell + geometry.cell / 2,
  };
}

function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

function drawPath(ctx, path, geometry, color, width, alpha) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = alpha;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  path.forEach((point, index) => {
    const { x, y } = toCanvas(point, geometry);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.restore();
}

function marker(ctx, point, geometry, color, label, scale = 1) {
  const { x, y } = toCanvas(point, geometry);
  ctx.save();
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(x, y, Math.max(6, geometry.cell * 0.38) * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = getCss('--bg');
  ctx.font = `700 ${Math.max(10, geometry.cell * 0.31)}px Fraunces, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x, y + 0.5);
  ctx.restore();
}
