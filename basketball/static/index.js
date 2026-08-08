// Basketball-specific tracker: court-type switching (NBA/WNBA/NCAA/FIBA,
// each with its own dimensions and pre-rendered court image) and
// bottom-left-origin (RHCS) coordinate capture off #court. Everything else —
// storage, player maps, event names, the shot table pipeline, dot/arrow
// rendering, timer, keyboard shortcuts, downloads, session save/load —
// comes from shared/static/tracker-core.js.

const courtConfig = {
  nba: { width: 28.6512, height: 15.24, name: "NBA" },
  wnba: { width: 28.6512, height: 15.24, name: "WNBA" },
  ncaa: { width: 28.6512, height: 15.24, name: "NCAA" },
  fiba: { width: 28.0, height: 15.0, name: "FIBA" },
};

let currentCourtType = "nba";

function getCurrentCourtDimensions() {
  return courtConfig[currentCourtType];
}

// Referenced by the court-type <select>'s inline onchange in the template.
function changeCourtType() {
  const select = document.getElementById("courtTypeSelect");
  const newCourtType = select.value;

  if (newCourtType !== currentCourtType) {
    currentCourtType = newCourtType;
    document.getElementById("courtImage").src = `/basketball/static/court-${currentCourtType}.png`;
    tracker.store.set("basketballCourtType", currentCourtType);
  }
}

function loadCourtType() {
  const savedCourtType = tracker.store.get("basketballCourtType");
  if (savedCourtType && courtConfig[savedCourtType]) {
    currentCourtType = savedCourtType;
    const select = document.getElementById("courtTypeSelect");
    if (select) select.value = currentCourtType;
    const courtImage = document.getElementById("courtImage");
    if (courtImage) courtImage.src = `/basketball/static/court-${currentCourtType}.png`;
  }
}

function buildRowData(shot) {
  return [
    shot.time, shot.player, shot.action, shot.x, shot.y, shot.x2, shot.y2,
    "<button class='btn btn-outline-danger remove-button' onclick='removeShot(this)'>X</button>",
  ];
}

// Court is bottom-left origin (RHCS), but tracker-core's dot rendering
// assumes top-left-origin percentages — flip y here so the dot lands in the
// right spot on screen.
function dotPosition(shot) {
  const dimensions = getCurrentCourtDimensions();
  const wasDragged =
    shot.x2 !== null && shot.x2 !== undefined && shot.x2 !== "N/A" &&
    shot.y2 !== null && shot.y2 !== undefined && shot.y2 !== "N/A";
  const pos = {
    x: (shot.x * 1.0) / dimensions.width,
    y: 1 - (shot.y * 1.0) / dimensions.height,
  };
  if (wasDragged) {
    pos.x2 = (shot.x2 * 1.0) / dimensions.width;
    pos.y2 = 1 - (shot.y2 * 1.0) / dimensions.height;
  }
  return pos;
}

function cumulativeStats(filteredData) {
  var totalGoals = 0, totalSaves = 0, totalFieldGoals = 0;
  var totalAssists = 0, totalRebounds = 0, totalSteals = 0, totalBlocks = 0;

  filteredData.each(function (value) {
    const ev = value[2];
    if (ev.includes("Field Goal")) {
      totalFieldGoals++;
      if (ev === "Field Goal") totalGoals++;
      else if (ev === "Field Goal - Miss") totalSaves++;
    } else if (ev === "Assist") {
      totalAssists++;
    } else if (ev === "Rebound") {
      totalRebounds++;
    } else if (ev === "Steal") {
      totalSteals++;
    } else if (ev === "Block") {
      totalBlocks++;
    }
  });

  $("#cumulative-goals").text(totalGoals);
  $("#cumulative-saves").text(totalSaves);
  $("#cumulative-field-goals").text(totalFieldGoals);
  $("#cumulative-assists").text(totalAssists);
  $("#cumulative-rebounds").text(totalRebounds);
  $("#cumulative-steals").text(totalSteals);
  $("#cumulative-blocks").text(totalBlocks);
}

const tracker = initTracker({
  storage: { prefix: "basketball", extraKeys: ["basketballCourtType"] },
  rosterSize: 14,
  homeShortcutMap: {
    1: "(1)", 2: "(2)", 3: "(3)", 4: "(4)", 5: "(5)", 6: "(6)", 7: "(7)",
    8: "(8)", 9: "(9)", 10: "(0)", 11: "(-)", 12: "(=)", 13: "(Q)", 14: "(W)",
  },
  awayShortcutMap: {
    1: "(E)", 2: "(R)", 3: "(T)", 4: "(Y)", 5: "(U)", 6: "(I)", 7: "(O)",
    8: "(P)", 9: "(A)", 10: "(S)", 11: "(D)", 12: "(F)", 13: "(G)", 14: "(H)",
  },
  defaultEventNames: [
    "Field Goal", "Field Goal - Miss", "Three Pointer", "Assist",
    "Dribble", "Rebound", "Pass", "Steal",
    "Block", "Foul", "Free Throw", "Turnover",
  ],
  endpoints: { csv: "/basketball/download_csv", pdf: "/basketball/download_pdf" },
  csvFilename: "shots_data.csv",
  pdfFilename: "report.pdf",
  requireActionAndPlayerOnEnter: true,
  buildRowData,
  dotPosition,
  cumulativeStats,
  surfaceEl: function () { return document.getElementById("court"); },
  onReady: function () {
    loadCourtType();
  },
});

// ── Court interaction (bottom-left origin / RHCS) ───────────────────────────

const court = document.getElementById("court");

let isDragging = false;
let startX = null;
let startY = null;
let endX = null;
let endY = null;

function captureCoords(event, rect, dimensions) {
  const adjustedX = event.clientX - rect.left;
  const adjustedY = event.clientY - rect.top;
  return {
    x: +(((adjustedX / court.offsetWidth) * dimensions.width)).toFixed(2),
    y: +((((court.offsetHeight - adjustedY) / court.offsetHeight) * dimensions.height)).toFixed(2),
  };
}

court.addEventListener("mousedown", function (event) {
  if (startX === null || startY === null) {
    isDragging = true;
    const rect = court.getBoundingClientRect();
    const coords = captureCoords(event, rect, getCurrentCourtDimensions());
    startX = coords.x;
    startY = coords.y;
  }
});

court.addEventListener("mousemove", function (event) {
  if (isDragging) {
    const rect = court.getBoundingClientRect();
    const coords = captureCoords(event, rect, getCurrentCourtDimensions());
    endX = coords.x;
    endY = coords.y;
  }
});

court.addEventListener("pointerdown", function (event) {
  event.preventDefault();
  if (startX === null || startY === null) {
    isDragging = true;
    court.setPointerCapture(event.pointerId);
    const rect = court.getBoundingClientRect();
    const coords = captureCoords(event, rect, getCurrentCourtDimensions());
    startX = coords.x;
    startY = coords.y;
  }
});

court.addEventListener("pointermove", function (event) {
  event.preventDefault();
  if (isDragging) {
    const rect = court.getBoundingClientRect();
    const coords = captureCoords(event, rect, getCurrentCourtDimensions());
    endX = coords.x;
    endY = coords.y;
  }
});

court.addEventListener("pointerup", function (event) {
  event.preventDefault();
  if (isDragging) {
    isDragging = false;
    const currentTime = tracker.getCurrentTime();
    tracker.addShot(tracker.currentActionType, startX, startY, endX, endY, currentTime, tracker.currentPlayer, { courtType: currentCourtType });
    startX = null; startY = null; endX = null; endY = null;
  }
});
