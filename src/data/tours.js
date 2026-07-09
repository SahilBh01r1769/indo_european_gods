/* ─────────────────────────────────────────────────────────────────
   data/tours.js — Guided narrative tours
   Each tour pre-loads a curated network and provides narrative text
   ───────────────────────────────────────────────────────────────── */

export const TOURS = [
  {
    id: 'thunder-warrior',
    icon: '⚡',
    name: 'The Thunder Warrior Cluster',
    tagline: 'One myth, five cultures, one origin',
    deities: ['Thor', 'Indra', 'Perun', 'Taranis', 'Zeus', 'Jupiter', 'Marduk', 'Enlil'],
    centerDeity: 'Indra',
    narrative: [
      {
        heading: 'The Oldest Story in the World',
        text: `Across every Indo-European tradition, a heroic thunder god picks up his weapon and defeats a primordial monster — usually a serpent or dragon — to restore order and release life-giving waters. Vedic Indra slays Vritra. Norse Thor battles Jörmungandr at Ragnarok. Slavic Perun defeats Veles. Greek Zeus defeats Typhon. The Celtic Taranis, though less documented, occupies the same structural slot.

Calvert Watkins, in *How to Kill a Dragon* (1995), demonstrated that this myth can be reconstructed to Proto-Indo-European: a formula he wrote as *"Hero Slays Serpent."* It is arguably the oldest recoverable narrative in human history.`,
      },
      {
        heading: 'What Makes Them the Same',
        text: `All these gods share a remarkably specific trait cluster: a storm/thunder domain, a warrior function, and a cosmic combat against a chaos-serpent that threatens the water supply. Thor and Indra both drink enormous quantities of an intoxicating substance before battle (mead / soma). Both wield a spinning or crushing weapon — Mjölnir and Indra's vajra (thunderbolt).

Notice in the graph how tightly this cluster connects across pantheons despite millennia of separation. The cosine similarity between Thor and Indra runs ~0.78 — higher than many gods within the same tradition.`,
      },
      {
        heading: 'Why It Matters',
        text: `This cluster is your best entry point for the PIE religion argument. Unlike some comparisons that rely only on functional analogy, the thunder-warrior myth has linguistic evidence too — the root *perkʷ- (oak, thunder) appears in Lithuanian Perkūnas, Norse Fjörgyn (Thor's mother), and possibly Vedic Parjanya (rain god). The myth, the function, and the etymology converge.`,
      },
    ],
  },

  {
    id: 'archer-healer',
    icon: '🏹',
    name: 'The Archer-Healer Paradox',
    tagline: 'The god who wounds and heals with the same arrow',
    deities: ['Apollo', 'Rudra', 'Shiva', 'Artemis', 'Diana', 'Lugh', 'Mithras'],
    centerDeity: 'Apollo',
    narrative: [
      {
        heading: 'The Far-Shooter Who Heals',
        text: `One of the most intriguing archetypes in PIE religion is the archer-healer paradox: a god who both sends disease (via arrows shot from a distance) and heals it. Apollo is the most familiar example — in the *Iliad*, his arrows bring plague to the Greek camp; in cult, he is Paean, the healer. Vedic Rudra is even more explicit: he shoots disease arrows at cattle and humans, and hymns beg him to lower his bow and reveal his healing aspect.

M.L. West, in *Indo-European Poetry and Myth* (2007), treats this as a genuine PIE archetype: the "Far-Shooter" who controls disease and health simultaneously.`,
      },
      {
        heading: 'The Wilderness Outsider',
        text: `What unites Apollo and Rudra beyond the bow is their liminal status. Both dwell at the margins of civilization — Apollo in wild places and at the threshold of the Pythian oracle; Rudra in the forests and mountains, invoked from a distance rather than at the domestic hearth fire. This outsider quality is part of what makes them dangerous and powerful.

Shiva in the graph shows why: he is Rudra's direct evolution, and maintains all the wilderness-liminal-ecstasy traits while adding the ascetic dimension. The three gods form a clear lineage in the trait space.`,
      },
      {
        heading: 'Lugh: The Celtic Arm of the Archetype',
        text: `Lugh of the Tuatha Dé Danann is the Celtic candidate for this archetype. Like Apollo, he is young, solar, a master of many arts (his epithet Samildánach means "skilled in all arts"), and a supreme warrior. His spear never misses. His solar-craftsman-warrior combination scores high similarity to both Apollo and Rudra in the graph — a cross-Atlantic confirmation that this archetype was robust in PIE religion.`,
      },
    ],
  },

  {
    id: 'liminal-tricksters',
    icon: '🎭',
    name: 'Liminal Tricksters',
    tagline: 'The boundary-crossers who connect worlds',
    deities: ['Hermes', 'Loki', 'Veles', 'Manannán', 'Mercury', 'Cernunnos', 'Dionysus'],
    centerDeity: 'Hermes',
    narrative: [
      {
        heading: 'The Original Boundary-Crosser',
        text: `In every PIE tradition, there is a figure who refuses to stay where he belongs. He moves between the living and the dead, between gods and mortals, between civilization and wilderness. He is a trickster, a messenger, a thief, and a guide. Greek Hermes, Norse Loki, Slavic Veles, and Celtic Manannán all occupy this structural role with remarkable consistency.

What makes this cluster fascinating is that the trickster archetype is not just functional — it is *necessary*. Boundaries need someone to cross them. Every ordered cosmos requires a figure of creative disorder.`,
      },
      {
        heading: 'The Cattle-Stealing Motif',
        text: `Hermes, in his first day of life, steals Apollo's cattle. Veles steals Perun's cattle and retreats to the underworld. This specific motif — the liminal trickster stealing the thunder god's cattle — appears across at least three traditions and was reconstructed to PIE by Ivanov and Toporov (1974). It represents the cosmic tension between the ordered above-world and the chaotic below-world.

Notice in the graph that Hermes, Mercury, and Veles cluster tightly, while Loki sits nearby but with a slightly different center of gravity — more destruction, less pure liminality.`,
      },
      {
        heading: 'Dionysus: The Ecstatic Edge',
        text: `Dionysus belongs to this cluster but from a different angle. His liminality is experiential rather than spatial — he dissolves the boundaries of the self through wine, ritual madness, and ecstatic union. His inclusion here shows how the graph captures something real: the liminal-outsider dimension connects figures who seem superficially different but share a deep structural role in dismantling boundaries.`,
      },
    ],
  },

  {
    id: 'sky-father',
    icon: '☁️',
    name: 'The Sky Father Cluster',
    tagline: '*Dyēus Ph₂tḗr — the most secure PIE reconstruction',
    deities: ['Zeus', 'Jupiter', 'Dyaus', 'Tyr', 'Odin', 'Varuna', 'Ahura Mazda'],
    centerDeity: 'Zeus',
    narrative: [
      {
        heading: 'One God, Many Names',
        text: `The PIE Sky Father *Dyēus ph₂tḗr is the most linguistically secure deity reconstruction in comparative mythology. The name survives intact across branches: Greek *Diós (Zeus), Latin *Iuppiter (Jupiter), Vedic *Dyáuṣ Pitṝ (Dyaus Pitr), and Norse *Tīwaz (Tyr). All derive from PIE *deiw- (to shine) + *ph₂tēr (father).

This is not analogy — these names are cognates. The same word for the same deity, preserved across 4,000 years and thousands of miles of geographic separation.`,
      },
      {
        heading: 'The Demotion Problem',
        text: `Why, then, is the Sky Father not the supreme deity in most attested traditions? Zeus is powerful but not omniscient. Jupiter is important but not omnipotent. Dyaus barely appears in the Rigveda. And Tyr in Norse mythology is a minor figure.

The answer seems to be that in each tradition, the Sky Father was gradually displaced by a more dynamic figure — Indra (storm-warrior), Odin (wisdom-sovereign), Zeus himself (who started as a simple sky god and accumulated new attributes over time). The Sky Father archetype was too static for evolving religious needs.`,
      },
      {
        heading: 'Varuna and Odin: The Sovereign Evolution',
        text: `The most interesting evolution is into the Sovereign Magic-Wielder: Vedic Varuna (omniscient, binding, law-keeper) and Norse Odin (sacrifice, wisdom, binding). Dumézil argued these represent the PIE first-function sovereignty in its most developed form — the king who rules by knowledge and magic rather than by force.

In the graph, Varuna and Odin connect strongly despite being separated by the entire breadth of the Indo-European world. Their shared trait profile — ascetic/wisdom, liminal, death-adjacent — is precisely Dumézil's sovereign archetype.`,
      },
    ],
  },

  {
    id: 'death-underworld',
    icon: '🌑',
    name: 'Death & the Underworld',
    tagline: 'The first to die, the rulers of the dead',
    deities: ['Hades', 'Yama', 'The Morrigan', 'Veles', 'Odin', 'Freya', 'Ishtar', 'Nergal'],
    centerDeity: 'Yama',
    narrative: [
      {
        heading: 'The First of the Dead',
        text: `A recurring PIE motif is the deity who was the *first to die* and therefore becomes the ruler of the dead. Vedic Yama is the first mortal; he discovered the path to the afterlife through his own death and now guides others. Norse myth has echoes of this in several figures. Iranian Yima (cognate of Yama) ruled a paradise before losing it.

West (2007) reconstructs a PIE *Yemos figure — a primordial twin whose sacrifice creates the world and whose death opens the underworld.`,
      },
      {
        heading: 'The War-Death Overlap',
        text: `Many underworld deities are simultaneously war deities — because war is the primary mechanism of death in these cultures. The Morrigan presides over both battle and fate. Odin collects half the battle-slain for Valhalla; Freya takes the other half. Ishtar is both goddess of love-war and has visited the underworld.

This is not coincidence — it reflects the lived reality of Bronze Age and Iron Age societies where death and battle were inseparable.`,
      },
      {
        heading: 'The Wealth of the Dead',
        text: `A fascinating subcurrent: underworld rulers are often also gods of wealth and abundance. Hades's other name Ploutos means "wealth" — because wealth comes from beneath the earth. Veles rules cattle and abundance. This creates an unexpected trait overlap between death-deities and fertility-deities in the graph — something that becomes visible when you look at the connections between Hades, Veles, and Freya.`,
      },
    ],
  },

  {
    id: 'sacred-fire',
    icon: '🔥',
    name: 'Sacred Fire & the Divine Smith',
    tagline: 'The civilizing force that connects worlds',
    deities: ['Agni', 'Brigid', 'Svarog', 'Hephaestus', 'Vulcan', 'Lugh', 'The Dagda'],
    centerDeity: 'Agni',
    narrative: [
      {
        heading: 'Fire as the Original Liminal Force',
        text: `Fire is the ultimate threshold technology — it mediates between raw and cooked, natural and artificial, mortal and divine. In PIE religion, the fire deity is typically also the messenger between worlds. Vedic Agni is the most explicit: he literally carries sacrificial offerings from humans to gods, and gods\' responses back. He is the indispensable intermediary.

The divine smith — Hephaestus, Vulcan, Svarog, the craft aspect of Lugh and Brigid — is the civilizing extension of fire. The smith makes weapons, tools, and ornaments: the artifacts that define civilization.`,
      },
      {
        heading: 'Brigid and Agni: Fire Across the Atlantic',
        text: `The parallel between Celtic Brigid and Vedic Agni is subtle but compelling. Both preside over a sacred eternal flame. Both have a triple nature (Brigid's three sisters who share her name; Agni's three forms as hearth fire, lightning, and the sun). Both are associated with healing, craft, and poetry/inspired speech.

West (2007) notes that the eternal sacred flame — which must never be extinguished — appears in both traditions and may reflect a PIE religious institution.`,
      },
      {
        heading: 'The Wounded Smith',
        text: `The divine smith is frequently an outsider, wounded, or exiled. Hephaestus was thrown from Olympus (twice, in different versions). Vulcan is isolated under his volcano. This "wounded craftsman" motif — the creator who is himself damaged — appears across traditions. It may encode something about the social status of smiths in Bronze Age societies: essential but liminal, powerful but suspect.`,
      },
    ],
  },
];
