export const CLASS_COLORS = {
  DeathKnight: '#C41F3B',
  DemonHunter: '#A330C9',
  Druid:       '#FF7D0A',
  Evoker:      '#33937F',
  Hunter:      '#ABD473',
  Mage:        '#69CCF0',
  Monk:        '#00FF96',
  Paladin:     '#F58CBA',
  Priest:      '#FFFFFF',
  Rogue:       '#FFF569',
  Shaman:      '#0070DE',
  Warlock:     '#9482C9',
  Warrior:     '#C79C6E',
};

export const CLASS_DISPLAY = {
  DeathKnight: 'Death Knight',
  DemonHunter: 'Demon Hunter',
  Druid: 'Druid', Evoker: 'Evoker', Hunter: 'Hunter',
  Mage: 'Mage', Monk: 'Monk', Paladin: 'Paladin',
  Priest: 'Priest', Rogue: 'Rogue', Shaman: 'Shaman',
  Warlock: 'Warlock', Warrior: 'Warrior',
};

// WCL actor subType e.g. "DeathKnight-Blood" -> role
// Source: WoWAnalyzer SPECS.ts
export const SPEC_ROLES = {
  // Tanks
  'DeathKnight-Blood':     'Tank',
  'DemonHunter-Vengeance': 'Tank',
  'Druid-Guardian':        'Tank',
  'Monk-Brewmaster':       'Tank',
  'Paladin-Protection':    'Tank',
  'Warrior-Protection':    'Tank',
  // Healers
  'Druid-Restoration':     'Healer',
  'Evoker-Preservation':   'Healer',
  'Monk-Mistweaver':       'Healer',
  'Paladin-Holy':          'Healer',
  'Priest-Discipline':     'Healer',
  'Priest-Holy':           'Healer',
  'Shaman-Restoration':    'Healer',
  // Melee DPS (Hunter-Survival = melee per WoWAnalyzer)
  'DeathKnight-Frost':     'Melee',
  'DeathKnight-Unholy':    'Melee',
  'DemonHunter-Havoc':     'Melee',
  'Druid-Feral':           'Melee',
  'Hunter-Survival':       'Melee',
  'Monk-Windwalker':       'Melee',
  'Paladin-Retribution':   'Melee',
  'Rogue-Assassination':   'Melee',
  'Rogue-Outlaw':          'Melee',
  'Rogue-Subtlety':        'Melee',
  'Shaman-Enhancement':    'Melee',
  'Warrior-Arms':          'Melee',
  'Warrior-Fury':          'Melee',
  // Ranged DPS (Evoker-Augmentation = ranged per WoWAnalyzer)
  'Druid-Balance':         'Ranged',
  'Evoker-Augmentation':   'Ranged',
  'Evoker-Devastation':    'Ranged',
  'Hunter-BeastMastery':   'Ranged',
  'Hunter-Marksmanship':   'Ranged',
  'Mage-Arcane':           'Ranged',
  'Mage-Fire':             'Ranged',
  'Mage-Frost':            'Ranged',
  'Priest-Shadow':         'Ranged',
  'Shaman-Elemental':      'Ranged',
  'Warlock-Affliction':    'Ranged',
  'Warlock-Demonology':    'Ranged',
  'Warlock-Destruction':   'Ranged',
};

// Classes with a self-cast interrupt ability (Priest has none)
export const INTERRUPT_CAPABLE = new Set([
  'DeathKnight', 'DemonHunter', 'Druid', 'Evoker',
  'Hunter', 'Mage', 'Monk', 'Paladin',
  'Rogue', 'Shaman', 'Warlock', 'Warrior',
]);

export function getRole(icon) {
  return SPEC_ROLES[icon] ?? 'DPS';
}

export function getClass(icon) {
  return icon ? icon.split('-')[0] : 'Unknown';
}

export const DIFFICULTY_LABELS = { 1:'LFR', 2:'Normal', 3:'Heroic', 4:'Mythic', 5:'Timewalking', 10:'Mythic+', 14:'Normal', 15:'Heroic', 16:'Mythic' };

