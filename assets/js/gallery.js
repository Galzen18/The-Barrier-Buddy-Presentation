/* ==========================================================================
   Barrier Buddy — portfolio / gallery
   To add a completed job: drop the photo in assets/img/projects/ and add an
   entry to GALLERY below with category "projects" and tag "Project".
   ========================================================================== */
(function () {
  "use strict";

  var GALLERY = [
    // ---- Photos ----
    { type: "photo", src: "assets/img/living-room-view.jpg", w: 1076, h: 717, cats: ["projects"], tag: "Inspiration",
      title: "Backyard privacy", text: "A dark horizontal privacy fence frames the pool and garden of a modern home." },
    { type: "photo", src: "assets/img/standard-configuration.jpg", w: 1338, h: 753, cats: ["gates", "projects"], tag: "Product",
      title: "Standard configuration", text: "6 ft × 6 ft Barrier Buddy in matte black with a 6 ft × 4 ft frosted glass gate." },
    { type: "photo", src: "assets/img/courtyard.jpg", w: 1180, h: 854, cats: ["projects"], tag: "Inspiration",
      title: "Courtyard retreat", text: "Full-height horizontal privacy walls turn a city courtyard into a private outdoor room." },
    { type: "photo", src: "assets/img/finish-samples.jpg", w: 1065, h: 533, cats: ["finishes"], tag: "Finishes",
      title: "Powder-coat finish samples", text: "Solid colours, textures and woodgrain on aluminum from our in-house coating line." },
    { type: "photo", src: "assets/img/slats.jpg", w: 1600, h: 900, cats: ["details"], tag: "Detail",
      title: "Matte black panel detail", text: "Interlocking AF103 aluminum panels create clean, continuous horizontal lines." },
    { type: "photo", src: "assets/img/hinge-1.jpg", w: 1116, h: 581, cats: ["details", "gates"], tag: "Hardware",
      title: "Fapim gate hinge", text: "Premium Italian Fapim hardware on every Barrier Buddy gate." },
    { type: "photo", src: "assets/img/hinge-2.jpg", w: 817, h: 357, cats: ["details", "gates"], tag: "Hardware",
      title: "Hinge in bronze", text: "Hardware finishes can be coordinated with your fence colour." },

    // ---- Design concepts (rendered live from the configurator engine) ----
    { type: "render", cats: ["concepts", "finishes"], tag: "Concept", title: "Walnut woodgrain run",
      text: "Three 6 ft bays, 21 courses, walnut woodgrain on aluminum.",
      cfg: { bays: 3, courses: 21, colourType: "wood", colour: "walnut" } },
    { type: "render", cats: ["concepts", "gates"], tag: "Concept", title: "Deep navy with centre gate",
      text: "5-course profile in deep navy with a matching aluminum-infill gate.",
      cfg: { bays: 2, courses: 5, colour: "deep-navy", gate: "aluminum", gateWidth: 4, gatePosition: "center", finish: "satin" } },
    { type: "render", cats: ["concepts", "gates"], tag: "Concept", title: "Ivory & frosted glass",
      text: "Soft-matte ivory panels with a 4 ft frosted glass gate.",
      cfg: { bays: 2, courses: 21, colour: "ivory", finish: "soft-matte", gate: "frosted", gateWidth: 4, gatePosition: "right", postColour: "matte-black" } },
    { type: "render", cats: ["concepts", "finishes"], tag: "Concept", title: "Charcoal fine sand",
      text: "4-course charcoal with a fine sand texture.",
      cfg: { bays: 3, courses: 4, colour: "charcoal", texture: "fine-sand" } },
    { type: "render", cats: ["concepts", "gates"], tag: "Concept", title: "Cedar with frosted gate",
      text: "Cedar woodgrain on aluminum, matte black posts and a frosted glass gate.",
      cfg: { bays: 2, courses: 21, colourType: "wood", colour: "cedar", postColour: "matte-black", gate: "frosted", gateWidth: 4, gatePosition: "left" } },
    { type: "render", cats: ["concepts"], tag: "Concept", title: "Forest green, 7 ft",
      text: "A taller 7 ft run in forest green with 6 courses.",
      cfg: { bays: 3, height: 7, courses: 6, colour: "forest-green" } },
    { type: "render", cats: ["concepts", "finishes"], tag: "Concept", title: "Bronze metallic",
      text: "3-course profile with a metallic bronze finish.",
      cfg: { bays: 3, courses: 3, colour: "bronze", finish: "metallic" } }
  ];

  var grid = document.getElementById("gallery");
  if (!grid || !window.BarrierBuddy || !BarrierBuddy.fence) return;

  function media(item, lazy) {
    if (item.type === "render") return BarrierBuddy.fence.render(item.cfg, { dims: false, person: false, title: item.title });
    return '<img src="' + item.src + '" width="' + item.w + '" height="' + item.h + '" alt="' + item.title + ' — ' + item.text + '"' + (lazy ? ' loading="lazy"' : "") + ">";
  }

  var html = GALLERY.map(function (item, i) {
    return '<figure class="gallery__item reveal is-visible" data-cats="' + item.cats.join(" ") + '">' +
      '<span class="gallery__tag">' + item.tag + "</span>" +
      '<button class="gallery__btn" type="button" data-index="' + i + '" aria-label="Enlarge: ' + item.title + '">' + media(item, i > 2) + "</button>" +
      '<figcaption class="gallery__cap"><strong>' + item.title + "</strong><span>" + item.text + "</span></figcaption></figure>";
  });
  html.splice(6, 0,
    '<div class="gallery__item gallery__cta" data-cats="all-only"><h3>Like what you see?</h3><p>Every Barrier Buddy is built to order in our Quebec factory. Tell us about your space and get a free quote.</p><a class="btn btn--light" href="contact.html#quote">Get a Free Quote</a></div>');
  grid.innerHTML = html.join("");

  // Filters
  var buttons = document.querySelectorAll("[data-filter]");
  buttons.forEach(function (b) {
    b.addEventListener("click", function () {
      var f = b.dataset.filter;
      buttons.forEach(function (o) { o.setAttribute("aria-pressed", String(o === b)); o.setAttribute("aria-selected", String(o === b)); });
      grid.querySelectorAll(".gallery__item").forEach(function (el) {
        var cats = el.dataset.cats.split(" ");
        el.hidden = !(f === "all" || cats.indexOf(f) > -1);
      });
    });
  });
  buttons.forEach(function (o) { o.setAttribute("aria-selected", o.getAttribute("aria-pressed")); });

  // Lightbox
  var lb = document.getElementById("lightbox");
  var lbMedia = document.getElementById("lightbox-media");
  var lbCap = document.getElementById("lightbox-cap");
  var current = 0, lastFocus = null;

  function visibleIndexes() {
    return Array.prototype.map.call(grid.querySelectorAll(".gallery__item:not([hidden]) .gallery__btn"), function (b) { return +b.dataset.index; });
  }
  function show(i) {
    current = i;
    var item = GALLERY[i];
    lbMedia.innerHTML = item.type === "render" ? BarrierBuddy.fence.render(item.cfg, { dims: true, person: true, title: item.title }) : media(item, false);
    lbCap.innerHTML = "<strong>" + item.title + "</strong> — " + item.text;
  }
  function open(i) { lastFocus = document.activeElement; show(i); lb.hidden = false; document.body.style.overflow = "hidden"; lb.querySelector(".lightbox__close").focus(); }
  function close() { lb.hidden = true; document.body.style.overflow = ""; if (lastFocus) lastFocus.focus(); }
  function step(d) {
    var v = visibleIndexes(); var p = v.indexOf(current);
    show(v[(p + d + v.length) % v.length]);
  }

  grid.addEventListener("click", function (e) {
    var b = e.target.closest(".gallery__btn");
    if (b) open(+b.dataset.index);
  });
  lb.querySelector(".lightbox__close").addEventListener("click", close);
  lb.querySelector(".lightbox__nav--prev").addEventListener("click", function () { step(-1); });
  lb.querySelector(".lightbox__nav--next").addEventListener("click", function () { step(1); });
  lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
  document.addEventListener("keydown", function (e) {
    if (lb.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });
})();
