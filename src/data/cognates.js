/* ─────────────────────────────────────────────────────────────────
   data/cognates.js — Known & theorized PIE cognate pairs
   ───────────────────────────────────────────────────────────────── */

export const COGNATE_PAIRS = [
  // Sky Father
  { a:'Zeus',    b:'Jupiter',  confidence:'secure',   note:`Direct etymological cognates from PIE *Dyḗus ph₂tḗr (Sky Father).`,                                              source:'Mallory & Adams, 2006' },
  { a:'Zeus',    b:'Dyaus',    confidence:'secure',   note:`Vedic Dyáuṣ Pitṝ = Greek Zeus = Latin Jupiter. Name cognate is exact.`,                                          source:'Watkins, 2000' },
  { a:'Zeus',    b:'Tyr',      confidence:'strong',   note:`Old Norse Týr from *Tīwaz, PIE *Deywós. Original Germanic sky-father demoted as Odin/Thor rose.`,                source:'West, 2007' },
  { a:'Jupiter', b:'Dyaus',    confidence:'secure',   note:`Both direct reflexes of PIE *Dyḗus ph₂tḗr. Latin *Dyu-pater → Jupiter.`,                                        source:'Mallory & Adams, 2006' },

  // Archer-Healer
  { a:'Apollo',  b:'Rudra',    confidence:'strong',   note:`The archer-healer-disease-sender archetype. Both shoot plague arrows and paradoxically heal. West calls this the Far-Shooter archetype.`,   source:'West, 2007' },
  { a:'Apollo',  b:'Lugh',     confidence:'probable', note:`Solar warrior-craftsman master of many arts. Both young, solar, skilled in all crafts, lead their people in climactic battle.`,             source:'Watkins, 2000; MacKillop, 1998' },
  { a:'Artemis', b:'Diana',    confidence:'secure',   note:`Direct Roman interpretatio. Diana's name (*Diwiana) may share the *Dyeus root.`,                                 source:'Dumézil, 1966' },

  // Thunder-warrior
  { a:'Thor',    b:'Indra',    confidence:'strong',   note:`Both thunder warriors defeating a primordial serpent (Jörmungandr / Vritra). Both drink prodigiously before battle. Watkins reconstructed *Hero Slays Serpent.`,  source:'Watkins, 1995' },
  { a:'Thor',    b:'Perun',    confidence:'strong',   note:`Slavic Perun is the most direct parallel to Thor: thunder god who battles the underworld serpent (Veles). Perun may derive from PIE *perkwu- (oak).`,            source:'Ivanov & Toporov, 1974' },
  { a:'Thor',    b:'Taranis',  confidence:'probable', note:`Gaulish Taranis (Thunderer) occupies the same structural slot as Thor. The wheel symbol may cognate with Thor's hammer.`,                  source:'MacKillop, 1998' },
  { a:'Indra',   b:'Enlil',    confidence:'probable', note:`Both storm-king gods subdueing primordial chaos monsters releasing the waters of life.`,                           source:'West, 2007' },
  { a:'Indra',   b:'Marduk',   confidence:'probable', note:`Marduk slays Tiamat as Indra slays Vritra. The cosmic combat myth likely has a PIE prototype.`,                   source:'Watkins, 1995' },

  // Sovereign
  { a:'Odin',    b:'Varuna',   confidence:'strong',   note:`Both sovereign magic-wielders with compromised senses (Odin's eye / Varuna's binding snares). Both omniscient, associated with poetic inspiration, presiding over oaths. Dumézil's most celebrated comparison.`, source:'Dumézil, 1958; West, 2007' },

  // Liminal trickster
  { a:'Hermes',  b:'Mercury',  confidence:'secure',   note:`Direct Roman interpretatio. Mercury's name from merx (merchandise) but functions are entirely Hermes-derived.`,   source:'Dumézil, 1966' },
  { a:'Hermes',  b:'Loki',     confidence:'probable', note:`Both boundary-crossing tricksters between divine and mortal worlds. Some scholars propose a PIE messenger-trickster figure.`,               source:'Rooth, 1961' },
  { a:'Hermes',  b:'Veles',    confidence:'probable', note:`Veles as underworld trickster-psychopomp parallels Hermes. The cattle-stealing motif connects to the Hermes-Apollo cattle myth.`,          source:'Ivanov & Toporov, 1974' },
  { a:'Loki',    b:'Veles',    confidence:'probable', note:`Both shape-shifting tricksters of the underworld opposed to the thunder god. Perun-Veles mirrors Odin/Thor-Loki structurally.`,            source:'Ivanov & Toporov, 1974' },
  { a:'Manannán',b:'Hermes',   confidence:'probable', note:`Both ferry souls across boundaries, are tricksters, and govern liminal crossings. Manannán also parallels Charon.`,  source:'MacKillop, 1998' },

  // Solar
  { a:'Mithras', b:'Mithra',   confidence:'secure',   note:`Roman Mithras derived from Iranian Mithra. Name directly cognate with Vedic Mitra (*Mitrá = covenant).`,          source:'Beck, 2006' },
  { a:'Mithra',  b:'Surya',    confidence:'strong',   note:`Both Iranian Mithra and Vedic Mitra are solar covenant deities from PIE *Mitrá — a solar god of contracts and truth.`, source:'Mallory & Adams, 2006' },
  { a:'Helios',  b:'Surya',    confidence:'strong',   note:`Both personifications of the sun driving solar chariots. Both all-seeing witnesses to oaths. Solar chariot myth is likely PIE.`,           source:'West, 2007' },
  { a:'Eos',     b:'Ushas',    confidence:'secure',   note:`Greek Ēōs and Vedic Uṣás are direct etymological cognates from PIE *H₂éwsōs (dawn). One of the most linguistically secure PIE continuities.`, source:'Mallory & Adams, 2006' },
  { a:'Baldr',   b:'Apollo',   confidence:'proposed', note:`Both radiant beloved solar figures who die and are associated with light. Lincoln proposed a PIE dying solar god archetype.`,              source:'Lincoln, 1991' },

  // Sacred fire / smith
  { a:'Agni',       b:'Brigid',    confidence:'probable', note:`Both preside over sacred flames of craft and healing. Brigid's perpetual flame at Kildare parallels the Vedic sacred fire. Both triple in nature.`,          source:'West, 2007' },
  { a:'Agni',       b:'Svarog',    confidence:'probable', note:`Svarog's name from *svar (bright sky), cognate with Vedic svarga. Both are sky-fire smith deities.`,                                   source:'Ivanov & Toporov, 1974' },
  { a:'Hephaestus', b:'Vulcan',    confidence:'secure',   note:`Direct Roman interpretatio. Both are lame divine smiths — the wounded craftsman archetype.`,                                          source:'Dumézil, 1966' },
  { a:'Brigid',     b:'Svarog',    confidence:'probable', note:`Both sacred-fire smith deities presiding over craft, healing, and the forge. May reflect a PIE deity of civilised crafts.`,           source:'West, 2007' },

  // Death / underworld
  { a:'Yama',  b:'Hades',  confidence:'strong',   note:`Both first-of-the-dead who rule the underworld. West notes the PIE *Yemos figure as progenitor of the underworld.`,                         source:'West, 2007' },
  { a:'Yama',  b:'Veles',  confidence:'probable', note:`Both rule over the dead. Slavic Veles as underworld cattle-god may reflect the same PIE *Yemos figure as Vedic Yama.`,                       source:'Ivanov & Toporov, 1974' },
  { a:'Hades', b:'Veles',  confidence:'probable', note:`Both underworld rulers associated with wealth, cattle, and the dead. Hades's Pluton (wealth) epithet parallels Veles's cattle wealth.`,      source:'West, 2007' },

  // War-love goddess
  { a:'Ishtar', b:'Freya',       confidence:'strong',   note:`Both war-love goddesses who descend to the underworld. Both weep for a slain lover. Both receive first choice of the battle-slain.`,       source:'Dumézil, 1973; Lincoln, 1991' },
  { a:'Ishtar', b:'The Morrigan',confidence:'proposed', note:`Both terrifying war goddesses associated with fate and the dead. The Morrigan's triple nature parallels Ishtar's complex of attributes.`,  source:'Lincoln, 1991' },

  // Wisdom sovereign
  { a:'Ahura Mazda', b:'Varuna', confidence:'strong', note:`Both omniscient sky sovereigns upholding cosmic truth/order (Vedic Ṛta / Avestan Aša). Likely reflect the same PIE sovereign deity.`,     source:'Mallory & Adams, 2006' },

  // Egyptian parallels (functional, not etymological)
  { a:'Thoth',   b:'Hermes',      confidence:'probable', note:`Both divine scribes and liminal psychopomps mediating between the living and dead. The Hellenistic fusion Hermes Trismegistus explicitly identified the two.`, source:'West, 2007; Fowden, 1986' },
  { a:'Thoth',   b:'Odin',        confidence:'proposed', note:`Both sacrifice for cosmic wisdom (Odin's eye; Thoth recording Ma'at). Both preside over sacred writing systems and counsel the chief god.`,                    source:'Lincoln, 1991' },
  { a:'Ra',      b:'Surya',       confidence:'probable', note:`Both supreme solar deities crossing the sky in a solar vehicle. Ra's solar barque parallels Surya's seven-horsed chariot.`,                                    source:'West, 2007' },
  { a:'Ra',      b:'Apollo',      confidence:'probable', note:`Both supreme solar deities associated with cosmic order, truth, and divine kingship.`,                                                                          source:'West, 2007' },
  { a:'Apophis', b:'Indra',       confidence:'probable', note:`The Ra-Apophis cosmic combat — solar deity defeating the chaos serpent nightly — is the Egyptian manifestation of Watkins's reconstructed PIE dragon-slaying formula.`, source:'Watkins, 1995' },
  { a:'Apophis', b:'Thor',        confidence:'probable', note:`Set defeats Apophis nightly to protect Ra's barque; Thor slays Jörmungandr at Ragnarok. Both are cosmic serpent-slaying myths.`,                               source:'Watkins, 1995' },
  { a:'Set',     b:'Loki',        confidence:'proposed', note:`Both chaos-bringers within a divine family who trigger cosmic catastrophe. Both ambiguous — sometimes protectors, ultimately destroyers.`,                     source:'Lincoln, 1991' },
  { a:'Set',     b:'Veles',       confidence:'proposed', note:`Both adversarial storm-chaos deities opposed to a celestial order god (Ra/Perun). Set's desert domain and Veles's underworld role share the chaos-outsider function.`, source:'Ivanov & Toporov, 1974' },
  { a:'Osiris',  b:'Dionysus',    confidence:'probable', note:`Plutarch explicitly compared the two in De Iside et Osiride. Both dying-and-rising gods of vegetation and ecstatic mystery cults.`,                            source:'Plutarch, De Iside; West, 2007' },
  { a:'Osiris',  b:'Baldr',       confidence:'proposed', note:`Both beloved gods murdered through treachery whose deaths trigger a divine crisis. Lincoln proposes a PIE slain-god archetype.`,                                source:'Lincoln, 1991' },
  { a:'Anubis',  b:'Hermes',      confidence:'strong',   note:`Both psychopomps guiding souls of the dead. The Hellenistic deity Hermanubis directly fused the two. Their liminal guide-of-souls function is the clearest Egyptian-IE parallel.`, source:'Fowden, 1986' },
  { a:'Anubis',  b:'Yama',        confidence:'probable', note:`Both guardians of the dead who judge souls. Yama weighs karma; Anubis weighs the heart against the feather of Ma'at — a strikingly parallel judgment motif.`, source:'West, 2007' },
  { a:'Sekhmet', b:'Rudra',       confidence:'probable', note:`Both terrifying disease-sender deities who are also paradoxically healers. Sekhmet sends plague and cures it; Rudra shoots disease arrows and possesses healing herbs.`, source:'West, 2007' },
  { a:'Sekhmet', b:'The Morrigan',confidence:'proposed', note:`Both lioness/crow war goddesses associated with battle fury and divine wrath. Both female embodiments of destructive force within a larger pantheon.`,           source:'Lincoln, 1991' },
  { a:'Hathor',  b:'Ishtar',      confidence:'probable', note:`Both love-war-sky goddesses with a destructive alter ego (Hathor/Sekhmet; Ishtar's descent). Both receive devotion through music and ecstatic ritual.`,        source:'West, 2007' },
  { a:'Hathor',  b:'Freya',       confidence:'proposed', note:`Both love-fertility goddesses associated with gold and beauty with a dual war aspect. The love-war goddess archetype spans IE and Egyptian religion.`,          source:'Lincoln, 1991' },
  { a:'Horus',   b:'Apollo',      confidence:'probable', note:`Both young solar warrior-gods who avenge a slain father and restore divine order. Horus defeats Set to avenge Osiris; Apollo embodies solar kingship and justice.`, source:'West, 2007' },
  { a:'Isis',    b:'Brigid',      confidence:'proposed', note:`Both triple-aspected mother goddesses of healing, craft, and magical knowledge. The healing-crafting great goddess archetype.`,                                 source:'MacKillop, 1998' },
];

export const COGNATE_MAP = new Map();
COGNATE_PAIRS.forEach(pair => {
  COGNATE_MAP.set(`${pair.a}--${pair.b}`, pair);
  COGNATE_MAP.set(`${pair.b}--${pair.a}`, pair);
});

export function getCognate(idA, idB) {
  return COGNATE_MAP.get(`${idA}--${idB}`) || null;
}
