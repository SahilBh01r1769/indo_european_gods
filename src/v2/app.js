import { DEITIES, deityById, yearLabel, topTraits, searchDeities, connectionsFor, compareDeities, compareMany, archetypeMembers, deitiesAt, deityVisibleAt, strengthLabel, evidenceLabel } from './model.js';
import { TRADITIONS, ARCHETYPES, EXHIBITS, DISCOVERIES, ERA_STOPS } from './config.js';
import { getDeityRefs } from '../data/citations.js';
import { renderNetwork } from './network.js';
import { renderAtlas } from './atlas.js';
import { parseRoute, navigate } from './router.js';

const state={view:'explore',selected:null,horizon:1200,networkCenter:'Thor',activeArchetype:null,discoveryIndex:Math.floor(Math.random()*DISCOVERIES.length),compareTray:[],returnRoute:null,atlasController:null};
const main=document.querySelector('#main-view');
const dossier=document.querySelector('#dossier');
const dialog=document.querySelector('#compare-dialog');
const compareTray=document.createElement('aside');
compareTray.id='compare-tray';compareTray.className='compare-tray';compareTray.setAttribute('aria-live','polite');document.body.append(compareTray);
let cleanup=()=>{};

const esc=s=>`${s??''}`.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const pct=n=>`${Math.round(n*100)}%`;
const traditionBadge=d=>`<span class="tradition-dot" style="--tradition:${TRADITIONS[d.pantheon]?.color||'#aaa'}"></span>${esc(d.pantheon)}`;
const relationBadge=r=>`<span class="evidence-badge kind-${esc(r.kind)}">${esc(evidenceLabel(r.kind))}</span>`;
const trim=(s,n=180)=>`${s||''}`.length>n?`${s.slice(0,n).trim()}…`:s||'';
const isContentRoute=r=>['deity','compare','compare-multi'].includes(r?.type);

function toast(msg){const el=document.querySelector('#toast');el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1800);}
function safeGet(key){try{return localStorage.getItem(key);}catch{return null;}}
function safeSet(key,value){try{localStorage.setItem(key,value);}catch{}}
function storyForPair(a,b){return DISCOVERIES.find(d=>(d.a===a&&d.b===b)||(d.a===b&&d.b===a))||null;}

function rememberReturnRoute(){state.returnRoute=location.hash||'#explore';}
function closeRouteOverlay(){const target=state.returnRoute||'#explore';state.returnRoute=null;if(location.hash!==target)location.hash=target;else applyRoute(parseRoute());}
function closeVisualOverlays(){dossier.classList.remove('open');dossier.setAttribute('aria-hidden','true');if(dialog.open)dialog.close();dialog.dataset.routeModal='false';}

function setView(view){
  if(view==='connections')navigate({type:'connections',center:state.networkCenter,era:state.horizon});
  else if(view==='atlas')navigate({type:'view',view:'atlas',era:state.horizon});
  else navigate({type:'view',view});
}
function selectDeity(id){rememberReturnRoute();navigate({type:'deity',id});}
function jumpToNetwork(id){state.networkCenter=id;state.selected=id;navigate({type:'connections',center:id,era:state.horizon});}
function openCompare(aId,bId){if(!deityById(aId)||!deityById(bId)||aId===bId)return;rememberReturnRoute();navigate({type:'compare',ids:[aId,bId]});}
function openMultiCompare(ids){const clean=[...new Set(ids)].filter(id=>deityById(id)).slice(0,3);if(clean.length<2)return;rememberReturnRoute();navigate(clean.length===2?{type:'compare',ids:clean}:{type:'compare-multi',ids:clean});}

function toggleTray(id){
  const index=state.compareTray.indexOf(id);
  if(index>=0)state.compareTray.splice(index,1);
  else if(state.compareTray.length<3)state.compareTray.push(id);
  else{toast('Compare tray holds up to three figures.');return;}
  renderCompareTray();
}
function renderCompareTray(){
  const ids=state.compareTray;
  compareTray.classList.toggle('show',ids.length>0);
  compareTray.innerHTML=ids.length?`<div class="compare-tray-inner"><span class="eyebrow">Compare tray · ${ids.length}/3</span><div class="compare-tray-chips">${ids.map(id=>`<button data-tray-toggle="${esc(id)}">${esc(id)} <i>×</i></button>`).join('')}</div><div class="compare-tray-actions"><button class="primary-action" data-tray-compare ${ids.length<2?'disabled':''}>${ids.length<2?'Add one more':`Compare ${ids.length}`}</button><button class="text-action" data-tray-clear>Clear</button></div></div>`:'';
  document.querySelectorAll('[data-tray-toggle]').forEach(btn=>btn.setAttribute('aria-pressed',ids.includes(btn.dataset.trayToggle)?'true':'false'));
}

