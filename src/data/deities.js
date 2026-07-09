/* ─────────────────────────────────────────────────────────────────
   data/deities.js — Complete deity dataset
   16 trait dimensions, 55 deities, 8 pantheons
   ───────────────────────────────────────────────────────────────── */

export const TRAITS = [
  'archer',
  'healer',
  'disease sender',
  'storm god',
  'wilderness',
  'liminal outsider',
  'ecstasy / madness',
  'ascetic / wisdom',
  'solar',
  'war / victory',
  'trickster',
  'smith / craft',
  'sea / water',
  'death / underworld',
  'fertility',
  'fire',
];

// Era encoding (rough attestation period)
// 5 = ~2000–1500 BCE  (Rigvedic, early Bronze Age)
// 4 = ~1500–800  BCE  (Late Bronze Age, early Iron Age)
// 3 = ~800–200   BCE  (Classical Greek, Celtic Iron Age)
// 2 = ~200 BCE–500 CE (Roman Imperial, Hellenistic)
// 1 = ~500–1200  CE   (Norse, Slavic, medieval sources)
export const ERAS = [
  { id: 5, label: '~2000–1500 BCE', short: '2000 BCE' },
  { id: 4, label: '~1500–800 BCE',  short: '1500 BCE' },
  { id: 3, label: '~800–200 BCE',   short: '800 BCE'  },
  { id: 2, label: '~200 BCE–500 CE',short: '200 BCE'  },
  { id: 1, label: '~500–1200 CE',   short: '500 CE'   },
];

export const PANTHEON_COLORS = {
  Greek:         '#4a9eff',
  Vedic:         '#e85555',
  Norse:         '#9b8fe8',
  Celtic:        '#2ec27e',
  Roman:         '#f5a623',
  Slavic:        '#f06830',
  Mesopotamian:  '#e87bb4',
  Iranian:       '#20c5c5',
};

