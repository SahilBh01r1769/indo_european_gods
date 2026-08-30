import { DEITIES, deityById, yearLabel, topTraits, searchDeities, connectionsFor, compareDeities, archetypeMembers, deitiesAt, strengthLabel, evidenceLabel } from './model.js';
import { TRADITIONS, ARCHETYPES, EXHIBITS, DISCOVERIES, ERA_STOPS } from './config.js';
import { getDeityRefs } from '../data/citations.js';
import { renderNetwork } from './network.js';
import { renderAtlas } from './atlas.js';

const state={view:'explore',selected:null,horizon:1200,networkCenter:'Thor',activeArchetype:null,discoveryIndex:Math.floor(Math.random()*DISCOVERIES.length)};
const main=document.querySelector('#main-view');
const dossier=document.querySelector('#dossier');
const dialog=document.querySelector('#compare-dialog');
let cleanup=()=>{};

const esc=s=>`${s??''}`.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const pct=n=>`${Math.round(n*100)}%`;
const traditionBadge=d=>`<span class="tradition-dot" style="--tradition:${TRADITIONS[d.pantheon]?.color||'#aaa'}"></span>${esc(d.pantheon)}`;
const relationBadge=r=>`<span class="evidence-badge kind-${esc(r.kind)}">${esc(evidenceLabel(r.kind))}</span>`;
const trim=(s,n=180)=>`${s||''}`.length>n?`${s.slice(0,n).trim()}…`:s||'';

function setView(view){state.view=view;cleanup();cleanup=()=>{};location.hash=view;render();}
function selectDeity(id,{open=true}={}){state.selected=id;if(open)renderDossier();}
function jumpToNetwork(id){state.networkCenter=id;state.selected=id;setView('connections');}
function toast(msg){const el=document.querySelector('#toast');el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1800);}

function deityCard(d,{compact=false}={}){
  const traits=topTraits(d,compact?2:3);
  return `<article class="deity-card ${compact?'compact':''}" data-open-deity="${esc(d.id)}" tabindex="0">
    <div class="deity-card-top"><span class="culture-label">${traditionBadge(d)}</span><span class="era-label">${yearLabel(d.era)}</span></div>
    <div class="deity-glyph">${esc(d.originalScript||d.id.slice(0,1))}</div>
    <h3>${esc(d.id)}</h3><p class="epithet">${esc(d.epithet||'')}</p>
    <div class="trait-pills">${traits.map(t=>`<span>${esc(t.name)}</span>`).join('')}</div>
    ${(d.symbols||[]).length?`<div class="artifact-line">${d.symbols.slice(0,3).map(x=>`<span>${esc(x)}</span>`).join('<i>·</i>')}</div>`:''}
  </article>`;
}

function discoveryCard(d){
  const a=deityById(d.a),b=deityById(d.b);
  if(!a||!b)return '';
  return `<article class="discovery-card kind-${esc(d.kind)}">
    <div class="discovery-top"><span class="eyebrow">Try a 30-second discovery</span><span class="evidence-badge kind-${esc(d.kind)}">${esc(d.label)}</span></div>
    <p class="discovery-hook">${esc(d.hook)}</p>
    <div class="discovery-pair">
      <button data-open-deity="${esc(a.id)}"><b>${esc(a.id)}</b><small>${traditionBadge(a)}</small></button>
      <span class="discovery-link">↔</span>
      <button data-open-deity="${esc(b.id)}"><b>${esc(b.id)}</b><small>${traditionBadge(b)}</small></button>
    </div>
    <p class="discovery-reveal">${esc(d.reveal)}</p>
    <div class="discovery-actions"><button class="primary-action" data-discovery="${esc(d.a)}|${esc(d.b)}">Compare them</button><button class="secondary-action" data-next-discovery>Show me another</button></div>
  </article>`;
}

