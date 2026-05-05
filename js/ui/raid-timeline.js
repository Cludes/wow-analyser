import { CLASS_COLORS, fmtTime } from '../constants.js';

export function renderRaidTimeline(container, fight, deaths, cooldownUsages, timelineEvents) {
  container.innerHTML = `
    <div class="rt-wrap">
      <canvas id="rt-canvas"></canvas>
    </div>
  `;
  requestAnimationFrame(() => drawTimeline(fight, deaths, cooldownUsages, timelineEvents));
}

function drawTimeline(fight, deaths, cooldownUsages, timelineEvents) {
  const canvas = document.getElementById('rt-canvas');
  if (!canvas) return;
  const wrap = canvas.parentElement;

  const W      = wrap.clientWidth || 900;
  const dur    = fight.duration;
  const PAD    = 16;
  const LABEL  = 100;
  const drawW  = W - LABEL - PAD;

  // row definitions
  const rows = [
    { id: 'deaths',    label: 'Deaths',    color: '#e63946' },
    { id: 'cooldowns', label: 'Cooldowns', color: '#4361ee' },
  ];

  const ROW_H = 48;
  const TICK_H = 28;
  const H = TICK_H + rows.length * ROW_H + PAD * 2;

  canvas.width  = W;
  canvas.height = H;
  canvas.style.height = H + 'px';

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'hsl(222,22%,7%)';
  ctx.fillRect(0, 0, W, H);

  function xOf(t) { return LABEL + (t / dur) * drawW; }

  // ticks
  const tickEvery = niceTick(dur);
  ctx.fillStyle = 'hsl(220,8%,58%)';
  ctx.font = '11px monospace';
  ctx.textAlign = 'center';
  for (let t = 0; t <= dur; t += tickEvery) {
    const x = xOf(t);
    ctx.fillText(fmtTime(t), x, TICK_H - 6);
    ctx.strokeStyle = '#ffffff0a';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, TICK_H); ctx.lineTo(x, H - PAD); ctx.stroke();
  }

  // separator
  ctx.strokeStyle = '#ffffff14';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(LABEL, 0); ctx.lineTo(LABEL, H); ctx.stroke();

  const _tips = [];

  rows.forEach((row, ri) => {
    const y0 = TICK_H + ri * ROW_H;
    // row bg
    ctx.fillStyle = ri % 2 === 0 ? '#ffffff04' : '#00000018';
    ctx.fillRect(0, y0, W, ROW_H);
    // label
    ctx.fillStyle = row.color;
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(row.label, PAD, y0 + ROW_H / 2 + 4);

    if (row.id === 'deaths') {
      for (const d of deaths) {
        const x  = xOf(d.timestamp);
        const cy = y0 + ROW_H / 2;
        const r  = 8;
        ctx.fillStyle = '#e63946cc';
        ctx.beginPath(); ctx.arc(x, cy, r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✕', x, cy + 4);
        _tips.push({ x: x-r, y: cy-r, w: r*2, h: r*2, label: `${d.targetName} died @ ${fmtTime(d.timestamp)} - ${d.killingBlow}` });
      }
    }

    if (row.id === 'cooldowns') {
      for (const cd of cooldownUsages) {
        const x  = xOf(cd.t);
        const bw = cd.duration > 0 ? Math.max(4, (cd.duration / dur) * drawW) : 6;
        const bh = 24;
        const by = y0 + (ROW_H - bh) / 2;
        ctx.fillStyle = (CLASS_COLORS[cd.class] ?? '#4361ee') + 'bb';
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(x, by, bw, bh, 3) : ctx.rect(x, by, bw, bh);
        ctx.fill();
        _tips.push({ x, y: by, w: bw, h: bh, label: `${cd.sourceName}: ${cd.spellName} @ ${fmtTime(cd.t)}` });
      }
    }
  });

  // wipe/kill marker at end
  const ex = xOf(dur);
  ctx.strokeStyle = fight.kill ? '#2ded68' : '#e63946';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 3]);
  ctx.beginPath(); ctx.moveTo(ex, TICK_H); ctx.lineTo(ex, H - PAD); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = fight.kill ? '#2ded68' : '#e63946';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(fight.kill ? 'KILL' : 'WIPE', ex, H - PAD - 2);

  installCanvasTooltip(canvas, _tips);
}

function niceTick(dur) {
  if (dur < 60_000)  return 10_000;
  if (dur < 180_000) return 30_000;
  if (dur < 600_000) return 60_000;
  return 120_000;
}

function installCanvasTooltip(canvas, tips) {
  let el = document.getElementById('rt-tooltip');
  if (!el) {
    el = document.createElement('div');
    el.id = 'rt-tooltip';
    el.className = 'canvas-tooltip';
    document.body.appendChild(el);
  }
  canvas.onmousemove = (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const hit = tips.find(t => mx >= t.x && mx <= t.x+t.w && my >= t.y && my <= t.y+t.h);
    if (hit) {
      el.textContent = hit.label;
      el.style.display = 'block';
      el.style.left = (e.clientX + 12) + 'px';
      el.style.top  = (e.clientY - 8) + 'px';
    } else {
      el.style.display = 'none';
    }
  };
  canvas.onmouseleave = () => { el.style.display = 'none'; };
}
