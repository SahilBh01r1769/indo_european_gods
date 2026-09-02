import { DEITIES } from "../data/deities.js";
import { TRADITION_POSITIONS } from "./config.js";

// Editorial marks are shorthand for attested attributes, not claims that each
// tradition used a single official logo. Dossiers always name the attribute
// and its provenance; native-script initials are the fallback.
const MARKS = {
  Apollo: ["☀", "lyre and solar light"], Artemis: ["☾", "crescent moon"], Zeus: ["ϟ", "thunderbolt"],
  Ares: ["⚔", "spear and shield"], Hermes: ["☿", "caduceus"], Hephaestus: ["⚒", "hammer and anvil"],
  Dionysus: ["❦", "grapevine"], Athena: ["⚉", "owl"], Poseidon: ["Ψ", "trident"], Hades: ["♜", "underworld sceptre"],
  Helios: ["☼", "solar crown"], Eos: ["✺", "dawn rays"], Hera: ["♕", "royal diadem"],
  Rudra: ["➶", "bow and arrow"], Indra: ["◆", "vajra"], Agni: ["♨", "sacred fire"], Varuna: ["≋", "cosmic waters"],
  Surya: ["◉", "solar disk"], Vishnu: ["◎", "chakra"], Shiva: ["⋔", "trident"], Yama: ["⌁", "noose"],
  Dyaus: ["△", "daylight sky"], Ushas: ["✧", "dawn light"],
  Thor: ["ᚦ", "hammer and thunder rune"], Odin: ["ᚨ", "raven and spear"], Loki: ["⌇", "binding and change"],
  Freyr: ["❈", "fertility and sunlight"], Freya: ["✤", "Brísingamen necklace"], Tyr: ["ᛏ", "Tiwaz rune"],
  Baldr: ["✦", "radiance"], Heimdall: ["◖", "Gjallarhorn"],
  Lugh: ["✣", "spear"], "The Dagda": ["♣", "club and cauldron"], Cernunnos: ["♈", "antlers"],
  "The Morrigan": ["⌃", "raven"], Brigid: ["✜", "cross and flame"], Manannán: ["≈", "sea"],
  Nuada: ["✋", "silver hand"], Taranis: ["⊕", "wheel and thunder"],
  Mars: ["♂", "spear and shield"], Jupiter: ["♃", "thunderbolt and eagle"], Mercury: ["☿", "caduceus"],
  Vulcan: ["⚒", "forge hammer"], Diana: ["☽", "crescent moon"], Neptune: ["♆", "trident"], Mithras: ["✶", "radiate crown"],
  Perun: ["⚡", "thunderbolt"], Veles: ["♉", "cattle and horned power"], Svarog: ["✥", "heavenly fire and forge"],
  Mokosh: ["⌘", "spindle and earth"], Enlil: ["𒀭", "divine determinative"], Marduk: ["♜", "spade"],
  Nergal: ["☄", "mace and destructive sun"], Ishtar: ["✴", "eight-pointed star"],
  "Ahura Mazda": ["☼", "radiant wisdom"], Mithra: ["✹", "covenant and sunlight"], Ahriman: ["◒", "destructive spirit"],
  Ra: ["☉", "solar disk"], Osiris: ["☥", "crook, flail and renewed life"], Isis: ["⌂", "throne hieroglyph"],
  Horus: ["𓂀", "Eye of Horus"], Set: ["⇡", "Set animal standard"], Anubis: ["♢", "jackal"],
  Thoth: ["☾", "ibis and lunar disk"], Sekhmet: ["♌", "lioness"], Hathor: ["♮", "cow horns and solar disk"],
  Apophis: ["〰", "serpent"],
};