function deityCard(d,{compact=false}={}){
  const traits=topTraits(d,compact?2:3),chosen=state.compareTray.includes(d.id);
  return `<article class="deity-card ${compact?'compact':''}" data-open-deity="${esc(d.id)}" tabindex="0">
    <div class="deity-card-top"><span class="culture-label">${traditionBadge(d)}</span><span class="era-label">${yearLabel(d.era)}</span></div>
    <button class="card-compare-toggle" data-tray-toggle="${esc(d.id)}" aria-pressed="${chosen}">${chosen?'✓ compare':'+ compare'}</button>
    <div class="deity-glyph">${esc(d.originalScript||d.id.slice(0,1))}</div>
    <h3>${esc(d.id)}</h3><p class="epithet">${esc(d.epithet||'')}</p>
    <div class="trait-pills">${traits.map(t=>`<span>${esc(t.name)}</span>`).join('')}</div>
    ${(d.symbols||[]).length?`<div class="artifact-line">${d.symbols.slice(0,3).map(x=>`<span>${esc(x)}</span>`).join('<i>·</i>')}</div>`:''}
  </article>`;
}

function rotatingFeatured(){
  const day=Math.floor(Date.now()/86400000),names=Object.keys(TRADITIONS),start=day%names.length;
  return Array.from({length:Math.min(8,names.length)},(_,i)=>names[(start+i)%names.length]).map((name,i)=>{
    const pool=DEITIES.filter(d=>d.pantheon===name);
    return pool[(day+i)%pool.length];
  }).filter(Boolean);
}

function discoveryCard(d){
  const a=deityById(d.a),b=deityById(d.b);if(!a||!b)return '';
  return `<article class="discovery-card kind-${esc(d.kind)}"><div class="discovery-top"><span class="eyebrow">Try a 30-second discovery</span><span class="evidence-badge kind-${esc(d.kind)}">${esc(d.label)}</span></div><p class="discovery-hook">${esc(d.hook)}</p><div class="discovery-pair"><button data-open-deity="${esc(a.id)}"><b>${esc(a.id)}</b><small>${traditionBadge(a)}</small></button><span class="discovery-link">↔</span><button data-open-deity="${esc(b.id)}"><b>${esc(b.id)}</b><small>${traditionBadge(b)}</small></button></div><p class="discovery-reveal">${esc(d.reveal)}</p><div class="discovery-actions"><button class="primary-action" data-discovery="${esc(d.a)}|${esc(d.b)}">Compare them</button><button class="secondary-action" data-next-discovery>Show me another</button></div></article>`;
}

function renderExplore(){
  const featured=rotatingFeatured(),discovery=DISCOVERIES[state.discoveryIndex%DISCOVERIES.length];
  main.innerHTML=`<section class="hero museum-section curiosity-hero"><div class="hero-copy"><span class="eyebrow">Comparative mythology, built for rabbit holes</span><h1>Pick a god. Find the weird connection.</h1><p>Names can be related. Stories can rhyme. Cultures can borrow. Sometimes two gods simply have the same strange job. Mythos Atlas lets you see the difference—and wander anyway.</p><div class="hero-actions"><button class="primary-action" data-surprise>Surprise me</button><button class="secondary-action" data-nav="connections">Open the network</button></div><div class="quick-questions"><span>Try:</span><button data-search-term="thunder">thunder gods</button><button data-search-term="underworld">underworld</button><button data-search-term="healing">healing</button><button data-search-term="trickster">tricksters</button></div></div>${discoveryCard(discovery)}</section>
  <section class="museum-section exhibits"><header class="section-head"><div><span class="eyebrow">Curated rabbit holes</span><h2>Eight ways into the collection.</h2></div><p>Every archetype gets a doorway here—from inherited dawn names to sacred fire, death and wild divine power.</p></header><div class="exhibit-grid">${EXHIBITS.map((x,i)=>`<article class="exhibit-card"><span>${esc(x.eyebrow)}</span><h3>${esc(x.title)}</h3><p>${esc(x.copy)}</p><div class="exhibit-route"><b>${esc(x.start)}</b><i>→</i><b>${esc(x.compare)}</b></div><button data-exhibit="${i}">Follow this trail →</button></article>`).join('')}</div></section>
  <section class="museum-section collection"><header class="section-head"><div><span class="eyebrow">Today’s eight figures</span><h2>The shelf changes each day.</h2></div><button class="text-action" data-show-all>View all ${DEITIES.length} figures →</button></header><div class="deity-grid">${featured.map(d=>deityCard(d)).join('')}</div></section>`;
}

