// Netball-specific tracker: centered coordinate system (fixed 30.5x15.25m
// court, origin at center), zoom, and cumulative stats. Everything else —
// storage, player maps, event names, the shot table pipeline, dot/arrow
// rendering, timer, keyboard shortcuts, downloads, session save/load —
// comes from shared/static/tracker-core.js. New sport, built directly
// against the shared engine per .cursor/plans/Netball 12 players and
// events-2f79ccb8.plan.md (12-player roster, event names, cumulative
// stats logic) — no legacy per-sport index.js existed to migrate from.

const COURT_W = 30.5;
const COURT_H = 15.25;
let zoomLevel = 1;

const pitch = document.getElementById("pitch");

function zoomIn() {
  zoomLevel += 0.1;
  pitch.style.transformOrigin = "center center";
  pitch.style.transform = `scale(${zoomLevel})`;
}

function zoomOut() {
  if (zoomLevel > 0.5) {
    zoomLevel -= 0.1;
    pitch.style.transformOrigin = "center center";
    pitch.style.transform = `scale(${zoomLevel})`;
  }
}

function buildRowData(shot) {
  const x = shot.x !== null && shot.x !== undefined ? shot.x : "N/A";
  const y = shot.y !== null && shot.y !== undefined ? shot.y : "N/A";
  return [
    shot.time, shot.player, shot.action, x, y, shot.x2, shot.y2,
    "<button class='btn btn-outline-danger remove-button' onclick='removeShot(this)'>X</button>",
  ];
}

function dotPosition(shot) {
  const wasDragged =
    shot.x2 !== null && shot.x2 !== undefined && shot.x2 !== "N/A" &&
    shot.y2 !== null && shot.y2 !== undefined && shot.y2 !== "N/A";
  const pos = {};
  if (shot.x !== null && shot.x !== undefined) {
    pos.x = (shot.x + COURT_W / 2) / COURT_W;
    pos.y = (COURT_H / 2 - shot.y) / COURT_H;
  }
  if (wasDragged) {
    pos.x2 = (shot.x2 + COURT_W / 2) / COURT_W;
    pos.y2 = (COURT_H / 2 - shot.y2) / COURT_H;
  }
  return pos;
}

// Goals = "Shot (Scored)" count. Attempts = all three shot outcomes.
// Turnovers = "Turnover" count. No Intercepts column — the event set has no
// intercept event.
function cumulativeStats(filteredData) {
  var totalGoals = 0, totalAttempts = 0, totalTurnovers = 0;

  filteredData.each(function (value) {
    const ev = value[2];
    if (ev === "Shot (Scored)" || ev === "Shot (Attempted)" || ev === "Shot (Missed)") {
      totalAttempts++;
      if (ev === "Shot (Scored)") totalGoals++;
    } else if (ev === "Turnover") {
      totalTurnovers++;
    }
  });

  $("#cumulative-goals").text(totalGoals);
  $("#cumulative-attempts").text(totalAttempts);
  $("#cumulative-turnovers").text(totalTurnovers);
}

const tracker = initTracker({
  storage: { prefix: "netball" },
  rosterSize: 12,
  homeShortcutMap: {
    1: "(1)", 2: "(2)", 3: "(3)", 4: "(4)", 5: "(5)", 6: "(6)",
    7: "(7)", 8: "(8)", 9: "(9)", 10: "(0)", 11: "(-)", 12: "(=)",
  },
  awayShortcutMap: {
    1: "(E)", 2: "(R)", 3: "(T)", 4: "(Y)", 5: "(U)", 6: "(I)",
    7: "(O)", 8: "(P)", 9: "(A)", 10: "(S)", 11: "(D)", 12: "(F)",
  },
  defaultEventNames: [
    "Shot (Scored)",
    "Shot (Attempted)",
    "Shot (Missed)",
    "Center Pass",
    "Turnover",
    "Highlight",
    "Super Shot",
    "WA 1st Phase",
    "GA 1st Phase",
    "CPD",
  ],
  endpoints: { csv: "/netball/download_csv", pdf: "/netball/download_pdf" },
  csvFilename: "shots_data.csv",
  pdfFilename: "report.pdf",
  requireActionAndPlayerOnEnter: true,
  buildRowData,
  dotPosition,
  cumulativeStats,
  surfaceEl: function () { return document.getElementById("pitch"); },
});

// ── Court interaction (centered coordinate system) ──────────────────────────

let isDragging = false;
let startX = null;
let startY = null;
let endX = null;
let endY = null;

function captureCoords(event, rect) {
  const normX = ((event.clientX - rect.left) / pitch.offsetWidth) * COURT_W;
  const normY = ((event.clientY - rect.top) / pitch.offsetHeight) * COURT_H;
  const centredX = (normX - COURT_W / 2) / zoomLevel;
  const centredY = (COURT_H / 2 - normY) / zoomLevel;
  return { x: +centredX.toFixed(2), y: +centredY.toFixed(2) };
}

pitch.addEventListener("mousedown", function (event) {
  if (startX === null || startY === null) {
    isDragging = true;
    const coords = captureCoords(event, pitch.getBoundingClientRect());
    startX = coords.x; startY = coords.y;
  }
});

pitch.addEventListener("mousemove", function (event) {
  if (isDragging) {
    const coords = captureCoords(event, pitch.getBoundingClientRect());
    endX = coords.x; endY = coords.y;
  }
});

pitch.addEventListener("pointerdown", function (event) {
  event.preventDefault();
  if (startX === null || startY === null) {
    isDragging = true;
    pitch.setPointerCapture(event.pointerId);
    const coords = captureCoords(event, pitch.getBoundingClientRect());
    startX = coords.x; startY = coords.y;
  }
});

pitch.addEventListener("pointermove", function (event) {
  event.preventDefault();
  if (isDragging) {
    const coords = captureCoords(event, pitch.getBoundingClientRect());
    endX = coords.x; endY = coords.y;
  }
});

pitch.addEventListener("pointerup", function (event) {
  event.preventDefault();
  if (isDragging) {
    isDragging = false;
    const currentTime = tracker.getCurrentTime();
    tracker.addShot(tracker.currentActionType, startX, startY, endX, endY, currentTime, tracker.currentPlayer);
    startX = null; startY = null; endX = null; endY = null;
  }
});

// ── Zoom keyboard shortcuts ───────────────────────────────────────────────
// Player/event/Enter/Backspace shortcuts come from tracker-core.js.

document.addEventListener("keydown", function (event) {
  if (document.querySelector(".modal.show")) return;
  if (event.key === "+" || event.key === "=") {
    event.preventDefault();
    zoomIn();
  }
  if (event.key === "-" || event.key === "_") {
    event.preventDefault();
    zoomOut();
  }
});
