/* Gidi Games shared runtime · suite 3.0.1 */
(function () {
  "use strict";

  var VERSION = "3.0.1";
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
