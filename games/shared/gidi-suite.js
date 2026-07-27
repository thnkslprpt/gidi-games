/* Gidi Games shared runtime · suite 3.0.2 */
(function () {
  "use strict";

  var VERSION = "3.0.2";
  var toastTimer = 0;

  function onReady(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
    } else {
      callback();
    }
  }

  function setViewportHeight() {
    document.documentElement.style.setProperty("--gidi-vh", (window.innerHeight * 0.01) + "px");
  }

  function safeStorageSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch (error) {
      return false;
    }
  }

  function getGameSlug() {
    var match = window.location.pathname.match(/\/games\/([^/]+)(?:\/|$)/);
    return match ? match[1] : "";
  }

  function showToast(message, duration) {
    var toast = document.querySelector(".gidi-suite-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "gidi-suite-toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.appendChild(toast);
    }
    toast.textContent = String(message || "");
    window.clearTimeout(toastTimer);
    window.requestAnimationFrame(function () {
      toast.classList.add("is-visible");
    });
    toastTimer = window.setTimeout(function () {
      toast.classList.remove("is-visible");
    }, typeof duration === "number" ? duration : 1800);
  }

  /* GIDI-OVERLAY-HOME:START */
  function overlayElementIsVisible(element) {
    if (!element || element.hidden || element.getAttribute("aria-hidden") === "true") {
      return false;
    }
    var style = window.getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) {
      return false;
    }
    var rect = element.getBoundingClientRect();
    return rect.width > 40 && rect.height > 40;
  }

  function overlayElementBlocksGame(element) {
    if (!overlayElementIsVisible(element)) {
      return false;
    }
    var rect = element.getBoundingClientRect();
    var style = window.getComputedStyle(element);
    var viewportWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    var viewportHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    var coversMostOfScreen = rect.width >= viewportWidth * 0.68 && rect.height >= viewportHeight * 0.48;
    var modalSemantics = element.getAttribute("aria-modal") === "true" || element.getAttribute("role") === "dialog";
    var knownOverlay = element.matches(
      ".gidi-ai-launch, dialog[open], #intro, #startOverlay, #overlay, #setupScreen, #modalLayer, " +
      ".overlay, .modal-layer, .modal-overlay, .start-overlay, .start-screen, .setup-screen, " +
      ".setup-overlay, .intro-screen, .launch-screen, [data-game-overlay]"
    );
    return coversMostOfScreen && (knownOverlay || modalSemantics || style.position === "fixed");
  }

  function installOverlayHomeLink() {
    if (document.querySelector(".gidi-suite-overlay-home")) {
      return;
    }
    var link = document.createElement("a");
    link.className = "gidi-suite-overlay-home";
    link.href = "../../";
    link.textContent = "All games";
    link.setAttribute("aria-label", "Back to all games");
    link.setAttribute("aria-hidden", "true");
    link.tabIndex = -1;
    document.body.appendChild(link);

    var selector = [
      ".gidi-ai-launch",
      "dialog[open]",
      "[aria-modal='true']",
      "[role='dialog']",
      "#intro",
      "#startOverlay",
      "#overlay",
      "#setupScreen",
      "#modalLayer",
      ".overlay",
      ".modal-layer",
      ".modal-overlay",
      ".start-overlay",
      ".start-screen",
      ".setup-screen",
      ".setup-overlay",
      ".intro-screen",
      ".launch-screen",
      "[data-game-overlay]"
    ].join(",");
    var updateQueued = false;

    function updateOverlayHome() {
      updateQueued = false;
      var candidates = document.querySelectorAll(selector);
      var shouldShow = false;
      var index;
      for (index = 0; index < candidates.length; index += 1) {
        if (candidates[index] !== link && overlayElementBlocksGame(candidates[index])) {
          shouldShow = true;
          break;
        }
      }
      var desiredAriaHidden = shouldShow ? "false" : "true";
      var desiredTabIndex = shouldShow ? 0 : -1;
      if (link.classList.contains("is-visible") !== shouldShow) {
        link.classList.toggle("is-visible", shouldShow);
      }
      if (link.getAttribute("aria-hidden") !== desiredAriaHidden) {
        link.setAttribute("aria-hidden", desiredAriaHidden);
      }
      if (link.tabIndex !== desiredTabIndex) {
        link.tabIndex = desiredTabIndex;
      }
    }

    function queueOverlayHomeUpdate() {
      if (updateQueued) {
        return;
      }
      updateQueued = true;
      window.requestAnimationFrame(updateOverlayHome);
    }

    if (window.MutationObserver) {
      new MutationObserver(queueOverlayHomeUpdate).observe(document.body, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ["class", "hidden", "style", "aria-hidden", "aria-modal", "open"]
      });
    }
    window.addEventListener("resize", queueOverlayHomeUpdate, { passive: true });
    window.addEventListener("orientationchange", queueOverlayHomeUpdate, { passive: true });
    queueOverlayHomeUpdate();
  }
  /* GIDI-OVERLAY-HOME:END */

  function addHomeLink() {
    var selector = [
      'a[href="../../"]',
      'a[href="../../index.html"]',
      'a[href="../.."]',
      "a[data-home-link]",
      ".back-link"
    ].join(",");
    var existing = document.querySelector(selector);
    if (existing) {
      existing.classList.add("gidi-suite-existing-home");
      if (existing.textContent.indexOf("←") === -1 && existing.textContent.indexOf("‹") === -1) {
        existing.insertBefore(document.createTextNode("← "), existing.firstChild);
      }
      if (!existing.getAttribute("aria-label")) {
        existing.setAttribute("aria-label", "Back to all games");
      }
      return;
    }

    var link = document.createElement("a");
    link.className = "gidi-suite-home";
    link.href = "../../";
    link.textContent = "All games";
    link.setAttribute("aria-label", "Back to all games");
    document.body.appendChild(link);
  }

  function addRevision() {
    if (document.querySelector(".gidi-suite-revision")) {
      return;
    }
    var title = document.querySelector("[data-game-title], h1, .top-title strong, .game-title");
    if (!title) {
      return;
    }
    var revision = document.createElement("span");
    revision.className = "gidi-suite-revision";
    revision.textContent = "suite " + VERSION;
    revision.title = "Shared Gidi Games suite revision " + VERSION;
    title.appendChild(revision);
  }

  function makeButtonsSafe() {
    var buttons = document.querySelectorAll("button:not([type])");
    var index;
    for (index = 0; index < buttons.length; index += 1) {
      buttons[index].setAttribute("type", "button");
    }
  }

  function installErrorBoundary() {
    var shown = false;
    function report() {
      if (shown) {
        return;
      }
      shown = true;
      showToast("Something went wrong. Reload the game to restart.", 4200);
    }
    window.addEventListener("error", report);
    window.addEventListener("unhandledrejection", report);
  }

  function rememberGame() {
    var slug = getGameSlug();
    if (slug) {
      safeStorageSet("gidi-last-game", slug);
      safeStorageSet("gidi-last-played-at", String(Date.now()));
    }
  }

  function init() {
    document.body.classList.add("gidi-suite");
    document.body.setAttribute("data-gidi-suite", VERSION);
    makeButtonsSafe();
    addHomeLink();
    installOverlayHomeLink();
    addRevision();
    rememberGame();
    installErrorBoundary();
  }

  setViewportHeight();
  window.addEventListener("resize", setViewportHeight, { passive: true });
  window.addEventListener("orientationchange", setViewportHeight, { passive: true });
  window.addEventListener("pageshow", setViewportHeight, { passive: true });

  window.GidiSuite = {
    version: VERSION,
    toast: showToast,
    setViewportHeight: setViewportHeight,
    safeStorageSet: safeStorageSet
  };

  onReady(init);
}());