function nearestEraAtOrAfter(year){return (ERA_STOPS.find(e=>e.value>=year)||ERA_STOPS.at(-1)).value;}
function renderConnections(){
  const center=deityById(state.networkCenter)||deityById('Thor');state.networkCenter=center.id;
  if(!deityVisibleAt(center,state.horizon)){
    const target=nearestEraAtOrAfter(center.era);
    main.innerHTML=`<section class="workspace connections-workspace"><aside class="context-panel"><span class="eyebrow">You are following</span><h1>${esc(center.id)}</h1><p>${esc(center.epithet)}</p><div class="context-meta"><span>${traditionBadge(center)}</span><span>${yearLabel(center.era)}</span></div></aside><div class="network-stage"><div class="viz-state prominent"><span>Timeline mismatch</span><h2>${esc(center.id)} is later than this horizon.</h2><p>Your filter ends at ${yearLabel(state.horizon)}, while this dataset first places ${esc(center.id)} around ${yearLabel(center.era)}.</p><button class="primary-action" data-era-jump="${target}">Move horizon to ${yearLabel(target)}</button></div></div><aside class="evidence-panel"><span class="eyebrow">Why this matters</span><p>The selected deity is not silently exempted from the chronology filter. Move the horizon forward or choose another figure.</p></aside></section>`;
    return;
  }
  const rels=connectionsFor(center,{horizon:state.horizon,limit:8});
  main.innerHTML=`<section class="workspace connections-workspace"><aside class="context-panel"><span class="eyebrow">You are following</span><h1>${esc(center.id)}</h1><p>${esc(center.epithet)}</p><div class="context-meta"><span>${traditionBadge(center)}</span><span>${yearLabel(center.era)}</span></div><button class="primary-action full" data-open-deity="${esc(center.id)}">Open dossier</button><div class="panel-rule"></div><h3>Good next jumps</h3><div class="relation-list">${rels.slice(0,5).map(r=>`<button data-network-center="${esc(r.b.id)}"><span>${esc(r.b.id)}<small>${esc(r.b.pantheon)} · ${esc(evidenceLabel(r.kind))}</small></span><b>${esc(strengthLabel(r.score))}</b></button>`).join('')}</div><p class="ranking-note">Evidence-backed trails are listed before model-only echoes; labels describe model overlap, not the sort key.</p><div class="panel-rule"></div><label class="field-label" for="era-select">Only show figures attested by</label><select id="era-select">${ERA_STOPS.map(e=>`<option value="${e.value}" ${e.value===state.horizon?'selected':''}>${e.label}</option>`).join('')}</select></aside><div class="network-stage" id="network-stage"><div class="viz-state"><span>Mapping connections…</span></div></div><aside class="evidence-panel" id="evidence-panel"><span class="eyebrow">Click a line</span><h2>Ask why these two are connected.</h2><p>The answer may be a shared trait profile, a related name, historical contact, or just an interesting cross-cultural echo.</p><div class="evidence-spectrum"><span class="kind-linguistic">name inheritance</span><span class="kind-historical">historical fusion</span><span class="kind-structural">structural parallel</span><span class="kind-comparative">cross-cultural echo</span></div><p class="fine-print">Tap a node for its dossier. Add figures to the compare tray from any dossier or collection card.</p></aside></section>`;
  const host=document.querySelector('#network-stage');let cancelled=false;cleanup=()=>{cancelled=true;};
  requestAnimationFrame(()=>{if(cancelled||!host?.isConnected)return;const stop=renderNetwork(host,{centerId:center.id,horizon:state.horizon,onSelect:id=>selectDeity(id),onCompare:(a,b)=>openCompare(a,b),onEdge:showEvidence});cleanup=()=>stop?.();});
  document.querySelector('#era-select')?.addEventListener('change',e=>{state.horizon=Number(e.target.value);navigate({type:'connections',center:center.id,era:state.horizon});});
}

function showEvidence(r){
  const el=document.querySelector('#evidence-panel');if(!el)return;
  el.innerHTML=`<span class="eyebrow">Why this edge exists</span><h2>${esc(r.a.id)} <i>↔</i> ${esc(r.b.id)}</h2>${relationBadge(r)}<div class="evidence-score"><strong>${esc(strengthLabel(r.score))}</strong><span class="model-number">${pct(r.score)} model overlap</span></div><p class="model-caveat">The percentage describes overlap between manually curated trait weights. It is not historical confidence or a probability that the gods share an origin.</p><h3>Shared profile</h3><div class="trait-pills large">${r.shared.length?r.shared.map(t=>`<span>${esc(t)}</span>`).join(''):'<em>The curated connection is more interesting than the trait overlap here.</em>'}</div>${r.curated?`<div class="curated-evidence"><span>${esc(r.confidence)}</span><p>${esc(r.curated.note)}</p><cite>${esc(r.curated.source||'Source listed in dataset')}</cite></div>`:`<p class="fine-print">This edge comes only from the structured trait model. Treat it as a discovery prompt, not a historical claim.</p>`}<button class="secondary-action full" data-compare="${esc(r.a.id)}|${esc(r.b.id)}">Compare side by side</button>`;
}

