import {
  fmt, fmtTime, CLASS_COLORS, MAJOR_COOLDOWNS,
  ROAST_DEATH, COACH_DEATH, ROAST_AVOIDABLE, COACH_AVOIDABLE
} from './constants.js';

// --- DPS / HPS summary stats ---

export function computePerformanceStats(tableEntries) {
  if (!tableEntries.length) return { avg: 0, median: 0, top: 0 };
  const vals = tableEntries.map(e => e.perSecond).sort((a, b) => a - b);
  const avg  = vals.reduce((s, v) => s + v, 0) / vals.length;
  const mid  = Math.floor(vals.length / 2);
  const median = vals.length % 2 ? vals[mid] : (vals[mid-1] + vals[mid]) / 2;
  return { avg, median, top: vals[vals.length - 1] };
}

// --- Death analysis ---

export function analyzeDeaths(deaths, actorMap, fightDuration, roastMode) {
  const byPlayer = {};
  for (const d of deaths) {
    const key = d.targetName;
    if (!byPlayer[key]) byPlayer[key] = [];
    byPlayer[key].push(d);
  }
  const templates = roastMode ? ROAST_DEATH : COACH_DEATH;
  return Object.entries(byPlayer).map(([name, ds]) => {
    const causes = groupBy(ds, d => d.killingBlow);
    const topCause = Object.entries(causes).sort((a,b) => b[1].length - a[1].length)[0];
    const causeName = topCause ? topCause[0] : 'Unknown';
    const count = ds.length;
    const tpl = templates[Math.floor(Math.random() * templates.length)];
    const actor = Object.values(actorMap).find(a => a.name === name);
    return {
      player: name,
      class:  actor?.class ?? 'Unknown',
      count,
      deaths: ds.map(d => ({ t: d.timestamp, cause: d.killingBlow, at: fmtTime(d.timestamp) })),
      topCause: causeName,
      message: tpl(name, causeName),
      severity: count >= 3 ? 'critical' : count >= 2 ? 'warning' : 'info',
    };
  }).sort((a, b) => b.count - a.count);
}

// --- Avoidable damage (damage taken with "avoidable" flag or high env dmg) ---

export function analyzeAvoidableDamage(damageTakenEntries, roastMode) {
  const findings = [];
  const templates = roastMode ? ROAST_AVOIDABLE : COACH_AVOIDABLE;
  for (const entry of damageTakenEntries) {
    for (const ab of entry.abilities ?? []) {
      if (ab.total > 0 && looksAvoidable(ab.name)) {
        const tpl = templates[Math.floor(Math.random() * templates.length)];
        findings.push({
          player:   entry.name,
          class:    entry.class,
          spell:    ab.name,
          total:    ab.total,
          message:  tpl(entry.name, fmt(ab.total), ab.name),
          severity: ab.total > 5_000_000 ? 'critical' : 'warning',
        });
      }
    }
  }
  return findings.sort((a, b) => b.total - a.total).slice(0, 12);
}

const AVOIDABLE_KEYWORDS = [
  'Slab','Stomp','Breath','Discharge','Eruption','Wave','Burst','Blast',
  'Slam','Rain','Barrage','Cascade','Torrent','Surge','Pulse','Quake',
  'Strike','Crush','Tremor','Sweep','Cleave','Impale','Spit','Crash',
];
function looksAvoidable(name) {
  return AVOIDABLE_KEYWORDS.some(k => name.includes(k));
}

// --- Cooldown extraction from cast events ---

export function extractCooldownUsages(casts, actorMap) {
  const usages = [];
  for (const c of casts) {
    const cd = MAJOR_COOLDOWNS[c.spellId];
    if (!cd) continue;
    const actor = actorMap[c.sourceId] ?? { name: c.sourceName, class: cd.class };
    usages.push({
      t:          c.timestamp,
      sourceId:   c.sourceId,
      sourceName: actor.name,
      class:      actor.class,
      spellId:    c.spellId,
      spellName:  cd.name,
      duration:   cd.duration * 1000,
      cdType:     cd.type,
    });
  }
  return usages.sort((a, b) => a.t - b.t);
}

// --- DPS underperformance ---

export function findUnderperformers(dpsEntries, roastMode) {
  if (dpsEntries.length < 3) return [];
  const avg = dpsEntries.reduce((s, e) => s + e.perSecond, 0) / dpsEntries.length;
  const threshold = avg * 0.65;
  return dpsEntries
    .filter(e => e.perSecond < threshold)
    .map(e => ({
      player:   e.name,
      class:    e.class,
      dps:      e.perSecond,
      avg,
      pct:      Math.round((1 - e.perSecond / avg) * 100),
      message:  roastMode
        ? `${e.name} pulled ${fmt(e.perSecond)} DPS against a raid average of ${fmt(avg)}. The bench is calling.`
        : `${e.name}: ${fmt(e.perSecond)} DPS, ${Math.round((1 - e.perSecond/avg)*100)}% below raid average. Review cooldown usage and rotation.`,
      severity: 'warning',
    }));
}

// --- Interrupt analysis ---

export function analyzeInterrupts(casts, actorMap) {
  const interrupts = casts.filter(c => c.spellName?.toLowerCase().includes('interrupt') || c.spellId === 2139 || c.spellId === 1766);
  const byPlayer = groupBy(interrupts, c => c.sourceName);
  return Object.entries(byPlayer).map(([name, cs]) => ({
    player: name,
    count:  cs.length,
    times:  cs.map(c => fmtTime(c.timestamp)),
  })).sort((a, b) => b.count - a.count);
}

// --- Timeline events (boss abilities + dmg spikes) ---

export function buildTimelineEvents(deaths, casts, damageTakenEntries) {
  const events = [];
  for (const d of deaths) {
    events.push({ t: d.timestamp, type: 'death', label: `${d.targetName} died`, severity: 'critical' });
  }
  return events.sort((a, b) => a.t - b.t);
}

// --- helpers ---

function groupBy(arr, fn) {
  const out = {};
  for (const item of arr) {
    const k = fn(item);
    (out[k] ??= []).push(item);
  }
  return out;
}