function renderExplore(){
  const featured=['Zeus','Indra','Thor','Apollo','Rudra','Odin','Hermes','Ishtar'].map(deityById).filter(Boolean);
  const discovery=DISCOVERIES[state.discoveryIndex%DISCOVERIES.length];
  main.innerHTML=`
  <section class="hero museum-section curiosity-hero">
    <div class="hero-copy"><span class="eyebrow">Comparative mythology, built for rabbit holes</span><h1>Pick a god. Find the weird connection.</h1>
      <p>Names can be related. Stories can rhyme. Cultures can borrow. Sometimes two gods simply have the same strange job. Mythos Atlas lets you see the difference—and wander anyway.</p>
      <div class="hero-actions"><button class="primary-action" data-surprise>Surprise me</button><button class="secondary-action" data-nav="connections">Open the network</button></div>
      <div class="quick-questions"><span>Try:</span><button data-search-term="thunder">thunder gods</button><button data-search-term="underworld">underworld</button><button data-search-term="healing">healing</button><button data-search-term="trickster">tricksters</button></div>
    </div>
    ${discoveryCard(discovery)}
  </section>
  <section class="museum-section exhibits"><header class="section-head"><div><span class="eyebrow">Curated rabbit holes</span><h2>Four good places to get lost.</h2></div><p>Each trail starts with one memorable question, then opens the evidence instead of front-loading methodology.</p></header>
    <div class="exhibit-grid">${EXHIBITS.map((x,i)=>`<article class="exhibit-card"><span>${esc(x.eyebrow)}</span><h3>${esc(x.title)}</h3><p>${esc(x.copy)}</p><div class="exhibit-route"><b>${esc(x.start)}</b><i>→</i><b>${esc(x.compare)}</b></div><button data-exhibit="${i}">Follow this trail →</button></article>`).join('')}</div>
  </section>
  <section class="museum-section collection"><header class="section-head"><div><span class="eyebrow">Browse by figure</span><h2>Open a dossier, then follow what catches your eye.</h2></div><button class="text-action" data-show-all>View all ${DEITIES.length} figures →</button></header><div class="deity-grid">${featured.map(d=>deityCard(d)).join('')}</div></section>`;
}

function renderConnections(){
  const center=deityById(state.networkCenter)||deityById('Thor');
  const rels=connectionsFor(center,{horizon:state.horizon,limit:8});
  main.innerHTML=`<section class="workspace connections-workspace">
    <aside class="context-panel"><span class="eyebrow">You are following</span><h1>${esc(center.id)}</h1><p>${esc(center.epithet)}</p>
      <div class="context-meta"><span>${traditionBadge(center)}</span><span>${yearLabel(center.era)}</span></div>
      <button class="primary-action full" data-open-deity="${esc(center.id)}">Open dossier</button>
      <div class="panel-rule"></div><h3>Good next jumps</h3>
      <div class="relation-list">${rels.slice(0,5).map(r=>`<button data-network-center="${esc(r.b.id)}"><span>${esc(r.b.id)}<small>${esc(r.b.pantheon)} · ${esc(evidenceLabel(r.kind))}</small></span><b>${esc(strengthLabel(r.score))}</b></button>`).join('')}</div>
      <div class="panel-rule"></div><label class="field-label" for="era-select">Only show figures attested by</label><select id="era-select">${ERA_STOPS.map(e=>`<option value="${e.value}" ${e.value===state.horizon?'selected':''}>${e.label}</option>`).join('')}</select>
    </aside>
    <div class="network-stage" id="network-stage"></div>
    <aside class="evidence-panel" id="evidence-panel"><span class="eyebrow">Click a line</span><h2>Ask why these two are connected.</h2><p>The answer may be a shared trait profile, a related name, historical contact, or just an interesting cross-cultural echo.</p><div class="evidence-spectrum"><span class="kind-linguistic">name inheritance</span><span class="kind-historical">historical fusion</span><span class="kind-structural">structural parallel</span><span class="kind-comparative">cross-cultural echo</span></div><p class="fine-print">Double-click a node to compare it directly with ${esc(center.id)}.</p></aside>
  </section>`;
  cleanup=renderNetwork(document.querySelector('#network-stage'),{centerId:center.id,horizon:state.horizon,onSelect:id=>selectDeity(id),onCompare:(a,b)=>openCompare(a,b),onEdge:showEvidence});
  document.querySelector('#era-select')?.addEventListener('change',e=>{state.horizon=Number(e.target.value);renderConnections();});
}