function renderArchetypes(){
  const active=ARCHETYPES.find(a=>a.id===state.activeArchetype);
  main.innerHTML=`<section class="museum-section archetype-page"><header class="page-intro"><span class="eyebrow">Recurring divine jobs</span><h1>Some roles keep showing up.</h1><p>Thunderer. Trickster. Far-shooter. Lord of the dead. Use these as doors into the collection—not as proof that every similar god came from the same ancestor.</p></header><div class="archetype-grid">${ARCHETYPES.map(a=>{const members=archetypeMembers(a,state.horizon,5);return `<article class="archetype-card ${active?.id===a.id?'active':''}" data-archetype="${a.id}"><span class="archetype-glyph">${a.glyph}</span><h2>${esc(a.title)}</h2><p>${esc(a.intro)}</p><blockquote>${esc(a.question)}</blockquote><div class="member-stack">${members.length?members.map(m=>`<button data-member-deity="${esc(m.deity.id)}" style="--tradition:${TRADITIONS[m.deity.pantheon]?.color}">${esc(m.deity.id)}</button>`).join(''):'<span class="empty-inline">No figures at this horizon</span>'}</div><small class="open-hint">Open trail →</small></article>`}).join('')}</div>${active?renderArchetypeFeature(active):''}</section>`;
}
function renderArchetypeFeature(a){
  const members=archetypeMembers(a,state.horizon,10);
  return `<section class="archetype-feature"><div><span class="eyebrow">Open rabbit hole</span><h2>${a.glyph} ${esc(a.title)}</h2><p>${esc(a.intro)}</p><h3>The question</h3><p>${esc(a.question)}</p><div class="trait-pills large">${a.traits.map(t=>`<span>${esc(t)}</span>`).join('')}</div><p class="model-caveat">The ranking uses the average of the listed trait weights. The bars beside each figure show the individual ingredients so a blended rank is never mistaken for a single measured property.</p></div><div class="ranked-members">${members.length?members.map((m,i)=>`<div class="ranked-row"><button class="ranked-main" data-open-deity="${esc(m.deity.id)}"><b>${String(i+1).padStart(2,'0')}</b><span>${esc(m.deity.id)}<small>${esc(m.deity.pantheon)} · ${yearLabel(m.deity.era)}</small><span class="archetype-breakdown">${m.breakdown.map(x=>`<i title="${esc(x.name)}"><b style="width:${Math.round(x.value*100)}%"></b></i>`).join('')}</span></span><strong>${esc(strengthLabel(m.score))}</strong></button><button class="ranked-add" data-tray-toggle="${esc(m.deity.id)}" aria-label="Add ${esc(m.deity.id)} to compare tray">+</button></div>`).join(''):'<div class="empty-state"><p>No members are visible at this historical horizon.</p></div>'}</div></section>`;
}

