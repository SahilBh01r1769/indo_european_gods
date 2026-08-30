import { DEITIES, deityById, yearLabel, topTraits, searchDeities, connectionsFor, compareDeities, archetypeMembers, deitiesAt } from './model.js';
import { TRADITIONS, ARCHETYPES, EXHIBITS, ERA_STOPS } from './config.js';
import { renderNetwork } from './network.js';
import { renderAtlas } from './atlas.js';

const state={view:'explore',selected:null,horizon:1200,networkCenter:'Thor',activeArchetype:null};
const main=document.querySelector('#main-view'); const dossier=document.querySelector('#dossier'); const dialog=document.querySelector('#compare-dialog');
let cleanup=()=>{};

const esc=s=>`${s??''}`.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const pct=n=>`${Math.round(n*100)}%`;
const traditionBadge=d=>`<span class="tradition-dot" style="--tradition:${TRADITIONS[d.pantheon]?.color||'#aaa'}"></span>${esc(d.pantheon)}`;

function setView(view){ state.view=view; cleanup(); cleanup=()=>{}; location.hash=view; render(); }
function selectDeity(id,{open=true}={}){ state.selected=id; if(open) renderDossier(); }
function jumpToNetwork(id){ state.networkCenter=id; state.selected=id; setView('connections'); }
function toast(msg){ const el=document.querySelector('#toast'); el.textContent=msg; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),1800); }

function deityCard(d,{compact=false}={}){
  const traits=topTraits(d,compact?2:3);
  return `<article class="deity-card ${compact?'compact':''}" data-open-deity="${esc(d.id)}">
    <div class="deity-card-top"><span class="culture-label">${traditionBadge(d)}</span><span class="era-label">${yearLabel(d.era)}</span></div>
    <div class="deity-glyph">${esc(d.originalScript||d.id.slice(0,1))}</div>
    <h3>${esc(d.id)}</h3><p class="epithet">${esc(d.epithet||'')}</p>
    <div class="trait-pills">${traits.map(t=>`<span>${esc(t.name)}</span>`).join('')}</div>
  </article>`;
}

function renderExplore(){
  const featured=['Zeus','Indra','Thor','Apollo','Rudra','Odin','Hermes','Ishtar'].map(deityById).filter(Boolean);
  main.innerHTML=`
  <section class="hero museum-section">
    <div class="hero-copy"><span class="eyebrow">Interactive comparative mythology museum</span><h1>Trace the ideas that travel through myth.</h1>
      <p>Explore gods as historical and cultural profiles, then follow thematic parallels, inherited names and curated comparisons across traditions.</p>
      <div class="hero-actions"><button class="primary-action" data-open-deity="Thor">Begin with Thor</button><button class="secondary-action" data-nav="archetypes">Browse archetypes</button></div>
      <div class="method-note"><strong>Different evidence, different claims.</strong> The atlas keeps thematic similarity separate from linguistic or historically curated relationships.</div>
    </div>
    <div class="hero-orbit" aria-hidden="true"><div class="orbit-ring ring-a"></div><div class="orbit-ring ring-b"></div><span class="orbit-core">ᛝ</span><span class="orbit-name n1">Indra</span><span class="orbit-name n2">Thor</span><span class="orbit-name n3">Perun</span><span class="orbit-name n4">Zeus</span></div>
  </section>
  <section class="museum-section exhibits"><header class="section-head"><div><span class="eyebrow">Curated entry points</span><h2>Enter through a story, not a settings panel.</h2></div><p>Each exhibit begins with a concrete comparison and opens outward into evidence, chronology and culture.</p></header>
    <div class="exhibit-grid">${EXHIBITS.map((x,i)=>`<article class="exhibit-card"><span>${esc(x.eyebrow)}</span><h3>${esc(x.title)}</h3><p>${esc(x.copy)}</p><div class="exhibit-route"><b>${esc(x.start)}</b><i>→</i><b>${esc(x.compare)}</b></div><button data-exhibit="${i}">Open exhibit</button></article>`).join('')}</div>
  </section>
  <section class="museum-section collection"><header class="section-head"><div><span class="eyebrow">The collection</span><h2>Meet the figures behind the network.</h2></div><button class="text-action" data-show-all>View all ${DEITIES.length} deities →</button></header><div class="deity-grid">${featured.map(d=>deityCard(d)).join('')}</div></section>`;
}

