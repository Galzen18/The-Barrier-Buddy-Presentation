/* ==========================================================================
   Barrier Buddy — fence renderer
   Builds a to-scale SVG elevation of a Barrier Buddy run (posts, panels,
   courses, optional gate) from a configuration object. Used by the
   configurator, the products page and the gallery concept renders.
   Units inside the drawing are inches.
   ========================================================================== */
(function (global) {
  "use strict";

  /* Finish catalogue — names and swatches from the Barrier Buddy presentation */
  var COLOURS = {
    solid: [
      { id: "matte-black", name: "Matte black", hex: "#23282c" },
      { id: "charcoal", name: "Charcoal", hex: "#41474a" },
      { id: "warm-grey", name: "Warm grey", hex: "#93908c" },
      { id: "ivory", name: "Ivory", hex: "#e5deca" },
      { id: "bronze", name: "Bronze", hex: "#75624e" },
      { id: "forest-green", name: "Forest green", hex: "#435849" },
      { id: "deep-navy", name: "Deep navy", hex: "#303e55" },
      { id: "terracotta", name: "Terracotta", hex: "#a95640" }
    ],
    wood: [
      { id: "white-oak", name: "White oak", hex: "#baa27a" },
      { id: "natural-oak", name: "Natural oak", hex: "#a07a51" },
      { id: "smoked-oak", name: "Smoked oak", hex: "#745c48" },
      { id: "walnut", name: "Walnut", hex: "#7c5a43" },
      { id: "cedar", name: "Cedar", hex: "#a46b4b" },
      { id: "teak", name: "Teak", hex: "#9d7e54" },
      { id: "mahogany", name: "Mahogany", hex: "#845848" },
      { id: "ebony", name: "Ebony", hex: "#50433a" }
    ],
    texture: [
      { id: "smooth-satin", name: "Smooth satin", hex: "#33383a" },
      { id: "fine-sand", name: "Fine sand", hex: "#363a3a" },
      { id: "coarse-sand", name: "Coarse sand", hex: "#89785e" },
      { id: "hammered", name: "Hammered", hex: "#484a4b" },
      { id: "silver-metallic", name: "Silver metallic", hex: "#a2a9ab" },
      { id: "bronze-metallic", name: "Bronze metallic", hex: "#66513d" },
      { id: "high-gloss", name: "High gloss", hex: "#292d33" },
      { id: "soft-matte", name: "Soft matte", hex: "#737c64" }
    ]
  };

  var TEXTURES = [
    { id: "smooth", name: "Smooth" },
    { id: "fine-sand", name: "Fine sand" },
    { id: "coarse-sand", name: "Coarse sand" },
    { id: "hammered", name: "Hammered" }
  ];

  var FINISHES = [
    { id: "matte", name: "Matte" },
    { id: "soft-matte", name: "Soft matte" },
    { id: "satin", name: "Satin" },
    { id: "high-gloss", name: "High gloss" },
    { id: "metallic", name: "Metallic" }
  ];

  var COURSE_OPTIONS = [21, 6, 5, 4, 3, 2];

  var DEFAULTS = {
    height: 6, // post height, ft
    spacing: 6, // post centres, ft
    bays: 3,
    courses: 21,
    colourType: "solid",
    colour: "matte-black",
    texture: "smooth",
    finish: "matte",
    postColour: "match",
    gate: "none",
    gateWidth: 4,
    gatePosition: "left",
    gateInfillColour: "match",
    mount: "surface"
  };

  var uidCounter = 0;

  function findColour(type, id) {
    var list = COLOURS[type] || COLOURS.solid;
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return COLOURS.solid[0];
  }

  function shade(hex, amt) {
    var n = parseInt(hex.slice(1), 16);
    var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    function f(c) { return Math.max(0, Math.min(255, Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt))); }
    return "#" + ((1 << 24) + (f(r) << 16) + (f(g) << 8) + f(b)).toString(16).slice(1);
  }

  function ftIn(inches) {
    var total = Math.round(inches);
    var ft = Math.floor(total / 12), inch = total % 12;
    return ft + "′" + (inch ? " " + inch + "″" : "");
  }

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /**
   * Render a fence elevation.
   * @param {object} cfg   configuration (see DEFAULTS)
   * @param {object} opts  { dims: bool, person: bool, assetBase: string, title: string, background: bool }
   * @returns {string} SVG markup
   */
  function render(cfg, opts) {
    cfg = Object.assign({}, DEFAULTS, cfg || {});
    opts = Object.assign({ dims: true, person: true, assetBase: "assets/", title: "", background: true }, opts || {});
    var id = "bb" + (++uidCounter);

    var H = cfg.height * 12; // post height in inches
    var POST = 2.84; // 72 mm post
    var PLATE = 5; // 127 mm anchor plate
    var CAP = 0.6;
    var BOTTOM_GAP = 2; // 50 mm
    var TOP_GAP = 0.6;
    var SLAB = 8;

    // Build span list
    var spans = [];
    var bays = Math.max(0, Math.round(cfg.bays));
    for (var i = 0; i < bays; i++) spans.push({ type: "bay", w: cfg.spacing * 12 });
    if (cfg.gate && cfg.gate !== "none") {
      var g = { type: "gate", w: cfg.gateWidth * 12 };
      if (cfg.gatePosition === "right") spans.push(g);
      else if (cfg.gatePosition === "center") spans.splice(Math.floor(spans.length / 2), 0, g);
      else spans.unshift(g);
    }
    if (!spans.length) spans.push({ type: "bay", w: cfg.spacing * 12 });

    var runW = POST; // outside-to-outside
    spans.forEach(function (s) { runW += s.w; });

    var personW = opts.person ? 30 : 0;
    var fs = Math.max(6, Math.min(14, (runW + personW) * 0.022, H * 0.12));
    var padL = opts.dims ? fs * 3.2 : 6;
    var padR = 8 + personW;
    var padT = Math.max(10, H * 0.08);
    var padB = SLAB + (opts.dims ? fs * 4.6 : 4);
    var VW = padL + runW + padR;
    var VH = padT + H + padB;
    var groundY = padT + H;

    // Colours
    var c = findColour(cfg.colourType, cfg.colour);
    var isWood = cfg.colourType === "wood";
    var base = c.hex;
    var postHex = cfg.postColour === "match" ? base : findColour("solid", cfg.postColour).hex;
    var dark = shade(base, -0.45);
    var light = shade(base, 0.35);

    var out = [];
    out.push('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + VW.toFixed(1) + " " + VH.toFixed(1) + '" role="img" aria-label="' + esc(opts.title || describe(cfg)) + '" preserveAspectRatio="xMidYMid meet">');
    out.push("<title>" + esc(opts.title || describe(cfg)) + "</title>");

    // defs
    out.push("<defs>");
    if (isWood) {
      var img = opts.assetBase + "img/swatches/" + c.id + ".jpg";
      out.push('<pattern id="' + id + 'wood" patternUnits="userSpaceOnUse" width="96" height="40" preserveAspectRatio="none"><image href="' + img + '" x="0" y="0" width="96" height="40" preserveAspectRatio="none"/></pattern>');
    }
    // texture noise
    var tex = cfg.texture;
    if (!isWood && tex !== "smooth") {
      var freq = tex === "fine-sand" ? 0.9 : tex === "coarse-sand" ? 0.45 : 0.12;
      var oct = tex === "hammered" ? 2 : 1;
      var alpha = tex === "fine-sand" ? 0.35 : tex === "coarse-sand" ? 0.55 : 0.6;
      out.push('<filter id="' + id + 'tex" x="0" y="0" width="100%" height="100%"><feTurbulence type="' + (tex === "hammered" ? "turbulence" : "fractalNoise") + '" baseFrequency="' + freq + '" numOctaves="' + oct + '" seed="7" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 ' + alpha + ' -' + (alpha / 2).toFixed(2) + '"/></filter>');
    }
    // finish sheen
    var sheen = { matte: [0.02, 0.0], "soft-matte": [0.06, 0.0], satin: [0.14, 0.04], "high-gloss": [0.32, 0.1], metallic: [0.26, 0.16] }[cfg.finish] || [0.04, 0];
    out.push('<linearGradient id="' + id + 'sheen" x1="0" y1="0" x2="' + (cfg.finish === "metallic" ? "1" : "0") + '" y2="1">' +
      '<stop offset="0" stop-color="#fff" stop-opacity="' + sheen[0] + '"/>' +
      '<stop offset="0.45" stop-color="#fff" stop-opacity="' + sheen[1] + '"/>' +
      (cfg.finish === "metallic" ? '<stop offset="0.6" stop-color="#fff" stop-opacity="' + (sheen[0] * 0.8) + '"/>' : "") +
      '<stop offset="1" stop-color="#000" stop-opacity="' + (0.08 + sheen[1]) + '"/></linearGradient>');
    out.push('<linearGradient id="' + id + 'post" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".28"/></linearGradient>');
    out.push('<linearGradient id="' + id + 'glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#eef3f3"/><stop offset=".55" stop-color="#d7e1e2"/><stop offset="1" stop-color="#c3cfd1"/></linearGradient>');
    out.push('<linearGradient id="' + id + 'slab" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9d9d6"/><stop offset="1" stop-color="#c4c4c0"/></linearGradient>');
    out.push("</defs>");

    if (opts.background) {
      out.push('<rect x="0" y="0" width="' + VW + '" height="' + VH + '" fill="#e9e9ec"/>');
    }

    // ground / slab
    var slabX = padL - 6, slabW = runW + 12;
    if (cfg.mount === "inground") {
      out.push('<rect x="' + slabX + '" y="' + groundY + '" width="' + slabW + '" height="' + SLAB + '" fill="#8a8177"/>');
      out.push('<rect x="' + slabX + '" y="' + groundY + '" width="' + slabW + '" height="1.2" fill="#6f8b4f"/>');
    } else {
      out.push('<rect x="' + slabX + '" y="' + groundY + '" width="' + slabW + '" height="' + SLAB + '" fill="url(#' + id + 'slab)"/>');
      out.push('<rect x="' + slabX + '" y="' + groundY + '" width="' + slabW + '" height=".6" fill="#b7b7b2"/>');
    }

    var panelFill = isWood ? "url(#" + id + "wood)" : base;

    function panelBlock(x, y, w, h, courses) {
      var s = [];
      s.push('<rect x="' + x.toFixed(2) + '" y="' + y.toFixed(2) + '" width="' + w.toFixed(2) + '" height="' + h.toFixed(2) + '" fill="' + panelFill + '"/>');
      if (!isWood && tex !== "smooth") s.push('<rect x="' + x.toFixed(2) + '" y="' + y.toFixed(2) + '" width="' + w.toFixed(2) + '" height="' + h.toFixed(2) + '" filter="url(#' + id + 'tex)" opacity=".5"/>');
      var ch = h / courses;
      for (var k = 0; k < courses; k++) {
        var cy = y + k * ch;
        // per-course sheen
        s.push('<rect x="' + x.toFixed(2) + '" y="' + cy.toFixed(2) + '" width="' + w.toFixed(2) + '" height="' + ch.toFixed(2) + '" fill="url(#' + id + 'sheen)"/>');
        if (k > 0) {
          var lw = Math.max(0.25, Math.min(0.55, ch * 0.09));
          s.push('<rect x="' + x.toFixed(2) + '" y="' + (cy - lw).toFixed(2) + '" width="' + w.toFixed(2) + '" height="' + lw.toFixed(2) + '" fill="' + dark + '" opacity=".85"/>');
          s.push('<rect x="' + x.toFixed(2) + '" y="' + cy.toFixed(2) + '" width="' + w.toFixed(2) + '" height="' + (lw * 0.6).toFixed(2) + '" fill="' + light + '" opacity="' + (courses > 8 ? 0.35 : 0.55) + '"/>');
        }
      }
      s.push('<rect x="' + x.toFixed(2) + '" y="' + y.toFixed(2) + '" width="' + w.toFixed(2) + '" height="' + h.toFixed(2) + '" fill="none" stroke="' + dark + '" stroke-width=".35"/>');
      return s.join("");
    }

    function post(x) {
      var s = [];
      var px = x - POST / 2;
      s.push('<rect x="' + (x - PLATE / 2).toFixed(2) + '" y="' + (groundY - 0.5).toFixed(2) + '" width="' + PLATE + '" height=".5" fill="' + shade(postHex, -0.3) + '"/>');
      s.push('<rect x="' + px.toFixed(2) + '" y="' + (padT + CAP).toFixed(2) + '" width="' + POST + '" height="' + (H - CAP - 0.5).toFixed(2) + '" fill="' + postHex + '"/>');
      s.push('<rect x="' + px.toFixed(2) + '" y="' + (padT + CAP).toFixed(2) + '" width="' + POST + '" height="' + (H - CAP - 0.5).toFixed(2) + '" fill="url(#' + id + 'post)"/>');
      s.push('<rect x="' + (px + POST * 0.42).toFixed(2) + '" y="' + (padT + CAP).toFixed(2) + '" width="' + (POST * 0.16).toFixed(2) + '" height="' + (H - CAP - 0.5).toFixed(2) + '" fill="#000" opacity=".18"/>');
      s.push('<rect x="' + (px - 0.25).toFixed(2) + '" y="' + padT.toFixed(2) + '" width="' + (POST + 0.5).toFixed(2) + '" height="' + CAP + '" fill="' + shade(postHex, -0.25) + '"/>');
      return s.join("");
    }

    // spans
    var x = padL + POST / 2; // centre of first post
    var panelTop = padT + TOP_GAP + CAP;
    var panelBot = groundY - BOTTOM_GAP;
    var postXs = [x];
    var spanGeom = [];
    spans.forEach(function (sp) {
      var x0 = x + POST / 2, x1 = x + sp.w - POST / 2;
      spanGeom.push({ type: sp.type, x0: x0, x1: x1, cx: x, w: sp.w });
      if (sp.type === "bay") {
        out.push(panelBlock(x0, panelTop, x1 - x0, panelBot - panelTop, cfg.courses));
      } else {
        // gate leaf
        var gap = 0.5, frame = 3.2;
        var gx = x0 + gap, gw = (x1 - x0) - gap * 2;
        var gy = panelTop, gh = panelBot - panelTop;
        var frameHex = cfg.gateInfillColour === "match" ? postHex : postHex;
        out.push('<rect x="' + gx.toFixed(2) + '" y="' + gy.toFixed(2) + '" width="' + gw.toFixed(2) + '" height="' + gh.toFixed(2) + '" fill="' + frameHex + '"/>');
        out.push('<rect x="' + gx.toFixed(2) + '" y="' + gy.toFixed(2) + '" width="' + gw.toFixed(2) + '" height="' + gh.toFixed(2) + '" fill="url(#' + id + 'post)"/>');
        var ix = gx + frame, iy = gy + frame, iw = gw - frame * 2, ih = gh - frame * 2;
        if (cfg.gate === "frosted") {
          out.push('<rect x="' + ix.toFixed(2) + '" y="' + iy.toFixed(2) + '" width="' + iw.toFixed(2) + '" height="' + ih.toFixed(2) + '" fill="url(#' + id + 'glass)"/>');
          out.push('<path d="M' + (ix + iw * 0.15).toFixed(2) + " " + (iy + ih * 0.12).toFixed(2) + " l" + (iw * 0.22).toFixed(2) + " -" + (iw * 0.22).toFixed(2) + '" stroke="#fff" stroke-opacity=".7" stroke-width=".5"/>');
          out.push('<path d="M' + (ix + iw * 0.15).toFixed(2) + " " + (iy + ih * 0.12 + 3).toFixed(2) + " l" + (iw * 0.3).toFixed(2) + " -" + (iw * 0.3).toFixed(2) + '" stroke="#fff" stroke-opacity=".5" stroke-width=".4"/>');
        } else {
          out.push(panelBlock(ix, iy, iw, ih, cfg.courses));
        }
        out.push('<rect x="' + ix.toFixed(2) + '" y="' + iy.toFixed(2) + '" width="' + iw.toFixed(2) + '" height="' + ih.toFixed(2) + '" fill="none" stroke="#000" stroke-opacity=".35" stroke-width=".4"/>');
        // hinge side vs latch side: hinges on the side next to the fence
        var hingeLeft = cfg.gatePosition === "right" ? true : cfg.gatePosition === "left" ? false : true;
        var hx = hingeLeft ? gx - 0.6 : gx + gw - 0.9;
        var hingeHex = "#2a2a2a";
        [0.12, 0.82].forEach(function (p) {
          out.push('<rect x="' + hx.toFixed(2) + '" y="' + (gy + gh * p).toFixed(2) + '" width="1.5" height="' + Math.max(3, gh * 0.06).toFixed(2) + '" rx=".5" fill="' + hingeHex + '"/>');
        });
        var lx = hingeLeft ? gx + gw - frame * 0.5 - 1.2 : gx + frame * 0.5 - 0.2;
        var hy = gy + gh * 0.4;
        out.push('<rect x="' + (lx - 0.4).toFixed(2) + '" y="' + hy.toFixed(2) + '" width="2.2" height="' + (gh * 0.16).toFixed(2) + '" rx=".5" fill="#151515"/>');
        out.push('<circle cx="' + (lx + 0.7).toFixed(2) + '" cy="' + (hy - 2).toFixed(2) + '" r=".7" fill="#bbb"/>');
      }
      x += sp.w;
      postXs.push(x);
    });
    postXs.forEach(function (px) { out.push(post(px)); });

    // Person for scale (5'9")
    if (opts.person) {
      var ph = 69, pxp = padL + runW + 14;
      var s = ph / 69;
      out.push('<g fill="#b9b9c0" transform="translate(' + pxp.toFixed(2) + " " + (groundY - ph).toFixed(2) + ") scale(" + s + ')" aria-hidden="true">' +
        '<circle cx="0" cy="5" r="4.6"/>' +
        '<path d="M-7 12 Q0 9 7 12 L8.5 36 L5 36 L4.5 22 L4 39 L4.6 69 L0.8 69 L0 42 L-0.8 69 L-4.6 69 L-4 39 L-4.5 22 L-5 36 L-8.5 36 Z"/></g>');
    }

    // Dimensions
    if (opts.dims) {
      var dc = "#c80000", sw = Math.max(0.3, fs * 0.06);
      var tick = fs * 0.45;
      // height
      var dx = padL - fs * 1.6;
      out.push('<g stroke="' + dc + '" stroke-width="' + sw + '">' +
        '<line x1="' + dx + '" y1="' + padT + '" x2="' + dx + '" y2="' + groundY + '"/>' +
        '<line x1="' + (dx - tick) + '" y1="' + padT + '" x2="' + (dx + tick) + '" y2="' + padT + '"/>' +
        '<line x1="' + (dx - tick) + '" y1="' + groundY + '" x2="' + (dx + tick) + '" y2="' + groundY + '"/></g>');
      out.push('<text x="' + (dx - fs * 0.45) + '" y="' + (padT + H / 2) + '" font-family="Lato, Arial, sans-serif" font-weight="700" font-size="' + fs + '" fill="' + dc + '" text-anchor="middle" transform="rotate(-90 ' + (dx - fs * 0.45) + " " + (padT + H / 2) + ')">' + ftIn(H) + "</text>");

      // span widths (post centres)
      var y1 = groundY + SLAB + fs * 1.4;
      var showEach = spanGeom.length <= 14;
      spanGeom.forEach(function (sg, idx) {
        var a = postXs[idx], b = postXs[idx + 1];
        out.push('<g stroke="' + (sg.type === "gate" ? "#262626" : dc) + '" stroke-width="' + sw + '"><line x1="' + a + '" y1="' + y1 + '" x2="' + b + '" y2="' + y1 + '"/><line x1="' + a + '" y1="' + (y1 - tick) + '" x2="' + a + '" y2="' + (y1 + tick) + '"/><line x1="' + b + '" y1="' + (y1 - tick) + '" x2="' + b + '" y2="' + (y1 + tick) + '"/></g>');
        if (showEach) out.push('<text x="' + ((a + b) / 2) + '" y="' + (y1 - fs * 0.4) + '" font-family="Lato, Arial, sans-serif" font-weight="700" font-size="' + (fs * 0.85) + '" fill="' + (sg.type === "gate" ? "#262626" : dc) + '" text-anchor="middle">' + (sg.type === "gate" ? "Gate " : "") + ftIn(sg.w) + "</text>");
      });
      // overall
      var y2 = y1 + fs * 2.4;
      var L = postXs[0] - POST / 2, Rr = postXs[postXs.length - 1] + POST / 2;
      out.push('<g stroke="#262626" stroke-width="' + sw + '"><line x1="' + L + '" y1="' + y2 + '" x2="' + Rr + '" y2="' + y2 + '"/><line x1="' + L + '" y1="' + (y2 - tick) + '" x2="' + L + '" y2="' + (y2 + tick) + '"/><line x1="' + Rr + '" y1="' + (y2 - tick) + '" x2="' + Rr + '" y2="' + (y2 + tick) + '"/></g>');
      out.push('<rect x="' + ((L + Rr) / 2 - fs * 4.2) + '" y="' + (y2 - fs * 0.75) + '" width="' + (fs * 8.4) + '" height="' + (fs * 1.5) + '" fill="#e9e9ec"/>');
      out.push('<text x="' + ((L + Rr) / 2) + '" y="' + (y2 + fs * 0.35) + '" font-family="Lato, Arial, sans-serif" font-weight="900" font-size="' + fs + '" fill="#262626" text-anchor="middle">' + ftIn(Rr - L) + " overall</text>");
    }

    out.push("</svg>");
    return out.join("");
  }

  function colourName(cfg) {
    return findColour(cfg.colourType, cfg.colour).name;
  }

  function describe(cfg) {
    cfg = Object.assign({}, DEFAULTS, cfg || {});
    var t = "Barrier Buddy elevation: " + cfg.height + " ft high, " + cfg.bays + " section" + (cfg.bays === 1 ? "" : "s") + " at " + cfg.spacing + " ft post centres, " + cfg.courses + " courses, " + colourName(cfg);
    if (cfg.gate !== "none") t += ", with a " + cfg.gateWidth + " ft " + (cfg.gate === "frosted" ? "frosted glass" : "aluminum infill") + " gate";
    return t;
  }

  /* Small course-pattern icon (used on the products page) */
  function courseIcon(courses, hex) {
    return render({ bays: 1, courses: courses, height: 6, spacing: 6, colour: "matte-black" }, { dims: false, person: false, background: true, title: courses + " courses" });
  }

  global.BarrierBuddy = global.BarrierBuddy || {};
  global.BarrierBuddy.fence = {
    render: render,
    describe: describe,
    courseIcon: courseIcon,
    findColour: findColour,
    COLOURS: COLOURS,
    TEXTURES: TEXTURES,
    FINISHES: FINISHES,
    COURSE_OPTIONS: COURSE_OPTIONS,
    DEFAULTS: DEFAULTS,
    ftIn: ftIn
  };
})(window);
