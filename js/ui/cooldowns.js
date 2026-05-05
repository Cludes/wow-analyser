import { CLASS_COLORS, CD_TYPE_COLORS, fmtTime } from '../constants.js';

export function renderCooldowns(container, cooldownUsages, fight) {
  container.innerHTML = `
    <div class="cd-controls">
      <div class="cd-legend">
        ${Object.entries(CD_TYPE_COLORS).map(([t,c]) => `
          <span class="cd-legend-item"><span class="cd-swatch" style="background:${c}"></span>${t}</span>
        `).join('')}
      </div>
    </div>
    <div class="cd-canvas-wrap">
      <canvas id="cd-canvas"></canvas>
    </div>
  `;

  requestAnimationFrame(() => drawCooldownCanvas(cooldownUsages, fight));
}

function drawCooldownCanvas(usages, fight) {
  const canvas = document.getElementById('cd-canvas');
  if (!canvas) return;
  const wrap = canvas.parentElement;

  // Build player rows from full fight roster sorted by role
  const roleOrder = { Tank: 0, Healer: 1, Melee: 2, Ranged: 3, DPS: 4 };
  const players = (fight.players ?? [])
    .slice()
    .sort((a, b) => (roleOrder[a.role] ?? 5) - (roleOrder[b.role] ?? 5));

  const ROW_H   = 36;
  const LABEL_W = 140;
  const TICK_H  = 24;
  const PAD     = 12;
  const dur     = fight.duration;

  canvas.width  = wrap.clientWidth || 900;
  canvas.height = TICK_H + PAD + players.length * ROW_H + PAD * 2;
  canvas.style.height = canvas.height + 'px';

  const ctx   = canvas.getContext('2d');
  const drawW = canvas.width - LABEL_W - PAD;

  function xOf(t) { return LABEL_W + (t / dur) * drawW; }

  // background
  ctx.fillStyle = '#110c09';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // timeline ticks
  const tickEvery = niceTick(dur);
  ctx.fillStyle = '#9e9278';
  ctx.font = '11px monospace';
  ctx.textAlign = 'center';
  for (let t = 0; t <= dur; t += tickEvery) {
    const x = xOf(t);
    ctx.fillText(fmtTime(t), x, TICK_H - 4);
    ctx.strokeStyle = '#ffffff0a';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, TICK_H); ctx.lineTo(x, canvas.height - PAD); ctx.stroke();
  }

  // player rows
  players.forEach((p, row) => {
    const y = TICK_H + PAD + row * ROW_H;
    const classColor = CLASS_COLORS[p.class] ?? '#888';

    // row bg
    ctx.fillStyle = row % 2 === 0 ? '#ffffff04' : '#00000020';
    ctx.fillRect(0, y, canvas.width, ROW_H);

    // player label
    ctx.fillStyle = classColor;
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(p.name, PAD, y + ROW_H / 2 + 4);

    // cooldown bars
    const playerCDs = usages.filter(u => u.sourceId === p.id || u.sourceName === p.name);
    for (const cd of playerCDs) {
      const x  = xOf(cd.t);
      const w  = cd.duration > 0 ? Math.max(4, (cd.duration / dur) * drawW) : 8;
      const bh = 20;
      const by = y + (ROW_H - bh) / 2;

      const cdColor = CD_TYPE_COLORS[cd.cdType] ?? '#555';
      ctx.fillStyle = cdColor + 'cc';
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(x, by, w, bh, 3) : ctx.rect(x, by, w, bh);
      ctx.fill();

      // label if wide enough
      if (w > 40) {
        ctx.fillStyle = '#ffffffcc';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'left';
        const label = cd.spellName.length > 14 ? cd.spellName.slice(0, 13) + '…' : cd.spellName;
        ctx.fillText(label, x + 3, by + 13);
      }

      // tooltip data stored for hover (simple approach)
      canvas._cds = canvas._cds ?? [];
      canvas._cds.push({ x, y: by, w, h: bh, label: `${cd.sourceName}: ${cd.spellName} @ ${fmtTime(cd.t)}` });
    }
  });

  // divider
  ctx.strokeStyle = '#ffffff12';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(LABEL_W, 0); ctx.lineTo(LABEL_W, canvas.height); ctx.stroke();

  // hover tooltip
  installCanvasTooltip(canvas);
}

function niceTick(dur) {
  if (dur < 60_000)  return 10_000;
  if (dur < 180_000) return 30_000;
  if (dur < 600_000) return 60_000;
  return 120_000;
}

function installCanvasTooltip(canvas) {
  let tooltip = document.getElementById('cd-tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.id = 'cd-tooltip';
    tooltip.className = 'canvas-tooltip';
    document.body.appendChild(tooltip);
  }

  canvas.onmousemove = (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const hit = (canvas._cds ?? []).find(c => mx >= c.x && mx <= c.x + c.w && my >= c.y && my <= c.y + c.h);
    if (hit) {
      tooltip.textContent = hit.label;
      tooltip.style.display = 'block';
      tooltip.style.left  = (e.clientX + 12) + 'px';
      tooltip.style.top   = (e.clientY - 8) + 'px';
    } else {
      tooltip.style.display = 'none';
    }
  };
  canvas.onmouseleave = () => { tooltip.style.display = 'none'; };
}
