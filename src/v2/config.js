export const TRADITIONS = {
  Greek: { group:'Indo-European', color:'#79b8ff', region:'Aegean & Greek world', lat:38.3, lng:23.7, note:'Greek religious traditions known from Mycenaean and later archaic/classical sources.' },
  Vedic: { group:'Indo-European', color:'#ef88a8', region:'Northern South Asia', lat:29.7, lng:76.8, note:'Early Indo-Aryan religion preserved most prominently in the Rigveda and later Vedic literature.' },
  Norse: { group:'Indo-European', color:'#a79bea', region:'Scandinavia', lat:61.2, lng:10.3, note:'North Germanic tradition, documented especially in medieval Icelandic sources with older inherited material.' },
  Celtic: { group:'Indo-European', color:'#69d79c', region:'Western & Central Europe', lat:51.2, lng:-4.0, note:'A family of related Celtic traditions reconstructed from archaeology, inscriptions and medieval literature.' },
  Roman: { group:'Indo-European', color:'#f4c36d', region:'Central Italy', lat:41.9, lng:12.5, note:'Roman religion combined Italic inheritance with extensive Greek reinterpretation and imperial exchange.' },
  Slavic: { group:'Indo-European', color:'#f28d6c', region:'Eastern Europe', lat:50.5, lng:27.0, note:'Pre-Christian Slavic religious traditions reconstructed from chronicles, folklore and comparative evidence.' },
  Iranian: { group:'Indo-European', color:'#63d6d2', region:'Iranian plateau', lat:32.2, lng:53.7, note:'Iranian religious traditions including Avestan material, closely related to the Indo-Aryan branch.' },
  Mesopotamian: { group:'Comparative', color:'#ce91e9', region:'Mesopotamia', lat:32.5, lng:44.4, note:'A non-Indo-European comparative tradition included to distinguish inheritance from broader mythic parallels.' },
  Egyptian: { group:'Comparative', color:'#69cbbb', region:'Nile valley', lat:26.8, lng:30.8, note:'A non-Indo-European comparative tradition useful for testing recurring motifs beyond shared ancestry.' },
};

export const ARCHETYPES = [
  { id:'thunderer', title:'The Thunderer', glyph:'ϟ', traits:['Storm god','War / victory'], intro:'The storm-warrior confronts serpentine or chaotic forces and protects the ordered world.', question:'Why do thunder gods so often become monster slayers?' },
  { id:'far-shooter', title:'The Far-Shooter', glyph:'➶', traits:['Archer','Healer','Disease sender'], intro:'The same divine arrow that sends plague may also mark the god who can remove it.', question:'How can healing and disease belong to the same sacred role?' },
  { id:'sky-father', title:'The Sky Father', glyph:'☼', traits:['Storm god','Ascetic / wisdom'], intro:'Sovereignty, daylight sky and cosmic order recur in several of the oldest Indo-European divine names.', question:'What survives when an ancestral title becomes a new god?' },
  { id:'boundary-crosser', title:'The Boundary Crosser', glyph:'◇', traits:['Liminal outsider','Trickster','Death / underworld'], intro:'Messengers, tricksters and psychopomps move where ordinary beings cannot: between worlds and categories.', question:'Why are divine messengers so often thieves and guides of the dead?' },
  { id:'sacred-fire', title:'Sacred Fire & Craft', glyph:'△', traits:['Fire','Smith / craft'], intro:'Fire belongs to sacrifice, transformation, technology and the dangerous knowledge of making.', question:'Why does sacred fire repeatedly meet smithcraft and ritual?' },
  { id:'radiant-dawn', title:'The Radiant Ones', glyph:'☉', traits:['Solar'], intro:'Sun, dawn and divine radiance preserve some of the clearest recurring images across distant traditions.', question:'Which solar similarities are inherited, and which are simply universal?' },
  { id:'lord-dead', title:'Lord of the Dead', glyph:'☾', traits:['Death / underworld'], intro:'The underworld ruler is often not death itself, but a sovereign, judge or first traveler to the other side.', question:'How do cultures imagine authority beyond death?' },
  { id:'wild-divine', title:'The Wild Divine', glyph:'✣', traits:['Wilderness','Ecstasy / madness','Liminal outsider'], intro:'Outside the city lie gods of animals, frenzy, prophecy and identities that resist ordinary social order.', question:'Why does religious power so often emerge beyond civilization?' },
];

export const EXHIBITS = [
  { title:'The Thunderer and the Serpent', eyebrow:'Guided exhibit · 5 min', start:'Thor', compare:'Indra', archetype:'thunderer', copy:'Follow the storm-warrior from Vedic India to northern Europe and ask what the dragon-slayer motif can—and cannot—prove.' },
  { title:'The Archer Who Heals', eyebrow:'Guided exhibit · 4 min', start:'Apollo', compare:'Rudra', archetype:'far-shooter', copy:'Apollo and Rudra unite distance, disease and medicine in one of comparative mythology’s most provocative functional parallels.' },
  { title:'Names of the Daylight Sky', eyebrow:'Evidence trail · 4 min', start:'Zeus', compare:'Dyaus', archetype:'sky-father', copy:'Begin with the strongest kind of evidence in the atlas: demonstrable linguistic inheritance.' },
  { title:'Crossing the Last Boundary', eyebrow:'Comparative trail · 5 min', start:'Hermes', compare:'Anubis', archetype:'boundary-crosser', copy:'Compare guides of souls while keeping linguistic ancestry separate from functional resemblance.' },
];

export const ERA_STOPS = [
  {value:-2000,label:'2000 BCE'}, {value:-1500,label:'1500 BCE'}, {value:-1000,label:'1000 BCE'}, {value:-800,label:'800 BCE'},
  {value:-500,label:'500 BCE'}, {value:0,label:'1 CE'}, {value:500,label:'500 CE'}, {value:900,label:'900 CE'}, {value:1200,label:'1200 CE'}
];
