# Barrier Buddy — website

Marketing site for **Barrier Buddy by AluFacade**: Canadian-made aluminum privacy panel fences and gates.
Every page is built to push visitors to **Get a Free Quote**.

Plain static HTML/CSS/JS with no build step. Host it on any static host (GitHub Pages, Netlify, Cloudflare Pages, or regular hosting).

## Pages

| File | Page |
|---|---|
| `index.html` | Home: hero, intro, product line, Products / Portfolio / Build / Contact tiles, why Barrier Buddy, stats, how it works, audiences, fun fact, quote form |
| `products.html` | The Barrier Buddy fence and Gate, panel profiles (courses), 24 colours/textures/woodgrains, hardware, technical drawings and parts lists |
| `configurator.html` | **Build Your Fence**: post height, post distance, number of sections (or total length), panel size, colour, texture, finish, post colour, gate (aluminum or frosted glass, width, position), installation surface. Live to-scale preview, shareable link, sends the design to the quote form |
| `gallery.html` | Portfolio with filters and a lightbox |
| `about.html` | AluFacade subsidiary story, factory capabilities, locations with maps, warranty |
| `contact.html` | Full quote form, locations, FAQ |

## Before going live

1. **Connect the quote form.** In `assets/js/main.js`, set `BB_CONFIG.quoteEndpoint` to a form endpoint (Formspree, Basin, Getform, a CRM webhook…).
   Until you do, the forms run in demo mode: visitors see the thank-you message but **no submission is sent**.
2. **Add phone and email** to the footer (`site-footer` in each page) and to `contact.html`.
3. **Add real job photos** to the portfolio: put images in `assets/img/projects/` and add entries to the `GALLERY` array in `assets/js/gallery.js` with `cats: ["projects"]` and `tag: "Project"`.
   The two "Inspiration" photos came from the presentation and are not Barrier Buddy installs.

## Structure

```
assets/css/styles.css        design system (colours, type and layout from the presentation)
assets/js/main.js            nav, scroll reveal, quote forms (+ attaches configurator designs)
assets/js/fence-render.js    SVG fence/gate renderer used by the configurator, products and gallery
assets/js/configurator.js    Build Your Fence logic (state is kept in the URL hash)
assets/js/gallery.js         portfolio data, filters, lightbox
assets/img/                  product photos, finish swatches, technical drawings
```

Header and footer are repeated in each HTML file. If you change the nav, update all six pages.

Run it locally with `python3 -m http.server` and open http://localhost:8000.
