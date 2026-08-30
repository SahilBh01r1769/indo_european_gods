import { deityById, connectionsFor } from './model.js';
import { TRADITIONS } from './config.js';

export function renderNetwork(container,{centerId='Thor',horizon=1200,onSelect,onCompare,onEdge}={}){
  const d3 = window.d3;
  const center = deityById(centerId) || deityById('Thor');
  const relationships = connectionsFor(center,{horizon,limit:14,crossCulture:false});
  const nodes = [center,...relationships.map(r=>r.b)].map((d,i)=>({...d,isCenter:i===0}));
  const links = relationships.map(r=>({source:center.id,target:r.b.id,relation:r}));

  for(let i=1;i<nodes.length;i++){
    for(let j=i+1;j<nodes.length;j++){
      const a=nodes[i],b=nodes[j];
      const extra=connectionsFor(a,{horizon,limit:7}).find(r=>r.b.id===b.id);
      if(extra && (extra.curated || extra.score>.74)) links.push({source:a.id,target:b.id,relation:extra,secondary:true});
    }
  }

  container.innerHTML = `<div class="network-toolbar"><div><span class="eyebrow">Follow the connections</span><strong>${center.id}</strong><small>${center.pantheon} · ${relationships.length} nearby figures</small></div><div class="edge-key"><span><i class="edge thematic"></i>model echo</span><span><i class="edge curated"></i>evidence trail</span></div></div><svg class="network-svg" role="img" aria-label="Relationship network centered on ${center.id}"></svg>`;
  const svg = d3.select(container).select('svg');
  const width = Math.max(container.clientWidth,720); const height = Math.max(container.clientHeight-74,540);
  svg.attr('viewBox',`0 0 ${width} ${height}`);
  const root = svg.append('g');
  svg.call(d3.zoom().scaleExtent([.55,2.2]).on('zoom',e=>root.attr('transform',e.transform)));

  const link = root.append('g').attr('class','network-links').selectAll('line').data(links).join('line')
    .attr('class',d=>`network-link ${d.relation.curated?'is-curated':'is-thematic'} kind-${d.relation.kind} ${d.secondary?'secondary':''}`)
    .attr('stroke-width',d=>1.2 + d.relation.score*2.1)
    .on('click',(e,d)=>{ e.stopPropagation(); onEdge?.(d.relation); });

  const node = root.append('g').selectAll('g').data(nodes).join('g').attr('class',d=>`network-node ${d.isCenter?'center':''}`).style('cursor','pointer')
    .on('click',(e,d)=>{ e.stopPropagation(); onSelect?.(d.id); })
    .on('dblclick',(e,d)=>{ e.preventDefault(); onCompare?.(center.id,d.id); });

  node.append('circle').attr('r',d=>d.isCenter?22:13).attr('fill',d=>TRADITIONS[d.pantheon]?.color||'#aaa').attr('stroke',d=>d.isCenter?'#f1cf89':'rgba(255,255,255,.45)').attr('stroke-width',d=>d.isCenter?3:1.2);
  node.append('text').attr('class','network-label').attr('y',d=>d.isCenter?38:28).attr('text-anchor','middle').text(d=>d.id);
  node.append('title').text(d=>`${d.id} · ${d.pantheon}\nClick for dossier · Double click to compare`);

  const simulation=d3.forceSimulation(nodes)
    .force('link',d3.forceLink(links).id(d=>d.id).distance(d=>d.secondary?135:190).strength(d=>d.secondary?.18:.42))
    .force('charge',d3.forceManyBody().strength(-520))
    .force('center',d3.forceCenter(width/2,height/2))
    .force('collision',d3.forceCollide().radius(d=>d.isCenter?58:42));
  simulation.on('tick',()=>{
    link.attr('x1',d=>d.source.x).attr('y1',d=>d.source.y).attr('x2',d=>d.target.x).attr('y2',d=>d.target.y);
    node.attr('transform',d=>`translate(${d.x},${d.y})`);
  });
  return ()=>simulation.stop();
}
