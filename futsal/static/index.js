// Futsal tracker: dynamic SVG pitch and goal-mouth click zones.

let zoomLevel = 1;
let pitchLength = 40;
let pitchWidth = 20;

function zoomIn() {
  zoomLevel += 0.1;
  const areaEl = document.querySelector(".pitch-area");
  areaEl.style.transformOrigin = "center center";
  areaEl.style.transform = `scale(${zoomLevel})`;
}

function zoomOut() {
  if (zoomLevel > 0.5) {
    zoomLevel -= 0.1;
    const areaEl = document.querySelector(".pitch-area");
    areaEl.style.transformOrigin = "center center";
    areaEl.style.transform = `scale(${zoomLevel})`;
  }
}

// Draw the futsal pitch as an SVG inside #pitch
function drawPitch(L, W) {
  const gH = 3;           // goal height (m)
  const gW = 2;           // goal depth (m)
  const gY = (W - gH) / 2; // top of goal (y coordinate)
  const penR = 6;         // penalty area radius (m)
  const penMarkX = 6;     // penalty mark distance from goal line
  const ccR = 3;          // center circle radius

  const penTopY = gY - penR;
  const penBotY = gY + gH + penR;

  const sw = 0.12; // stroke-width in meters

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 ${L} ${W}"
    overflow="visible"
    preserveAspectRatio="none">

    <!-- Pitch outline -->
    <rect x="${sw / 2}" y="${sw / 2}" width="${L - sw}" height="${W - sw}" fill="none" stroke="white" stroke-width="${sw}"/>

    <!-- Halfway line -->
    <line x1="${L / 2}" y1="0" x2="${L / 2}" y2="${W}" stroke="white" stroke-width="${sw}"/>

    <!-- Center circle -->
    <circle cx="${L / 2}" cy="${W / 2}" r="${ccR}" fill="none" stroke="white" stroke-width="${sw}"/>

    <!-- Center spot -->
    <circle cx="${L / 2}" cy="${W / 2}" r="0.15" fill="white"/>

    <!-- Left penalty area (D-shape: two quarter-circle arcs joined by straight line) -->
    <path d="M 0,${penTopY} A ${penR},${penR} 0 0,1 ${penMarkX},${gY} L ${penMarkX},${gY + gH} A ${penR},${penR} 0 0,1 0,${penBotY}"
      fill="none" stroke="white" stroke-width="${sw}"/>

    <!-- Right penalty area -->
    <path d="M ${L},${penTopY} A ${penR},${penR} 0 0,0 ${L - penMarkX},${gY} L ${L - penMarkX},${gY + gH} A ${penR},${penR} 0 0,0 ${L},${penBotY}"
      fill="none" stroke="white" stroke-width="${sw}"/>

    <!-- Left penalty mark (centered inside D: half of D depth) -->
    <circle cx="${penMarkX / 2}" cy="${W / 2}" r="0.15" fill="white"/>

    <!-- Right penalty mark (centered inside D: half of D depth) -->
    <circle cx="${L - penMarkX / 2}" cy="${W / 2}" r="0.15" fill="white"/>

    <!-- Corner arcs (0.25m radius quarter circles) -->
    <path d="M 0.25,0 A 0.25,0.25 0 0,1 0,0.25" fill="none" stroke="white" stroke-width="${sw}"/>
    <path d="M ${L - 0.25},0 A 0.25,0.25 0 0,0 ${L},0.25" fill="none" stroke="white" stroke-width="${sw}"/>
    <path d="M 0,${W - 0.25} A 0.25,0.25 0 0,1 0.25,${W}" fill="none" stroke="white" stroke-width="${sw}"/>
    <path d="M ${L},${W - 0.25} A 0.25,0.25 0 0,0 ${L - 0.25},${W}" fill="none" stroke="white" stroke-width="${sw}"/>

  </svg>`;

  document.getElementById("pitch").innerHTML = svgContent;
  updateGoalZones(L, W);
}

function updateGoalZones(L, W) {
  const gH = 3;
  const gW = 2;
  const gY = (W - gH) / 2;
  const pitchEl = document.getElementById("pitch");
  const goalWidthPx = (gW / L) * pitchEl.offsetWidth;
  const mouthHeightPx = (gH / W) * pitchEl.offsetHeight;
  const mouthTopPx = (gY / W) * pitchEl.offsetHeight;

  ["goal-left", "goal-right"].forEach(function (id) {
    const el = document.getElementById(id);
    if (el) el.style.width = goalWidthPx + "px";
  });
  ["goal-mouth-left", "goal-mouth-right"].forEach(function (id) {
    const el = document.getElementById(id);
    if (el) {
      el.style.height = mouthHeightPx + "px";
      el.style.top = mouthTopPx + "px";
    }
  });
}

function updatePitchDimensions() {
  pitchLength = parseInt(document.getElementById("pitchLengthSelect").value);
  pitchWidth = parseInt(document.getElementById("pitchWidthSelect").value);
  drawPitch(pitchLength, pitchWidth);
}

function buildRowData(shot) {
  const x = (shot.x !== null && shot.x !== undefined) ? shot.x : "N/A";
  const y = (shot.y !== null && shot.y !== undefined) ? shot.y : "N/A";
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
    pos.x = (shot.x * 1.0) / pitchLength;
    pos.y = (shot.y * 1.0) / pitchWidth;
  }
  if (wasDragged) {
    pos.x2 = (shot.x2 * 1.0) / pitchLength;
    pos.y2 = (shot.y2 * 1.0) / pitchWidth;
  }
  return pos;
}

function cumulativeStats(filteredData) {
  var totalGoals = 0, totalSaves = 0, totalShots = 0;
  var totalFreeKicks = 0, totalPasses = 0, totalCorners = 0, totalTackles = 0, totalTurnovers = 0;

  filteredData.each(function (value) {
    const ev = value[2];
    if (ev && ev.toLowerCase().includes("shot")) {
      totalShots++;
      if (ev === "Shot - Goal") totalGoals++;
      else if (ev === "Shot - Save") totalSaves++;
    } else if (ev === "Free Kick") {
      totalFreeKicks++;
    } else if (ev === "Pass") {
      totalPasses++;
    } else if (ev === "Corner") {
      totalCorners++;
    } else if (ev === "Tackle") {
      totalTackles++;
    } else if (ev === "Turnover") {
      totalTurnovers++;
    }
  });

  $("#cumulative-goals").text(totalGoals);
  $("#cumulative-saves").text(totalSaves);
  $("#cumulative-shots").text(totalShots);
  $("#cumulative-passes").text(totalPasses);
  $("#cumulative-corners").text(totalCorners);
  $("#cumulative-free-kicks").text(totalFreeKicks);
  $("#cumulative-tackles").text(totalTackles);
  $("#cumulative-turnovers").text(totalTurnovers);
}

const tracker = initTracker({
  storage: { prefix: "futsal", extraKeys: ["futsalPitchLength", "futsalPitchWidth"] },
  rosterSize: 16,
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
  defaultEventNames: [
    "Shot - Goal",
    "Shot - Save",
    "Shot - Wide/High",
    "Shot - Blocked",
    "Pass",
    "Corner",
    "Free Kick",
    "Tackle",
    "Foul",
    "Turnover",
  ],
  endpoints: { csv: "/futsal/download_csv", pdf: "/futsal/download_pdf" },
  csvFilename: "shots_data.csv",
  pdfFilename: "report.pdf",
  buildPdfPayload: function (shotsData) {
    return { shots: shotsData, pitchLength, pitchWidth };
  },
  requireActionAndPlayerOnEnter: true,
  buildRowData,
  dotPosition,
  cumulativeStats,
  surfaceEl: function () { return document.getElementById("pitch"); },
  onReady: function () {
    const storedLength = tracker.store.get("futsalPitchLength");
    const storedWidth = tracker.store.get("futsalPitchWidth");
    if (storedLength) {
      pitchLength = parseInt(storedLength);
      document.getElementById("pitchLengthSelect").value = storedLength;
    }
    if (storedWidth) {
      pitchWidth = parseInt(storedWidth);
      document.getElementById("pitchWidthSelect").value = storedWidth;
    }
    drawPitch(pitchLength, pitchWidth);
    setupGoalZoneEvents();
  },
});

const pitch = document.getElementById("pitch");

let isDragging = false;
let startX = null;
let startY = null;
let endX = null;
let endY = null;

pitch.addEventListener("mousedown", function (event) {
  if (startX === null || startY === null) {
    isDragging = true;
    let rect = pitch.getBoundingClientRect();
    startX = Math.round((((event.clientX - rect.left) / pitch.offsetWidth) * pitchLength) / zoomLevel);
    startY = Math.round((((event.clientY - rect.top) / pitch.offsetHeight) * pitchWidth) / zoomLevel);
  }
});

pitch.addEventListener("mousemove", function (event) {
  if (isDragging) {
    let rect = pitch.getBoundingClientRect();
    endX = Math.round((((event.clientX - rect.left) / pitch.offsetWidth) * pitchLength) / zoomLevel);
    endY = Math.round((((event.clientY - rect.top) / pitch.offsetHeight) * pitchWidth) / zoomLevel);
  }
});

pitch.addEventListener("pointerdown", function (event) {
  event.preventDefault();
  if (startX === null || startY === null) {
    isDragging = true;
    pitch.setPointerCapture(event.pointerId);
    let rect = pitch.getBoundingClientRect();
    startX = Math.round((((event.clientX - rect.left) / pitch.offsetWidth) * pitchLength) / zoomLevel);
    startY = Math.round((((event.clientY - rect.top) / pitch.offsetHeight) * pitchWidth) / zoomLevel);
  }
});

pitch.addEventListener("pointermove", function (event) {
  event.preventDefault();
  if (isDragging) {
    let rect = pitch.getBoundingClientRect();
    endX = Math.round((((event.clientX - rect.left) / pitch.offsetWidth) * pitchLength) / zoomLevel);
    endY = Math.round((((event.clientY - rect.top) / pitch.offsetHeight) * pitchWidth) / zoomLevel);
  }
});

pitch.addEventListener("pointerup", function (event) {
  event.preventDefault();
  if (isDragging) {
    isDragging = false;
    var currentTime = tracker.getCurrentTime();
    tracker.addShot(tracker.currentActionType, startX, startY, endX, endY, currentTime, tracker.currentPlayer);
    startX = null; startY = null; endX = null; endY = null;
  }
});

function setupGoalZoneEvents() {
  const gW = 2;

  ["goal-left", "goal-right"].forEach(function (id) {
    const goalEl = document.getElementById(id);
    if (!goalEl) return;
    const side = id === "goal-left" ? "left" : "right";

    goalEl.addEventListener("pointerdown", function (event) {
      event.preventDefault();
      if (!isDragging) {
        isDragging = true;
        goalEl.setPointerCapture(event.pointerId);
        const rect = goalEl.getBoundingClientRect();
        const relX = (event.clientX - rect.left) / goalEl.offsetWidth;
        const relY = (event.clientY - rect.top) / goalEl.offsetHeight;
        startY = Math.round(relY * pitchWidth);
        startX = side === "left"
          ? Math.round(-gW + relX * gW)
          : Math.round(pitchLength + relX * gW);
        endX = startX; endY = startY;
      }
    });

    goalEl.addEventListener("pointermove", function (event) {
      if (isDragging) {
        const rect = goalEl.getBoundingClientRect();
        const relX = (event.clientX - rect.left) / goalEl.offsetWidth;
        const relY = (event.clientY - rect.top) / goalEl.offsetHeight;
        endY = Math.round(relY * pitchWidth);
        endX = side === "left"
          ? Math.round(-gW + relX * gW)
          : Math.round(pitchLength + relX * gW);
      }
    });

    goalEl.addEventListener("pointerup", function (event) {
      event.preventDefault();
      if (isDragging) {
        isDragging = false;
        const currentTime = tracker.getCurrentTime();
        tracker.addShot(tracker.currentActionType, startX, startY, endX, endY, currentTime, tracker.currentPlayer);
        startX = null; startY = null; endX = null; endY = null;
      }
    });
  });
}

window.addEventListener("resize", function () {
  updateGoalZones(pitchLength, pitchWidth);
});

document.getElementById("pitchLengthSelect").addEventListener("change", function () {
  tracker.store.set("futsalPitchLength", this.value);
});
document.getElementById("pitchWidthSelect").addEventListener("change", function () {
  tracker.store.set("futsalPitchWidth", this.value);
});