function traditionSidebar(visible){
  const visibleSet=new Set(visible.map(d=>d.pantheon));
  return Object.entries(TRADITIONS).map(([n,t])=>`<button class="tradition-item ${visibleSet.has(n)?'is-visible':'is-muted'}" data-tradition-focus="${esc(n)}"><i style="background:${t.color}"></i><span><b>${esc(n)}</b><small>${esc(t.group)} · ${esc(t.region)}</small><em>${esc(t.note)}</em></span></button>`).join('');
}
function updateAtlasUi(){
  const visible=deitiesAt(state.horizon),traditionsVisible=new Set(visible.map(d=>d.pantheon)).size;
  const readout=document.querySelector('#atlas-readout');if(readout)readout.innerHTML=`<strong>${ERA_STOPS.find(e=>e.value===state.horizon)?.label||yearLabel(state.horizon)}</strong><span>${visible.length} figures · ${traditionsVisible} traditions</span>`;
  document.querySelectorAll('[data-tradition-focus]').forEach(btn=>btn.classList.toggle('is-muted',!visible.some(d=>d.pantheon===btn.dataset.traditionFocus)));
}
function renderAtlasView(){
  const visible=deitiesAt(state.horizon),traditionsVisible=new Set(visible.map(d=>d.pantheon)).size;
  main.innerHTML=`<section class="workspace atlas-workspace"><aside class="atlas-story"><span class="eyebrow">Move time. Watch the record fill in.</span><h1>Myth has a geography.</h1><p>Drag the timeline and watch traditions enter the surviving written record at very different moments.</p><div class="timeline-readout" id="atlas-readout"><strong>${ERA_STOPS.find(e=>e.value===state.horizon)?.label||yearLabel(state.horizon)}</strong><span>${visible.length} figures · ${traditionsVisible} traditions</span></div><input id="era-range" type="range" min="0" max="${ERA_STOPS.length-1}" step="1" value="${Math.max(0,ERA_STOPS.findIndex(e=>e.value===state.horizon))}" /><div class="timeline-labels"><span>2000 BCE</span><span>1200 CE</span></div><div class="tradition-list">${traditionSidebar(visible)}</div><p class="fine-print">Markers represent approximate cultural centers, not deity-specific archaeological coordinates. Open a marker to browse every visible figure from that tradition.</p></aside><div class="map-stage"><div class="map-caption"><div><span class="eyebrow">Cultural atlas</span><strong>Each marker opens a tradition shelf</strong></div><button class="viz-fullscreen-button" data-viz-fullscreen>Full view</button></div><div id="atlas-map-host" class="atlas-map-host"><div class="viz-state"><span>Loading cultural map…</span></div></div></div></section>`;
  const host=document.querySelector('#atlas-map-host');let cancelled=false;cleanup=()=>{cancelled=true;state.atlasController?.destroy?.();state.atlasController=null;};
  requestAnimationFrame(()=>{if(cancelled||!host?.isConnected)return;state.atlasController=renderAtlas(host,{horizon:state.horizon,onSelect:id=>selectDeity(id)});});
  document.querySelector('#era-range')?.addEventListener('input',e=>{state.horizon=ERA_STOPS[Number(e.target.value)].value;state.atlasController?.setHorizon(state.horizon);updateAtlasUi();navigate({type:'view',view:'atlas',era:state.horizon},{replace:true});});
}

function renderDossier(){
  const d=deityById(state.selected);if(!d){dossier.setAttribute('aria-hidden','true');dossier.classList.remove('open');return;}
  const rels=connectionsFor(d,{horizon:1200,limit:6,crossCulture:true}),traits=topTraits(d,7),spotlight=rels.find(r=>r.curated)||rels[0],refs=getDeityRefs(d.id).slice(0,2),story=spotlight?storyForPair(d.id,spotlight.b.id):null;
  dossier.innerHTML=`<div class="dossier-head"><button class="icon-button" data-close-dossier aria-label="Close dossier">×</button><span class="eyebrow">Deity dossier</span><div class="dossier-script">${esc(d.originalScript||'')}</div><h2>${esc(d.id)}</h2><p>${esc(d.epithet||'')}</p><div class="context-meta"><span>${traditionBadge(d)}</span><span>${yearLabel(d.era)}</span></div></div><div class="dossier-body"><section><h3>Who is this?</h3><p class="serif-copy">${esc(d.desc||'')}</p></section>${spotlight?`<section class="look-twice"><span class="eyebrow">Why look twice</span><button data-compare="${esc(d.id)}|${esc(spotlight.b.id)}"><strong>${esc(d.id)} ↔ ${esc(spotlight.b.id)}</strong>${relationBadge(spotlight)}<p>${esc(trim(story?.reveal||spotlight.curated?.note||spotlight.thematicLabel,175))}</p></button></section>`:''}<section><h3>Mythic profile</h3><div class="trait-bars">${traits.map(t=>`<div><span>${esc(t.name)}</span><i><b style="width:${Math.round(t.value*100)}%"></b></i></div>`).join('')}</div></section><section><h3>Domains</h3><div class="trait-pills large">${(d.domains||[]).map(x=>`<span>${esc(x)}</span>`).join('')}</div></section>${(d.symbols||[]).length?`<section><h3>Objects & symbols</h3><div class="object-chips">${d.symbols.map(x=>`<span>${esc(x)}</span>`).join('')}</div></section>`:''}<section><h3>Jump somewhere else</h3><div class="dossier-relations">${rels.slice(0,5).map(r=>`<button data-compare="${esc(d.id)}|${esc(r.b.id)}"><span>${esc(r.b.id)}<small>${esc(r.b.pantheon)} · ${esc(evidenceLabel(r.kind))}</small></span><b>${esc(strengthLabel(r.score))}</b></button>`).join('')}</div></section>${refs.length?`<details class="source-drawer"><summary>Sources behind this profile</summary>${refs.map(r=>`<p><b>${esc(r.bib.author)} (${esc(r.bib.year)})</b><span>${esc(r.bib.title)}${r.pages?` · ${esc(r.pages)}`:''}</span></p>`).join('')}</details>`:''}<div class="dossier-actions"><button class="primary-action" data-network-center="${esc(d.id)}">Explore its network</button><button class="secondary-action" data-compare-pick="${esc(d.id)}">Choose a comparison</button><button class="text-action" data-tray-toggle="${esc(d.id)}">${state.compareTray.includes(d.id)?'Remove from compare tray':'Add to compare tray'}</button></div></div>`;
  dossier.setAttribute('aria-hidden','false');dossier.classList.add('open');renderCompareTray();
}

