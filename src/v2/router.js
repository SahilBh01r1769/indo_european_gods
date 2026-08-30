const enc=value=>encodeURIComponent(value);
const dec=value=>decodeURIComponent(value||'');

function eraFrom(query){
  if(!query.has('era')) return null;
  const value=Number(query.get('era'));
  return Number.isFinite(value)?value:null;
}

export function parseRoute(hash=location.hash){
  const raw=(hash||'#explore').replace(/^#/,'')||'explore';
  const [pathPart,queryPart='']=raw.split('?');
  const parts=pathPart.split('/').filter(Boolean).map(dec);
  const query=new URLSearchParams(queryPart);
  const era=eraFrom(query);
  const head=parts[0]||'explore';

  if(head==='deity'&&parts[1]) return {type:'deity',id:parts[1]};
  if(head==='compare'&&parts[1]&&parts[2]) return {type:'compare',ids:[parts[1],parts[2]]};
  if(head==='compare-multi'&&parts.length>=3) return {type:'compare-multi',ids:parts.slice(1,4)};
  if(head==='collection') return {type:'collection'};
  if(head==='connections') return {type:'connections',center:parts[1]||null,era};
  if(head==='archetypes') return parts[1]?{type:'archetype',id:parts[1],era}:{type:'view',view:'archetypes',era};
  if(head==='atlas') return {type:'view',view:'atlas',era};
  if(head==='explore') return {type:'view',view:'explore',era};
  return {type:'view',view:'explore',era:null};
}

function eraSuffix(era){return Number.isFinite(era)?`?era=${era}`:'';}

export function hashForRoute(route){
  if(!route) return '#explore';
  if(route.type==='deity') return `#deity/${enc(route.id)}`;
  if(route.type==='compare') return `#compare/${route.ids.slice(0,2).map(enc).join('/')}`;
  if(route.type==='compare-multi') return `#compare-multi/${route.ids.slice(0,3).map(enc).join('/')}`;
  if(route.type==='collection') return '#collection';
  if(route.type==='connections') return `#connections${route.center?`/${enc(route.center)}`:''}${eraSuffix(route.era)}`;
  if(route.type==='archetype') return `#archetypes/${enc(route.id)}${eraSuffix(route.era)}`;
  const view=['explore','archetypes','atlas'].includes(route.view)?route.view:'explore';
  return `#${view}${eraSuffix(route.era)}`;
}

export function navigate(route,{replace=false}={}){
  const hash=hashForRoute(route);
  if(replace){
    history.replaceState(null,'',hash);
    return hash;
  }
  if(location.hash!==hash) location.hash=hash;
  return hash;
}
