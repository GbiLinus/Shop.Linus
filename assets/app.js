/* ================================================================
   Shop-Logik: Layout, Warenkorb, Merkliste, Suche, Seiten.
   Kein Framework, keine Abhängigkeiten. Daten: assets/data.js
   ================================================================ */
(() => {
  "use strict";

  /* ---------- Helfer ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const euroFmt = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });
  const euro = (n) => euroFmt.format(n);
  const params = new URLSearchParams(location.search);
  const page = document.body.dataset.page || "";
  const byId = (id) => PRODUCTS.find((p) => p.id === id);
  const catName = (id) => (CATEGORIES.find((c) => c.id === id) || {}).name || "";
  const colorOf = (key) => COLORS[key] || { name: key, hex: "#999" };
  const productUrl = (p, color) => `produkt.html?id=${encodeURIComponent(p.id)}${color ? `&farbe=${color}` : ""}`;
  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

  const store = {
    get(k, fb) {
      try {
        const v = localStorage.getItem(k);
        return v ? JSON.parse(v) : fb;
      } catch {
        return fb;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem(k, JSON.stringify(v));
      } catch {
        /* privater Modus: dann eben nur für diese Seite */
      }
    },
  };

  const ICON = {
    search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg>`,
    heart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M12 20s-7.5-4.6-7.5-10.1A4.2 4.2 0 0 1 12 7.4a4.2 4.2 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20Z"/></svg>`,
    bag: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M5 8h14l-1 13H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>`,
    close: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M5 5l14 14M19 5 5 19"/></svg>`,
    menu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3 8h18M3 16h18"/></svg>`,
  };

  /* ---------- Warenkorb ---------- */
  const keyOf = (i) => `${i.id}|${i.color}|${i.size}`;
  const Cart = {
    items() {
      return store.get("cart", []).filter((i) => byId(i.id));
    },
    save(items) {
      store.set("cart", items);
      refreshCounts();
    },
    add(id, color, size) {
      const items = this.items();
      const found = items.find((i) => keyOf(i) === `${id}|${color}|${size}`);
      if (found) {
        if (found.qty >= SHOP.maxQty) return false;
        found.qty++;
      } else items.push({ id, color, size, qty: 1 });
      this.save(items);
      return true;
    },
    setQty(key, qty) {
      let items = this.items();
      items.forEach((i) => keyOf(i) === key && (i.qty = Math.max(1, Math.min(SHOP.maxQty, qty))));
      this.save(items);
    },
    remove(key) {
      this.save(this.items().filter((i) => keyOf(i) !== key));
    },
    clear() {
      this.save([]);
      store.set("cartMeta", {});
    },
    count() {
      return this.items().reduce((n, i) => n + i.qty, 0);
    },
    meta() {
      return store.get("cartMeta", {});
    },
    setMeta(patch) {
      store.set("cartMeta", { ...this.meta(), ...patch });
    },
    totals(method = "standard") {
      const subtotal = this.items().reduce((s, i) => s + byId(i.id).price * i.qty, 0);
      const code = this.meta().promo;
      const rate = code && SHOP.promoCodes[code] ? SHOP.promoCodes[code] : 0;
      const discount = Math.round(subtotal * rate * 100) / 100;
      const net = subtotal - discount;
      const free = net >= SHOP.freeShippingFrom;
      const shipping = subtotal === 0 ? 0 : method === "express" ? SHOP.shipping.express.price : free ? 0 : SHOP.shipping.standard.price;
      return { subtotal, discount, code: rate ? code : null, net, shipping, total: net + shipping, free };
    },
  };

  /* ---------- Merkliste ---------- */
  const Wish = {
    ids() {
      return store.get("wish", []).filter(byId);
    },
    has(id) {
      return this.ids().includes(id);
    },
    toggle(id) {
      const ids = this.ids();
      const on = !ids.includes(id);
      store.set("wish", on ? [...ids, id] : ids.filter((x) => x !== id));
      refreshCounts();
      $$(`.wish[data-id="${id}"]`).forEach((b) => b.setAttribute("aria-pressed", on));
      return on;
    },
  };

  /* ---------- Layout ---------- */
  function navLinks() {
    return [
      ["shop.html?neu=1", "Neuheiten", page === "shop" && params.get("neu")],
      ["shop.html", "Kollektion", page === "shop" && !params.get("neu") && params.get("kategorie") !== "accessoires"],
      ["shop.html?kategorie=accessoires", "Accessoires", page === "shop" && params.get("kategorie") === "accessoires"],
      ["ueber-uns.html", "Atelier", page === "ueber-uns"],
    ];
  }

  function renderLayout() {
    const links = navLinks();
    const header = `
      <a class="sr-only" href="#main">Zum Inhalt springen</a>
      <div class="announce">Kostenloser Versand ab ${euro(SHOP.freeShippingFrom)} · ${SHOP.returnDays} Tage Rückgabe</div>
      <header class="header" id="header">
        <div class="wrap">
          <div>
            <nav class="nav" aria-label="Hauptnavigation">
              ${links.map(([h, t, a]) => `<a href="${h}"${a ? ' aria-current="page"' : ""}>${t}</a>`).join("")}
            </nav>
            <button class="menu-btn icon-btn" data-action="menu" aria-label="Menü öffnen">${ICON.menu}</button>
          </div>
          <a class="logo" href="index.html" aria-label="${esc(SHOP.brand)} Startseite">${esc(SHOP.brand)}</a>
          <div class="tools">
            <button class="icon-btn" data-action="search" aria-label="Suche">${ICON.search}<span class="label">Suche</span></button>
            <a class="icon-btn" href="merkliste.html" aria-label="Merkliste">${ICON.heart}<span class="label">Merkliste</span><span class="count" data-count="wish"></span></a>
            <button class="icon-btn" data-action="cart" aria-label="Warenkorb">${ICON.bag}<span class="label">Warenkorb</span><span class="count" data-count="cart"></span></button>
          </div>
        </div>
      </header>`;
    document.body.insertAdjacentHTML("afterbegin", header);

    const year = new Date().getFullYear();
    const footer = `
      <footer class="footer">
        <div class="wrap">
          <div class="cols">
            <div class="newsletter" style="text-align:left">
              <a class="logo" href="index.html">${esc(SHOP.brand)}</a>
              <p>Neue Kollektionen, Einladungen und Geschichten aus dem Atelier. Höchstens einmal im Monat.</p>
              <form data-form="newsletter" novalidate>
                <label class="sr-only" for="nl-foot">E-Mail-Adresse</label>
                <input id="nl-foot" type="email" placeholder="E-Mail-Adresse" autocomplete="email">
                <button type="submit">Anmelden</button>
              </form>
              <div class="form-note" aria-live="polite"></div>
            </div>
            <div><h4 class="caps">Kundenservice</h4><ul>
              <li><a href="kontakt.html">Kontakt</a></li>
              <li><a href="service.html#versand">Versand</a></li>
              <li><a href="service.html#rueckgabe">Rückgabe & Umtausch</a></li>
              <li><a href="service.html#groessen">Größentabelle</a></li>
              <li><a href="service.html#faq">Häufige Fragen</a></li></ul></div>
            <div><h4 class="caps">Entdecken</h4><ul>
              <li><a href="shop.html?neu=1">Neuheiten</a></li>
              ${CATEGORIES.map((c) => `<li><a href="shop.html?kategorie=${c.id}">${c.name}</a></li>`).join("")}</ul></div>
            <div><h4 class="caps">Rechtliches</h4><ul>
              <li><a href="impressum.html">Impressum</a></li>
              <li><a href="datenschutz.html">Datenschutz</a></li>
              <li><a href="agb.html">AGB</a></li>
              <li><a href="widerruf.html">Widerrufsbelehrung</a></li></ul></div>
          </div>
          <div class="bottom mono">
            <span>© ${year} ${esc(SHOP.brand)}</span>
            <span>Testbetrieb: Bestellungen und Formulare werden noch nicht übermittelt.</span>
          </div>
        </div>
      </footer>

      <div class="scrim" data-action="close"></div>

      <aside class="drawer" id="drawer" aria-label="Warenkorb" aria-hidden="true">
        <div class="drawer-head"><span class="caps">Warenkorb <span class="mono" data-count="cart"></span></span>
          <button data-action="close" aria-label="Schließen">${ICON.close}</button></div>
        <div class="drawer-body" id="drawer-body"></div>
        <div class="drawer-foot" id="drawer-foot"></div>
      </aside>

      <div class="search" id="search" aria-hidden="true">
        <div class="wrap">
          <form action="shop.html" role="search">
            <label class="sr-only" for="q">Suche</label>
            <input id="q" name="q" type="search" placeholder="Wonach suchen Sie?" autocomplete="off">
            <button type="button" data-action="close" aria-label="Suche schließen">${ICON.close}</button>
          </form>
          <div class="search-results" id="search-results"></div>
        </div>
      </div>

      <div class="mobile-menu" id="mobile-menu" aria-hidden="true">
        <div class="top"><span class="logo">${esc(SHOP.brand)}</span><button data-action="close" aria-label="Menü schließen">${ICON.close}</button></div>
        <nav aria-label="Mobile Navigation">
          <a href="shop.html?neu=1">Neuheiten</a>
          ${CATEGORIES.map((c) => `<a href="shop.html?kategorie=${c.id}">${c.name}</a>`).join("")}
          <a href="ueber-uns.html">Atelier</a>
        </nav>
        <div class="small caps"><a href="merkliste.html">Merkliste</a><a href="kontakt.html">Kontakt</a><a href="service.html">Kundenservice</a></div>
      </div>

      <div class="modal" id="modal" role="dialog" aria-modal="true" aria-hidden="true">
        <div class="box"><button class="close" data-action="close" aria-label="Schließen">${ICON.close}</button><div id="modal-body"></div></div>
      </div>

      <div class="toast" id="toast" role="status" aria-live="polite"></div>`;
    document.body.insertAdjacentHTML("beforeend", footer);
    $$("[data-brand]").forEach((el) => (el.textContent = SHOP.brand));
    const t = document.body.dataset.title;
    document.title = t ? `${t} — ${SHOP.brand}` : `${SHOP.brand} — ${SHOP.claim}`;
  }

  function refreshCounts() {
    const c = Cart.count();
    const w = Wish.ids().length;
    $$('[data-count="cart"]').forEach((el) => (el.textContent = c ? `(${c})` : ""));
    $$('[data-count="wish"]').forEach((el) => (el.textContent = w ? `(${w})` : ""));
  }

  /* ---------- Overlays ---------- */
  let lastFocus = null;
  function openOverlay(el) {
    closeOverlays();
    lastFocus = document.activeElement;
    el.classList.add("open");
    el.setAttribute("aria-hidden", "false");
    if (el.id !== "search" && el.id !== "mobile-menu") $(".scrim").classList.add("open");
    document.body.classList.add("locked");
    const f = el.querySelector("input, button, a");
    if (f) setTimeout(() => f.focus(), 60);
  }
  function closeOverlays() {
    $$(".drawer.open, .search.open, .mobile-menu.open, .modal.open, .scrim.open").forEach((el) => {
      el.classList.remove("open");
      el.setAttribute("aria-hidden", "true");
    });
    document.body.classList.remove("locked");
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
    lastFocus = null;
  }
  function openModal(html, cls = "") {
    const m = $("#modal");
    m.className = `modal ${cls}`;
    $("#modal-body").innerHTML = html;
    openOverlay(m);
  }
  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
  }

  /* ---------- Bausteine ---------- */
  function productCard(p, opts = {}) {
    const color = p.colors[0];
    const hex = colorOf(color).hex;
    const wished = Wish.has(p.id);
    return `
      <article class="card reveal">
        <a class="media" href="${productUrl(p)}" aria-label="${esc(p.name)}">
          <span class="main">${garmentSVG(p.type, hex, "front")}</span>
          <span class="alt">${garmentSVG(p.type, hex, "detail")}</span>
          ${p.isNew ? `<span class="badge">Neu</span>` : ""}
        </a>
        <button class="wish" data-action="wish" data-id="${p.id}" aria-pressed="${wished}" aria-label="${esc(p.name)} auf die Merkliste">${ICON.heart}</button>
        <div class="info">
          <a class="name" href="${productUrl(p)}">${esc(p.name)}</a>
          <span class="price">${euro(p.price)}</span>
          ${opts.noColors ? "" : `<div class="colors">${p.colors.map((c) => `<span class="dot" style="background:${colorOf(c).hex}" title="${colorOf(c).name}"></span>`).join("")}<span>${p.colors.length > 1 ? `${p.colors.length} Farben` : colorOf(color).name}</span></div>`}
        </div>
      </article>`;
  }

  function sizeTable() {
    return `
      <h3>Größentabelle</h3>
      <p class="mono" style="margin-top:8px">Körpermaße in Zentimetern</p>
      <table class="sizes-table">
        <thead><tr><th>Größe</th><th>Brust</th><th>Taille</th><th>Hüfte</th><th>DE</th></tr></thead>
        <tbody>
          <tr><td>XS</td><td>84–88</td><td>70–74</td><td>86–90</td><td>44</td></tr>
          <tr><td>S</td><td>89–94</td><td>75–80</td><td>91–96</td><td>46</td></tr>
          <tr><td>M</td><td>95–100</td><td>81–86</td><td>97–102</td><td>48</td></tr>
          <tr><td>L</td><td>101–106</td><td>87–92</td><td>103–108</td><td>50</td></tr>
          <tr><td>XL</td><td>107–113</td><td>93–99</td><td>109–114</td><td>52</td></tr>
        </tbody>
      </table>
      <p style="margin-top:18px;font-size:13px;color:var(--ink-2)">Zwischen zwei Größen? Bei Mänteln und Strick empfehlen wir die kleinere, bei Hemden die größere Größe. Wir beraten Sie gern: <a class="link" href="kontakt.html">Kontakt</a>.</p>`;
  }

  function lineItem(i, opts = {}) {
    const p = byId(i.id);
    const key = keyOf(i);
    return `
      <div class="line-item">
        <a class="thumb" href="${productUrl(p, i.color)}">${garmentSVG(p.type, colorOf(i.color).hex)}</a>
        <div class="meta">
          <div style="display:flex;justify-content:space-between;gap:12px"><a href="${productUrl(p, i.color)}">${esc(p.name)}</a><span>${euro(p.price * i.qty)}</span></div>
          <span class="sub">${colorOf(i.color).name} · ${esc(i.size)}</span>
          ${i.qty > 1 ? `<span class="sub">${euro(p.price)} pro Stück</span>` : ""}
          <div class="row">
            <div class="qty" aria-label="Anzahl">
              <button data-action="qty" data-key="${esc(key)}" data-d="-1" aria-label="Weniger" ${i.qty <= 1 ? "disabled" : ""}>−</button>
              <span>${i.qty}</span>
              <button data-action="qty" data-key="${esc(key)}" data-d="1" aria-label="Mehr" ${i.qty >= SHOP.maxQty ? "disabled" : ""}>+</button>
            </div>
            <span style="display:flex;gap:14px">
              ${opts.wish ? `<button class="remove" data-action="to-wish" data-key="${esc(key)}">Merken</button>` : ""}
              <button class="remove" data-action="remove" data-key="${esc(key)}">Entfernen</button>
            </span>
          </div>
        </div>
      </div>`;
  }

  function shipBar(t) {
    if (t.subtotal === 0) return "";
    const pct = Math.min(100, (t.net / SHOP.freeShippingFrom) * 100);
    const txt = t.free ? "Ihre Bestellung wird kostenlos versendet." : `Noch ${euro(SHOP.freeShippingFrom - t.net)} bis zum kostenlosen Versand.`;
    return `<div class="ship-bar">${txt}<div class="track"><div class="fill" style="width:${pct}%"></div></div></div>`;
  }

  /* ---------- Warenkorb-Schublade ---------- */
  function renderDrawer() {
    const items = Cart.items();
    const t = Cart.totals();
    $("#drawer-body").innerHTML = items.length
      ? items.map((i) => lineItem(i)).join("")
      : `<div class="empty"><p>Ihr Warenkorb ist leer.</p><a class="btn ghost" href="shop.html">Kollektion entdecken</a></div>`;
    $("#drawer-foot").innerHTML = items.length
      ? `${shipBar(t)}
         ${t.discount ? `<div class="sum-row"><span>Rabatt (${esc(t.code)})</span><span>−${euro(t.discount)}</span></div>` : ""}
         <div class="sum-row total"><span>Zwischensumme</span><span>${euro(t.net)}</span></div>
         <span class="mono">inkl. MwSt., zzgl. Versand</span>
         <a class="btn block" href="kasse.html">Zur Kasse</a>
         <a class="btn ghost block" href="warenkorb.html">Warenkorb ansehen</a>`
      : "";
  }

  /* ---------- Suche ---------- */
  function searchProducts(q) {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    return PRODUCTS.filter((p) => {
      const hay = [p.name, catName(p.category), p.material, p.description, ...p.colors.map((c) => colorOf(c).name)].join(" ").toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
  }
  function renderSearch(q) {
    const box = $("#search-results");
    if (!q.trim()) {
      box.innerHTML = `<p class="mono">Beliebt: Kaschmir · Mantel · Leinen · Hemd</p>`;
      return;
    }
    const res = searchProducts(q);
    box.innerHTML = res.length
      ? `<p class="mono" style="margin-bottom:16px">${res.length} Treffer</p><div class="grid">${res.slice(0, 6).map((p) => productCard(p, { noColors: true })).join("")}</div>
         ${res.length > 6 ? `<p style="margin-top:20px"><a class="link" href="shop.html?q=${encodeURIComponent(q)}">Alle ${res.length} Treffer ansehen</a></p>` : ""}`
      : `<p class="mono">Keine Treffer für „${esc(q)}“.</p>`;
    revealAll();
  }

  /* ---------- Globale Ereignisse ---------- */
  function bindGlobal() {
    document.addEventListener("click", (e) => {
      const el = e.target.closest("[data-action]");
      if (!el) return;
      const a = el.dataset.action;
      if (a === "close") closeOverlays();
      else if (a === "cart") {
        renderDrawer();
        openOverlay($("#drawer"));
      } else if (a === "search") {
        renderSearch($("#q").value);
        openOverlay($("#search"));
      } else if (a === "menu") openOverlay($("#mobile-menu"));
      else if (a === "wish") {
        e.preventDefault();
        const on = Wish.toggle(el.dataset.id);
        toast(on ? "Auf der Merkliste gespeichert." : "Von der Merkliste entfernt.");
        if (page === "merkliste") renderWishlist();
      } else if (a === "qty") {
        const item = Cart.items().find((i) => keyOf(i) === el.dataset.key);
        if (item) Cart.setQty(el.dataset.key, item.qty + Number(el.dataset.d));
        rerenderCartViews();
      } else if (a === "remove") {
        Cart.remove(el.dataset.key);
        rerenderCartViews();
      } else if (a === "to-wish") {
        const id = el.dataset.key.split("|")[0];
        if (!Wish.has(id)) Wish.toggle(id);
        Cart.remove(el.dataset.key);
        toast("Auf die Merkliste verschoben.");
        rerenderCartViews();
      } else if (a === "size-chart") openModal(sizeTable());
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeOverlays();
    });

    $("#q").addEventListener("input", (e) => renderSearch(e.target.value));

    // Newsletter-Formulare (Startseite und Footer)
    $$('[data-form="newsletter"]').forEach((f) =>
      f.addEventListener("submit", (e) => {
        e.preventDefault();
        const input = $("input", f);
        const note = f.nextElementSibling;
        if (!isEmail(input.value)) {
          note.className = "form-note err";
          note.textContent = "Bitte geben Sie eine gültige E-Mail-Adresse ein.";
          return;
        }
        note.className = "form-note ok";
        note.textContent = "Vielen Dank. Bitte bestätigen Sie Ihre Anmeldung über den Link in der E-Mail.";
        input.value = "";
      })
    );

    // Header über dem Hero durchsichtig
    const header = $("#header");
    const hero = $(".hero");
    if (hero) {
      const onScroll = () => header.classList.toggle("over", window.scrollY < 40);
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    // Andere Tabs: Warenkorb synchron halten
    window.addEventListener("storage", (e) => {
      if (e.key === "cart" || e.key === "wish") {
        refreshCounts();
        rerenderCartViews();
      }
    });
  }

  function rerenderCartViews() {
    if ($("#drawer").classList.contains("open")) renderDrawer();
    if (page === "warenkorb") renderCartPage();
    if (page === "kasse" && !$(".confirm")) renderSummaryBox();
  }

  /* ---------- Einblenden ---------- */
  let io;
  function revealAll() {
    const els = $$(".reveal:not(.in)");
    if (!("IntersectionObserver" in window)) return els.forEach((el) => el.classList.add("in"));
    io =
      io ||
      new IntersectionObserver(
        (entries) =>
          entries.forEach((en) => {
            if (en.isIntersecting) {
              en.target.classList.add("in");
              io.unobserve(en.target);
            }
          }),
        { rootMargin: "0px 0px -8% 0px" }
      );
    els.forEach((el) => io.observe(el));
  }

  /* ================================================================
     Seiten
     ================================================================ */

  function renderHome() {
    const heroArt = $("#hero-art");
    if (heroArt) heroArt.innerHTML = garmentSVG("coat", colorOf("kamel").hex).replace("xMidYMid slice", "xMidYMid meet");
    const cats = [
      ["oberbekleidung", "trench", "beige"],
      ["strick", "cable", "ecru"],
      ["accessoires", "bag", "schoko"],
    ];
    $("#home-cats").innerHTML = cats
      .map(
        ([id, type, col]) => `
        <a class="cat reveal" href="shop.html?kategorie=${id}">
          ${garmentSVG(type, colorOf(col).hex)}
          <span class="cat-label"><span>${catName(id)}</span><span class="caps">Entdecken</span></span>
        </a>`
      )
      .join("");
    $("#home-new").innerHTML = PRODUCTS.filter((p) => p.isNew).slice(0, 4).map((p) => productCard(p)).join("");
    $("#home-classics").innerHTML = ["kaschmir-pullover", "popelinehemd", "bundfaltenhose", "kaschmirschal"].map((id) => productCard(byId(id))).join("");
    $("#home-editorial").innerHTML = garmentSVG("shirt", colorOf("weiss").hex, "detail");
  }

  /* ---------- Shop ---------- */
  const PRICE_RANGES = [
    ["bis-250", "bis 250 €", (p) => p <= 250],
    ["250-500", "250–500 €", (p) => p > 250 && p <= 500],
    ["500-1000", "500–1.000 €", (p) => p > 500 && p <= 1000],
    ["ab-1000", "über 1.000 €", (p) => p > 1000],
  ];
  const shopState = {
    kategorie: params.get("kategorie") || "",
    neu: params.get("neu") === "1",
    q: params.get("q") || "",
    farbe: (params.get("farbe") || "").split(",").filter(Boolean),
    groesse: (params.get("groesse") || "").split(",").filter(Boolean),
    preis: params.get("preis") || "",
    sort: params.get("sort") || "empfohlen",
  };

  function shopFiltered() {
    const s = shopState;
    let list = s.q ? searchProducts(s.q) : PRODUCTS.slice();
    if (s.kategorie) list = list.filter((p) => p.category === s.kategorie);
    if (s.neu) list = list.filter((p) => p.isNew);
    if (s.farbe.length) list = list.filter((p) => p.colors.some((c) => s.farbe.includes(c)));
    if (s.groesse.length) list = list.filter((p) => p.sizes.some((z) => s.groesse.includes(z) && !p.soldOut.includes(z)));
    const range = PRICE_RANGES.find((r) => r[0] === s.preis);
    if (range) list = list.filter((p) => range[2](p.price));
    if (s.sort === "preis-auf") list.sort((a, b) => a.price - b.price);
    else if (s.sort === "preis-ab") list.sort((a, b) => b.price - a.price);
    else if (s.sort === "neu") list.sort((a, b) => b.added.localeCompare(a.added));
    return list;
  }

  function syncShopUrl() {
    const s = shopState;
    const p = new URLSearchParams();
    if (s.kategorie) p.set("kategorie", s.kategorie);
    if (s.neu) p.set("neu", "1");
    if (s.q) p.set("q", s.q);
    if (s.farbe.length) p.set("farbe", s.farbe.join(","));
    if (s.groesse.length) p.set("groesse", s.groesse.join(","));
    if (s.preis) p.set("preis", s.preis);
    if (s.sort !== "empfohlen") p.set("sort", s.sort);
    const qs = p.toString();
    history.replaceState(null, "", qs ? `?${qs}` : location.pathname);
  }

  function renderShop() {
    const s = shopState;
    const title = s.q ? `Suche: „${s.q}“` : s.neu ? "Neuheiten" : s.kategorie ? catName(s.kategorie) : "Kollektion";
    document.title = `${title} — ${SHOP.brand}`;
    $("#shop-title").textContent = title;
    $("#shop-crumbs").innerHTML = `<a href="index.html">Start</a><span>/</span><a href="shop.html">Kollektion</a>${s.kategorie ? `<span>/</span><span>${catName(s.kategorie)}</span>` : ""}`;

    const chip = (label, active, data) => `<button class="chip${active ? " active" : ""}" ${data}>${label}</button>`;
    $("#chips").innerHTML =
      chip("Alle", !s.kategorie && !s.neu, 'data-chip=""') +
      chip("Neuheiten", s.neu, 'data-chip="neu"') +
      CATEGORIES.map((c) => chip(c.name, s.kategorie === c.id, `data-chip="${c.id}"`)).join("");

    const usedColors = [...new Set(PRODUCTS.flatMap((p) => p.colors))];
    const opt = (group, val, label, on, extra = "") => `<button class="opt" data-filter="${group}" data-val="${val}" aria-pressed="${on}">${extra}${label}</button>`;
    $("#filter-colors").innerHTML = usedColors.map((c) => opt("farbe", c, colorOf(c).name, s.farbe.includes(c), `<span class="dot" style="background:${colorOf(c).hex}"></span>`)).join("");
    $("#filter-sizes").innerHTML = SIZES.map((z) => opt("groesse", z, z, s.groesse.includes(z))).join("");
    $("#filter-prices").innerHTML = PRICE_RANGES.map(([id, label]) => opt("preis", id, label, s.preis === id)).join("");
    const nActive = s.farbe.length + s.groesse.length + (s.preis ? 1 : 0);
    $("#filter-toggle").textContent = `Filter${nActive ? ` (${nActive})` : ""}`;
    $("#sort").value = s.sort;

    const list = shopFiltered();
    $("#shop-count").textContent = `${list.length} ${list.length === 1 ? "Artikel" : "Artikel"}`;
    $("#shop-grid").innerHTML = list.length
      ? list.map((p) => productCard(p)).join("")
      : `<div class="empty" style="grid-column:1/-1"><h3>Keine passenden Artikel</h3><p>Versuchen Sie es mit weniger Filtern.</p><button class="btn ghost" id="reset-all">Filter zurücksetzen</button></div>`;
    revealAll();
    syncShopUrl();
  }

  function bindShop() {
    $("#chips").addEventListener("click", (e) => {
      const b = e.target.closest("[data-chip]");
      if (!b) return;
      const v = b.dataset.chip;
      shopState.neu = v === "neu";
      shopState.kategorie = v && v !== "neu" ? v : "";
      shopState.q = "";
      renderShop();
    });
    $("#filter-panel").addEventListener("click", (e) => {
      const b = e.target.closest("[data-filter]");
      if (b) {
        const { filter, val } = b.dataset;
        if (filter === "preis") shopState.preis = shopState.preis === val ? "" : val;
        else {
          const arr = shopState[filter];
          shopState[filter] = arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
        }
        renderShop();
      }
      if (e.target.closest("#filter-reset")) resetFilters();
    });
    $("#shop-grid").addEventListener("click", (e) => {
      if (e.target.closest("#reset-all")) {
        shopState.kategorie = "";
        shopState.neu = false;
        shopState.q = "";
        resetFilters();
      }
    });
    $("#filter-toggle").addEventListener("click", () => {
      const open = $("#filter-panel").classList.toggle("open");
      $("#filter-toggle").setAttribute("aria-expanded", open);
    });
    $("#sort").addEventListener("change", (e) => {
      shopState.sort = e.target.value;
      renderShop();
    });
  }
  function resetFilters() {
    shopState.farbe = [];
    shopState.groesse = [];
    shopState.preis = "";
    renderShop();
  }

  /* ---------- Produktseite ---------- */
  function renderProduct() {
    const p = byId(params.get("id"));
    const root = $("#pdp");
    if (!p) {
      root.innerHTML = `<div class="wrap empty"><h2>Artikel nicht gefunden</h2><p>Dieser Artikel ist nicht mehr verfügbar.</p><a class="btn ghost" href="shop.html">Zur Kollektion</a></div>`;
      return;
    }
    let color = p.colors.includes(params.get("farbe")) ? params.get("farbe") : p.colors[0];
    let size = p.sizes.length === 1 ? p.sizes[0] : null;
    document.title = `${p.name} — ${SHOP.brand}`;

    const gallery = () => {
      const hex = colorOf(color).hex;
      return [
        ["front", "Ansicht"],
        ["detail", "Detail"],
        ["fabric", "Material"],
      ]
        .map(([v, label], i) => `<button class="shot" data-view="${v}" aria-label="${label} vergrößern">${garmentSVG(p.type, hex, v)}<span class="mono">${String(i + 1).padStart(2, "0")} / ${label}</span></button>`)
        .join("");
    };

    root.innerHTML = `
      <div class="pdp">
        <div class="gallery" id="gallery">${gallery()}</div>
        <div class="buybox">
          <nav class="crumbs" aria-label="Brotkrumen"><a href="index.html">Start</a><span>/</span><a href="shop.html?kategorie=${p.category}">${catName(p.category)}</a></nav>
          ${p.isNew ? `<span class="eyebrow">Neu</span>` : ""}
          <h1>${esc(p.name)}</h1>
          <div class="price">${euro(p.price)} <span class="mono" style="margin-left:6px">inkl. MwSt.</span></div>

          <div class="opt-label"><span>Farbe</span><span class="muted" id="color-name">${colorOf(color).name}</span></div>
          <div class="swatches" role="group" aria-label="Farbe">
            ${p.colors.map((c) => `<button class="swatch" data-color="${c}" style="background:${colorOf(c).hex}" aria-label="${colorOf(c).name}" aria-pressed="${c === color}"></button>`).join("")}
          </div>

          <div class="opt-label"><span>Größe</span><span class="muted" id="size-name">${size ? esc(size) : "Bitte wählen"}</span></div>
          <div class="sizes${p.sizes.length === 1 ? " one" : ""}" role="group" aria-label="Größe">
            ${p.sizes
              .map((z) => {
                const out = p.soldOut.includes(z);
                return `<button class="size" data-size="${esc(z)}" aria-pressed="${z === size}" ${out ? `disabled title="Ausverkauft"` : ""}>${esc(z)}</button>`;
              })
              .join("")}
          </div>
          <div class="size-help">
            ${p.soldOut.length ? `<span>Durchgestrichen: ausverkauft</span>` : "<span></span>"}
            ${p.sizes.length > 1 ? `<button class="link" data-action="size-chart">Größentabelle</button>` : ""}
          </div>

          <div class="buy-row">
            <button class="btn" id="add">In den Warenkorb</button>
            <button class="wish" data-action="wish" data-id="${p.id}" aria-pressed="${Wish.has(p.id)}" aria-label="Auf die Merkliste">${ICON.heart}</button>
          </div>
          <div class="buy-msg" id="buy-msg" aria-live="polite"></div>

          <div class="perks">
            <div>Kostenloser Versand ab ${euro(SHOP.freeShippingFrom)}</div>
            <div>Kostenlose Rückgabe innerhalb von ${SHOP.returnDays} Tagen</div>
            <div>${esc(p.origin)}</div>
          </div>

          <div class="acc">
            <details open><summary>Beschreibung</summary><div class="body">${esc(p.description)}</div></details>
            <details><summary>Material & Pflege</summary><div class="body"><p>${esc(p.material)}</p><p>${esc(p.care)}</p></div></details>
            <details><summary>Größe & Passform</summary><div class="body">${esc(p.fit)}</div></details>
            <details><summary>Versand & Rückgabe</summary><div class="body"><p>${SHOP.shipping.standard.label} (${SHOP.shipping.standard.time}): ${euro(SHOP.shipping.standard.price)}, ab ${euro(SHOP.freeShippingFrom)} kostenlos. ${SHOP.shipping.express.label} (${SHOP.shipping.express.time}): ${euro(SHOP.shipping.express.price)}.</p><p>Rückgabe innerhalb von ${SHOP.returnDays} Tagen. <a class="link" href="service.html#rueckgabe">Mehr erfahren</a></p></div></details>
          </div>
        </div>
      </div>
      <section class="section wrap">
        <div class="section-head"><h2>Das könnte Ihnen auch gefallen</h2></div>
        <div class="grid">${related(p).map((r) => productCard(r)).join("")}</div>
      </section>`;

    const setUrl = () => history.replaceState(null, "", productUrl(p, color));

    root.addEventListener("click", (e) => {
      const sw = e.target.closest("[data-color]");
      if (sw) {
        color = sw.dataset.color;
        $$(".swatch", root).forEach((b) => b.setAttribute("aria-pressed", b.dataset.color === color));
        $("#color-name").textContent = colorOf(color).name;
        $("#gallery").innerHTML = gallery();
        setUrl();
      }
      const sz = e.target.closest("[data-size]");
      if (sz && !sz.disabled) {
        size = sz.dataset.size;
        $$(".size", root).forEach((b) => b.setAttribute("aria-pressed", b.dataset.size === size));
        $("#size-name").textContent = size;
        $("#buy-msg").textContent = "";
      }
      const shot = e.target.closest(".shot");
      if (shot) openModal(garmentSVG(p.type, colorOf(color).hex, shot.dataset.view), "zoom");
    });

    $("#add").addEventListener("click", () => {
      if (!size) {
        $("#buy-msg").textContent = "Bitte wählen Sie eine Größe.";
        $(".sizes button:not([disabled])", root)?.focus();
        return;
      }
      if (!Cart.add(p.id, color, size)) {
        $("#buy-msg").textContent = `Höchstens ${SHOP.maxQty} Stück pro Artikel.`;
        return;
      }
      renderDrawer();
      openOverlay($("#drawer"));
    });
    revealAll();
  }

  function related(p) {
    const same = PRODUCTS.filter((x) => x.id !== p.id && x.category === p.category);
    const other = PRODUCTS.filter((x) => x.id !== p.id && x.category !== p.category);
    return [...same, ...other].slice(0, 4);
  }

  /* ---------- Warenkorb-Seite ---------- */
  function renderCartPage() {
    const root = $("#cart");
    const items = Cart.items();
    if (!items.length) {
      root.innerHTML = `<div class="empty"><h2>Ihr Warenkorb ist leer</h2><p>Entdecken Sie die aktuelle Kollektion.</p><a class="btn" href="shop.html">Zur Kollektion</a></div>`;
      return;
    }
    const t = Cart.totals();
    const meta = Cart.meta();
    root.innerHTML = `
      <div class="cart-layout">
        <div>${items.map((i) => lineItem(i, { wish: true })).join("")}</div>
        <aside class="summary">
          <h3>Übersicht</h3>
          ${shipBar(t)}
          <div class="sum-row"><span>Zwischensumme</span><span>${euro(t.subtotal)}</span></div>
          ${t.discount ? `<div class="sum-row"><span>Rabatt (${esc(t.code)}) <button class="remove" id="promo-remove">entfernen</button></span><span>−${euro(t.discount)}</span></div>` : ""}
          <div class="sum-row"><span>Versand (Standard)</span><span>${t.shipping ? euro(t.shipping) : "kostenlos"}</span></div>
          <div class="sum-row total"><span>Gesamt</span><span>${euro(t.total)}</span></div>
          <span class="mono">inkl. MwSt.</span>
          ${t.discount ? "" : `
          <form class="promo" id="promo-form" novalidate>
            <label class="sr-only" for="promo">Rabattcode</label>
            <input class="input" id="promo" placeholder="Rabattcode" autocomplete="off">
            <button class="btn ghost" type="submit" style="padding:0 18px">Einlösen</button>
          </form>
          <div class="form-note" id="promo-note" aria-live="polite"></div>`}
          <label class="gift"><input type="checkbox" id="gift" ${meta.gift ? "checked" : ""}> Als Geschenk verpacken (kostenlos)</label>
          <a class="btn block" href="kasse.html">Zur Kasse</a>
          <span class="mono" style="text-align:center">Sichere Zahlung · ${SHOP.returnDays} Tage Rückgabe</span>
        </aside>
      </div>`;

    $("#gift").addEventListener("change", (e) => Cart.setMeta({ gift: e.target.checked }));
    $("#promo-remove")?.addEventListener("click", () => {
      Cart.setMeta({ promo: null });
      renderCartPage();
    });
    $("#promo-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const code = $("#promo").value.trim().toUpperCase();
      if (SHOP.promoCodes[code]) {
        Cart.setMeta({ promo: code });
        renderCartPage();
        toast("Rabattcode eingelöst.");
      } else {
        const n = $("#promo-note");
        n.className = "form-note err";
        n.textContent = "Dieser Code ist leider nicht gültig.";
      }
    });
  }

  /* ---------- Kasse ---------- */
  function shippingMethod() {
    const r = $('input[name="versand"]:checked');
    return r ? r.value : "standard";
  }

  function renderSummaryBox() {
    const box = $("#summary");
    if (!box) return;
    const items = Cart.items();
    if (!items.length) return renderCheckout();
    const t = Cart.totals(shippingMethod());
    box.innerHTML = `
      <h3>Ihre Bestellung</h3>
      <div class="mini-items">
        ${items
          .map((i) => {
            const p = byId(i.id);
            return `<div class="mini-item"><div class="thumb">${garmentSVG(p.type, colorOf(i.color).hex)}<b>${i.qty}</b></div>
              <div>${esc(p.name)}<br><span style="color:var(--muted)">${colorOf(i.color).name} · ${esc(i.size)}</span></div><span>${euro(p.price * i.qty)}</span></div>`;
          })
          .join("")}
      </div>
      <div class="sum-row"><span>Zwischensumme</span><span>${euro(t.subtotal)}</span></div>
      ${t.discount ? `<div class="sum-row"><span>Rabatt (${esc(t.code)})</span><span>−${euro(t.discount)}</span></div>` : ""}
      <div class="sum-row"><span>Versand</span><span>${t.shipping ? euro(t.shipping) : "kostenlos"}</span></div>
      ${Cart.meta().gift ? `<div class="sum-row"><span>Geschenkverpackung</span><span>kostenlos</span></div>` : ""}
      <div class="sum-row total"><span>Gesamt</span><span>${euro(t.total)}</span></div>
      <span class="mono">inkl. MwSt.</span>
      <a class="link" href="warenkorb.html" style="font-size:12px;justify-self:start">Warenkorb bearbeiten</a>`;
    const std = $("#ship-std-price");
    if (std) std.textContent = Cart.totals("standard").shipping ? euro(SHOP.shipping.standard.price) : "kostenlos";
  }

  function field(id, label, opts = {}) {
    const { type = "text", auto = "", req = true, err = "Bitte ausfüllen.", attrs = "" } = opts;
    return `<div class="field" data-field="${id}">
      <label for="${id}">${label}${req ? "" : ' <span style="color:var(--muted)">(optional)</span>'}</label>
      <input id="${id}" name="${id}" type="${type}" ${auto ? `autocomplete="${auto}"` : ""} ${req ? "required" : ""} ${attrs}>
      <span class="error">${err}</span></div>`;
  }

  function renderCheckout() {
    const root = $("#checkout");
    if (!Cart.items().length) {
      root.innerHTML = `<div class="empty"><h2>Ihr Warenkorb ist leer</h2><p>Bevor Sie zur Kasse gehen, legen Sie bitte Artikel in den Warenkorb.</p><a class="btn" href="shop.html">Zur Kollektion</a></div>`;
      return;
    }
    const pay = [
      ["karte", "Kreditkarte", "Visa, Mastercard, American Express"],
      ["paypal", "PayPal", "Sie werden zu PayPal weitergeleitet."],
      ["klarna", "Rechnung (Klarna)", "Zahlung innerhalb von 30 Tagen."],
      ["vorkasse", "Vorkasse", "Überweisung. Versand nach Zahlungseingang."],
    ];
    root.innerHTML = `
      <div class="checkout">
        <form id="checkout-form" novalidate>
          <div class="notice">Testbetrieb: Es wird nichts abgebucht und keine Bestellung versendet. Die Zahlungsanbieter werden vor dem Start angebunden.</div>
          <section class="step">
            <h2><span class="mono">01</span>Kontakt</h2>
            ${field("email", "E-Mail-Adresse", { type: "email", auto: "email", err: "Bitte geben Sie eine gültige E-Mail-Adresse ein." })}
            ${field("tel", "Telefon", { type: "tel", auto: "tel", req: false, err: "" })}
          </section>
          <section class="step">
            <h2><span class="mono">02</span>Lieferadresse</h2>
            <div class="cols-2">${field("vorname", "Vorname", { auto: "given-name" })}${field("nachname", "Nachname", { auto: "family-name" })}</div>
            ${field("strasse", "Straße und Hausnummer", { auto: "address-line1" })}
            ${field("zusatz", "Adresszusatz", { auto: "address-line2", req: false, err: "" })}
            <div class="cols-3">${field("plz", "PLZ", { auto: "postal-code", err: "Bitte gültige PLZ eingeben.", attrs: 'inputmode="numeric"' })}${field("ort", "Ort", { auto: "address-level2" })}</div>
            <div class="field" data-field="land"><label for="land">Land</label>
              <select id="land" name="land" autocomplete="country">
                <option value="DE">Deutschland</option><option value="AT">Österreich</option><option value="NL">Niederlande</option>
                <option value="BE">Belgien</option><option value="LU">Luxemburg</option><option value="FR">Frankreich</option><option value="IT">Italien</option>
              </select></div>
          </section>
          <section class="step">
            <h2><span class="mono">03</span>Versand</h2>
            <label class="choice"><input type="radio" name="versand" value="standard" checked><span class="grow">${SHOP.shipping.standard.label}<br><span class="sub">${SHOP.shipping.standard.time} · ab ${euro(SHOP.freeShippingFrom)} kostenlos</span></span><span id="ship-std-price"></span></label>
            <label class="choice"><input type="radio" name="versand" value="express"><span class="grow">${SHOP.shipping.express.label}<br><span class="sub">${SHOP.shipping.express.time}</span></span><span>${euro(SHOP.shipping.express.price)}</span></label>
          </section>
          <section class="step">
            <h2><span class="mono">04</span>Zahlung</h2>
            ${pay.map(([v, l, s], i) => `<label class="choice"><input type="radio" name="zahlung" value="${v}" ${i === 0 ? "checked" : ""}><span class="grow">${l}<br><span class="sub">${s}</span></span></label>`).join("")}
          </section>
          <section class="step">
            <div class="field" data-field="agb" style="margin-bottom:6px">
              <label class="check"><input type="checkbox" id="agb" required> <span>Ich habe die <a class="link" href="agb.html" target="_blank">AGB</a> und die <a class="link" href="widerruf.html" target="_blank">Widerrufsbelehrung</a> gelesen und akzeptiere sie. Hinweise zum Datenschutz finden Sie <a class="link" href="datenschutz.html" target="_blank">hier</a>.</span></label>
              <span class="error">Bitte bestätigen Sie die AGB.</span>
            </div>
            <label class="check"><input type="checkbox" id="nl-opt"> <span>Ich möchte den Newsletter erhalten (jederzeit abbestellbar).</span></label>
            <button class="btn block" type="submit" style="margin-top:20px">Zahlungspflichtig bestellen</button>
          </section>
        </form>
        <aside class="summary" id="summary"></aside>
      </div>`;
    renderSummaryBox();

    const form = $("#checkout-form");
    form.addEventListener("change", (e) => {
      if (e.target.name === "versand") renderSummaryBox();
    });
    form.addEventListener("input", (e) => {
      const f = e.target.closest(".field");
      if (f && f.classList.contains("invalid")) validateField(f);
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const fields = $$(".field", form);
      const bad = fields.filter((f) => !validateField(f));
      if (bad.length) {
        const first = $("input, select", bad[0]);
        first.focus();
        bad[0].scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      placeOrder(form);
    });
  }

  function validateField(f) {
    const input = $("input, select, textarea", f);
    let ok = true;
    const v = (input.value || "").trim();
    if (input.type === "checkbox") ok = !input.required || input.checked;
    else if (input.required && !v) ok = false;
    else if (input.type === "email" && v) ok = isEmail(v);
    else if (input.id === "plz") {
      const land = ($("#land") || {}).value;
      ok = land === "DE" || land === "FR" || land === "IT" ? /^\d{5}$/.test(v) : land === "NL" ? /^\d{4}\s?[A-Za-z]{2}$/.test(v) : /^\d{4}$/.test(v);
    }
    f.classList.toggle("invalid", !ok);
    input.setAttribute("aria-invalid", !ok);
    return ok;
  }

  function placeOrder(form) {
    const val = (id) => ($(`#${id}`, form).value || "").trim();
    const method = shippingMethod();
    const t = Cart.totals(method);
    const nr = `${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;
    const order = {
      nr,
      date: new Date().toISOString(),
      items: Cart.items(),
      totals: t,
      shipping: method,
      payment: $('input[name="zahlung"]:checked', form).value,
      gift: !!Cart.meta().gift,
      address: { email: val("email"), name: `${val("vorname")} ${val("nachname")}`, street: val("strasse"), extra: val("zusatz"), zip: val("plz"), city: val("ort"), country: val("land") },
    };
    store.set("orders", [...store.get("orders", []), order]);
    Cart.clear();
    const days = method === "express" ? SHOP.shipping.express.time : SHOP.shipping.standard.time;
    $("#checkout").innerHTML = `
      <div class="confirm narrow" style="margin:0 auto">
        <p class="mono">Bestellnummer ${esc(nr)}</p>
        <h1>Vielen Dank, ${esc(val("vorname"))}.</h1>
        <p>Ihre Bestellung über ${euro(t.total)} ist eingegangen. Eine Bestätigung geht an <strong>${esc(order.address.email)}</strong>. Lieferzeit: ${days}.</p>
        <p class="mono">Testbetrieb: Es wurde nichts abgebucht und nichts versendet.</p>
        <a class="btn" href="shop.html" style="margin-top:16px">Weiter einkaufen</a>
      </div>`;
    window.scrollTo(0, 0);
  }

  /* ---------- Merkliste ---------- */
  function renderWishlist() {
    const ids = Wish.ids();
    $("#wish-count").textContent = `${ids.length} Artikel`;
    $("#wishlist").innerHTML = ids.length
      ? `<div class="grid">${ids.map((id) => productCard(byId(id))).join("")}</div>`
      : `<div class="empty"><h3>Noch nichts gemerkt</h3><p>Tippen Sie auf das Herz bei einem Artikel, um ihn hier zu speichern.</p><a class="btn ghost" href="shop.html">Zur Kollektion</a></div>`;
    revealAll();
  }

  /* ---------- Kontakt ---------- */
  function bindContact() {
    const form = $("#contact-form");
    const orderField = $('[data-field="bestellnr"]', form);
    const topic = $("#betreff", form);
    const syncOrder = () => (orderField.style.display = ["bestellung", "rueckgabe"].includes(topic.value) ? "" : "none");
    topic.addEventListener("change", syncOrder);
    syncOrder();
    form.addEventListener("input", (e) => {
      const f = e.target.closest(".field");
      if (f && f.classList.contains("invalid")) validateField(f);
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const bad = $$(".field", form).filter((f) => f.style.display !== "none" && !validateField(f));
      if (bad.length) return $("input, select, textarea", bad[0]).focus();
      form.innerHTML = `<div class="notice" style="background:var(--paper);padding:32px"><h3>Vielen Dank für Ihre Nachricht.</h3><p style="margin-top:12px">Wir antworten in der Regel innerhalb eines Werktages.</p><p class="mono">Testbetrieb: Die Nachricht wurde nicht wirklich versendet.</p></div>`;
    });
  }

  /* ---------- Start ---------- */
  renderLayout();
  bindGlobal();
  refreshCounts();

  if (page === "home") renderHome();
  if (page === "shop") {
    renderShop();
    bindShop();
  }
  if (page === "produkt") renderProduct();
  if (page === "warenkorb") renderCartPage();
  if (page === "kasse") renderCheckout();
  if (page === "merkliste") renderWishlist();
  if (page === "kontakt") bindContact();
  if ($("#about-img")) $("#about-img").innerHTML = garmentSVG("cardigan", colorOf("salbei").hex);
  $$("[data-render='sizetable']").forEach((el) => (el.innerHTML = sizeTable()));
  revealAll();
})();