function modelExplainer(rel){
  const first=!safeGet('mythos-model-explained');
  return `<div class="model-explainer ${first?'first-run':''}"><strong>What does ${pct(rel.score)} mean?</strong><p>It is overlap between manually curated trait weights used for exploration. It is <b>not</b> historical confidence, ancestry probability, or scholarly consensus.</p>${first?'<button class="secondary-action" data-understood-model>Got it</button>':'<span>Model score ≠ evidence confidence.</span>'}</div>`;
}
function showCompare(aId,bId){
  const a=deityById(aId),b=deityById(bId);if(!a||!b||a.id===b.id)return;const {rel,traits}=compareDeities(a,b);
  dossier.classList.remove('open');dossier.setAttribute('aria-hidden','true');
  dialog.querySelector('#compare-content').innerHTML=`<div class="dialog-head"><div><span class="eyebrow">Side-by-side</span><h2>${esc(a.id)} <i>↔</i> ${esc(b.id)}</h2></div><button class="icon-button" data-close-dialog>×</button></div><div class="comparison-identity"><div><span>${traditionBadge(a)}</span><strong>${esc(a.id)}</strong><small>${esc(a.epithet)}</small></div><div class="comparison-score"><strong>${esc(strengthLabel(rel.score))}</strong><span class="model-number">${pct(rel.score)} model overlap</span></div><div><span>${traditionBadge(b)}</span><strong>${esc(b.id)}</strong><small>${esc(b.epithet)}</small></div></div>${modelExplainer(rel)}<div class="comparison-summary">${relationBadge(rel)}<div><span class="eyebrow">What they share</span><div class="trait-pills large">${rel.shared.length?rel.shared.map(t=>`<span>${esc(t)}</span>`).join(''):'<em>Not much in the trait model—the evidence trail is the interesting part.</em>'}</div></div></div>${rel.curated?`<div class="curated-evidence"><span>${esc(rel.confidence)}</span><p>${esc(rel.curated.note)}</p><cite>${esc(rel.curated.source||'Source listed in dataset')}</cite></div>`:`<p class="model-caveat">No curated historical claim is attached to this pair. This comparison is generated by the hobby trait model.</p>`}<div class="comparison-table"><div class="comparison-row header"><b>Trait</b><b>${esc(a.id)}</b><b>${esc(b.id)}</b></div>${traits.slice(0,10).map(t=>`<div class="comparison-row"><span>${esc(t.name)}</span><i><b style="width:${t.a*100}%"></b></i><i><b style="width:${t.b*100}%"></b></i></div>`).join('')}</div>`;
  dialog.dataset.routeModal='true';if(!dialog.open)dialog.showModal();
}
function showMultiCompare(ids){
  const {deities,traits,pairs}=compareMany(ids);if(deities.length<2)return;
  dossier.classList.remove('open');dossier.setAttribute('aria-hidden','true');
  dialog.querySelector('#compare-content').innerHTML=`<div class="dialog-head"><div><span class="eyebrow">Compare tray</span><h2>${deities.map(d=>esc(d.id)).join(' · ')}</h2></div><button class="icon-button" data-close-dialog>×</button></div><p class="model-caveat">Three-way comparison intentionally avoids a single headline score. Read the evidence type for each pair, then scan the trait profiles below.</p><div class="multi-pair-evidence">${pairs.map(r=>`<article>${relationBadge(r)}<strong>${esc(r.a.id)} ↔ ${esc(r.b.id)}</strong><span>${esc(strengthLabel(r.score))} · ${pct(r.score)} model overlap</span></article>`).join('')}</div><div class="multi-compare-table"><div class="multi-row header"><b>Trait</b>${deities.map(d=>`<b>${esc(d.id)}</b>`).join('')}</div>${traits.slice(0,12).map(row=>`<div class="multi-row"><span>${esc(row.name)}</span>${row.values.map(v=>`<i><b style="width:${v.value*100}%"></b></i>`).join('')}</div>`).join('')}</div>`;
  dialog.dataset.routeModal='true';if(!dialog.open)dialog.showModal();
}

