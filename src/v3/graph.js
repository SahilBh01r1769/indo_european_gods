import { TRADITION_POSITIONS } from './config.js';
import { deityAccent, deityGlyph, eraLabel, getDeity } from './model.js';
import { availableClues } from './state.js';

const KIND_CLASS = kind => `edge-kind-${kind || 'model'}`;
function jitter(id,amount=24){ let hash=0; for(let i=0;i<id.length;i++) hash=((hash<<5)-hash+id.charCodeAt(i))|0; return ((Math.abs(hash)%1000)/999-.5)*amount; }

export class MythGraph {
  constructor(container,handlers={}){
    this.container=container; this.handlers=handlers; this.positions=new Map(); this.lastState=null; this.simulation=null;
    this.svg=d3.select(container).append('svg').attr('class','myth-graph').attr('role','img');
    this.decor=this.svg.append('g').attr('class','graph-decoration'); this.edgeLayer=this.svg.append('g').attr('class','graph-edges'); this.nodeLayer=this.svg.append('g').attr('class','graph-nodes'); this.labelLayer=this.svg.append('g').attr('class','graph-labels');
    this.zoom=d3.zoom().scaleExtent([.55,2.2]).on('zoom',event=>{ const t=event.transform; this.edgeLayer.attr('transform',t); this.nodeLayer.attr('transform',t); this.labelLayer.attr('transform',t); });
    this.svg.call(this.zoom); this.resizeObserver=new ResizeObserver(()=>this.render(this.lastState)); this.resizeObserver.observe(container);
  }
  destroy(){ this.simulation?.stop(); this.resizeObserver?.disconnect(); this.svg.remove(); }
  dimensions(){ const r=this.container.getBoundingClientRect(); return {width:Math.max(320,r.width||900),height:Math.max(420,r.height||620)}; }
  render(state){ if(!state) return; this.lastState=state; const {width,height}=this.dimensions(); this.svg.attr('viewBox',`0 0 ${width} ${height}`); this.container.dataset.mode=state.mode;
    const discovered=state.discoveredNodes.map(getDeity).filter(Boolean); const edges=state.discoveredEdges.map(edge=>({...edge,source:getDeity(edge.source),target:getDeity(edge.target)})).filter(e=>e.source&&e.target);
    if(state.mode==='time') return this.renderTime(discovered,edges,state,width,height); if(state.mode==='geography') return this.renderGeography(discovered,edges,state,width,height); return this.renderNetwork(discovered,edges,state,width,height); }
  clearDecor(){ this.decor.selectAll('*').remove(); }

