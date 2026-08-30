import { archetypeById, candidateConnections, getDeity, getStory, relationBetween } from './model.js';

const STORAGE_KEY = 'mythos-v3-journey';
const listeners = new Set();
const blank = () => ({ started:false, startType:null, startId:null, discoveredNodes:[], discoveredEdges:[], selectedNode:null, selectedEdge:null, mode:'network', era:1400, compare:[], history:[], activeStory:null, archetypeStart:null });

function load() {
  if (typeof localStorage === 'undefined') return blank();
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || !Array.isArray(saved.discoveredNodes) || !Array.isArray(saved.discoveredEdges)) return blank();
    return { ...blank(), ...saved, compare:(saved.compare || []).slice(0,3) };
  } catch { return blank(); }
}

let state = load();
function persist(){ if(typeof localStorage==='undefined') return; try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch{} }
function publish(){ persist(); for(const listener of listeners) listener(getState()); }
function step(type,payload={}){ state.history=[...state.history,{type,at:Date.now(),...payload}].slice(-80); }

export function getState(){ return {...state,discoveredNodes:[...state.discoveredNodes],discoveredEdges:state.discoveredEdges.map(e=>({...e})),compare:[...state.compare],history:[...state.history]}; }
export function subscribe(listener){ listeners.add(listener); return ()=>listeners.delete(listener); }
export function resetJourney({publish:shouldPublish=true}={}){ state=blank(); if(shouldPublish) publish(); }

export function startWithDeity(id){
  const deity=getDeity(id); if(!deity) return false;
  state={...blank(),started:true,startType:'deity',startId:deity.id,discoveredNodes:[deity.id],selectedNode:deity.id};
  step('start-deity',{id:deity.id}); publish(); return true;
}

export function startWithArchetype(id){
  const archetype=archetypeById(id); if(!archetype) return false;
  const seeds=archetype.seeds.filter(getDeity).slice(0,2);
  const edges=seeds.length>1?[relationBetween(seeds[0],seeds[1])].filter(Boolean):[];
  state={...blank(),started:true,startType:'archetype',startId:archetype.id,archetypeStart:archetype.id,discoveredNodes:seeds,discoveredEdges:edges,selectedNode:seeds[0]||null};
  step('start-archetype',{id:archetype.id}); publish(); return true;
}

export function beginStory(id){
  const story=getStory(id); if(!story) return false; const first=story.path[0];
  state={...blank(),started:true,startType:'story',startId:story.id,discoveredNodes:[first],selectedNode:first,activeStory:{id:story.id,index:0}};
  step('start-story',{id:story.id}); publish(); return true;
}

export function revealStoryNext(){
  const active=state.activeStory; if(!active) return null; const story=getStory(active.id); if(!story) return null;
  const nextIndex=active.index+1; if(nextIndex>=story.path.length) return null;
  const from=story.path[active.index], target=story.path[nextIndex];
  revealDirect(from,target,{select:true,silent:true}); state.activeStory={id:story.id,index:nextIndex};
  step('story-step',{story:story.id,index:nextIndex,target}); publish(); return target;
}

export function availableClues(id=state.selectedNode){
  if(!id) return [];
  return candidateConnections(id,state.discoveredNodes,4).filter(clue=>!state.discoveredEdges.some(edge=>edge.id===clue.relation.id));
}
export function revealClue(clue){ if(!clue?.from||!clue?.target) return null; return revealDirect(clue.from,clue.target); }

export function revealDirect(from,target,{select=true,silent=false}={}){
  const a=getDeity(from), b=getDeity(target); if(!a||!b) return null; const relation=relationBetween(a,b); if(!relation) return null;
  if(!state.discoveredNodes.includes(a.id)) state.discoveredNodes.push(a.id);
  const newlyDiscovered=!state.discoveredNodes.includes(b.id); if(newlyDiscovered) state.discoveredNodes.push(b.id);
  if(!state.discoveredEdges.some(edge=>edge.id===relation.id)) state.discoveredEdges.push(relation);
  state.selectedNode=select?b.id:state.selectedNode; state.selectedEdge=relation.id;
  step('reveal',{from:a.id,target:b.id,kind:relation.kind}); if(!silent) publish(); return {deity:b,relation,newlyDiscovered};
}

export function addToJourney(id,from=state.selectedNode){
  const deity=getDeity(id); if(!deity) return false; if(!state.started) return startWithDeity(deity.id);
  if(from&&from!==deity.id) revealDirect(from,deity.id,{select:true});
  else { if(!state.discoveredNodes.includes(deity.id)) state.discoveredNodes.push(deity.id); state.selectedNode=deity.id; step('add-node',{id:deity.id}); publish(); }
  return true;
}
export function selectNode(id){ if(!state.discoveredNodes.includes(id)) return false; state.selectedNode=id; state.selectedEdge=null; publish(); return true; }
export function selectEdge(id){ const edge=state.discoveredEdges.find(x=>x.id===id); if(!edge) return false; state.selectedEdge=id; publish(); return true; }
export function setMode(mode){ if(!['network','time','geography'].includes(mode)) return; state.mode=mode; publish(); }
export function setEra(era){ const value=Number(era); if(!Number.isFinite(value)) return; state.era=value; publish(); }
export function toggleCompare(id){ const deity=getDeity(id); if(!deity) return; if(state.compare.includes(deity.id)) state.compare=state.compare.filter(x=>x!==deity.id); else if(state.compare.length<3) state.compare=[...state.compare,deity.id]; else state.compare=[...state.compare.slice(1),deity.id]; publish(); }
export function clearCompare(){ state.compare=[]; publish(); }
export function leaveStory(){ state.activeStory=null; publish(); }
