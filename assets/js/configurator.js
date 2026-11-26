/* ==========================================================================
   Barrier Buddy — "Build Your Fence" configurator
   State lives in the URL hash so every design is shareable; "Get a Free
   Quote" stores a summary that the quote form attaches automatically.
   ========================================================================== */
(function () {
  "use strict";

  var F = window.BarrierBuddy && window.BarrierBuddy.fence;
  if (!F) return;

  var STORAGE_KEY = (window.BarrierBuddy && window.BarrierBuddy.STORAGE_KEY) || "bb-configuration";
  var DEFAULTS = Object.assign({}, F.DEFAULTS, { customColour: "" });
  var state = Object.assign({}, DEFAULTS);

  var $ = function (id) { return document.getElementById(id); };
  var preview = $("cfg-preview");
  var readout = $("cfg-readout");

  var POST_OPTIONS = [
    { id: "match", name: "Match panels" },
    { id: "matte-black", name: "Matte black" },
    { id: "charcoal", name: "Charcoal" },
    { id: "ivory", name: "Ivory" }
  ];
  var GATE_OPTIONS = [
    { id: "none", name: "No gate", sub: "Fence only" },
    { id: "aluminum", name: "Aluminum infill", sub: "Matches the panels" },
    { id: "frosted", name: "Frosted glass", sub: "6 mm frosted glazing" }
  ];
  var GATE_POS = [{ id: "left", name: "Left" }, { id: "center", name: "Centre" }, { id: "right", name: "Right" }];
  var MOUNT = [
    { id: "surface", name: "Concrete / patio (anchor plates)" },
    { id: "inground", name: "Soil (concrete footings)" }
  ];
  var COURSE_LABELS = { 21: "Standard", 6: "Narrow boards", 5: "Classic", 4: "Balanced", 3: "Wide boards", 2: "Bold" };

  /* ---------- URL state ---------- */
  var KEYS = ["gap", "height", "spacing", "bays", "courses", "colourType", "colour", "texture", "finish", "postColour", "gate", "gateWidth", "gatePosition", "mount", "customColour"];
  var NUMERIC = { gap: 1, height: 1, spacing: 1, bays: 1, courses: 1, gateWidth: 1 };

  function readHash() {
    var h = window.location.hash.replace(/^#/, "");
    if (!h || h.indexOf("=") === -1) return;
    var p = new URLSearchParams(h);
    KEYS.forEach(function (k) {
      if (!p.has(k)) return;
      var v = p.get(k);
      state[k] = NUMERIC[k] ? parseFloat(v) : v;
    });
    sanitize();
  }
  function writeHash() {
    var p = new URLSearchParams();
    KEYS.forEach(function (k) { if (state[k] !== DEFAULTS[k] && state[k] !== "") p.set(k, state[k]); });
    var s = p.toString();
    history.replaceState(null, "", s ? "#" + s : window.location.pathname);
  }
  function shareLink() {
    var p = new URLSearchParams();
    KEYS.forEach(function (k) { if (state[k] !== "") p.set(k, state[k]); });
    return window.location.origin + window.location.pathname + "#" + p.toString();
  }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function sanitize() {
    if (!F.SEPARATORS.some(function (o) { return o.id === +state.gap; })) state.gap = 0;
    state.gap = +state.gap;
    var lim = F.limitsFor(state.gap);
    state.height = clamp(+state.height || 6, 3, lim.height);
    state.spacing = clamp(+state.spacing || 6, 3, lim.spacing);
    if (!F.TEXTURES.some(function (o) { return o.id === state.texture; })) state.texture = "smooth";
    if (!F.FINISHES.some(function (o) { return o.id === state.finish; })) state.finish = "matte";
    state.bays = clamp(Math.round(+state.bays || 3), 1, 30);
    if (F.COURSE_OPTIONS.indexOf(+state.courses) === -1) state.courses = 21;
    if (!F.COLOURS[state.colourType] || state.colourType === "texture") state.colourType = "solid";
    if (!F.COLOURS[state.colourType].some(function (c) { return c.id === state.colour; })) state.colour = F.COLOURS[state.colourType][0].id;
    state.gateWidth = clamp(+state.gateWidth || 4, 3, 6);
  }

  /* ---------- Option builders ---------- */
  function pills(container, list, key, onChange) {
    container.innerHTML = list.map(function (o) {
      return '<label class="choice"><input type="radio" name="' + key + '" value="' + o.id + '"><span>' + o.name + "</span></label>";
    }).join("");
    container.addEventListener("change", function (e) {
      if (e.target.name !== key) return;
      state[key] = NUMERIC[key] ? parseFloat(e.target.value) : e.target.value;
      (onChange || update)();
    });
  }

  function buildCourses() {
    var c = $("courses-options");
    c.innerHTML = F.COURSE_OPTIONS.map(function (n) {
      var svg = F.render({ bays: 1, courses: n, colour: "charcoal" }, { dims: false, person: false, title: n + " courses" });
      return '<label class="cfg-card"><input type="radio" name="courses" value="' + n + '"><span class="cfg-card__body">' + svg + "<strong>" + n + " courses</strong><small>" + COURSE_LABELS[n] + "</small></span></label>";
    }).join("");
    c.addEventListener("change", function (e) { if (e.target.name === "courses") { state.courses = +e.target.value; update(); } });
  }

  function buildColours() {
    var c = $("colour-options");
    var list = F.COLOURS[state.colourType];
    c.innerHTML = list.map(function (o) {
      var bg = state.colourType === "wood" ? "background-image:url(assets/img/swatches/" + o.id + ".jpg)" : "background:" + o.hex;
      return '<label class="cfg-swatch" title="' + o.name + '"><input type="radio" name="colour" value="' + o.id + '"><span class="cfg-swatch__chip" style="' + bg + '"></span><span class="cfg-swatch__name">' + o.name + "</span></label>";
    }).join("");
  }

  function buildGate() {
    var c = $("gate-options");
    c.innerHTML = GATE_OPTIONS.map(function (o) {
      var svg = o.id === "none"
        ? F.render({ bays: 1, colour: "matte-black" }, { dims: false, person: false, title: o.name })
        : F.render({ bays: 0, gate: o.id, gateWidth: 4, colour: "matte-black" }, { dims: false, person: false, title: o.name });
      return '<label class="cfg-card"><input type="radio" name="gate" value="' + o.id + '"><span class="cfg-card__body">' + svg + "<strong>" + o.name + "</strong><small>" + o.sub + "</small></span></label>";
    }).join("");
    c.addEventListener("change", function (e) { if (e.target.name === "gate") { state.gate = e.target.value; update(); } });
  }

  /* ---------- Sync UI from state ---------- */
  function check(name, value) {
    var el = document.querySelector('#cfg-form input[name="' + name + '"][value="' + value + '"]');
    if (el) el.checked = true;
  }

  function syncControls() {
    var lim = F.limitsFor(state.gap);
    $("height").max = lim.height;
    $("spacing").max = lim.spacing;
    $("height-max").textContent = lim.height + "\u2032";
    $("spacing-max").textContent = lim.spacing + "\u2032";
    ["height", "spacing", "bays", "gateWidth"].forEach(function (k) { $(k).value = state[k]; });
    check("gap", state.gap);
    $("privacy-out").textContent = privacy() + "% privacy";
    $("gap-help").textContent = state.gap > 0
      ? "Small aluminum separators in the posts leave a " + state.gap + "\u2033 gap between panels, so wind passes through instead of pushing on a solid \u201csail\u201d. That lets us build up to 8\u2032 high with posts up to 24\u2032 apart, at about 90% privacy."
      : "Standard panels touch for 100% privacy. For structural reasons, touching panels are limited to 6\u2032 high \u00d7 6\u2032 between posts.";
    $("height-out").textContent = F.ftIn(state.height * 12);
    $("spacing-out").textContent = F.ftIn(state.spacing * 12);
    $("bays-out").textContent = state.bays;
    $("gateWidth-out").textContent = F.ftIn(state.gateWidth * 12);
    $("spacing-note").hidden = state.gap > 0;

    document.querySelectorAll("[data-colour-type]").forEach(function (b) { b.setAttribute("aria-selected", String(b.dataset.colourType === state.colourType)); });
    buildColours();
    check("colour", state.colour);
    check("courses", state.courses);
    check("texture", state.texture);
    check("finish", state.finish);
    check("postColour", state.postColour);
    check("gate", state.gate);
    check("gatePosition", state.gatePosition);
    check("mount", state.mount);

    var wood = state.colourType === "wood";
    document.querySelectorAll('input[name="texture"]').forEach(function (i) { i.disabled = wood; });
    $("texture-note").hidden = !wood;
    $("gate-extra").hidden = state.gate === "none";

    $("custom-colour").checked = !!state.customColour;
    $("custom-colour-text").hidden = !state.customColour;
    if (state.customColour && state.customColour !== "yes") $("custom-colour-text").value = state.customColour;
  }

  function privacy() {
    for (var i = 0; i < F.SEPARATORS.length; i++) if (F.SEPARATORS[i].id === state.gap) return F.SEPARATORS[i].privacy;
    return 100;
  }

  /* ---------- Derived numbers ---------- */
  function totals() {
    var gate = state.gate !== "none";
    var spans = state.bays + (gate ? 1 : 0);
    var lengthIn = state.bays * state.spacing * 12 + (gate ? state.gateWidth * 12 : 0) + 2.84;
    return {
      posts: spans + 1,
      panels: state.bays * state.courses,
      lengthFt: lengthIn / 12,
      lengthIn: lengthIn,
      profileIn: (state.height * 12 - 3.2 - state.gap * (state.courses - 1)) / state.courses
    };
  }

  function name(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i].name; return id; }

  function summaryRows() {
    var t = totals();
    var colour = F.findColour(state.colourType, state.colour).name + (state.colourType === "wood" ? " woodgrain" : "");
    var rows = [
      ["Overall length", F.ftIn(t.lengthIn) + " (" + Math.round(t.lengthIn * 25.4).toLocaleString() + " mm)"],
      ["Post height", F.ftIn(state.height * 12) + " (" + Math.round(state.height * 304.8).toLocaleString() + " mm)"],
      ["Post distance", F.ftIn(state.spacing * 12) + " centres"],
      ["Panel spacing", state.gap > 0 ? state.gap + "″ aluminum separators (≈" + privacy() + "% privacy)" : "Panels touching (100% privacy)"],
      ["Fence sections", String(state.bays)],
      ["Panel size", state.courses + " courses (≈ " + t.profileIn.toFixed(1) + "″ boards)"],
      ["Colour", colour + (state.customColour ? " — custom match requested" + (state.customColour !== "yes" ? ": " + state.customColour : "") : "")],
      ["Texture", state.colourType === "wood" ? "Woodgrain" : name(F.TEXTURES, state.texture)],
      ["Finish", name(F.FINISHES, state.finish)],
      ["Posts", name(POST_OPTIONS, state.postColour)],
      ["Gate", state.gate === "none" ? "None" : name(GATE_OPTIONS, state.gate) + " gate, " + F.ftIn(state.gateWidth * 12) + " wide, " + name(GATE_POS, state.gatePosition).toLowerCase()],
      ["Installation", name(MOUNT, state.mount)],
      ["Estimated parts", t.posts + " posts · " + t.panels + " panels" + (state.gate !== "none" ? " · 1 gate" : "")]
    ];
    return rows;
  }

  function summaryText() {
    return summaryRows().map(function (r) { return r[0] + ": " + r[1]; }).join("\n");
  }

  /* ---------- Render ---------- */
  function update() {
    sanitize();
    syncControls();
    preview.innerHTML = F.render(state, { dims: true, person: true });
    var t = totals();
    readout.innerHTML =
      "<div><span>Length</span><strong>" + F.ftIn(t.lengthIn) + "</strong></div>" +
      "<div><span>Height</span><strong>" + F.ftIn(state.height * 12) + "</strong></div>" +
      "<div><span>Posts</span><strong>" + t.posts + "</strong></div>" +
      "<div><span>Panels</span><strong>" + t.panels + "</strong></div>" +
      "<div><span>Privacy</span><strong>" + privacy() + "%</strong></div>" +
      "<div><span>Gate</span><strong>" + (state.gate === "none" ? "—" : state.gate === "frosted" ? "Glass" : "Alu") + "</strong></div>";
    $("cfg-summary-list").innerHTML = summaryRows().map(function (r) { return "<div><dt>" + r[0] + "</dt><dd>" + r[1] + "</dd></div>"; }).join("");
    if (skipFirstHashWrite) skipFirstHashWrite = false;
    else writeHash();
  }

  /* ---------- Wire up ---------- */
  // A plain anchor (e.g. #gate) is a jump link, not a saved design: leave it alone on first paint.
  var skipFirstHashWrite = !!window.location.hash && window.location.hash.indexOf("=") === -1;
  readHash();
  buildCourses();
  pills($("gap-options"), F.SEPARATORS.map(function (o) { return { id: o.id, name: o.short === "None" ? "Touching (none)" : o.short + " separators" }; }), "gap");
  pills($("texture-options"), F.TEXTURES, "texture");
  pills($("finish-options"), F.FINISHES, "finish");
  pills($("post-options"), POST_OPTIONS, "postColour");
  buildGate();
  pills($("gatepos-options"), GATE_POS, "gatePosition");
  pills($("mount-options"), MOUNT, "mount");

  ["height", "spacing", "bays", "gateWidth"].forEach(function (k) {
    $(k).addEventListener("input", function () { state[k] = parseFloat(this.value); update(); });
  });

  $("colour-options").addEventListener("change", function (e) { if (e.target.name === "colour") { state.colour = e.target.value; update(); } });
  document.querySelectorAll("[data-colour-type]").forEach(function (b) {
    b.addEventListener("click", function () {
      if (state.colourType === b.dataset.colourType) return;
      state.colourType = b.dataset.colourType;
      state.colour = F.COLOURS[state.colourType][0].id;
      update();
    });
  });

  $("custom-colour").addEventListener("change", function () {
    state.customColour = this.checked ? ($("custom-colour-text").value.trim() || "yes") : "";
    update();
    if (this.checked) $("custom-colour-text").focus();
  });
  $("custom-colour-text").addEventListener("input", function () {
    state.customColour = this.value.trim() || "yes";
    $("cfg-summary-list").innerHTML = summaryRows().map(function (r) { return "<div><dt>" + r[0] + "</dt><dd>" + r[1] + "</dd></div>"; }).join("");
    writeHash();
  });

  $("runlength-apply").addEventListener("click", function () {
    var len = parseFloat($("runlength").value);
    if (!len || len <= 0) { $("runlength").focus(); return; }
    var gateFt = state.gate !== "none" ? state.gateWidth : 0;
    state.bays = clamp(Math.ceil(Math.max(0, len - gateFt) / state.spacing), 1, 30);
    update();
  });
  $("runlength").addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); $("runlength-apply").click(); } });

  $("cfg-reset").addEventListener("click", function () {
    state = Object.assign({}, DEFAULTS);
    $("custom-colour-text").value = "";
    $("runlength").value = "";
    update();
  });

  $("cfg-share").addEventListener("click", function () {
    var link = shareLink();
    var status = $("cfg-share-status");
    var ok = function () { status.textContent = "Link copied — share it or keep it to come back to your design."; };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(link).then(ok, function () { window.prompt("Copy this link:", link); });
    else window.prompt("Copy this link:", link);
  });

  function goQuote() {
    var payload = {
      summary: summaryText(),
      link: shareLink(),
      hasGate: state.gate !== "none",
      lengthFt: Math.round(totals().lengthFt),
      heightFt: state.height,
      state: state
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); } catch (e) {}
    window.location.href = "contact.html?from=builder#quote";
  }
  $("cfg-quote").addEventListener("click", goQuote);
  document.querySelectorAll("[data-quote-jump]").forEach(function (a) {
    a.addEventListener("click", function (e) { e.preventDefault(); goQuote(); });
  });

  update();
})();
