export const DESIGN = {
  appName: "Mythos",
  tagline:
    "Follow the hidden threads between gods, stories and recurring ideas.",
};

export const START_DEITIES = [
  "Thor",
  "Apollo",
  "Hermes",
  "Yama",
  "Indra",
  "Zeus",
  "Agni",
  "Odin",
];

export const ARCHETYPES = [
  {
    id: "thunderer",
    name: "The Thunderer",
    short: "Storm, kingship and the enemy below",
    description:
      "A recurring storm-warrior pattern: thunder, violent force, kingship and combat against a cosmic adversary.",
    traits: ["Storm god", "War / victory"],
    seeds: ["Thor", "Indra"],
    suggested: ["Perun", "Zeus", "Taranis"],
  },
  {
    id: "archer-healer",
    name: "The Archer Who Heals",
    short: "The same hand wounds and cures",
    description:
      "Divine archers whose distance, disease and healing power make them both feared and invoked.",
    traits: ["Archer", "Healer", "Disease sender"],
    seeds: ["Apollo", "Rudra"],
    suggested: ["Sekhmet", "Artemis"],
  },
  {
    id: "boundary-crosser",
    name: "The Boundary Crosser",
    short: "Messengers, tricksters and guides of souls",
    description:
      "Figures who cross borders that others cannot: life and death, mortal and divine, law and transgression.",
    traits: ["Liminal outsider", "Trickster", "Death / underworld"],
    seeds: ["Hermes", "Anubis"],
    suggested: ["Thoth", "Loki", "Veles"],
  },
  {
    id: "sky-father",
    name: "Names of the Sky Father",
    short: "A divine name travelling across languages",
    description:
      "A linguistic trail through daylight-sky gods and the changing roles inherited from older Indo-European traditions.",
    traits: ["Storm god", "Ascetic / wisdom", "Solar"],
    seeds: ["Zeus", "Dyaus"],
    suggested: ["Jupiter", "Tyr"],
  },
  {
    id: "sacred-fire",
    name: "Sacred Fire",
    short: "Flame, craft and mediation",
    description:
      "Fire as messenger, forge and civilising force: sacred flame crossing from ritual into craft.",
    traits: ["Fire", "Smith / craft"],
    seeds: ["Agni", "Brigid"],
    suggested: ["Hephaestus", "Vulcan", "Svarog"],
  },
  {
    id: "keepers-dead",
    name: "Keepers of the Dead",
    short: "The rulers and guides beyond the threshold",
    description:
      "Underworld rulers and psychopomps who receive, judge or guide the dead rather than simply causing death.",
    traits: ["Death / underworld", "Liminal outsider"],
    seeds: ["Yama", "Hades"],
    suggested: ["Anubis", "Hermes", "Veles"],
  },
];

export const STORIES = [
  {
    id: "thunderer-serpent",
    title: "The Thunderer and the Serpent",
    deck: "Why do storm gods so often meet a serpent, dragon or enemy of the waters?",
    path: ["Thor", "Indra", "Perun", "Zeus"],
    chapters: [
      "Begin with Thor, the Norse thunderer whose most famous enemy is the world-serpent Jörmungandr.",
      "Travel east to Indra, Vṛtra-slayer of the Rigveda, whose victory releases the obstructed waters.",
      "Follow the storm pattern into Slavic tradition, where Perun opposes the underworld figure Veles.",
      "End with Zeus: another sky-and-thunder sovereign whose monster combats belong to the same broad mythic field.",
    ],
  },
  {
    id: "archer-heals",
    title: "The Archer Who Heals",
    deck: "A strange divine paradox: the power to send affliction and the power to remove it.",
    path: ["Apollo", "Rudra", "Sekhmet"],
    chapters: [
      "Apollo enters the Iliad as a distant archer whose arrows bring plague, yet he is also a god of medicine and purification.",
      "Rudra combines the same unsettling powers: archer, disease-sender, healer and dangerous lord of the margins.",
      "Sekhmet is not a linguistic relative, but she sharpens the structural question: why are plague and healing so often joined in one divine figure?",
    ],
  },
  {
    id: "daylight-sky",
    title: "Names of the Daylight Sky",
    deck: "Some connections are not merely thematic. The names themselves preserve history.",
    path: ["Zeus", "Dyaus", "Jupiter", "Tyr"],
    chapters: [
      "Zeus begins as the Greek ruler of the bright sky and thunder.",
      "Dyaus preserves a closely related Vedic name, one of comparative mythology’s clearest linguistic continuities.",
      "Jupiter carries the same ancient sky-father name into Latin through a changed form and changed religious system.",
      "Tyr preserves another branch of the old divine-name family, though his later Norse role is very different.",
    ],
  },
  {
    id: "guides-dead",
    title: "Guides Beyond the Last Boundary",
    deck: "Not every god of death rules the dead. Some specialise in crossing the boundary itself.",
    path: ["Hermes", "Anubis", "Yama", "Hades"],
    chapters: [
      "Hermes can move between Olympus, earth and the underworld, making him the archetypal boundary-crosser.",
      "Anubis guides and protects the dead through Egyptian funerary ritual and judgment.",
      "Yama becomes a ruler and receiver of the dead in Vedic tradition.",
      "Hades closes the journey as sovereign of the Greek underworld: a ruler of the dead rather than a personification of death.",
    ],
  },
  {
    id: "sacred-fire",
    title: "Fire That Carries a Message",
    deck: "Fire can be sacrifice, messenger, craft and the technology that changes a civilisation.",
    path: ["Agni", "Brigid", "Hephaestus", "Vulcan"],
    chapters: [
      "Agni is the ritual messenger: offerings placed in fire travel from the human world toward the gods.",
      "Brigid broadens sacred flame into healing, poetry and craft.",
      "Hephaestus turns fire toward the forge, where divine craft produces weapons, devices and wonders.",
      "Vulcan shows how a related craft role can be recast in another religious system through Roman interpretation.",
    ],
  },
  {
    id: "war-love",
    title: "Love, War and the Chosen Dead",
    deck: "Why do desire, sovereignty and the battlefield converge in some goddesses?",
    path: ["Ishtar", "Freya", "The Morrigan"],
    chapters: [
      "Ishtar combines erotic power, kingship and war in a way modern categories struggle to separate.",
      "Freya offers a striking comparative echo: love, magic and a share of the battle-slain.",
      "The Morrigan makes the comparison more dangerous and more speculative, drawing attention to fate, war and death without claiming direct descent.",
    ],
  },
];