  renderNetwork(discovered,edges,state,width,height){
    this.clearDecor(); this.simulation?.stop(); const clues=availableClues(state.selectedNode);
    const nodeData=discovered.map(deity=>({type:'deity',id:deity.id,deity})); const clueData=clues.map(clue=>({type:'clue',id:clue.id,clue})); const allNodes=[...nodeData,...clueData]; const nodeMap=new Map(allNodes.map(n=>[n.id,n]));
    const linkData=[...edges.map(edge=>({...edge,sourceId:edge.source.id,targetId:edge.target.id,type:'revealed'})),...clues.map(clue=>({id:clue.id,sourceId:clue.from,targetId:clue.id,type:'clue',kind:'mystery'}))].filter(l=>nodeMap.has(l.sourceId)&&nodeMap.has(l.targetId));
    for(const node of nodeData){ const stored=this.positions.get(node.id); if(stored) Object.assign(node,stored); }
    const center=nodeMap.get(state.selectedNode); if(center&&!Number.isFinite(center.x)){ center.x=width*.52; center.y=height*.48; }

    const links=this.edgeLayer.selectAll('line.graph-edge').data(linkData,d=>d.id); links.exit().remove();
    const linksMerged=links.enter().append('line').attr('data-edge-id',d=>d.id).on('click',(_,d)=>d.type==='revealed'&&this.handlers.onEdge?.(d.id)).merge(links).attr('class',d=>`graph-edge ${d.type==='clue'?'edge-mystery':KIND_CLASS(d.kind)}`).classed('edge-selected',d=>d.id===state.selectedEdge);

    const nodes=this.nodeLayer.selectAll('g.graph-node').data(allNodes,d=>d.id); nodes.exit().transition().duration(180).style('opacity',0).remove();
    const enter=nodes.enter().append('g').attr('class',d=>`graph-node graph-node-${d.type}`).style('opacity',0).attr('tabindex',0).attr('role','button')
      .on('click',(_,d)=>d.type==='deity'?this.handlers.onNode?.(d.deity.id):this.handlers.onReveal?.(d.clue))
      .on('keydown',(event,d)=>{ if(event.key!=='Enter'&&event.key!==' ')return; event.preventDefault(); d.type==='deity'?this.handlers.onNode?.(d.deity.id):this.handlers.onReveal?.(d.clue); });
    enter.append('circle').attr('class','node-halo'); enter.append('circle').attr('class','node-disc'); enter.append('text').attr('class','node-glyph').attr('text-anchor','middle').attr('dy','.36em'); enter.append('text').attr('class','node-name').attr('text-anchor','middle'); enter.append('text').attr('class','node-meta').attr('text-anchor','middle');
    const merged=enter.merge(nodes).classed('is-selected',d=>d.type==='deity'&&d.deity.id===state.selectedNode).attr('aria-label',d=>d.type==='deity'?`${d.deity.id}, ${d.deity.pantheon}`:`Mystery clue: ${d.clue.label}`);
    merged.select('.node-halo').attr('r',d=>d.type==='deity'?(d.deity.id===state.selectedNode?37:31):29).style('stroke',d=>d.type==='deity'?deityAccent(d.deity):'#b99d68');
    merged.select('.node-disc').attr('r',d=>d.type==='deity'?24:21).style('stroke',d=>d.type==='deity'?deityAccent(d.deity):'#9d8d78');
    merged.select('.node-glyph').style('fill',d=>d.type==='deity'?deityAccent(d.deity):'#6b6258').text(d=>d.type==='deity'?deityGlyph(d.deity):'?');
    merged.select('.node-name').attr('y',d=>d.type==='deity'?50:48).text(d=>d.type==='deity'?d.deity.id:d.clue.label); merged.select('.node-meta').attr('y',d=>d.type==='deity'?66:63).text(d=>d.type==='deity'?d.deity.pantheon:d.clue.hint); enter.transition().duration(280).style('opacity',1);

    const simulationLinks=linkData.map(l=>({...l,source:l.sourceId,target:l.targetId}));
    this.simulation=d3.forceSimulation(allNodes).force('link',d3.forceLink(simulationLinks).id(d=>d.id).distance(d=>d.type==='clue'?135:170).strength(d=>d.type==='clue'?.72:.42)).force('charge',d3.forceManyBody().strength(d=>d.type==='clue'?-500:-720)).force('center',d3.forceCenter(width*.52,height*.48)).force('collision',d3.forceCollide().radius(d=>d.type==='clue'?78:88)).alpha(.85).alphaDecay(.04).on('tick',()=>{
      allNodes.forEach(node=>{ node.x=Math.max(76,Math.min(width-76,node.x||width/2)); node.y=Math.max(78,Math.min(height-82,node.y||height/2)); if(node.type==='deity') this.positions.set(node.id,{x:node.x,y:node.y}); });
      linksMerged.attr('x1',d=>d.source.x).attr('y1',d=>d.source.y).attr('x2',d=>d.target.x).attr('y2',d=>d.target.y); merged.attr('transform',d=>`translate(${d.x},${d.y})`);
    });
    merged.call(d3.drag().on('start',(event,d)=>{if(!event.active)this.simulation.alphaTarget(.18).restart();d.fx=d.x;d.fy=d.y;}).on('drag',(event,d)=>{d.fx=event.x;d.fy=event.y;}).on('end',(event,d)=>{if(!event.active)this.simulation.alphaTarget(0);d.fx=null;d.fy=null;}));
    if(discovered.length&&clues.length===0) this.decor.append('text').attr('class','graph-empty-note').attr('x',width/2).attr('y',height-32).attr('text-anchor','middle').text('No hidden paths remain from this figure. Choose another discovered node to continue.');
  }

