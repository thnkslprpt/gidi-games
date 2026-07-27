/* Gidi Games universal home safety · 1.0.0 */
(function () {
  "use strict";

  function onReady(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
    } else {
      callback();
    }
  }

  function isVisible(element) {
    if (!element || element.hidden || element.getAttribute("aria-hidden") === "true") {
      return false;
    }
    var style = window.getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) {
      return false;
    }
    var rect = element.getBoundingClientRect();
    var viewportWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    var viewportHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    return rect.width >= 24 && rect.height >= 24 &&
      rect.right > 0 && rect.bottom > 0 && rect.left < viewportWidth && rect.top < viewportHeight;
  }

  function topElementWithoutSafety(x, y, safetyLink) {
    var stack;
    var index;
    if (document.elementsFromPoint) {
      stack = document.elementsFromPoint(x, y);
      for (index = 0; index < stack.length; index += 1) {
        if (stack[index] !== safetyLink && !safetyLink.contains(stack[index])) {
          return stack[index];
        }
      }
      return null;
    }
    var topElement = document.elementFromPoint(x, y);
    return topElement === safetyLink || safetyLink.contains(topElement) ? null : topElement;
  }

  function isTappable(element, safetyLink) {
    if (!isVisible(element)) {
      return false;
    }
    var style = window.getComputedStyle(element);
    if (style.pointerEvents === "none") {
      return false;
    }
    var rect = element.getBoundingClientRect();
    var viewportWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    var viewportHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    var insetX = Math.min(8, rect.width * 0.22);
    var insetY = Math.min(8, rect.height * 0.22);
    var points = [
      [rect.left + rect.width / 2, rect.top + rect.height / 2],
      [rect.left + insetX, rect.top + insetY],
      [rect.right - insetX, rect.top + insetY],
      [rect.left + insetX, rect.bottom - insetY],
      [rect.right - insetX, rect.bottom - insetY]
    ];
    var index;
    for (index = 0; index < points.length; index += 1) {
      var x = Math.max(0, Math.min(viewportWidth - 1, points[index][0]));
      var y = Math.max(0, Math.min(viewportHeight - 1, points[index][1]));
      var topElement = topElementWithoutSafety(x, y, safetyLink);
      if (topElement && (topElement === element || element.contains(topElement))) {
        return true;
      }
    }
    return false;
  }

  function init() {
    var existingSafety = document.querySelector(".gidi-home-safety");
    var safetyLink = existingSafety || document.createElement("a");
    if (!existingSafety) {
      safetyLink.className = "gidi-home-safety";
      safetyLink.href = "../../";
      safetyLink.textContent = "All games";
      safetyLink.setAttribute("aria-label", "Back to all games");
      safetyLink.setAttribute("aria-hidden", "true");
      safetyLink.tabIndex = -1;
      document.body.appendChild(safetyLink);
    }

    var selector = [
      'a[href="../../"]',
      'a[href="../../index.html"]',
      'a[href="../.."]',
      'a[href="/gidi-games/"]',
      'a[href="/gidi-games/index.html"]',
      'a[href$="/gidi-games/"]',
      'a[href$="/gidi-games/index.html"]',
      "a[data-home-link]",
      ".gidi-suite-home",
      ".gidi-suite-overlay-home",
      ".gidi-suite-existing-home"
    ].join(",");
    var updateQueued = false;

    function update() {
      updateQueued = false;
      var candidates = document.querySelectorAll(selector);
      var hasUsableHome = false;
      var index;
      for (index = 0; index < candidates.length; index += 1) {
        if (candidates[index] !== safetyLink && isTappable(candidates[index], safetyLink)) {
          hasUsableHome = true;
          break;
        }
      }

      var shouldShow = !hasUsableHome;
      if (safetyLink.classList.contains("is-visible") !== shouldShow) {
        safetyLink.classList.toggle("is-visible", shouldShow);
      }
      var desiredAria = shouldShow ? "false" : "true";
      if (safetyLink.getAttribute("aria-hidden") !== desiredAria) {
        safetyLink.setAttribute("aria-hidden", desiredAria);
      }
      var desiredTabIndex = shouldShow ? 0 : -1;
      if (safetyLink.tabIndex !== desiredTabIndex) {
        safetyLink.tabIndex = desiredTabIndex;
      }
    }

    function queueUpdate() {
      if (updateQueued) {
        return;
      }
      updateQueued = true;
      window.requestAnimationFrame(update);
    }

    if (window.MutationObserver) {
      new MutationObserver(queueUpdate).observe(document.body, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ["class", "hidden", "style", "aria-hidden", "open", "href"]
      });
    }
    window.addEventListener("resize", queueUpdate, { passive: true });
    window.addEventListener("orientationchange", queueUpdate, { passive: true });
    window.addEventListener("pageshow", queueUpdate, { passive: true });
    window.addEventListener("scroll", queueUpdate, { passive: true, capture: true });
    document.addEventListener("transitionend", queueUpdate, true);
    document.addEventListener("animationend", queueUpdate, true);

    queueUpdate();
    window.setTimeout(queueUpdate, 120);
    window.setTimeout(queueUpdate, 650);
  }

  onReady(init);
}());
