/* ─────────────────────────────────────────────────────────────────
   data/citations.js — Per-deity academic references
   ───────────────────────────────────────────────────────────────── */

// Core bibliography
export const BIBLIOGRAPHY = [
  {
    id: 'west-2007',
    author: 'West, M.L.',
    year: 2007,
    title: 'Indo-European Poetry and Myth',
    publisher: 'Oxford University Press',
    note: 'The most comprehensive modern survey of PIE mythology. Essential reading.',
  },
  {
    id: 'mallory-adams-2006',
    author: 'Mallory, J.P. & Adams, D.Q.',
    year: 2006,
    title: 'The Oxford Introduction to Proto-Indo-European and the Proto-Indo-European World',
    publisher: 'Oxford University Press',
    note: 'Standard reference for PIE linguistics and reconstructed culture.',
  },
  {
    id: 'dumezil-1958',
    author: 'Dumézil, G.',
    year: 1958,
    title: "L'idéologie tripartie des Indo-Européens",
    publisher: 'Latomus, Brussels',
    note: 'Foundational work on the three-function theory (sovereignty, warrior, fertility).',
  },
  {
    id: 'dumezil-1966',
    author: 'Dumézil, G.',
    year: 1966,
    title: 'Archaic Roman Religion',
    publisher: 'University of Chicago Press',
    note: 'Application of tripartite theory to Roman religion.',
  },
  {
    id: 'watkins-1995',
    author: 'Watkins, C.',
    year: 1995,
    title: 'How to Kill a Dragon: Aspects of Indo-European Poetics',
    publisher: 'Oxford University Press',
    note: 'Reconstruction of the PIE dragon-slaying formula *"Hero Slays Serpent."',
  },
  {
    id: 'watkins-2000',
    author: 'Watkins, C.',
    year: 2000,
    title: 'The American Heritage Dictionary of Indo-European Roots',
    publisher: 'Houghton Mifflin',
    note: 'Standard reference for PIE etymological roots.',
  },
  {
    id: 'lincoln-1991',
    author: 'Lincoln, B.',
    year: 1991,
    title: 'Death, War, and Sacrifice: Studies in Ideology and Practice',
    publisher: 'University of Chicago Press',
    note: 'Comparative analysis of death and warrior cults across IE traditions.',
  },
  {
    id: 'ivanov-toporov-1974',
    author: 'Ivanov, V.V. & Toporov, V.N.',
    year: 1974,
    title: 'Исследования в области славянских древностей (Studies in the Field of Slavic Antiquities)',
    publisher: 'Nauka, Moscow',
    note: 'Foundational work on Slavic mythology and the Perun-Veles dualism.',
  },
  {
    id: 'mackillop-1998',
    author: 'MacKillop, J.',
    year: 1998,
    title: 'Dictionary of Celtic Mythology',
    publisher: 'Oxford University Press',
    note: 'Standard reference for Celtic mythological figures and traditions.',
  },
  {
    id: 'beck-2006',
    author: 'Beck, R.',
    year: 2006,
    title: 'The Religion of the Mithras Cult in the Roman Empire',
    publisher: 'Oxford University Press',
    note: 'Comprehensive study of the Mithraic mysteries.',
  },
];

