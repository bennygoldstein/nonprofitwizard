(function(){
"use strict";var NW=window.NW||{};var $=function(id){return document.getElementById(id)};var qs=function(s,r){return (r||document).querySelector(s)};var qsa=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
  var FIELDS = NW.fields || [], SCRIPT = NW.script || [], KEYS = FIELDS.map(function (f) { return f.key; });
  var REQUIRED = FIELDS.filter(function (f) { return f.required; }).map(function (f) { return f.key; });
  var SHORT = { full_name: "Your name", email: "Email", phone: "Phone", best_time: "Best time to call", org_name: "Nonprofit name", state: "State", mission: "Mission", org_type: "Type", expected_revenue: "Expected income", existing_funds: "Funds in hand", already_incorporated: "Incorporated?", director1_name: "Director 1", director2_name: "Director 2", director3_name: "Director 3", directors_other: "Other directors", rush: "Timeline", heard_about: "Heard about us", notes: "Notes" };
  var LABEL = {}; FIELDS.forEach(function (f) { LABEL[f.key] = SHORT[f.key] || f.label.replace(/\s*[\(:].*$/, ""); });
  var data = {}; KEYS.forEach(function (k) { data[k] = ""; });
  var transcript = []; // {role:'wizard'|'you', text}
  var log = $("chatlog"), input = $("chatin"), sendBtn = $("chatsend"), micBtn = $("chatmic");
  var aiOnline = false, bridge = null, bridgeReady = false, pending = {}, busy = false;
  var stage = "intro"; // intro -> free -> fill -> done
  var askKey = null;   // key currently being asked in fill stage
  var started = false;

  function addMsg(role, text, html) {
    var d = document.createElement("div");
    d.className = "msg " + (role === "wizard" ? "w" : role === "you" ? "u" : "sys");
    if (html) d.innerHTML = text; else d.textContent = text;
    log.appendChild(d); log.scrollTop = log.scrollHeight;
    if (role !== "sys") transcript.push({ role: role, text: text });
    return d;
  }
  function typing(on) {
    var t = $("typing");
    if (on && !t) { t = document.createElement("div"); t.id = "typing"; t.className = "msg w typing"; t.innerHTML = "<i></i><i></i><i></i>"; log.appendChild(t); log.scrollTop = log.scrollHeight; }
    if (!on && t) t.remove();
  }
  function wizardSay(text, delay) {
    return new Promise(function (res) {
      typing(true);
      setTimeout(function () { typing(false); addMsg("wizard", text); res(); }, delay == null ? Math.min(1400, 350 + text.length * 6) : delay);
    });
  }

  /* ---- bridge (Claude via Cloudflare worker, from the github.io origin) ---- */
  function setupBridge() {
    if (!NW.bridgeUrl) return;
    bridge = document.createElement("iframe");
    bridge.src = NW.bridgeUrl; bridge.setAttribute("title", "AI helper"); bridge.setAttribute("aria-hidden", "true");
    bridge.style.cssText = "position:absolute;width:0;height:0;border:0;opacity:0;pointer-events:none";
    document.body.appendChild(bridge);
    window.addEventListener("message", function (ev) {
      var okOrigin = ev.origin === NW.bridgeOrigin;
      if (!okOrigin) return;
      var d = ev.data || {};
      if (d.type === "nw-ready" || d.type === "nw-pong") { bridgeReady = true; setOnline(true); return; }
      var p = pending[d.id]; if (!p) return;
      if (d.type === "nw-delta") { p.text += d.text; }
      else if (d.type === "nw-done") { delete pending[d.id]; p.resolve(d.text || p.text); }
      else if (d.type === "nw-error") { delete pending[d.id]; p.reject(new Error("AI error " + d.status + ": " + (d.text || "").slice(0, 200))); }
    });
    var tries = 0, iv = setInterval(function () {
      if (bridgeReady || tries++ > 12) { clearInterval(iv); return; }
      try { bridge.contentWindow.postMessage({ type: "nw-ping" }, NW.bridgeOrigin); } catch (e) { }
    }, 700);
  }
  function setOnline(on) {
    aiOnline = on;
    var dot = $("aidot"), lab = $("ailabel");
    if (dot) dot.classList.toggle("on", on);
    if (lab) lab.textContent = on ? "AI online" : "Guided mode";
  }
  function askAI(messages, maxTokens) {
    return new Promise(function (resolve, reject) {
      if (!bridgeReady) return reject(new Error("AI unavailable"));
      var id = "q" + Date.now() + Math.random().toString(36).slice(2, 7);
      pending[id] = { text: "", resolve: resolve, reject: reject };
      var body = { model: NW.model || "claude-opus-5", max_tokens: maxTokens || 1200, system: NW.systemPrompt, messages: messages };
      bridge.contentWindow.postMessage({ type: "nw-ask", id: id, body: body }, NW.bridgeOrigin);
      setTimeout(function () { if (pending[id]) { delete pending[id]; reject(new Error("AI timeout")); } }, 60000);
    });
  }
  function transcriptText() {
    return transcript.map(function (m) { return (m.role === "wizard" ? "Wizard: " : "Applicant: ") + m.text; }).join("\n");
  }
  function parseJSON(t) {
    var s = String(t).replace(/```[a-z]*/gi, "").replace(/```/g, "");
    var m = s.match(/\{[\s\S]*\}/); if (!m) throw new Error("no json");
    return JSON.parse(m[0]);
  }
  function extractWithAI() {
    var content = "Here is the conversation so far between the Wizard and the applicant. Extract the intake JSON from everything the applicant said.\n\n" + transcriptText();
    return askAI([{ role: "user", content: content }]).then(function (txt) {
      var obj = parseJSON(txt), changed = false;
      KEYS.forEach(function (k) {
        if (obj[k] == null) return; var v = String(obj[k]).trim(); if (!v) return;
        var opt = optionsFor(k); if (opt && opt.indexOf(v) === -1) { var f = fuzzyOption(opt, v); if (!f) return; v = f; }
        if (data[k] !== v) { data[k] = v; changed = true; }
      });
      return changed;
    });
  }
  function optionsFor(k) { var f = FIELDS.filter(function (x) { return x.key === k; })[0]; return f && f.options ? f.options : null; }
  function fuzzyOption(opts, v) {
    var lv = v.toLowerCase(); var hit = null;
    opts.forEach(function (o) { if (!hit && (o.toLowerCase().indexOf(lv) === 0 || lv.indexOf(o.toLowerCase().split(" ")[0]) === 0)) hit = o; });
    return hit;
  }

  /* ---- simple local normalizers for guided mode ---- */
  function localSet(key, text) {
    var v = text.trim(), t = v.toLowerCase();
    if (key === "phone") { var dg = v.replace(/\D/g, ""); if (dg.length === 11 && dg[0] === "1") dg = dg.slice(1); if (dg.length === 10) v = "(" + dg.slice(0, 3) + ") " + dg.slice(3, 6) + "-" + dg.slice(6); data.phone = v; return; }
    if (key === "email") { v = v.replace(/\s+at\s+/gi, "@").replace(/\s+dot\s+/gi, ".").replace(/\s+/g, "").toLowerCase(); data.email = v; return; }
    if (key === "state") { var full = normalizeState(v); data.state = full || v; return; }
    if (key === "expected_revenue") {
      var ro = optionsFor("expected_revenue") || [];
      var pick2 = function (re) { return ro.filter(function (o) { return re.test(o); })[0] || ""; };
      if (/not sure|unsure|don.?t know|no idea/.test(t)) data.expected_revenue = pick2(/^Not sure/i);
      else if (/over|more|above|already have|\b(6|7|8|9)\d{4}\b|\d{6,}|100k|[6-9]0k|\b[1-9]\d{2}k\b/.test(t)) data.expected_revenue = pick2(/^Over/i);
      else data.expected_revenue = pick2(/^Under/i);
      var m = v.match(/\$?\s?\d[\d,\.]*\s?(k|thousand|million)?/i); if (m && /pledg|have|raised|in hand|commit|gift|grant/.test(t)) data.existing_funds = v.slice(0, 140);
      return; }
    if (key === "org_type") { var opts = optionsFor("org_type"); var pick = null;
      if (/synagog|temple|church|shul|mosque|congregat|minist|religio/.test(t)) pick = opts[1]; else if (/animal|dog|cat|rescue|shelter|pet/.test(t)) pick = opts[2]; else if (/food|soup|pantry|meal|kitchen|hunger/.test(t)) pick = opts[3]; else if (/school|educat|tutor|scholar|literacy|learn/.test(t)) pick = opts[4]; else if (/youth|sport|kid|child|league|camp|mentor/.test(t)) pick = opts[5]; else if (/art|music|theat|museum|cultur|choir|dance/.test(t)) pick = opts[6]; else if (/other/.test(t)) pick = opts[7]; else pick = opts[0];
      data.org_type = pick; return; }
    if (key === "notes") { data.notes = v; var h = v.match(/(heard|found|saw|referr|from)\s+(.{0,60})$/i); if (h) data.heard_about = h[2]; return; }
    data[key] = v;
  }
  var STATES = (optionsFor("state") || []);
  var ABBR = { al: "Alabama", ak: "Alaska", az: "Arizona", ar: "Arkansas", ca: "California", co: "Colorado", ct: "Connecticut", de: "Delaware", dc: "District of Columbia", fl: "Florida", ga: "Georgia", hi: "Hawaii", id: "Idaho", il: "Illinois", in: "Indiana", ia: "Iowa", ks: "Kansas", ky: "Kentucky", la: "Louisiana", me: "Maine", md: "Maryland", ma: "Massachusetts", mi: "Michigan", mn: "Minnesota", ms: "Mississippi", mo: "Missouri", mt: "Montana", ne: "Nebraska", nv: "Nevada", nh: "New Hampshire", nj: "New Jersey", nm: "New Mexico", ny: "New York", nc: "North Carolina", nd: "North Dakota", oh: "Ohio", ok: "Oklahoma", or: "Oregon", pa: "Pennsylvania", ri: "Rhode Island", sc: "South Carolina", sd: "South Dakota", tn: "Tennessee", tx: "Texas", ut: "Utah", vt: "Vermont", va: "Virginia", wa: "Washington", wv: "West Virginia", wi: "Wisconsin", wy: "Wyoming" };
  function normalizeState(v) {
    var t = v.trim().toLowerCase().replace(/\./g, "");
    if (ABBR[t]) return ABBR[t];
    var hit = null; STATES.forEach(function (s) { if (!hit && t.indexOf(s.toLowerCase()) !== -1) hit = s; });
    if (!hit && /new york|nyc|brooklyn|queens|bronx|manhattan|long island/.test(t)) hit = "New York";
    return hit;
  }

  /* ---- summary panel ---- */
  function renderSummary() {
    var box = $("fields"); if (!box) return;
    box.innerHTML = "";
    var filled = 0;
    FIELDS.forEach(function (f) {
      if (!f.required && !data[f.key]) return;
      var d = document.createElement("div"); var v = data[f.key];
      d.className = "fld " + (v ? "ok" : "miss");
      d.innerHTML = "<b>" + esc(LABEL[f.key]) + "</b><span>" + (v ? esc(v) : "not yet") + "</span>";
      box.appendChild(d);
    });
    REQUIRED.forEach(function (k) { if (data[k]) filled++; });
    var pct = Math.round(filled / REQUIRED.length * 100);
    var bar = qs("#prog i"); if (bar) bar.style.width = pct + "%";
    var pl = $("progl"); if (pl) pl.textContent = filled + " of " + REQUIRED.length + " essentials filled in";
    var send = $("sendwiz"); if (send) send.disabled = !(data.full_name && data.phone);
    // mirror into the contact form
    KEYS.forEach(function (k) { var el = $("f_" + k); if (el && data[k] && el.value !== data[k]) { if (el.tagName === "SELECT") { var found = false; qsa("option", el).forEach(function (o) { if (o.value === data[k]) found = true; }); if (found) el.value = data[k]; } else el.value = data[k]; } });
  }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function missingRequired() { return REQUIRED.filter(function (k) { return !data[k]; }); }
  function scriptFor(key) { return SCRIPT.filter(function (s) { return s.key === key; })[0]; }

  /* ---- conversation flow ---- */
  function start() {
    if (started) return; started = true; busy = true;
    wizardSay(NW.greeting, 600).then(function () { return wizardSay(NW.freePrompt || "Tell me about the nonprofit you want to start, in your own words. What will it do, for whom, and where?", 900); })
      .then(function () { stage = "free"; busy = false; });
  }
  function nextQuestion() {
    var miss = missingRequired();
    if (!miss.length) { stage = "done"; return wizardSay(NW.done, 900).then(function () { renderSummary(); }); }
    askKey = miss[0]; stage = "fill";
    var sc = scriptFor(askKey); var q = sc ? sc.wizard_says : "What is your " + LABEL[askKey].toLowerCase() + "?";
    // Skip re-asking bundled keys when the primary already asked
    return wizardSay(q);
  }
  function handleUser(text) {
    if (!text || busy) return;
    addMsg("you", text); input.value = ""; autoGrow(); busy = true; sendBtn.disabled = true;
    var p;
    if (stage === "intro") { stage = "free"; }
    if (aiOnline && bridgeReady) {
      p = extractWithAI().catch(function (e) { setOnline(false); addMsg("sys", "The AI helper is resting; I'll guide you step by step instead."); if (stage === "fill" && askKey) localSet(askKey, text); else if (stage === "free") guessFromFreeText(text); });
    } else {
      if (stage === "fill" && askKey) localSet(askKey, text); else guessFromFreeText(text);
      p = Promise.resolve();
    }
    p.then(function () {
      renderSummary();
      if (stage === "done") { return wizardSay("Noted. I've updated your details — press “Send to our team” whenever you're ready, or keep adding anything you'd like us to know."); }
      if (stage === "free") { var got = KEYS.filter(function (k) { return data[k]; }).length; var left = missingRequired().length; return wizardSay(!got ? "Thank you. Let me ask a few quick questions so I have everything our team needs." : left ? "Lovely. I've filled in " + got + " detail" + (got > 1 ? "s" : "") + " so far. " + (left === 1 ? "One quick question" : "A few quick questions") + " to finish up." : "Lovely. I've filled in " + got + " details from what you told me, and that covers everything essential.").then(nextQuestion); }
      return nextQuestion();
    }).catch(function (e) { addMsg("sys", "Hmm, something went wrong. Please try again."); })
      .then(function () { busy = false; sendBtn.disabled = false; input.focus({ preventScroll: true }); });
  }
  function guessFromFreeText(text) {
    // best-effort offline extraction from a free description
    var m = text.match(/\b(?:my name is|i am|i'm|this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z'-]+){0,2})/); if (m && !data.full_name) data.full_name = m[1];
    var e = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/); if (e && !data.email) data.email = e[0].toLowerCase();
    var ph = text.match(/(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/); if (ph && !data.phone) localSet("phone", ph[0]);
    var st = normalizeState(text); if (st && !data.state) data.state = st;
    var nm = text.match(/(?:called|named|name is|name it)\s+["“]?([A-Z][^.,"”\n]{2,60})["”]?/); if (nm && !data.org_name) data.org_name = nm[1].trim();
    if (!data.mission) data.mission = text.trim().slice(0, 600);
    if (optionsFor("org_type") && !data.org_type) localSet("org_type", text);
    if (optionsFor("expected_revenue") && /\$|\bk\b|thousand|donat|fund|raise|budget|money/i.test(text) && !data.expected_revenue) localSet("expected_revenue", text);
  }
  function autoGrow() { input.style.height = "auto"; input.style.height = Math.min(160, input.scrollHeight) + "px"; }
  if (input) {
    input.addEventListener("input", autoGrow);
    input.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleUser(input.value.trim()); } });
    input.addEventListener("focus", start);
  }
  if (sendBtn) sendBtn.addEventListener("click", function () { start(); handleUser(input.value.trim()); });
  qsa("[data-start-wizard]").forEach(function (b) { b.addEventListener("click", function () { start(); input.focus({ preventScroll: true }); }); });
  if ("IntersectionObserver" in window && log) { var lio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { start(); lio.disconnect(); } }); }, { threshold: .4 }); lio.observe(log); }

  /* ---- voice ---- */
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition, rec = null, recOn = false;
  if (micBtn) {
    if (!SR) { micBtn.title = "Voice input isn't supported in this browser"; micBtn.style.opacity = ".45"; }
    micBtn.addEventListener("click", function () {
      if (!SR) { addMsg("sys", "Voice typing isn't available in this browser — typing works just as well."); return; }
      start();
      if (recOn) { rec.stop(); return; }
      rec = new SR(); rec.lang = "en-US"; rec.interimResults = true; rec.continuous = true;
      var base = input.value ? input.value + " " : "", finalT = "";
      rec.onresult = function (ev) { var interim = ""; for (var i = ev.resultIndex; i < ev.results.length; i++) { var t = ev.results[i][0].transcript; if (ev.results[i].isFinal) finalT += t + " "; else interim += t; } input.value = base + finalT + interim; autoGrow(); if (/\b(stop|that's all|send it)\b\.?\s*$/i.test(finalT)) { input.value = base + finalT.replace(/\b(stop|that's all|send it)\b\.?\s*$/i, ""); rec.stop(); } };
      rec.onend = function () { recOn = false; micBtn.classList.remove("rec"); micBtn.setAttribute("aria-pressed", "false"); if (input.value.trim()) handleUser(input.value.trim()); };
      rec.onerror = function () { recOn = false; micBtn.classList.remove("rec"); };
      try { rec.start(); recOn = true; micBtn.classList.add("rec"); micBtn.setAttribute("aria-pressed", "true"); addMsg("sys", "Listening… speak naturally, then pause or say “stop”."); } catch (e) { }
    });
  }

  /* ============================================================
     SUBMISSION — shared by wizard + contact form
     ============================================================ */
  function payload(source) {
    var p = {};
    FIELDS.forEach(function (f) { var el = $("f_" + f.key); var v = (el && el.value) ? el.value : data[f.key]; if (v) p[f.key] = v; });
    p.source = source;
    if (transcript.length) p.wizard_transcript = transcriptText().slice(0, 6000);
    p.website = $("f__honey") ? $("f__honey").value : "";
    return p;
  }
  function submit(source, btn, okEl, badEl) {
    var p = payload(source);
    var digits = (p.phone || "").replace(/\D/g, "");
    if (!p.full_name || digits.length < 7 || digits.length > 15) { showAlert(badEl, "Please add your name and a valid callback number so we can reach you."); return Promise.resolve(false); }
    var orig = btn.innerHTML; btn.disabled = true; btn.innerHTML = "Sending…";
    hideAlert(badEl); hideAlert(okEl);
    var controller = new AbortController(), timer = setTimeout(function () { controller.abort(); }, 30000);
    return fetch(NW.formEndpoint, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(p), signal: controller.signal })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok && j.ok === true, j: j }; }); })
      .then(function (res) {
        if (!res.ok) throw new Error((res.j && res.j.message) || "send failed");
        hideAlert(badEl); showAlert(okEl, NW.successMessage); btn.innerHTML = "Sent ✓";
        // Google Ads conversion: consultation request
        if (window.nwTrack) { nwTrack("consult"); } else if (window.gtag) { gtag("event", "conversion", { send_to: "AW-18523106729/baTFCPmFnKUdEKnbwIBF" }); }
        try { localStorage.setItem("nw_sent", "1"); } catch (e) { }
        return true;
      })
      .catch(function (e) {
        btn.disabled = false; btn.innerHTML = orig;
        showAlert(badEl, "We could not confirm that your request was sent. Please try again or call Shai at 561-212-1192.");
        return false;
      }).finally(function () { clearTimeout(timer); });
  }
  function showAlert(el, text) { if (!el) return; el.textContent = text; el.classList.add("show"); el.scrollIntoView({ behavior: "smooth", block: "center" }); }
  function hideAlert(el) { if (el) el.classList.remove("show"); }

  var sendWiz = $("sendwiz");
  if (sendWiz) sendWiz.addEventListener("click", function () {
    submit("AI Wizard chat", sendWiz, $("wizok"), $("wizbad")).then(function (ok) { if (ok) { stage = "done"; addMsg("wizard", "Sent! Our team has everything. Someone will get back to you within a few hours for your free consultation. ✨"); } });
  });
  var editBtn = $("editwiz");
  if (editBtn) editBtn.addEventListener("click", function () { renderSummary(); location.hash = "#contact"; });

  var form = $("leadform");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var bad = false;
      FIELDS.forEach(function (f) { var el = $("f_" + f.key); if (!el) return; var wrap = el.closest(".f"); var v = el.value.trim(); var inv = f.required && !v; if (f.key === "email" && v && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) inv = true; if (wrap) wrap.classList.toggle("invalid", inv); if (inv) bad = true; });
      if (bad) { showAlert($("formbad"), "Please fill in the highlighted fields."); return; }
      if ($("f__honey") && $("f__honey").value) return;
      FIELDS.forEach(function (f) { var el = $("f_" + f.key); if (el) data[f.key] = el.value.trim(); });
      submit("Contact form", $("formsend"), $("formok"), $("formbad"));
    });
    qsa("input,select,textarea", form).forEach(function (el) { el.addEventListener("input", function () { var w = el.closest(".f"); if (w) w.classList.remove("invalid"); }); });
  }

  renderSummary();
  setupBridge();
  setTimeout(function () { if (!bridgeReady) setOnline(false); }, 9000);
})();

