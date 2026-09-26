/* ================================================================
   Shop-Daten: Marke, Einstellungen, Kategorien, Produkte.
   Hier wird alles gepflegt, was sich inhaltlich ändert.
   ================================================================ */

// Name der Passage (des Shops). Platzhalter, nur hier ändern.
const SHOP = {
  brand: "ATELIER",
  claim: "Die Passage der Marken",
  freeShippingFrom: 250,
  shipping: {
    standard: { label: "Standardversand", time: "2–4 Werktage", price: 15 },
    express: { label: "Expressversand", time: "1–2 Werktage", price: 25 },
  },
  // Rabattcodes: Code -> Anteil
  promoCodes: { WILLKOMMEN10: 0.1 },
  maxQty: 5,
  returnDays: 30,
  email: "service@beispiel.de",
};

const CATEGORIES = [
  { id: "oberbekleidung", name: "Oberbekleidung" },
  { id: "strick", name: "Strick" },
  { id: "hemden-shirts", name: "Hemden & Shirts" },
  { id: "hosen", name: "Hosen" },
  { id: "accessoires", name: "Accessoires" },
];

const COLORS = {
  schwarz: { name: "Schwarz", hex: "#1c1c1c" },
  ecru: { name: "Ecru", hex: "#e8e0d0" },
  weiss: { name: "Weiß", hex: "#f4f2ed" },
  kamel: { name: "Kamel", hex: "#b0895c" },
  beige: { name: "Beige", hex: "#c9b797" },
  anthrazit: { name: "Anthrazit", hex: "#3d3e42" },
  marine: { name: "Marine", hex: "#1f2a3b" },
  salbei: { name: "Salbei", hex: "#8f9a87" },
  grau: { name: "Grau Melange", hex: "#9c9c9a" },
  schoko: { name: "Schokolade", hex: "#4a3629" },
  eisblau: { name: "Eisblau", hex: "#c7d4de" },
};

const SIZES = ["XS", "S", "M", "L", "XL"];
const ONE_SIZE = ["Einheitsgröße"];

