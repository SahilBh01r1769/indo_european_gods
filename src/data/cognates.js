/* ─────────────────────────────────────────────────────────────────
   data/cognates.js — Known & theorized PIE cognate pairs
   with scholarly notes and confidence levels
   ───────────────────────────────────────────────────────────────── */

// Confidence levels:
//  'secure'    — etymological + functional cognacy, broad scholarly consensus
//  'strong'    — functional cognacy strong, etymology reconstructed with confidence
//  'probable'  — functional parallels compelling, some scholarly debate
//  'proposed'  — minority position or speculative but cited in literature

export const COGNATE_PAIRS = [
  // ── Sky Father cluster (*Dyēus Ph₂tḗr) ──────────────────────────
  {
    a: 'Zeus', b: 'Jupiter',
    confidence: 'secure',
    note: 'Direct etymological cognates: Greek *Diós, Latin *Iou-pater — both from PIE *Dyḗus ph₂tḗr ("Sky Father").',
    source: 'Mallory & Adams, 2006',
  },
  {
    a: 'Zeus', b: 'Dyaus',
    confidence: 'secure',
    note: 'Vedic Dyáuṣ Pitṝ = Greek Zeus + Latin Jupiter = PIE Sky Father *Dyḗus. Name cognate is exact.',
    source: 'Watkins, 2000',
  },
  {
    a: 'Zeus', b: 'Tyr',
    confidence: 'strong',
    note: 'Old Norse Týr from *Tīwaz, from PIE *Deywós (divine). The original Germanic sky-father was demoted as Odin/Thor rose.',
    source: 'West, 2007',
  },
  {
    a: 'Jupiter', b: 'Dyaus',
    confidence: 'secure',
    note: 'Both direct reflexes of PIE *Dyḗus ph₂tḗr. Latin loses the -us in compound *Dyu-pater → Jupiter.',
    source: 'Mallory & Adams, 2006',
  },

  // ── Archer-Healer-Plague archetype ──────────────────────────────
  {
    a: 'Apollo', b: 'Rudra',
    confidence: 'strong',
    note: 'The archer-healer-disease-sender who dwells at the margins. Both shoot plague arrows and paradoxically heal them. West calls this the "Far-Shooter" archetype. No direct etymological link, but functional cognacy is among the most discussed in comparative mythology.',
    source: 'West, 2007; Oberlies, 1998',
  },
  {
    a: 'Apollo', b: 'Lugh',
    confidence: 'probable',
    note: 'Solar warrior-craftsman who is master of many arts. Both are young, solar, skilled in all crafts, and lead their people in a climactic battle. Watkins notes the archer-craftsman solar god as a PIE figure.',
    source: 'Watkins, 2000; MacKillop, 1998',
  },
  {
    a: 'Artemis', b: 'Diana',
    confidence: 'secure',
    note: 'Direct Roman interpretatio of Greek Artemis. Diana\'s name (*Diwiana) may share the *Dyeus root, making her "she of the divine light."',
    source: 'Dumézil, 1966',
  },

  // ── Thunder-warrior / Serpent-slayer cluster ─────────────────────
  {
    a: 'Thor', b: 'Indra',
    confidence: 'strong',
    note: 'Both are thunder warriors who defeat a primordial serpent (Jörmungandr / Vritra) to restore cosmic order. Both drink prodigiously before battle. Calvert Watkins reconstructed the proto-myth as *"Hero slays Serpent."',
    source: 'Watkins, 1995; Lincoln, 1991',
  },
  {
    a: 'Thor', b: 'Perun',
    confidence: 'strong',
    note: 'Slavic Perun is the most direct functional parallel to Thor: thunder god who eternally battles the underworld serpent (Veles). Some scholars derive Perun from PIE *perkwu- (oak) — same root as Norse Fjörgyn (Thor\'s mother).',
    source: 'Ivanov & Toporov, 1974',
  },
  {
    a: 'Thor', b: 'Taranis',
    confidence: 'probable',
    note: 'Gaulish thunder god Taranis ("Thunderer") occupies the same structural slot as Thor and Jupiter. The wheel symbol may cognate with Thor\'s hammer as emblems of the thunderbolt.',
    source: 'MacKillop, 1998',
  },
  {
    a: 'Indra', b: 'Enlil',
    confidence: 'probable',
    note: 'Both storm-king gods who subdue primordial chaos monsters releasing the waters of life. The myth may predate PIE, but the parallel structural role is clear.',
    source: 'West, 2007',
  },
  {
    a: 'Indra', b: 'Marduk',
    confidence: 'probable',
    note: 'Marduk slays Tiamat (chaos-sea) as Indra slays Vritra (cosmic serpent). The cosmic combat myth (*"Hero Slays Dragon") likely has a PIE prototype.',
    source: 'Watkins, 1995',
  },

  // ── Sovereign Magic-Wielder cluster ─────────────────────────────
  {
    a: 'Odin', b: 'Varuna',
    confidence: 'strong',
    note: 'Dumézil\'s most celebrated comparison: both are sovereign magic-wielders with one compromised sense organ (Odin\'s eye, Varuna\'s binding snares that can ensnare vision). Both are omniscient, associated with poetic inspiration, and preside over oaths.',
    source: 'Dumézil, 1958; West, 2007',
  },

  // ── Liminal Trickster-Psychopomp cluster ─────────────────────────
  {
    a: 'Hermes', b: 'Mercury',
    confidence: 'secure',
    note: 'Direct Roman interpretatio. Mercury\'s name from merx (merchandise) but functions are entirely Hermes-derived.',
    source: 'Dumézil, 1966',
  },
  {
    a: 'Hermes', b: 'Loki',
    confidence: 'probable',
    note: 'Both are boundary-crossing tricksters who operate between divine and mortal worlds, cause problems and solve them. Some scholars propose a PIE "messenger-trickster" figure.',
    source: 'Rooth, 1961; Dumézil, 1959',
  },
  {
    a: 'Hermes', b: 'Veles',
    confidence: 'probable',
    note: 'Veles as underworld trickster-psychopomp parallels Hermes (psychopomp) and Loki (trickster). The liminal cattle-stealing motif connects to the Hermes–Apollo cattle myth.',
    source: 'Ivanov & Toporov, 1974',
  },
  {
    a: 'Loki', b: 'Veles',
    confidence: 'probable',
    note: 'Both are shape-shifting tricksters associated with the underworld who stand in eternal opposition to the thunder god. Perun-Veles mirrors Odin/Thor–Loki in structural terms.',
    source: 'Ivanov & Toporov, 1974',
  },
  {
    a: 'Manannán', b: 'Hermes',
    confidence: 'probable',
    note: 'Both ferry souls across a boundary (sea / underworld), are tricksters, and govern liminal crossings. Manannán also parallels Charon in function.',
    source: 'MacKillop, 1998',
  },

  // ── Solar continuities ──────────────────────────────────────────
  {
    a: 'Mithras', b: 'Mithra',
    confidence: 'secure',
    note: 'Roman Mithras is derived from Iranian Mithra via the mystery cult\'s origins in Anatolia/Iran. The name is directly cognate with Vedic Mitra (*Mitrá = covenant).',
    source: 'Beck, 2006; Clauss, 2000',
  },
  {
    a: 'Mithra', b: 'Surya',
    confidence: 'strong',
    note: 'Both Iranian Mithra and Vedic Mitra are solar covenant deities derived from the same PIE *Mitrá figure — a solar god of contracts and truth.',
    source: 'Mallory & Adams, 2006',
  },
  {
    a: 'Helios', b: 'Surya',
    confidence: 'strong',
    note: 'Both are personifications of the sun who drive solar chariots. Both are all-seeing witnesses to oaths. The solar chariot myth is a likely PIE inheritance.',
    source: 'West, 2007',
  },
  {
    a: 'Eos', b: 'Ushas',
    confidence: 'secure',
    note: 'Greek Ēōs and Vedic Uṣás are direct etymological cognates from PIE *H₂éwsōs (dawn). Both are daughters of the sky father, both drive rosy chariots. One of the most linguistically secure PIE continuities.',
    source: 'Mallory & Adams, 2006; West, 2007',
  },
  {
    a: 'Baldr', b: 'Apollo',
    confidence: 'proposed',
    note: 'Both are radiant, beloved solar figures who die and are associated with beauty and light. Lincoln and others have proposed a PIE "dying solar god" archetype, though this is debated.',
    source: 'Lincoln, 1991',
  },

  // ── Sacred Fire / Smith ─────────────────────────────────────────
  {
    a: 'Agni', b: 'Brigid',
    confidence: 'probable',
    note: 'Both preside over sacred flames of craft and healing. Brigid\'s perpetual sacred flame at Kildare parallels the Vedic sacred fire. Both are triple in nature (Brigid\'s three sisters; Agni\'s three forms).',
    source: 'West, 2007',
  },
  {
    a: 'Agni', b: 'Svarog',
    confidence: 'probable',
    note: 'Svarog\'s name derives from *svar (bright sky), cognate with Vedic svarga. Both are sky-fire smith deities. Svarog\'s son Svarožyc (fire) parallels Agni directly.',
    source: 'Ivanov & Toporov, 1974',
  },
  {
    a: 'Hephaestus', b: 'Vulcan',
    confidence: 'secure',
    note: 'Direct Roman interpretatio, though Vulcan may have pre-Roman Italic origins as a fire deity. Both are lame divine smiths — the "wounded craftsman" archetype.',
    source: 'Dumézil, 1966',
  },
  {
    a: 'Brigid', b: 'Svarog',
    confidence: 'probable',
    note: 'Both are sacred-fire smith deities who preside over craft, healing, and the forge. The fire-smith-healer combination may reflect a PIE deity of civilized crafts.',
    source: 'West, 2007',
  },

  // ── Death / Underworld ──────────────────────────────────────────
  {
    a: 'Yama', b: 'Hades',
    confidence: 'strong',
    note: 'Both are "first of the dead" who rule the underworld. Yama is the first mortal; Hades received the underworld in the cosmic division. West notes the PIE *Yemos figure as progenitor of the underworld.',
    source: 'West, 2007; Mallory & Adams, 2006',
  },
  {
    a: 'Yama', b: 'Veles',
    confidence: 'probable',
    note: 'Both rule over the dead in their respective traditions. Slavic Veles as underworld cattle-god may reflect the same PIE *Yemos figure as Vedic Yama.',
    source: 'Ivanov & Toporov, 1974',
  },
  {
    a: 'Hades', b: 'Veles',
    confidence: 'probable',
    note: 'Both are underworld rulers associated with wealth, cattle, and the dead. The Greek Pluton (wealth) epithet of Hades parallels Veles\'s cattle wealth association.',
    source: 'West, 2007',
  },

  // ── War-Love goddess ────────────────────────────────────────────
  {
    a: 'Ishtar', b: 'Freya',
    confidence: 'strong',
    note: 'Both are war-love goddesses who descend to the underworld. Both weep for a slain lover. Both receive first choice of the battle-slain. Dumézil and others see this as a persistent archetype, though direct PIE ancestry is debated given Ishtar\'s Semitic origin.',
    source: 'Dumézil, 1973; Lincoln, 1991',
  },
  {
    a: 'Ishtar', b: 'The Morrigan',
    confidence: 'proposed',
    note: 'Both are terrifying war goddesses associated with fate and the dead. The Morrigan\'s triple nature and battle-crow form parallel Ishtar\'s complex of attributes.',
    source: 'Lincoln, 1991',
  },

  // ── Wisdom Sovereign ────────────────────────────────────────────
  {
    a: 'Ahura Mazda', b: 'Varuna',
    confidence: 'strong',
    note: 'Both are omniscient sky sovereigns who uphold cosmic truth/order (Vedic Ṛta / Avestan Aša). Varuna and Ahura Mazda are cognate in function and likely reflect the same PIE sovereign deity.',
    source: 'Mallory & Adams, 2006; Dumézil, 1958',
  },


  // ── Egyptian cross-pantheon parallels ───────────────────────────
  // Egyptian religion is not IE in origin; these are functional
  // parallels and structural analogues, not etymological cognates.
  // Confidence is capped at 'probable' or 'proposed' accordingly.
  {
    a: 'Thoth', b: 'Hermes',
    confidence: 'probable',
    note: 'Both are divine scribes, wise counsellors, and liminal psychopomps who mediate between the living and dead. The Hellenistic fusion Hermes Trismegistus ("Thrice-Great Hermes") explicitly identified the two.',
    source: 'West, 2007; Fowden, 1986',
  },
  {
    a: 'Thoth', b: 'Odin',
    confidence: 'proposed',
    note: "Both sacrifice personal cost for cosmic wisdom (Odin's eye; Thoth's role as recorder of Ma'at). Both preside over sacred writing systems (runes; hieroglyphs) and serve as counsellors to the chief god.",
    source: 'Lincoln, 1991',
  },
  {
    a: 'Ra', b: 'Surya',
    confidence: 'probable',
    note: "Both are supreme solar deities who cross the sky in a solar vehicle and are all-seeing witnesses. The solar barque of Ra parallels Surya's seven-horsed chariot as mythological solar transport.",
    source: 'West, 2007',
  },
  {
    a: 'Ra', b: 'Apollo',
    confidence: 'probable',
    note: "Both are supreme solar deities associated with cosmic order, truth, and divine kingship. Apollo's solar aspect and Ra's identification with pharaonic authority create strong functional overlap.",
    source: 'West, 2007',
  },
  {
    a: 'Apophis', b: 'Indra',
    confidence: 'probable',
    note: "The Ra-Apophis cosmic combat — the solar deity defeating the chaos serpent nightly — is the Egyptian manifestation of Watkins's reconstructed PIE dragon-slaying formula *"Hero Slays Serpent."",
    source: 'Watkins, 1995',
  },
  {
    a: 'Apophis', b: 'Thor',
    confidence: 'probable',
    note: "Set defeats Apophis nightly to protect Ra's barque; Thor slays Jörmungandr at Ragnarok. Both are cosmic serpent-slaying myths. The structural parallel is among the strongest cross-cultural examples.",
    source: 'Watkins, 1995',
  },
  {
    a: 'Set', b: 'Loki',
    confidence: 'proposed',
    note: "Both are chaos-bringers within a divine family who ultimately trigger cosmic catastrophe. Both are ambiguous — sometimes protectors, ultimately destroyers. The structural role is strikingly parallel.",
    source: 'Lincoln, 1991',
  },
  {
    a: 'Set', b: 'Veles',
    confidence: 'proposed',
    note: "Both are adversarial storm-chaos deities opposed to a celestial order god (Ra/Perun). Set's desert domain and Veles's underworld-wilderness role share the liminal outsider-chaos function.",
    source: 'Ivanov & Toporov, 1974',
  },
  {
    a: 'Osiris', b: 'Dionysus',
    confidence: 'probable',
    note: "Plutarch explicitly compared the two in *De Iside et Osiride*. Both are dying-and-rising gods associated with vegetation, wine, and ecstatic mystery cults. Herodotus identified them.",
    source: 'Plutarch, De Iside; West, 2007',
  },
  {
    a: 'Osiris', b: 'Baldr',
    confidence: 'proposed',
    note: "Both are beloved gods who are murdered through treachery and descend to the underworld. Their deaths trigger a divine crisis. Lincoln proposes a PIE 'slain god' archetype that both reflect.",
    source: 'Lincoln, 1991',
  },
  {
    a: 'Anubis', b: 'Hermes',
    confidence: 'strong',
    note: "Both are jackal/herald psychopomps who guide souls of the dead. The Hellenistic syncretic deity Hermanubis directly fused the two. Their liminal guide-of-souls function is the clearest Egyptian-IE structural parallel.",
    source: 'Fowden, 1986; West, 2007',
  },
  {
    a: 'Anubis', b: 'Yama',
    confidence: 'probable',
    note: "Both are guardians of the dead who judge and guide souls through the afterlife. Yama weighs karma; Anubis weighs the heart against the feather of Ma'at — a strikingly parallel judgment motif.",
    source: 'West, 2007',
  },
  {
    a: 'Sekhmet', b: 'Rudra',
    confidence: 'probable',
    note: "Both are terrifying disease-sender deities who are also paradoxically healers. Sekhmet sends plague and cures it; Rudra shoots disease arrows and possesses healing herbs. The duality is identical.",
    source: 'West, 2007',
  },
  {
    a: 'Sekhmet', b: 'The Morrigan',
    confidence: 'proposed',
    note: "Both are lioness/crow war goddesses associated with battle fury, mass death, and divine wrath. Both are female embodiments of destructive force within a larger pantheon.",
    source: 'Lincoln, 1991',
  },
  {
    a: 'Hathor', b: 'Ishtar',
    confidence: 'probable',
    note: "Both are love-war-sky goddesses with a destructive alter ego (Hathor/Sekhmet; Ishtar's descent). Both receive devotion through music, dance, and ecstatic ritual. West notes the parallel.",
    source: 'West, 2007',
  },
  {
    a: 'Hathor', b: 'Freya',
    confidence: 'proposed',
    note: "Both are love-fertility goddesses associated with gold, beauty, and a dual war aspect. Both receive the dead in some traditions. The love-war goddess archetype spans IE and Egyptian religion.",
    source: 'Lincoln, 1991',
  },
  {
    a: 'Horus', b: 'Apollo',
    confidence: 'probable',
    note: "Both are young solar warrior-gods who avenge a slain father figure and restore divine order. Horus defeats Set to avenge Osiris; Apollo is associated with solar kingship and divine justice.",
    source: 'West, 2007',
  },
  {
    a: 'Isis', b: 'Brigid',
    confidence: 'proposed',
    note: "Both are triple-aspected mother goddesses of healing, craft, and magical knowledge. Isis's widespread mystery cult and Brigid's sacred flame share the archetype of the healing-crafting great goddess.",
    source: 'MacKillop, 1998',
  },
];

// Build a fast lookup map: "A--B" or "B--A" → cognate data
export const COGNATE_MAP = new Map();
COGNATE_PAIRS.forEach(pair => {
  COGNATE_MAP.set(`${pair.a}--${pair.b}`, pair);
  COGNATE_MAP.set(`${pair.b}--${pair.a}`, pair);
});

export function getCognate(idA, idB) {
  return COGNATE_MAP.get(`${idA}--${idB}`) || null;
}
