import { CLASS_COLORS, CLASS_DISPLAY, fmt, fmtTime } from '../constants.js';

export function renderOverview(container, report, fight, dpsTable, hpsTable) {
  const total = dpsTable.length;
  const tanks   = fight.tanks.length;
  const healers = fight.healers.length;
  const dps     = fight.dps.length;

  const totalDmg = dpsTable.reduce((s, e) => s + e.total, 0);
  const totalHeal = hpsTable.reduce((s, e) => s + e.total, 0);

  container.innerHTML = `
    <div class="overview-grid">
      <div class="stat-card">
        <div class="stat-label">Boss</div>
        <div class="stat-value">${fight.name}</div>
        <div class="stat-sub">${fight.zone} &bull; ${fight.difficulty}</div>
      </div>
      <div class="stat-card ${fight.kill ? 'kill' : 'wipe'}">
        <div class="stat-label">Result</div>
        <div class="stat-value result-badge ${fight.kill ? 'kill' : 'wipe'}">${fight.kill ? 'KILL' : 'WIPE'}</div>
        <div class="stat-sub">${fight.kill ? 'Boss slain' : (fight.bossPercent != null ? fight.bossPercent.toFixed(1) + '% remaining' : '')}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Duration</div>
        <div class="stat-value">${fmtTime(fight.duration)}</div>
        <div class="stat-sub">${fight.ilvl ? 'Avg iLvl ' + Math.round(fight.ilvl) : ''}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Damage</div>
        <div class="stat-value gold">${fmt(totalDmg)}</div>
        <div class="stat-sub">${fmt(totalDmg / (fight.duration / 1000))} raid DPS</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Healing</div>
        <div class="stat-value teal">${fmt(totalHeal)}</div>
        <div class="stat-sub">${fmt(totalHeal / (fight.duration / 1000))} raid HPS</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Composition</div>
        <div class="stat-value comp-value">
          <span class="role-badge tank">${tanks}T</span>
          <span class="role-badge healer">${healers}H</span>
          <span class="role-badge dps">${dps}D</span>
        </div>
        <div class="stat-sub">${total} players</div>
      </div>
    </div>

    <div class="section-title">Damage Done</div>
    <div class="bar-table">${renderBarRows(dpsTable, totalDmg, fight.duration)}</div>

    <div class="section-title">Healing Done</div>
    <div class="bar-table">${renderBarRows(hpsTable, totalHeal, fight.duration)}</div>

    <div class="section-title">Raid Composition</div>
    <div class="comp-grid">${renderCompGrid(fight.players)}</div>
  `;
}

function renderBarRows(entries, total, duration) {
  if (!entries.length) return '<div class="empty-state">No data</div>';
  const max = entries[0].total;
  return entries.map((e, i) => {
    const color = CLASS_COLORS[e.class] ?? '#888';
    const pct   = total > 0 ? (e.total / total * 100).toFixed(1) : 0;
    const barW  = max > 0 ? (e.total / max * 100) : 0;
    const ps    = e.perSecond;
    return `
      <div class="bar-row" data-player="${e.name}">
        <div class="bar-rank">${i + 1}</div>
        <div class="bar-name" style="color:${color}">${e.name}</div>
        <div class="bar-track">
          <div class="bar-fill" style="width:${barW}%;background:${color}22;border-left:3px solid ${color}"></div>
        </div>
        <div class="bar-stat">${fmt(ps)}/s</div>
        <div class="bar-total">${fmt(e.total)}</div>
        <div class="bar-pct">${pct}%</div>
      </div>`;
  }).join('');
}

function renderCompGrid(players) {
  return players.map(p => {
    const color = CLASS_COLORS[p.class] ?? '#888';
    return `
      <div class="comp-player" style="border-color:${color}20">
        <div class="comp-class-dot" style="background:${color}"></div>
        <div class="comp-info">
          <div class="comp-name" style="color:${color}">${p.name}</div>
          <div class="comp-spec">${CLASS_DISPLAY[p.class] ?? p.class} &bull; <span class="role-tag ${p.role.toLowerCase()}">${p.role}</span></div>
        </div>
      </div>`;
  }).join('');
}
