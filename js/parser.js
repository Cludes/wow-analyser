import { getRole, getClass, DIFFICULTY_LABELS } from './constants.js';

export function parseReport(raw) {
  const r = raw.reportData.report;
  const actors = buildActorMap(r.masterData?.actors ?? []);
  const fights = (r.fights ?? [])
    .filter(f => f.friendlyPlayers?.length > 0)
    .map(f => parseFight(f, actors));
  return {
    title:  r.title,
    zone:   r.zone?.name ?? 'Unknown Zone',
    region: r.region?.name ?? '',
    guild:  r.guild?.name ?? '',
    startTime: r.startTime,
    endTime:   r.endTime,
    actors,
    fights,
  };
}

function buildActorMap(actors) {
  const map = {};
  for (const a of actors) {
    map[a.id] = {
      id:     a.id,
      name:   a.name,
      class:  getClass(a.subType),
      spec:   a.subType?.split('-')[1] ?? '',
      icon:   a.subType ?? '',
      server: a.server ?? '',
      role:   getRole(a.subType),
    };
  }
  return map;
}

function parseFight(f, actors) {
  const duration = f.endTime - f.startTime;
  const players = (f.friendlyPlayers ?? [])
    .filter(id => actors[id])
    .map(id => actors[id]);
  const tanks   = players.filter(p => p.role === 'Tank');
  const healers = players.filter(p => p.role === 'Healer');
  const melee   = players.filter(p => p.role === 'Melee');
  const ranged  = players.filter(p => p.role === 'Ranged' || p.role === 'DPS');
  const dps     = [...melee, ...ranged];
  return {
    id:         f.id,
    name:       f.name,
    zone:       f.gameZone?.name ?? '',
    difficulty: DIFFICULTY_LABELS[f.difficulty] ?? `Diff ${f.difficulty}`,
    size:       f.size ?? players.length,
    kill:       f.kill ?? false,
    startTime:  f.startTime,
    endTime:    f.endTime,
    duration,
    bossPercent: f.bossPercentage ?? null,
    ilvl:       f.averageItemLevel ?? null,
    players, tanks, healers, dps, melee, ranged,
  };
}

// --- fight data (table + graph) ---

export function parseDPSTable(raw) {
  const table = ensureObj(raw.reportData?.report?.table);
  return parseTableEntries(table?.data?.entries ?? []);
}

export function parseHPSTable(raw) {
  const table = ensureObj(raw.reportData?.report?.table);
  return parseTableEntries(table?.data?.entries ?? []);
}

function parseTableEntries(entries) {
  return entries.map(e => ({
    id:         e.id,
    name:       e.name,
    class:      getClass(e.icon),
    icon:       e.icon,
    total:      e.total ?? 0,
    activeTime: e.activeTime ?? 0,
    perSecond:  e.activeTime ? (e.total / e.activeTime * 1000) : 0,
    overheal:   e.overheal ?? 0,
    ilvl:       e.itemLevel ?? null,
    abilities:  (e.abilities ?? []).slice(0, 10).map(a => ({
      name:  a.name,
      total: a.total,
      guid:  a.guid ?? a.abilityIcon,
    })),
  })).sort((a, b) => b.total - a.total);
}

export function parseDamageTakenTable(raw) {
  return parseDPSTable(raw); // same structure
}

export function parseGraph(raw) {
  const graph = ensureObj(raw.reportData?.report?.graph);
  const series = graph?.data?.series ?? [];
  return series
    .filter(s => s && typeof s === 'object' && s.id !== -1)  // drop padding (0) and Total (-1)
    .map(s => ({
      id:    s.id,
      name:  s.name,
      class: getClass(s.icon ?? ''),
      total: s.total ?? 0,
      data:  (s.data ?? [])
        .filter(p => Array.isArray(p) ? p.length >= 2 : p && typeof p === 'object')
        .map(p => Array.isArray(p)
          ? { t: p[0], v: p[1] }
          : { t: p.time ?? p.t ?? 0, v: p.total ?? p.y ?? p.v ?? 0 }
        ),
    }));
}

export function parseDeaths(events, actorMap = {}) {
  return events.map(e => ({
    timestamp:   e.timestamp,
    targetId:    e.targetID,
    targetName:  actorMap[e.targetID]?.name ?? e.targetName ?? 'Unknown',
    killingBlow: e.ability?.name ?? 'Unknown',
    overkill:    e.overkill ?? e.amount ?? 0,
  }));
}

export function parseCasts(events, actorMap = {}) {
  return events.filter(e => e.type === 'cast').map(e => ({
    timestamp:  e.timestamp,
    sourceId:   e.sourceID,
    sourceName: actorMap[e.sourceID]?.name ?? e.sourceName ?? 'Unknown',
    spellId:    e.ability?.guid ?? e.abilityGameID ?? 0,
    spellName:  e.ability?.name ?? 'Unknown',
  }));
}

export function parseInterrupts(events, actorMap = {}) {
  return events.filter(e => e.type === 'interrupt').map(e => ({
    timestamp:          e.timestamp,
    sourceId:           e.sourceID,
    sourceName:         actorMap[e.sourceID]?.name ?? e.sourceName ?? 'Unknown',
    spellId:            e.ability?.guid ?? 0,
    spellName:          e.ability?.name ?? 'Unknown',
    interruptedSpellId: e.extraAbility?.guid ?? 0,
    interruptedSpell:   e.extraAbility?.name ?? 'Unknown',
    targetName:         actorMap[e.targetID]?.name ?? e.targetName ?? 'Unknown',
  }));
}

export function parseDispels(events, actorMap = {}) {
  return events.filter(e => e.type === 'dispel').map(e => ({
    timestamp:        e.timestamp,
    sourceId:         e.sourceID,
    sourceName:       actorMap[e.sourceID]?.name ?? e.sourceName ?? 'Unknown',
    spellId:          e.ability?.guid ?? 0,
    spellName:        e.ability?.name ?? 'Unknown',
    dispelledSpellId: e.extraAbility?.guid ?? 0,
    dispelledSpell:   e.extraAbility?.name ?? 'Unknown',
    targetName:       actorMap[e.targetID]?.name ?? e.targetName ?? 'Unknown',
  }));
}

export function parseResurrects(events, actorMap = {}) {
  return events.filter(e => e.type === 'resurrect').map(e => ({
    timestamp:  e.timestamp,
    sourceId:   e.sourceID,
    sourceName: actorMap[e.sourceID]?.name ?? e.sourceName ?? 'Unknown',
    targetName: actorMap[e.targetID]?.name ?? e.targetName ?? 'Unknown',
    spellId:    e.ability?.guid ?? 0,
    spellName:  e.ability?.name ?? 'Battle Rez',
  }));
}

function ensureObj(v) {
  if (!v) return null;
  if (typeof v === 'string') {
    try { return JSON.parse(v); } catch { return null; }
  }
  return v;
}
