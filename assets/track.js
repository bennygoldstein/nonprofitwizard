/* Nonprofit Wizard conversion helper — the ONE place Google Ads labels live.
   Usage: nwTrack('consult' | 'phone' | 'signup' | 'question'). Empty label = skip. */
(function () {
  var LABELS = {
    consult: "AW-18523106729/baTFCPmFnKUdEKnbwIBF",
    phone: "AW-18523106729/-k4ICPyFnKUdEKnbwIBF",
    signup: "AW-18523106729/nI_cCMvWkqUdEKnbwIBF",
    question: "AW-18523106729/b_qrCM7WkqUdEKnbwIBF"
  };
  window.NW_CONVERSION_LABELS = LABELS;
  window.nwTrack = function (kind) {
    var label = LABELS[kind];
    if (!label || typeof window.gtag !== "function") return;
    try { window.gtag("event", "conversion", { send_to: label }); } catch (e) { }
  };
})();