// Vorlagen für Platzhalter-Produkte. Echte Produkte kommen später pro Marke.
const PRODUCT_TEMPLATES = [
  {
    id: "wollmantel",
    name: "Doppelreihiger Wollmantel",
    category: "oberbekleidung",
    type: "coat",
    price: 1290,
    colors: ["kamel", "schwarz", "anthrazit"],
    sizes: SIZES,
    soldOut: ["XS"],
    isNew: true,
    added: "2026-09-01",
    description:
      "Ein Mantel, der Jahrzehnte hält. Doppelreihig geschnitten, mit breitem Revers und tief angesetzten Taschen. Die dichte Wolle hält warm, ohne schwer zu wirken.",
    material: "90 % Schurwolle, 10 % Kaschmir. Futter: 100 % Cupro.",
    care: "Nur chemische Reinigung. Auf einem breiten Bügel lagern.",
    fit: "Gerade, leicht übergroße Passform. Das Model ist 1,86 m groß und trägt Größe M.",
    origin: "Gefertigt in Italien.",
  },
  {
    id: "trenchcoat",
    name: "Trenchcoat aus Baumwollgabardine",
    category: "oberbekleidung",
    type: "trench",
    price: 1150,
    colors: ["beige", "schwarz"],
    sizes: SIZES,
    soldOut: [],
    isNew: false,
    added: "2026-06-12",
    description:
      "Der klassische Trenchcoat, reduziert auf das Wesentliche. Mit Gürtel, Schulterklappen und verdeckter Knopfleiste. Die dichte Gabardine hält leichten Regen ab.",
    material: "100 % Baumwolle (Gabardine), wasserabweisend ausgerüstet.",
    care: "Chemische Reinigung. Nicht im Trockner trocknen.",
    fit: "Normale Passform, knielang.",
    origin: "Gefertigt in Portugal.",
  },
  {
    id: "blazer",
    name: "Blazer aus Schurwolle",
    category: "oberbekleidung",
    type: "blazer",
    price: 890,
    colors: ["schwarz", "marine"],
    sizes: SIZES,
    soldOut: ["XL"],
    isNew: false,
    added: "2026-05-20",
    description:
      "Einreihiger Blazer mit weicher Schulter und halbem Futter. Passt zum Anzug genauso wie zu Jeans und T-Shirt.",
    material: "100 % Schurwolle. Futter: 100 % Viskose.",
    care: "Nur chemische Reinigung.",
    fit: "Taillierte Passform. Bei Zweifel eine Größe größer wählen.",
    origin: "Gefertigt in Italien.",
  },
  {
    id: "hoodie",
    name: "Hoodie aus schwerem Jersey",
    category: "oberbekleidung",
    type: "hoodie",
    price: 320,
    colors: ["grau", "schwarz", "ecru"],
    sizes: SIZES,
    soldOut: [],
    isNew: true,
    added: "2026-09-10",
    description:
      "Aus 480-g-Jersey, innen angeraut. Die doppellagige Kapuze behält ihre Form, die Nähte sind flach verarbeitet.",
    material: "100 % Bio-Baumwolle, 480 g/m².",
    care: "Bei 30 °C auf links waschen. Nicht im Trockner trocknen.",
    fit: "Lockere Passform mit überschnittenen Schultern.",
    origin: "Gefertigt in Portugal.",
  },
  {
    id: "kaschmir-pullover",
    name: "Rundhalspullover aus Kaschmir",
    category: "strick",
    type: "knit",
    price: 590,
    colors: ["ecru", "kamel", "eisblau"],
    sizes: SIZES,
    soldOut: ["S"],
    isNew: true,
    added: "2026-09-05",
    description:
      "Aus mongolischem Kaschmir, in Schottland gestrickt. Feine Rippbündchen an Hals, Ärmeln und Saum.",
    material: "100 % Kaschmir, 2-fädig.",
    care: "Handwäsche kalt oder chemische Reinigung. Liegend trocknen.",
    fit: "Normale Passform.",
    origin: "Gefertigt in Schottland.",
  },
  {
    id: "cardigan",
    name: "Cardigan aus Merinowolle",
    category: "strick",
    type: "cardigan",
    price: 450,
    colors: ["anthrazit", "salbei"],
    sizes: SIZES,
    soldOut: [],
    isNew: false,
    added: "2026-04-02",
    description:
      "Leichter Cardigan mit V-Ausschnitt und Hornknöpfen. Die extrafeine Merinowolle lässt sich das ganze Jahr tragen.",
    material: "100 % extrafeine Merinowolle. Knöpfe aus Horn.",
    care: "Wollwaschgang 30 °C. Liegend trocknen.",
    fit: "Normale Passform, hüftlang.",
    origin: "Gefertigt in Italien.",
  },
  {
    id: "zopfstrick",
    name: "Zopfstrickpullover",
    category: "strick",
    type: "cable",
    price: 520,
    colors: ["ecru", "marine"],
    sizes: SIZES,
    soldOut: ["XS", "XL"],
    isNew: false,
    added: "2026-03-15",
    description:
      "Dicker Zopfstrick nach einem Fischermuster, mit breitem Rippkragen. Warm genug für den tiefsten Winter.",
    material: "70 % Schurwolle, 30 % Kaschmir.",
    care: "Handwäsche kalt. Liegend trocknen.",
    fit: "Lockere Passform.",
    origin: "Gefertigt in Irland.",
  },
  {
    id: "popelinehemd",
    name: "Hemd aus Baumwollpopeline",
    category: "hemden-shirts",
    type: "shirt",
    price: 260,
    colors: ["weiss", "eisblau"],
    sizes: SIZES,
    soldOut: [],
    isNew: false,
    added: "2026-02-10",
    description:
      "Das Hemd für jeden Tag. Aus feiner, zweifach gezwirnter Popeline mit Perlmuttknöpfen und Kentkragen.",
    material: "100 % Baumwolle, zweifach gezwirnt. Knöpfe aus Perlmutt.",
    care: "Bei 40 °C waschen. Feucht bügeln.",
    fit: "Normale Passform.",
    origin: "Gefertigt in Italien.",
  },
  {
    id: "leinenhemd",
    name: "Leinenhemd",
    category: "hemden-shirts",
    type: "shirt",
    price: 280,
    colors: ["ecru", "salbei"],
    sizes: SIZES,
    soldOut: [],
    isNew: false,
    added: "2026-05-01",
    description:
      "Luftiges Hemd aus schwerem irischem Leinen, stückgefärbt. Wird mit jeder Wäsche weicher.",
    material: "100 % Leinen.",
    care: "Bei 30 °C waschen. Leicht feucht aufhängen.",
    fit: "Lockere Passform.",
    origin: "Gefertigt in Portugal.",
  },
  {
    id: "tshirt",
    name: "T-Shirt aus Supima-Baumwolle",
    category: "hemden-shirts",
    type: "tee",
    price: 120,
    colors: ["weiss", "schwarz", "grau"],
    sizes: SIZES,
    soldOut: [],
    isNew: false,
    added: "2026-01-20",
    description:
      "Ein T-Shirt ohne Kompromisse. Die langstapelige Supima-Baumwolle ist glatt, fest und behält ihre Form.",
    material: "100 % Supima-Baumwolle, 220 g/m².",
    care: "Bei 30 °C auf links waschen.",
    fit: "Normale Passform.",
    origin: "Gefertigt in Portugal.",
  },
  {
    id: "oversized-tshirt",
    name: "Oversized T-Shirt",
    category: "hemden-shirts",
    type: "tee",
    price: 140,
    colors: ["schoko", "ecru"],
    sizes: SIZES,
    soldOut: ["M"],
    isNew: true,
    added: "2026-09-12",
    description:
      "Schwerer Jersey, weit geschnitten, mit breitem Rippkragen. Fällt locker, ohne formlos zu wirken.",
    material: "100 % Bio-Baumwolle, 280 g/m².",
    care: "Bei 30 °C auf links waschen.",
    fit: "Weite Passform. Für eine normale Passform eine Größe kleiner wählen.",
    origin: "Gefertigt in Portugal.",
  },
  {
    id: "bundfaltenhose",
    name: "Bundfaltenhose aus Wolle",
    category: "hosen",
    type: "trousers",
    price: 420,
    colors: ["anthrazit", "kamel"],
    sizes: SIZES,
    soldOut: [],
    isNew: false,
    added: "2026-04-18",
    description:
      "Hohe Taille, zwei Bundfalten, gerades Bein. Aus einem weichen Flanell, der auch im Sitzen gut fällt.",
    material: "100 % Schurwolle (Flanell).",
    care: "Nur chemische Reinigung.",
    fit: "Hohe Taille, gerades, weites Bein.",
    origin: "Gefertigt in Italien.",
  },
  {
    id: "leinenhose",
    name: "Weite Hose aus Leinen",
    category: "hosen",
    type: "trousers",
    price: 360,
    colors: ["ecru", "schwarz"],
    sizes: SIZES,
    soldOut: ["L"],
    isNew: true,
    added: "2026-08-28",
    description:
      "Weite Hose mit Kordelzug und Bundfalten. Leicht, luftig und trotzdem elegant.",
    material: "100 % Leinen.",
    care: "Bei 30 °C waschen.",
    fit: "Weite Passform mit elastischem Bund.",
    origin: "Gefertigt in Portugal.",
  },
  {
    id: "kaschmirschal",
    name: "Schal aus Kaschmir",
    category: "accessoires",
    type: "scarf",
    price: 340,
    colors: ["kamel", "grau", "schwarz"],
    sizes: ONE_SIZE,
    soldOut: [],
    isNew: false,
    added: "2026-02-28",
    description:
      "Großer, weicher Schal mit handgeknüpften Fransen. 200 × 70 cm.",
    material: "100 % Kaschmir.",
    care: "Handwäsche kalt oder chemische Reinigung.",
    fit: "200 × 70 cm.",
    origin: "Gefertigt in Schottland.",
  },
  {
    id: "tote-bag",
    name: "Tote Bag aus Leder",
    category: "accessoires",
    type: "bag",
    price: 980,
    colors: ["schwarz", "schoko"],
    sizes: ONE_SIZE,
    soldOut: [],
    isNew: true,
    added: "2026-09-08",
    description:
      "Aus einem Stück vollnarbigem Kalbsleder, von Hand genäht. Mit Innentasche und Magnetverschluss.",
    material: "100 % Kalbsleder, pflanzlich gegerbt.",
    care: "Mit einem weichen, trockenen Tuch reinigen. Vor Nässe schützen.",
    fit: "38 × 32 × 14 cm.",
    origin: "Gefertigt in Italien.",
  },
  {
    id: "muetze",
    name: "Rippstrickmütze aus Kaschmir",
    category: "accessoires",
    type: "beanie",
    price: 180,
    colors: ["ecru", "schwarz", "kamel"],
    sizes: ONE_SIZE,
    soldOut: [],
    isNew: false,
    added: "2026-01-05",
    description: "Dichter Rippstrick mit breitem Umschlag.",
    material: "100 % Kaschmir.",
    care: "Handwäsche kalt. Liegend trocknen.",
    fit: "Einheitsgröße, dehnbar.",
    origin: "Gefertigt in Schottland.",
  },
];