// Major cooldowns: spellId -> metadata
// Spell IDs sourced from WoWAnalyzer (github.com/WoWAnalyzer/WoWAnalyzer)
export const MAJOR_COOLDOWNS = {
  // Warrior
  97462:  { name: 'Rallying Cry',         class:'Warrior',     type:'raid-defensive', duration:10, cd:180 },
  107574: { name: 'Avatar',               class:'Warrior',     type:'offensive',      duration:20, cd:90  },
  1719:   { name: 'Recklessness',         class:'Warrior',     type:'offensive',      duration:12, cd:90  },
  446035: { name: 'Bladestorm',           class:'Warrior',     type:'offensive',      duration:6,  cd:60  },
  871:    { name: 'Shield Wall',          class:'Warrior',     type:'tank-defensive', duration:8,  cd:240 },
  12975:  { name: 'Last Stand',           class:'Warrior',     type:'tank-defensive', duration:15, cd:180 },

  // Paladin
  454351: { name: 'Avenging Wrath',       class:'Paladin',     type:'offensive',      duration:20, cd:120 },
  86659:  { name: 'Guardian of AK',       class:'Paladin',     type:'tank-defensive', duration:8,  cd:300 },
  31821:  { name: 'Aura Mastery',         class:'Paladin',     type:'raid-defensive', duration:8,  cd:180 },
  633:    { name: 'Lay on Hands',         class:'Paladin',     type:'defensive',      duration:0,  cd:600 },

  // Hunter
  19574:  { name: 'Bestial Wrath',        class:'Hunter',      type:'offensive',      duration:15, cd:90  },
  193530: { name: 'Aspect of the Wild',   class:'Hunter',      type:'offensive',      duration:20, cd:120 },
  288613: { name: 'Trueshot',             class:'Hunter',      type:'offensive',      duration:15, cd:120 },
  360952: { name: 'Coordinated Assault',  class:'Hunter',      type:'offensive',      duration:20, cd:120 },

  // Priest
  64844:  { name: 'Divine Hymn',          class:'Priest',      type:'healing',        duration:8,  cd:180 },
  33206:  { name: 'Pain Suppression',     class:'Priest',      type:'defensive',      duration:8,  cd:180 },
  47536:  { name: 'Rapture',              class:'Priest',      type:'healing',        duration:8,  cd:90  },
  81782:  { name: 'Power Word: Barrier',  class:'Priest',      type:'raid-defensive', duration:10, cd:180 },
  10060:  { name: 'Power Infusion',       class:'Priest',      type:'utility',        duration:20, cd:120 },
  246287: { name: 'Evangelism',           class:'Priest',      type:'healing',        duration:6,  cd:90  },

  // Death Knight
  42650:  { name: 'Army of the Dead',     class:'DeathKnight', type:'offensive',      duration:8,  cd:480 },
  51271:  { name: 'Pillar of Frost',      class:'DeathKnight', type:'offensive',      duration:12, cd:60  },
  81256:  { name: 'Dancing Rune Weapon',  class:'DeathKnight', type:'tank-defensive', duration:8,  cd:120 },
  55233:  { name: 'Vampiric Blood',       class:'DeathKnight', type:'tank-defensive', duration:10, cd:180 },
  48792:  { name: 'Icebound Fortitude',   class:'DeathKnight', type:'defensive',      duration:8,  cd:180 },
  145629: { name: 'Anti-Magic Zone',      class:'DeathKnight', type:'raid-defensive', duration:8,  cd:120 },
  315443: { name: 'Abomination Limb',     class:'DeathKnight', type:'offensive',      duration:12, cd:120 },
  47568:  { name: 'Empower Rune Weapon',  class:'DeathKnight', type:'offensive',      duration:20, cd:120 },

  // Shaman
  108280: { name: 'Healing Tide Totem',   class:'Shaman',      type:'healing',        duration:10, cd:180 },
  98008:  { name: 'Spirit Link Totem',    class:'Shaman',      type:'raid-defensive', duration:6,  cd:180 },
  207399: { name: 'Ancestral Protection', class:'Shaman',      type:'raid-defensive', duration:30, cd:300 },
  198067: { name: 'Fire Elemental',       class:'Shaman',      type:'offensive',      duration:30, cd:150 },
  2825:   { name: 'Bloodlust',            class:'Shaman',      type:'utility',        duration:40, cd:300 },
  32182:  { name: 'Heroism',              class:'Shaman',      type:'utility',        duration:40, cd:300 },
  114052: { name: 'Ascendance',           class:'Shaman',      type:'healing',        duration:15, cd:180 },
  114050: { name: 'Ascendance',           class:'Shaman',      type:'offensive',      duration:15, cd:180 },
  114051: { name: 'Ascendance',           class:'Shaman',      type:'offensive',      duration:15, cd:180 },
  16190:  { name: 'Mana Tide Totem',      class:'Shaman',      type:'healing',        duration:8,  cd:180 },

  // Mage
  190319: { name: 'Combustion',           class:'Mage',        type:'offensive',      duration:10, cd:120 },
  12472:  { name: 'Icy Veins',            class:'Mage',        type:'offensive',      duration:20, cd:120 },
  365350: { name: 'Arcane Surge',         class:'Mage',        type:'offensive',      duration:15, cd:120 },
  80353:  { name: 'Time Warp',            class:'Mage',        type:'utility',        duration:40, cd:300 },

  // Warlock
  104773: { name: 'Unending Resolve',     class:'Warlock',     type:'defensive',      duration:8,  cd:180 },
  107350: { name: 'Dark Pact',            class:'Warlock',     type:'defensive',      duration:20, cd:60  },
  1122:   { name: 'Summon Infernal',      class:'Warlock',     type:'offensive',      duration:30, cd:180 },
  205180: { name: 'Summon Darkglare',     class:'Warlock',     type:'offensive',      duration:20, cd:120 },
  265187: { name: 'Demonic Tyrant',       class:'Warlock',     type:'offensive',      duration:15, cd:90  },

  // Rogue
  13750:  { name: 'Adrenaline Rush',      class:'Rogue',       type:'offensive',      duration:20, cd:180 },
  185313: { name: 'Shadow Dance',         class:'Rogue',       type:'offensive',      duration:8,  cd:60  },
  360194: { name: 'Deathmark',            class:'Rogue',       type:'offensive',      duration:30, cd:120 },
  323654: { name: 'Flagellation',         class:'Rogue',       type:'offensive',      duration:12, cd:90  },

  // Monk
  137639: { name: 'Storm Earth Fire',     class:'Monk',        type:'offensive',      duration:15, cd:90  },
  115310: { name: 'Revival',              class:'Monk',        type:'healing',        duration:0,  cd:180 },
  116849: { name: 'Life Cocoon',          class:'Monk',        type:'defensive',      duration:12, cd:120 },
  123904: { name: 'Invoke Xuen',          class:'Monk',        type:'offensive',      duration:20, cd:120 },
  322118: { name: "Invoke Yu'lon",        class:'Monk',        type:'healing',        duration:25, cd:180 },
  325197: { name: 'Invoke Chi-Ji',        class:'Monk',        type:'healing',        duration:25, cd:180 },

  // Druid
  740:    { name: 'Tranquility',          class:'Druid',       type:'healing',        duration:8,  cd:180 },
  194223: { name: 'Celestial Alignment',  class:'Druid',       type:'offensive',      duration:20, cd:180 },
  29166:  { name: 'Innervate',            class:'Druid',       type:'utility',        duration:10, cd:180 },
  391528: { name: 'Convoke the Spirits',  class:'Druid',       type:'offensive',      duration:4,  cd:120 },
  197721: { name: 'Flourish',             class:'Druid',       type:'healing',        duration:0,  cd:60  },
  106898: { name: 'Stampeding Roar',      class:'Druid',       type:'utility',        duration:8,  cd:120 },

  // Demon Hunter
  200166: { name: 'Metamorphosis',        class:'DemonHunter', type:'offensive',      duration:30, cd:240 },
  187827: { name: 'Metamorphosis',        class:'DemonHunter', type:'tank-defensive', duration:15, cd:180 },
  196718: { name: 'Darkness',             class:'DemonHunter', type:'raid-defensive', duration:8,  cd:300 },
  370965: { name: 'The Hunt',             class:'DemonHunter', type:'offensive',      duration:0,  cd:90  },

  // Evoker
  390386: { name: 'Fury of the Aspects',  class:'Evoker',      type:'offensive',      duration:20, cd:120 },
  363534: { name: 'Rewind',               class:'Evoker',      type:'healing',        duration:0,  cd:240 },
  374227: { name: 'Zephyr',               class:'Evoker',      type:'raid-defensive', duration:8,  cd:120 },
  403631: { name: 'Breath of Eons',       class:'Evoker',      type:'offensive',      duration:10, cd:120 },
};