function renderConnections(){
  const center=deityById(state.networkCenter)||deityById('Thor');
  const rels=connectionsFor(center,{horizon:state.horizon,limit:8});
  main.innerHTML=`<section class="workspace connections-workspace">
    <aside class="context-panel"><span class="eyebrow">Connection lens</span><h1>${esc(center.id)}</h1><p>${esc(center.epithet)}</p>
      <div class="context-meta"><span>${traditionBadge(center)}</span><span>${yearLabel(center.era)}</span></div>
      <button class="primary-action full" data-open-deity="${esc(center.id)}">Open full dossier</button>
      <div class="panel-rule"></div><h3>Closest readable parallels</h3>
      <div class="relation-list">${rels.slice(0,5).map(r=>`<button data-network-center="${esc(r.b.id)}"><span>${esc(r.b.id)}<small>${esc(r.b.pantheon)}</small></span><b>${pct(r.score)}</b></button>`).join('')}</div>
      <div class="panel-rule"></div><label class="field-label" for="era-select">Historical horizon</label><select id="era-select">${ERA_STOPS.map(e=>`<option value="${e.value}" ${e.value===state.horizon?'selected':''}>By ${e.label}</option>`).join('')}</select>
      <p class="fine-print">The horizon filters figures by earliest attestation in the dataset. Dates are approximate.</p>
    </aside>
    <div class="network-stage" id="network-stage"></div>
    <aside class="evidence-panel" id="evidence-panel"><span class="eyebrow">Reading the network</span><h2>Every edge should answer “why?”</h2><p>Click a relationship line for its thematic score, shared traits and any curated evidence. Double-click a deity to compare it with ${esc(center.id)}.</p><div class="evidence-primer"><b>Solid pale line</b><span>computed thematic similarity</span><b>Gold line</b><span>curated relationship or evidence trail</span></div></aside>
  </section>`;
  cleanup=renderNetwork(document.querySelector('#network-stage'),{centerId:center.id,horizon:state.horizon,onSelect:id=>selectDeity(id),onCompare:(a,b)=>openCompare(a,b),onEdge:showEvidence});
  document.querySelector('#era-select')?.addEventListener('change',e=>{state.horizon=Number(e.target.value);renderConnections();});
}

function showEvidence(r){
  const el=document.querySelector('#evidence-panel'); if(!el)return;
  const kind=r.kind==='linguistic'?'Linguistic evidence':r.kind==='historical'?'Historical relationship':r.curated?'Curated comparison':'Thematic comparison';
  el.innerHTML=`<span class="eyebrow">Relationship evidence</span><h2>${esc(r.a.id)} <i>↔</i> ${esc(r.b.id)}</h2><div class="evidence-score"><strong>${pct(r.score)}</strong><span>${esc(r.thematicLabel)}</span></div><h3>Shared profile</h3><div class="trait-pills large">${r.shared.length?r.shared.map(t=>`<span>${esc(t)}</span>`).join(''):'<em>No strong shared trait above the display threshold.</em>'}</div>${r.curated?`<div class="curated-evidence"><span>${esc(kind)} · ${esc(r.confidence)}</span><p>${esc(r.curated.note)}</p><cite>${esc(r.curated.source||'Source listed in dataset')}</cite></div>`:`<p class="fine-print">This edge is generated from the structured trait model. It is a discovery aid, not evidence of common ancestry.</p>`}<button class="secondary-action full" data-compare="${esc(r.a.id)}|${esc(r.b.id)}">Compare side by side</button>`;
}

function renderArchetypes(){
  const active=ARCHETYPES.find(a=>a.id===state.activeArchetype);
  main.innerHTML=`<section class="museum-section archetype-page"><header class="page-intro"><span class="eyebrow">Recurring mythic structures</span><h1>Archetypes are questions, not answers.</h1><p>Use them to discover recurring divine roles, then inspect whether the resemblance is linguistic, historical, structural or simply thematic.</p></header>
    <div class="archetype-grid">${ARCHETYPES.map(a=>{const members=archetypeMembers(a,state.horizon,5);return `<article class="archetype-card ${active?.id===a.id?'active':''}" data-archetype="${a.id}"><span class="archetype-glyph">${a.glyph}</span><h2>${esc(a.title)}</h2><p>${esc(a.intro)}</p><blockquote>${esc(a.question)}</blockquote><div class="member-stack">${members.map(m=>`<span style="--tradition:${TRADITIONS[m.deity.pantheon]?.color}">${esc(m.deity.id)}</span>`).join('')}</div></article>`}).join('')}</div>
    ${active?renderArchetypeFeature(active):''}
  </section>`;
}
function renderArchetypeFeature(a){const members=archetypeMembers(a,state.horizon,10);return `<section class="archetype-feature"><div><span class="eyebrow">Open archetype</span><h2>${a.glyph} ${esc(a.title)}</h2><p>${esc(a.intro)}</p><h3>What to look for</h3><p>${esc(a.question)}</p><div class="trait-pills large">${a.traits.map(t=>`<span>${esc(t)}</span>`).join('')}</div></div><div class="ranked-members">${members.map((m,i)=>`<button data-open-deity="${esc(m.deity.id)}"><b>${String(i+1).padStart(2,'0')}</b><span>${esc(m.deity.id)}<small>${esc(m.deity.pantheon)} · ${yearLabel(m.deity.era)}</small></span><strong>${pct(m.score)}</strong></button>`).join('')}</div></section>`;}

