import { DEITIES, deityVisibleAt } from './model.js';
import { TRADITIONS } from './config.js';

let map;
const esc=s=>`${s??''}`.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

function visibleFor(name,horizon){
  return DEITIES.filter(d=>d.pantheon===name&&deityVisibleAt(d,horizon)).sort((a,b)=>a.era-b.era||a.id.localeCompare(b.id));
}

function popupHtml(name,t,visible){
  return `<div class="map-popup"><span>${esc(t.group)}</span><strong>${esc(name)} <em>${visible.length} figure${visible.length===1?'':'s'}</em></strong><small>${esc(t.region)}</small><p>${esc(t.note)}</p><div class="map-deity-list">${visible.map(d=>`<button data-map-deity="${esc(d.id)}"><b>${esc(d.id)}</b><small>${d.era<0?`${Math.abs(d.era)} BCE`:`${d.era} CE`}</small></button>`).join('')}</div></div>`;
}

function markerIcon(name,t,count){
  return L.divIcon({
    className:'tradition-marker-shell',
    html:`<div class="tradition-marker" style="--tradition:${t.color}"><span>${count}</span><small>${esc(name)}</small></div>`,
    iconSize:[56,56],iconAnchor:[28,28],popupAnchor:[0,-24],
  });
}

export function renderAtlas(container,{horizon=1200,onSelect}={}){
  if(map){map.remove();map=null;}
  container.innerHTML='<div class="museum-map" aria-label="Interactive map of mythological traditions"></div>';
  const host=container.querySelector('.museum-map');
  map=L.map(host,{zoomControl:true,minZoom:2,worldCopyJump:true}).setView([39,25],3);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{attribution:'&copy; OpenStreetMap &copy; CARTO',maxZoom:18}).addTo(map);

  const markers=new Map();
  Object.entries(TRADITIONS).forEach(([name,t])=>{
    const marker=L.marker([t.lat,t.lng],{icon:markerIcon(name,t,1),keyboard:true,title:name});
    markers.set(name,{marker,t,visible:[]});
  });

  const handleMapClick=e=>{
    const btn=e.target.closest?.('[data-map-deity]');
    if(btn) onSelect?.(btn.dataset.mapDeity);
  };
  host.addEventListener('click',handleMapClick);

  const update=(nextHorizon,{fit=false}={})=>{
    horizon=nextHorizon;
    const bounds=[];
    markers.forEach((entry,name)=>{
      const visible=visibleFor(name,horizon);
      entry.visible=visible;
      const {marker,t}=entry;
      if(!visible.length){
        if(map.hasLayer(marker)) map.removeLayer(marker);
        return;
      }
      marker.setIcon(markerIcon(name,t,visible.length));
      marker.bindPopup(popupHtml(name,t,visible),{maxWidth:330,minWidth:260});
      if(!map.hasLayer(marker)) marker.addTo(map);
      bounds.push([t.lat,t.lng]);
    });
    if(fit&&bounds.length) map.fitBounds(bounds,{padding:[45,45],maxZoom:3});
    return {figures:[...markers.values()].reduce((n,x)=>n+x.visible.length,0),traditions:[...markers.values()].filter(x=>x.visible.length).length};
  };

  const initial=update(horizon,{fit:true});

  return {
    ...initial,
    setHorizon(nextHorizon){return update(nextHorizon);},
    focusTradition(name){
      const entry=markers.get(name);
      if(!entry||!entry.visible.length) return false;
      map.flyTo([entry.t.lat,entry.t.lng],Math.max(map.getZoom(),4),{duration:.45});
      entry.marker.openPopup();
      return true;
    },
    destroy(){
      host.removeEventListener('click',handleMapClick);
      if(map){map.remove();map=null;}
    },
  };
}
