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

  // Penalty area top/bottom y extents
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

// ── Player maps ──────────────────────────────────────────────────────────────

let homePlayerMap = {};
let awayPlayerMap = {};

let homeShortcutMap = {
  1: "(1)", 2: "(2)", 3: "(3)", 4: "(4)",
  5: "(5)", 6: "(6)", 7: "(7)", 8: "(8)",
  9: "(9)", 10: "(0)", 11: "(Q)", 12: "(W)",
  13: "(E)", 14: "(R)", 15: "(T)", 16: "(Y)",
};

let awayShortcutMap = {
  1: "(U)", 2: "(I)", 3: "(O)", 4: "(P)",
  5: "([)", 6: "(])", 7: "(A)", 8: "(S)",
  9: "(D)", 10: "(F)", 11: "(G)", 12: "(H)",
  13: "(J)", 14: "(K)", 15: "(L)", 16: "(;)",
};

const eventShortcutKeys = ['Z', 'X', 'C', 'V', 'B', '<', 'N', 'M', ',', '.', '?', '>'];
const eventKeyMap = eventShortcutKeys.reduce((map, key, index) => {
  map[key.toUpperCase()] = index;
  return map;
}, {});

let eventNames = [];

function initializePlayerMaps() {
  const storedHome = sessionStorage.getItem('futsalHomePlayerMap');
  const storedAway = sessionStorage.getItem('futsalAwayPlayerMap');

  if (storedHome) {
    homePlayerMap = JSON.parse(storedHome);
    for (let i = 1; i <= 16; i++) {
      const btn = document.getElementById(`homePlayerButton${i}`);
      if (btn) btn.innerHTML = `${homePlayerMap[i].jersey} ${homeShortcutMap[i]}`;
    }
  } else {
    for (let i = 1; i <= 16; i++) {
      homePlayerMap[i] = { jersey: `A${i.toString().padStart(2, "0")}`, name: `HomePlayer${i}` };
    }
    sessionStorage.setItem('futsalHomePlayerMap', JSON.stringify(homePlayerMap));
  }

  if (storedAway) {
    awayPlayerMap = JSON.parse(storedAway);
    for (let i = 1; i <= 16; i++) {
      const btn = document.getElementById(`awayPlayerButton${i}`);
      if (btn) btn.innerHTML = `${awayPlayerMap[i].jersey} ${awayShortcutMap[i]}`;
    }
  } else {
    for (let i = 1; i <= 16; i++) {
      awayPlayerMap[i] = { jersey: `B${i.toString().padStart(2, "0")}`, name: `AwayPlayer${i}` };
    }
    sessionStorage.setItem('futsalAwayPlayerMap', JSON.stringify(awayPlayerMap));
  }
}

initializePlayerMaps();

function updatePlayerNames(team) {
  const playerMap = team === "home" ? homePlayerMap : awayPlayerMap;
  const shortcutMap = team === "home" ? homeShortcutMap : awayShortcutMap;
  const prefix = team === "home" ? "home" : "away";

  for (let i = 1; i <= 16; i++) {
    const jerseyInput = document.getElementById(`${prefix}Jersey${i}`);
    const playerInput = document.getElementById(`${prefix}Player${i}`);
    if (jerseyInput && playerInput) {
      playerMap[i] = {
        jersey: jerseyInput.value || `P${i.toString().padStart(2, "0")}`,
        name: playerInput.value || `Player${i}`,
      };
    }
  }

  for (let i = 1; i <= 16; i++) {
    const btn = document.getElementById(`${prefix}PlayerButton${i}`);
    if (btn) btn.innerHTML = `${playerMap[i].jersey} ${shortcutMap[i]}`;
  }

  if (team === "home") {
    sessionStorage.setItem('futsalHomePlayerMap', JSON.stringify(homePlayerMap));
    $(`#editHomePlayerNamesModal`).modal('hide');
  } else {
    sessionStorage.setItem('futsalAwayPlayerMap', JSON.stringify(awayPlayerMap));
    $(`#editAwayPlayerNamesModal`).modal('hide');
  }
}

// ── State ────────────────────────────────────────────────────────────────────

var currentActionType = "";
var currentPlayer = "";
var currentPlayerName = "";

const storedRaw = sessionStorage.getItem("futsalRawShots");
var rawShots = storedRaw ? JSON.parse(storedRaw) : [];
var shotsData = [];