function renderAtlasView(){
  const visible=deitiesAt(state.horizon);
  main.innerHTML=`<section class="workspace atlas-workspace"><aside class="atlas-story"><span class="eyebrow">Chronology + geography</span><h1>Traditions in place and time.</h1><p>This map shows approximate cultural centers—not deity-specific archaeological coordinates. Move the historical horizon to see which traditions have entered the surviving record.</p><div class="timeline-readout"><strong>${ERA_STOPS.find(e=>e.value===state.horizon)?.label||yearLabel(state.horizon)}</strong><span>${visible.length} figures visible</span></div><input id="era-range" type="range" min="0" max="${ERA_STOPS.length-1}" step="1" value="${Math.max(0,ERA_STOPS.findIndex(e=>e.value===state.horizon))}" /><div class="timeline-labels"><span>2000 BCE</span><span>1200 CE</span></div><div class="tradition-list">${Object.entries(TRADITIONS).map(([n,t])=>`<div><i style="background:${t.color}"></i><span><b>${n}</b><small>${t.group}</small></span></div>`).join('')}</div></aside><div class="map-stage"><div class="map-caption"><span class="eyebrow">Cultural atlas</span><strong>Approximate centers of documented traditions</strong></div><div id="atlas-map-host" class="atlas-map-host"></div></div></section>`;
  cleanup=renderAtlas(document.querySelector('#atlas-map-host'),{horizon:state.horizon,onSelect:id=>selectDeity(id)});
  document.querySelector('#era-range')?.addEventListener('input',e=>{state.horizon=ERA_STOPS[Number(e.target.value)].value; renderAtlasView();});
}

function renderDossier(){
  const d=deityById(state.selected); if(!d){dossier.setAttribute('aria-hidden','true');dossier.classList.remove('open');return;}
  const rels=connectionsFor(d,{horizon:1200,limit:5,crossCulture:true});
  const traits=topTraits(d,7);
  dossier.innerHTML=`<div class="dossier-head"><button class="icon-button" data-close-dossier aria-label="Close dossier">×</button><span class="eyebrow">Deity dossier</span><div class="dossier-script">${esc(d.originalScript||'')}</div><h2>${esc(d.id)}</h2><p>${esc(d.epithet||'')}</p><div class="context-meta"><span>${traditionBadge(d)}</span><span>${yearLabel(d.era)}</span></div></div><div class="dossier-body"><section><h3>Profile</h3><p class="serif-copy">${esc(d.desc||'')}</p></section><section><h3>Dominant traits</h3><div class="trait-bars">${traits.map(t=>`<div><span>${esc(t.name)}</span><i><b style="width:${Math.round(t.value*100)}%"></b></i><em>${pct(t.value)}</em></div>`).join('')}</div></section><section><h3>Domains</h3><div class="trait-pills large">${(d.domains||[]).map(x=>`<span>${esc(x)}</span>`).join('')}</div></section><section><h3>Cross-cultural starting points</h3><div class="dossier-relations">${rels.map(r=>`<button data-compare="${esc(d.id)}|${esc(r.b.id)}"><span>${esc(r.b.id)}<small>${esc(r.b.pantheon)} · ${r.curated?esc(r.confidence):'thematic'}</small></span><b>${pct(r.score)}</b></button>`).join('')}</div></section><div class="dossier-actions"><button class="primary-action" data-network-center="${esc(d.id)}">Explore connections</button><button class="secondary-action" data-compare-pick="${esc(d.id)}">Compare…</button></div></div>`;
  dossier.setAttribute('aria-hidden','false'); dossier.classList.add('open');
}