export const DEITIES = [
  // ── GREEK ──────────────────────────────────────────────────────
  {
    id: 'Apollo', pantheon: 'Greek', era: 3,
    epithet: 'Far-Shooter, God of Light',
    desc: 'God of sun, music, poetry, prophecy, and medicine. Famous archer and bringer of plague. One of the most widely worshipped Olympians, associated with reason and order.',
    traits: {
      archer: .95, healer: .9, 'disease sender': .85, solar: .85,
      'liminal outsider': .7, 'ascetic / wisdom': .5,
      wilderness: .4, 'ecstasy / madness': .4,
    },
  },
  {
    id: 'Artemis', pantheon: 'Greek', era: 3,
    epithet: 'Mistress of Animals, Lady of the Hunt',
    desc: 'Twin of Apollo. Goddess of the hunt, wild animals, wilderness, and the moon. Guardian of young women. Demanded absolute chastity of her followers.',
    traits: {
      archer: .95, wilderness: .95, healer: .4,
      'disease sender': .6, 'liminal outsider': .7, solar: .3,
    },
  },
  {
    id: 'Zeus', pantheon: 'Greek', era: 3,
    epithet: 'Father of Gods and Men, Cloud-Gatherer',
    desc: 'King of Olympus, ruler of sky and thunder. Upholder of cosmic order (themis). Cognate with Latin Jupiter and Vedic Dyaus Pitr.',
    traits: {
      'storm god': .9, 'war / victory': .7,
      solar: .4, 'ascetic / wisdom': .5, fertility: .4,
    },
  },
  {
    id: 'Ares', pantheon: 'Greek', era: 3,
    epithet: 'God of War, Slaughter',
    desc: 'Personification of violent, chaotic warfare. Contrasted with Athena\'s strategic warfare. One of the least popular Olympian gods in Greek culture.',
    traits: {
      'war / victory': .95, 'ecstasy / madness': .6,
      wilderness: .4, 'disease sender': .3,
    },
  },
  {
    id: 'Hermes', pantheon: 'Greek', era: 3,
    epithet: 'Messenger of the Gods, Guide of Souls',
    desc: 'Trickster, psychopomp, patron of travelers, thieves, and merchants. The great boundary-crosser — moves freely between mortal and divine worlds, and between life and death.',
    traits: {
      trickster: .9, 'liminal outsider': .95, 'ascetic / wisdom': .5,
      'smith / craft': .4, 'death / underworld': .6, healer: .3,
    },
  },
  {
    id: 'Hephaestus', pantheon: 'Greek', era: 3,
    epithet: 'Divine Smith, Lord of Fire',
    desc: 'Lame god of forge, fire, and craftsmanship. Outsider among Olympians — thrown from Olympus at birth. Created automata and divine weapons for the gods.',
    traits: {
      'smith / craft': .95, fire: .7,
      'ecstasy / madness': .3, 'liminal outsider': .4,
    },
  },
  {
    id: 'Dionysus', pantheon: 'Greek', era: 3,
    epithet: 'Twice-Born, God of Ecstasy',
    desc: 'God of wine, theatre, and ecstatic religious ritual. Died and was reborn — a fundamentally liminal deity who dissolves boundaries between civilization and wilderness.',
    traits: {
      'ecstasy / madness': .95, wilderness: .75,
      'liminal outsider': .8, fertility: .7, 'disease sender': .3,
    },
  },
  {
    id: 'Athena', pantheon: 'Greek', era: 3,
    epithet: 'Grey-Eyed Goddess, Defender of Cities',
    desc: 'Goddess of strategic warfare, wisdom, weaving, and craft. Born fully armored from the head of Zeus. Patron of Athens and protector of heroes.',
    traits: {
      'ascetic / wisdom': .9, 'war / victory': .8,
      'smith / craft': .5, solar: .3,
    },
  },
  {
    id: 'Poseidon', pantheon: 'Greek', era: 3,
    epithet: 'Earth-Shaker, Tamer of Horses',
    desc: 'God of the sea, earthquakes, and horses. Brother of Zeus. Pre-Olympian in origin — possibly a sky or earth deity before his domain was reassigned.',
    traits: {
      'sea / water': .95, 'storm god': .7,
      'war / victory': .5, fertility: .3,
    },
  },
  {
    id: 'Hades', pantheon: 'Greek', era: 3,
    epithet: 'Rich One, Receiver of Many',
    desc: 'Ruler of the underworld and keeper of the dead. Not a death god per se — he rules the dead but does not cause death. Rarely left his realm.',
    traits: {
      'death / underworld': .95, 'liminal outsider': .7,
      'ascetic / wisdom': .4, fertility: .3,
    },
  },
  {
    id: 'Helios', pantheon: 'Greek', era: 3,
    epithet: 'The All-Seeing, Driver of the Sun Chariot',
    desc: 'Titan personification of the sun who drives his golden chariot across the sky. His all-seeing nature made him a witness to divine oaths.',
    traits: { solar: .95, healer: .4, 'ascetic / wisdom': .4, 'death / underworld': .3 },
  },
  {
    id: 'Eos', pantheon: 'Greek', era: 3,
    epithet: 'Rosy-Fingered Dawn',
    desc: 'Goddess of dawn, sister of Helios and Selene. Cognate with Vedic Ushas and Roman Aurora — one of the clearest PIE solar goddess continuities.',
    traits: { solar: .7, fertility: .6, 'liminal outsider': .6 },
  },
  {
    id: 'Hera', pantheon: 'Greek', era: 3,
    epithet: 'Queen of Olympus, Goddess of Marriage',
    desc: 'Queen of the gods and goddess of marriage and childbirth. Her constant jealousy of Zeus\'s affairs drives many mythological cycles.',
    traits: { fertility: .8, 'war / victory': .4, 'ascetic / wisdom': .4, 'storm god': .3 },
  },

  // ── VEDIC ──────────────────────────────────────────────────────
  {
    id: 'Rudra', pantheon: 'Vedic', era: 5,
    epithet: 'The Howler, Lord of Beasts, Archer of Archers',
    desc: 'Fierce storm deity, supreme archer, and paradoxical healer. Dwells on the margins of civilization in forests and mountains. Proto-Shiva — the most direct ancestor of Shaivism.',
    traits: {
      archer: .9, 'disease sender': .9, healer: .85,
      wilderness: .9, 'ecstasy / madness': .7,
      'liminal outsider': .8, 'storm god': .6, 'ascetic / wisdom': .7,
    },
  },
  {
    id: 'Indra', pantheon: 'Vedic', era: 5,
    epithet: 'King of the Gods, Vritra-Slayer',
    desc: 'Warrior king of the Vedic pantheon. Slays the cosmic serpent Vritra to release the primordial waters. Drinks soma to enhance his power. Most hymns in the Rigveda are addressed to him.',
    traits: {
      'storm god': .95, 'war / victory': .9,
      solar: .5, fire: .4, fertility: .5, 'ecstasy / madness': .5,
    },
  },
  {
    id: 'Agni', pantheon: 'Vedic', era: 5,
    epithet: 'Lord of Fire, Messenger Between Worlds',
    desc: 'Personification of sacred sacrificial fire. The indispensable messenger between mortals and gods — every ritual required his presence. Second most hymned deity in the Rigveda.',
    traits: {
      fire: .95, 'smith / craft': .5,
      'ascetic / wisdom': .6, 'liminal outsider': .7, healer: .4,
    },
  },
  {
    id: 'Varuna', pantheon: 'Vedic', era: 5,
    epithet: 'Lord of Cosmic Order, All-Seeing Sovereign',
    desc: 'Guardian of Ṛta (cosmic law) and omniscient sovereign who punishes oath-breakers with his snares. Later became god of the sea. His parallel with Odin (both are sovereign magic-wielders who bind) is one of the most compelling PIE continuities.',
    traits: {
      'sea / water': .8, 'ascetic / wisdom': .85,
      'death / underworld': .6, 'liminal outsider': .7, fertility: .3,
    },
  },
  {
    id: 'Surya', pantheon: 'Vedic', era: 5,
    epithet: 'Eye of the World, All-Seeing Sun',
    desc: 'Solar deity who drives a golden chariot drawn by seven horses. Source of all light, life, and warmth. Cognate with Greek Helios and Roman Sol.',
    traits: { solar: .95, healer: .6, 'ascetic / wisdom': .5, 'war / victory': .4 },
  },
  {
    id: 'Vishnu', pantheon: 'Vedic', era: 4,
    epithet: 'The Preserver, Lord of the Universe',
    desc: 'Cosmic preserver who descends as avatars (incarnations) to restore dharmic order when the universe is threatened. Evolves from a minor solar deity in the Rigveda to one of the supreme deities of Hinduism.',
    traits: {
      'ascetic / wisdom': .9, healer: .7,
      solar: .6, fertility: .6, 'death / underworld': .4, 'liminal outsider': .5,
    },
  },
  {
    id: 'Shiva', pantheon: 'Vedic', era: 4,
    epithet: 'The Auspicious One, Lord of Yoga, Destroyer',
    desc: 'Destroyer-creator and lord of all paradoxes. Ascetic yogi and ecstatic dancer; city dweller and forest wanderer; loving husband and terrible destroyer. Direct evolution of Rigvedic Rudra.',
    traits: {
      wilderness: .9, 'ecstasy / madness': .9, 'ascetic / wisdom': .9,
      'death / underworld': .7, fertility: .7, 'liminal outsider': .8, archer: .6,
    },
  },
  {
    id: 'Yama', pantheon: 'Vedic', era: 5,
    epithet: 'First of the Dead, King of the Ancestors',
    desc: 'Lord of the dead and judge of souls. The first mortal to die, who discovered the path to the afterlife. Cognate with Norse Ymir and Iranian Yima — a striking PIE death-god cluster.',
    traits: {
      'death / underworld': .95, 'liminal outsider': .7,
      'ascetic / wisdom': .5, 'war / victory': .3,
    },
  },
  {
    id: 'Dyaus', pantheon: 'Vedic', era: 5,
    epithet: 'Sky Father, Shining Heaven',
    desc: 'Ancient Vedic sky-father whose name is etymologically identical to Greek Zeus (*Dyḗus) and Latin Juppiter (*Dyḗus ph₂tḗr = "Sky Father"). Faded early in the Vedic tradition, replaced by Indra and Varuna.',
    traits: { 'storm god': .8, solar: .7, fertility: .5, 'ascetic / wisdom': .4 },
  },
  {
    id: 'Ushas', pantheon: 'Vedic', era: 5,
    epithet: 'Daughter of the Sky, Lady of the Dawn',
    desc: 'Vedic goddess of dawn. Etymologically and functionally cognate with Greek Eos, Roman Aurora, and Lithuanian Aušrinė — one of the most secure PIE continuities.',
    traits: { solar: .85, fertility: .7, 'liminal outsider': .65, healer: .3 },
  },

  // ── NORSE ──────────────────────────────────────────────────────
  {
    id: 'Thor', pantheon: 'Norse', era: 1,
    epithet: 'Thunderer, Protector of Mankind',
    desc: 'God of thunder, storms, and strength. Defender of Asgard and humanity against the giants, wielding Mjölnir. Most popular god in the Viking Age. Cognate with Vedic Indra and Slavic Perun.',
    traits: {
      'storm god': .95, 'war / victory': .9,
      'smith / craft': .3, fire: .3, wilderness: .4, fertility: .5,
    },
  },
  {
    id: 'Odin', pantheon: 'Norse', era: 1,
    epithet: 'Allfather, God of the Gallows, Wanderer',
    desc: 'Chief of the Aesir. Sacrificed his eye at Mimir\'s well for wisdom, and hung for nine days on Yggdrasil to learn the runes. God of war, death, poetry, and magic. His parallel with Vedic Varuna is one of the most discussed in comparative mythology.',
    traits: {
      'ascetic / wisdom': .95, 'war / victory': .8,
      'death / underworld': .7, trickster: .6,
      'liminal outsider': .8, 'ecstasy / madness': .7, solar: .2,
    },
  },
  {
    id: 'Loki', pantheon: 'Norse', era: 1,
    epithet: 'Shape-Shifter, Sly One, Trickster',
    desc: 'Shape-shifting trickster who causes both mischief and solutions. Agent of chaos whose deceptions grow darker until he engineers Ragnarok. Parallels with Hermes, Mercury, and Slavic Veles are widely noted.',
    traits: {
      trickster: .95, 'liminal outsider': .9,
      'smith / craft': .5, fire: .5, 'ecstasy / madness': .6, 'death / underworld': .4,
    },
  },
  {
    id: 'Freyr', pantheon: 'Norse', era: 1,
    epithet: 'Lord of the Vanir, God of Plenty',
    desc: 'God of fertility, sunshine, and fair weather. One of the Vanir gods who joined the Aesir after a divine war. Associated with peace, prosperity, and good harvests.',
    traits: {
      fertility: .95, 'sea / water': .4,
      solar: .6, 'ecstasy / madness': .4, wilderness: .5,
    },
  },
  {
    id: 'Freya', pantheon: 'Norse', era: 1,
    epithet: 'Lady of the Vanir, Mistress of Magic',
    desc: 'Goddess of love, fertility, war, and seiðr magic. Taught Odin the art of seiðr. First to choose among the battle-slain. Shows striking parallels with Mesopotamian Ishtar — war-love goddess who descends to the underworld.',
    traits: {
      fertility: .9, 'ecstasy / madness': .7,
      'war / victory': .6, 'death / underworld': .5, wilderness: .5,
    },
  },
  {
    id: 'Tyr', pantheon: 'Norse', era: 1,
    epithet: 'One-Handed God of Justice',
    desc: 'Ancient sky-father figure whose name (from *Tīwaz) is cognate with Zeus and Dyaus. Demoted to god of law and single combat. Sacrificed his hand to bind the Fenris wolf.',
    traits: {
      'war / victory': .9, 'ascetic / wisdom': .6, 'liminal outsider': .5,
    },
  },
  {
    id: 'Baldr', pantheon: 'Norse', era: 1,
    epithet: 'Shining God, Most Beloved',
    desc: 'Beautiful, beloved god associated with light and purity. His death at the hands of Loki triggers the sequence leading to Ragnarok. His name means "lord" or "bright one."',
    traits: {
      solar: .85, healer: .6,
      'death / underworld': .6, 'ascetic / wisdom': .5,
    },
  },
  {
    id: 'Heimdall', pantheon: 'Norse', era: 1,
    epithet: 'Watchman of the Gods, Father of Mankind',
    desc: 'Guardian of the Bifrost bridge between worlds. Requires less sleep than a bird and can hear grass grow. The ultimate liminal guardian — his domain is the threshold between realms.',
    traits: {
      'liminal outsider': .95, solar: .6,
      'ascetic / wisdom': .5, 'war / victory': .4,
    },
  },

  // ── CELTIC ─────────────────────────────────────────────────────
  {
    id: 'Lugh', pantheon: 'Celtic', era: 3,
    epithet: 'Samildánach, Master of All Arts',
    desc: 'Solar warrior and master of every craft and skill. Leads the Tuatha Dé Danann against the Fomorians. His name and solar-warrior role parallel Apollo and Vedic Rudra strongly — another compelling PIE archer-craftsman archetype.',
    traits: {
      'smith / craft': .9, solar: .9, 'war / victory': .85,
      archer: .7, trickster: .4, 'ascetic / wisdom': .5,
    },
  },
  {
    id: 'The Dagda', pantheon: 'Celtic', era: 3,
    epithet: 'Good God, Father of All, Lord of Knowledge',
    desc: 'Chief of the Tuatha Dé Danann. Controls weather, crops, time, and life and death with his magic club. Possesses an inexhaustible cauldron. Combines kingly and priestly functions.',
    traits: {
      fertility: .9, 'smith / craft': .6, 'ascetic / wisdom': .6,
      'ecstasy / madness': .5, healer: .5, wilderness: .4,
    },
  },
  {
    id: 'Cernunnos', pantheon: 'Celtic', era: 3,
    epithet: 'Horned God of the Wild, Lord of Animals',
    desc: 'Antlered deity of wilderness, animals, fertility, and the underworld. Mediates between the human and animal worlds. His posture and iconography suggest connection to Vedic Pashupati (Shiva as Lord of Beasts).',
    traits: {
      wilderness: .95, fertility: .8, 'ecstasy / madness': .7,
      'liminal outsider': .8, 'death / underworld': .5,
    },
  },
  {
    id: 'The Morrigan', pantheon: 'Celtic', era: 3,
    epithet: 'Phantom Queen, Goddess of Fate',
    desc: 'Triple goddess of war, fate, and death. Appears as a crow or raven on the battlefield. Her triple nature and role as a battle-fate deity parallels Norse Freya and Valkyries, and possibly Iranian Anahita.',
    traits: {
      'war / victory': .9, 'death / underworld': .85,
      'ecstasy / madness': .7, 'liminal outsider': .7, trickster: .5,
    },
  },
  {
    id: 'Brigid', pantheon: 'Celtic', era: 3,
    epithet: 'Exalted One, Lady of the Flame',
    desc: 'Goddess of healing, smithcraft, poetry, and the sacred flame. Triple goddess — three sisters sharing one name. Her sacred flame at Kildare burned continuously. Christianized as Saint Brigid of Ireland.',
    traits: {
      healer: .9, 'smith / craft': .8, fire: .8,
      fertility: .6, 'ascetic / wisdom': .5,
    },
  },
  {
    id: 'Manannán', pantheon: 'Celtic', era: 3,
    epithet: 'Son of the Sea, Ruler of the Otherworld',
    desc: 'Sea god and ruler of Tír na nÓg (the Land of the Young). Ferries souls to the Otherworld and guards the isle of the dead. Shape-shifter and trickster. Parallel with Hermes as liminal psychopomp.',
    traits: {
      'sea / water': .95, 'liminal outsider': .9,
      trickster: .6, 'death / underworld': .6, fertility: .3,
    },
  },
  {
    id: 'Nuada', pantheon: 'Celtic', era: 3,
    epithet: 'Silver-Handed King, First of the Tuatha',
    desc: 'First king of the Tuatha Dé Danann. Deposed after losing his hand in battle, restored when given a silver prosthesis. His name cognates with Norse Nudd and possibly Roman Nodons.',
    traits: {
      'war / victory': .9, healer: .6,
      'smith / craft': .5, solar: .4,
    },
  },
  {
    id: 'Taranis', pantheon: 'Celtic', era: 3,
    epithet: 'The Thunderer, Wheel-Bearer',
    desc: 'Gaulish god of thunder associated with the wheel symbol. Named in ancient sources alongside Esus and Teutates. Name means "thunder" — directly cognate with Thor/Þórr and possibly Vedic Indra in function.',
    traits: {
      'storm god': .9, 'war / victory': .7, fire: .5, wilderness: .4,
    },
  },

  // ── ROMAN ──────────────────────────────────────────────────────
  {
    id: 'Mars', pantheon: 'Roman', era: 2,
    epithet: 'Father of Rome, Guardian of the State',
    desc: 'Roman god of war and agriculture. Father of Romulus, founder of Rome. Importantly more civic and agricultural than his Greek counterpart Ares — a protector of crops as much as of soldiers.',
    traits: {
      'war / victory': .95, wilderness: .6,
      fertility: .6, solar: .3, 'disease sender': .3,
    },
  },
  {
    id: 'Jupiter', pantheon: 'Roman', era: 2,
    epithet: 'Best and Greatest, Guardian of Rome',
    desc: 'King of the Roman gods. His name derives from *Dyḗus ph₂tḗr — literally "Sky Father" — making him the direct linguistic cognate of Greek Zeus and Vedic Dyaus. Guardian of law, the state, and cosmic order.',
    traits: {
      'storm god': .85, 'war / victory': .7,
      'ascetic / wisdom': .6, solar: .5, fertility: .4,
    },
  },
  {
    id: 'Mercury', pantheon: 'Roman', era: 2,
    epithet: 'Messenger God, Patron of Commerce',
    desc: 'Roman counterpart of Hermes. God of trade, messages, and the dead. His name derives from merx (merchandise), though his functions closely mirror Greek Hermes.',
    traits: {
      trickster: .85, 'liminal outsider': .9,
      'ascetic / wisdom': .5, 'death / underworld': .5, healer: .3,
    },
  },
  {
    id: 'Vulcan', pantheon: 'Roman', era: 2,
    epithet: 'Divine Craftsman, Lord of the Forge',
    desc: 'Roman god of fire and the forge. His workshop is said to lie under volcanoes. Less of an outsider than Greek Hephaestus, but shares the divine smith archetype common across PIE traditions.',
    traits: {
      'smith / craft': .95, fire: .8,
      'liminal outsider': .5, 'ecstasy / madness': .3,
    },
  },
  {
    id: 'Diana', pantheon: 'Roman', era: 2,
    epithet: 'Lady of the Hunt, Goddess of the Moon',
    desc: 'Goddess of the hunt, moon, and crossroads. Latin counterpart of Greek Artemis. Her crossroads association makes her a liminal deity — Diana Trivia (of the three ways).',
    traits: {
      archer: .9, wilderness: .9,
      'liminal outsider': .7, 'disease sender': .5, healer: .4,
    },
  },
  {
    id: 'Neptune', pantheon: 'Roman', era: 2,
    epithet: 'God of the Sea, Tamer of Horses',
    desc: 'Roman god of the sea and earthquakes. Latin counterpart of Poseidon. Originally a freshwater deity who expanded to become ruler of all waters.',
    traits: {
      'sea / water': .9, 'storm god': .65,
      'war / victory': .4, fertility: .3,
    },
  },
  {
    id: 'Mithras', pantheon: 'Roman', era: 2,
    epithet: 'Unconquered Sun, Bull-Slayer',
    desc: 'Mystery cult deity of Roman soldiers, derived from Iranian Mithra. The tauroctony (bull-slaying) is his central image. Solar savior figure popular in the 1st–4th centuries CE, contemporary with early Christianity.',
    traits: {
      solar: .9, 'war / victory': .8,
      'liminal outsider': .7, archer: .6, 'ascetic / wisdom': .6,
    },
  },

  // ── SLAVIC ─────────────────────────────────────────────────────
  {
    id: 'Perun', pantheon: 'Slavic', era: 2,
    epithet: 'Lord of Thunder, Ruler of the Sky',
    desc: 'Supreme Slavic thunder god who eternally battles Veles (chaos and underworld). This Perun-Veles cosmic dualism mirrors the Indo-European thunder-god-vs-serpent myth (Indra-Vritra, Thor-Jörmungandr). His name may cognate with Baltic Perkūnas and Vedic Parjanya.',
    traits: {
      'storm god': .9, 'war / victory': .85,
      'smith / craft': .4, fire: .4, wilderness: .3,
    },
  },
  {
    id: 'Veles', pantheon: 'Slavic', era: 2,
    epithet: 'Serpent God, Lord of the Underworld',
    desc: 'God of the underworld, cattle, magic, wealth, and the dead. Shape-shifting trickster and eternal opponent of Perun. Parallels Hermes, Mercury, and Manannán as liminal trickster-psychopomp.',
    traits: {
      'death / underworld': .9, trickster: .8, 'sea / water': .6,
      'liminal outsider': .7, fertility: .5, 'ecstasy / madness': .4,
    },
  },
  {
    id: 'Svarog', pantheon: 'Slavic', era: 2,
    epithet: 'God of the Forge, Lord of Celestial Fire',
    desc: 'Slavic god of celestial fire and smithcraft. Father of Svarožyc (fire deity) and Dazbog (sun deity). His name derives from *svar (bright sky), cognate with Vedic svarga (heaven).',
    traits: {
      fire: .9, 'smith / craft': .85,
      solar: .6, 'ascetic / wisdom': .4,
    },
  },
  {
    id: 'Mokosh', pantheon: 'Slavic', era: 2,
    epithet: 'Moist Earth Mother, Goddess of Fate',
    desc: 'Only female deity in the Kievan Rus pantheon. Goddess of fate, weaving, spinning, and the moist earth. Associated with the harvest and women\'s crafts. Parallels with Freya and various earth-mother archetypes.',
    traits: {
      fertility: .9, 'sea / water': .5,
      healer: .6, 'ascetic / wisdom': .4, wilderness: .3,
    },
  },

  // ── MESOPOTAMIAN ────────────────────────────────────────────────
  {
    id: 'Enlil', pantheon: 'Mesopotamian', era: 5,
    epithet: 'Lord Wind, King of Heaven and Earth',
    desc: 'Sumerian god of wind, air, and storms. Supreme king of the gods before Marduk. Separated heaven from earth and sent the Great Flood. His storm-king role and cosmic serpent battles parallel Vedic Indra closely.',
    traits: {
      'storm god': .9, 'war / victory': .7,
      'ascetic / wisdom': .6, fertility: .5,
    },
  },
  {
    id: 'Marduk', pantheon: 'Mesopotamian', era: 4,
    epithet: 'Son of the Deep, King of the Gods',
    desc: 'Chief god of Babylon. Slays the primordial chaos-monster Tiamat and creates the world from her body — the Babylonian version of the cosmic combat myth found throughout PIE traditions.',
    traits: {
      'war / victory': .9, solar: .7,
      'storm god': .6, 'ascetic / wisdom': .6, 'smith / craft': .4,
    },
  },
  {
    id: 'Nergal', pantheon: 'Mesopotamian', era: 4,
    epithet: 'Lord of the Great City, God of Plague',
    desc: 'God of death, war, and plague. Ruler of the underworld alongside Ereshkigal. Associated with the midday sun at its most deadly — the heat that kills rather than nurtures.',
    traits: {
      'death / underworld': .9, 'war / victory': .8,
      'disease sender': .85, fire: .5, 'liminal outsider': .6,
    },
  },
  {
    id: 'Ishtar', pantheon: 'Mesopotamian', era: 4,
    epithet: 'Queen of Heaven, Goddess of Love and War',
    desc: 'Goddess of love, war, fertility, and political power. Descended to the underworld and returned — one of the oldest dying-and-rising deity narratives. Her parallels with Norse Freya (war-love goddess who visits underworld) are striking.',
    traits: {
      fertility: .9, 'war / victory': .85,
      'liminal outsider': .8, 'ecstasy / madness': .6, 'death / underworld': .5,
    },
  },

  // ── IRANIAN ─────────────────────────────────────────────────────
  {
    id: 'Ahura Mazda', pantheon: 'Iranian', era: 4,
    epithet: 'Wise Lord, Supreme Creator',
    desc: 'Supreme deity of Zoroastrianism. Embodiment of truth (Asha) and cosmic order. His eternal struggle against Angra Mainyu/Ahriman is one of the first explicit theological dualisms — possibly influencing later Abrahamic traditions.',
    traits: {
      'ascetic / wisdom': .95, solar: .8,
      healer: .5, fire: .5, 'war / victory': .4,
    },
  },
  {
    id: 'Mithra', pantheon: 'Iranian', era: 4,
    epithet: 'God of the Covenant, Keeper of Truth',
    desc: 'Iranian god of contracts, light, and justice. Cosmic warrior who slays the bull to release life-giving blood. The direct ancestor of Roman Mithras. His name (*Mitrá) is cognate with Vedic Mitra.',
    traits: {
      solar: .9, 'war / victory': .8,
      'ascetic / wisdom': .7, 'liminal outsider': .6, archer: .5,
    },
  },
  {
    id: 'Ahriman', pantheon: 'Iranian', era: 4,
    epithet: 'Destructive Spirit, Principle of Evil',
    desc: 'Zoroastrian principle of evil and destruction. Eternal adversary of Ahura Mazda. One of the earliest theological embodiments of evil as a cosmic force rather than a personality.',
    traits: {
      'death / underworld': .85, 'ecstasy / madness': .7,
      'disease sender': .8, 'liminal outsider': .6, trickster: .5,
    },
  },
];
