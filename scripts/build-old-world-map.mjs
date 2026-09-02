import { readFile, mkdir, writeFile } from "node:fs/promises";
import { geoEquirectangular, geoGraticule10, geoPath } from "d3-geo";
import { feature } from "topojson-client";

const topology = JSON.parse(
  await readFile(new URL("../node_modules/world-atlas/land-110m.json", import.meta.url), "utf8"),
);
const land = feature(topology, topology.objects.land);
const projection = geoEquirectangular()
  .center([42, 37])
  .scale(480)
  .translate([600, 320])
  .clipExtent([[0, 0], [1200, 650]]);
const path = geoPath(projection);
const output = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 650" role="img" aria-label="Old World coastline map">
  <rect width="1200" height="650" rx="28" fill="#cfe4e3"/>
  <path d="${path(geoGraticule10())}" fill="none" stroke="#6f9698" stroke-opacity=".18" stroke-width="1" stroke-dasharray="3 7"/>
  <path d="${path(land)}" fill="#e8d7af" stroke="#876f47" stroke-width="1.4" stroke-linejoin="round"/>
</svg>\n`;

await mkdir(new URL("../assets/", import.meta.url), { recursive: true });
await writeFile(new URL("../assets/old-world-map.svg", import.meta.url), output);
console.log("Generated assets/old-world-map.svg from Natural Earth 1:110m land data.");
