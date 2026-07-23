(function () {
  'use strict';
  var list = Array.isArray(window.GIDI_WORDS) ? window.GIDI_WORDS : [];
  var set = new Set(list);
  var byLength = {};
  list.forEach(function (word) {
    var n = word.length;
    if (!byLength[n]) byLength[n] = [];
    byLength[n].push(word);
  });

  function clean(value) {
    return String(value || '').toLowerCase().replace(/[^a-z]/g, '');
  }
  function isWord(value, minLength) {
    var word = clean(value);
    return word.length >= (minLength || 3) && set.has(word);
  }
  function random(items) {
    return items && items.length ? items[Math.floor(Math.random() * items.length)] : '';
  }
  function shuffle(items) {
    var copy = items.slice();
    for (var i = copy.length - 1; i > 0; i -= 1) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = copy[i]; copy[i] = copy[j]; copy[j] = t;
    }
    return copy;
  }
  function oneLetterApart(a, b) {
    if (a.length !== b.length) return false;
    var changes = 0;
    for (var i = 0; i < a.length; i += 1) {
      if (a[i] !== b[i]) changes += 1;
      if (changes > 1) return false;
    }
    return changes === 1;
  }
  function setStatus(el, text, kind) {
    if (!el) return;
    el.textContent = text;
    el.classList.remove('good', 'bad');
    if (kind) el.classList.add(kind);
  }
  function show(el) { if (el) el.hidden = false; }
  function hide(el) { if (el) el.hidden = true; }
  function vibrate(pattern) {
    try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) {}
  }
  function confetti(host, amount) {
    if (!host) return;
    var colors = ['#70e8ff', '#9b78ff', '#ff64bf', '#63ef9d', '#ffd85a'];
    for (var i = 0; i < (amount || 18); i += 1) {
      var bit = document.createElement('i');
      bit.style.position = 'absolute';
      bit.style.left = (45 + Math.random() * 10) + '%';
      bit.style.top = '48%';
      bit.style.width = '7px';
      bit.style.height = '11px';
      bit.style.borderRadius = '3px';
      bit.style.background = colors[i % colors.length];
      bit.style.pointerEvents = 'none';
      bit.style.zIndex = '50';
      bit.style.transition = 'transform .8s ease-out, opacity .8s ease-out';
      host.appendChild(bit);
      (function (node) {
        requestAnimationFrame(function () {
          var x = (Math.random() - .5) * 260;
          var y = -70 - Math.random() * 170;
          var r = (Math.random() - .5) * 700;
          node.style.transform = 'translate(' + x + 'px,' + y + 'px) rotate(' + r + 'deg)';
          node.style.opacity = '0';
        });
        setTimeout(function () { node.remove(); }, 900);
      }(bit));
    }
  }

  window.GidiWordCore = {
    list: list,
    set: set,
    byLength: byLength,
    clean: clean,
    isWord: isWord,
    random: random,
    shuffle: shuffle,
    oneLetterApart: oneLetterApart,
    setStatus: setStatus,
    show: show,
    hide: hide,
    vibrate: vibrate,
    confetti: confetti
  };
}());
