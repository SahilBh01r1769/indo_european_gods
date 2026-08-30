import { DEITIES, deityVisibleAt } from './model.js';
import { TRADITIONS } from './config.js';

let map;
export function renderAtlas(container,{horizon=1200,onSelect}={}){
  if(map){ map.remove(); map=null; }
  container.innerHTML='<div id="museum-map" class="museum-map"></div>';
  map=L.map('museum-map',{zoomControl:true,minZoom:2}).setView([39,25],3);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{attribution:'&copy; OpenStreetMap &copy; CARTO',maxZoom:18}).addTo(map);
  const bounds=[];
  Object.entries(TRADITIONS).forEach(([name,t])=>{
    const visible=DEITIES.filter(d=>d.pantheon===name && deityVisibleAt(d,horizon)).sort((a,b)=>a.era-b.era);
    if(!visible.length) return;
    const marker=L.circleMarker([t.lat,t.lng],{radius:9,color:t.color,fillColor:t.color,fillOpacity:.72,weight:2}).addTo(map);
    bounds.push([t.lat,t.lng]);
    marker.bindPopup(`<div class="map-popup"><span>${t.group}</span><strong>${name}</strong><small>${t.region}</small><p>${t.note}</p><button data-map-deity="${visible[0].id}">Open ${visible[0].id}</button></div>`);
    marker.on('popupopen',()=>setTimeout(()=>{
      const btn=document.querySelector(`[data-map-deity="${visible[0].id}"]`); btn?.addEventListener('click',()=>onSelect?.(visible[0].id));
    },0));
  });
  if(bounds.length) map.fitBounds(bounds,{padding:[45,45],maxZoom:3});
  return ()=>{ if(map){map.remove();map=null;} };
}
