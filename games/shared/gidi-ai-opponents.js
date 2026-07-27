(function () {
  "use strict";

  var script = document.currentScript;
  var gameId = script && script.getAttribute("data-gidi-ai-game") || "";
  var state = {
    game: gameId,
    mode: "human",
    difficulty: "normal"
  };

  function isComputerMode() { return state.mode === "computer"; }
  function getDifficulty() { return state.difficulty; }
  function emitChange() {
    var event;
    try {
      event = new CustomEvent("gidi-ai-change", { detail: { mode: state.mode, difficulty: state.difficulty } });
    } catch (error) {
      event = document.createEvent("CustomEvent");
      event.initCustomEvent("gidi-ai-change", false, false, { mode: state.mode, difficulty: state.difficulty });
    }
    document.dispatchEvent(event);
  }
  function setMode(mode) {
    state.mode = mode === "computer" ? "computer" : "human";
    document.documentElement.setAttribute("data-gidi-ai-mode", state.mode);
    refreshControlStates();
    emitChange();
  }
  function setDifficulty(difficulty) {
    if (difficulty !== "easy" && difficulty !== "normal" && difficulty !== "hard") difficulty = "normal";
    state.difficulty = difficulty;
    document.documentElement.setAttribute("data-gidi-ai-difficulty", state.difficulty);
    refreshControlStates();
    emitChange();
  }

  window.GidiAIOpponent = {
    isComputerMode: isComputerMode,
    getDifficulty: getDifficulty,
    setMode: setMode,
    setDifficulty: setDifficulty
  };

  function all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }
  function one(selector, root) {
    return (root || document).querySelector(selector);
  }
  function randomItem(items) {
    return items.length ? items[Math.floor(Math.random() * items.length)] : null;
  }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function delayFor(base) {
    var factor = state.difficulty === "easy" ? 1.25 : state.difficulty === "hard" ? 0.8 : 1;
    return Math.round(base * factor + Math.random() * 180);
  }
  function visible(element) {
    if (!element) return false;
    return !element.hidden && !element.classList.contains("hidden") && window.getComputedStyle(element).display !== "none";
  }
  function trustedBlock(event) {
    if (event.isTrusted) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return true;
    }
    return false;
  }
  function putText(el, text) {
    if (el && el.textContent !== text) el.textContent = text;
  }
  function setText(selector, text) {
    putText(one(selector), text);
  }
  function putTrailingText(el, text) {
    if (!el) return;
    var textNode = null;
    for (var i = el.childNodes.length - 1; i >= 0; i -= 1) {
      if (el.childNodes[i].nodeType === 3) { textNode = el.childNodes[i]; break; }
    }
    if (!textNode) {
      el.appendChild(document.createTextNode(" " + text));
    } else if (textNode.nodeValue.trim() !== text) {
      textNode.nodeValue = " " + text;
    }
  }

  function controlsMarkup(extraClass) {
    var wrap = document.createElement("section");
    wrap.className = "gidi-ai-controls " + (extraClass || "");
    wrap.setAttribute("aria-label", "Opponent settings");
    wrap.innerHTML =
      '<div class="gidi-ai-setting">' +
        '<span class="gidi-ai-label">Opponent</span>' +
        '<div class="gidi-ai-segment">' +
          '<button type="button" data-gidi-ai-mode="human">2 Players</button>' +
          '<button type="button" data-gidi-ai-mode="computer">Computer</button>' +
        '</div>' +
      '</div>' +
      '<div class="gidi-ai-setting gidi-ai-difficulty">' +
        '<span class="gidi-ai-label">Computer level</span>' +
        '<div class="gidi-ai-segment gidi-ai-three">' +
          '<button type="button" data-gidi-ai-difficulty="easy">Easy</button>' +
          '<button type="button" data-gidi-ai-difficulty="normal">Normal</button>' +
          '<button type="button" data-gidi-ai-difficulty="hard">Hard</button>' +
        '</div>' +
      '</div>';
    all("[data-gidi-ai-mode]", wrap).forEach(function (button) {
      button.addEventListener("click", function () { setMode(button.getAttribute("data-gidi-ai-mode")); });
    });
    all("[data-gidi-ai-difficulty]", wrap).forEach(function (button) {
      button.addEventListener("click", function () { setDifficulty(button.getAttribute("data-gidi-ai-difficulty")); });
    });
    return wrap;
  }

  function refreshControlStates() {
    all("[data-gidi-ai-mode]").forEach(function (button) {
      button.classList.toggle("selected", button.getAttribute("data-gidi-ai-mode") === state.mode);
      button.setAttribute("aria-pressed", button.getAttribute("data-gidi-ai-mode") === state.mode ? "true" : "false");
    });
    all("[data-gidi-ai-difficulty]").forEach(function (button) {
      button.classList.toggle("selected", button.getAttribute("data-gidi-ai-difficulty") === state.difficulty);
      button.setAttribute("aria-pressed", button.getAttribute("data-gidi-ai-difficulty") === state.difficulty ? "true" : "false");
    });
    all(".gidi-ai-difficulty").forEach(function (row) { row.hidden = !isComputerMode(); });
  }

  function insertBeforeStart(panel, startButton) {
    if (!panel || !startButton || one(".gidi-ai-controls", panel)) return null;
    var controls = controlsMarkup();
    panel.insertBefore(controls, startButton);
    refreshControlStates();
    return controls;
  }

  function setupGenericOverlay() {
    var intro = one("#intro") || one("#startOverlay") || one("#overlay");
    if (!intro) return;
    var panel = one(".dialog", intro) || one(".panel", intro) || one(".card", intro);
    var start = one("#startBtn", intro) || one("#startButton", intro);
    insertBeforeStart(panel, start);
  }

  function updateCommonLabels() {
    if (gameId === "air-hockey") {
      var labels = all(".player-label");
      if (labels[0]) putText(labels[0], isComputerMode() ? "You" : "Blue");
      if (labels[1]) putText(labels[1], isComputerMode() ? "Computer" : "Red");
    } else if (gameId === "reaction-duel") {
      var names = all(".player-name");
      if (names[0]) putText(names[0], isComputerMode() ? "You" : "Player 1");
      if (names[1]) putText(names[1], isComputerMode() ? "Computer" : "Player 2");
    } else {
      var p1 = one("#p1Box small") || one("#player1Card .player-label") || one("#playerOnePanel .player-name");
      var p2 = one("#p2Box small") || one("#player2Card .player-label") || one("#playerTwoPanel .player-name");
      if (gameId === "connect-4") {
        putTrailingText(p1, isComputerMode() ? "You" : "Player 1");
        putTrailingText(p2, isComputerMode() ? "Computer" : "Player 2");
      } else {
        if (p1) putText(p1, p1.textContent.replace(/^(Player 1|You)/, isComputerMode() ? "You" : "Player 1"));
        if (p2) putText(p2, p2.textContent.replace(/^(Player 2|Computer)/, isComputerMode() ? "Computer" : "Player 2"));
      }
    }
  }

  document.addEventListener("gidi-ai-change", updateCommonLabels);

  function initConnect4() {
    var launch = document.createElement("div");
    launch.className = "gidi-ai-launch";
    launch.innerHTML = '<section class="gidi-ai-launch-card"><div class="gidi-ai-launch-icon">4</div><h2>Connect 4</h2><p>Choose a local opponent. You always place the first disc against the computer.</p><button class="gidi-ai-start" type="button">Start match</button></section>';
    var card = one(".gidi-ai-launch-card", launch);
    var start = one(".gidi-ai-start", launch);
    card.insertBefore(controlsMarkup(), start);
    document.body.appendChild(launch);
    start.addEventListener("click", function () {
      launch.hidden = true;
      updateCommonLabels();
    });

    var boardEl = one("#board");
    var p2Card = one("#player2Card");
    var status = one("#statusText");
    var pending = false;
    var lastSignature = "";

    function readBoard() {
      var slots = all(".slot", boardEl);
      var board = [];
      for (var r = 0; r < 6; r += 1) {
        board[r] = [];
        for (var c = 0; c < 7; c += 1) {
          var slot = slots[r * 7 + c];
          board[r][c] = slot && one(".disc.red", slot) ? 1 : slot && one(".disc.yellow", slot) ? 2 : 0;
        }
      }
      return board;
    }
    function validColumns(board) {
      var result = [];
      for (var c = 0; c < 7; c += 1) if (board[0][c] === 0) result.push(c);
      return result;
    }
    function drop(board, col, player) {
      for (var r = 5; r >= 0; r -= 1) {
        if (board[r][col] === 0) { board[r][col] = player; return r; }
      }
      return -1;
    }
    function undo(board, row, col) { if (row >= 0) board[row][col] = 0; }
    function wins(board, player) {
      var dirs = [[0,1],[1,0],[1,1],[1,-1]];
      for (var r = 0; r < 6; r += 1) for (var c = 0; c < 7; c += 1) {
        if (board[r][c] !== player) continue;
        for (var d = 0; d < dirs.length; d += 1) {
          var ok = true;
          for (var k = 1; k < 4; k += 1) {
            var rr = r + dirs[d][0] * k, cc = c + dirs[d][1] * k;
            if (rr < 0 || rr >= 6 || cc < 0 || cc >= 7 || board[rr][cc] !== player) { ok = false; break; }
          }
          if (ok) return true;
        }
      }
      return false;
    }
    function windowScore(values, player) {
      var opponent = player === 2 ? 1 : 2;
      var own = 0, enemy = 0, empty = 0;
      values.forEach(function (v) { if (v === player) own += 1; else if (v === opponent) enemy += 1; else empty += 1; });
      if (own === 4) return 100000;
      if (own === 3 && empty === 1) return 120;
      if (own === 2 && empty === 2) return 16;
      if (enemy === 3 && empty === 1) return -105;
      if (enemy === 2 && empty === 2) return -10;
      return 0;
    }
    function evaluate(board) {
      var score = 0;
      for (var r = 0; r < 6; r += 1) if (board[r][3] === 2) score += 7;
      var values = [];
      for (r = 0; r < 6; r += 1) for (var c = 0; c < 4; c += 1) score += windowScore([board[r][c],board[r][c+1],board[r][c+2],board[r][c+3]],2);
      for (c = 0; c < 7; c += 1) for (r = 0; r < 3; r += 1) score += windowScore([board[r][c],board[r+1][c],board[r+2][c],board[r+3][c]],2);
      for (r = 0; r < 3; r += 1) for (c = 0; c < 4; c += 1) score += windowScore([board[r][c],board[r+1][c+1],board[r+2][c+2],board[r+3][c+3]],2);
      for (r = 3; r < 6; r += 1) for (c = 0; c < 4; c += 1) score += windowScore([board[r][c],board[r-1][c+1],board[r-2][c+2],board[r-3][c+3]],2);
      return score;
    }
    function minimax(board, depth, alpha, beta, maximizing) {
      var valid = validColumns(board);
      if (wins(board, 2)) return 1000000 + depth;
      if (wins(board, 1)) return -1000000 - depth;
      if (!depth || !valid.length) return evaluate(board);
      var order = [3,2,4,1,5,0,6].filter(function (c) { return valid.indexOf(c) !== -1; });
      if (maximizing) {
        var best = -Infinity;
        for (var i = 0; i < order.length; i += 1) {
          var row = drop(board, order[i], 2);
          best = Math.max(best, minimax(board, depth - 1, alpha, beta, false));
          undo(board, row, order[i]);
          alpha = Math.max(alpha, best);
          if (alpha >= beta) break;
        }
        return best;
      }
      var low = Infinity;
      for (i = 0; i < order.length; i += 1) {
        row = drop(board, order[i], 1);
        low = Math.min(low, minimax(board, depth - 1, alpha, beta, true));
        undo(board, row, order[i]);
        beta = Math.min(beta, low);
        if (alpha >= beta) break;
      }
      return low;
    }
    function chooseColumn(board) {
      var valid = validColumns(board);
      if (!valid.length) return -1;
      var i, row;
      for (i = 0; i < valid.length; i += 1) {
        row = drop(board, valid[i], 2); var win = wins(board, 2); undo(board, row, valid[i]); if (win) return valid[i];
      }
      var blocks = [];
      for (i = 0; i < valid.length; i += 1) {
        row = drop(board, valid[i], 1); var danger = wins(board, 1); undo(board, row, valid[i]); if (danger) blocks.push(valid[i]);
      }
      if (blocks.length && (state.difficulty !== "easy" || Math.random() < 0.72)) return randomItem(blocks);
      if (state.difficulty === "easy") {
        var weighted = valid.concat(valid.indexOf(3) >= 0 ? [3,3] : [], valid.indexOf(2) >= 0 ? [2] : [], valid.indexOf(4) >= 0 ? [4] : []);
        return randomItem(weighted);
      }
      var depth = state.difficulty === "hard" ? 5 : 4;
      var scored = valid.map(function (col) {
        var r = drop(board, col, 2);
        var value = minimax(board, depth - 1, -Infinity, Infinity, false);
        undo(board, r, col);
        return { col: col, score: value };
      }).sort(function (a, b) { return b.score - a.score; });
      if (state.difficulty === "normal" && scored.length > 1 && Math.random() < 0.16) return scored[1].col;
      if (state.difficulty === "hard" && scored.length > 1 && Math.random() < 0.045) return scored[1].col;
      return scored[0].col;
    }
    function schedule() {
      if (!isComputerMode() || launch.hidden === false || !p2Card || !p2Card.classList.contains("active") || pending) return;
      if (status && /wins|draw/i.test(status.textContent)) return;
      var board = readBoard();
      var signature = board.map(function (row) { return row.join(""); }).join("/");
      if (signature === lastSignature) return;
      lastSignature = signature;
      pending = true;
      window.setTimeout(function () {
        pending = false;
        if (!isComputerMode() || !p2Card.classList.contains("active")) return;
        var col = chooseColumn(readBoard());
        var button = one('.column-button[data-column="' + col + '"]');
        if (button && !button.disabled) button.click();
      }, delayFor(520));
    }
    one("#columnButtons").addEventListener("click", function (event) {
      if (isComputerMode() && p2Card.classList.contains("active") && event.isTrusted) trustedBlock(event);
    }, true);
    new MutationObserver(schedule).observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true });
    document.addEventListener("gidi-ai-change", function () { lastSignature = ""; updateCommonLabels(); schedule(); });
    refreshControlStates();
  }

  function initMemoryMatch() {
    var modal = one("#modalLayer .modal");
    var modalButton = one("#modalButton");
    if (modal && modalButton) insertBeforeStart(modal, modalButton);
    var board = one("#board");
    var p2Panel = one("#playerTwoPanel");
    var seen = {};
    var pending = false;
    var boardIdentity = "";

    function cardIndex(card) { return Number(card.getAttribute("data-card-index")); }
    function rememberVisible() {
      var cards = all(".card", board);
      var identity = cards.length + ":" + (one("#levelLabel") ? one("#levelLabel").textContent : "");
      if (identity !== boardIdentity) { boardIdentity = identity; seen = {}; }
      cards.forEach(function (card) {
        if (card.classList.contains("flipped")) seen[cardIndex(card)] = card.getAttribute("data-pair-id");
        if (card.classList.contains("matched")) delete seen[cardIndex(card)];
      });
    }
    function availableCards() {
      return all(".card", board).filter(function (card) { return !card.disabled && !card.classList.contains("matched"); });
    }
    function reliable() {
      var chance = state.difficulty === "easy" ? 0.42 : state.difficulty === "normal" ? 0.78 : 0.96;
      return Math.random() < chance;
    }
    function knownMate(first, candidates) {
      var pair = first.getAttribute("data-pair-id");
      var result = null;
      if (!reliable()) return null;
      candidates.forEach(function (card) {
        if (card !== first && seen[cardIndex(card)] === pair) result = card;
      });
      return result;
    }
    function knownPair(candidates) {
      if (!reliable()) return null;
      var byPair = {};
      candidates.forEach(function (card) {
        var pair = seen[cardIndex(card)];
        if (pair == null) return;
        if (!byPair[pair]) byPair[pair] = [];
        byPair[pair].push(card);
      });
      var pairs = Object.keys(byPair).filter(function (key) { return byPair[key].length >= 2; });
      return pairs.length ? byPair[randomItem(pairs)].slice(0, 2) : null;
    }
    function schedule() {
      rememberVisible();
      if (!isComputerMode() || !p2Panel || !p2Panel.classList.contains("active") || pending) return;
      var modalLayer = one("#modalLayer");
      if (modalLayer && modalLayer.classList.contains("show")) return;
      var cards = availableCards();
      if (!cards.length) return;
      pending = true;
      window.setTimeout(function () {
        pending = false;
        if (!isComputerMode() || !p2Panel.classList.contains("active")) return;
        rememberVisible();
        cards = availableCards();
        var flipped = cards.filter(function (card) { return card.classList.contains("flipped"); });
        if (flipped.length === 1) {
          var mate = knownMate(flipped[0], cards);
          var choices = cards.filter(function (card) { return card !== flipped[0] && !card.classList.contains("flipped"); });
          (mate || randomItem(choices)).click();
          return;
        }
        var pair = knownPair(cards.filter(function (card) { return !card.classList.contains("flipped"); }));
        if (pair) {
          pair[0].click();
        } else {
          randomItem(cards.filter(function (card) { return !card.classList.contains("flipped"); })).click();
        }
      }, delayFor(560));
    }
    board.addEventListener("click", function (event) {
      if (isComputerMode() && p2Panel.classList.contains("active") && event.isTrusted) trustedBlock(event);
    }, true);
    new MutationObserver(schedule).observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true });
    document.addEventListener("gidi-ai-change", function () { updateCommonLabels(); schedule(); });
    refreshControlStates();
  }

  function initReactionDuel() {
    setupGenericOverlay();
    var game = one("#game");
    var playerTwo = one("#playerTwo");
    var armed = false;
    var timer = 0;
    function fire() {
      if (!isComputerMode() || !game.classList.contains("is-ready") || armed) return;
      armed = true;
      var range = state.difficulty === "easy" ? [540, 850] : state.difficulty === "hard" ? [205, 335] : [330, 520];
      timer = window.setTimeout(function () {
        if (!isComputerMode() || !game.classList.contains("is-ready")) { armed = false; return; }
        var event;
        try { event = new PointerEvent("pointerdown", { bubbles: true, cancelable: true, pointerType: "mouse" }); }
        catch (error) { event = new MouseEvent("pointerdown", { bubbles: true, cancelable: true }); }
        playerTwo.dispatchEvent(event);
      }, range[0] + Math.random() * (range[1] - range[0]));
    }
    function observe() {
      if (!game.classList.contains("is-ready")) { armed = false; window.clearTimeout(timer); }
      else fire();
      updateCommonLabels();
    }
    playerTwo.addEventListener("pointerdown", function (event) {
      if (isComputerMode() && event.isTrusted) trustedBlock(event);
    }, true);
    new MutationObserver(observe).observe(game, { attributes: true, attributeFilter: ["class"] });
    document.addEventListener("gidi-ai-change", observe);
    updateCommonLabels();
  }

  function initAirHockey() {
    setupGenericOverlay();
    var canvas = one("#rink");
    if (canvas) {
      ["touchstart", "touchmove", "mousedown"].forEach(function (type) {
        canvas.addEventListener(type, function (event) {
          if (!isComputerMode() || !event.isTrusted) return;
          var rect = canvas.getBoundingClientRect();
          var x = event.touches && event.touches[0] ? event.touches[0].clientX : event.clientX;
          if (x - rect.left > rect.width / 2) trustedBlock(event);
        }, true);
      });
    }
    document.addEventListener("gidi-ai-change", updateCommonLabels);
    updateCommonLabels();
  }

  function initWordDuel() {
    var setup = one("#setupScreen .setup-card");
    var ready = one("#readyButton");
    if (setup && ready) insertBeforeStart(setup, ready);
    var input = one("#secretInput");
    var wrap = one("#secretWrap");
    var heading = one("#setupScreen h2");
    var copy = one("#setupScreen p");
    var message = one("#setupMessage");
    var start = one("#startButton");
    var easyWords = ["APPLE","BEACH","BREAD","CHAIR","CLOUD","DREAM","EARTH","FRUIT","GRAPE","GREEN","HOUSE","LIGHT","MONEY","MOUSE","MUSIC","NIGHT","PAPER","PLANT","RIVER","SMILE","STONE","TABLE","TIGER","WATER","WORLD"];
    var normalWords = ["BRICK","CABLE","CRANE","FLAME","GHOST","HONEY","LEMON","METAL","NURSE","OCEAN","PAINT","PILOT","ROBOT","SHEEP","SHIRT","SHORE","SPICE","STORM","TRAIN","WHEEL"];
    var hardWords = ["BRAVE","CROWN","DRINK","FLUTE","GLASS","HEART","JELLY","KNIFE","MARCH","PRIDE","QUIET","ROUND","SHARK","TRUCK","WOMAN"];
    function chosenWord() {
      return randomItem(state.difficulty === "easy" ? easyWords : state.difficulty === "hard" ? hardWords : normalWords);
    }
    function update() {
      var computer = isComputerMode();
      if (wrap && wrap.hidden !== computer) wrap.hidden = computer;
      putText(heading, computer ? "Guess the computer's word" : "Choose the secret");
      putText(copy, computer ? "The computer will choose a real five-letter word. You get six chances to crack it." : "Player 1, enter a real five-letter English word. Player 2 gets six chances to crack it.");
      if (ready) {
        putText(ready, computer ? "Start guessing" : "Ready — Hide the Word");
        if (computer && ready.disabled) ready.disabled = false;
      }
      if (message && computer) putText(message, "The secret stays entirely on this device.");
      setText("#playerChip", computer ? "YOU" : "P1");
    }
    ready.addEventListener("click", function () {
      if (!isComputerMode()) return;
      input.value = chosenWord();
      var inputEvent;
      try { inputEvent = new Event("input", { bubbles: true }); }
      catch (error) { inputEvent = document.createEvent("Event"); inputEvent.initEvent("input", true, true); }
      input.dispatchEvent(inputEvent);
      window.setTimeout(function () { if (start && visible(one("#handoverScreen"))) start.click(); }, 80);
    }, true);
    new MutationObserver(function () {
      update();
      if (isComputerMode() && visible(one("#handoverScreen"))) window.setTimeout(function () { if (visible(one("#handoverScreen"))) start.click(); }, 40);
      var result = one("#resultText");
      if (result && isComputerMode()) {
        var updatedResult = result.innerHTML.replace(/Player 2/g, "You");
        if (updatedResult !== result.innerHTML) result.innerHTML = updatedResult;
      }
    }).observe(document.body, { subtree: true, childList: true, attributes: true });
    document.addEventListener("gidi-ai-change", update);
    update();
  }

  function initLastLetter() {
    setupGenericOverlay();
    var p2 = one("#p2Box");
    var input = one("#wordInput");
    var submit = one("#submitBtn");
    var pending = false;
    function candidates() {
      var core = window.GidiWordCore;
      if (!core) return [];
      var needed = (one("#needed") ? one("#needed").textContent : "").toLowerCase();
      var used = {};
      all("#history .pill").forEach(function (pill) { used[pill.textContent.toLowerCase()] = true; });
      var list = core.list.filter(function (word) { return word.length >= 3 && word.length <= 10 && word.charAt(0) === needed && !used[word]; });
      if (state.difficulty === "easy") list = list.filter(function (word) { return word.length <= 6 && !/[qzx]$/.test(word); });
      return list;
    }
    function choose() {
      var list = candidates();
      if (!list.length) return null;
      if (state.difficulty === "easy") return randomItem(list.slice(0, Math.min(80, list.length)));
      var starts = {};
      window.GidiWordCore.list.forEach(function (w) { starts[w.charAt(0)] = (starts[w.charAt(0)] || 0) + 1; });
      list.sort(function (a, b) {
        var av = starts[a.slice(-1)] || 0, bv = starts[b.slice(-1)] || 0;
        if (state.difficulty === "hard") return av - bv || b.length - a.length;
        return b.length - a.length || bv - av;
      });
      var range = state.difficulty === "hard" ? Math.min(6, list.length) : Math.min(20, list.length);
      return randomItem(list.slice(0, range));
    }
    function schedule() {
      updateCommonLabels();
      var aiTurn = isComputerMode() && p2 && p2.classList.contains("active") && !submit.disabled;
      if (input.disabled !== aiTurn) input.disabled = aiTurn;
      if (!aiTurn || pending) return;
      pending = true;
      window.setTimeout(function () {
        pending = false;
        if (!isComputerMode() || !p2.classList.contains("active")) return;
        var word = choose();
        if (!word) return;
        input.disabled = false;
        input.value = word.toUpperCase();
        submit.click();
      }, delayFor(1000));
    }
    submit.addEventListener("click", function (event) { if (isComputerMode() && p2.classList.contains("active") && event.isTrusted) trustedBlock(event); }, true);
    new MutationObserver(schedule).observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true });
    document.addEventListener("gidi-ai-change", schedule);
    schedule();
  }

  function initWordMine() {
    var grid = one("#intro .grid-2");
    var solo = one('[data-mode="solo"]', grid);
    var duel = one('[data-mode="duel"]', grid);
    if (!grid || !solo || !duel) return;
    grid.classList.add("gidi-ai-mode-grid");
    var computer = document.createElement("button");
    computer.className = "choice";
    computer.type = "button";
    computer.innerHTML = "<strong>Computer</strong><small>Offline opponent</small>";
    grid.appendChild(computer);
    var difficulty = controlsMarkup("gidi-ai-word-mine-controls");
    var opponentRow = one(".gidi-ai-setting", difficulty);
    if (opponentRow) opponentRow.remove();
    grid.parentNode.insertBefore(difficulty, one("#startBtn"));
    function chooseSolo() { setMode("human"); computer.classList.remove("selected"); }
    function chooseDuel() { setMode("human"); computer.classList.remove("selected"); }
    solo.addEventListener("click", chooseSolo);
    duel.addEventListener("click", chooseDuel);
    computer.addEventListener("click", function () {
      duel.click();
      setMode("computer");
      solo.classList.remove("selected"); duel.classList.remove("selected"); computer.classList.add("selected");
    });
    var p2 = one("#p2Box");
    var keypad = one("#keypad");
    var pending = false;
    function chooseLetter() {
      var pattern = all("#wordDisplay .letter-chip").map(function (el) { return el.textContent === "•" ? "." : el.textContent.toLowerCase(); }).join("");
      var length = pattern.length;
      var correct = {};
      pattern.replace(/\./g, "").split("").forEach(function (ch) { correct[ch] = true; });
      var disabled = {};
      all("#keypad .key").forEach(function (key) { if (key.disabled) disabled[key.textContent.toLowerCase()] = true; });
      var wrong = Object.keys(disabled).filter(function (ch) { return !correct[ch]; });
      var regex = new RegExp("^" + pattern + "$");
      var words = (window.GidiWordCore.byLength[length] || []).filter(function (word) {
        if (!regex.test(word)) return false;
        for (var i = 0; i < wrong.length; i += 1) if (word.indexOf(wrong[i]) !== -1) return false;
        return true;
      });
      var scores = {};
      words.forEach(function (word) {
        var unique = {};
        word.split("").forEach(function (ch) { if (!disabled[ch] && !unique[ch]) { unique[ch] = true; scores[ch] = (scores[ch] || 0) + 1; } });
      });
      var ranked = Object.keys(scores).sort(function (a, b) { return scores[b] - scores[a]; });
      var unused = all("#keypad .key").filter(function (key) { return !key.disabled; }).map(function (key) { return key.textContent.toLowerCase(); });
      if (!ranked.length) ranked = unused;
      if (state.difficulty === "easy") return randomItem(ranked.slice(0, Math.min(8, ranked.length)));
      if (state.difficulty === "normal" && ranked.length > 2 && Math.random() < 0.2) return ranked[1 + Math.floor(Math.random() * Math.min(3, ranked.length - 1))];
      return ranked[0];
    }
    function schedule() {
      var aiTurn = isComputerMode() && p2.classList.contains("active") && visible(keypad);
      if (!aiTurn || pending) return;
      pending = true;
      window.setTimeout(function () {
        pending = false;
        if (!isComputerMode() || !p2.classList.contains("active")) return;
        var letter = chooseLetter();
        var key = all("#keypad .key").filter(function (b) { return b.textContent.toLowerCase() === letter; })[0];
        if (key && !key.disabled) key.click();
      }, delayFor(760));
    }
    keypad.addEventListener("click", function (event) { if (isComputerMode() && p2.classList.contains("active") && event.isTrusted) trustedBlock(event); }, true);
    one("#startBtn").addEventListener("click", function () { window.setTimeout(function () { setText("#p2Name", isComputerMode() ? "Computer" : "Player 2"); schedule(); }, 30); });
    new MutationObserver(schedule).observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true });
    document.addEventListener("gidi-ai-change", function () { refreshControlStates(); setText("#p2Name", isComputerMode() ? "Computer" : "Player 2"); schedule(); });
    refreshControlStates();
  }

  function initWordBuilder() {
    setupGenericOverlay();
    var p2 = one("#p2Box");
    var pending = false;
    function fragment() { return all("#builder .letter-chip").map(function (el) { return el.textContent.toLowerCase(); }).join(""); }
    function chooseMove(frag) {
      var core = window.GidiWordCore;
      var playable = core.list.filter(function (w) { return w.length >= 3 && w.length <= 10 && (!frag || w.indexOf(frag) !== -1); });
      var moves = [];
      "abcdefghijklmnopqrstuvwxyz".split("").forEach(function (ch) {
        ["left", "right"].forEach(function (side) {
          var next = side === "left" ? ch + frag : frag + ch;
          if (next.length > 10) return;
          var count = 0;
          for (var i = 0; i < playable.length; i += 1) if (playable[i].indexOf(next) !== -1) count += 1;
          if (count) moves.push({ ch: ch, side: side, next: next, count: count, legal: core.isWord(next, 3) });
        });
      });
      if (!moves.length) return null;
      if (state.difficulty === "easy") return randomItem(moves);
      moves.sort(function (a, b) {
        var aScore = Math.log(a.count + 1) * 8 - (a.legal ? 8 : 0) + a.next.length;
        var bScore = Math.log(b.count + 1) * 8 - (b.legal ? 8 : 0) + b.next.length;
        return bScore - aScore;
      });
      var top = state.difficulty === "hard" ? Math.min(4, moves.length) : Math.min(10, moves.length);
      return randomItem(moves.slice(0, top));
    }
    function schedule() {
      updateCommonLabels();
      if (!isComputerMode() || !p2.classList.contains("active") || pending) return;
      pending = true;
      window.setTimeout(function () {
        pending = false;
        if (!isComputerMode() || !p2.classList.contains("active")) return;
        var frag = fragment();
        var bank = one("#bankBtn");
        var shouldBank = !bank.disabled && (state.difficulty === "easy" ? frag.length >= 3 && Math.random() < 0.82 : state.difficulty === "normal" ? frag.length >= 4 && Math.random() < 0.82 : frag.length >= 5 || Math.random() < 0.45);
        if (shouldBank) { bank.click(); return; }
        var move = chooseMove(frag);
        if (!move) { if (!bank.disabled) bank.click(); return; }
        one(move.side === "left" ? "#leftBtn" : "#rightBtn").click();
        var key = all("#alpha .key").filter(function (button) { return button.textContent.toLowerCase() === move.ch; })[0];
        if (key) window.setTimeout(function () { key.click(); }, 180);
      }, delayFor(740));
    }
    ["#alpha", "#leftBtn", "#rightBtn", "#bankBtn"].forEach(function (selector) {
      var el = one(selector); if (el) el.addEventListener("click", function (event) { if (isComputerMode() && p2.classList.contains("active") && event.isTrusted) trustedBlock(event); }, true);
    });
    new MutationObserver(schedule).observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true });
    document.addEventListener("gidi-ai-change", schedule);
    schedule();
  }

  function initWordTerritory() {
    setupGenericOverlay();
    var board = one("#board");
    var p2 = one("#p2Box");
    var pending = false;
    var turnSignature = "";
    var trie = null;
    function buildTrie() {
      if (trie || !window.GidiWordCore) return;
      trie = {};
      window.GidiWordCore.list.forEach(function (word) {
        if (word.length < 3 || word.length > 9) return;
        var node = trie;
        for (var i = 0; i < word.length; i += 1) node = node[word.charAt(i)] || (node[word.charAt(i)] = {});
        node.$ = true;
      });
    }
    function findPaths() {
      buildTrie();
      var tiles = all(".tile", board);
      var size = Number(board.getAttribute("data-size")) || Math.round(Math.sqrt(tiles.length));
      var letters = tiles.map(function (tile) { return tile.textContent.toLowerCase(); });
      var blocked = tiles.map(function (tile) { return tile.classList.contains("blocked"); });
      var neutral = tiles.map(function (tile) { return !tile.classList.contains("p1") && !tile.classList.contains("p2"); });
      var results = [], used = new Array(tiles.length);
      var cap = state.difficulty === "easy" ? 90 : state.difficulty === "hard" ? 1600 : 750;
      function walk(index, node, path, fresh) {
        if (results.length >= cap || blocked[index] || used[index]) return;
        var next = node[letters[index]];
        if (!next) return;
        used[index] = true;
        path.push(index);
        fresh += neutral[index] ? 1 : 0;
        if (next.$ && path.length >= 3 && fresh > 0) results.push({ path: path.slice(), fresh: fresh, length: path.length });
        if (path.length < 9 && results.length < cap) {
          var r = Math.floor(index / size), c = index % size;
          if (r > 0) walk(index - size, next, path, fresh);
          if (r < size - 1) walk(index + size, next, path, fresh);
          if (c > 0) walk(index - 1, next, path, fresh);
          if (c < size - 1) walk(index + 1, next, path, fresh);
        }
        path.pop(); used[index] = false;
      }
      for (var i = 0; i < tiles.length && results.length < cap; i += 1) walk(i, trie, [], 0);
      if (!results.length) return null;
      results.sort(function (a, b) { return (b.fresh * 12 + b.length) - (a.fresh * 12 + a.length); });
      if (state.difficulty === "easy") {
        var simple = results.filter(function (item) { return item.length <= 5 && item.fresh <= 3; });
        return randomItem((simple.length ? simple : results).slice(0, Math.min(30, results.length)));
      }
      var top = state.difficulty === "hard" ? Math.min(5, results.length) : Math.min(18, results.length);
      return randomItem(results.slice(0, top));
    }
    function dispatchPath(path) {
      var tiles = all(".tile", board);
      path.forEach(function (index, order) {
        window.setTimeout(function () {
          var rect = tiles[index].getBoundingClientRect();
          var type = order === 0 ? "pointerdown" : "pointermove";
          var event;
          try { event = new PointerEvent(type, { bubbles: true, cancelable: true, pointerType: "mouse", clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 }); }
          catch (error) { event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 }); }
          board.dispatchEvent(event);
          if (order === path.length - 1) {
            var up;
            try { up = new PointerEvent("pointerup", { bubbles: true, cancelable: true, pointerType: "mouse" }); }
            catch (error2) { up = new MouseEvent("pointerup", { bubbles: true, cancelable: true }); }
            window.dispatchEvent(up);
          }
        }, order * 115);
      });
    }
    function schedule() {
      updateCommonLabels();
      var aiTurn = isComputerMode() && p2.classList.contains("active") && all(".tile", board).length > 0;
      if (!aiTurn) { turnSignature = ""; return; }
      if (pending) return;
      var signature = (one("#turnPill") ? one("#turnPill").textContent : "") + ":" + (one("#timer") ? one("#timer").textContent : "");
      if (/Computer|Player 2/.test(signature) && turnSignature === signature.split(":")[0]) return;
      turnSignature = signature.split(":")[0];
      pending = true;
      window.setTimeout(function () {
        pending = false;
        if (!isComputerMode() || !p2.classList.contains("active")) return;
        var choice = findPaths();
        if (choice) dispatchPath(choice.path);
      }, delayFor(820));
    }
    board.addEventListener("pointerdown", function (event) { if (isComputerMode() && p2.classList.contains("active") && event.isTrusted) trustedBlock(event); }, true);
    new MutationObserver(schedule).observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true });
    document.addEventListener("gidi-ai-change", function () { turnSignature = ""; schedule(); });
    schedule();
  }

  function start() {
    document.documentElement.setAttribute("data-gidi-ai-game", gameId);
    document.documentElement.setAttribute("data-gidi-ai-mode", state.mode);
    document.documentElement.setAttribute("data-gidi-ai-difficulty", state.difficulty);
    if (gameId === "connect-4") initConnect4();
    else if (gameId === "memory-match") initMemoryMatch();
    else if (gameId === "reaction-duel") initReactionDuel();
    else if (gameId === "air-hockey") initAirHockey();
    else if (gameId === "word-duel") initWordDuel();
    else if (gameId === "last-letter") initLastLetter();
    else if (gameId === "word-mine") initWordMine();
    else if (gameId === "word-builder-duel") initWordBuilder();
    else if (gameId === "word-territory") initWordTerritory();
    refreshControlStates();
    updateCommonLabels();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
}());