// Per-deity citation lists (3 refs max per deity)
export const DEITY_CITATIONS = {
  Apollo: [
    { ref: 'west-2007', pages: 'ch. 7', note: 'The "Far-Shooter" archetype and comparison with Rudra' },
    { ref: 'watkins-1995', pages: 'pp. 460–470', note: 'Apollo\'s archer function and plague arrows' },
    { ref: 'mallory-adams-2006', pages: 'pp. 408–410', note: 'PIE solar-archer deity reconstruction' },
  ],
  Rudra: [
    { ref: 'west-2007', pages: 'pp. 165–170', note: 'Rudra as archer-healer, comparison with Apollo' },
    { ref: 'mallory-adams-2006', pages: 'pp. 407–411', note: 'Rudra in Rigvedic context and PIE parallels' },
    { ref: 'dumezil-1958', pages: 'ch. 3', note: 'Rudra\'s marginal, outsider status in the pantheon' },
  ],
  Zeus: [
    { ref: 'west-2007', pages: 'pp. 168–175', note: 'Zeus and the PIE sky father *Dyēus' },
    { ref: 'mallory-adams-2006', pages: 'pp. 408–409', note: 'Etymology *Dyḗus ph₂tḗr and cognates' },
    { ref: 'watkins-2000', pages: 'p. 18', note: 'Root *deiw- and its reflexes across IE languages' },
  ],
  Jupiter: [
    { ref: 'dumezil-1966', pages: 'pp. 131–175', note: 'Jupiter in Dumézil\'s three-function analysis' },
    { ref: 'mallory-adams-2006', pages: 'pp. 408–409', note: 'Jupiter as cognate of Zeus and Dyaus' },
    { ref: 'west-2007', pages: 'pp. 168–172', note: 'The Sky Father in Roman religion' },
  ],
  Dyaus: [
    { ref: 'mallory-adams-2006', pages: 'pp. 408–409', note: 'Dyaus Pitr as most archaic Sky Father retention' },
    { ref: 'west-2007', pages: 'pp. 168–170', note: 'Dyaus and the PIE Sky Father reconstruction' },
    { ref: 'watkins-2000', pages: 'p. 18', note: 'Etymology of Dyaus and cognate forms' },
  ],
  Hermes: [
    { ref: 'west-2007', pages: 'pp. 258–265', note: 'Hermes as liminal messenger and psychopomp' },
    { ref: 'dumezil-1966', pages: 'pp. 67–72', note: 'Hermes / Mercury comparison' },
    { ref: 'watkins-1995', pages: 'pp. 23–28', note: 'The cattle-stealing motif and PIE trickster' },
  ],
  Mercury: [
    { ref: 'dumezil-1966', pages: 'pp. 67–72', note: 'Mercury as Roman interpretatio of Hermes' },
    { ref: 'west-2007', pages: 'pp. 258–262', note: 'Mercury\'s liminal functions' },
  ],
  Loki: [
    { ref: 'west-2007', pages: 'pp. 259–263', note: 'Loki as liminal trickster, comparison with Hermes' },
    { ref: 'dumezil-1958', pages: 'pp. 89–102', note: 'Loki and the problem of the trickster in IE religion' },
  ],
  Odin: [
    { ref: 'dumezil-1958', pages: 'ch. 4', note: 'Odin as sovereignty figure, comparison with Varuna' },
    { ref: 'west-2007', pages: 'pp. 380–385', note: 'Odin\'s sacrifice, wisdom, and the hanging god' },
    { ref: 'lincoln-1991', pages: 'pp. 73–90', note: 'Odin\'s warrior-death function' },
  ],
  Varuna: [
    { ref: 'dumezil-1958', pages: 'ch. 2', note: 'Varuna as the paradigmatic PIE sovereign magic-wielder' },
    { ref: 'west-2007', pages: 'pp. 135–142', note: 'Varuna\'s Ṛta and comparison with Odin' },
    { ref: 'mallory-adams-2006', pages: 'pp. 414–416', note: 'Varuna and the PIE concept of cosmic law' },
  ],
  Thor: [
    { ref: 'watkins-1995', pages: 'pp. 300–320', note: 'Thor and the PIE dragon-slaying formula' },
    { ref: 'west-2007', pages: 'pp. 257–262', note: 'Thor compared with Indra and Perun' },
    { ref: 'dumezil-1958', pages: 'pp. 65–82', note: 'Thor\'s warrior function in Dumézil\'s framework' },
  ],
  Indra: [
    { ref: 'watkins-1995', pages: 'pp. 298–315', note: 'Indra-Vritra battle as the PIE dragon-slaying myth' },
    { ref: 'west-2007', pages: 'pp. 247–255', note: 'Indra\'s storm-warrior attributes and PIE parallels' },
    { ref: 'dumezil-1958', pages: 'pp. 62–80', note: 'Indra as the warrior function par excellence' },
  ],
  Agni: [
    { ref: 'west-2007', pages: 'pp. 231–242', note: 'Agni as divine fire and messenger between worlds' },
    { ref: 'mallory-adams-2006', pages: 'pp. 415–416', note: 'PIE fire deity and its reflexes' },
    { ref: 'watkins-1995', pages: 'pp. 66–72', note: 'The sacred fire formula in PIE poetics' },
  ],
  Brigid: [
    { ref: 'west-2007', pages: 'pp. 231–238', note: 'The sacred eternal flame tradition in PIE religions' },
    { ref: 'mackillop-1998', pages: 'pp. 54–57', note: 'Brigid\'s triple nature and sacred flame at Kildare' },
  ],
  Svarog: [
    { ref: 'ivanov-toporov-1974', pages: 'ch. 5', note: 'Svarog and the Slavic fire-smith deity' },
    { ref: 'west-2007', pages: 'pp. 233–235', note: 'Slavic fire deities and PIE parallels' },
  ],
  Perun: [
    { ref: 'ivanov-toporov-1974', pages: 'ch. 2–4', note: 'The Perun-Veles dualism as the core Slavic myth' },
    { ref: 'watkins-1995', pages: 'pp. 316–325', note: 'Perun and the PIE thunder-warrior archetype' },
    { ref: 'west-2007', pages: 'pp. 255–260', note: 'Perun compared with Thor and Indra' },
  ],
  Veles: [
    { ref: 'ivanov-toporov-1974', pages: 'ch. 2–4', note: 'Veles as underworld trickster in Slavic myth' },
    { ref: 'west-2007', pages: 'pp. 258–263', note: 'Veles compared with Hermes and underworld deities' },
  ],
  Yama: [
    { ref: 'west-2007', pages: 'pp. 389–396', note: 'Yama as first of the dead; *Yemos reconstruction' },
    { ref: 'mallory-adams-2006', pages: 'pp. 421–422', note: 'PIE *Yemos and the twin-death myth' },
    { ref: 'lincoln-1991', pages: 'pp. 40–55', note: 'Death and the sacrificed twin in PIE religion' },
  ],
  Hades: [
    { ref: 'west-2007', pages: 'pp. 389–395', note: 'Hades compared with Yama and the PIE underworld ruler' },
    { ref: 'lincoln-1991', pages: 'pp. 40–50', note: 'The underworld realm in PIE comparative mythology' },
  ],
  Mithras: [
    { ref: 'beck-2006', pages: 'ch. 1–3', note: 'Origin and development of the Mithraic mysteries' },
    { ref: 'mallory-adams-2006', pages: 'pp. 417–418', note: 'Mithras\'s Iranian origins and PIE solar covenant deity' },
  ],
  Mithra: [
    { ref: 'mallory-adams-2006', pages: 'pp. 417–418', note: 'Mithra and the PIE *Mitrá solar covenant figure' },
    { ref: 'west-2007', pages: 'pp. 185–192', note: 'Iranian Mithra and Vedic Mitra as cognates' },
  ],
  Ishtar: [
    { ref: 'lincoln-1991', pages: 'pp. 105–120', note: 'Ishtar\'s descent to the underworld and parallels with Freya' },
    { ref: 'west-2007', pages: 'pp. 194–200', note: 'The war-love goddess and her IE parallels' },
  ],
  Freya: [
    { ref: 'lincoln-1991', pages: 'pp. 105–120', note: 'Freya and the war-love goddess archetype' },
    { ref: 'dumezil-1958', pages: 'pp. 115–128', note: 'The Vanir gods and PIE fertility function' },
    { ref: 'west-2007', pages: 'pp. 194–200', note: 'Freya compared with Ishtar and Aphrodite' },
  ],
  Lugh: [
    { ref: 'mackillop-1998', pages: 'pp. 280–285', note: 'Lugh as solar warrior-craftsman' },
    { ref: 'west-2007', pages: 'pp. 163–167', note: 'Lugh and the Celtic manifestation of the archer-craftsman archetype' },
    { ref: 'watkins-2000', pages: 'p. 52', note: 'The root *lewk- (light) and solar deity names' },
  ],
  Cernunnos: [
    { ref: 'mackillop-1998', pages: 'pp. 78–80', note: 'Cernunnos and the Horned God archetype' },
    { ref: 'lincoln-1991', pages: 'pp. 65–72', note: 'The Lord of Animals figure in PIE religion' },
  ],
  Dionysus: [
    { ref: 'west-2007', pages: 'pp. 274–280', note: 'Dionysus and ecstatic religion in the PIE context' },
    { ref: 'lincoln-1991', pages: 'pp. 92–100', note: 'The dying and rising god archetype' },
  ],
  'Ahura Mazda': [
    { ref: 'mallory-adams-2006', pages: 'pp. 419–420', note: 'Ahura Mazda and the PIE cosmic sovereign' },
    { ref: 'west-2007', pages: 'pp. 193–198', note: 'Ahura Mazda compared with Varuna' },
    { ref: 'dumezil-1958', pages: 'pp. 37–52', note: 'The first-function sovereign in Iranian religion' },
  ],
  'The Morrigan': [
    { ref: 'mackillop-1998', pages: 'pp. 320–323', note: 'The Morrigan\'s triple nature and battlefield role' },
    { ref: 'lincoln-1991', pages: 'pp. 108–115', note: 'Battle goddesses and the PIE warrior cult' },
  ],
  Shiva: [
    { ref: 'west-2007', pages: 'pp. 165–170', note: 'Shiva as development of Rudra, PIE wilderness-ascetic archetype' },
    { ref: 'mallory-adams-2006', pages: 'pp. 410–412', note: 'Shiva-Rudra and the Vedic marginal deity' },
  ],
};

// Shared bibliography lookup
export function getBibEntry(id) {
  return BIBLIOGRAPHY.find(b => b.id === id) || null;
}

// Get full citation objects for a deity
export function getDeityRefs(deityId) {
  const refs = DEITY_CITATIONS[deityId] || [];
  return refs.map(r => ({
    ...r,
    bib: getBibEntry(r.ref),
  })).filter(r => r.bib);
}