const pitch = document.getElementById("pitch");

let isDragging = false;
let startX = null;
let startY = null;
let endX = null;
let endY = null;

var table;
const keyboardShortcutToastKey = "futsalKeyboardShortcutToastDismissed";

// ── DataTable init ────────────────────────────────────────────────────────────

$(document).ready(function () {
  table = $("#event-table").DataTable({
    paging: false,
    info: false,
    responsive: true,
    language: { searchPlaceholder: "Filter by Player and Event" },
  });

  if (rawShots.length > 0) {
    for (var i = 0; i < rawShots.length; i++) {
      addShot(
        rawShots[i]["event"],
        rawShots[i]["startX"],
        rawShots[i]["startY"],
        rawShots[i]["endX"],
        rawShots[i]["endY"],
        rawShots[i]["time"],
        rawShots[i]["player"]
      );
    }
  }

  table.on("draw", function () { updateCumulativeValues(); });
  updateCumulativeValues();
  initKeyboardShortcutToast();

  // Restore pitch dimensions from session
  const storedLength = sessionStorage.getItem("futsalPitchLength");
  const storedWidth = sessionStorage.getItem("futsalPitchWidth");
  if (storedLength) {
    pitchLength = parseInt(storedLength);
    document.getElementById("pitchLengthSelect").value = storedLength;
  }
  if (storedWidth) {
    pitchWidth = parseInt(storedWidth);
    document.getElementById("pitchWidthSelect").value = storedWidth;
  }
  drawPitch(pitchLength, pitchWidth);

  // Restore event names
  const storedEvents = sessionStorage.getItem("futsalEventNames");
  if (storedEvents) {
    eventNames = JSON.parse(storedEvents);
  } else {
    eventNames = [
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
    ];
    sessionStorage.setItem("futsalEventNames", JSON.stringify(eventNames));
  }
  renderEventButtons();
  setupGoalZoneEvents();
});

// ── Event name editing ────────────────────────────────────────────────────────

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
  const lines = textarea.value.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  eventNames = lines;
  sessionStorage.setItem("futsalEventNames", JSON.stringify(eventNames));
  renderEventButtons();
  $("#editEventNamesModal").modal("hide");
}

// ── Cumulative stats ──────────────────────────────────────────────────────────

function updateCumulativeValues() {
  var filteredData = table.rows({ search: "applied" }).data();
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

// ── Action / player selection ─────────────────────────────────────────────────

function setActionType(index) {
  const eventName = eventNames[index];
  if (!eventName) { currentActionType = ""; return; }

  if (currentActionType === eventName) {
    document.querySelectorAll(".event-button").forEach(b => b.classList.remove("active"));
    currentActionType = "";
    return;
  }
  currentActionType = eventName;
  document.querySelectorAll(".event-button").forEach(b => b.classList.remove("active"));
  this.classList.add("active");
}

function setPlayer(team, playerIndex) {
  const playerMap = team === "home" ? homePlayerMap : awayPlayerMap;
  const prefix = team === "home" ? "home" : "away";

  if (currentPlayer === playerMap[playerIndex].jersey) {
    currentPlayer = "";
    currentPlayerName = "";
    document.querySelectorAll(".player-button").forEach(b => b.classList.remove("active"));
    return;
  }

  currentPlayer = playerMap[playerIndex].jersey;
  currentPlayerName = playerMap[playerIndex].name;

  for (let i = 1; i <= 16; i++) {
    const hb = document.getElementById(`homePlayerButton${i}`);
    const ab = document.getElementById(`awayPlayerButton${i}`);
    if (hb) hb.classList.remove("active");
    if (ab) ab.classList.remove("active");
  }
  document.getElementById(`${prefix}PlayerButton${playerIndex}`).classList.add("active");
}

// ── Pitch interaction ─────────────────────────────────────────────────────────

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
    var currentTime = getCurrentTime();
    addShot(currentActionType, startX, startY, endX, endY, currentTime, currentPlayer);
    rawShots.push({ event: currentActionType, startX, startY, endX, endY, time: currentTime, player: currentPlayer });
    sessionStorage.setItem("futsalRawShots", JSON.stringify(rawShots));
    startX = null; startY = null; endX = null; endY = null;
  }
});