const ALIASES = {
  Zeus: ["Dias"], Jupiter: ["Iuppiter", "Jove"], Dyaus: ["Dyaus Pitar", "Dyauṣ Pitṛ"],
  Indra: ["Śakra", "Sakra"], Agni: ["Agni Deva"], Shiva: ["Śiva", "Siva", "Mahadeva"],
  Yama: ["Yamaraja", "Yama Raja"], Odin: ["Óðinn", "Wotan", "Woden"], Thor: ["Þórr", "Donar"],
  Freya: ["Freyja"], Tyr: ["Týr", "Tiw"], Lugh: ["Lug"], Manannán: ["Manannan", "Manannán mac Lir"],
  "The Morrigan": ["Morrígan", "Morrigan"], Perun: ["Piorun"], Veles: ["Volos"],
  Ishtar: ["Inanna"], "Ahura Mazda": ["Ohrmazd", "Ormazd"], Ahriman: ["Angra Mainyu"],
  Ra: ["Re"], Osiris: ["Wesir", "Usir"], Isis: ["Aset"], Horus: ["Heru"], Set: ["Seth", "Sutekh"],
  Anubis: ["Anpu", "Inpu"], Thoth: ["Djehuty"], Apophis: ["Apep"],
};

const PERIODS = {
  Greek: "Archaic and Classical Greek religion", Vedic: "Vedic religion and its later reception",
  Norse: "Germanic and Old Norse religion", Celtic: "Iron Age and medieval Celtic traditions",
  Roman: "Roman Republican and Imperial religion", Slavic: "Pre-Christian Slavic religion",
  Mesopotamian: "Ancient Mesopotamian religion", Iranian: "Ancient Iranian and Zoroastrian traditions",
  Egyptian: "Ancient Egyptian religion",
};

// Readable approximations foreground the historical-language form where one
// is securely recoverable. They are guides, not claims of a single timeless
// pronunciation: place, period and scholarly convention can all differ.
const PRONUNCIATIONS = {
  Apollo: "a-POL-lōn", Artemis: "AR-teh-mis", Zeus: "zdyoos", Ares: "AH-rēs",
  Hermes: "HEHR-mēs", Hephaestus: "hē-FAIS-tos", Dionysus: "dee-O-noo-sos",
  Athena: "a-thē-NAH", Poseidon: "po-say-DAWN", Hades: "HAH-dēs",
  Helios: "HĒ-lee-os", Eos: "eh-ŌS", Hera: "HĒ-rah", Rudra: "ROOD-rah",
  Indra: "IN-drah", Agni: "UG-nee", Varuna: "VAH-roo-nah", Surya: "SOOR-yah",
  Vishnu: "VISH-noo", Shiva: "SHEE-vah", Yama: "YUH-mah", Dyaus: "dyows",
  Ushas: "OO-shas", Thor: "thohr (Old Norse: THOHRR)",
  Odin: "OH-thin (Old Norse: OH-thin-n)", Loki: "LOH-kee", Freyr: "frayr",
  Freya: "FRAY-yah", Tyr: "teer", Baldr: "BAL-dr", Heimdall: "HAYM-dal",
  Lugh: "loo", "The Dagda": "DAG-dah", Cernunnos: "ker-NOON-nos",
  "The Morrigan": "mor-REE-gan", Brigid: "BRIH-jid", Manannán: "man-an-AWN",
  Nuada: "NOO-ah-dah", Taranis: "TAH-ra-nis", Mars: "mahrrs",
  Jupiter: "YOO-pih-ter (Latin: yoo-PIH-ter)", Mercury: "MER-koo-ree",
  Vulcan: "WOOL-kahn", Diana: "dee-AH-nah", Neptune: "nep-TOO-noos",
  Mithras: "MITH-rahs", Perun: "peh-ROON", Veles: "VEH-les",
  Svarog: "SVAH-rog", Mokosh: "MOH-kosh", Enlil: "EN-leel",
  Marduk: "MAR-dook", Nergal: "NEHR-gal", Ishtar: "ISH-tar",
  "Ahura Mazda": "ah-HOO-rah MAZ-dah", Mithra: "MEE-thrah",
  Ahriman: "AH-ree-man", Ra: "rah (Egyptological reading)",
  Osiris: "oh-SIGH-ris (Egyptian: Wesir)", Isis: "EYE-sis (Egyptian: Aset)",
  Horus: "HOHR-us (Egyptian: Heru)", Set: "set (Egyptian: Sutekh)",
  Anubis: "ah-NOO-bis (Egyptian: Inpu)", Thoth: "thohth (Egyptian: Djehuty)",
  Sekhmet: "SEKH-met", Hathor: "HATH-or", Apophis: "ah-POH-fis (Egyptian: Apep)",
};

