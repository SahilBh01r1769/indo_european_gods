import { DEITIES, TRAITS, getTraitValue } from '../data/deities.js';
import { COGNATE_PAIRS, getCognate } from '../data/cognates.js';
import { computeSimilarity, sharedTraits } from '../utils/similarity.js';
import { TRADITIONS } from './config.js';

export { DEITIES, TRAITS };

const BY_ID = new Map(DEITIES.map(d => [d.id, d]));
const pairKey=(a,b)=>[a,b].sort().join('--');

// A few older notes in the research dataset are intentionally displayed more
// cautiously in v2. The raw research file is preserved; the product layer
// distinguishes strong evidence from entertaining structural comparison.
const DISPLAY_OVERRIDES = new Map([
  [pairKey('Indra','Marduk'), { confidence:'comparative', note:'Both stories feature a divine champion defeating a chaos monster and establishing or restoring order. This is a cross-cultural combat-myth comparison, not evidence that Mesopotamian Marduk descends from a Proto-Indo-European deity.' }],
  [pairKey('Apophis','Indra'), { confidence:'comparative', note:'The serpent-combat pattern is visually striking across these traditions, but Egyptian Apophis is not an Indo-European inheritance. Treat this as a cross-cultural motif comparison.' }],
  [pairKey('Apophis','Thor'), { confidence:'comparative', note:'Thor and the Egyptian chaos-serpent complex both place serpentine monsters inside cosmic conflict. The resemblance is structural, not a claim of common ancestry.' }],
  [pairKey('Mithra','Surya'), { confidence:'comparative', note:'Both are associated with solar visibility and cosmic oversight, but Mithra’s direct Vedic name-cognate is Mitra, not Surya. This pair is thematic rather than etymological.' }],
  [pairKey('Yama','Hades'), { confidence:'comparative', note:'Both are useful underworld comparisons, but their roles differ: Yama is the first mortal to travel the road of death and later a judge; Hades is an underworld sovereign. Similar function does not establish a shared deity.' }],
  [pairKey('Odin','Varuna'), { confidence:'strong', note:'A classic structural comparison of sovereign figures associated with magic, knowledge, oaths and binding power. It is influential in comparative mythology, but remains an interpretive reconstruction rather than a direct name cognate.' }],
  [pairKey('Ishtar','Freya'), { confidence:'comparative', note:'Both combine love or fertility with warfare and associations with the dead. The parallel is provocative, but it is cross-cultural and should not be read as a demonstrated genealogical relationship.' }],
  [pairKey('Ra','Apollo'), { confidence:'comparative', note:'Both can participate in later solar and ordering symbolism, but Apollo’s solar identity is historically complex. This is a thematic comparison, not evidence of Egyptian–Greek divine ancestry.' }],
]);

export function deityById(id){ return BY_ID.get(id) || null; }
export function yearLabel(year){ if(year < 0) return `${Math.abs(year)} BCE`; if(year === 0) return 'c. 1 CE'; return `${year} CE`; }
export function deityVisibleAt(deity, horizon=1200){ return Number(deity?.era ?? 9999) <= horizon; }
export function deitiesAt(horizon=1200){ return DEITIES.filter(d => deityVisibleAt(d,horizon)); }

export function topTraits(deity, limit=5){
  return TRAITS.map(t => ({name:t, value:getTraitValue(deity,t)})).filter(x=>x.value>0).sort((a,b)=>b.value-a.value).slice(0,limit);
}

export function strengthLabel(score){
  if(score >= .78) return 'strong fit';
  if(score >= .58) return 'clear fit';
  if(score >= .38) return 'some overlap';
  return 'loose echo';
}

function cleanCurated(a,b,curated){
  if(!curated) return null;
  const override=DISPLAY_OVERRIDES.get(pairKey(a.id,b.id));
  return override ? {...curated,...override} : curated;
}

function relationKind(a,b,curated){
  if(!curated) return 'computed';
  const note = `${curated.note || ''}`.toLowerCase();
  if(/interpretatio|fusion|fused|hellenistic|derived from iranian|historical contact/.test(note)) return 'historical';
  const linguistic = /(direct.*cognate|etymological cognate|name cognate|direct reflex|reflexes of pie|from pie \*|pie \*.*name)/.test(note);
  if(linguistic) return 'linguistic';
  const groupA=TRADITIONS[a.pantheon]?.group;
  const groupB=TRADITIONS[b.pantheon]?.group;
  if(groupA !== groupB && (groupA==='Comparative' || groupB==='Comparative')) return 'comparative';
  if(curated.confidence==='proposed') return 'speculative';
  return 'structural';
}

export function evidenceLabel(kind){
  return ({
    linguistic:'Linguistic inheritance',
    historical:'Historical contact / fusion',
    structural:'Structural comparison',
    comparative:'Cross-cultural parallel',
    speculative:'Speculative curiosity',
    computed:'Computed thematic echo',
  })[kind] || 'Comparison';
}

export function relation(a,b){
  const score = computeSimilarity(a,b);
  const shared = sharedTraits(a,b,.4);
  const curated = cleanCurated(a,b,getCognate(a.id,b.id));
  const kind = relationKind(a,b,curated);
  const confidence = curated?.confidence || 'model only';
  return {
    a,b,score,shared,curated,kind,confidence,
    thematicLabel: score >= .78 ? 'Strong thematic overlap' : score >= .58 ? 'Moderate thematic overlap' : 'Loose thematic overlap',
  };
}

export function connectionsFor(deity,{horizon=1200,limit=12,crossCulture=false}={}){
  return deitiesAt(horizon)
    .filter(d => d.id !== deity.id)
    .filter(d => !crossCulture || d.pantheon !== deity.pantheon)
    .map(d => relation(deity,d))
    .filter(r => r.score >= .22 || r.curated)
    .sort((x,y) => {
      const bonus = r => r.curated ? .18 : 0;
      return (y.score+bonus(y))-(x.score+bonus(x));
    })
    .slice(0,limit);
}

export function searchDeities(query, limit=9){
  const q = query.trim().toLowerCase();
  if(!q) return [];
  return DEITIES.map(d => {
    const hay = [d.id,d.pantheon,d.epithet,d.desc,...(d.domains||[]),...(d.symbols||[])].join(' ').toLowerCase();
    let score = 0;
    if(d.id.toLowerCase().startsWith(q)) score += 8;
    if(d.id.toLowerCase().includes(q)) score += 5;
    if(d.pantheon.toLowerCase().includes(q)) score += 3;
    if(hay.includes(q)) score += 2;
    return {d,score};
  }).filter(x=>x.score).sort((a,b)=>b.score-a.score || a.d.id.localeCompare(b.d.id)).slice(0,limit).map(x=>x.d);
}

export function archetypeMembers(archetype, horizon=1200, limit=10){
  return deitiesAt(horizon).map(d => {
    const values = archetype.traits.map(t => getTraitValue(d,t));
    const score = values.reduce((a,b)=>a+b,0) / Math.max(values.length,1);
    return {deity:d,score};
  }).filter(x=>x.score>.22).sort((a,b)=>b.score-a.score).slice(0,limit);
}

export function compareDeities(a,b){
  const rel = relation(a,b);
  const traits = TRAITS.map(name => ({name,a:getTraitValue(a,name),b:getTraitValue(b,name)})).filter(x=>x.a>.15 || x.b>.15).sort((x,y)=>Math.max(y.a,y.b)-Math.max(x.a,x.b));
  return {rel,traits};
}

export function curatedFor(id){ return COGNATE_PAIRS.filter(p=>p.a===id || p.b===id); }
export function allCurated(){ return COGNATE_PAIRS; }