// ── Goal zone interaction ─────────────────────────────────────────────────────

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
        const currentTime = getCurrentTime();
        addShot(currentActionType, startX, startY, endX, endY, currentTime, currentPlayer);
        rawShots.push({ event: currentActionType, startX, startY, endX, endY, time: currentTime, player: currentPlayer });
        sessionStorage.setItem("futsalRawShots", JSON.stringify(rawShots));
        startX = null; startY = null; endX = null; endY = null;
      }
    });
  });
}

window.addEventListener("resize", function () {
  updateGoalZones(pitchLength, pitchWidth);
});

// ── Time helpers ──────────────────────────────────────────────────────────────

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

// ── Add / remove shots ────────────────────────────────────────────────────────

function addShot(event, startX, startY, endX, endY, time, currentPlayer) {
  let wasDragged =
    startX !== null && startY !== null && endX !== null && endY !== null &&
    (startX !== endX || startY !== endY);

  var actionType = event;
  var playerJerseyNumber = currentPlayer || "";

  var newRowData = [
    time,
    playerJerseyNumber,
    actionType,
    startX !== null ? startX : "N/A",
    startY !== null ? startY : "N/A",
    wasDragged ? endX : "N/A",
    wasDragged ? endY : "N/A",
    "<button class='btn btn-outline-danger remove-button' onclick='removeShot(this)'>X</button>",
  ];

  var rowIndex = table.row.add(newRowData).draw().index();

  if (startX !== null && startY !== null) {
    table.row(rowIndex).data().dotx = (startX * 1.0) / pitchLength;
    table.row(rowIndex).data().doty = (startY * 1.0) / pitchWidth;
  }
  if (wasDragged && endX !== null && endY !== null) {
    table.row(rowIndex).data().dotx2 = (endX * 1.0) / pitchLength;
    table.row(rowIndex).data().doty2 = (endY * 1.0) / pitchWidth;
  }

  $(table.row(rowIndex).node())
    .on("mouseenter", function () { showDot(this); })
    .on("mouseleave", function () { removeDot(); });
  $(table.row(rowIndex).node()).mouseenter();

  // Resolve playerName for shotsData
  let resolvedPlayerName = currentPlayerName;
  if (!resolvedPlayerName) {
    // Try to find name from maps when replaying from session
    for (let i = 1; i <= 16; i++) {
      if (homePlayerMap[i] && homePlayerMap[i].jersey === currentPlayer) {
        resolvedPlayerName = homePlayerMap[i].name;
        break;
      }
      if (awayPlayerMap[i] && awayPlayerMap[i].jersey === currentPlayer) {
        resolvedPlayerName = awayPlayerMap[i].name;
        break;
      }
    }
  }

  shotsData.push({
    time,
    player: playerJerseyNumber,
    playerName: resolvedPlayerName || playerJerseyNumber,
    action: actionType,
    x: startX,
    y: startY,
    x2: wasDragged ? endX : "N/A",
    y2: wasDragged ? endY : "N/A",
  });
  sessionStorage.setItem("futsalShotsData", JSON.stringify(shotsData));
}

function removeShot(deleteButton) {
  var row = $(deleteButton).closest("tr");
  var rowIndex = table.row(row).index();

  if (shotsData && rowIndex !== undefined) {
    shotsData.splice(rowIndex, 1);
    sessionStorage.setItem("futsalShotsData", JSON.stringify(shotsData));
  }
  if (rawShots && rowIndex !== undefined) {
    rawShots.splice(rowIndex, 1);
    sessionStorage.setItem("futsalRawShots", JSON.stringify(rawShots));
  }

  removeDot();
  table.row(row).remove().draw();
}

// ── Dot / arrow visualization ─────────────────────────────────────────────────

function showDot(rowNode) {
  removeDot();
  var rowData = table.row(rowNode).data();
  var xPercent = parseFloat(rowData.dotx);
  var yPercent = parseFloat(rowData.doty);

  if (isNaN(xPercent) || isNaN(yPercent)) return;

  createDot(xPercent * pitch.offsetWidth, yPercent * pitch.offsetHeight, "hover-dot-1");

  if (rowData.dotx2 && rowData.doty2) {
    var x2 = parseFloat(rowData.dotx2) * pitch.offsetWidth;
    var y2 = parseFloat(rowData.doty2) * pitch.offsetHeight;
    createDot(x2, y2, "hover-dot-2");
    createArrow(xPercent * pitch.offsetWidth, yPercent * pitch.offsetHeight, x2, y2, "hover-arrow");
  }
}