function fold(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

export function deityProfile(deityOrId) {
  const deity = typeof deityOrId === "string" ? DEITIES.find((item) => item.id === deityOrId) : deityOrId;
  if (!deity) return null;
  const [mark, attribute] = MARKS[deity.id] || [[...(deity.originalScript || deity.id)][0], "native-name monogram"];
  const region = TRADITION_POSITIONS[deity.pantheon];
  const aliases = [...new Set([deity.id, deity.originalScript, ...(ALIASES[deity.id] || [])].filter(Boolean))];
  const hook = `${deity.epithet || deity.domains?.slice(0, 2).join(" and ") || deity.pantheon}`
    .replace(/,.*$/, "").replace(/\.$/, "");
  return {
    mark, markLabel: attribute,
    markProvenance: MARKS[deity.id] ? "associated historical attribute" : "native-name fallback",
    aliases, normalizedAliases: aliases.map(fold), region: region?.label || deity.pantheon,
    coordinates: region ? { x: region.x, y: region.y } : { x: 50, y: 50 },
    period: PERIODS[deity.pantheon] || "Historical period varies", memoryHook: hook,
    pronunciation: PRONUNCIATIONS[deity.id] || deity.id,
    pronunciationNote: "Approximate scholarly guide; pronunciation varies by period and reconstruction.",
  };
}

export function matchesDeityGuess(deityOrId, guess) {
  const profile = deityProfile(deityOrId), foldedGuess = fold(guess);
  if (!profile || foldedGuess.length < 2) return false;
  return profile.normalizedAliases.some((alias) => {
    if (alias === foldedGuess) return true;
    if (Math.abs(alias.length - foldedGuess.length) > 1) return false;
    let edits = 0, i = 0, j = 0;
    while (i < alias.length && j < foldedGuess.length) {
      if (alias[i] === foldedGuess[j]) { i += 1; j += 1; continue; }
      if (++edits > 1) return false;
      if (alias.length > foldedGuess.length) i += 1;
      else if (foldedGuess.length > alias.length) j += 1;
      else { i += 1; j += 1; }
    }
    return edits + alias.length - i + foldedGuess.length - j <= 1;
  });
}

export function clueHints(clue) {
  const target = DEITIES.find((item) => item.id === clue?.target), profile = deityProfile(target);
  if (!target || !profile) return [];
  return [
    `This is a ${clue.relation.short}.`,
    `Look toward the ${profile.region} — the ${target.pantheon} tradition.`,
    `Its domain includes ${target.domains?.slice(0, 2).join(" and ") || "a related divine role"}.`,
    `An associated attribute is ${profile.markLabel}.`,
    `The name begins with “${[...target.id][0]}” and has ${[...target.id].length} letters.`,
  ];
}

export function validateProfiles() {
  return DEITIES.flatMap((deity) => {
    const profile = deityProfile(deity), errors = [];
    if (!profile.mark) errors.push(`${deity.id}: missing mark`);
    if (!profile.aliases.length) errors.push(`${deity.id}: missing aliases`);
    if (!profile.region) errors.push(`${deity.id}: missing region`);
    if (!profile.pronunciation) errors.push(`${deity.id}: missing pronunciation`);
    return errors;
  });
}
