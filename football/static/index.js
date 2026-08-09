// Football tracker: fixed-origin 105x68m pitch, zoom, xG/xSave.

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

function calculateDistance(pos_x, pos_y) {
  const midGoalX = 0.0;
  const midGoalY = 34.0;
  return Math.hypot(pos_x - midGoalX, pos_y - midGoalY);
}

function calculateAngle(pos_x, pos_y) {
  const deltaY = Math.pow(pos_y - 34.0, 2);
  const deltaX = Math.pow(pos_x - 0.0, 2);
  const radian = Math.atan2(deltaY, deltaX);
  return radian * (180 / Math.PI);
}

function distanceAnglexG(pos_x, pos_y) {
  if (pos_x >= 52) {
    pos_x = 105 - pos_x;
    pos_y = 68 - pos_y;
  }
  const distance = calculateDistance(pos_x, pos_y);
  const angle = calculateAngle(pos_x, pos_y);
  let p =
    1 /
    (1 +
      Math.exp(
        -(0.2204 - 0.0281 * pos_x - 0.0062 * pos_y - 0.0998 * distance - 0.0081 * angle)
      ));
  return p.toFixed(2);
}

function buildRowData(shot) {
  const x = shot.x !== null && shot.x !== undefined ? shot.x : "N/A";
  const y = shot.y !== null && shot.y !== undefined ? shot.y : "N/A";
  return [
    shot.time, shot.player, shot.action, x, y, shot.x2, shot.y2, shot.xG, shot.xSave,
    "<button class='btn btn-outline-danger remove-button' onclick='removeShot(this)'>X</button>",
  ];
}

function dotPosition(shot) {
  const wasDragged =
    shot.x2 !== null && shot.x2 !== undefined && shot.x2 !== "N/A" &&
    shot.y2 !== null && shot.y2 !== undefined && shot.y2 !== "N/A";
  const pos = {};
  if (shot.x !== null && shot.x !== undefined) {
    pos.x = (shot.x * 1.0) / 105;
    pos.y = (shot.y * 1.0) / 68;
  }
  if (wasDragged) {
    pos.x2 = (shot.x2 * 1.0) / 105;
    pos.y2 = (shot.y2 * 1.0) / 68;
  }
  return pos;
}

function cumulativeStats(filteredData) {
  var totalXG = 0, totalGoals = 0, totalXSave = 0, totalSaves = 0, totalShots = 0;
  var totalFreeKicks = 0, totalPasses = 0, totalCorners = 0, totalTackles = 0;

  filteredData.each(function (value) {
    totalXG += parseFloat(value[7]) || 0;
    totalXSave += parseFloat(value[8]) || 0;
    const ev = value[2];
    if (ev.includes("Shot")) {
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
    }
  });

  $("#cumulative-xg").text(totalXG.toFixed(2));
  $("#cumulative-goals").text(totalGoals);
  $("#cumulative-xsave").text(totalXSave.toFixed(2));
  $("#cumulative-saves").text(totalSaves);
  $("#cumulative-shots").text(totalShots);
  $("#cumulative-passes").text(totalPasses);
  $("#cumulative-corners").text(totalCorners);
  $("#cumulative-free-kicks").text(totalFreeKicks);
  $("#cumulative-tackles").text(totalTackles);
}

const tracker = initTracker({
  storage: { prefix: "football" },
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
    "Shot", "Shot - Save", "Shot - Goal", "Shot Assist",
    "Dribble", "Location", "Cross", "Pass",
    "Tackle", "Foul", "Free Kick", "Corner",
  ],
  endpoints: { csv: "/football/download_csv", pdf: "/football/download_pdf" },
  csvFilename: "shots_data.csv",
  pdfFilename: "report.pdf",
  requireActionAndPlayerOnEnter: true,
  buildRowData,
  dotPosition,
  cumulativeStats,
  buildShot: function (base) {
    const xG =
      base.action === "Shot" || base.action === "Shot - Goal" || base.action === "Shot - Save"
        ? (base.x !== null && base.y !== null ? distanceAnglexG(base.x, base.y) : "N/A")
        : "N/A";
    const xSave = base.action === "Shot - Save" ? +(1.0 - xG).toFixed(2) : "N/A";
    return Object.assign({}, base, { xG, xSave });
  },
  surfaceEl: function () { return document.getElementById("pitch"); },
});

let isDragging = false;
let startX = null;
let startY = null;
let endX = null;
let endY = null;

function captureCoords(event, rect) {
  const x = Math.round((((event.clientX - rect.left) / pitch.offsetWidth) * 105) / zoomLevel);
  const y = Math.round((((event.clientY - rect.top) / pitch.offsetHeight) * 68) / zoomLevel);
  return { x, y };
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