function showEvidence(r){
  const el=document.querySelector('#evidence-panel');if(!el)return;
  el.innerHTML=`<span class="eyebrow">Why this edge exists</span><h2>${esc(r.a.id)} <i>↔</i> ${esc(r.b.id)}</h2>${relationBadge(r)}<div class="evidence-score"><strong>${pct(r.score)}</strong><span>${esc(r.thematicLabel)} in the hobby model</span></div><h3>Shared profile</h3><div class="trait-pills large">${r.shared.length?r.shared.map(t=>`<span>${esc(t)}</span>`).join(''):'<em>The curated connection is more interesting than the trait overlap here.</em>'}</div>${r.curated?`<div class="curated-evidence"><span>${esc(r.confidence)}</span><p>${esc(r.curated.note)}</p><cite>${esc(r.curated.source||'Source listed in dataset')}</cite></div>`:`<p class="fine-print">This edge comes only from the structured trait model. Treat it as a discovery prompt, not a historical claim.</p>`}<button class="secondary-action full" data-compare="${esc(r.a.id)}|${esc(r.b.id)}">Compare side by side</button>`;
}

function renderArchetypes(){
  const active=ARCHETYPES.find(a=>a.id===state.activeArchetype);
  main.innerHTML=`<section class="museum-section archetype-page"><header class="page-intro"><span class="eyebrow">Recurring divine jobs</span><h1>Some roles keep showing up.</h1><p>Thunderer. Trickster. Far-shooter. Lord of the dead. Use these as doors into the collection—not as proof that every similar god came from the same ancestor.</p></header>
    <div class="archetype-grid">${ARCHETYPES.map(a=>{const members=archetypeMembers(a,state.horizon,5);return `<article class="archetype-card ${active?.id===a.id?'active':''}" data-archetype="${a.id}"><span class="archetype-glyph">${a.glyph}</span><h2>${esc(a.title)}</h2><p>${esc(a.intro)}</p><blockquote>${esc(a.question)}</blockquote><div class="member-stack">${members.map(m=>`<span style="--tradition:${TRADITIONS[m.deity.pantheon]?.color}">${esc(m.deity.id)}</span>`).join('')}</div><small class="open-hint">Open trail →</small></article>`}).join('')}</div>
    ${active?renderArchetypeFeature(active):''}
  </section>`;
}
function renderArchetypeFeature(a){const members=archetypeMembers(a,state.horizon,10);return `<section class="archetype-feature"><div><span class="eyebrow">Open rabbit hole</span><h2>${a.glyph} ${esc(a.title)}</h2><p>${esc(a.intro)}</p><h3>The question</h3><p>${esc(a.question)}</p><div class="trait-pills large">${a.traits.map(t=>`<span>${esc(t)}</span>`).join('')}</div></div><div class="ranked-members">${members.map((m,i)=>`<button data-open-deity="${esc(m.deity.id)}"><b>${String(i+1).padStart(2,'0')}</b><span>${esc(m.deity.id)}<small>${esc(m.deity.pantheon)} · ${yearLabel(m.deity.era)}</small></span><strong>${esc(strengthLabel(m.score))}</strong></button>`).join('')}</div></section>`;}

