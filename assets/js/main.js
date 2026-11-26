/* ==========================================================================
   Barrier Buddy — site behaviour
   ========================================================================== */

/*
 * QUOTE FORM DELIVERY
 * Quote requests are emailed to info@barrierbuddy.ca through FormSubmit
 * (https://formsubmit.co). The very first submission triggers a one-time
 * activation email to that inbox: click "Activate Form" in it, and every
 * request after that is delivered. To use another service (Formspree, a CRM
 * webhook…) replace quoteEndpoint with its URL.
 * Leave quoteEndpoint empty to run the forms in demo mode (nothing is sent).
 */
window.BB_CONFIG = window.BB_CONFIG || {
  email: "info@barrierbuddy.ca",
  quoteEndpoint: "https://formsubmit.co/ajax/info@barrierbuddy.ca"
};

(function () {
  "use strict";

  var STORAGE_KEY = "bb-configuration";

  /* ---------- Header: mobile nav + scrolled state ---------- */
  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("is-open", !open);
      document.body.style.overflow = !open ? "hidden" : "";
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        toggle.setAttribute("aria-expanded", "false");
        nav.classList.remove("is-open");
        document.body.style.overflow = "";
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        toggle.click();
        toggle.focus();
      }
    });
  }

  if (header) {
    var onScroll = function () { header.classList.toggle("is-scrolled", window.scrollY > 8); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Reveal on scroll ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Quote forms ---------- */
  var params = new URLSearchParams(window.location.search);

  function readSavedConfig() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); } catch (e) { return null; }
  }

  document.querySelectorAll("form[data-quote-form]").forEach(function (form) {
    // Preselect product from ?product=fence|gate|both
    var product = params.get("product");
    if (product) {
      var radio = form.querySelector('input[name="product"][value="' + product + '"]');
      if (radio) radio.checked = true;
    }

    // Attach configuration from the "Build Your Fence" page
    var holder = form.querySelector("[data-config-attached]");
    var saved = readSavedConfig();
    if (holder && saved && saved.summary) {
      holder.hidden = false;
      holder.querySelector("pre").textContent = saved.summary;
      var hidden = form.querySelector('textarea[name="configuration"]');
      if (hidden) hidden.value = saved.summary + (saved.link ? "\n\nDesign link: " + saved.link : "");
      var both = form.querySelector('input[name="product"][value="' + (saved.hasGate ? "both" : "fence") + '"]');
      if (both && !product) both.checked = true;
      var len = form.querySelector('input[name="length"]');
      if (len && !len.value && saved.lengthFt) len.value = saved.lengthFt;
      var hSel = form.querySelector('select[name="height"]');
      if (hSel && saved.heightFt) {
        var match = Array.prototype.find.call(hSel.options, function (o) { return o.text === saved.heightFt + " ft"; });
        hSel.value = match ? match.value : "Custom";
      }
      var rm = holder.querySelector("[data-config-remove]");
      if (rm) rm.addEventListener("click", function () {
        holder.hidden = true;
        if (hidden) hidden.value = "";
        try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
      });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validate(form)) return;

      var btn = form.querySelector('button[type="submit"]');
      var status = form.querySelector(".form-status");
      var endpoint = (window.BB_CONFIG && window.BB_CONFIG.quoteEndpoint) || "";
      if (form.querySelector('input[name="_honey"]') && form.querySelector('input[name="_honey"]').value) return; // spam bot
      var data = new FormData(form);
      data.append("page", window.location.pathname);
      var who = (data.get("name") || "").toString().trim();
      data.set("_subject", "New Barrier Buddy quote request" + (who ? " — " + who : ""));

      if (btn) { btn.disabled = true; btn.dataset.label = btn.innerHTML; btn.textContent = "Sending…"; }

      var done = function () {
        var success = form.parentElement.querySelector(".form-success");
        form.hidden = true;
        if (success) { success.hidden = false; success.setAttribute("tabindex", "-1"); success.focus(); }
        try { localStorage.removeItem(STORAGE_KEY); } catch (err) {}
      };
      var fail = function () {
        if (btn) { btn.disabled = false; btn.innerHTML = btn.dataset.label; }
        if (status) status.innerHTML = 'Sorry, something went wrong sending your request. Please try again, or email us at <a href="mailto:info@barrierbuddy.ca">info@barrierbuddy.ca</a>.';
      };

      if (!endpoint) {
        console.warn("[Barrier Buddy] Quote form is in demo mode — set BB_CONFIG.quoteEndpoint in assets/js/main.js to receive submissions.", Object.fromEntries(data.entries()));
        setTimeout(done, 500);
        return;
      }

      fetch(endpoint, { method: "POST", body: data, headers: { Accept: "application/json" } })
        .then(function (r) { if (r.ok) done(); else fail(); })
        .catch(fail);
    });
  });

  function validate(form) {
    var ok = true;
    var first = null;
    form.querySelectorAll("[required]").forEach(function (input) {
      var err = form.querySelector('[data-error-for="' + input.name + '"]');
      var valid = input.type === "checkbox" ? input.checked : input.value.trim() !== "";
      if (valid && input.type === "email") valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
      input.setAttribute("aria-invalid", valid ? "false" : "true");
      if (err) err.textContent = valid ? "" : (input.dataset.error || "This field is required.");
      if (!valid) { ok = false; if (!first) first = input; }
    });
    if (first) first.focus();
    return ok;
  }

  /* ---------- Expose storage key for the configurator ---------- */
  window.BarrierBuddy = window.BarrierBuddy || {};
  window.BarrierBuddy.STORAGE_KEY = STORAGE_KEY;
})();
