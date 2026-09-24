/* ================================================================
   Platzhalter-Produktbilder als SVG, bis echte Fotos da sind.
   garmentSVG(type, hex, view)  view: "front" | "detail" | "fabric"
   ================================================================ */

let svgUid = 0;

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// amt > 0 hellt auf, amt < 0 dunkelt ab
function shade(hex, amt) {
  const [r, g, b] = hexToRgb(hex);
  const f = (c) =>
    Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt)
      .toString(16)
      .padStart(2, "0");
  return `#${f(r)}${f(g)}${f(b)}`;
}

function luminance(hex) {
  const [r, g, b] = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

// Langarm-Grundform (Pullover, Hemd, Hoodie, Blazer)
function longSleeve(bottom = 420, cuff = 398) {
  return `M150 95 Q200 128 250 95 L305 112 Q335 125 342 170 L362 ${cuff} L326 ${cuff + 8} L302 225 L300 ${bottom} L100 ${bottom} L98 225 L74 ${cuff + 8} L38 ${cuff} L58 170 Q65 125 95 112 Z`;
}

const GARMENTS = {
  tee: {
    detail: "120 70 160 200",
    draw(c, d, l) {
      const body = `M152 92 Q200 124 248 92 L300 108 Q325 118 340 150 L360 205 L318 222 L300 190 L300 420 L100 420 L100 190 L82 222 L40 205 L60 150 Q75 118 100 108 Z`;
      return {
        body,
        extra: `
          <path d="M152 92 Q200 124 248 92" fill="none" stroke="${d}" stroke-width="9" stroke-linecap="round"/>
          <path d="M160 104 Q200 130 240 104" class="st" stroke="${l}"/>
          <line x1="100" y1="408" x2="300" y2="408" class="st" stroke="${l}"/>
          <line x1="352" y1="196" x2="316" y2="210" class="st" stroke="${l}"/>
          <line x1="48" y1="196" x2="84" y2="210" class="st" stroke="${l}"/>
          <path d="M300 190 L300 420 M100 190 L100 420" fill="none" stroke="${d}" stroke-width="1.5" opacity=".5"/>`,
      };
    },
  },
  hoodie: {
    detail: "130 30 140 200",
    draw(c, d, l) {
      return {
        before: `<path d="M138 108 Q136 38 200 34 Q264 38 262 108 Z" fill="${shade(c, -0.08)}" stroke="${d}" stroke-width="1.5"/>`,
        body: longSleeve(420, 398),
        extra: `
          <path d="M158 100 Q163 56 200 53 Q237 56 242 100 Q200 126 158 100 Z" fill="${shade(c, -0.4)}"/>
          <path d="M187 118 L184 196 M213 118 L216 196" stroke="${l}" stroke-width="3" stroke-linecap="round"/>
          <rect x="180" y="194" width="8" height="12" rx="2" fill="${d}"/>
          <rect x="212" y="194" width="8" height="12" rx="2" fill="${d}"/>
          <path d="M132 305 L268 305 L284 392 L116 392 Z" fill="${shade(c, -0.04)}" stroke="${d}" stroke-width="1.5"/>
          <path d="M140 313 L260 313 L274 384 L126 384 Z" class="st" stroke="${l}"/>
          <rect x="100" y="396" width="200" height="24" fill="${shade(c, -0.1)}"/>
          ${ribs(100, 396, 200, 24, d)}
          <path d="M362 398 L326 406 L324 385 L359 377 Z" fill="${shade(c, -0.1)}"/>
          <path d="M38 398 L74 406 L76 385 L41 377 Z" fill="${shade(c, -0.1)}"/>`,
      };
    },
  },
  knit: {
    detail: "120 70 160 200",
    texture: "knit",
    draw(c, d, l) {
      return {
        body: longSleeve(420, 398),
        extra: `
          <path d="M150 95 Q200 128 250 95" fill="none" stroke="${shade(c, -0.12)}" stroke-width="14" stroke-linecap="round"/>
          ${ribsPath("M150 95 Q200 128 250 95", d)}
          <rect x="100" y="392" width="200" height="28" fill="${shade(c, -0.08)}"/>
          ${ribs(100, 392, 200, 28, d)}
          <path d="M362 398 L326 406 L323 380 L358 372 Z" fill="${shade(c, -0.08)}"/>
          <path d="M38 398 L74 406 L77 380 L42 372 Z" fill="${shade(c, -0.08)}"/>`,
      };
    },
  },
  cable: {
    detail: "130 110 140 180",
    texture: "knit",
    draw(c, d, l) {
      const cable = (x) => {
        let p = `M${x} 150`;
        for (let y = 150; y < 380; y += 30) p += ` q14 15 0 30`;
        let q = `M${x} 150`;
        for (let y = 150; y < 380; y += 30) q += ` q-14 15 0 30`;
        return `<path d="${p}" fill="none" stroke="${d}" stroke-width="5" opacity=".55"/>
                <path d="${q}" fill="none" stroke="${l}" stroke-width="3" opacity=".7"/>`;
      };
      return {
        body: longSleeve(420, 398),
        extra: `
          ${cable(150)}${cable(200)}${cable(250)}
          <path d="M150 95 Q200 128 250 95" fill="none" stroke="${shade(c, -0.12)}" stroke-width="18" stroke-linecap="round"/>
          ${ribsPath("M150 95 Q200 128 250 95", d)}
          <rect x="100" y="388" width="200" height="32" fill="${shade(c, -0.08)}"/>
          ${ribs(100, 388, 200, 32, d)}
          <path d="M362 398 L326 406 L323 378 L358 370 Z" fill="${shade(c, -0.08)}"/>
          <path d="M38 398 L74 406 L77 378 L42 370 Z" fill="${shade(c, -0.08)}"/>`,
      };
    },
  },
  cardigan: {
    detail: "140 90 120 170",
    texture: "knit",
    draw(c, d, l) {
      const buttons = [270, 305, 340, 375]
        .map((y) => `<circle cx="200" cy="${y}" r="5" fill="${shade(c, -0.5)}"/>`)
        .join("");
      return {
        body: longSleeve(420, 398),
        extra: `
          <path d="M152 96 Q200 128 248 96 L200 250 Z" fill="#efebe4"/>
          <path d="M152 96 L200 252 L248 96" fill="none" stroke="${shade(c, -0.1)}" stroke-width="12" stroke-linejoin="round"/>
          <line x1="200" y1="252" x2="200" y2="420" stroke="${shade(c, -0.1)}" stroke-width="12"/>
          <line x1="200" y1="252" x2="200" y2="420" stroke="${d}" stroke-width="1"/>
          ${buttons}
          <rect x="100" y="400" width="200" height="20" fill="${shade(c, -0.08)}"/>
          ${ribs(100, 400, 200, 20, d)}`,
      };
    },
  },
  shirt: {
    detail: "140 70 120 160",
    draw(c, d, l) {
      const buttons = [150, 195, 240, 285, 330, 375]
        .map((y) => `<circle cx="200" cy="${y}" r="3.5" fill="${shade(c, -0.18)}" stroke="${d}" stroke-width=".8"/>`)
        .join("");
      return {
        body: longSleeve(425, 398),
        extra: `
          <path d="M150 95 Q200 80 250 95 L200 112 Z" fill="${shade(c, -0.12)}"/>
          <path d="M150 94 L184 134 L200 112 Z" fill="${shade(c, 0.08)}" stroke="${d}" stroke-width="1.2"/>
          <path d="M250 94 L216 134 L200 112 Z" fill="${shade(c, 0.08)}" stroke="${d}" stroke-width="1.2"/>
          <line x1="193" y1="112" x2="193" y2="425" stroke="${d}" stroke-width="1"/>
          <line x1="207" y1="112" x2="207" y2="425" stroke="${d}" stroke-width="1"/>
          ${buttons}
          <rect x="226" y="165" width="36" height="42" fill="none" stroke="${d}" stroke-width="1.2"/>
          <path d="M362 398 L326 406 L322 372 L357 364 Z" fill="${shade(c, 0.04)}" stroke="${d}" stroke-width="1.2"/>
          <path d="M38 398 L74 406 L78 372 L43 364 Z" fill="${shade(c, 0.04)}" stroke="${d}" stroke-width="1.2"/>
          <line x1="100" y1="414" x2="300" y2="414" class="st" stroke="${l}"/>`,
      };
    },
  },
  coat: {
    detail: "120 70 160 230",
    texture: "wool",
    draw(c, d, l) {
      return {
        body: `M145 90 Q200 115 255 90 L310 108 Q340 122 348 170 L366 440 L328 448 L306 230 L312 470 L88 470 L94 230 L72 448 L34 440 L52 170 Q60 122 90 108 Z`,
        extra: `
          <path d="M146 91 Q200 116 254 91 L200 250 Z" fill="${shade(c, -0.45)}"/>
          <path d="M147 91 L204 252 L176 168 L156 170 L166 146 Z" fill="${shade(c, -0.05)}" stroke="${d}" stroke-width="1.5"/>
          <path d="M253 91 L196 252 L224 168 L244 170 L234 146 Z" fill="${shade(c, -0.05)}" stroke="${d}" stroke-width="1.5"/>
          <path d="M204 252 L218 470" stroke="${d}" stroke-width="1.5"/>
          ${[285, 345].map((y) => `<circle cx="172" cy="${y}" r="6" fill="${shade(c, -0.45)}"/><circle cx="238" cy="${y}" r="6" fill="${shade(c, -0.45)}"/>`).join("")}
          <rect x="108" y="370" width="64" height="12" fill="${shade(c, -0.06)}" stroke="${d}" stroke-width="1.2"/>
          <rect x="236" y="370" width="64" height="12" fill="${shade(c, -0.06)}" stroke="${d}" stroke-width="1.2"/>
          <line x1="90" y1="458" x2="310" y2="458" class="st" stroke="${l}"/>`,
      };
    },
  },
  trench: {
    detail: "120 70 170 230",
    draw(c, d, l) {
      return {
        body: `M145 90 Q200 115 255 90 L310 108 Q340 122 348 170 L366 440 L328 448 L306 230 L316 470 L84 470 L94 230 L72 448 L34 440 L52 170 Q60 122 90 108 Z`,
        extra: `
          <path d="M146 91 Q200 116 254 91 L200 230 Z" fill="${shade(c, -0.45)}"/>
          <path d="M147 91 L204 232 L178 160 L156 162 L166 140 Z" fill="${shade(c, -0.04)}" stroke="${d}" stroke-width="1.5"/>
          <path d="M253 91 L196 232 L222 160 L244 162 L234 140 Z" fill="${shade(c, -0.04)}" stroke="${d}" stroke-width="1.5"/>
          <path d="M222 118 L292 128 L296 196 L226 190 Z" fill="${shade(c, 0.03)}" stroke="${d}" stroke-width="1.2"/>
          <path d="M100 112 L140 104 L142 116 L102 124 Z" fill="${shade(c, -0.06)}" stroke="${d}" stroke-width="1"/>
          <path d="M300 112 L260 104 L258 116 L298 124 Z" fill="${shade(c, -0.06)}" stroke="${d}" stroke-width="1"/>
          <path d="M204 232 L220 470" stroke="${d}" stroke-width="1.5"/>
          ${[255, 300, 345].map((y) => `<circle cx="176" cy="${y}" r="5" fill="${shade(c, -0.45)}"/><circle cx="236" cy="${y}" r="5" fill="${shade(c, -0.45)}"/>`).join("")}
          <path d="M92 268 L308 268 L309 288 L91 288 Z" fill="${shade(c, -0.07)}" stroke="${d}" stroke-width="1.2"/>
          <rect x="188" y="264" width="26" height="28" fill="none" stroke="${shade(c, -0.5)}" stroke-width="3"/>
          <path d="M250 288 L262 330 L252 332 Z" fill="${shade(c, -0.07)}"/>
          <line x1="88" y1="458" x2="312" y2="458" class="st" stroke="${l}"/>`,
      };
    },
  },
  blazer: {
    detail: "130 70 150 220",
    texture: "wool",
    draw(c, d, l) {
      return {
        body: longSleeve(410, 395),
        extra: `
          <path d="M150 96 Q200 124 250 96 L200 280 Z" fill="#ebe7df"/>
          <path d="M150 96 L200 282 L170 170 L150 172 L160 148 Z" fill="${shade(c, -0.05)}" stroke="${d}" stroke-width="1.5"/>
          <path d="M250 96 L200 282 L230 170 L250 172 L240 148 Z" fill="${shade(c, -0.05)}" stroke="${d}" stroke-width="1.5"/>
          <path d="M200 282 L196 410" stroke="${d}" stroke-width="1.5"/>
          <circle cx="202" cy="302" r="5.5" fill="${shade(c, -0.5)}"/>
          <circle cx="202" cy="348" r="5.5" fill="${shade(c, -0.5)}"/>
          <rect x="228" y="190" width="42" height="7" fill="${shade(c, -0.06)}" stroke="${d}" stroke-width="1"/>
          <rect x="112" y="330" width="62" height="12" fill="${shade(c, -0.06)}" stroke="${d}" stroke-width="1.2"/>
          <rect x="226" y="330" width="62" height="12" fill="${shade(c, -0.06)}" stroke="${d}" stroke-width="1.2"/>
          ${[380, 368, 356].map((y, i) => `<circle cx="${346 - i * 2}" cy="${y}" r="2.5" fill="${shade(c, -0.5)}"/>`).join("")}`,
      };
    },
  },
  trousers: {
    detail: "120 40 160 200",
    texture: "wool",
    draw(c, d, l) {
      return {
        body: `M125 55 L275 55 L292 470 L212 470 L200 175 L188 470 L108 470 Z`,
        extra: `
          <rect x="125" y="55" width="150" height="22" fill="${shade(c, -0.08)}" stroke="${d}" stroke-width="1.2"/>
          ${[140, 175, 225, 260].map((x) => `<rect x="${x - 3}" y="52" width="6" height="28" fill="${shade(c, -0.03)}" stroke="${d}" stroke-width=".8"/>`).join("")}
          <circle cx="200" cy="66" r="4" fill="${shade(c, -0.45)}"/>
          <path d="M200 77 L200 150 Q200 168 214 172" class="st" stroke="${l}"/>
          <path d="M132 80 L152 138 M268 80 L248 138" stroke="${d}" stroke-width="1.3"/>
          <path d="M166 78 L162 140 M234 78 L238 140" stroke="${d}" stroke-width="1" opacity=".7"/>
          <path d="M162 140 L150 470 M238 140 L250 470" stroke="${l}" stroke-width="1.5" opacity=".45"/>
          <line x1="110" y1="458" x2="188" y2="458" class="st" stroke="${l}"/>
          <line x1="212" y1="458" x2="290" y2="458" class="st" stroke="${l}"/>`,
      };
    },
  },
  scarf: {
    detail: "130 300 140 170",
    texture: "wool",
    draw(c, d, l) {
      const fringe = (x0, x1, y) => {
        let s = "";
        for (let x = x0 + 4; x < x1; x += 7) s += `<line x1="${x}" y1="${y}" x2="${x + 1}" y2="${y + 34}" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`;
        return s;
      };
      return {
        before: `<path d="M214 70 L292 70 L300 410 L222 410 Z" fill="${shade(c, -0.12)}"/>${fringe(222, 300, 410)}`,
        body: `M110 70 L240 70 L252 430 L122 430 Z`,
        extra: `
          <path d="M110 70 L240 70" stroke="${d}" stroke-width="2"/>
          <path d="M112 70 Q170 100 238 70" fill="${shade(c, -0.14)}" opacity=".6"/>
          ${fringe(122, 252, 430)}
          <line x1="121" y1="420" x2="251" y2="420" class="st" stroke="${l}"/>`,
      };
    },
  },
  bag: {
    detail: "110 80 180 180",
    texture: "leather",
    draw(c, d, l) {
      return {
        before: `<path d="M148 196 Q148 86 200 86 Q252 86 252 196" fill="none" stroke="${c}" stroke-width="16"/>
                 <path d="M148 196 Q148 86 200 86 Q252 86 252 196" fill="none" stroke="${l}" stroke-width="1" stroke-dasharray="4 4" opacity=".7"/>`,
        body: `M108 190 L292 190 L308 440 L92 440 Z`,
        extra: `
          <line x1="108" y1="202" x2="292" y2="202" class="st" stroke="${l}"/>
          <path d="M116 190 L100 440 M284 190 L300 440" class="st" stroke="${l}"/>
          <rect x="190" y="198" width="20" height="10" rx="2" fill="${shade(c, -0.4)}"/>
          <path d="M148 196 L148 214 M252 196 L252 214" stroke="${d}" stroke-width="16" opacity=".4"/>`,
      };
    },
  },
  beanie: {
    detail: "110 130 180 180",
    texture: "knit",
    draw(c, d, l) {
      return {
        body: `M112 320 Q110 140 200 136 Q290 140 288 320 Z`,
        clipped: ribs(112, 136, 176, 184, d, 9),
        extra: `
          <path d="M100 300 L300 300 L306 390 L94 390 Z" fill="${shade(c, -0.08)}" stroke="${d}" stroke-width="1.2"/>
          ${ribs(98, 302, 204, 86, d, 9)}`,
      };
    },
  },
};

function ribs(x, y, w, h, color, gap = 5) {
  let s = "";
  for (let i = x + gap / 2; i < x + w; i += gap)
    s += `<line x1="${i}" y1="${y + 1}" x2="${i}" y2="${y + h - 1}" stroke="${color}" stroke-width="1" opacity=".45"/>`;
  return s;
}

function ribsPath(d, color) {
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="14" stroke-dasharray="1 4" opacity=".45"/>`;
}

function textureDefs(id, kind, c) {
  if (kind === "knit")
    return `<pattern id="tx${id}" width="8" height="10" patternUnits="userSpaceOnUse">
        <path d="M0 0 L4 8 L8 0" fill="none" stroke="${shade(c, -0.18)}" stroke-width="1" opacity=".5"/></pattern>`;
  const freq = kind === "leather" ? "0.9" : "0.55";
  return `<filter id="tx${id}f" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="2" seed="${id}"/>
      <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .35 0"/></filter>`;
}

function garmentSVG(type, hex, view = "front") {
  const g = GARMENTS[type];
  const id = ++svgUid;
  const light = luminance(hex) > 0.72;
  const bg = light ? "#dcd8cf" : "#ebe8e2";
  const d = shade(hex, light ? -0.28 : -0.35);
  const l = light ? shade(hex, -0.18) : shade(hex, 0.3);
  const parts = g.draw(hex, d, l);
  const texKind = g.texture || "wool";

  if (view === "fabric") {
    const tex =
      texKind === "knit"
        ? `<rect width="400" height="500" fill="url(#tx${id})"/>`
        : `<rect width="400" height="500" filter="url(#tx${id}f)"/>`;
    return `<svg viewBox="0 0 400 500" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <defs>${textureDefs(id, texKind, hex)}
        <linearGradient id="sh${id}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#fff" stop-opacity=".14"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient></defs>
      <rect width="400" height="500" fill="${hex}"/>${tex}
      <rect width="400" height="500" fill="url(#sh${id})"/>
      <path d="M0 330 C120 300 260 360 400 320" fill="none" stroke="${d}" stroke-width="1.5"/>
      <path d="M0 342 C120 312 260 372 400 332" class="st" stroke="${l}"/>
    </svg>`;
  }

  const vb = view === "detail" ? g.detail : "0 0 400 500";
  const tex =
    texKind === "knit"
      ? `<path d="${parts.body}" fill="url(#tx${id})"/>`
      : `<g clip-path="url(#cl${id})"><rect width="400" height="500" filter="url(#tx${id}f)" opacity=".5"/></g>`;
  return `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
    <defs>${textureDefs(id, texKind, hex)}
      <clipPath id="cl${id}"><path d="${parts.body}"/></clipPath>
      <linearGradient id="sh${id}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#fff" stop-opacity=".12"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".2"/></linearGradient>
      <radialGradient id="fl${id}"><stop offset="0" stop-color="#000" stop-opacity=".16"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    </defs>
    <rect x="-200" y="-200" width="800" height="900" fill="${bg}"/>
    <ellipse cx="200" cy="482" rx="150" ry="14" fill="url(#fl${id})"/>
    <g class="garment">
      ${parts.before || ""}
      <path d="${parts.body}" fill="${hex}" stroke="${d}" stroke-width="1.5"/>
      ${tex}
      <g clip-path="url(#cl${id})">${parts.clipped || ""}</g>
      ${parts.extra}
      <path d="${parts.body}" fill="url(#sh${id})"/>
    </g>
  </svg>`;
}
