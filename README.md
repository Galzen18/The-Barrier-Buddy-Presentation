# Barrier Buddy — website

Marketing site for **Barrier Buddy by AluFacade**: Canadian-made aluminum privacy panel fences and gates.
Every page is built to push visitors to **Get a Free Quote**.

Plain static HTML/CSS/JS with no build step. Host it on any static host (GitHub Pages, Netlify, Cloudflare Pages, or regular hosting).

## Pages

| File | Page |
|---|---|
| `index.html` | Home: hero, intro, product line, Products / Gallery / Build / Contact tiles, why Barrier Buddy, stats, how it works, audiences, fun fact, quote form |
| `products.html` | The Barrier Buddy fence and Gate, panel profiles (courses), 24 colours/textures/woodgrains, product photos, hardware, technical specs and parts lists |
| `configurator.html` | **Build Your Fence**: panel spacing (touching = max 6′×6′, 100% privacy; 0.5″–1″ separators = up to 24′ long × 8′ high, ≈90% privacy), post height, post distance, number of sections (or total length), panel size, colour, texture, finish, post colour, gate (aluminum or frosted glass, width, position), installation surface. Live to-scale preview, shareable link, sends the design to the quote form |
| `gallery.html` | Gallery: project photos, finishes and design concepts, with filters and a lightbox |
| `why.html` | Why go Barrier Buddy: private, aesthetic, durable, competitive pricing |
| `about.html` | AluFacade subsidiary story, factory capabilities, locations with maps, warranty |
| `contact.html` | Full quote form, locations, FAQ |

## Before going live

1. **Activate the quote form email.** Quote requests are emailed to **info@barrierbuddy.ca** through FormSubmit (`BB_CONFIG.quoteEndpoint` in `assets/js/main.js`).
   After the site is live, send one test quote: FormSubmit emails info@barrierbuddy.ca an activation link. Click **Activate Form**. Requests are not delivered until you do.
   To use another service (Formspree, a CRM webhook…), replace the endpoint URL.
2. **Phone number:** none is listed yet. Add it to the footer (`site-footer` in each page) and to `contact.html` if wanted.
3. **More job photos:** put images in `assets/img/` and add entries to the `GALLERY` array in `assets/js/gallery.js` with `cats: ["projects"]`.

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
