/* Nonprofit Wizard - "Is your nonprofit idea ready?" 8-question quiz. Educational only. */
(function () {
  "use strict";
  var Q = [
    { area: "purpose", t: "Can you explain your idea in one or two sentences?", o: ["Not yet. It is still a feeling.", "Roughly, but it changes when I explain it.", "Yes. I can say who we help and how."] },
    { area: "purpose", t: "Do you know who you will serve and what the first program looks like?", o: ["Not really.", "I know the people, but not the first program.", "Yes: a clear group and a small first program."] },
    { area: "board", t: "Do you have people willing to serve on a board with you?", o: ["No one yet.", "One or two people, maybe.", "Three or more people I trust, ideally not all related to me."] },
    { area: "money", t: "Do you have a simple plan for how the first year will be paid for?", o: ["No plan yet.", "A rough idea of costs or where gifts might come from.", "A basic budget and a few likely sources of support."] },
    { area: "steps", t: "Do you know the big steps: state incorporation, then the IRS application?", o: ["No. I am not sure where to begin.", "I know some of them.", "Yes. I know the order and what comes first."] },
    { area: "ein", t: "Have you picked a name, checked that it is available, and chosen who will sign for the group?", o: ["Not yet.", "I have a name, but have not checked it.", "Name checked, and I know who the responsible person will be."] },
    { area: "after", t: "Do you know what a nonprofit must keep doing after it is approved?", o: ["No idea.", "I know there are yearly filings.", "Yes: annual filings, records, and board meetings."] },
    { area: "help", t: "Is there someone you can ask when you get stuck?", o: ["No one.", "A friend or relative who has not done this.", "Yes, a mentor, accountant or advisor."] }
  ];
  var AREAS = {
    purpose: { title: "Sharpen your purpose and first program", href: "article-before-you-start.html", text: "Seven decisions to make before you file anything." },
    board: { title: "Build your board and bylaws", href: "board-and-bylaws.html", text: "Who serves, what they do, and what bylaws are for." },
    money: { title: "Plan your first-year money", href: "startup-checklist.html", text: "A printable checklist that includes your budget and records." },
    steps: { title: "Learn the road from idea to approval", href: "nonprofit-roadmap.html", text: "The steps in order, in plain English." },
    ein: { title: "Get your name and EIN ready", href: "apply-for-ein-yourself.html", text: "What the free IRS application asks, and who signs it." },
    after: { title: "Know the ongoing responsibilities", href: "ongoing-responsibilities.html", text: "Annual filings, records and board meetings." }
  };
  var TIERS = [
    { max: 5, name: "Early idea stage", text: "You have the spark, and that is where every nonprofit starts. The next step is to turn it into a clear purpose and a short list of decisions." },
    { max: 11, name: "Taking shape", text: "You have real pieces in place. A few focused steps will turn them into a plan you can act on." },
    { max: 16, name: "Nearly ready", text: "You are well prepared. The next step is to make sure the official steps happen in the right order." }
  ];
  var root = document.getElementById("nw-quiz"); if (!root) return;
  var body = root.querySelector("[data-q-body]"), bar = root.querySelector("[data-q-bar]"), count = root.querySelector("[data-q-count]");
  var answers = [], i = 0;

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function progress() { bar.style.width = Math.round((i / Q.length) * 100) + "%"; bar.parentNode.setAttribute("aria-valuenow", String(i)); }

  function show() {
    var q = Q[i]; count.textContent = "Question " + (i + 1) + " of " + Q.length; progress();
    var html = '<fieldset class="q-set"><legend id="q-legend" tabindex="-1">' + esc(q.t) + "</legend>";
    q.o.forEach(function (o, n) {
      html += '<label class="q-opt"><input type="radio" name="q" value="' + n + '"' + (answers[i] === n ? " checked" : "") + "><span>" + esc(o) + "</span></label>";
    });
    html += '</fieldset><div class="q-nav">' + (i > 0 ? '<button type="button" class="btn btn-outline" data-back>Back</button>' : "<span></span>") +
      '<button type="button" class="btn btn-royal" data-next ' + (answers[i] == null ? "disabled" : "") + ">" + (i === Q.length - 1 ? "See my result" : "Next") + "</button></div>";
    body.innerHTML = html;
    var next = body.querySelector("[data-next]");
    body.querySelectorAll("input[name=q]").forEach(function (r) { r.addEventListener("change", function () { answers[i] = +r.value; next.disabled = false; }); });
    next.addEventListener("click", function () { if (answers[i] == null) return; i++; if (i >= Q.length) result(); else { show(); focusLegend(); } });
    var back = body.querySelector("[data-back]"); if (back) back.addEventListener("click", function () { i--; show(); focusLegend(); });
  }
  function focusLegend() { var l = document.getElementById("q-legend"); if (l) l.focus({ preventScroll: true }); root.scrollIntoView({ block: "start" }); }

  function result() {
    var total = answers.reduce(function (a, b) { return a + b; }, 0);
    var tier = TIERS.filter(function (t) { return total <= t.max; })[0];
    var weak = [];
    Q.forEach(function (q, n) { if (q.area !== "help" && answers[n] <= 1 && weak.indexOf(q.area) < 0) weak.push(q.area); });
    weak = weak.slice(0, 3);
    if (!weak.length) weak = ["steps"];
    count.textContent = "Your result"; bar.style.width = "100%"; bar.parentNode.setAttribute("aria-valuenow", String(Q.length));
    var h = '<div class="q-result"><span class="eyebrow">Your result</span><h2 id="q-result-h" tabindex="-1">' + esc(tier.name) + '</h2><p class="q-score">You scored ' + total + " out of " + (Q.length * 2) + ".</p><p>" + esc(tier.text) + "</p>";
    h += '<h3>Your best next reads</h3><ul class="q-guides">';
    weak.forEach(function (a) { var g = AREAS[a]; h += '<li><a href="' + g.href + '"><strong>' + esc(g.title) + "</strong><span>" + esc(g.text) + "</span></a></li>"; });
    h += "</ul>";
    h += '<div class="q-cta"><div><h3>Want to talk it through?</h3><p>A free consultation with Shai. A real person will get back to you within a few hours.</p><a class="btn btn-gold" href="index.html#contact">Request a free consultation</a> <a class="q-phone" href="tel:+15612121192">or call 561-212-1192</a></div>' +
      '<div><h3>Take the full checklist with you</h3><p>The free Nonprofit Startup Kit walks through every step from idea to 501(c)(3).</p><a class="btn btn-royal" href="startup-kit.html">Get the free Startup Kit</a></div></div>';
    h += '<p class="q-note">This quiz is general education, not legal or tax advice. Rules differ by state and situation.</p><button type="button" class="btn btn-outline" data-retake>Retake the quiz</button></div>';
    body.innerHTML = h;
    var hd = document.getElementById("q-result-h"); if (hd) hd.focus({ preventScroll: true });
    root.scrollIntoView({ block: "start" });
    body.querySelector("[data-retake]").addEventListener("click", function () { answers = []; i = 0; show(); focusLegend(); });
    if (window.nwTrack) { try { window.nwTrack("engage"); } catch (e) { } }
    if (window.gtag) { try { window.gtag("event", "quiz_complete", { score: total, result: tier.name }); } catch (e) { } }
  }
  show();
})();
