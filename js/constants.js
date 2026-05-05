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

// WCL actor subType e.g. "DeathKnight-Blood"
// Hunter-Survival = melee DPS; DemonHunter-Havoc = ranged DPS; Evoker-Augmentation = ranged DPS
export function getRole(icon) {
  const tanks = [
    'DeathKnight-Blood', 'DemonHunter-Vengeance',
    'Druid-Guardian', 'Monk-Brewmaster',
    'Paladin-Protection', 'Warrior-Protection',
  ];
  const healers = [
    'Druid-Restoration', 'Evoker-Preservation',
    'Monk-Mistweaver', 'Paladin-Holy',
    'Priest-Discipline', 'Priest-Holy', 'Shaman-Restoration',
  ];
  if (tanks.includes(icon)) return 'Tank';
  if (healers.includes(icon)) return 'Healer';
  return 'DPS';
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

  // Paladin
  454351: { name: 'Avenging Wrath',       class:'Paladin',     type:'offensive',      duration:20, cd:120 },
  86659:  { name: 'Guardian of AK',       class:'Paladin',     type:'tank-defensive', duration:8,  cd:300 },

  // Hunter
  19574:  { name: 'Bestial Wrath',        class:'Hunter',      type:'offensive',      duration:15, cd:90  },
  193530: { name: 'Aspect of the Wild',   class:'Hunter',      type:'offensive',      duration:20, cd:120 },
  288613: { name: 'Trueshot',             class:'Hunter',      type:'offensive',      duration:15, cd:120 },

  // Priest
  64844:  { name: 'Divine Hymn',          class:'Priest',      type:'healing',        duration:8,  cd:180 },
  33206:  { name: 'Pain Suppression',     class:'Priest',      type:'defensive',      duration:8,  cd:180 },
  47536:  { name: 'Rapture',              class:'Priest',      type:'healing',        duration:8,  cd:90  },
  81782:  { name: 'Power Word: Barrier',  class:'Priest',      type:'raid-defensive', duration:10, cd:180 },

  // Death Knight
  42650:  { name: 'Army of the Dead',     class:'DeathKnight', type:'offensive',      duration:8,  cd:480 },
  51271:  { name: 'Pillar of Frost',      class:'DeathKnight', type:'offensive',      duration:12, cd:60  },
  81256:  { name: 'Dancing Rune Weapon',  class:'DeathKnight', type:'tank-defensive', duration:8,  cd:120 },
  55233:  { name: 'Vampiric Blood',       class:'DeathKnight', type:'tank-defensive', duration:10, cd:180 },
  48792:  { name: 'Icebound Fortitude',   class:'DeathKnight', type:'defensive',      duration:8,  cd:180 },
  145629: { name: 'Anti-Magic Zone',      class:'DeathKnight', type:'raid-defensive', duration:8,  cd:120 },

  // Shaman
  108280: { name: 'Healing Tide Totem',   class:'Shaman',      type:'healing',        duration:10, cd:180 },
  98008:  { name: 'Spirit Link Totem',    class:'Shaman',      type:'raid-defensive', duration:6,  cd:180 },
  207399: { name: 'Ancestral Protection', class:'Shaman',      type:'raid-defensive', duration:30, cd:300 },
  198067: { name: 'Fire Elemental',       class:'Shaman',      type:'offensive',      duration:30, cd:150 },
  2825:   { name: 'Bloodlust',            class:'Shaman',      type:'utility',        duration:40, cd:300 },
  32182:  { name: 'Heroism',              class:'Shaman',      type:'utility',        duration:40, cd:300 },

  // Mage
  190319: { name: 'Combustion',           class:'Mage',        type:'offensive',      duration:10, cd:120 },
  12472:  { name: 'Icy Veins',            class:'Mage',        type:'offensive',      duration:20, cd:120 },
  365350: { name: 'Arcane Surge',         class:'Mage',        type:'offensive',      duration:15, cd:120 },
  80353:  { name: 'Time Warp',            class:'Mage',        type:'utility',        duration:40, cd:300 },

  // Warlock
  104773: { name: 'Unending Resolve',     class:'Warlock',     type:'defensive',      duration:8,  cd:180 },

  // Rogue
  13750:  { name: 'Adrenaline Rush',      class:'Rogue',       type:'offensive',      duration:20, cd:180 },
  185313: { name: 'Shadow Dance',         class:'Rogue',       type:'offensive',      duration:8,  cd:60  },

  // Monk
  137639: { name: 'Storm Earth Fire',     class:'Monk',        type:'offensive',      duration:15, cd:90  },
  115310: { name: 'Revival',              class:'Monk',        type:'healing',        duration:0,  cd:180 },
  116849: { name: 'Life Cocoon',          class:'Monk',        type:'defensive',      duration:12, cd:120 },

  // Druid
  740:    { name: 'Tranquility',          class:'Druid',       type:'healing',        duration:8,  cd:180 },
  194223: { name: 'Celestial Alignment',  class:'Druid',       type:'offensive',      duration:20, cd:180 },
  29166:  { name: 'Innervate',            class:'Druid',       type:'utility',        duration:10, cd:180 },

  // Demon Hunter
  200166: { name: 'Metamorphosis',        class:'DemonHunter', type:'offensive',      duration:30, cd:240 },
  187827: { name: 'Metamorphosis',        class:'DemonHunter', type:'tank-defensive', duration:15, cd:180 },
  196718: { name: 'Darkness',             class:'DemonHunter', type:'raid-defensive', duration:8,  cd:300 },

  // Evoker
  390386: { name: 'Fury of the Aspects',  class:'Evoker',      type:'offensive',      duration:20, cd:120 },
  363534: { name: 'Rewind',               class:'Evoker',      type:'healing',        duration:0,  cd:240 },
};

export const CD_TYPE_COLORS = {
  'offensive':      '#e85d04',
  'raid-defensive': '#023e8a',
  'tank-defensive': '#1b4332',
  'healing':        '#2d6a4f',
  'defensive':      '#3a0ca3',
  'utility':        '#6c757d',
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
