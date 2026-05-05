import { wcl, extractReportCode } from './api/wcl.js';
import {
  parseReport, parseDPSTable, parseHPSTable, parseDamageTakenTable,
  parseGraph, parseDeaths, parseCasts,
} from './parser.js';
import {
  analyzeDeaths, analyzeAvoidableDamage, extractCooldownUsages,
  findUnderperformers, analyzeInterrupts, buildTimelineEvents,
} from './analytics.js';
import { renderOverview }     from './ui/overview.js';
import { renderDpsChart }     from './ui/dps-chart.js';
import { renderCooldowns }    from './ui/cooldowns.js';
import { renderMistakes }     from './ui/mistakes.js';
import { renderPlayerDetail } from './ui/player-detail.js';
import { renderRaidTimeline } from './ui/raid-timeline.js';

const S = {
  report:    null,
  fight:     null,
  fightData: null,
  activeTab: 'overview',
  dpsMode:   'dps',
  roastMode: true,
  loading:   false,
};

// --- init ---

document.addEventListener('DOMContentLoaded', async () => {
  loadStoredCredentials();
  bindEvents();

  // Handle OAuth callback before anything else
  if (window.location.search.includes('code=')) {
    setLoading(true);
    try {
      await wcl.handleAuthCallback();
      showToast('Logged in successfully.');
    } catch (err) {
      showError('Login failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  await updateAuthUI();
});

function loadStoredCredentials() {
  document.getElementById('inp-client-id').value     = localStorage.getItem('wcl_client_id')     ?? '';
  document.getElementById('inp-client-secret').value = localStorage.getItem('wcl_client_secret') ?? '';
  document.getElementById('redirect-uri-display').textContent = window.location.origin + window.location.pathname;
  S.roastMode = localStorage.getItem('roast_mode') !== 'false';
  updateRoastToggle();
}

// --- auth UI ---

async function updateAuthUI() {
  const loggedIn = wcl.isLoggedIn();
  const loginBtn  = document.getElementById('btn-login');
  const logoutBtn = document.getElementById('btn-logout');
  const userLabel = document.getElementById('auth-user-label');

  loginBtn.style.display  = loggedIn ? 'none' : 'inline-flex';
  logoutBtn.style.display = loggedIn ? 'inline-flex' : 'none';
  userLabel.style.display = loggedIn ? 'inline-flex' : 'none';

  if (loggedIn) {
    // Fetch username in background - don't block UI
    wcl.getCurrentUser().then(user => {
      if (user) userLabel.textContent = user.name;
    }).catch(() => {});
  }
}

// --- events ---

function bindEvents() {
  // credentials modal
  document.getElementById('btn-api-settings').onclick = () => showModal('modal-credentials');
  document.getElementById('btn-save-creds').onclick    = saveCredentials;
  document.getElementById('btn-cancel-creds').onclick  = () => hideModal('modal-credentials');

  // login / logout
  document.getElementById('btn-login').onclick = () => {
    if (!wcl.clientId) {
      showModal('modal-credentials');
      showError('Enter your Client ID and Secret first, then click Login with WarcraftLogs.');
      return;
    }
    try {
      wcl.startAuthFlow();
    } catch (err) {
      console.error('startAuthFlow failed:', err);
      showError('Login failed: ' + err.message);
    }
  };
  document.getElementById('btn-logout').onclick = () => {
    wcl.logout();
    updateAuthUI();
    showToast('Logged out.');
  };

  // report load
  document.getElementById('btn-load').onclick = loadReport;
  document.getElementById('inp-report').addEventListener('keydown', e => {
    if (e.key === 'Enter') loadReport();
  });

  // tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.onclick = () => switchTab(btn.dataset.tab);
  });

  // roast toggle
  document.getElementById('btn-roast-toggle').onclick = () => {
    S.roastMode = !S.roastMode;
    localStorage.setItem('roast_mode', String(S.roastMode));
    updateRoastToggle();
    if (S.fightData) renderCurrentTab();
  };

  // fight selector (delegated)
  document.getElementById('fight-list').addEventListener('click', e => {
    const btn = e.target.closest('.fight-btn');
    if (btn) selectFight(parseInt(btn.dataset.fightId));
  });

  // player row click (delegated)
  document.getElementById('tab-dps').addEventListener('click', e => {
    const row = e.target.closest('.player-row');
    if (row) openPlayerDetail(row.dataset.name);
  });

  // player detail close
  document.getElementById('btn-close-detail').onclick = () => hideModal('modal-player-detail');

  // DPS mode toggle (delegated)
  document.getElementById('tab-dps').addEventListener('click', e => {
    const btn = e.target.closest('.toggle-btn');
    if (btn?.dataset.mode) {
      S.dpsMode = btn.dataset.mode;
      renderDpsTab();
    }
  });
}

function saveCredentials() {
  const id  = document.getElementById('inp-client-id').value.trim();
  const sec = document.getElementById('inp-client-secret').value.trim();
  if (!id || !sec) { showError('Both Client ID and Client Secret are required.'); return; }
  wcl.setCredentials(id, sec);
  hideModal('modal-credentials');
  showToast('Credentials saved. Now click "Login with WarcraftLogs".');
}

// --- report loading ---

async function loadReport() {
  const input = document.getElementById('inp-report').value.trim();
  if (!input) return;

  if (!wcl.isLoggedIn() && !wcl.hasCredentials()) {
    showModal('modal-credentials');
    return;
  }

  let parsed;
  try { parsed = extractReportCode(input); }
  catch (err) { showError(err.message); return; }

  setLoading(true);
  clearFightArea();

  try {
    const raw = await wcl.getReport(parsed.code);
    S.report = parseReport(raw);
    S.report.code = parsed.code;
    renderFightList(S.report.fights, parsed.fightId);
    document.getElementById('report-title').textContent = S.report.title || 'Report Loaded';
  } catch (err) {
    showError('Failed to load report: ' + err.message);
  } finally {
    setLoading(false);
  }
}

function renderFightList(fights, autoSelectId) {
  const list = document.getElementById('fight-list');
  list.innerHTML = fights.map(f => `
    <button class="fight-btn ${f.kill ? 'fight-kill' : 'fight-wipe'}" data-fight-id="${f.id}" title="${f.name} - ${f.difficulty}">
      <span class="fight-name">${f.name}</span>
      <span class="fight-meta">${fmtDur(f.duration)} &bull; ${f.kill ? 'Kill' : (f.bossPercent != null ? f.bossPercent.toFixed(0)+'%' : 'Wipe')}</span>
    </button>
  `).join('');
  document.getElementById('fight-selector').style.display = 'block';

  const target = autoSelectId ?? fights.find(f => f.kill)?.id ?? fights[0]?.id;
  if (target) selectFight(target);
}

function fmtDur(ms) {
  const s = Math.floor(ms / 1000), m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

// --- fight selection ---

async function selectFight(fightId) {
  document.querySelectorAll('.fight-btn').forEach(b => b.classList.toggle('active', parseInt(b.dataset.fightId) === fightId));
  const fight = S.report?.fights.find(f => f.id === fightId);
  if (!fight) return;

  S.fight    = fight;
  S.fightData = null;
  setLoading(true);
  showSkeleton();

  try {
    const code = S.report.code;
    const [dpsTableRaw, hpsTableRaw, dtTableRaw, dpsGraphRaw, hpsGraphRaw, deathEvents, castEvents] = await Promise.all([
      wcl.getFightTable(code, fightId, 'DamageDone'),
      wcl.getFightTable(code, fightId, 'Healing'),
      wcl.getFightTable(code, fightId, 'DamageTaken'),
      wcl.getFightGraph(code, fightId, 'DamageDone'),
      wcl.getFightGraph(code, fightId, 'Healing'),
      wcl.getDeaths(code, fightId, fight.startTime, fight.endTime),
      wcl.getCasts(code, fightId, fight.startTime, fight.endTime),
    ]);

    S.fightData = {
      dpsTable:       parseDPSTable(dpsTableRaw),
      hpsTable:       parseHPSTable(hpsTableRaw),
      dtTable:        parseDamageTakenTable(dtTableRaw),
      dpsGraph:       parseGraph(dpsGraphRaw),
      hpsGraph:       parseGraph(hpsGraphRaw),
      deaths:         parseDeaths(deathEvents),
      casts:          parseCasts(castEvents),
      cooldownUsages: extractCooldownUsages(parseCasts(castEvents), S.report.actors),
    };

    document.getElementById('dashboard').style.display = 'block';
    renderCurrentTab();
  } catch (err) {
    showError('Failed to load fight data: ' + err.message);
  } finally {
    setLoading(false);
  }
}

// --- tab rendering ---

function switchTab(tab) {
  S.activeTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.toggle('active', p.id === `tab-${tab}`));
  if (S.fightData) renderCurrentTab();
}

function renderCurrentTab() {
  const { dpsTable, hpsTable, dtTable, dpsGraph, hpsGraph, deaths, casts, cooldownUsages } = S.fightData;
  switch (S.activeTab) {
    case 'overview':
      renderOverview(document.getElementById('tab-overview'), S.report, S.fight, dpsTable, hpsTable);
      break;
    case 'dps':
      renderDpsTab();
      break;
    case 'cooldowns':
      renderCooldowns(document.getElementById('tab-cooldowns'), cooldownUsages, S.fight);
      break;
    case 'analysis':
      renderMistakes(document.getElementById('tab-analysis'), {
        deaths:          analyzeDeaths(deaths, S.report.actors, S.fight.duration, S.roastMode),
        avoidable:       analyzeAvoidableDamage(dtTable, S.roastMode),
        underperformers: findUnderperformers(dpsTable, S.roastMode),
        interrupts:      analyzeInterrupts(casts, S.report.actors),
      }, S.roastMode);
      break;
    case 'timeline':
      renderRaidTimeline(
        document.getElementById('tab-timeline'),
        S.fight, deaths, cooldownUsages,
        buildTimelineEvents(deaths, casts, dtTable)
      );
      break;
  }
}

function renderDpsTab() {
  const { dpsTable, hpsTable, dpsGraph, hpsGraph } = S.fightData;
  const graph = S.dpsMode === 'hps' ? hpsGraph : dpsGraph;
  const table = S.dpsMode === 'hps' ? hpsTable : dpsTable;
  renderDpsChart(document.getElementById('tab-dps'), graph, table, S.dpsMode, S.fight);
}

// --- player detail ---

function openPlayerDetail(name) {
  if (!S.fightData || !S.report) return;
  const player = Object.values(S.report.actors).find(a => a.name === name);
  if (!player) return;
  renderPlayerDetail(
    document.getElementById('player-detail-content'), player,
    S.fightData.dpsTable.find(e => e.name === name),
    S.fightData.hpsTable.find(e => e.name === name),
    S.fightData.deaths.filter(d => d.targetName === name),
    S.fightData.casts.filter(c => c.sourceName === name),
  );
  showModal('modal-player-detail');
}

// --- UI helpers ---

function setLoading(v) {
  S.loading = v;
  document.getElementById('loading-overlay').style.display = v ? 'flex' : 'none';
}

function showSkeleton() {
  document.getElementById('tab-overview').innerHTML =
    '<div class="skeleton-block"></div><div class="skeleton-block"></div><div class="skeleton-block"></div>';
}

function clearFightArea() {
  document.getElementById('fight-selector').style.display = 'none';
  document.getElementById('dashboard').style.display      = 'none';
  document.getElementById('report-title').textContent     = '';
}

function showModal(id) { document.getElementById(id).style.display = 'flex'; }
function hideModal(id) { document.getElementById(id).style.display = 'none'; }

function showError(msg) {
  const el = document.getElementById('error-banner');
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 7000);
}

function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast show';
  setTimeout(() => { el.className = 'toast'; }, 3000);
}

function updateRoastToggle() {
  const btn = document.getElementById('btn-roast-toggle');
  btn.textContent = S.roastMode ? 'Roast Mode: ON' : 'Coach Mode';
  btn.classList.toggle('roast-on', S.roastMode);
}
