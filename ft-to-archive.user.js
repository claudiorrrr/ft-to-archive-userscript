// ==UserScript==
// @name         FT → archive.today
// @namespace    https://github.com/claudiorrrr/ft-to-archive-userscript
// @version      1.1.0
// @description  Send any ft.com article link to its archive.today snapshot (read past the paywall). Personal use.
// @author       claudiorrrr
// @downloadURL  https://raw.githubusercontent.com/claudiorrrr/ft-to-archive-userscript/main/ft-to-archive.user.js
// @updateURL    https://raw.githubusercontent.com/claudiorrrr/ft-to-archive-userscript/main/ft-to-archive.user.js
// @match        *://www.ft.com/*
// @match        *://ft.com/*
// @include      *
// @run-at       document-start
// @grant        none
// @noframes
// ==/UserScript==

(function () {
  "use strict";

  var ARCHIVE = "https://archive.fo"; // mirror: .ph / .today / .li / .md / .is all work
  var FT_ARTICLE = /^https?:\/\/(www\.)?ft\.com\/content\/[^/?#]+/i;

  function toArchive(url) {
    return ARCHIVE + "/newest/" + url;
  }

  // 1) If we LANDED on an FT article page, bounce straight to the archive.
  //    document-start + replace() so the FT paywall never paints and there's
  //    no back-button trap.
  var here = location.href;
  if (FT_ARTICLE.test(here) && !/\/newest\//.test(here)) {
    location.replace(toArchive(here));
    return; // stop running the rest on a page we're leaving
  }

  // 2) On any OTHER page, intercept clicks on FT article links and redirect.
  //    Capture phase so we beat the site's own click handlers.
  function findAnchor(node) {
    while (node && node.nodeType === 1 && node.tagName !== "A") node = node.parentNode;
    return node && node.tagName === "A" ? node : null;
  }

  document.addEventListener(
    "click",
    function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = findAnchor(e.target);
      if (!a || !a.href || !FT_ARTICLE.test(a.href)) return;
      if (/\/newest\//.test(a.href)) return;
      e.preventDefault();
      e.stopPropagation();
      window.location.href = toArchive(a.href);
    },
    true
  );

  // 3) Also rewrite hrefs so middle-click / open-in-new-tab / hover-preview
  //    point at the archive too. Runs now and on DOM mutations.
  function rewriteLinks(root) {
    var links = (root || document).querySelectorAll('a[href*="ft.com/content/"]');
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      if (a.dataset.ftArchived) continue;
      if (FT_ARTICLE.test(a.href) && !/\/newest\//.test(a.href)) {
        a.href = toArchive(a.href);
        a.dataset.ftArchived = "1";
      }
    }
  }

  function init() {
    rewriteLinks(document);
    var mo = new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        for (var j = 0; j < muts[i].addedNodes.length; j++) {
          var n = muts[i].addedNodes[j];
          if (n.nodeType === 1) rewriteLinks(n);
        }
      }
    });
    mo.observe(document.documentElement || document, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