export const RELATION_KIND_OVERRIDES = new Map([
  ["Jupiter|Zeus", "linguistic"],
  ["Dyaus|Zeus", "linguistic"],
  ["Tyr|Zeus", "linguistic"],
  ["Dyaus|Jupiter", "linguistic"],
  ["Apollo|Rudra", "structural"],
  ["Apollo|Lugh", "structural"],
  ["Artemis|Diana", "historical"],
  ["Indra|Thor", "structural"],
  ["Perun|Thor", "structural"],
  ["Taranis|Thor", "structural"],
  ["Enlil|Indra", "structural"],
  ["Indra|Marduk", "comparative"],
  ["Odin|Varuna", "structural"],
  ["Hermes|Mercury", "historical"],
  ["Hermes|Loki", "structural"],
  ["Hermes|Veles", "structural"],
  ["Loki|Veles", "structural"],
  ["Hermes|Manannán", "structural"],
  ["Mithra|Mithras", "historical"],
  ["Mithra|Surya", "linguistic"],
  ["Helios|Surya", "structural"],
  ["Eos|Ushas", "linguistic"],
  ["Apollo|Baldr", "speculative"],
  ["Agni|Brigid", "structural"],
  ["Agni|Svarog", "structural"],
  ["Hephaestus|Vulcan", "historical"],
  ["Brigid|Svarog", "structural"],
  ["Hades|Yama", "structural"],
  ["Veles|Yama", "structural"],
  ["Hades|Veles", "structural"],
  ["Freya|Ishtar", "comparative"],
  ["Ishtar|The Morrigan", "speculative"],
  ["Ahura Mazda|Varuna", "structural"],
  ["Hermes|Thoth", "historical"],
  ["Odin|Thoth", "speculative"],
  ["Ra|Surya", "comparative"],
  ["Apollo|Ra", "comparative"],
  ["Apophis|Indra", "comparative"],
  ["Apophis|Thor", "comparative"],
  ["Loki|Set", "speculative"],
  ["Set|Veles", "speculative"],
  ["Dionysus|Osiris", "historical"],
  ["Baldr|Osiris", "speculative"],
  ["Anubis|Hermes", "historical"],
  ["Anubis|Yama", "comparative"],
  ["Rudra|Sekhmet", "comparative"],
  ["Sekhmet|The Morrigan", "speculative"],
  ["Hathor|Ishtar", "comparative"],
  ["Freya|Hathor", "speculative"],
  ["Apollo|Horus", "comparative"],
  ["Brigid|Isis", "speculative"],
]);

export const RELATION_META = {
  linguistic: {
    label: "Linguistic inheritance",
    short: "name lineage",
    description:
      "A connection grounded primarily in historical linguistics or inherited divine naming.",
  },
  historical: {
    label: "Historical contact / fusion",
    short: "historical link",
    description:
      "A relationship shaped by documented contact, identification, reinterpretation or religious transmission.",
  },
  structural: {
    label: "Structural comparison",
    short: "shared mythic structure",
    description:
      "A strong comparison in role, story pattern or ritual structure without claiming direct historical identity.",
  },
  comparative: {
    label: "Cross-cultural parallel",
    short: "comparative echo",
    description:
      "A useful cross-cultural resemblance that invites comparison but is not evidence of shared origin.",
  },
  speculative: {
    label: "Speculative curiosity",
    short: "loose echo",
    description:
      "An intentionally cautious, curiosity-led comparison with limited evidence.",
  },
  model: {
    label: "Model-only thematic echo",
    short: "trait echo",
    description:
      "A similarity suggested by the site’s manually weighted traits, not by historical evidence.",
  },
};

export const TRADITION_POSITIONS = {
  Greek: { x: 48, y: 46, label: "Aegean" },
  Roman: { x: 41, y: 45, label: "Central Mediterranean" },
  Norse: { x: 39, y: 23, label: "Scandinavia" },
  Celtic: { x: 28, y: 35, label: "Atlantic Europe" },
  Slavic: { x: 55, y: 31, label: "Eastern Europe" },
  Vedic: { x: 74, y: 53, label: "South Asia" },
  Iranian: { x: 65, y: 47, label: "Iranian plateau" },
  Mesopotamian: { x: 59, y: 53, label: "Mesopotamia" },
  Egyptian: { x: 51, y: 61, label: "Nile valley" },
};

export const STARTING_COPY = {
  heading: "Where will you begin?",
  lead: "Choose a figure or recurring pattern. The network begins small; every clue you follow leaves another thread behind.",
};