  renderStatic(discovered,edges,state,positions,{dimFuture=false}={}){
    this.simulation?.stop(); const nodes=discovered.map(deity=>({id:deity.id,deity,...positions(deity)})); const nodeMap=new Map(nodes.map(n=>[n.id,n])); const edgeData=edges.map(e=>({...e,s:nodeMap.get(e.source.id),t:nodeMap.get(e.target.id)})).filter(e=>e.s&&e.t);
    const links=this.edgeLayer.selectAll('line.graph-edge').data(edgeData,d=>d.id); links.exit().remove(); links.enter().append('line').merge(links).attr('class',d=>`graph-edge ${KIND_CLASS(d.kind)}`).classed('edge-selected',d=>d.id===state.selectedEdge).attr('x1',d=>d.s.x).attr('y1',d=>d.s.y).attr('x2',d=>d.t.x).attr('y2',d=>d.t.y).on('click',(_,d)=>this.handlers.onEdge?.(d.id));
    const sel=this.nodeLayer.selectAll('g.graph-node').data(nodes,d=>d.id); sel.exit().remove(); const enter=sel.enter().append('g').attr('class','graph-node graph-node-deity').attr('tabindex',0).attr('role','button').on('click',(_,d)=>this.handlers.onNode?.(d.id)); enter.append('circle').attr('class','node-halo'); enter.append('circle').attr('class','node-disc'); enter.append('text').attr('class','node-glyph').attr('text-anchor','middle').attr('dy','.36em'); enter.append('text').attr('class','node-name').attr('text-anchor','middle'); enter.append('text').attr('class','node-meta').attr('text-anchor','middle');
    const merged=enter.merge(sel).attr('transform',d=>`translate(${d.x},${d.y})`).classed('is-selected',d=>d.id===state.selectedNode).classed('is-future',d=>dimFuture&&d.deity.era>state.era); merged.select('.node-halo').attr('r',d=>d.id===state.selectedNode?34:29).style('stroke',d=>deityAccent(d.deity)); merged.select('.node-disc').attr('r',23).style('stroke',d=>deityAccent(d.deity)); merged.select('.node-glyph').style('fill',d=>deityAccent(d.deity)).text(d=>deityGlyph(d.deity)); merged.select('.node-name').attr('y',48).text(d=>d.deity.id); merged.select('.node-meta').attr('y',63).text(d=>d.deity.pantheon);
  }

  renderTime(discovered,edges,state,width,height){
    this.clearDecor(); const margin={left:86,right:50,top:72,bottom:72}; const minEra=Math.min(-2200,...discovered.map(d=>d.era)),maxEra=1400; const x=d3.scaleLinear().domain([minEra,maxEra]).range([margin.left,width-margin.right]); const pantheons=[...new Set(discovered.map(d=>d.pantheon))]; const y=d3.scalePoint().domain(pantheons).range([margin.top+32,height-margin.bottom-20]).padding(.45);
    const axis=d3.axisBottom(x).ticks(Math.min(7,Math.floor(width/130))).tickFormat(v=>v<0?`${Math.abs(v)} BCE`:`${v} CE`); this.decor.append('g').attr('class','time-axis').attr('transform',`translate(0,${height-margin.bottom})`).call(axis); this.decor.append('line').attr('class','time-cursor').attr('x1',x(state.era)).attr('x2',x(state.era)).attr('y1',margin.top-24).attr('y2',height-margin.bottom); this.decor.append('text').attr('class','time-cursor-label').attr('x',x(state.era)).attr('y',margin.top-34).attr('text-anchor','middle').text(`Horizon ${eraLabel(state.era)}`); pantheons.forEach(p=>this.decor.append('text').attr('class','time-row-label').attr('x',margin.left-16).attr('y',y(p)+4).attr('text-anchor','end').text(p)); this.renderStatic(discovered,edges,state,deity=>({x:x(deity.era),y:y(deity.pantheon)}),{dimFuture:true});
  }

  renderGeography(discovered,edges,state,width,height){
    this.clearDecor(); this.decor.append('rect').attr('class','geo-field').attr('x',28).attr('y',28).attr('width',width-56).attr('height',height-56).attr('rx',26); for(let gx=15;gx<=85;gx+=14)this.decor.append('line').attr('class','geo-grid').attr('x1',width*gx/100).attr('x2',width*gx/100).attr('y1',48).attr('y2',height-48); for(let gy=18;gy<=82;gy+=16)this.decor.append('line').attr('class','geo-grid').attr('x1',48).attr('x2',width-48).attr('y1',height*gy/100).attr('y2',height*gy/100);
    [...new Set(discovered.map(d=>d.pantheon))].forEach(p=>{const pos=TRADITION_POSITIONS[p];if(pos)this.decor.append('text').attr('class','geo-region-label').attr('x',width*pos.x/100).attr('y',height*pos.y/100-42).attr('text-anchor','middle').text(pos.label);}); this.renderStatic(discovered,edges,state,deity=>{const pos=TRADITION_POSITIONS[deity.pantheon]||{x:50,y:50};return{x:width*pos.x/100+jitter(deity.id,54),y:height*pos.y/100+jitter(`${deity.id}:y`,46)};});
  }
  fit(){ this.svg.transition().duration(260).call(this.zoom.transform,d3.zoomIdentity); }
}