function renderAtlasView(){
  const visible=deitiesAt(state.horizon);
  const traditionsVisible=new Set(visible.map(d=>d.pantheon)).size;
  main.innerHTML=`<section class="workspace atlas-workspace"><aside class="atlas-story"><span class="eyebrow">Move time. Watch the record fill in.</span><h1>Myth has a geography.</h1><p>Drag the timeline and watch traditions enter the surviving written record at very different moments.</p><div class="timeline-readout"><strong>${ERA_STOPS.find(e=>e.value===state.horizon)?.label||yearLabel(state.horizon)}</strong><span>${visible.length} figures · ${traditionsVisible} traditions</span></div><input id="era-range" type="range" min="0" max="${ERA_STOPS.length-1}" step="1" value="${Math.max(0,ERA_STOPS.findIndex(e=>e.value===state.horizon))}" /><div class="timeline-labels"><span>2000 BCE</span><span>1200 CE</span></div><div class="tradition-list">${Object.entries(TRADITIONS).map(([n,t])=>`<div><i style="background:${t.color}"></i><span><b>${n}</b><small>${t.group}</small></span></div>`).join('')}</div><p class="fine-print">Map points are approximate cultural centers, not deity-specific archaeological coordinates.</p></aside><div class="map-stage"><div class="map-caption"><span class="eyebrow">Cultural atlas</span><strong>Select a marker to open a deity dossier</strong></div><div id="atlas-map-host" class="atlas-map-host"></div></div></section>`;
  cleanup=renderAtlas(document.querySelector('#atlas-map-host'),{horizon:state.horizon,onSelect:id=>selectDeity(id)});
  document.querySelector('#era-range')?.addEventListener('input',e=>{state.horizon=ERA_STOPS[Number(e.target.value)].value;renderAtlasView();});
}

function renderDossier(){
  const d=deityById(state.selected);if(!d){dossier.setAttribute('aria-hidden','true');dossier.classList.remove('open');return;}
  const rels=connectionsFor(d,{horizon:1200,limit:6,crossCulture:true});
  const traits=topTraits(d,7);
  const spotlight=rels.find(r=>r.curated)||rels[0];
  const refs=getDeityRefs(d.id).slice(0,2);
  dossier.innerHTML=`<div class="dossier-head"><button class="icon-button" data-close-dossier aria-label="Close dossier">×</button><span class="eyebrow">Deity dossier</span><div class="dossier-script">${esc(d.originalScript||'')}</div><h2>${esc(d.id)}</h2><p>${esc(d.epithet||'')}</p><div class="context-meta"><span>${traditionBadge(d)}</span><span>${yearLabel(d.era)}</span></div></div><div class="dossier-body">
    <section><h3>Who is this?</h3><p class="serif-copy">${esc(d.desc||'')}</p></section>
    ${spotlight?`<section class="look-twice"><span class="eyebrow">Why look twice</span><button data-compare="${esc(d.id)}|${esc(spotlight.b.id)}"><strong>${esc(d.id)} ↔ ${esc(spotlight.b.id)}</strong>${relationBadge(spotlight)}<p>${esc(trim(spotlight.curated?.note||spotlight.thematicLabel,155))}</p></button></section>`:''}
    <section><h3>Mythic profile</h3><div class="trait-bars">${traits.map(t=>`<div><span>${esc(t.name)}</span><i><b style="width:${Math.round(t.value*100)}%"></b></i></div>`).join('')}</div></section>
    <section><h3>Domains</h3><div class="trait-pills large">${(d.domains||[]).map(x=>`<span>${esc(x)}</span>`).join('')}</div></section>
    ${(d.symbols||[]).length?`<section><h3>Objects & symbols</h3><div class="object-chips">${d.symbols.map(x=>`<span>${esc(x)}</span>`).join('')}</div></section>`:''}
    <section><h3>Jump somewhere else</h3><div class="dossier-relations">${rels.slice(0,5).map(r=>`<button data-compare="${esc(d.id)}|${esc(r.b.id)}"><span>${esc(r.b.id)}<small>${esc(r.b.pantheon)} · ${esc(evidenceLabel(r.kind))}</small></span><b>${esc(strengthLabel(r.score))}</b></button>`).join('')}</div></section>
    ${refs.length?`<details class="source-drawer"><summary>Sources behind this profile</summary>${refs.map(r=>`<p><b>${esc(r.bib.author)} (${esc(r.bib.year)})</b><span>${esc(r.bib.title)}${r.pages?` · ${esc(r.pages)}`:''}</span></p>`).join('')}</details>`:''}
    <div class="dossier-actions"><button class="primary-action" data-network-center="${esc(d.id)}">Explore its network</button><button class="secondary-action" data-compare-pick="${esc(d.id)}">Choose a comparison</button></div></div>`;
  dossier.setAttribute('aria-hidden','false');dossier.classList.add('open');
}

