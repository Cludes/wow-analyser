import { CLASS_COLORS, fmt } from '../constants.js';

export function renderMistakes(container, { deaths, avoidable, underperformers, interrupts }, roastMode) {
  const hasData = deaths.length || avoidable.length || underperformers.length;
  container.innerHTML = `
    <div class="mistakes-header">
      <h2 class="mistakes-title">${roastMode ? '🔥 Raid Report Card' : 'Performance Analysis'}</h2>
      <p class="mistakes-sub">${roastMode ? 'No feelings were spared in the making of this analysis.' : 'Objective performance summary.'}</p>
    </div>
    ${!hasData ? '<div class="empty-state">No issues detected. Suspicious.</div>' : ''}
    ${deaths.length ? renderSection('Deaths', 'skull', deaths.map(d => makeCard(d, 'death'))) : ''}
    ${avoidable.length ? renderSection('Avoidable Damage', 'shield-off', avoidable.map(d => makeCard(d, 'avoidable'))) : ''}
    ${underperformers.length ? renderSection('DPS Check', 'trending-down', underperformers.map(d => makeCard(d, 'dps'))) : ''}
    ${interrupts.length ? renderSection('Interrupt Heroes', 'zap', [renderInterruptTable(interrupts)]) : ''}
  `;
}

function renderSection(title, icon, cards) {
  return `
    <div class="mistake-section">
      <div class="mistake-section-header">
        <span class="mistake-icon icon-${icon}"></span>
        <span class="mistake-section-title">${title}</span>
      </div>
      <div class="mistake-cards">${cards.join('')}</div>
    </div>`;
}

function makeCard(d, type) {
  const color = CLASS_COLORS[d.class] ?? '#888';
  const sev   = d.severity ?? 'info';
  const extra = buildExtra(d, type);
  return `
    <div class="mistake-card sev-${sev}" style="border-left-color:${color}">
      <div class="mc-player" style="color:${color}">${d.player}</div>
      <div class="mc-message">${d.message}</div>
      ${extra}
    </div>`;
}

function buildExtra(d, type) {
  if (type === 'death' && d.deaths?.length) {
    return `<div class="mc-times">${d.deaths.map(x => `<span class="time-chip">${x.at} - ${x.cause}</span>`).join('')}</div>`;
  }
  if (type === 'avoidable') {
    return `<div class="mc-sub">${fmt(d.total)} total</div>`;
  }
  if (type === 'dps') {
    return `<div class="mc-sub">${d.pct}% below raid average</div>`;
  }
  return '';
}

function renderInterruptTable(interrupts) {
  return `
    <div class="interrupt-table">
      ${interrupts.map(i => `
        <div class="int-row">
          <span class="int-name">${i.player}</span>
          <span class="int-count">${i.count}x</span>
          <span class="int-times">${i.times.slice(0,5).join(', ')}${i.times.length > 5 ? '…' : ''}</span>
        </div>`).join('')}
    </div>`;
}