function openCompare(aId,bId){const a=deityById(aId),b=deityById(bId);if(!a||!b||a.id===b.id)return;const {rel,traits}=compareDeities(a,b);dialog.querySelector('#compare-content').innerHTML=`<div class="dialog-head"><div><span class="eyebrow">Side-by-side comparison</span><h2>${esc(a.id)} <i>↔</i> ${esc(b.id)}</h2></div><button class="icon-button" data-close-dialog>×</button></div><div class="comparison-identity"><div><span>${traditionBadge(a)}</span><strong>${esc(a.id)}</strong><small>${esc(a.epithet)}</small></div><div class="comparison-score"><strong>${pct(rel.score)}</strong><span>thematic similarity</span></div><div><span>${traditionBadge(b)}</span><strong>${esc(b.id)}</strong><small>${esc(b.epithet)}</small></div></div>${rel.curated?`<div class="curated-evidence"><span>${rel.kind==='linguistic'?'Linguistic evidence':'Curated comparison'} · ${esc(rel.confidence)}</span><p>${esc(rel.curated.note)}</p><cite>${esc(rel.curated.source||'')}</cite></div>`:''}<div class="comparison-table"><div class="comparison-row header"><b>Trait</b><b>${esc(a.id)}</b><b>${esc(b.id)}</b></div>${traits.slice(0,12).map(t=>`<div class="comparison-row"><span>${esc(t.name)}</span><i><b style="width:${t.a*100}%"></b></i><i><b style="width:${t.b*100}%"></b></i></div>`).join('')}</div><p class="fine-print">Trait scores are structured analytical weights used for exploration. They are not measurements of historical descent.</p>`;dialog.showModal();}

function showAll(){ main.innerHTML=`<section class="museum-section collection-page"><header class="page-intro"><button class="text-action" data-nav="explore">← Back to exhibits</button><span class="eyebrow">Complete collection</span><h1>${DEITIES.length} figures across ${Object.keys(TRADITIONS).length} traditions.</h1><p>Choose a dossier first. Analysis is available from inside the profile rather than being forced on the collection view.</p></header><div class="deity-grid">${DEITIES.slice().sort((a,b)=>a.pantheon.localeCompare(b.pantheon)||a.id.localeCompare(b.id)).map(d=>deityCard(d,true)).join('')}</div></section>`; }

function openExhibit(i){const x=EXHIBITS[i];if(!x)return;state.activeArchetype=x.archetype;openCompare(x.start,x.compare); selectDeity(x.start);}
function render(){document.querySelectorAll('[data-nav]').forEach(x=>x.classList.toggle('active',x.dataset.nav===state.view)); if(state.view==='connections')renderConnections();else if(state.view==='archetypes')renderArchetypes();else if(state.view==='atlas')renderAtlasView();else renderExplore(); main.focus({preventScroll:true});}

function wireGlobal(){
  document.addEventListener('click',e=>{
    const nav=e.target.closest('[data-nav]'); if(nav){e.preventDefault();setView(nav.dataset.nav);return;}
    const deity=e.target.closest('[data-open-deity]'); if(deity){selectDeity(deity.dataset.openDeity);return;}
    const nc=e.target.closest('[data-network-center]'); if(nc){jumpToNetwork(nc.dataset.networkCenter);return;}
    const cmp=e.target.closest('[data-compare]'); if(cmp){openCompare(...cmp.dataset.compare.split('|'));return;}
    const arc=e.target.closest('[data-archetype]'); if(arc){state.activeArchetype=arc.dataset.archetype;renderArchetypes();document.querySelector('.archetype-feature')?.scrollIntoView({behavior:'smooth'});return;}
    const ex=e.target.closest('[data-exhibit]'); if(ex){openExhibit(Number(ex.dataset.exhibit));return;}
    if(e.target.closest('[data-show-all]')){showAll();return;}
    if(e.target.closest('[data-close-dossier]')){dossier.classList.remove('open');dossier.setAttribute('aria-hidden','true');return;}
    if(e.target.closest('[data-close-dialog]')){dialog.close();return;}
    const pick=e.target.closest('[data-compare-pick]'); if(pick){const from=pick.dataset.comparePick;const other=prompt(`Compare ${from} with which deity?`);if(other){const match=searchDeities(other,1)[0];match?openCompare(from,match.id):toast('No matching deity found.');}return;}
  });
  const search=document.querySelector('#global-search'), results=document.querySelector('#search-results');
  search.addEventListener('input',()=>{const hits=searchDeities(search.value);results.hidden=!hits.length;results.innerHTML=hits.map(d=>`<button data-search-id="${esc(d.id)}"><span>${esc(d.id)}<small>${esc(d.epithet||'')}</small></span><b>${esc(d.pantheon)}</b></button>`).join('');});
  results.addEventListener('click',e=>{const btn=e.target.closest('[data-search-id]');if(!btn)return;selectDeity(btn.dataset.searchId);search.value='';results.hidden=true;});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&dossier.classList.contains('open')){dossier.classList.remove('open');dossier.setAttribute('aria-hidden','true');}});
}

const initial=location.hash.replace('#',''); if(['explore','connections','archetypes','atlas'].includes(initial)) state.view=initial;
wireGlobal(); render();