/* ================================================================
   Marken (Läden in der Passage) — Platzhalter
   Jede Marke bekommt ihre typischen Farben und eine eigene Fassade.
   material: panel | stone | metal | brick | plaster | concrete | marble
   window:   rect | arch
   font:     serif | sans | mono
   ================================================================ */
const BRANDS = [
  { id: "b01", name: "Brand 01", wall: "#1f2a44", trim: "#c9a86a", signBg: "#f3ecdc", signFg: "#1f2a44", interior: "#f3ecdc", ink: "#1f2a44", material: "panel", window: "rect", font: "serif", awning: ["#1f2a44", "#f3ecdc"], favorites: ["marine", "ecru", "weiss"], price: 1.0 },
  { id: "b02", name: "Brand 02", wall: "#1e3a2f", trim: "#b8955a", signBg: "#1e3a2f", signFg: "#d9bf86", interior: "#eee9dd", ink: "#1e3a2f", material: "panel", window: "arch", font: "serif", awning: null, favorites: ["salbei", "kamel", "ecru"], price: 1.1 },
  { id: "b03", name: "Brand 03", wall: "#121212", trim: "#f4f2ed", signBg: "#121212", signFg: "#f4f2ed", interior: "#f4f2ed", ink: "#121212", material: "metal", window: "rect", font: "sans", awning: null, favorites: ["schwarz", "weiss", "anthrazit"], price: 1.25 },
  { id: "b04", name: "Brand 04", wall: "#e8dcc6", trim: "#4a2e1f", signBg: "#4a2e1f", signFg: "#e8792f", interior: "#f2e8d8", ink: "#4a2e1f", material: "stone", window: "rect", font: "serif", awning: ["#e8792f", "#e8792f"], favorites: ["kamel", "schoko", "beige"], price: 1.4 },
  { id: "b05", name: "Brand 05", wall: "#5a1a24", trim: "#d8c3a5", signBg: "#d8c3a5", signFg: "#5a1a24", interior: "#f1e9e1", ink: "#5a1a24", material: "panel", window: "arch", font: "serif", awning: null, favorites: ["schoko", "ecru", "schwarz"], price: 1.15 },
  { id: "b06", name: "Brand 06", wall: "#d6c5a4", trim: "#8a6a45", signBg: "#8a6a45", signFg: "#f5eee0", interior: "#f5eee0", ink: "#5f4a31", material: "stone", window: "rect", font: "sans", awning: null, favorites: ["kamel", "beige", "ecru"], price: 1.2 },
  { id: "b07", name: "Brand 07", wall: "#cfdde6", trim: "#ffffff", signBg: "#ffffff", signFg: "#3b5566", interior: "#eef3f6", ink: "#3b5566", material: "plaster", window: "arch", font: "mono", awning: ["#3b5566", "#ffffff"], favorites: ["eisblau", "weiss", "grau"], price: 0.9 },
  { id: "b08", name: "Brand 08", wall: "#4a4b4e", trim: "#b87333", signBg: "#2b2b2d", signFg: "#d08a4a", interior: "#e9e7e3", ink: "#2b2b2d", material: "concrete", window: "rect", font: "mono", awning: null, favorites: ["anthrazit", "grau", "schwarz"], price: 0.95 },
  { id: "b09", name: "Brand 09", wall: "#8c3b2a", trim: "#1c1c1c", signBg: "#1c1c1c", signFg: "#f4f2ed", interior: "#f3eee8", ink: "#1c1c1c", material: "brick", window: "rect", font: "sans", awning: ["#1c1c1c", "#1c1c1c"], favorites: ["schwarz", "beige", "marine"], price: 0.85 },
  { id: "b10", name: "Brand 10", wall: "#eeeae3", trim: "#6f7d68", signBg: "#6f7d68", signFg: "#ffffff", interior: "#f4f3ef", ink: "#4d5848", material: "marble", window: "arch", font: "serif", awning: null, favorites: ["salbei", "ecru", "weiss"], price: 1.05 },
];

