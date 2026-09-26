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
  const brandOf = (id) => BRANDS.find((b) => b.id === id);
  const brandName = (id) => (brandOf(id) || {}).name || "";
  const deptName = (id) => (DEPARTMENTS.find((d) => d.id === id) || {}).name || "";
  const storeUrl = (id) => `laden.html?marke=${id}`;
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
      ["index.html", "Aufzug", page === "home"],
      ...DEPARTMENTS.map((d) => [`shop.html?abteilung=${d.id}`, d.name, page === "shop" && params.get("abteilung") === d.id]),
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
              <a href="#marken" data-action="brands"${page === "laden" ? ' aria-current="page"' : ""}>Marken</a>
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
              <p>Neue Marken, neue Kollektionen und Einladungen aus dem Haus. Höchstens einmal im Monat.</p>
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
              <li><a href="index.html">Aufzug</a></li>
              ${DEPARTMENTS.map((d) => `<li><a href="shop.html?abteilung=${d.id}">${d.name}</a></li>`).join("")}
              <li><a href="shop.html?neu=1">Neuheiten</a></li>
              <li><a href="ueber-uns.html">Über uns</a></li></ul></div>
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
        <div class="drawer-body" id="drawer-body" data-lenis-prevent></div>
        <div class="drawer-foot" id="drawer-foot"></div>
      </aside>

      <div class="search" id="search" aria-hidden="true" data-lenis-prevent>
        <div class="wrap">
          <form action="shop.html" role="search">
            <label class="sr-only" for="q">Suche</label>
            <input id="q" name="q" type="search" placeholder="Wonach suchen Sie?" autocomplete="off">
            <button type="button" data-action="close" aria-label="Suche schließen">${ICON.close}</button>
          </form>
          <div class="search-results" id="search-results"></div>
        </div>
      </div>

      <div class="mobile-menu" id="mobile-menu" aria-hidden="true" data-lenis-prevent>
        <div class="top"><span class="logo">${esc(SHOP.brand)}</span><button data-action="close" aria-label="Menü schließen">${ICON.close}</button></div>
        <nav aria-label="Mobile Navigation">
          <a href="index.html">Aufzug</a>
          ${DEPARTMENTS.map((d) => `<a href="shop.html?abteilung=${d.id}">${d.name}</a>`).join("")}
          <a href="#marken" data-action="brands">Marken</a>
          <a href="shop.html?neu=1">Neuheiten</a>
        </nav>
        <div class="small caps"><a href="merkliste.html">Merkliste</a><a href="kontakt.html">Kontakt</a><a href="service.html">Kundenservice</a></div>
      </div>

      <div class="modal" id="modal" role="dialog" aria-modal="true" aria-hidden="true" data-lenis-prevent>
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
    if (lenis) lenis.stop();
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
    if (lenis && !document.querySelector(".entering")) lenis.start();
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
          <span class="main">${garmentImg(p.type, hex, "front")}</span>
          <span class="alt">${garmentImg(p.type, hex, "detail")}</span>
          ${p.isNew ? `<span class="badge">Neu</span>` : ""}
        </a>
        <button class="wish" data-action="wish" data-id="${p.id}" aria-pressed="${wished}" aria-label="${esc(p.name)} auf die Merkliste">${ICON.heart}</button>
        <div class="info">
          <a class="brand-line" href="${storeUrl(p.brand)}">${esc(brandName(p.brand))}</a>
          <a class="name" href="${productUrl(p)}">${esc(p.name)}</a>
          <span class="price">${euro(p.price)}</span>
          ${opts.noColors ? "" : `<div class="colors">${p.colors.map((c) => `<span class="dot" style="background:${colorOf(c).hex}" title="${colorOf(c).name}"></span>`).join("")}<span>${p.colors.length > 1 ? `${p.colors.length} Farben` : colorOf(color).name}</span></div>`}
        </div>
      </article>`;
  }

  function brandsList() {
    return `
      <h3>Alle Marken</h3>
      <p class="mono" style="margin:8px 0 20px">${BRANDS.length} Etagen, ${BRANDS.length} Marken</p>
      <div class="brand-list">
        ${BRANDS.map(
          (b, i) => `<a href="${storeUrl(b.id)}" style="--sb:${b.signBg};--sf:${b.signFg}">
            <span class="mono">N°${String(i + 1).padStart(2, "0")}</span><span class="bl-name">${esc(b.name)}</span>
            <span class="bl-sw"></span></a>`
        ).join("")}
      </div>
      <p style="margin-top:20px"><a class="link caps" href="shop.html">Alle Artikel aller Marken</a></p>`;
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
        <a class="thumb" href="${productUrl(p, i.color)}">${garmentImg(p.type, colorOf(i.color).hex)}</a>
        <div class="meta">
          <div style="display:flex;justify-content:space-between;gap:12px"><a href="${productUrl(p, i.color)}">${esc(p.name)}</a><span>${euro(p.price * i.qty)}</span></div>
          <span class="sub">${esc(brandName(p.brand))} · ${colorOf(i.color).name} · ${esc(i.size)}</span>
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
      const hay = [p.name, brandName(p.brand), deptName(p.gender), catName(p.category), p.material, p.description, ...p.colors.map((c) => colorOf(c).name)].join(" ").toLowerCase();
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
      else if (a === "brands") {
        e.preventDefault();
        openModal(brandsList());
      }
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
    const fresh = [];
    BRANDS.forEach((b) => {
      const p = PRODUCTS.find((x) => x.brand === b.id && x.isNew && !fresh.includes(x));
      if (p && fresh.length < 4) fresh.push(p);
    });
    $("#home-new").innerHTML = fresh.map((p) => productCard(p)).join("");
    renderPassage();
  }

  /* ---------- Weiches Scrollen (Lenis) ---------- */
  let lenis = null;
  function initSmooth() {
    if (lenis || !window.Lenis || matchMedia("(prefers-reduced-motion: reduce)").matches) return lenis;
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9 });
    if (window.gsap && window.ScrollTrigger) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => {
        lenis.raf(t);
        requestAnimationFrame(raf);
      };
      requestAnimationFrame(raf);
    }
    return lenis;
  }
  function scrollToY(y, opts = {}) {
    if (lenis) lenis.scrollTo(y, { duration: 1.2, ...opts });
    else window.scrollTo({ top: y, behavior: opts.immediate ? "auto" : "smooth" });
  }

  /* ---------- Der gläserne Aufzug (Startseite) ---------- */
  function storeFacade(b, i) {
    const n = String(i + 1).padStart(2, "0");
    const own = PRODUCTS.filter((p) => p.brand === b.id);
    const pick = (g) => own.find((p) => p.gender === g) || own[0];
    const win = (p) => `
      <div class="win">
        <div class="win-in">
          <span class="spot"></span>
          ${garmentImg(p.type, colorOf(p.colors[0]).hex, "front", { transparent: true })}
          <span class="plinth"></span>
        </div>
        <span class="glass"></span>
      </div>`;
    const vars = `--wall:${b.wall};--trim:${b.trim};--sb:${b.signBg};--sf:${b.signFg};--int:${b.interior}${b.awning ? `;--aw1:${b.awning[0]};--aw2:${b.awning[1]}` : ""}`;
    return `
      <a class="store" href="${storeUrl(b.id)}" id="laden-${b.id}" data-brand="${b.id}" data-material="${b.material}" data-window="${b.window}" data-font="${b.font}" style="${vars}" aria-label="${esc(b.name)} betreten">
        <div class="sign"><span class="sign-n">N°${n}</span><span class="sign-b">${esc(b.name)}</span></div>
        ${b.awning ? `<div class="awning"></div>` : ""}
        <div class="front">
          ${win(pick("damen"))}
          <div class="door"><span class="leaf l"></span><span class="leaf r"></span></div>
          ${win(pick("herren"))}
        </div>
        <div class="plate"><span>${esc(b.name)}</span><span>Damen · Herren · Unisex</span></div>
        <span class="enter-hint caps">Eintreten</span>
      </a>`;
  }

  function directory() {
    return `<ol class="directory-board">${BRANDS.map((b, i) => `<li><a href="${storeUrl(b.id)}" data-go="${i + 1}"><span class="mono">${String(i + 1).padStart(2, "0")}</span>${esc(b.name)}</a></li>`).join("")}</ol>`;
  }

  function renderPassage() {
    const root = $("#lift");
    if (!root) return;
    const floorsEl = $("#floors");
    const N = BRANDS.length;

    // Etage 0 = Eingang, Etage 1–10 = Läden. Dazwischen die schwarze Schicht.
    floorsEl.innerHTML =
      `<section class="lvl lobby" data-floor="0">
         <div class="ceil"></div>
         <div class="stage">
           <div>
             <p class="mono">Eingang · ${N} Etagen · ${N} Marken</p>
             <h1>${esc(SHOP.brand)}<em>${esc(SHOP.claim)}</em></h1>
             <p class="wp-text">Steigen Sie ein. Scrollen fährt den gläsernen Aufzug, jede Etage ist ein Laden. Das Tastenfeld rechts bringt Sie direkt ans Ziel.</p>
             <span class="walk-hint caps">Nach unten scrollen</span>
           </div>
           ${directory()}
         </div>
         <div class="ground"></div>
       </section>` +
      BRANDS.map(
        (b, i) => `
        <div class="gap" aria-hidden="true"><span>Etage ${String(i + 1).padStart(2, "0")}</span></div>
        <section class="lvl" data-floor="${i + 1}">
          <div class="ceil"></div>
          <div class="floor-label"><span class="fl-no">${String(i + 1).padStart(2, "0")}</span><strong>${esc(b.name)}</strong><span class="mono">Damen · Herren · Unisex</span></div>
          <div class="stage">${storeFacade(b, i)}</div>
          <div class="ground"></div>
        </section>`
      ).join("");

    $("#cab-panel").innerHTML =
      `<span class="ph-title">Etage</span><button class="lobby-btn on" data-go="0" aria-label="Eingang">E</button>` +
      BRANDS.map((b, i) => `<button data-go="${i + 1}" data-name="${esc(b.name)}" aria-label="Etage ${i + 1}: ${esc(b.name)}">${i + 1}</button>`).join("");

    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !window.gsap || !window.ScrollTrigger) {
      root.classList.add("static");
      $$(".lvl", floorsEl).forEach((l) => l.classList.add("locked"));
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
    initSmooth();

    const header = $("#header");
    const levels = $$(".lvl", floorsEl);
    const stores = levels.map((l) => $(".store", l));
    const cabDoors = $$(".cab-door", root);
    const dNum = $("#d-num");
    const dName = $("#d-name");
    const dArrow = $("#d-arrow");
    const buttons = $$("#cab-panel button");
    let H = 0; // Höhe einer Etage
    let G = 0; // Höhe der schwarzen Schicht
    let pitch = 1;
    let total = 1;

    const measure = () => {
      H = root.clientHeight;
      G = Math.round(H * 0.3);
      pitch = H + G;
      total = N * pitch;
      root.style.setProperty("--fh", `${H}px`);
      root.style.setProperty("--gh", `${G}px`);
    };
    measure();

    const setY = gsap.quickSetter(floorsEl, "y", "px");
    let floor = -1; // Etage, an der der Aufzug gerade steht (oder zuletzt stand)
    let shown = -1;
    let lastY = 0;
    let doorsOpen = false;
    let travelling = false;
    let busy = false;

    const doorTl = gsap.timeline({ paused: true });
    doorTl.to(cabDoors[0], { xPercent: -100, duration: 0.7, ease: "power2.inOut" }, 0).to(cabDoors[1], { xPercent: 100, duration: 0.7, ease: "power2.inOut" }, 0);

    const storeDoors = (i, open) => {
      const s = stores[i];
      if (!s) return;
      gsap.to($$(".leaf", s), { xPercent: (k) => (open ? (k ? 100 : -100) : 0), duration: open ? 0.7 : 0.35, ease: "power2.inOut", overwrite: true });
    };

    const display = (k, dir) => {
      if (k === shown && dArrow.dataset.dir === String(dir)) return;
      shown = k;
      dArrow.dataset.dir = dir;
      dArrow.textContent = dir > 0 ? "▼" : dir < 0 ? "▲" : "•";
      dNum.textContent = k === 0 ? "E" : String(k).padStart(2, "0");
      dName.textContent = k === 0 ? SHOP.brand : BRANDS[k - 1].name;
      buttons.forEach((b) => b.classList.toggle("on", Number(b.dataset.go) === k));
    };

    const open = (k) => {
      if (doorsOpen && floor === k) return;
      floor = k;
      doorsOpen = true;
      levels[k].classList.add("locked");
      if (stores[k]) stores[k].classList.add("active");
      doorTl.timeScale(1).play();
    };
    const close = () => {
      if (!doorsOpen) return;
      doorsOpen = false;
      levels[floor].classList.remove("locked");
      if (stores[floor]) stores[floor].classList.remove("active");
      doorTl.timeScale(2).reverse();
    };

    const nearest = (y) => Math.max(0, Math.min(N, Math.round(y / pitch)));
    const idle = gsap.delayedCall(0.2, () => {
      const k = nearest(lastY);
      if (Math.abs(lastY - k * pitch) < 3 && !travelling) open(k);
    }).pause();

    const st = ScrollTrigger.create({
      trigger: root,
      start: () => `top ${header.offsetHeight}px`,
      end: () => `+=${total}`,
      pin: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onRefresh: (self) => {
        lastY = self.progress * total;
        setY(-lastY);
      },
      snap: {
        snapTo: (v) => Math.round(v * N) / N,
        duration: { min: 0.3, max: 0.8 },
        delay: 0.12,
        ease: "power2.inOut",
      },
      onUpdate: (self) => {
        const y = self.progress * total;
        const dir = y > lastY ? 1 : y < lastY ? -1 : 0;
        lastY = y;
        setY(-y);
        const k = nearest(y);
        const off = Math.abs(y - k * pitch);
        if (off > 3) close();
        display(k, off > 3 ? dir : 0);
        idle.restart(true);
      },
    });
    ScrollTrigger.addEventListener("refreshInit", measure);
    if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
    display(0, 0);
    idle.restart(true);

    const yFor = (k) => st.start + k * pitch;
    const ride = (k, then) => {
      const from = nearest(lastY);
      travelling = true;
      close();
      scrollToY(yFor(k), {
        duration: Math.min(2.4, 0.7 + Math.abs(k - from) * 0.22),
        easing: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
        onComplete: () => {
          travelling = false;
          open(k);
          if (then) gsap.delayedCall(0.75, then);
        },
      });
      if (!lenis)
        setTimeout(() => {
          travelling = false;
          open(k);
          if (then) setTimeout(then, 750);
        }, 1200);
    };

    // Laden betreten: Kamera bleibt stehen, Türen offen, Überblendung in den Laden
    const enter = (a) => {
      if (busy) return;
      busy = true;
      if (lenis) lenis.stop();
      const b = brandOf(a.dataset.brand);
      const veil = $("#veil");
      veil.style.background = b.interior;
      // Die Ladentür geht erst beim Klick auf, dann Überblendung in den Laden
      storeDoors(stores.indexOf(a), true);
      gsap.to(veil, { opacity: 1, duration: 0.5, delay: 0.55, ease: "power1.in", onComplete: () => (location.href = a.href) });
    };

    floorsEl.addEventListener("click", (e) => {
      const go = e.target.closest("[data-go]");
      if (go) {
        e.preventDefault();
        return ride(Number(go.dataset.go));
      }
      const a = e.target.closest(".store");
      if (!a || busy) return;
      e.preventDefault();
      const k = stores.indexOf(a);
      if (doorsOpen && floor === k && Math.abs(window.scrollY - yFor(k)) < 4) enter(a);
      else ride(k, () => enter(a));
    });
    $("#cab-panel").addEventListener("click", (e) => {
      const b = e.target.closest("[data-go]");
      if (b) ride(Number(b.dataset.go));
    });
    document.addEventListener("click", (e) => {
      const g = e.target.closest(".modal [data-go], .brand-list a");
      if (!g || !$("#lift")) return;
      const id = (g.getAttribute("href") || "").split("marke=")[1];
      const k = BRANDS.findIndex((b) => b.id === id) + 1;
      if (k > 0) {
        e.preventDefault();
        closeOverlays();
        ride(k);
      }
    });

    // Zurück aus einem Laden: Aufzug steht auf dieser Etage
    const fromHash = BRANDS.findIndex((b) => `#${b.id}` === location.hash) + 1;
    if (fromHash > 0) {
      ScrollTrigger.refresh();
      scrollToY(yFor(fromHash), { immediate: true });
      gsap.delayedCall(0.3, () => open(fromHash));
    }

    window.addEventListener("pageshow", (e) => {
      if (!e.persisted) return;
      busy = false;
      gsap.set("#veil", { opacity: 0 });
      gsap.set($$(".store .leaf", floorsEl), { xPercent: 0 });
      if (lenis) lenis.start();
    });
  }

  /* ---------- Im Laden: Etagen ---------- */
  function slab(from, to) {
    return `
      <div class="slab" aria-hidden="true">
        <div class="slab-layers">
          <div class="layer l-parkett"></div>
          <div class="layer l-estrich"></div>
          <div class="layer l-daemm"></div>
          <div class="layer l-beton"></div>
          <div class="layer l-decke"></div>
        </div>
        <div class="slab-labels mono">
          <span>Parkett 22 mm</span><span>Estrich 60 mm</span><span>Trittschall 30 mm</span><span>Stahlbeton 250 mm</span><span>Abhangdecke</span>
        </div>
        <div class="slab-count"><span class="mono">Etage</span><div class="roll"><span>${from}</span><span>${to}</span></div></div>
      </div>`;
  }

  function renderStore() {
    const root = $("#store");
    const b = brandOf(params.get("marke"));
    if (!b) {
      root.innerHTML = `<div class="wrap empty"><h2>Laden nicht gefunden</h2><p>Diesen Laden gibt es nicht.</p><a class="btn ghost" href="index.html">Zum Aufzug</a></div>`;
      return;
    }
    document.title = `${b.name} — ${SHOP.brand}`;
    const vars = { "--int": b.interior, "--ink-s": b.ink, "--sb": b.signBg, "--sf": b.signFg, "--trim": b.trim, "--wall": b.wall };
    Object.entries(vars).forEach(([k, v]) => document.body.style.setProperty(k, v));
    document.body.classList.add("in-store");
    document.body.dataset.font = b.font;
    const own = PRODUCTS.filter((p) => p.brand === b.id);
    const idx = BRANDS.indexOf(b);
    const prev = BRANDS[idx - 1];
    const next = BRANDS[idx + 1];

    let html = `
      <section class="foyer">
        <a class="back-passage caps" href="index.html#${b.id}">← Zurück zum Aufzug</a>
        <div class="store-sign"><span class="sign-n">N°${String(idx + 1).padStart(2, "0")}</span><span class="sign-b">${esc(b.name)}</span></div>
        <p class="lead">Willkommen. Drei Etagen, ${own.length} Teile.</p>
        <nav class="lift-panel" aria-label="Etagen">
          ${DEPARTMENTS.map((d) => {
            const n = own.filter((p) => p.gender === d.id).length;
            return `<button data-floor="${d.id}"><span class="fl">${d.floor}</span><span class="fl-name">${d.name}</span><span class="mono">${n} Teile</span></button>`;
          }).join("")}
        </nav>
        <span class="scroll-hint corner-hint">Nach unten: Etagen</span>
      </section>`;

    DEPARTMENTS.forEach((d, i) => {
      if (i > 0) html += slab(DEPARTMENTS[i - 1].floor, d.floor);
      const items = own.filter((p) => p.gender === d.id);
      const cats = CATEGORIES.filter((c) => items.some((p) => p.category === c.id));
      html += `
        <section class="level" id="etage-${d.id}" data-floor="${d.floor}">
          <div class="wrap">
            <header class="level-head">
              <span class="fl-big">${d.floor}</span>
              <div><span class="eyebrow">${d.floorName}</span><h2>${d.name}</h2></div>
              <a class="link caps" href="shop.html?marke=${b.id}&abteilung=${d.id}">Alle ${d.name} · ${items.length}</a>
            </header>
            <div class="shelves">
              ${cats
                .map((c) => {
                  const inCat = items.filter((p) => p.category === c.id);
                  const p = inCat[0];
                  return `<a class="shelf reveal" href="shop.html?marke=${b.id}&abteilung=${d.id}&kategorie=${c.id}">
                    <div class="shelf-img">${garmentImg(p.type, colorOf(p.colors[0]).hex, "front", { transparent: true })}<span class="rail"></span></div>
                    <span class="shelf-name">${c.name}</span><span class="mono">${inCat.length} ${inCat.length === 1 ? "Teil" : "Teile"}</span></a>`;
                })
                .join("")}
            </div>
          </div>
        </section>`;
    });

    html += `
      <section class="store-exit wrap">
        <p class="mono">Nachbarläden</p>
        <div class="neighbours">
          ${prev ? `<a href="${storeUrl(prev.id)}" style="--sb:${prev.signBg};--sf:${prev.signFg}"><span class="caps">← Links</span><span class="nb-sign">${esc(prev.name)}</span></a>` : "<span></span>"}
          <a class="btn ghost" href="index.html#${b.id}">Zurück zum Aufzug</a>
          ${next ? `<a href="${storeUrl(next.id)}" style="--sb:${next.signBg};--sf:${next.signFg}"><span class="caps">Rechts →</span><span class="nb-sign">${esc(next.name)}</span></a>` : "<span></span>"}
        </div>
      </section>
      <div class="lift" aria-hidden="true"><span class="lift-arrow">▲</span><span class="lift-n" id="lift-n">EG</span></div>`;
    root.innerHTML = html;

    initSmooth();
    const levelTop = (id) => $(`#etage-${id}`).getBoundingClientRect().top + window.scrollY - $("#header").offsetHeight;
    root.addEventListener("click", (e) => {
      const f = e.target.closest("[data-floor]");
      if (f && f.tagName === "BUTTON") scrollToY(levelTop(f.dataset.floor), { duration: 1.6 });
    });

    const liftN = $("#lift-n");
    const liftArrow = $(".lift-arrow");
    const setFloor = (fl, dir) => {
      liftN.textContent = fl;
      liftArrow.textContent = dir < 0 ? "▼" : "▲";
    };
    if (!window.gsap || !window.ScrollTrigger || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      $$(".level").forEach((l) => new IntersectionObserver((en) => en[0].isIntersecting && setFloor(l.dataset.floor, 1), { rootMargin: "-50% 0px" }).observe(l));
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    $$(".level").forEach((l) =>
      ScrollTrigger.create({ trigger: l, start: "top 55%", end: "bottom 55%", onToggle: (self) => self.isActive && setFloor(l.dataset.floor, self.direction) })
    );
    // Querschnitt des Bodens: Schichten verschieben sich, die Etagenzahl rollt
    $$(".slab").forEach((s) => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: s, start: "top bottom", end: "bottom top", scrub: 0.6 } });
      $$(".layer", s).forEach((layer, k) => tl.fromTo(layer, { xPercent: k % 2 ? -6 : 6 }, { xPercent: k % 2 ? 6 : -6, ease: "none" }, 0));
      tl.fromTo($(".slab-labels", s), { xPercent: 4 }, { xPercent: -4, ease: "none" }, 0);
      tl.fromTo($(".roll", s), { yPercent: 0 }, { yPercent: -50, ease: "power2.inOut", duration: 0.3 }, 0.35);
    });
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
    abteilung: params.get("abteilung") || "",
    marke: params.get("marke") || "",
    neu: params.get("neu") === "1",
    q: params.get("q") || "",
    farbe: (params.get("farbe") || "").split(",").filter(Boolean),
    groesse: (params.get("groesse") || "").split(",").filter(Boolean),
    preis: params.get("preis") || "",
    sort: params.get("sort") || "empfohlen",
  };
  const PAGE = 24;
  let shopShown = PAGE;

  function shopFiltered() {
    const s = shopState;
    let list = s.q ? searchProducts(s.q) : PRODUCTS.slice();
    if (s.kategorie) list = list.filter((p) => p.category === s.kategorie);
    if (s.abteilung) list = list.filter((p) => p.gender === s.abteilung);
    if (s.marke) list = list.filter((p) => p.brand === s.marke);
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
    if (s.marke) p.set("marke", s.marke);
    if (s.abteilung) p.set("abteilung", s.abteilung);
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

  function renderShop(more = false) {
    const s = shopState;
    shopShown = more ? shopShown + PAGE : PAGE;
    const parts = [s.marke && brandName(s.marke), s.abteilung && deptName(s.abteilung), s.kategorie && catName(s.kategorie), s.neu && "Neuheiten"].filter(Boolean);
    const title = s.q ? `Suche: „${s.q}“` : parts.length ? parts.join(" · ") : "Alle Artikel";
    document.title = `${title} — ${SHOP.brand}`;
    $("#shop-title").textContent = title;
    $("#shop-crumbs").innerHTML =
      `<a href="index.html">Start</a>` +
      (s.marke ? `<span>/</span><a href="${storeUrl(s.marke)}">${esc(brandName(s.marke))}</a>` : "") +
      (s.abteilung ? `<span>/</span><span>${deptName(s.abteilung)}</span>` : "");
    const store = brandOf(s.marke);
    $("#shop-store").innerHTML = store
      ? `<a class="store-back" href="${storeUrl(store.id)}" style="--sb:${store.signBg};--sf:${store.signFg}"><span class="bl-sw"></span>Zurück in den Laden</a>`
      : "";

    const chip = (label, active, data) => `<button class="chip${active ? " active" : ""}" ${data}>${label}</button>`;
    $("#chips").innerHTML =
      chip("Alle", !s.abteilung && !s.neu, 'data-chip=""') +
      DEPARTMENTS.map((d) => chip(d.name, s.abteilung === d.id, `data-chip="${d.id}"`)).join("") +
      chip("Neuheiten", s.neu, 'data-chip="neu"');

    const usedColors = [...new Set(PRODUCTS.flatMap((p) => p.colors))];
    const opt = (group, val, label, on, extra = "") => `<button class="opt" data-filter="${group}" data-val="${val}" aria-pressed="${on}">${extra}${label}</button>`;
    $("#filter-cats").innerHTML = CATEGORIES.map((c) => opt("kategorie", c.id, c.name, s.kategorie === c.id)).join("");
    $("#filter-brands").innerHTML = BRANDS.map((b) => opt("marke", b.id, esc(b.name), s.marke === b.id, `<span class="dot" style="background:${b.signBg}"></span>`)).join("");
    $("#filter-colors").innerHTML = usedColors.map((c) => opt("farbe", c, colorOf(c).name, s.farbe.includes(c), `<span class="dot" style="background:${colorOf(c).hex}"></span>`)).join("");
    $("#filter-sizes").innerHTML = SIZES.map((z) => opt("groesse", z, z, s.groesse.includes(z))).join("");
    $("#filter-prices").innerHTML = PRICE_RANGES.map(([id, label]) => opt("preis", id, label, s.preis === id)).join("");
    const nActive = s.farbe.length + s.groesse.length + (s.preis ? 1 : 0) + (s.kategorie ? 1 : 0) + (s.marke ? 1 : 0);
    $("#filter-toggle").textContent = `Filter${nActive ? ` (${nActive})` : ""}`;
    $("#sort").value = s.sort;

    const list = shopFiltered();
    $("#shop-count").textContent = `${list.length} ${list.length === 1 ? "Artikel" : "Artikel"}`;
    $("#shop-grid").innerHTML = list.length
      ? list.slice(0, shopShown).map((p) => productCard(p)).join("") +
        (list.length > shopShown
          ? `<div class="more" style="grid-column:1/-1;text-align:center;padding-top:24px"><p class="mono" style="margin-bottom:14px">${shopShown} von ${list.length}</p><button class="btn ghost" id="show-more">Mehr anzeigen</button></div>`
          : "")
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
      shopState.abteilung = v && v !== "neu" ? v : "";
      shopState.q = "";
      renderShop();
    });
    $("#filter-panel").addEventListener("click", (e) => {
      const b = e.target.closest("[data-filter]");
      if (b) {
        const { filter, val } = b.dataset;
        if (filter === "preis" || filter === "kategorie" || filter === "marke") shopState[filter] = shopState[filter] === val ? "" : val;
        else {
          const arr = shopState[filter];
          shopState[filter] = arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
        }
        renderShop();
      }
      if (e.target.closest("#filter-reset")) resetFilters();
    });
    $("#shop-grid").addEventListener("click", (e) => {
      if (e.target.closest("#show-more")) {
        const y = window.scrollY;
        renderShop(true);
        window.scrollTo(0, y);
        return;
      }
      if (e.target.closest("#reset-all")) {
        shopState.abteilung = "";
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
    shopState.kategorie = "";
    shopState.marke = "";
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
        .map(([v, label], i) => `<button class="shot" data-view="${v}" aria-label="${label} vergrößern">${garmentSVG(p.type, hex, v, { rich: true })}<span class="mono">${String(i + 1).padStart(2, "0")} / ${label}</span></button>`)
        .join("");
    };

    root.innerHTML = `
      <div class="pdp">
        <div class="gallery" id="gallery">${gallery()}</div>
        <div class="buybox">
          <nav class="crumbs" aria-label="Brotkrumen"><a href="index.html">Start</a><span>/</span><a href="${storeUrl(p.brand)}">${esc(brandName(p.brand))}</a><span>/</span><a href="shop.html?marke=${p.brand}&abteilung=${p.gender}">${deptName(p.gender)}</a><span>/</span><a href="shop.html?marke=${p.brand}&abteilung=${p.gender}&kategorie=${p.category}">${catName(p.category)}</a></nav>
          <a class="pdp-brand" href="${storeUrl(p.brand)}">${esc(brandName(p.brand))}</a>
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
        <div class="section-head"><h2>Mehr von ${esc(brandName(p.brand))}</h2><a class="link caps" href="${storeUrl(p.brand)}">Laden betreten</a></div>
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
      if (shot) openModal(garmentSVG(p.type, colorOf(color).hex, shot.dataset.view, { rich: true }), "zoom");
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
    const same = PRODUCTS.filter((x) => x.id !== p.id && x.brand === p.brand && x.gender === p.gender);
    const other = PRODUCTS.filter((x) => x.id !== p.id && x.brand !== p.brand && x.category === p.category);
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
            return `<div class="mini-item"><div class="thumb">${garmentImg(p.type, colorOf(i.color).hex)}<b>${i.qty}</b></div>
              <div>${esc(brandName(p.brand))}<br>${esc(p.name)}<br><span style="color:var(--muted)">${colorOf(i.color).name} · ${esc(i.size)}</span></div><span>${euro(p.price * i.qty)}</span></div>`;
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
  if (page === "laden") renderStore();
  if (page === "produkt") renderProduct();
  if (page === "warenkorb") renderCartPage();
  if (page === "kasse") renderCheckout();
  if (page === "merkliste") renderWishlist();
  if (page === "kontakt") bindContact();
  if ($("#about-img")) $("#about-img").innerHTML = garmentSVG("cardigan", colorOf("salbei").hex);
  $$("[data-render='sizetable']").forEach((el) => (el.innerHTML = sizeTable()));
  revealAll();
})();
