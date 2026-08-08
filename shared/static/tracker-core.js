// Shared click-to-record engine, extracted from the ~850-1150 line
// per-sport index.js files (futsal was the reference — the shortest and
// least encumbered of the six). Persistence primitives (createTrackerStore,
// downloadExport, session save/load) come from tracker-storage.js, loaded
// before this file.
//
// A sport's own (much shorter) index.js calls initTracker(config) once,
// supplying: roster/shortcut layout, default event names, storage keys,
// download endpoints, and a handful of hooks for the genuinely per-sport
// pieces this engine can't own — coordinate capture off the pitch/court
// (each sport's coordinate system and click/drag surface differ too much
// to share), how a shot becomes a table row, and how it becomes a stored
// shot object. Sport-owned extras (grip/outcome, xG, court-type switching,
// goal-mouth zones, a dynamically-drawn pitch) stay in the sport's own file
// entirely and call back into the object initTracker() returns.
//
// config shape:
// {
//   storage: { prefix, extraKeys?, defaultsVersion? },
//   rosterSize: 16,
//   jerseyPrefixes: { home: "A", away: "B" },            // default A/B
//   homeShortcutMap: { 1: "(1)", ... },                   // display suffix per player index
//   awayShortcutMap: { 1: "(U)", ... },
//   defaultEventNames: [...],
//   endpoints: { csv: "/futsal/download_csv", pdf: "/futsal/download_pdf" },
//   csvFilename: "shots_data.csv",
//   pdfFilename: "report.pdf",
//   buildPdfPayload: (shotsData) => payload,               // default: shotsData itself
//   requireActionAndPlayerOnEnter: true,
//   enterGuard: () => boolean,                              // optional extra Enter condition, ANDed with the
//                                                             //   above (badminton/tennis: grip+outcome selected)
//   buildRowData: (shot) => [...],                         // table.row.add() array, sport owns column order
//   buildShot: (base) => shot,                              // base = {time,player,playerName,action,x,y,x2,y2}; default identity
//   cumulativeStats: (visibleRowsData) => void | null,       // null if the sport has no cumulative-stats table
//   onReady: (api) => void,                                  // sport's own post-init: draw pitch, restore shots, wire click handlers
// }
(function (global) {
  "use strict";

  function initTracker(config) {
    const store = createTrackerStore(config.storage);
    const prefix = config.storage.prefix;
    const rosterSize = config.rosterSize;
    const jerseyPrefixes = config.jerseyPrefixes || { home: "A", away: "B" };
    const buildRowData = config.buildRowData;
    const buildShot = config.buildShot || function (base) { return base; };
    const buildPdfPayload = config.buildPdfPayload || function (shotsData) { return shotsData; };

    // ── Player maps ────────────────────────────────────────────────────────

    let homePlayerMap = {};
    let awayPlayerMap = {};

    function initializePlayerMaps() {
      const storedHome = store.get(prefix + "HomePlayerMap");
      const storedAway = store.get(prefix + "AwayPlayerMap");

      if (storedHome) {
        homePlayerMap = JSON.parse(storedHome);
        for (let i = 1; i <= rosterSize; i++) {
          const btn = document.getElementById(`homePlayerButton${i}`);
          if (btn) btn.innerHTML = `${homePlayerMap[i].jersey} ${config.homeShortcutMap[i]}`;
        }
      } else {
        for (let i = 1; i <= rosterSize; i++) {
          homePlayerMap[i] = { jersey: `${jerseyPrefixes.home}${i.toString().padStart(2, "0")}`, name: `HomePlayer${i}` };
        }
        store.set(prefix + "HomePlayerMap", JSON.stringify(homePlayerMap));
      }

      if (storedAway) {
        awayPlayerMap = JSON.parse(storedAway);
        for (let i = 1; i <= rosterSize; i++) {
          const btn = document.getElementById(`awayPlayerButton${i}`);
          if (btn) btn.innerHTML = `${awayPlayerMap[i].jersey} ${config.awayShortcutMap[i]}`;
        }
      } else {
        for (let i = 1; i <= rosterSize; i++) {
          awayPlayerMap[i] = { jersey: `${jerseyPrefixes.away}${i.toString().padStart(2, "0")}`, name: `AwayPlayer${i}` };
        }
        store.set(prefix + "AwayPlayerMap", JSON.stringify(awayPlayerMap));
      }
    }
    initializePlayerMaps();

    function updatePlayerNames(team) {
      const playerMap = team === "home" ? homePlayerMap : awayPlayerMap;
      const shortcutMap = team === "home" ? config.homeShortcutMap : config.awayShortcutMap;
      const teamPrefix = team === "home" ? "home" : "away";
      const jp = team === "home" ? jerseyPrefixes.home : jerseyPrefixes.away;

      for (let i = 1; i <= rosterSize; i++) {
        const jerseyInput = document.getElementById(`${teamPrefix}Jersey${i}`);
        const playerInput = document.getElementById(`${teamPrefix}Player${i}`);
        if (jerseyInput && playerInput) {
          playerMap[i] = {
            jersey: jerseyInput.value || `${jp}${i.toString().padStart(2, "0")}`,
            name: playerInput.value || `Player${i}`,
          };
        }
      }

      for (let i = 1; i <= rosterSize; i++) {
        const btn = document.getElementById(`${teamPrefix}PlayerButton${i}`);
        if (btn) btn.innerHTML = `${playerMap[i].jersey} ${shortcutMap[i]}`;
      }

      if (team === "home") {
        store.set(prefix + "HomePlayerMap", JSON.stringify(homePlayerMap));
        $(`#editHomePlayerNamesModal`).modal("hide");
      } else {
        store.set(prefix + "AwayPlayerMap", JSON.stringify(awayPlayerMap));
        $(`#editAwayPlayerNamesModal`).modal("hide");
      }
    }

    // ── Event names ────────────────────────────────────────────────────────

    const eventShortcutKeys = ["Z", "X", "C", "V", "B", "<", "N", "M", ",", ".", "?", ">"];
    const eventKeyMap = eventShortcutKeys.reduce((map, key, index) => {
      map[key.toUpperCase()] = index;
      return map;
    }, {});

    let eventNames = [];

    function renderEventButtons() {
      const grid = document.getElementById("eventButtonsGrid");
      grid.innerHTML = "";
      eventNames.forEach(function (name, index) {
        const key = eventShortcutKeys[index] || "";
        const label = key ? `${name} (${key})` : name;
        const btn = document.createElement("button");
        btn.className = "btn btn-outline-primary event-button";
        btn.textContent = label;
        btn.onclick = function () { setActionType.call(btn, index); };
        grid.appendChild(btn);
      });
    }

    function saveEventNames() {
      const textarea = document.getElementById("eventNamesTextarea");
      const lines = textarea.value.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
      eventNames = lines;
      store.set(prefix + "EventNames", JSON.stringify(eventNames));
      renderEventButtons();
      $("#editEventNamesModal").modal("hide");
    }

    // ── State ──────────────────────────────────────────────────────────────

    var currentActionType = "";
    var currentPlayer = "";
    var currentPlayerName = "";

    const storedShotsData = store.get(prefix + "ShotsData");
    var shotsData = storedShotsData ? JSON.parse(storedShotsData) : [];

    var table;
    const keyboardShortcutToastKey = prefix + "KeyboardShortcutToastDismissed";

    function setActionType(index) {
      const eventName = eventNames[index];
      if (!eventName) { currentActionType = ""; return; }

      if (currentActionType === eventName) {
        document.querySelectorAll(".event-button").forEach((b) => b.classList.remove("active"));
        currentActionType = "";
        return;
      }
      currentActionType = eventName;
      document.querySelectorAll(".event-button").forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
    }

    function setPlayer(team, playerIndex) {
      const playerMap = team === "home" ? homePlayerMap : awayPlayerMap;
      const teamPrefix = team === "home" ? "home" : "away";

      if (currentPlayer === playerMap[playerIndex].jersey) {
        currentPlayer = "";
        currentPlayerName = "";
        document.querySelectorAll(".player-button").forEach((b) => b.classList.remove("active"));
        return;
      }

      currentPlayer = playerMap[playerIndex].jersey;
      currentPlayerName = playerMap[playerIndex].name;

      for (let i = 1; i <= rosterSize; i++) {
        const hb = document.getElementById(`homePlayerButton${i}`);
        const ab = document.getElementById(`awayPlayerButton${i}`);
        if (hb) hb.classList.remove("active");
        if (ab) ab.classList.remove("active");
      }
      const activeBtn = document.getElementById(`${teamPrefix}PlayerButton${playerIndex}`);
      if (activeBtn) activeBtn.classList.add("active");
    }

    // ── Time helpers ───────────────────────────────────────────────────────

    function getCurrentDateTime() {
      let now = new Date();
      return (
        ("0" + now.getDate()).slice(-2) + "/" +
        ("0" + (now.getMonth() + 1)).slice(-2) + "/" +
        now.getFullYear().toString().slice(-2) + " " +
        ("0" + now.getHours()).slice(-2) + ":" +
        ("0" + now.getMinutes()).slice(-2) + ":" +
        ("0" + now.getSeconds()).slice(-2)
      );
    }

    function getCurrentTime() {
      if (elapsedTime > 0) {
        const totalSeconds = Math.floor(elapsedTime / 1000);
        const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
        const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
        const s = String(totalSeconds % 60).padStart(2, "0");
        return `${h}:${m}:${s}`;
      }
      return getCurrentDateTime();
    }

    // ── Shot pipeline ──────────────────────────────────────────────────────

    // Renders one shot (already in shotsData's shape) into the table/pitch.
    // Used both for a freshly-recorded shot and for replaying stored shots
    // on load, so it never touches the shotsData array or storage itself.
    function renderShotRow(shot) {
      var rowIndex = table.row.add(buildRowData(shot)).draw().index();
      var rowData = table.row(rowIndex).data();

      const dotPos = config.dotPosition ? config.dotPosition(shot) : null;
      if (dotPos) {
        if (dotPos.x !== undefined) rowData.dotx = dotPos.x;
        if (dotPos.y !== undefined) rowData.doty = dotPos.y;
        if (dotPos.x2 !== undefined) rowData.dotx2 = dotPos.x2;
        if (dotPos.y2 !== undefined) rowData.doty2 = dotPos.y2;
      }

      $(table.row(rowIndex).node())
        .on("mouseenter", function () { showDot(this); })
        .on("mouseleave", function () { removeDot(); });
      $(table.row(rowIndex).node()).mouseenter();
    }

    // startX/startY/endX/endY: raw sport-space coordinates (already in the
    // sport's own units — meters, cm, whatever the pitch surface uses), or
    // null for a coordinate-less Enter-key add. extra: any additional
    // per-shot fields the sport wants stored (grip/outcome, xG/xSave,
    // courtType) — merged into the shot object via config.buildShot.
    function addShot(actionType, startX, startY, endX, endY, time, player, extra) {
      let wasDragged =
        startX !== null && startY !== null && endX !== null && endY !== null &&
        (startX !== endX || startY !== endY);

      let resolvedPlayerName = currentPlayerName;
      if (!resolvedPlayerName) {
        for (let i = 1; i <= rosterSize; i++) {
          if (homePlayerMap[i] && homePlayerMap[i].jersey === player) {
            resolvedPlayerName = homePlayerMap[i].name;
            break;
          }
          if (awayPlayerMap[i] && awayPlayerMap[i].jersey === player) {
            resolvedPlayerName = awayPlayerMap[i].name;
            break;
          }
        }
      }

      var base = {
        time,
        player: player || "",
        playerName: resolvedPlayerName || player || "",
        action: actionType,
        x: startX,
        y: startY,
        x2: wasDragged ? endX : "N/A",
        y2: wasDragged ? endY : "N/A",
      };
      if (extra) Object.assign(base, extra);
      var shot = buildShot(base);

      shotsData.push(shot);
      store.set(prefix + "ShotsData", JSON.stringify(shotsData));
      renderShotRow(shot);
      return shot;
    }

    function removeShot(deleteButton) {
      var row = $(deleteButton).closest("tr");
      var rowIndex = arrayPositionForRow(table, table.row(row));

      if (shotsData && rowIndex !== undefined && rowIndex >= 0) {
        shotsData.splice(rowIndex, 1);
        store.set(prefix + "ShotsData", JSON.stringify(shotsData));
      }

      removeDot();
      table.row(row).remove().draw();
    }

    // ── Dot / arrow visualization ──────────────────────────────────────────
    // Pixel-space helpers — the sport supplies pixel coordinates (already
    // converted from its own coordinate system via dotPosition/showDot).

    function createDot(x, y, id, container) {
      var dot = document.createElement("div");
      dot.id = id;
      dot.className = "dot";
      dot.style.left = `${x}px`;
      dot.style.top = `${y}px`;
      (container || config.surfaceEl()).appendChild(dot);
    }

    function removeDot() {
      ["hover-dot-1", "hover-dot-2", "hover-arrow"].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.parentNode.removeChild(el);
      });
    }

    function createArrow(x1, y1, x2, y2, id, container) {
      var minX = Math.min(x1, x2);
      var minY = Math.min(y1, y2);
      var width = Math.abs(x2 - x1);
      var height = Math.abs(y2 - y1);

      var svgns = "http://www.w3.org/2000/svg";
      var svg = document.createElementNS(svgns, "svg");
      svg.setAttribute("height", height + 20);
      svg.setAttribute("width", width + 20);
      svg.style.position = "absolute";
      svg.style.left = `${minX - 10}px`;
      svg.style.top = `${minY - 10}px`;
      svg.setAttribute("id", id);
      svg.setAttribute("class", "arrow");

      var defs = document.createElementNS(svgns, "defs");
      var marker = document.createElementNS(svgns, "marker");
      marker.setAttribute("id", "markerArrow");
      marker.setAttribute("markerWidth", "13");
      marker.setAttribute("markerHeight", "13");
      marker.setAttribute("refX", "2");
      marker.setAttribute("refY", "6");
      marker.setAttribute("orient", "auto");
      var path = document.createElementNS(svgns, "path");
      path.setAttribute("d", "M2,2 L2,11 L10,6 L2,2");
      path.style.fill = "white";
      marker.appendChild(path);
      defs.appendChild(marker);
      svg.appendChild(defs);

      var angle = Math.atan2(y2 - y1, x2 - x1);
      var adjustX = 22 * Math.cos(angle);
      var adjustY = 22 * Math.sin(angle);
      x2 = x2 - adjustX;
      y2 = y2 - adjustY;

      var line = document.createElementNS(svgns, "line");
      line.setAttribute("x1", x1 - minX + 10);
      line.setAttribute("y1", y1 - minY + 10);
      line.setAttribute("x2", x2 - minX + 10);
      line.setAttribute("y2", y2 - minY + 10);
      line.setAttribute("stroke", "white");
      line.setAttribute("stroke-width", "2");
      line.setAttribute("marker-end", "url(#markerArrow)");
      svg.appendChild(line);
      (container || config.surfaceEl()).appendChild(svg);
    }

    function showDot(rowNode) {
      removeDot();
      var rowData = table.row(rowNode).data();
      var xPercent = parseFloat(rowData.dotx);
      var yPercent = parseFloat(rowData.doty);
      if (isNaN(xPercent) || isNaN(yPercent)) return;

      const surface = config.surfaceEl();
      createDot(xPercent * surface.offsetWidth, yPercent * surface.offsetHeight, "hover-dot-1");

      if (rowData.dotx2 !== undefined && rowData.doty2 !== undefined) {
        var x2 = parseFloat(rowData.dotx2) * surface.offsetWidth;
        var y2 = parseFloat(rowData.doty2) * surface.offsetHeight;
        createDot(x2, y2, "hover-dot-2");
        createArrow(xPercent * surface.offsetWidth, yPercent * surface.offsetHeight, x2, y2, "hover-arrow");
      }
    }

    // ── Download ───────────────────────────────────────────────────────────

    function downloadCSV() {
      downloadExport(config.endpoints.csv, shotsData, config.csvFilename, "CSV");
    }

    function downloadPDF() {
      downloadExport(config.endpoints.pdf, buildPdfPayload(shotsData), config.pdfFilename, "PDF");
    }

    function saveSession() {
      saveTrackerSession(store, getCurrentDateTime);
    }

    function loadSessionFile(fileInput) {
      loadTrackerSessionFile(store, fileInput);
    }

    function clearAllEvents() {
      if (table.rows().count() === 0) return;
      if (!confirm("Delete all tracked events? This cannot be undone.")) return;
      clearTrackedEvents(store, table, shotsData);
    }

    // ── Timer ──────────────────────────────────────────────────────────────

    var elapsedTime = 0;
    var timerInterval = null;
    var startTime = null;

    function startTimer() {
      if (!timerInterval) {
        startTime = Date.now() - elapsedTime;
        timerInterval = setInterval(function () {
          elapsedTime = Date.now() - startTime;
          updateTimerDisplay();
        }, 1000);
      }
    }

    function pauseTimer() {
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
    }

    function stopTimer() {
      clearInterval(timerInterval);
      timerInterval = null;
      elapsedTime = 0;
      updateTimerDisplay();
    }

    function updateTimerDisplay() {
      const totalSeconds = Math.floor(elapsedTime / 1000);
      const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
      const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
      const s = String(totalSeconds % 60).padStart(2, "0");
      document.getElementById("timerDisplay").textContent = `${h}:${m}:${s}`;
    }

    // ── Keyboard shortcut toast ────────────────────────────────────────────

    function initKeyboardShortcutToast() {
      if (!localStorage.getItem(keyboardShortcutToastKey)) {
        var toastEl = document.getElementById("keyboardShortcutToast");
        var toast = new bootstrap.Toast(toastEl, { delay: 8000 });
        toast.show();
        toastEl.addEventListener("hidden.bs.toast", function () {
          localStorage.setItem(keyboardShortcutToastKey, "true");
        });
      }
    }

    // ── Keyboard shortcuts ─────────────────────────────────────────────────
    // Player key -> index maps are derived from home/awayShortcutMap's
    // "(K)" display strings rather than duplicated as a separate config
    // field — one source of truth for which key selects which player.
    function deriveKeyMap(shortcutMap) {
      const map = {};
      Object.keys(shortcutMap).forEach(function (indexStr) {
        const m = /\(([^)]+)\)/.exec(shortcutMap[indexStr]);
        if (m) map[m[1].toUpperCase()] = parseInt(indexStr, 10);
      });
      return map;
    }
    const homePlayerKeyMap = deriveKeyMap(config.homeShortcutMap);
    const awayPlayerKeyMap = deriveKeyMap(config.awayShortcutMap);

    document.addEventListener("keydown", function (event) {
      const activeModal = document.querySelector(".modal.show");
      if (activeModal) return;

      const key = event.key.toUpperCase();

      if (key in homePlayerKeyMap) {
        setPlayer("home", homePlayerKeyMap[key]);
        return;
      }
      if (key in awayPlayerKeyMap) {
        setPlayer("away", awayPlayerKeyMap[key]);
        return;
      }

      if (key in eventKeyMap) {
        const idx = eventKeyMap[key];
        const btns = document.querySelectorAll(".event-button");
        if (btns[idx]) setActionType.call(btns[idx], idx);
        return;
      }

      if (event.key === "Enter") {
        if (config.requireActionAndPlayerOnEnter && (currentActionType === "" || currentPlayer === "")) {
          return;
        }
        // Extra per-sport condition (badminton/tennis: grip+outcome must
        // also be selected) — ANDed with the guard above, not a replacement.
        if (config.enterGuard && !config.enterGuard()) {
          return;
        }
        var currentTime = getCurrentTime();
        addShot(currentActionType, null, null, null, null, currentTime, currentPlayer);
        return;
      }

      // Remove the most recent entry. Works off the last *visible* row so it
      // stays correct while the table is filtered, and maps that row back to
      // an array position rather than assuming display order matches
      // insertion order.
      if (event.key === "Backspace") {
        event.preventDefault();

        const visibleRows = table.rows({ search: "applied" });
        const visibleCount = visibleRows.count();
        if (visibleCount === 0) return;

        const lastRow = table.row(visibleRows.nodes()[visibleCount - 1]);
        const rowIndex = arrayPositionForRow(table, lastRow);
        if (rowIndex < 0) return;

        if (shotsData && shotsData.length > 0) {
          shotsData.splice(rowIndex, 1);
          store.set(prefix + "ShotsData", JSON.stringify(shotsData));
        }

        removeDot();
        lastRow.remove().draw();
        updateCumulativeValuesIfConfigured();
        return;
      }
    });

    function updateCumulativeValuesIfConfigured() {
      if (config.cumulativeStats) {
        config.cumulativeStats(table.rows({ search: "applied" }).data());
      }
    }

    // ── DataTable init + ready ─────────────────────────────────────────────

    $(document).ready(function () {
      table = $("#event-table").DataTable({
        paging: false,
        info: false,
        responsive: true,
        language: { searchPlaceholder: "Filter by Player and Event" },
      });
      $("#event-table_wrapper .dt-search").append(
        '<button type="button" id="clear-all-events" class="btn btn-outline-danger ms-2">Clear All</button>'
      );
      $("#clear-all-events").on("click", clearAllEvents);

      table.on("draw", function () {
        updateCumulativeValuesIfConfigured();
        updateTrackerButtonStates(table);
      });
      updateCumulativeValuesIfConfigured();
      updateTrackerButtonStates(table);
      initKeyboardShortcutToast();

      const storedEvents = store.get(prefix + "EventNames");
      eventNames = storedEvents ? JSON.parse(storedEvents) : config.defaultEventNames.slice();
      if (!storedEvents) store.set(prefix + "EventNames", JSON.stringify(eventNames));
      renderEventButtons();

      const api = {
        store, table: function () { return table; }, shotsData,
        addShot, removeShot, renderShotRow, setPlayer, setActionType,
        createDot, removeDot, createArrow, showDot,
        getCurrentTime, getCurrentDateTime,
      };

      // Sport-owned setup (draw pitch/court, restore dimension selects, wire
      // click/drag listeners, goal zones, etc), then replay stored shots —
      // after the sport's own pitch is drawn so dot positions land correctly.
      if (config.onReady) config.onReady(api);
      if (shotsData.length > 0) {
        for (var i = 0; i < shotsData.length; i++) {
          renderShotRow(shotsData[i]);
        }
      }
    });

    // Functions referenced by inline onclick="" in the shared base template.
    global.setPlayer = setPlayer;
    global.saveEventNames = saveEventNames;
    global.updatePlayerNames = updatePlayerNames;
    global.removeShot = removeShot;
    global.downloadCSV = downloadCSV;
    global.downloadPDF = downloadPDF;
    global.saveSession = saveSession;
    global.loadSessionFile = loadSessionFile;
    global.startTimer = startTimer;
    global.pauseTimer = pauseTimer;
    global.stopTimer = stopTimer;

    return {
      store, addShot, removeShot, renderShotRow, setPlayer, setActionType,
      createDot, removeDot, createArrow, showDot,
      getCurrentTime, getCurrentDateTime,
      get shotsData() { return shotsData; },
      get table() { return table; },
      get currentActionType() { return currentActionType; },
      get currentPlayer() { return currentPlayer; },
    };
  }

  global.initTracker = initTracker;
})(window);