// Abteilungen im Laden: jede Etage eine Abteilung
const DEPARTMENTS = [
  { id: "damen", name: "Damen", floor: "EG", floorName: "Erdgeschoss" },
  { id: "herren", name: "Herren", floor: "1", floorName: "1. Obergeschoss" },
  { id: "unisex", name: "Unisex", floor: "2", floorName: "2. Obergeschoss" },
];

/* Platzhalter-Katalog: pro Marke je 5 Teile Damen, 5 Teile Herren,
   3 Teile Unisex, erzeugt aus den Vorlagen. Wird ersetzt, sobald
   echte Produkte da sind. */
const PRODUCTS = (() => {
  const apparel = ["wollmantel", "trenchcoat", "blazer", "kaschmir-pullover", "cardigan", "zopfstrick", "popelinehemd", "leinenhemd", "tshirt", "bundfaltenhose", "leinenhose"];
  const unisex = ["hoodie", "oversized-tshirt", "kaschmirschal", "tote-bag", "muetze", "tshirt"];
  const tpl = (id) => PRODUCT_TEMPLATES.find((t) => t.id === id);
  const out = [];
  BRANDS.forEach((b, bi) => {
    const make = (t, gender, k) => {
      const colors = [...new Set([...b.favorites.filter((c) => (k + bi) % 2 === 0 || c !== b.favorites[2]), ...t.colors])].slice(0, 3);
      out.push({
        ...t,
        id: `${b.id}-${gender}-${t.id}`,
        brand: b.id,
        gender,
        price: Math.round((t.price * b.price) / 10) * 10,
        colors,
        isNew: (bi + k) % 4 === 0,
        added: `2026-0${1 + ((bi + k) % 9)}-1${k % 10}`,
      });
    };
    for (let k = 0; k < 5; k++) make(tpl(apparel[(bi + k * 2) % apparel.length]), "damen", k);
    for (let k = 0; k < 5; k++) make(tpl(apparel[(bi + 1 + k * 2) % apparel.length]), "herren", k + 5);
    for (let k = 0; k < 3; k++) make(tpl(unisex[(bi + k * 2) % unisex.length]), "unisex", k + 10);
  });
  return out;
})();
