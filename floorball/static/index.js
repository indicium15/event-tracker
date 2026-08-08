// Floorball-specific tracker: centered coordinate system (fixed 40x20m
// pitch, origin at center), zoom, and cumulative stats. Everything else —
// storage, player maps, event names, the shot table pipeline, dot/arrow
// rendering, timer, keyboard shortcuts, downloads, session save/load —
// comes from shared/static/tracker-core.js.
//
// Dead code note: the original file also defined calculateDistance/
// calculateAngle/distanceAnglexG (football's xG formula), but floorball
// never called them — confirmed via grep before this migration, per the
// plan's "Deleted, not migrated" list. Not carried over.

const PITCH_W = 40;
const PITCH_H = 20;
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

// TODO(revert-floorball-temp-changes): homeDefaultLabels/awayDefaultLabels below hold
// custom labels added temporarily for one student's request. The original design didn't
// use a lookup table at all — initializePlayerMaps() generated jersey/name defaults
// inline as `${prefix}${i}` / `${Team}Player${i}`, and updatePlayerNames()'s input
// fallback used the same inline expressions. To revert, delete the two const blocks
// below and the `defaultLabels` field in the initTracker(...) call — tracker-core.js's
// own jerseyPrefixes-based default generation takes over automatically once
// defaultLabels is absent from the config.
const homeDefaultLabels = {
  1: "Free hit",
  2: "Hit in",
  3: "Restart play",
  4: "Lost ball",
  5: "FHLB",
  6: "HILB",
  7: "RPLB",
  8: "Lost ball intercept",
  9: "Power play",
  10: "Short handed",
  11: "PPLB",
  12: "SHLB",
  13: "Reset",
  14: "Ref call",
  15: "Keeper throw",
  16: "Rebound",
};

const awayDefaultLabels = {
  1: "Delete this and above",
  2: "Corrected",
  3: "Delete all above",
  4: "Corrected, delete action above",
  5: "B05",
  6: "B06",
  7: "B07",
  8: "B08",
  9: "B09",
  10: "B10",
  11: "B11",
  12: "B12",
  13: "B13",
  14: "B14",
  15: "B15",
  16: "B16",
};

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
    pos.x = (shot.x + PITCH_W / 2) / PITCH_W;
    pos.y = (PITCH_H / 2 - shot.y) / PITCH_H;
  }
  if (wasDragged) {
    pos.x2 = (shot.x2 + PITCH_W / 2) / PITCH_W;
    pos.y2 = (PITCH_H / 2 - shot.y2) / PITCH_H;
  }
  return pos;
}

function cumulativeStats(filteredData) {
  var totalGoals = 0, totalSaves = 0, totalShots = 0;
  var totalFreeKicks = 0, totalPasses = 0, totalCorners = 0, totalTackles = 0;

  filteredData.each(function (value) {
    const ev = value[2];
    if (ev.includes("Shot")) {
      totalShots++;
      if (ev === "Shot - Goal") totalGoals++;
      else if (ev === "Shot - Save") totalSaves++;
    } else if (ev === "Free Hit" || ev === "Free Kick") {
      totalFreeKicks++;
    } else if (ev === "Pass") {
      totalPasses++;
    } else if (ev === "Screen" || ev === "Corner") {
      totalCorners++;
    } else if (ev === "Tackle") {
      totalTackles++;
    }
  });

  $("#cumulative-goals").text(totalGoals);
  $("#cumulative-saves").text(totalSaves);
  $("#cumulative-shots").text(totalShots);
  $("#cumulative-passes").text(totalPasses);
  $("#cumulative-corners").text(totalCorners);
  $("#cumulative-free-kicks").text(totalFreeKicks);
  $("#cumulative-tackles").text(totalTackles);
}

const tracker = initTracker({
  // Bump defaultsVersion when the default player/event labels below change; that
  // resets the stored labels once instead of wiping them on every page load.
  storage: { prefix: "floorball", defaultsVersion: "2026-07-26-labels" },
  rosterSize: 16,
  defaultLabels: { home: homeDefaultLabels, away: awayDefaultLabels },
  homeShortcutMap: {
    1: "(1)", 2: "(2)", 3: "(3)", 4: "(4)",
    5: "(5)", 6: "(6)", 7: "(7)", 8: "(8)",
    9: "(9)", 10: "(0)", 11: "(Q)", 12: "(W)",
    13: "(E)", 14: "(R)", 15: "(T)", 16: "(Y)",
  },
  awayShortcutMap: {
    1: "(U)", 2: "(I)", 3: "(O)", 4: "(P)",
    5: "([)", 6: "(])", 7: "(A)", 8: "(S)",
    9: "(D)", 10: "(F)", 11: "(G)", 12: "(H)",
    13: "(J)", 14: "(K)", 15: "(L)", 16: "(;)",
  },
  // TODO(revert-floorball-temp-changes): the list below is a temporary event set for one
  // student's request. The original default event names were:
  //
  //   [ "Shot", "Shot - Save", "Shot - Goal", "Shot Assist",
  //     "Dribble", "Lob", "Cross", "Pass",
  //     "Tackle", "Foul", "Free Hit", "Screen" ]
  //
  // To revert, swap that array back in below.
  defaultEventNames: [
    "Shot", "Shot - Save", "Shot - Goal", "Dribble",
    "Lob", "Pass", "Tackle", "Tackle D",
    "Attacker", "Defender",
  ],
  endpoints: { csv: "/floorball/download_csv", pdf: "/floorball/download_pdf" },
  csvFilename: "shots_data.csv",
  pdfFilename: "report.pdf",
  requireActionAndPlayerOnEnter: true,
  buildRowData,
  dotPosition,
  cumulativeStats,
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
