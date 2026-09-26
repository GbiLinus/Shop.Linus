# Bibliotheken (lokal, ohne CDN)

Lokal eingebunden, damit keine Verbindung zu fremden Servern entsteht (DSGVO).

| Datei | Bibliothek | Version | Lizenz |
|---|---|---|---|
| `gsap.min.js` | GSAP (Animationen) | 3.15.0 | GSAP Standard License, kostenlos, auch kommerziell: https://gsap.com/standard-license |
| `ScrollTrigger.min.js` | GSAP ScrollTrigger (Animation an Scrollen koppeln) | 3.15.0 | wie GSAP |
| `Flip.min.js` | GSAP Flip (flüssige Übergänge zwischen Zuständen) | 3.15.0 | wie GSAP |
| `lenis.min.js`, `lenis.css` | Lenis (weiches Scrollen) | 1.3.26 | MIT, siehe `LICENSE-lenis.txt` |

Die **View Transitions API** ist im Browser eingebaut und braucht keine Datei. Sie ist in `assets/style.css` eingeschaltet (`@view-transition`).

Einbinden auf einer Seite (Reihenfolge wichtig, vor `assets/app.js`):

```html
<link rel="stylesheet" href="assets/vendor/lenis.css">
<script src="assets/vendor/gsap.min.js"></script>
<script src="assets/vendor/ScrollTrigger.min.js"></script>
<script src="assets/vendor/Flip.min.js"></script>
<script src="assets/vendor/lenis.min.js"></script>
```

Aktualisieren: `npm pack gsap lenis`, dann die Dateien aus `package/dist/` hierher kopieren.