function openComparePicker(fromId){
  const from=deityById(fromId);if(!from)return;const suggestions=connectionsFor(from,{limit:8,crossCulture:true});
  dialog.querySelector('#compare-content').innerHTML=`<div class="dialog-head"><div><span class="eyebrow">Choose a second figure</span><h2>Compare ${esc(from.id)} with…</h2></div><button class="icon-button" data-close-dialog>×</button></div><div class="compare-picker"><input id="compare-search" autocomplete="off" placeholder="Type a deity, tradition, domain…" aria-label="Choose deity to compare"/><div id="compare-options">${suggestions.map(r=>`<button data-compare="${esc(from.id)}|${esc(r.b.id)}"><span>${esc(r.b.id)}<small>${esc(r.b.pantheon)} · ${esc(evidenceLabel(r.kind))}</small></span><b>${esc(strengthLabel(r.score))}</b></button>`).join('')}</div></div>`;
  dialog.dataset.routeModal='false';if(!dialog.open)dialog.showModal();const input=dialog.querySelector('#compare-search');input?.focus();input?.addEventListener('input',()=>renderCompareOptions(from.id,input.value));
}
function renderCompareOptions(fromId,q){const host=dialog.querySelector('#compare-options');if(!host)return;const hits=searchDeities(q,9).filter(d=>d.id!==fromId);host.innerHTML=(q.trim()?hits:connectionsFor(deityById(fromId),{limit:8,crossCulture:true}).map(r=>r.b)).map(d=>`<button data-compare="${esc(fromId)}|${esc(d.id)}"><span>${esc(d.id)}<small>${esc(d.pantheon)} · ${esc(d.epithet||'')}</small></span><b>compare</b></button>`).join('')||'<div class="empty-state compact"><p>No matching figure yet.</p></div>';}

function renderCollection(){main.innerHTML=`<section class="museum-section collection-page"><header class="page-intro"><button class="text-action" data-nav="explore">← Back to discoveries</button><span class="eyebrow">Complete collection</span><h1>${DEITIES.length} figures. Pick one—or build a compare tray.</h1><p>Add up to three cards to the tray for a side-by-side view, or open a dossier and follow whichever relationship looks strange.</p></header><div class="deity-grid">${DEITIES.slice().sort((a,b)=>a.pantheon.localeCompare(b.pantheon)||a.id.localeCompare(b.id)).map(d=>deityCard(d,true)).join('')}</div></section>`;}
function surprise(){let next=Math.floor(Math.random()*DISCOVERIES.length);if(next===state.discoveryIndex)next=(next+1)%DISCOVERIES.length;state.discoveryIndex=next;const d=DISCOVERIES[next];openCompare(d.a,d.b);}

function renderBase(){
  cleanup();cleanup=()=>{};state.atlasController=null;closeVisualOverlays();document.body.classList.remove('viz-fullscreen');
  document.querySelectorAll('[data-nav]').forEach(x=>x.classList.toggle('active',x.dataset.nav===state.view));
  if(state.view==='connections')renderConnections();else if(state.view==='archetypes')renderArchetypes();else if(state.view==='atlas')renderAtlasView();else renderExplore();
  main.focus({preventScroll:true});renderCompareTray();
}

function applyRoute(route){
  if(route.type==='view'){
    state.view=route.view;if(Number.isFinite(route.era))state.horizon=route.era;if(route.view!=='archetypes')state.activeArchetype=null;renderBase();return;
  }
  if(route.type==='connections'){
    state.view='connections';if(route.center&&deityById(route.center))state.networkCenter=route.center;if(Number.isFinite(route.era))state.horizon=route.era;renderBase();return;
  }
  if(route.type==='archetype'){
    state.view='archetypes';state.activeArchetype=ARCHETYPES.some(a=>a.id===route.id)?route.id:null;if(Number.isFinite(route.era))state.horizon=route.era;renderBase();document.querySelector('.archetype-feature')?.scrollIntoView({block:'start'});return;
  }
  if(route.type==='collection'){state.view='explore';cleanup();cleanup=()=>{};closeVisualOverlays();renderCollection();renderCompareTray();return;}
  if(!main.innerHTML){state.view='explore';renderBase();}
  if(route.type==='deity'){if(dialog.open)dialog.close();state.selected=route.id;renderDossier();return;}
  if(route.type==='compare'){showCompare(...route.ids);return;}
  if(route.type==='compare-multi'){showMultiCompare(route.ids);return;}
}

