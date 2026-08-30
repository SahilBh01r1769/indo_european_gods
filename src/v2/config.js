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
  { id:'thunderer', title:'The Thunderer', glyph:'ϟ', traits:['Storm god','War / victory'], intro:'A storm-warrior confronts a serpent, monster or force of chaos and protects the ordered world.', question:'Why do thunder gods so often become monster slayers?' },
  { id:'far-shooter', title:'The Far-Shooter', glyph:'➶', traits:['Archer','Healer','Disease sender'], intro:'The same divine power that sends sickness can also remove it: a strange healer/destroyer double role.', question:'Why do plague and healing repeatedly belong to the same god?' },
  { id:'sky-father', title:'The Sky Father', glyph:'☼', traits:['Storm god','Ascetic / wisdom'], intro:'Sometimes the strongest connection is not a shared story but a shared name inherited through related languages.', question:'What survives when an ancestral divine title becomes several different gods?' },
  { id:'boundary-crosser', title:'The Boundary Crosser', glyph:'◇', traits:['Liminal outsider','Trickster','Death / underworld'], intro:'Messengers, thieves, guides of souls and shape-shifters all live at the edge of categories.', question:'Why are divine messengers so often tricksters and guides of the dead?' },
  { id:'sacred-fire', title:'Sacred Fire & Craft', glyph:'△', traits:['Fire','Smith / craft'], intro:'Fire can be sacrifice, forge, hearth, purification or destruction—sometimes all at once.', question:'How does one element become ritual messenger, technology and danger?' },
  { id:'radiant-dawn', title:'The Radiant Ones', glyph:'☉', traits:['Solar'], intro:'Sun and dawn figures offer a useful test: some similarities are inherited, others may simply be obvious human responses to the sky.', question:'Which solar similarities are family history, and which are universal?' },
  { id:'lord-dead', title:'Lord of the Dead', glyph:'☾', traits:['Death / underworld'], intro:'Underworld gods are rarely just “death gods.” They receive, judge, guide or govern those who have already died.', question:'How do different cultures imagine authority beyond death?' },
  { id:'wild-divine', title:'The Wild Divine', glyph:'✣', traits:['Wilderness','Ecstasy / madness','Liminal outsider'], intro:'Outside the city are gods of beasts, frenzy, mountains, prophecy and identities that resist ordinary order.', question:'Why does sacred power so often live beyond civilization?' },
];

export const DISCOVERIES = [
  { a:'Zeus', b:'Dyaus', label:'Name family', kind:'linguistic', hook:'These two are connected by more than a similar job.', reveal:'Greek Zeus and Vedic Dyaus preserve related divine names from the Indo-European language family. This is the kind of connection where linguistics is stronger evidence than visual resemblance.' },
  { a:'Thor', b:'Indra', label:'Monster-slayer motif', kind:'structural', hook:'A hammer in Scandinavia, a thunderbolt in Vedic India, and a serpent in the way.', reveal:'Both are storm-warriors associated with a decisive serpent or dragon combat. The resemblance is structurally compelling, but it is not the same thing as a direct name cognate.' },
  { a:'Apollo', b:'Rudra', label:'The healer who hurts', kind:'structural', hook:'Why would a god of healing also send disease?', reveal:'Apollo and Rudra combine distance, archery, sickness and cure. The paradox is the interesting part: the power that wounds is imagined as the power that can withdraw the wound.' },
  { a:'Hermes', b:'Anubis', label:'Historical fusion', kind:'historical', hook:'Two guides of the dead eventually became one hybrid god.', reveal:'Greco-Egyptian religion produced Hermanubis, explicitly combining Hermes and Anubis. This is not prehistoric inheritance—it is documented cultural contact and syncretism.' },
  { a:'Sekhmet', b:'Rudra', label:'Cross-cultural echo', kind:'comparative', hook:'A lioness goddess and a Vedic archer share a disturbing divine contradiction.', reveal:'Both can be invoked as healers while also being feared as senders of disease. That makes them useful for comparison without implying a shared ancestral deity.' },
  { a:'Freya', b:'Ishtar', label:'Love / war paradox', kind:'comparative', hook:'Why do love, fertility, battle and the dead keep colliding?', reveal:'Freya and Ishtar both combine erotic or fertility associations with warfare and death. The comparison is thematic and cross-cultural, not evidence that one descends from the other.' },
  { a:'Yama', b:'Hades', label:'Different underworlds', kind:'structural', hook:'“God of the dead” hides two very different ideas of what that job means.', reveal:'Yama is imagined as the first mortal to travel the road of death and later a judge of the dead; Hades is an underworld sovereign. The overlap is useful precisely because the differences remain visible.' },
  { a:'Set', b:'Loki', label:'Speculative curiosity', kind:'speculative', hook:'The dangerous insider: helper, disruptor, catastrophe.', reveal:'Set and Loki are both difficult to reduce to simple “evil god” labels. Their roles shift between protection, disruption and cosmic crisis. This is a provocative structural comparison, not a historical claim.' },
  { a:'Agni', b:'Brigid', label:'Sacred flame', kind:'structural', hook:'One flame carries offerings; another becomes healing, poetry and craft.', reveal:'Agni and Brigid show how sacred fire can cluster around ritual, transformation, craft and healing. The similarities are best treated as a comparative pattern rather than a single proven inherited deity.' },
];

export const EXHIBITS = [
  { title:'The Thunderer and the Serpent', eyebrow:'Rabbit hole · 5 min', start:'Thor', compare:'Indra', archetype:'thunderer', copy:'Start with a famous comparison, then see how quickly “same myth” becomes more complicated.' },
  { title:'The Archer Who Heals', eyebrow:'Rabbit hole · 4 min', start:'Apollo', compare:'Rudra', archetype:'far-shooter', copy:'A genuinely strange pattern: divine archers who can both inflict disease and remove it.' },
  { title:'Names of the Daylight Sky', eyebrow:'Evidence trail · 4 min', start:'Zeus', compare:'Dyaus', archetype:'sky-father', copy:'See what a strong linguistic relationship looks like, then compare it with looser thematic parallels elsewhere.' },
  { title:'Crossing the Last Boundary', eyebrow:'Contact story · 5 min', start:'Hermes', compare:'Anubis', archetype:'boundary-crosser', copy:'Two psychopomps did not merely resemble one another: later Greco-Egyptian religion actually fused them.' },
];

export const ERA_STOPS = [
  {value:-2000,label:'2000 BCE'}, {value:-1500,label:'1500 BCE'}, {value:-1000,label:'1000 BCE'}, {value:-800,label:'800 BCE'},
  {value:-500,label:'500 BCE'}, {value:0,label:'1 CE'}, {value:500,label:'500 CE'}, {value:900,label:'900 CE'}, {value:1200,label:'1200 CE'}
];