export const CD_TYPE_COLORS = {
  'offensive':      '#e85d04',
  'raid-defensive': '#023e8a',
  'tank-defensive': '#1b4332',
  'healing':        '#2d6a4f',
  'defensive':      '#3a0ca3',
  'utility':        '#6c757d',
  'discovered':     '#7c3aed',
};

export const ROAST_DEATH = [
  (n, c) => `${n} decided ${c} looked like a great place to stand. Narrator: it was not.`,
  (n, c) => `${n} vs ${c}. ${c} wins. Fatality.`,
  (n, c) => `${n} got absolutely cooked by ${c}. Healers are filing a complaint.`,
  (n, c) => `${n} and ${c} had a moment. It ended with ${n} on the floor.`,
  (n, c) => `Bold move from ${n}: die to ${c} and make it everyone else's problem.`,
];

export const COACH_DEATH = [
  (n, c) => `${n}: died to ${c}. Prioritise positioning/awareness on this mechanic.`,
  (n, c) => `${n}: ${c} was avoidable. Review the cast / warning indicator.`,
];

export const ROAST_AVOIDABLE = [
  (n, amt, sp) => `${n} took ${amt} from ${sp}. The circle was red. Red means bad. Usually.`,
  (n, amt, sp) => `${n} and ${sp}: a love story told in ${amt} unnecessary damage.`,
  (n, amt, sp) => `${n} collected ${amt} from ${sp} like it was a hobby.`,
];

export const COACH_AVOIDABLE = [
  (n, amt, sp) => `${n} took ${amt} avoidable damage from ${sp}. Focus on dodging this ability.`,
];

export function fmt(n, digits = 1) {
  if (n >= 1e9) return (n / 1e9).toFixed(digits) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(digits) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(digits) + 'K';
  return String(Math.round(n));
}

export function fmtTime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2,'0')}`;
}
