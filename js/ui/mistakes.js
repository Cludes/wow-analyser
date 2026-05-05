import { CLASS_COLORS, CD_TYPE_COLORS, fmt, fmtTime } from '../constants.js';

export function renderMistakes(container, {
  deaths, avoidable, underperformers, interrupts, dispels,
  cooldownEff, zeroInterrupters, grade, cdOverlaps, bloodlust, battleRez,
}) {
  const hasIssues = deaths.length || avoidable.length || underperformers.length || cooldownEff.length;
  container.innerHTML = `
    <div class="mistakes-header">
      <div class="mistakes-title-row">
        <h2 class="mistakes-title">Performance Analysis</h2>
        ${grade ? renderGradeBadge(grade) : ''}
      </div>
      <p class="mistakes-sub">Objective performance summary based on deaths, avoidable damage, and cooldown usage.</p>
    </div>
    ${!hasIssues && !interrupts.total ? '<div class="empty-state">No significant issues detected this fight.</div>' : ''}
    ${deaths.length          ? renderSection('Deaths',                 'skull',       deaths.map(d => makeCard(d, 'death')))           : ''}
    ${avoidable.length       ? renderSection('Avoidable Damage',       'shield-off',  avoidable.map(d => makeCard(d, 'avoidable')))    : ''}
    ${underperformers.length ? renderSection('DPS Check',              'trending-dn', underperformers.map(d => makeCard(d, 'dps')))    : ''}
    ${cooldownEff.length     ? renderSection('Cooldown Efficiency',    'clock',       [renderCooldownEff(cooldownEff)])                 : ''}
    ${interrupts.total > 0   ? renderSection('Interrupts',             'zap',         [renderInterrupts(interrupts, zeroInterrupters)]) : ''}
    ${dispels.total > 0      ? renderSection('Dispels',                'refresh-cw',  [renderDispels(dispels)])                        : ''}
    ${cdOverlaps?.length     ? renderSection('Defensive CD Overlaps',  'overlap',     [renderCooldownOverlaps(cdOverlaps)])             : ''}
    ${renderSection('Bloodlust / Heroism', 'bloodlust', [renderBloodlust(bloodlust)])}
    ${renderSection('Battle Rezzes',       'brez',      [renderBattleRez(battleRez)])}
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

// --- Grade ---

function renderGradeBadge({ grade, score }) {
  return `<div class="fight-grade grade-${grade.toLowerCase()}" title="Score: ${score}">${grade}</div>`;
}

// --- Interrupts ---

function renderInterrupts({ players, topSpells, total }, zeroInterrupters = []) {
  const topSpellHtml = topSpells.length
    ? `<div class="int-top-spells">
        <span class="int-label">Most interrupted:</span>
        ${topSpells.map(s => `<span class="int-spell-chip">${s.name} <em>${s.count}x</em></span>`).join('')}
       </div>`
    : '';

  const zeroHtml = zeroInterrupters.length
    ? `<div class="int-zero-row">
        <span class="int-label">No interrupts:</span>
        ${zeroInterrupters.map(p => {
          const color = CLASS_COLORS[p.class] ?? '#888';
          return `<span class="int-zero-chip" style="color:${color}">${p.player}</span>`;
        }).join('')}
       </div>`
    : '';

  return `
    <div class="interrupt-block">
      <div class="int-summary">${total} total interrupts</div>
      ${topSpellHtml}
      ${zeroHtml}
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

// --- Cooldown overlaps ---

function renderCooldownOverlaps(overlaps) {
  if (!overlaps.length) return '<div class="int-summary">No overlapping defensive cooldowns detected.</div>';
  return `
    <div class="interrupt-block">
      <div class="int-summary">${overlaps.length} overlap${overlaps.length > 1 ? 's' : ''} detected - consider staggering for better coverage</div>
      <div class="int-table">
        ${overlaps.map(o => {
          const colorA = CLASS_COLORS[o.a.class] ?? '#888';
          const colorB = CLASS_COLORS[o.b.class] ?? '#888';
          const typeColor = CD_TYPE_COLORS[o.a.cdType] ?? '#888';
          return `
            <div class="int-row">
              <span class="int-name" style="color:${colorA}">${o.a.sourceName}</span>
              <span class="int-spell-chip" style="color:${typeColor}">${o.a.spellName}</span>
              <span style="color:var(--text-dim)">+</span>
              <span class="int-name" style="color:${colorB}">${o.b.sourceName}</span>
              <span class="int-spell-chip">${o.b.spellName}</span>
              <span class="overlap-gap">${Math.round(o.gapMs / 1000)}s apart @ ${fmtTime(o.a.t)}</span>
            </div>`;
        }).join('')}
      </div>
    </div>`;
}

// --- Bloodlust / Heroism ---

function renderBloodlust(bl) {
  if (!bl) return '<div class="int-summary">No Bloodlust / Heroism detected this fight.</div>';
  const timingLabel = { opener: 'Opener', mid: 'Mid-fight', late: 'Late' };
  const timingColor = { opener: '#2ded68', mid: '#fab700', late: '#e63946' };
  return `
    <div class="interrupt-block">
      <div class="int-summary">${bl.total} use${bl.total > 1 ? 's' : ''} this fight</div>
      <div class="int-table">
        ${bl.uses.map(u => `
          <div class="int-row">
            <span class="int-name" style="color:${CLASS_COLORS[u.class] ?? '#888'}">${u.sourceName}</span>
            <span class="int-count">${u.at}</span>
            <span class="int-spell-chip">${u.spellName}</span>
            <span class="int-spell-chip" style="color:${timingColor[u.timing]}">${timingLabel[u.timing]}</span>
          </div>`).join('')}
      </div>
    </div>`;
}

// --- Battle rez ---

function renderBattleRez(brez) {
  if (!brez) return '<div class="int-summary">No battle rezzes this fight.</div>';
  const unusedNote = brez.unused > 0
    ? `<span style="color:var(--red);font-weight:700">${brez.unused} unused</span>`
    : '<span style="color:var(--green)">All used</span>';
  return `
    <div class="interrupt-block">
      <div class="int-summary">${brez.total} / ${brez.maxAvailable} available - ${unusedNote}</div>
      ${brez.uses.length ? `
        <div class="int-table">
          ${brez.uses.map(r => `
            <div class="int-row">
              <span class="int-name" style="color:var(--text)">${r.sourceName}</span>
              <span style="color:var(--text-muted);font-size:12px">rezzed</span>
              <span class="int-name" style="color:var(--text)">${r.targetName}</span>
              <span class="int-count">${r.at}</span>
            </div>`).join('')}
        </div>` : ''}
    </div>`;
}
