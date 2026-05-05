import { CLASS_COLORS, fmt, fmtTime } from '../constants.js';

let chartInstance = null;

export function renderDpsChart(container, graphSeries, tableSeries, mode, fight) {
  container.innerHTML = `
    <div class="chart-controls">
      <div class="chart-toggle-group">
        <button class="toggle-btn ${mode==='dps'?'active':''}" data-mode="dps">DPS</button>
        <button class="toggle-btn ${mode==='hps'?'active':''}" data-mode="hps">HPS</button>
      </div>
      <div class="chart-legend" id="dps-legend"></div>
    </div>
    <div class="chart-wrap">
      <canvas id="dps-canvas"></canvas>
    </div>
    <div class="section-title">Player Breakdown</div>
    <div class="player-stat-table" id="player-stat-table"></div>
  `;

  buildChart(graphSeries, fight);
  renderPlayerTable(container.querySelector('#player-stat-table'), tableSeries, mode);
  renderLegend(container.querySelector('#dps-legend'), graphSeries);
}

function buildChart(series, fight) {
  if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
  const canvas = document.getElementById('dps-canvas');
  if (!canvas) return;

  // Determine common time axis from first series
  const allTimes = new Set();
  for (const s of series) s.data.forEach(p => allTimes.add(p.t));
  const times = [...allTimes].sort((a, b) => a - b);
  const labels = times.map(t => fmtTime(t));

  const datasets = series.map(s => {
    const color = CLASS_COLORS[s.class] ?? '#888888';
    const dataMap = new Map(s.data.map(p => [p.t, p.v]));
    return {
      label: s.name,
      data:  times.map(t => Math.round(dataMap.get(t) ?? 0)),
      borderColor: color,
      backgroundColor: color + '18',
      borderWidth: 1.5,
      pointRadius: 0,
      pointHoverRadius: 4,
      tension: 0.3,
      fill: false,
    };
  });

  chartInstance = new Chart(canvas, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      animation: { duration: 400 },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(7,9,20,0.97)',
          borderColor: 'rgba(250,183,0,0.25)',
          borderWidth: 1,
          titleColor: '#fab700',
          bodyColor: 'hsl(44,6%,68%)',
          padding: 10,
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: ${fmt(ctx.raw)}/s`,
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: '#6a6a8a',
            maxTicksLimit: 12,
            font: { size: 11 },
          },
          grid: { color: '#ffffff08' },
        },
        y: {
          ticks: {
            color: '#6a6a8a',
            font: { size: 11 },
            callback: v => fmt(v),
          },
          grid: { color: '#ffffff08' },
        },
      },
    },
  });
}

function renderLegend(el, series) {
  if (!el) return;
  el.innerHTML = series.map(s => {
    const color = CLASS_COLORS[s.class] ?? '#888';
    return `<span class="legend-item">
      <span class="legend-dot" style="background:${color}"></span>${s.name}
    </span>`;
  }).join('');
}

function renderPlayerTable(el, entries, mode) {
  if (!el || !entries.length) return;
  const max = entries[0].total;
  const label = mode === 'hps' ? 'HPS' : 'DPS';
  el.innerHTML = `
    <div class="pst-header">
      <span></span><span>Player</span><span></span>
      <span class="h-r">${label}</span>
      <span class="h-r">Total</span>
      <span class="h-r">Active</span>
      <span class="h-r">iLvl</span>
    </div>` + entries.map((e, i) => {
    const color = CLASS_COLORS[e.class] ?? '#888';
    const barW  = max > 0 ? (e.total / max * 100) : 0;
    return `
      <div class="pst-row player-row" data-id="${e.id}" data-name="${e.name}">
        <div class="pst-rank">${i+1}</div>
        <div class="pst-name" style="color:${color}">${e.name}</div>
        <div class="pst-bar-wrap">
          <div class="pst-bar" style="width:${barW}%;background:linear-gradient(90deg,${color}40,${color}18);border-left:2px solid ${color}"></div>
        </div>
        <div class="pst-ps">${fmt(e.perSecond)}/s</div>
        <div class="pst-total">${fmt(e.total)}</div>
        <div class="pst-active">${Math.round(e.activeTime/1000)}s active</div>
        <div class="pst-ilvl">${e.ilvl ? e.ilvl + ' ilvl' : ''}</div>
      </div>`;
  }).join('');
}