function wireGlobal(){
  document.addEventListener('click',e=>{
    const tray=e.target.closest('[data-tray-toggle]');if(tray){e.preventDefault();e.stopPropagation();toggleTray(tray.dataset.trayToggle);return;}
    if(e.target.closest('[data-tray-clear]')){state.compareTray=[];renderCompareTray();return;}
    if(e.target.closest('[data-tray-compare]')){openMultiCompare(state.compareTray);return;}
    const nav=e.target.closest('[data-nav]');if(nav){e.preventDefault();setView(nav.dataset.nav);return;}
    const member=e.target.closest('[data-member-deity]');if(member){e.stopPropagation();selectDeity(member.dataset.memberDeity);return;}
    const deity=e.target.closest('[data-open-deity]');if(deity){selectDeity(deity.dataset.openDeity);return;}
    const nc=e.target.closest('[data-network-center]');if(nc){jumpToNetwork(nc.dataset.networkCenter);return;}
    const cmp=e.target.closest('[data-compare]');if(cmp){openCompare(...cmp.dataset.compare.split('|'));return;}
    const discovery=e.target.closest('[data-discovery]');if(discovery){openCompare(...discovery.dataset.discovery.split('|'));return;}
    const arc=e.target.closest('[data-archetype]');if(arc){navigate({type:'archetype',id:arc.dataset.archetype,era:state.horizon});return;}
    const ex=e.target.closest('[data-exhibit]');if(ex){const x=EXHIBITS[Number(ex.dataset.exhibit)];if(x)openCompare(x.start,x.compare);return;}
    const tradition=e.target.closest('[data-tradition-focus]');if(tradition){if(!state.atlasController?.focusTradition(tradition.dataset.traditionFocus))toast('No figures from that tradition are visible at this horizon.');return;}
    const era=e.target.closest('[data-era-jump]');if(era){state.horizon=Number(era.dataset.eraJump);navigate({type:'connections',center:state.networkCenter,era:state.horizon});return;}
    if(e.target.closest('[data-viz-fullscreen]')){document.body.classList.toggle('viz-fullscreen');return;}
    if(e.target.closest('[data-surprise]')){surprise();return;}
    if(e.target.closest('[data-next-discovery]')){state.discoveryIndex=(state.discoveryIndex+1)%DISCOVERIES.length;renderExplore();return;}
    if(e.target.closest('[data-show-all]')){navigate({type:'collection'});return;}
    if(e.target.closest('[data-close-dossier]')){closeRouteOverlay();return;}
    if(e.target.closest('[data-close-dialog]')){dialog.dataset.routeModal==='true'?closeRouteOverlay():dialog.close();return;}
    if(e.target.closest('[data-understood-model]')){safeSet('mythos-model-explained','1');e.target.closest('.model-explainer')?.classList.remove('first-run');e.target.remove();return;}
    const pick=e.target.closest('[data-compare-pick]');if(pick){openComparePicker(pick.dataset.comparePick);return;}
    const term=e.target.closest('[data-search-term]');if(term){const search=document.querySelector('#global-search');search.value=term.dataset.searchTerm;search.dispatchEvent(new Event('input'));search.focus();return;}
  });
  document.addEventListener('keydown',e=>{
    if(e.target.closest?.('button,input,select,textarea'))return;
    const card=e.target.closest?.('[data-open-deity]');if(card&&(e.key==='Enter'||e.key===' ')){e.preventDefault();selectDeity(card.dataset.openDeity);return;}
    if(e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)){e.preventDefault();document.querySelector('#global-search')?.focus();}
    if(e.key==='Escape'&&dossier.classList.contains('open'))closeRouteOverlay();
  });
  dialog.addEventListener('cancel',e=>{if(dialog.dataset.routeModal==='true'){e.preventDefault();closeRouteOverlay();}});
  const search=document.querySelector('#global-search'),results=document.querySelector('#search-results');
  search.addEventListener('input',()=>{const q=search.value.trim();if(!q){results.hidden=true;results.innerHTML='';return;}const hits=searchDeities(q);results.hidden=false;results.innerHTML=hits.length?hits.map(d=>`<button data-search-id="${esc(d.id)}"><span>${esc(d.id)}<small>${esc(d.epithet||'')}</small></span><b>${esc(d.pantheon)}</b></button>`).join(''):`<div class="search-empty"><strong>No match for “${esc(q)}”</strong><span>Try a deity, tradition, object or domain.</span></div>`;});
  results.addEventListener('click',e=>{const btn=e.target.closest('[data-search-id]');if(!btn)return;selectDeity(btn.dataset.searchId);search.value='';results.hidden=true;});
  window.addEventListener('hashchange',()=>applyRoute(parseRoute()));
}

wireGlobal();renderCompareTray();
if(!location.hash){navigate({type:'view',view:'explore'},{replace:true});}
applyRoute(parseRoute());