function openCompare(aId,bId){
  const a=deityById(aId),b=deityById(bId);if(!a||!b||a.id===b.id)return;
  const {rel,traits}=compareDeities(a,b);
  dialog.querySelector('#compare-content').innerHTML=`<div class="dialog-head"><div><span class="eyebrow">Side-by-side</span><h2>${esc(a.id)} <i>↔</i> ${esc(b.id)}</h2></div><button class="icon-button" data-close-dialog>×</button></div>
    <div class="comparison-identity"><div><span>${traditionBadge(a)}</span><strong>${esc(a.id)}</strong><small>${esc(a.epithet)}</small></div><div class="comparison-score"><strong>${pct(rel.score)}</strong><span>thematic overlap in this model</span></div><div><span>${traditionBadge(b)}</span><strong>${esc(b.id)}</strong><small>${esc(b.epithet)}</small></div></div>
    <div class="comparison-summary">${relationBadge(rel)}<div><span class="eyebrow">What they share</span><div class="trait-pills large">${rel.shared.length?rel.shared.map(t=>`<span>${esc(t)}</span>`).join(''):'<em>Not much in the trait model—the evidence trail is the interesting part.</em>'}</div></div></div>
    ${rel.curated?`<div class="curated-evidence"><span>${esc(rel.confidence)}</span><p>${esc(rel.curated.note)}</p><cite>${esc(rel.curated.source||'Source listed in dataset')}</cite></div>`:`<p class="fine-print">No curated historical claim is attached to this pair. The comparison is generated from the hobby trait model.</p>`}
    <div class="comparison-table"><div class="comparison-row header"><b>Trait</b><b>${esc(a.id)}</b><b>${esc(b.id)}</b></div>${traits.slice(0,10).map(t=>`<div class="comparison-row"><span>${esc(t.name)}</span><i><b style="width:${t.a*100}%"></b></i><i><b style="width:${t.b*100}%"></b></i></div>`).join('')}</div>`;
  dialog.showModal();
}

function openComparePicker(fromId){
  const from=deityById(fromId);if(!from)return;
  const suggestions=connectionsFor(from,{limit:8,crossCulture:true});
  dialog.querySelector('#compare-content').innerHTML=`<div class="dialog-head"><div><span class="eyebrow">Choose a second figure</span><h2>Compare ${esc(from.id)} with…</h2></div><button class="icon-button" data-close-dialog>×</button></div><div class="compare-picker"><input id="compare-search" autocomplete="off" placeholder="Type a deity, tradition, domain…" aria-label="Choose deity to compare" data-compare-from="${esc(from.id)}"/><div id="compare-options">${suggestions.map(r=>`<button data-compare="${esc(from.id)}|${esc(r.b.id)}"><span>${esc(r.b.id)}<small>${esc(r.b.pantheon)} · ${esc(evidenceLabel(r.kind))}</small></span><b>${esc(strengthLabel(r.score))}</b></button>`).join('')}</div></div>`;
  dialog.showModal();
  const input=dialog.querySelector('#compare-search');input?.focus();
  input?.addEventListener('input',()=>renderCompareOptions(from.id,input.value));
}
function renderCompareOptions(fromId,q){
  const host=dialog.querySelector('#compare-options');if(!host)return;
  const hits=searchDeities(q,9).filter(d=>d.id!==fromId);
  host.innerHTML=(q.trim()?hits:connectionsFor(deityById(fromId),{limit:8,crossCulture:true}).map(r=>r.b)).map(d=>`<button data-compare="${esc(fromId)}|${esc(d.id)}"><span>${esc(d.id)}<small>${esc(d.pantheon)} · ${esc(d.epithet||'')}</small></span><b>compare</b></button>`).join('')||'<p class="fine-print">No matching figure yet.</p>';
}

function showAll(){main.innerHTML=`<section class="museum-section collection-page"><header class="page-intro"><button class="text-action" data-nav="explore">← Back to discoveries</button><span class="eyebrow">Complete collection</span><h1>${DEITIES.length} figures. Pick one.</h1><p>You do not need to understand the model first. Open a dossier and follow whichever comparison looks strange.</p></header><div class="deity-grid">${DEITIES.slice().sort((a,b)=>a.pantheon.localeCompare(b.pantheon)||a.id.localeCompare(b.id)).map(d=>deityCard(d,true)).join('')}</div></section>`;}

