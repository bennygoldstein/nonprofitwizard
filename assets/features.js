/* Nonprofit Wizard — shared form handling for the question box, the callback box and the Startup Kit sign-up. */
(function () {
  "use strict";
  var BASE = "https://nonprofitwizard-signup.netlify.app/.netlify/functions/";
  var CALL_FAIL = "We could not send that just now. Please try again, or call Shai at 561-212-1192.";

  function track(kind) { if (window.nwTrack) window.nwTrack(kind); }
  function msg(form, ok, text) {
    var m = form.querySelector(".nw-msg"); if (!m) return;
    m.hidden = false; m.className = "nw-msg " + (ok ? "ok" : "bad"); m.textContent = text;
  }
  function val(form, name) { var el = form.elements[name]; return el ? String(el.value || "").trim() : ""; }
  function post(endpoint, payload) {
    var ctl = new AbortController(), t = setTimeout(function () { ctl.abort(); }, 30000);
    return fetch(BASE + endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), signal: ctl.signal })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok && j.ok === true, j: j }; }); })
      .finally(function () { clearTimeout(t); });
  }
  function page() { return (location.pathname.split("/").pop() || "index.html"); }
  function digits(s) { return s.replace(/\D/g, ""); }

  function init(form) {
    var kind = form.getAttribute("data-nw-form");
    var btn = form.querySelector("button[type=submit]");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      if (val(form, "website")) return; // honeypot
      var label = btn ? btn.textContent : "";
      var endpoint, payload, done;
      if (kind === "question") {
        endpoint = "contact";
        payload = { type: "question", full_name: val(form, "full_name"), email: val(form, "email"), phone: val(form, "phone"), mission: val(form, "question"), source: "Ask a question box - " + page() };
        if (payload.phone && (digits(payload.phone).length < 7 || digits(payload.phone).length > 15)) { msg(form, false, "That phone number does not look right. Leave it blank or check the digits."); return; }
        done = function (r) { track("question"); msg(form, true, r.j.message || "Thank you. A real person will reply within a few hours."); form.reset(); };
      } else if (kind === "consult") {
        endpoint = "contact";
        payload = { type: "consultation", full_name: val(form, "full_name"), phone: val(form, "phone"), email: val(form, "email"), notes: val(form, "notes"), source: "Free callback box - " + page() };
        var d = digits(payload.phone);
        if (d.length < 7 || d.length > 15) { msg(form, false, "Please enter a phone number we can call you back on."); return; }
        done = function (r) { track("consult"); msg(form, true, r.j.message || "Thank you. We will call you back within a few hours."); form.reset(); };
      } else if (kind === "kit") {
        endpoint = "subscribe";
        payload = { email: val(form, "email").toLowerCase(), consent: !!(form.elements.consent && form.elements.consent.checked), source: "startup-kit", website: "" };
        done = function () {
          track("signup");
          try { localStorage.setItem("nw_kit", "1"); } catch (x) { }
          showKit(form, true);
        };
      } else return;
      if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }
      msg(form, true, ""); form.querySelector(".nw-msg").hidden = true;
      post(endpoint, payload).then(function (r) {
        if (!r.ok) throw new Error((r.j && r.j.message) || "failed");
        done(r);
        if (btn) { btn.textContent = kind === "kit" ? "Sent" : "Sent ✓"; setTimeout(function () { btn.disabled = false; btn.textContent = label; }, 4000); }
      }).catch(function (err) {
        if (btn) { btn.disabled = false; btn.textContent = label; }
        var m = err && err.message && err.message !== "failed" && err.message !== "Failed to fetch" ? err.message : CALL_FAIL;
        msg(form, false, m);
      });
    });
  }

  function showKit(form, focus) {
    var ready = document.querySelector("[data-kit-ready]");
    if (form) form.hidden = true;
    var pre = document.querySelector("[data-kit-signup]"); if (pre) pre.hidden = true;
    if (ready) { ready.hidden = false; var h = ready.querySelector("h2"); if (h && focus) { h.setAttribute("tabindex", "-1"); h.focus(); } }
  }

  document.querySelectorAll("form[data-nw-form]").forEach(init);
  if (document.querySelector("[data-kit-ready]")) {
    try { if (localStorage.getItem("nw_kit") === "1") { var f = document.querySelector("form[data-nw-form=kit]"); var ready = document.querySelector("[data-kit-ready]"); var back = ready.querySelector("[data-welcome-back]"); if (back) back.hidden = false; showKit(f); } } catch (e) { }
  }
})();
