/* Nonprofit Wizard conversion helper — the ONE place Google Ads labels live.
   Usage: nwTrack('consult' | 'phone' | 'signup' | 'question' | 'engage'). Empty label = skip. */
(function () {
  var LABELS = {
    consult: "AW-18523106729/baTFCPmFnKUdEKnbwIBF",
    phone: "AW-18523106729/-k4ICPyFnKUdEKnbwIBF",
    signup: "AW-18523106729/nI_cCMvWkqUdEKnbwIBF",
    question: "AW-18523106729/b_qrCM7WkqUdEKnbwIBF",
    engage: "AW-18523106729/nI_cCMvWkqUdEKnbwIBF"
  };
  window.NW_CONVERSION_LABELS = LABELS;
  window.nwTrack = function (kind) {
    var label = LABELS[kind];
    if (!label || typeof window.gtag !== "function") return;
    if (kind === "engage") {
      try {
        if (sessionStorage.getItem("nw_engaged_conv") === "1") return;
        sessionStorage.setItem("nw_engaged_conv", "1");
      } catch (e) {}
    }
    try { window.gtag("event", "conversion", { send_to: label }); } catch (e) { }
  };

  /* Engaged-visitor conversion signals for Google Ads Smart Bidding */
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a, button");
    if (!a) return;
    var href = a.getAttribute("href") || "";
    if (
      href.indexOf("Nonprofit-Startup-Kit.pdf") !== -1 ||
      href.indexOf("nonprofit-startup-kit.html") !== -1 ||
      href.indexOf("startup-checklist.html") !== -1 ||
      a.hasAttribute("data-start-wizard")
    ) {
      window.nwTrack("engage");
    }
  });

  var scrolledHalf = false;
  var stayed45s = false;
  function checkEngagedReader() {
    if (scrolledHalf && stayed45s) window.nwTrack("engage");
  }
  window.addEventListener("scroll", function () {
    var doc = document.documentElement;
    var maxScroll = (doc.scrollHeight || (document.body && document.body.scrollHeight) || 0) - window.innerHeight;
    if (maxScroll > 100 && window.scrollY / maxScroll >= 0.5) {
      scrolledHalf = true;
      checkEngagedReader();
    }
  }, { passive: true });
  setTimeout(function () {
    stayed45s = true;
    checkEngagedReader();
  }, 45000);
})();