function openExhibit(i){const x=EXHIBITS[i];if(!x)return;state.activeArchetype=x.archetype;openCompare(x.start,x.compare);}
function surprise(){let next=Math.floor(Math.random()*DISCOVERIES.length);if(next===state.discoveryIndex)next=(next+1)%DISCOVERIES.length;state.discoveryIndex=next;const d=DISCOVERIES[next];openCompare(d.a,d.b);}
function render(){document.querySelectorAll('[data-nav]').forEach(x=>x.classList.toggle('active',x.dataset.nav===state.view));if(state.view==='connections')renderConnections();else if(state.view==='archetypes')renderArchetypes();else if(state.view==='atlas')renderAtlasView();else renderExplore();main.focus({preventScroll:true});}

function wireGlobal(){
  document.addEventListener('click',e=>{
    const nav=e.target.closest('[data-nav]');if(nav){e.preventDefault();setView(nav.dataset.nav);return;}
    const deity=e.target.closest('[data-open-deity]');if(deity){selectDeity(deity.dataset.openDeity);return;}
    const nc=e.target.closest('[data-network-center]');if(nc){jumpToNetwork(nc.dataset.networkCenter);return;}
    const cmp=e.target.closest('[data-compare]');if(cmp){openCompare(...cmp.dataset.compare.split('|'));return;}
    const discovery=e.target.closest('[data-discovery]');if(discovery){openCompare(...discovery.dataset.discovery.split('|'));return;}
    const arc=e.target.closest('[data-archetype]');if(arc){state.activeArchetype=arc.dataset.archetype;renderArchetypes();document.querySelector('.archetype-feature')?.scrollIntoView({behavior:'smooth'});return;}
    const ex=e.target.closest('[data-exhibit]');if(ex){openExhibit(Number(ex.dataset.exhibit));return;}
    if(e.target.closest('[data-surprise]')){surprise();return;}
    if(e.target.closest('[data-next-discovery]')){state.discoveryIndex=(state.discoveryIndex+1)%DISCOVERIES.length;renderExplore();return;}
    if(e.target.closest('[data-show-all]')){showAll();return;}
    if(e.target.closest('[data-close-dossier]')){dossier.classList.remove('open');dossier.setAttribute('aria-hidden','true');return;}
    if(e.target.closest('[data-close-dialog]')){dialog.close();return;}
    const pick=e.target.closest('[data-compare-pick]');if(pick){openComparePicker(pick.dataset.comparePick);return;}
    const term=e.target.closest('[data-search-term]');if(term){const search=document.querySelector('#global-search');search.value=term.dataset.searchTerm;search.dispatchEvent(new Event('input'));search.focus();return;}
  });
  document.addEventListener('keydown',e=>{
    const card=e.target.closest?.('[data-open-deity]');if(card&&(e.key==='Enter'||e.key===' ')){e.preventDefault();selectDeity(card.dataset.openDeity);return;}
    if(e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)){e.preventDefault();document.querySelector('#global-search')?.focus();}
    if(e.key==='Escape'&&dossier.classList.contains('open')){dossier.classList.remove('open');dossier.setAttribute('aria-hidden','true');}
  });
  const search=document.querySelector('#global-search'),results=document.querySelector('#search-results');
  search.addEventListener('input',()=>{const hits=searchDeities(search.value);results.hidden=!hits.length;results.innerHTML=hits.map(d=>`<button data-search-id="${esc(d.id)}"><span>${esc(d.id)}<small>${esc(d.epithet||'')}</small></span><b>${esc(d.pantheon)}</b></button>`).join('');});
  results.addEventListener('click',e=>{const btn=e.target.closest('[data-search-id]');if(!btn)return;selectDeity(btn.dataset.searchId);search.value='';results.hidden=true;});
}

const initial=location.hash.replace('#','');if(['explore','connections','archetypes','atlas'].includes(initial))state.view=initial;
wireGlobal();render();
