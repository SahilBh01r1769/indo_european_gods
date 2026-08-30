import { DEITIES, TRAITS, getTraitValue } from '../data/deities.js';
import { COGNATE_PAIRS, getCognate } from '../data/cognates.js';
import { computeSimilarity, sharedTraits } from '../utils/similarity.js';

export { DEITIES, TRAITS };

const BY_ID = new Map(DEITIES.map(d => [d.id, d]));

export function deityById(id){ return BY_ID.get(id) || null; }
export function yearLabel(year){ if(year < 0) return `${Math.abs(year)} BCE`; if(year === 0) return 'c. 1 CE'; return `${year} CE`; }
export function deityVisibleAt(deity, horizon=1200){ return Number(deity?.era ?? 9999) <= horizon; }
export function deitiesAt(horizon=1200){ return DEITIES.filter(d => deityVisibleAt(d,horizon)); }

export function topTraits(deity, limit=5){
  return TRAITS.map(t => ({name:t, value:getTraitValue(deity,t)})).filter(x=>x.value>0).sort((a,b)=>b.value-a.value).slice(0,limit);
}

function relationKind(curated){
  if(!curated) return null;
  const note = `${curated.note || ''}`.toLowerCase();
  const linguistic = /(etymolog|direct.*cognate|name cognate|reflex|pie \*|derived from|from \*)/.test(note);
  if(linguistic) return 'linguistic';
  if(/interpretatio|fusion|derived from iranian/.test(note)) return 'historical';
  return 'curated';
}

export function relation(a,b){
  const score = computeSimilarity(a,b);
  const shared = sharedTraits(a,b,.4);
  const curated = getCognate(a.id,b.id);
  const kind = relationKind(curated);
  const confidence = curated?.confidence || (score >= .78 ? 'strong' : score >= .58 ? 'moderate' : 'exploratory');
  return {
    a,b,score,shared,curated,kind,confidence,
    thematicLabel: score >= .78 ? 'Strong thematic parallel' : score >= .58 ? 'Moderate thematic parallel' : 'Loose thematic parallel',
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
