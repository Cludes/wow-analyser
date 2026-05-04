import { CLASS_COLORS, CLASS_DISPLAY, fmt, fmtTime } from '../constants.js';

let abilityChart = null;

export function renderPlayerDetail(container, player, dpsEntry, hpsEntry, deaths, casts) {
  const color = CLASS_COLORS[player.class] ?? '#888';
  const playerDeaths = deaths.filter(d => d.targetName === player.name);
  const topAbilities = dpsEntry?.abilities ?? [];

  container.innerHTML = `
    <div class="pd-header" style="border-color:${color}">
      <div class="pd-name" style="color:${color}">${player.name}</div>
      <div class="pd-meta">${CLASS_DISPLAY[player.class] ?? player.class} &bull; ${player.spec} &bull; <span class="role-tag ${player.role.toLowerCase()}">${player.role}</span></div>
      ${player.server ? `<div class="pd-server">${player.server}</div>` : ''}
    </div>

    <div class="pd-stats">
      ${dpsEntry ? `
        <div class="stat-card">
          <div class="stat-label">DPS</div>
          <div class="stat-value gold">${fmt(dpsEntry.perSecond)}/s</div>
          <div class="stat-sub">${fmt(dpsEntry.total)} total</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Active Time</div>
          <div class="stat-value">${fmtTime(dpsEntry.activeTime)}</div>
        </div>
        ${dpsEntry.ilvl ? `<div class="stat-card"><div class="stat-label">Item Level</div><div class="stat-value">${Math.round(dpsEntry.ilvl)}</div></div>` : ''}
      ` : ''}
      ${hpsEntry ? `
        <div class="stat-card">
          <div class="stat-label">HPS</div>
          <div class="stat-value teal">${fmt(hpsEntry.perSecond)}/s</div>
          <div class="stat-sub">${fmt(hpsEntry.total)} total healing</div>
        </div>
      ` : ''}
      <div class="stat-card ${playerDeaths.length > 0 ? 'danger' : ''}">
        <div class="stat-label">Deaths</div>
        <div class="stat-value ${playerDeaths.length > 0 ? 'red' : ''}">${playerDeaths.length}</div>
      </div>
    </div>

    ${topAbilities.length ? `
      <div class="section-title">Top Abilities</div>
      <div class="ability-list">
        ${renderAbilityList(topAbilities, dpsEntry?.total)}
      </div>
    ` : ''}

    ${playerDeaths.length ? `
      <div class="section-title">Deaths</div>
      <div class="death-list">
        ${playerDeaths.map(d => `
          <div class="death-entry">
            <span class="death-time">${fmtTime(d.timestamp)}</span>
            <span class="death-cause">Killed by ${d.killingBlow}</span>
          </div>`).join('')}
      </div>
    ` : ''}
  `;
}

function renderAbilityList(abilities, total) {
  const max = abilities[0]?.total ?? 1;
  return abilities.map(a => {
    const pct = total > 0 ? (a.total / total * 100).toFixed(1) : 0;
    const barW = (a.total / max * 100).toFixed(1);
    return `
      <div class="ab-row">
        <div class="ab-name">${a.name}</div>
        <div class="ab-bar-wrap">
          <div class="ab-bar" style="width:${barW}%"></div>
        </div>
        <div class="ab-total">${fmt(a.total)}</div>
        <div class="ab-pct">${pct}%</div>
      </div>`;
  }).join('');
}
