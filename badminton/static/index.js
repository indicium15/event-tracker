// Badminton-specific tracker: centered coordinate system (court + run-off,
// origin at court center), zoom, and grip/outcome shot classification.
// Everything else — storage, player maps, event names, the shot table
// pipeline, dot/arrow rendering, timer, keyboard shortcuts, downloads,
// session save/load — comes from shared/static/tracker-core.js.

const COURT_W = 13.40; // length (baseline to baseline), meters (doubles)
const COURT_H = 6.10;  // width (sideline to sideline), meters (doubles)
let zoomLevel = 1;

// Run-off space (m) around the court, both sides.
const RUNOFF_Y = 1.50;
const RUNOFF_X = 2.00;

const PITCH_W = COURT_W + 2 * RUNOFF_X;
const PITCH_H = COURT_H + 2 * RUNOFF_Y;

// Push geometry to CSS so layout stays exact.
const rootStyle = document.documentElement.style;
rootStyle.setProperty("--aspect-w", PITCH_W);
rootStyle.setProperty("--aspect-h", PITCH_H);
rootStyle.setProperty("--court-w-pct", `${(COURT_W / PITCH_W) * 100}%`);
rootStyle.setProperty("--court-h-pct", `${(COURT_H / PITCH_H) * 100}%`);
rootStyle.setProperty("--runoff-x-pct", `${(RUNOFF_X / PITCH_W) * 100}%`);
rootStyle.setProperty("--runoff-y-pct", `${(RUNOFF_Y / PITCH_H) * 100}%`);

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

var currentGrip = "";
var currentOutcome = "";

function setGrip(gripType) {
  const gripId = gripType.toLowerCase();
  const selectedBtn = document.getElementById(gripId);

  ["forehand", "backhand"].forEach((id) => {
    const btn = document.getElementById(id);
    if (btn) btn.classList.remove("active");
  });

  if (currentGrip === gripType) {
    currentGrip = "";
  } else {
    currentGrip = gripType;
    if (selectedBtn) selectedBtn.classList.add("active");
  }
}

function setOutcome(outcomeType) {
  const outcomeIdMap = {
    Winner: "winner",
    "Unforced Error": "unforcederror",
    "Forced Error": "forcederror",
    Rally: "rally",
  };
  const outcomeId = outcomeIdMap[outcomeType];
  const selectedBtn = document.getElementById(outcomeId);

  Object.values(outcomeIdMap).forEach((id) => {
    const btn = document.getElementById(id);
    if (btn) btn.classList.remove("active");
  });

  if (currentOutcome === outcomeType) {
    currentOutcome = "";
  } else {
    currentOutcome = outcomeType;
    if (selectedBtn) selectedBtn.classList.add("active");
  }
}

function buildRowData(shot) {
  const x = shot.x !== null && shot.x !== undefined ? shot.x : "N/A";
  const y = shot.y !== null && shot.y !== undefined ? shot.y : "N/A";
  return [
    shot.time, shot.player, shot.grip || "N/A", shot.action, shot.outcome || "N/A",
    x, y, shot.x2, shot.y2,
    "<button class='btn btn-outline-danger remove-button' onclick='removeShot(this)'>X</button>",
  ];
}

function dotPosition(shot) {
  const wasDragged =
    shot.x2 !== null && shot.x2 !== undefined && shot.x2 !== "N/A" &&
    shot.y2 !== null && shot.y2 !== undefined && shot.y2 !== "N/A";
  const pos = {};
  if (shot.x !== null && shot.x !== undefined) {
    pos.x = (shot.x + PITCH_W / 2) / PITCH_W;
    pos.y = (PITCH_H / 2 - shot.y) / PITCH_H;
  }
  if (wasDragged) {
    pos.x2 = (shot.x2 + PITCH_W / 2) / PITCH_W;
    pos.y2 = (PITCH_H / 2 - shot.y2) / PITCH_H;
  }
  return pos;
}

const tracker = initTracker({
  storage: { prefix: "badminton" },
  rosterSize: 2,
  homeShortcutMap: { 1: "(1)", 2: "(2)" },
  awayShortcutMap: { 1: "(3)", 2: "(4)" },
  defaultEventNames: [
    "Serve-High", "Serve-Low",
    "Smash", "Drop Shot", "Clear-High", "Drive",
    "Net Shot", "Lift", "Kill", "Block",
  ],
  endpoints: { csv: "/badminton/download_csv", pdf: "/badminton/download_pdf" },
  csvFilename: "shots_data.csv",
  pdfFilename: "report.pdf",
  requireActionAndPlayerOnEnter: true,
  // Every other sport only needs action+player for Enter; badminton also
  // requires a grip and an outcome to be selected.
  enterGuard: function () { return currentGrip !== "" && currentOutcome !== ""; },
  buildRowData,
  dotPosition,
  buildShot: function (base) {
    return Object.assign({}, base, { grip: currentGrip || "N/A", outcome: currentOutcome || "N/A" });
  },
  surfaceEl: function () { return document.getElementById("pitch"); },
});

// ── Pitch interaction (centered coordinate system) ──────────────────────────

let isDragging = false;
let startX = null;
let startY = null;
let endX = null;
let endY = null;

function captureCoords(event, rect) {
  const normX = ((event.clientX - rect.left) / pitch.offsetWidth) * PITCH_W;
  const normY = ((event.clientY - rect.top) / pitch.offsetHeight) * PITCH_H;
  const centredX = (normX - PITCH_W / 2) / zoomLevel;
  const centredY = (PITCH_H / 2 - normY) / zoomLevel;
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

// ── Grip / outcome / zoom keyboard shortcuts ─────────────────────────────────
// Player/event/Enter/Backspace shortcuts come from tracker-core.js; these
// four extra shortcut groups are badminton-only.

document.addEventListener("keydown", function (event) {
  if (document.querySelector(".modal.show")) return;

  const key = event.key.toUpperCase();

  const gripKeyMap = { G: "Forehand", H: "Backhand" };
  const outcomeKeyMap = { W: "Winner", U: "Unforced Error", F: "Forced Error", R: "Rally" };

  if (gripKeyMap.hasOwnProperty(key)) {
    setGrip(gripKeyMap[key]);
    return;
  }
  if (outcomeKeyMap.hasOwnProperty(key)) {
    setOutcome(outcomeKeyMap[key]);
    return;
  }
  if (event.key === "+" || event.key === "=") {
    event.preventDefault();
    zoomIn();
  }
  if (event.key === "-" || event.key === "_") {
    event.preventDefault();
    zoomOut();
  }
});