function createDot(x, y, id) {
  var dot = document.createElement("div");
  dot.id = id;
  dot.className = "dot";
  dot.style.left = `${x}px`;
  dot.style.top = `${y}px`;
  pitch.appendChild(dot);
}

function removeDot() {
  ["hover-dot-1", "hover-dot-2", "hover-arrow"].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.parentNode.removeChild(el);
  });
}

function createArrow(x1, y1, x2, y2, id) {
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
  pitch.appendChild(svg);
}

// ── Download ──────────────────────────────────────────────────────────────────

function downloadCSV() {
  fetch("/futsal/download_csv", {
    method: "POST",
    body: JSON.stringify(shotsData),
    headers: { "Content-Type": "application/json" },
  })
    .then(r => r.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "futsal_events.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    })
    .catch(err => console.error("Error downloading CSV:", err));
}

function downloadPDF() {
  fetch("/futsal/download_pdf", {
    method: "POST",
    body: JSON.stringify({ shots: shotsData, pitchLength, pitchWidth }),
    headers: { "Content-Type": "application/json" },
  })
    .then(r => r.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "futsal_report.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    })
    .catch(err => console.error("Error downloading PDF:", err));
}

// ── Timer ─────────────────────────────────────────────────────────────────────

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

// ── Keyboard shortcuts ────────────────────────────────────────────────────────

function initKeyboardShortcutToast() {
  if (!sessionStorage.getItem(keyboardShortcutToastKey)) {
    var toastEl = document.getElementById("keyboardShortcutToast");
    var toast = new bootstrap.Toast(toastEl, { delay: 8000 });
    toast.show();
    toastEl.addEventListener("hidden.bs.toast", function () {
      sessionStorage.setItem(keyboardShortcutToastKey, "true");
    });
  }
}

document.addEventListener("keydown", function (event) {
  const activeModal = document.querySelector(".modal.show");
  if (activeModal) return;

  const homePlayerKeyMap = {
    '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6, '8': 7,
    '9': 8, '0': 9, 'Q': 10, 'W': 11, 'E': 12, 'R': 13, 'T': 14, 'Y': 15,
  };
  const awayPlayerKeyMap = {
    'U': 0, 'I': 1, 'O': 2, 'P': 3, '[': 4, ']': 5, 'A': 6, 'S': 7,
    'D': 8, 'F': 9, 'G': 10, 'H': 11, 'J': 12, 'K': 13, 'L': 14, ';': 15,
  };

  const key = event.key.toUpperCase();

  if (key in homePlayerKeyMap) {
    const idx = homePlayerKeyMap[key] + 1;
    setPlayer("home", idx);
    return;
  }
  if (key in awayPlayerKeyMap) {
    const idx = awayPlayerKeyMap[key] + 1;
    setPlayer("away", idx);
    return;
  }

  if (key in eventKeyMap) {
    const idx = eventKeyMap[key];
    const btns = document.querySelectorAll(".event-button");
    if (btns[idx]) setActionType.call(btns[idx], idx);
    return;
  }

  if (event.key === "Enter") {
    var currentTime = getCurrentTime();
    addShot(currentActionType, null, null, null, null, currentTime, currentPlayer);
    rawShots.push({ event: currentActionType, startX: null, startY: null, endX: null, endY: null, time: currentTime, player: currentPlayer });
    sessionStorage.setItem("futsalRawShots", JSON.stringify(rawShots));
    return;
  }

  if (event.key === "Backspace") {
    if (shotsData.length > 0) {
      const lastRow = table.row(table.rows().count() - 1);
      if (lastRow) {
        shotsData.pop();
        rawShots.pop();
        sessionStorage.setItem("futsalShotsData", JSON.stringify(shotsData));
        sessionStorage.setItem("futsalRawShots", JSON.stringify(rawShots));
        removeDot();
        lastRow.remove().draw();
      }
    }
    return;
  }
});

// ── Dimension persistence ─────────────────────────────────────────────────────

document.getElementById("pitchLengthSelect").addEventListener("change", function () {
  sessionStorage.setItem("futsalPitchLength", this.value);
});
document.getElementById("pitchWidthSelect").addEventListener("change", function () {
  sessionStorage.setItem("futsalPitchWidth", this.value);
});
