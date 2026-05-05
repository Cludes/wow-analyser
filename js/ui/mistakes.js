import { CLASS_COLORS, CD_TYPE_COLORS, fmt } from '../constants.js';

export function renderMistakes(container, { deaths, avoidable, underperformers, interrupts, dispels, cooldownEff }, roastMode) {
  const hasIssues = deaths.length || avoidable.length || underperformers.length || cooldownEff.length;
  container.innerHTML = `
    <div class="mistakes-header">
      <h2 class="mistakes-title">${roastMode ? '🔥 Raid Report Card' : 'Performance Analysis'}</h2>
      <p class="mistakes-sub">${roastMode ? 'No feelings were spared in the making of this analysis.' : 'Objective performance summary.'}</p>
    </div>
    ${!hasIssues && !interrupts.total ? '<div class="empty-state">No issues detected. Suspicious.</div>' : ''}
    ${deaths.length         ? renderSection('Deaths',              'skull',         deaths.map(d => makeCard(d, 'death')))           : ''}
    ${avoidable.length      ? renderSection('Avoidable Damage',    'shield-off',    avoidable.map(d => makeCard(d, 'avoidable')))    : ''}
    ${underperformers.length? renderSection('DPS Check',           'trending-down', underperformers.map(d => makeCard(d, 'dps')))    : ''}
    ${cooldownEff.length    ? renderSection('Cooldown Efficiency', 'clock',         [renderCooldownEff(cooldownEff)])                 : ''}
    ${interrupts.total > 0  ? renderSection('Interrupts',          'zap',           [renderInterrupts(interrupts)])                  : ''}
    ${dispels.total > 0     ? renderSection('Dispels',             'refresh-cw',    [renderDispels(dispels)])                        : ''}
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

// --- Interrupts ---

function renderInterrupts({ players, topSpells, total }) {
  const topSpellHtml = topSpells.length
    ? `<div class="int-top-spells">
        <span class="int-label">Most interrupted:</span>
        ${topSpells.map(s => `<span class="int-spell-chip">${s.name} <em>${s.count}x</em></span>`).join('')}
       </div>`
    : '';

  return `
    <div class="interrupt-block">
      <div class="int-summary">${total} total interrupts</div>
      ${topSpellHtml}
      <div class="int-table">
        ${players.map(p => {
          const color = CLASS_COLORS[p.class] ?? '#888';
          const stopped = p.topStopped.map(s => `<span class="int-spell-chip">${s.name}${s.count > 1 ? ` <em>${s.count}x</em>` : ''}</span>`).join('');
          return `
            <div class="int-row">
              <span class="int-name" style="color:${color}">${p.player}</span>
              <span class="int-count">${p.count}x</span>
              <span class="int-spells">${stopped}</span>
            </div>`;
        }).join('')}
      </div>
    </div>`;
}

// --- Dispels ---

function renderDispels({ players, topSpells, total }) {
  const topSpellHtml = topSpells.length
    ? `<div class="int-top-spells">
        <span class="int-label">Most dispelled:</span>
        ${topSpells.map(s => `<span class="int-spell-chip">${s.name} <em>${s.count}x</em></span>`).join('')}
       </div>`
    : '';

  return `
    <div class="interrupt-block">
      <div class="int-summary">${total} total dispels</div>
      ${topSpellHtml}
      <div class="int-table">
        ${players.map(p => {
          const color = CLASS_COLORS[p.class] ?? '#888';
          const removed = p.topRemoved.map(s => `<span class="int-spell-chip">${s.name}${s.count > 1 ? ` <em>${s.count}x</em>` : ''}</span>`).join('');
          return `
            <div class="int-row">
              <span class="int-name" style="color:${color}">${p.player}</span>
              <span class="int-count">${p.count}x</span>
              <span class="int-spells">${removed}</span>
            </div>`;
        }).join('')}
      </div>
    </div>`;
}

// --- Cooldown efficiency ---

function renderCooldownEff(entries) {
  return `
    <div class="cd-eff-table">
      ${entries.map(e => {
        const color    = CLASS_COLORS[e.class] ?? '#888';
        const typeColor = CD_TYPE_COLORS[e.cdType] ?? '#6c757d';
        const pct      = Math.round(e.actual / e.maxPossible * 100);
        const barWidth = Math.max(4, pct);
        return `
          <div class="cd-eff-row">
            <span class="cd-eff-player" style="color:${color}">${e.player}</span>
            <span class="cd-eff-spell" style="color:${typeColor}">${e.spellName}</span>
            <div class="cd-eff-bar-wrap">
              <div class="cd-eff-bar" style="width:${barWidth}%"></div>
            </div>
            <span class="cd-eff-label">${e.actual}/${e.maxPossible} uses</span>
            <span class="cd-eff-missed ${e.missed >= 2 ? 'sev-critical' : 'sev-warning'}">-${e.missed}</span>
          </div>`;
      }).join('')}
    </div>`;
}
