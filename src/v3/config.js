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
    id: "daylight-sky",
    title: "One Ancient Name, Four Divine Lives",
    kind: "Inherited ancestry · branching journey",
    deck: "Follow an ancient daylight-sky name as daughter languages reshape both its sound and its god.",
    thesis: "This is branching inheritance, not a claim that one historical god literally became the next.",
    conclusion: "A name can survive while divine function changes radically. Linguistic kinship maps a family tree; it does not make these gods interchangeable.",
    question: "Which matters more for identity: an inherited name, or the roles a culture gives it?",
    path: ["Dyaus", "Zeus", "Jupiter", "Tyr"],
    stops: [
      { era: "2nd millennium BCE", place: "Vedic South Asia", body: "Dyaus Pitṛ preserves the old daylight-sky father with unusual clarity, although he is already less central than Indra.", retained: "The inherited sky-name and paternal frame", changed: "A receding ritual role" },
      { era: "Archaic Greece", place: "Aegean world", body: "Zeus carries the cognate name into Greek, but grows into thunder-wielding sovereign, guardian of order and ruler of Olympus.", retained: "The bright-sky name and fatherly authority", changed: "Kingship and thunder dominate" },
      { era: "Roman Republic and Empire", place: "Central Mediterranean", body: "Latin Iuppiter—Jupiter—joins the inherited sky-father name to Rome’s civic sovereignty, oath and state cult.", retained: "Sky-father language and sovereign function", changed: "A distinctly Roman political cult" },
      { era: "Germanic antiquity", place: "Northern Europe", body: "Týr preserves another relative of the divine-name family, yet his surviving Norse character centres law, courage and the binding of Fenrir.", retained: "A descendant of the old word for god", changed: "The sky role has largely disappeared" },
    ],
  },
  {
    id: "mithra-mithras",
    title: "From Covenant to Mystery Cult",
    kind: "Documented adaptation",
    deck: "Watch Iranian Mithra enter the Roman world—and emerge as the recognisable but profoundly altered Mithras.",
    thesis: "The names are historically connected; the Roman cult was not a simple copy of Iranian worship.",
    conclusion: "Mithras is best understood as a Roman transformation built from connected material, not Iranian religion transplanted unchanged.",
    question: "How much continuity is enough before adaptation becomes a new religious figure?",
    path: ["Mithra", "Mithras"],
    stops: [
      { era: "1st millennium BCE", place: "Iranian world", body: "Mithra guards covenant, truth and social order in Iranian tradition, with strong associations of light and watchfulness.", retained: "Name, light and binding agreements", changed: "The starting ritual world is Iranian" },
      { era: "1st–4th centuries CE", place: "Roman Empire", body: "Mithras appears at the centre of initiatory communities and the tauroctony. Roman imagery transforms inherited material into a new mystery-cult system.", retained: "The adapted name and solar affinities", changed: "Initiation grades, cave temples and bull-slaying iconography" },
    ],
  },
  {
    id: "hermes-thoth",
    title: "When Hermes Met Thoth",
    kind: "Cultural contact and fusion",
    deck: "Enter Hellenistic Egypt, where translation between pantheons produces a durable composite tradition.",
    thesis: "This tour follows interpretatio and syncretism: contact and identification, not common ancestry.",
    conclusion: "Hermes and Thoth became mutually legible through contact, producing a composite authority whose afterlife exceeded either original cult.",
    question: "When cultures translate gods into one another, what is clarified—and what is erased?",
    path: ["Thoth", "Hermes", "Mercury"],
    stops: [
      { era: "Pharaonic Egypt", place: "Nile valley", body: "Thoth is a god of writing, reckoning, ritual knowledge and lunar order—the divine expert who makes knowledge operative.", retained: "Writing, wisdom and mediation", changed: "The tour begins in Egyptian temple religion" },
      { era: "Hellenistic period", place: "Ptolemaic Egypt", body: "Greek speakers identify Thoth with Hermes. Their shared intellectual and mediating roles help form the figure later called Hermes Trismegistus.", retained: "Sacred knowledge and boundary-crossing", changed: "Two traditions are translated into a composite authority" },
      { era: "Roman period", place: "Mediterranean world", body: "Roman Mercury inherits Greek Hermes while Hermetic writings circulate in an Egyptian-Greek intellectual setting.", retained: "Messenger, interpreter and master of exchange", changed: "Roman naming and a widening textual afterlife" },
    ],
  },
  {
    id: "artemis-diana",
    title: "Artemis Becomes Diana?",
    kind: "Roman identification",
    deck: "A guided case study in how Rome adopts, identifies and reshapes a foreign divine figure.",
    thesis: "Diana was not simply renamed Artemis; Roman identification layered Greek stories onto an existing Italic goddess.",
    conclusion: "The pairing created a recognisable Greco-Roman figure while Diana retained places, rites and constituencies that were not Artemis in disguise.",
    question: "Does a shared mythology overwrite local worship, or merely add another interpretive layer?",
    path: ["Artemis", "Diana", "Apollo"],
    stops: [
      { era: "Archaic Greece", place: "Greek world", body: "Artemis governs wild places, young life, the hunt and dangerous transitions, while remaining Apollo’s divine twin.", retained: "Hunt, bow, wilderness and lunar associations", changed: "A specifically Greek family and mythic biography" },
      { era: "Republican Rome", place: "Italy", body: "Diana already has Italic sanctuaries and civic meanings. Identification with Artemis imports Greek imagery without erasing Diana’s local cult.", retained: "Hunt and protection at boundaries", changed: "Latin ritual, places and civic constituencies" },
      { era: "Roman Imperial period", place: "Mediterranean world", body: "Apollo’s presence makes the borrowed sibling pattern visible, while Roman Diana continues to exceed that Greek narrative frame.", retained: "A recognisable divine pair", changed: "Local and imperial meanings coexist" },
    ],
  },
  {
    id: "forge-crossing",
    title: "The Forge Crosses to Rome",
    kind: "Adoption with reinterpretation",
    deck: "Trace the strong identification of Hephaestus and Vulcan, then test where a shared fire motif stops being history.",
    thesis: "The first transition is historical identification; the final comparison is thematic and deliberately marked as such.",
    conclusion: "Hephaestus and Vulcan form an adoption history; Brigid is a valuable comparison precisely because her shared fire does not continue that chain.",
    question: "Can a control case make a historical argument more persuasive than another apparent match?",
    path: ["Hephaestus", "Vulcan", "Brigid"],
    stops: [
      { era: "Archaic Greece", place: "Aegean world", body: "Hephaestus is the master artificer whose forge creates divine armour, automata and objects of dangerous beauty.", retained: "Fire, metalwork and divine craft", changed: "The Greek artisan’s distinctive myths" },
      { era: "Roman Republic and Empire", place: "Italy", body: "Vulcan is identified with Hephaestus, but Roman worship keeps its own concern with destructive and controlled fire.", retained: "The forge and imported Greek narratives", changed: "Roman ritual emphasis on containing fire" },
      { era: "Medieval Irish tradition", place: "Ireland", body: "Brigid shares fire and craft associations, but there is no equivalent adoption chain. She is the control stop that prevents resemblance becoming false descent.", retained: "A productive sacred flame", changed: "Independent tradition, functions and evidence category" },
    ],
  },
  {
    id: "thunderer-serpent",
    title: "The Thunderer Pattern—And Its Limits",
    kind: "Comparative control tour",
    deck: "Travel through a compelling storm-and-serpent pattern while learning why recurrence alone is not an evolution story.",
    thesis: "Similarity can guide comparison, but without linguistic or contact evidence it cannot prove that Thor became Indra or Perun.",
    conclusion: "The thunderer pattern is analytically powerful when treated as a comparison. It becomes misleading when displayed as a single migration story.",
    question: "What further evidence would be needed to turn a recurring pattern into a historical claim?",
    path: ["Indra", "Thor", "Perun", "Zeus"],
    stops: [
      { era: "2nd millennium BCE", place: "Vedic South Asia", body: "Indra kills Vṛtra and releases obstructed waters. The combat is richly attested in early Vedic poetry.", retained: "Storm power and monster combat", changed: "This is the oldest stop, not automatically the source of every later story" },
      { era: "Medieval Norse sources", place: "Scandinavia", body: "Thor confronts Jörmungandr with thunderous force. The resemblance is vivid, yet the surviving narrative has its own cosmology and ending.", retained: "Thunderer against serpent", changed: "Characters, stakes and narrative structure" },
      { era: "Reconstructed Slavic tradition", place: "Eastern Europe", body: "Perun’s opposition to Veles is reconstructed from later evidence and folklore, demanding a different confidence level.", retained: "Storm above versus adversary below", changed: "Evidence survives indirectly" },
      { era: "Archaic Greece", place: "Aegean world", body: "Zeus defeats Typhon and secures divine rule. The tour ends by separating a broad inherited possibility from a demonstrated chain of transformations.", retained: "Storm sovereignty after monster combat", changed: "No simple line of descent joins all four figures" },
    ],
  },
].map((story) => ({ ...story, chapters: story.stops.map((stop) => stop.body) }));

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
  Greek: { x: 37, y: 48, label: "Aegean" },
  Roman: { x: 29, y: 43, label: "Central Mediterranean" },
  Norse: { x: 29, y: 18, label: "Scandinavia" },
  Celtic: { x: 18, y: 29, label: "Atlantic Europe" },
  Slavic: { x: 42, y: 30, label: "Eastern Europe" },
  Vedic: { x: 73, y: 65, label: "South Asia" },
  Iranian: { x: 58, y: 56, label: "Iranian plateau" },
  Mesopotamian: { x: 51, y: 54, label: "Mesopotamia" },
  Egyptian: { x: 42, y: 62, label: "Nile valley" },
};

export const STARTING_COPY = {
  heading: "Where will you begin?",
  lead: "Choose a figure or recurring pattern. The network begins small; every clue you follow leaves another thread behind.",
};
