// Court dimensions (m)
// Badminton: 13.40m length, 6.10m width (doubles)
const COURT_W = 13.40; // length (baseline to baseline) in m
const COURT_H = 6.10; // width for doubles (sideline to sideline) in m
let zoomLevel = 1;

// Run-off space (m)
const RUNOFF_Y = 1.50;  // left + right each
const RUNOFF_X = 2.00;  // top + bottom each

// Pitch dimensions (court + run-off)
const PITCH_W = COURT_W + 2 * RUNOFF_X;
const PITCH_H = COURT_H + 2 * RUNOFF_Y;

// Push geometry to CSS so layout stays exact
function updateCourtDimensions() {
  const rootStyle = document.documentElement.style;
  rootStyle.setProperty('--aspect-w', PITCH_W);
  rootStyle.setProperty('--aspect-h', PITCH_H);
  rootStyle.setProperty('--court-w-pct', `${(COURT_W / PITCH_W) * 100}%`);
  rootStyle.setProperty('--court-h-pct', `${(COURT_H / PITCH_H) * 100}%`);
  rootStyle.setProperty('--runoff-x-pct', `${(RUNOFF_X / PITCH_W) * 100}%`);
  rootStyle.setProperty('--runoff-y-pct', `${(RUNOFF_Y / PITCH_H) * 100}%`);
}

// Initialize court dimensions
updateCourtDimensions();

// Make sure pitch is defined globally once
const pitch = document.getElementById("pitch");

function zoomIn() {
  zoomLevel += 0.1;
  const pitch = document.getElementById("pitch");
  pitch.style.transformOrigin = "center center";
  pitch.style.transform = `scale(${zoomLevel})`;
}

function zoomOut() {
  if (zoomLevel > 0.5) {
    // Prevents excessive zoom out
    zoomLevel -= 0.1;
    const pitch = document.getElementById("pitch");
    pitch.style.transformOrigin = "center center";
    pitch.style.transform = `scale(${zoomLevel})`;
  }
}


// Create objects to store jersey numbers and player names for both teams
let homePlayerMap = {};
let awayPlayerMap = {};

// Map of keyboard shortcuts based on player index
let homeShortcutMap = {
  1: "(1)",
  2: "(2)",
};

let awayShortcutMap = {
  1: "(3)",
  2: "(4)",
};

const eventShortcutKeys = ['Z', 'X', 'C', 'V', 'B', '<', 'N', 'M', ',', '.', '?', '>'];
const eventKeyMap = eventShortcutKeys.reduce((map, key, index) => {
  map[key.toUpperCase()] = index;
  return map;
}, {});

let eventNames = [];

// Initialize playerMap with default values for 16 players for both teams
function initializePlayerMaps() {
  // Check if player maps are already in sessionStorage
  const storedHomePlayerMap = sessionStorage.getItem('badmintonHomePlayerMap');
  const storedAwayPlayerMap = sessionStorage.getItem('badmintonAwayPlayerMap');

  // Load from sessionStorage if available, else initialize with default values
  if (storedHomePlayerMap) {
    homePlayerMap = JSON.parse(storedHomePlayerMap);
    console.log("stored home map:");
    console.log(homePlayerMap);
    for (let i = 1; i <= 16; i++) {
      let button = document.getElementById(`homePlayerButton${i}`);
      if (button) {
        let jerseyNumber = homePlayerMap[i].jersey;
        let shortcut = homeShortcutMap[i]; // Get the shortcut based on the player's index
        button.innerHTML = `${jerseyNumber} ${shortcut}`;
      }
    }
  } else {
    for (let i = 1; i <= 16; i++) {
      homePlayerMap[i] = {
        jersey: `A${i.toString().padStart(2, "0")}`,
        name: `HomePlayer${i}`,
      };
    }
    sessionStorage.setItem('badmintonHomePlayerMap', JSON.stringify(homePlayerMap));
  }

  if (storedAwayPlayerMap) {
    awayPlayerMap = JSON.parse(storedAwayPlayerMap);
    console.log("stored away map:");
    console.log(awayPlayerMap);
    for (let i = 1; i <= 16; i++) {
      let button = document.getElementById(`awayPlayerButton${i}`);
      if (button) {
        let jerseyNumber = awayPlayerMap[i].jersey;
        let shortcut = awayShortcutMap[i]; // Get the shortcut based on the player's index
        button.innerHTML = `${jerseyNumber} ${shortcut}`;
      }
    }
  } else {
    for (let i = 1; i <= 16; i++) {
      awayPlayerMap[i] = {
        jersey: `B${i.toString().padStart(2, "0")}`,
        name: `AwayPlayer${i}`,
      };
    }
    sessionStorage.setItem('badmintonAwayPlayerMap', JSON.stringify(awayPlayerMap));
  }
}

// Call initializePlayerMap when the script loads
initializePlayerMaps();

// Function to update player names and jersey numbers from the input fields in the modal
function updatePlayerNames(team) {
  const playerMap = team === "home" ? homePlayerMap : awayPlayerMap;
  const shortcutMap = team === "home" ? homeShortcutMap : awayShortcutMap;
  const prefix = team === "home" ? "home" : "away"; // No prefix for home, "away" for away team

  for (let i = 1; i <= 16; i++) {
    let jerseyInput = document.getElementById(`${prefix}Jersey${i}`); // Use "awayJersey1" for away team
    let playerInput = document.getElementById(`${prefix}Player${i}`); // Use "awayPlayer1" for away team
    if (jerseyInput && playerInput) {
      playerMap[i] = {
        jersey: jerseyInput.value || `P${i.toString().padStart(2, "0")}`, // Default to 'P01', 'P02', etc.
        name: playerInput.value || `Player${i}`, // Default to 'PlayerX'
      };
    }
  }

  for (let i = 1; i <= 16; i++) {
    let button = document.getElementById(`${prefix}PlayerButton${i}`);
    if (button) {
      let jerseyNumber = playerMap[i].jersey;
      let shortcut = shortcutMap[i]; // Get the shortcut based on the player's index
      button.innerHTML = `${jerseyNumber} ${shortcut}`;
    }
  }
  // Persist changes to sessionStorage
  if (team === "home") {
    sessionStorage.setItem('badmintonHomePlayerMap', JSON.stringify(homePlayerMap));
  } else {
    sessionStorage.setItem('badmintonAwayPlayerMap', JSON.stringify(awayPlayerMap));
  }
  //Close the modal
  if(prefix == "home"){
    $(`#editHomePlayerNamesModal`).modal('hide');
  }
  else{
    $(`#editAwayPlayerNamesModal`).modal('hide');
  }
}

var currentActionType = "";
var currentPlayer = "";
var currentPlayerName = "";
var currentGrip = "";
var currentOutcome = "";
if (sessionStorage.getItem("badmintonRawShots")) {
  var rawShots = JSON.parse(sessionStorage.getItem("badmintonRawShots"));
  var shotsData = [];
} else {
  var shotsData = [];
  var rawShots = [];
  const pitch = document.getElementById("pitch");
}
let isDragging = false;
let startX = null;
let startY = null;
let endX = null;
let endY = null;

var table;
const keyboardShortcutToastKey = "badmintonKeyboardShortcutToastDismissed";

$(document).ready(function () {
  table = $("#event-table").DataTable({
    paging: false,
    info: false,
    responsive: true,
    language: {
      searchPlaceholder: "Filter by Player and Event",
    },
  });
  console.log("table");
  console.log(table);
  console.log("badmintonRawShots");
  console.log(rawShots);
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
  initKeyboardShortcutToast();
});

console.log("table");
console.log(table);

function setGrip(gripType) {
  const gripId = gripType.toLowerCase(); // "Forehand" → "forehand", etc.
  const selectedBtn = document.getElementById(gripId);

  // Deselect all grip buttons
  ["forehand", "backhand"].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.classList.remove("active");
  });

  // Toggle off if it's the same grip
  if (currentGrip === gripType) {
    currentGrip = "";
  } else {
    currentGrip = gripType;
    if (selectedBtn) selectedBtn.classList.add("active");
  }
}

function setOutcome(outcomeType) {
  const outcomeIdMap = {
    "Winner": "winner",
    "Unforced Error": "unforcederror",
    "Forced Error": "forcederror",
    "Rally": "rally"
  };

  const outcomeId = outcomeIdMap[outcomeType];
  const selectedBtn = document.getElementById(outcomeId);

  // Deselect all outcome buttons
  Object.values(outcomeIdMap).forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.classList.remove("active");
  });

  // Toggle off if already selected
  if (currentOutcome === outcomeType) {
    currentOutcome = "";
  } else {
    currentOutcome = outcomeType;
    if (selectedBtn) selectedBtn.classList.add("active");
  }
}

function setActionType(index) {
  const eventName = eventNames[index];
  if (!eventName) {
    currentActionType = "";
    return;
  }

  if (currentActionType === eventName) {
    //Undo button active style
    var buttons = document.querySelectorAll(".event-button");
    // Remove the active class from all buttons
    buttons.forEach(function (button) {
      button.classList.remove("active");
    });
    currentActionType = "";
    return;
  }
  // Set the current action type
  currentActionType = eventName;

  // Get all action buttons
  var buttons = document.querySelectorAll(".event-button");

  // Remove the active class from all buttons
  buttons.forEach(function (button) {
    button.classList.remove("active");
  });
  // This assumes that this function is called with 'this' bound to the clicked button
  this.classList.add("active");
}

function setPlayer(team, playerIndex) {
  // Set the current player type
  console.log("given team");
  console.log(team);
  const playerMap = team === "home" ? homePlayerMap : awayPlayerMap;
  console.log("selected playerMap");
  console.log(playerMap);

  const prefix = team === "home" ? "home" : "away";
  console.log("playerIndex:");
  console.log(playerIndex);
  if (currentPlayer == playerMap[playerIndex].jersey) {
    // If player already pressed, toggle the button
    currentPlayer = "";
    currentPlayerName = "";
    var buttons = document.querySelectorAll(".player-button");
    // Remove the active class from all buttons
    buttons.forEach(function (button) {
      button.classList.remove("active");
    });
    return;
  }

  currentPlayer = playerMap[playerIndex].jersey; // Set the current player to the jersey number
  currentPlayerName = playerMap[playerIndex].name; // Set the current player to the jersey number

  // Get all player buttons
  var buttons = document.querySelectorAll(".player-button");

  for (let i = 1; i <= 16; i++) {
    let homeButton = document.getElementById(`homePlayerButton${i}`);
    let awayButton = document.getElementById(`awayPlayerButton${i}`);
    
    // Remove 'active' class if the button exists
    if (homeButton) {
      homeButton.classList.remove("active");
    }
    
    if (awayButton) {
      awayButton.classList.remove("active");
    }
  } 
  document
    .getElementById(`${prefix}PlayerButton${playerIndex}`)
    .classList.add("active");
}

pitch.addEventListener("mousedown", function (event) {
  if (startX === null || startY === null) {
    isDragging = true;
    let rect = pitch.getBoundingClientRect();
    let normX = ((event.clientX - rect.left) / pitch.offsetWidth) * PITCH_W;
    let normY = ((event.clientY - rect.top )  / pitch.offsetHeight) * PITCH_H;
    let centredX = (normX - PITCH_W/2) / zoomLevel;      // now –20…+20
    let centredY = (PITCH_H/2 - normY) / zoomLevel;      // now +10…–10
    // Round to 2 decimal places for practical precision
    startX = +(centredX).toFixed(2);
    startY = +(centredY).toFixed(2);

  }
});

pitch.addEventListener("mousemove", function (event) {
  if (isDragging) {
    let rect = pitch.getBoundingClientRect();
    let normX = ((event.clientX - rect.left) / pitch.offsetWidth) * PITCH_W;
    let normY = ((event.clientY - rect.top )  / pitch.offsetHeight) * PITCH_H;
    let centredX = (normX - PITCH_W/2) / zoomLevel;      // now –20…+20
    let centredY = (PITCH_H/2 - normY) / zoomLevel;      // now +10…–10
    // Round to 2 decimal places for practical precision
    endX = +(centredX).toFixed(2);
    endY = +(centredY).toFixed(2);

  }
});

// Remove existing mouse and touch event listeners

// Add pointer event listeners
pitch.addEventListener("pointerdown", function (event) {
  event.preventDefault(); // Prevent default touch behavior
  if (startX === null || startY === null) {
    isDragging = true;
    let rect = pitch.getBoundingClientRect();
    let normX = ((event.clientX - rect.left) / pitch.offsetWidth) * PITCH_W;
    let normY = ((event.clientY - rect.top )  / pitch.offsetHeight) * PITCH_H;
    let centredX = (normX - PITCH_W/2) / zoomLevel;      // now –20…+20
    let centredY = (PITCH_H/2 - normY) / zoomLevel;      // now +10…–10
    // Round to 2 decimal places for practical precision
    startX = +(centredX).toFixed(2);
    startY = +(centredY).toFixed(2);
  }
});

pitch.addEventListener("pointermove", function (event) {
  event.preventDefault(); // Prevent default touch behavior
  if (isDragging) {
    let rect = pitch.getBoundingClientRect();
    let normX = ((event.clientX - rect.left) / pitch.offsetWidth) * PITCH_W;
    let normY = ((event.clientY - rect.top )  / pitch.offsetHeight) * PITCH_H;
    let centredX = (normX - PITCH_W/2) / zoomLevel;      // now –20…+20
    let centredY = (PITCH_H/2 - normY) / zoomLevel;      // now +10…–10
    // Round to 2 decimal places for practical precision
    endX = +(centredX).toFixed(2);
    endY = +(centredY).toFixed(2);
  }
});

pitch.addEventListener("pointerup", function (event) {
  event.preventDefault(); // Prevent default touch behavior
  if (isDragging) {
    isDragging = false;
    var currentTime = getCurrentTime();
    addShot(
      currentActionType,
      startX,
      startY,
      endX,
      endY,
      currentTime,
      currentPlayer
    );
    rawShots.push({
      event: currentActionType,
      startX: startX,
      startY: startY,
      endX: endX,
      endY: endY,
      time: currentTime,
      player: currentPlayer,
    });
    sessionStorage.setItem("badmintonRawShots", JSON.stringify(rawShots));
    startX = null;
    startY = null;
    endX = null;
    endY = null;
  }
});


function getCurrentDateTime() {
  let now = new Date();
  let day = ("0" + now.getDate()).slice(-2);
  let month = ("0" + (now.getMonth() + 1)).slice(-2);
  let year = now.getFullYear().toString().slice(-2);
  let hours = ("0" + now.getHours()).slice(-2);
  let minutes = ("0" + now.getMinutes()).slice(-2);
  let seconds = ("0" + now.getSeconds()).slice(-2);

  return (
    day + "/" + month + "/" + year + " " + hours + ":" + minutes + ":" + seconds
  );
}

function getCurrentTime() {
  if (elapsedTime > 0) {
    // Use the timer's value
    const totalSeconds = Math.floor(elapsedTime / 1000);
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(
      2,
      "0"
    );
    const seconds = String(totalSeconds % 60).padStart(2, "0");

    // Return the timer time in the format you prefer
    return `${hours}:${minutes}:${seconds}`;
  } else {
    // Fall back to system time if the timer hasn't been used
    return getCurrentDateTime();
  }
}

function addShot(event, startX, startY, endX, endY, time, currentPlayer) {
  let wasDragged =
    startX !== null &&
    startY !== null &&
    endX !== null &&
    endY !== null &&
    (startX !== endX || startY !== endY);
  // var actionType = currentActionType;
  var actionType = event;
  var xG =
    actionType === "Shot" ||
    actionType === "Shot - Goal" ||
    actionType === "Shot - Save"
      ? (startX !== null && startY !== null ? distanceAnglexG(startX, startY) : "N/A")
      : "N/A";
  var xSave = actionType === "Shot - Save" ? +(1.0 - xG).toFixed(2) : "N/A";
  if (currentPlayer == "") {
    var playerJerseyNumber = "";
  } else {
    var playerJerseyNumber = currentPlayer;
  }
  // console.log("playerMap");
  // console.log(playerMap);
  // console.log("playerJerseyNumber");
  // console.log(playerJerseyNumber);

  var newRowData = [
    time,
    playerJerseyNumber,
    currentGrip || "N/A",
    actionType,
    currentOutcome || "N/A",
    startX !== null ? startX : "N/A",
    startY !== null ? startY : "N/A",
    wasDragged ? endX : "N/A",
    wasDragged ? endY : "N/A",
    "<button class='btn btn-outline-danger remove-button' onclick='removeShot(this)'>X</button>",
  ];

  // Add new row data with DataTables API
  var rowIndex = table.row.add(newRowData).draw().index();

  // Store additional data using row().data() for easy access
  if (startX !== null && startY !== null) {
    table.row(rowIndex).data().dotx = (startX + PITCH_W / 2) / PITCH_W;  // (x + 20) / 40
    table.row(rowIndex).data().doty = (PITCH_H / 2 - startY) / PITCH_H;  // (10 - y) / 20
  }

  if (wasDragged && endX !== null && endY !== null) {
    table.row(rowIndex).data().dotx2 = (endX + PITCH_W / 2) / PITCH_W;
    table.row(rowIndex).data().doty2 = (PITCH_H / 2 - endY) / PITCH_H;
  }

  // Assign mouseenter and mouseleave events to show and remove dots
  $(table.row(rowIndex).node())
    .on("mouseenter", function () {
      showDot(this);
    })
    .on("mouseleave", function () {
      removeDot();
    });

  // Manually trigger the mouseenter event to show the dot for the new row
  $(table.row(rowIndex).node()).mouseenter();

  // Update any additional data or UI elements as needed
  shotsData.push({
    time: time,
    player: playerJerseyNumber,
    playerName: currentPlayerName,
    grip: currentGrip || "N/A",
    outcome: currentOutcome || "N/A",
    action: actionType,
    x: startX,
    y: startY,
    x2: wasDragged ? endX : "N/A",
    y2: wasDragged ? endY : "N/A",
  });
  sessionStorage.setItem("badmintonShotsData", JSON.stringify(shotsData));
}

function removeShot(deleteButton) {
  // Retrieve the DataTables row for the delete button
  var row = $(deleteButton).closest("tr");
  var rowIndex = table.row(row).index();
  console.log("row: " + row);
  console.log("rowIndex: " + rowIndex);

  // Remove the shot from the shotsData array if storing shot data separately
  if (shotsData && rowIndex !== undefined) {
    shotsData.splice(rowIndex, 1);
    sessionStorage.setItem("badmintonShotsData", JSON.stringify(shotsData));
    console.log(shotsData);
  }

  if (rawShots && rowIndex !== undefined) {
    rawShots.splice(rowIndex, 1);
    sessionStorage.setItem("badmintonRawShots", JSON.stringify(rawShots));
    console.log("Updated rawShots: ", rawShots);
  }
  // Remove the row from the DataTable
  removeDot();
  // Assuming the table structure is consistent with the addShot function
  // If shotsData is not used to track each shot, you might need to retrieve values directly from the row before it's removed
  var rowData = table.row(row).data();
  var eventContent = rowData[2]; // Assuming the 3rd column is the event type
  var xGContent = rowData[7]; // Assuming the 8th column is xG
  var xSaveContent = rowData[8]; // Assuming the 9th column is xSave
  console.log("eventcontent ", eventContent);
  console.log("xgcontent ", xGContent);
  console.log("xsave ", xSaveContent);
  table.row(row).remove().draw();
}

function showDot(rowNode) {
  removeDot();

  // Access row data using DataTables API
  var rowData = table.row(rowNode).data();

  var xPercent = parseFloat(rowData.dotx);
  var yPercent = parseFloat(rowData.doty);

  var x1 = xPercent * pitch.offsetWidth;
  var y1 = yPercent * pitch.offsetHeight;

  console.log("showdot x1 ", x1);
  console.log("showdot y1 ", y1);
  createDot(x1, y1, "hover-dot-1");

  if (rowData.dotx2 && rowData.doty2) {
    var x2Percent = parseFloat(rowData.dotx2);
    var y2Percent = parseFloat(rowData.doty2);
    var x2 = x2Percent * pitch.offsetWidth;
    var y2 = y2Percent * pitch.offsetHeight;
    createDot(x2, y2, "hover-dot-2");
    createArrow(x1, y1, x2, y2, "hover-arrow");
  }
}

function createDot(x, y, id) {
  var pitch = document.getElementById("pitch");
  var dot = document.createElement("div");
  dot.id = id;
  dot.className = "dot";
  dot.style.left = `${x}px`;
  dot.style.top = `${y}px`;
  pitch.appendChild(dot);
}

function removeDot() {
  // Modify to remove both dots
  var existingDot1 = document.getElementById("hover-dot-1");
  var existingDot2 = document.getElementById("hover-dot-2");
  var existingArrow = document.getElementById("hover-arrow");
  if (existingDot1) {
    existingDot1.parentNode.removeChild(existingDot1);
  }
  if (existingDot2) {
    existingDot2.parentNode.removeChild(existingDot2);
  }
  if (existingArrow) {
    existingArrow.parentNode.removeChild(existingArrow);
  }
}

function createArrow(x1, y1, x2, y2, id) {
  var minX = Math.min(x1, x2);
  var minY = Math.min(y1, y2);
  var width = Math.abs(x2 - x1);
  var height = Math.abs(y2 - y1);

  // Create an SVG element for the arrow
  var svgns = "http://www.w3.org/2000/svg";
  var svg = document.createElementNS(svgns, "svg");
  // Adjust the width and height to include the markers
  svg.setAttribute("height", height + 20); // Add some padding for the marker
  svg.setAttribute("width", width + 20);
  // Position the SVG absolutely within the pitch
  svg.style.position = "absolute";
  svg.style.left = `${minX - 10}px`; // Shift to the left to account for marker
  svg.style.top = `${minY - 10}px`; // Shift up to account for marker
  svg.setAttribute("id", id);
  svg.setAttribute("class", "arrow");
  // Define the arrow marker
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
  let arrowheadLength = 22;
  // Calculate the adjustment based on the angle
  var adjustX = arrowheadLength * Math.cos(angle);
  var adjustY = arrowheadLength * Math.sin(angle);

  // Adjust the line's end point
  x2 = x2 - adjustX;
  y2 = y2 - adjustY;

  // Create the line for the arrow
  var line = document.createElementNS(svgns, "line");
  line.setAttribute("x1", x1 - minX + 10);
  line.setAttribute("y1", y1 - minY + 10);
  line.setAttribute("x2", x2 - minX + 10);
  line.setAttribute("y2", y2 - minY + 10);
  line.setAttribute("stroke", "white");
  line.setAttribute("stroke-width", "2");
  line.setAttribute("marker-end", "url(#markerArrow)");
  svg.appendChild(line);
  // Append the SVG to the pitch
  var pitch = document.getElementById("pitch");
  pitch.appendChild(svg);
}

function downloadCSV() {
  console.log("Downloading CSV...");
  fetch("/badminton/download_csv", {
    method: "POST",
    body: JSON.stringify(shotsData),
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.blob())
    .then((blob) => {
      const csvUrl = window.URL.createObjectURL(blob);
      const csvLink = document.createElement("a");
      csvLink.href = csvUrl;
      csvLink.download = "shots_data.csv";
      document.body.appendChild(csvLink);
      csvLink.click();
      csvLink.remove();
    })
    .catch((error) => console.error("Error downloading CSV:", error));
}

function downloadPDF() {
  console.log("Downloading PDF...");
  fetch("/badminton/download_pdf", {
    method: "POST",
    body: JSON.stringify(shotsData),
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.blob())
    .then((blob) => {
      const pdfUrl = window.URL.createObjectURL(blob);
      const pdfLink = document.createElement("a");
      pdfLink.href = pdfUrl;
      pdfLink.download = "report.pdf";
      document.body.appendChild(pdfLink);
      pdfLink.click();
      pdfLink.remove();
    })
    .catch((error) => console.error("Error downloading PDF:", error));
}

// Keyboard Shortcuts
document.addEventListener("keydown", function (event) {
  const activeModal = document.querySelector(".modal.show");
  if (activeModal) {
    // A modal is visible, do nothing
    return;
  }
  // Player Selection
  const playerButtons = document.querySelectorAll(".player-button");
  const eventButtons = document.querySelectorAll(".event-button");
  
  const homePlayerKeyMap = {
    '1': 0,
    '2': 1,
  }

  const awayPlayerKeyMap = {
    '3': 0,
    '4': 1,
  }

  // Check if the pressed key is in our map
  if (homePlayerKeyMap.hasOwnProperty(event.key.toUpperCase())) {
    // Get the index from the map
    let index = homePlayerKeyMap[event.key.toUpperCase().toString()];
    let button = document.getElementById(`homePlayerButton${index+1}`);
    button.click();
  }
  else if (awayPlayerKeyMap.hasOwnProperty(event.key.toUpperCase())) {
    console.log(event.key.toUpperCase);
    console.log("is being triggered in away key map");
    // Get the index from the map
    let index = awayPlayerKeyMap[event.key.toUpperCase()];
    let button = document.getElementById(`awayPlayerButton${index+1}`);
    button.click();
  }

  // Grip Shortcuts: G for Forehand, H for Backhand
  const gripKeyMap = {
    G: "Forehand",
    H: "Backhand"
  };

  // Outcome Shortcuts: W - Winner, U - Unforced, F - Forced, R - Rally
  const outcomeKeyMap = {
    W: "Winner",
    U: "Unforced Error",
    F: "Forced Error",
    R: "Rally"
  };


  if (eventKeyMap.hasOwnProperty(event.key.toUpperCase())) {
    // Get the index from the map
    const index = eventKeyMap[event.key.toUpperCase()];
    if (index < eventButtons.length) {
      // If the calculated button exists, simulate a click on it
      eventButtons[index].click();
    }
  }
  // Grip Selection
  if (gripKeyMap.hasOwnProperty(event.key.toUpperCase())) {
    console.log("key is being pressed!!!");
    const grip = gripKeyMap[event.key.toUpperCase()];
    console.log(grip);
    setGrip(grip);  // Directly call the function
    return;
  } 

  // Outcome Selection
  if (outcomeKeyMap.hasOwnProperty(event.key.toUpperCase())) {
    const outcome = outcomeKeyMap[event.key.toUpperCase()];
    setOutcome(outcome);
    return;
  }

  // Enter key to add event without coordinates
  if (event.key === 'Enter') {
    if (currentActionType !== "" && currentPlayer !== "" && currentGrip !== "" && currentOutcome !== "") {
      var currentTime = getCurrentTime();
      addShot(
        currentActionType,
        null,
        null,
        null,
        null,
        currentTime,
        currentPlayer
      );
      rawShots.push({
        event: currentActionType,
        startX: null,
        startY: null,
        endX: null,
        endY: null,
        time: currentTime,
        player: currentPlayer,
      });
      sessionStorage.setItem("badmintonRawShots", JSON.stringify(rawShots));
      
      // Clear selections
      currentActionType = "";
      currentPlayer = "";
      currentPlayerName = "";
      currentGrip = "";
      currentOutcome = "";
      document.querySelectorAll(".event-button").forEach(btn => btn.classList.remove("active"));
      document.querySelectorAll(".player-button").forEach(btn => btn.classList.remove("active"));
      ["forehand", "backhand"].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.classList.remove("active");
      });
      ["winner", "unforcederror", "forcederror", "rally"].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.classList.remove("active");
      });
    }
  }

  // Backspace key to remove the most recent entry
  if (event.key === 'Backspace') {
    event.preventDefault(); // Prevent browser back navigation
    
    // Get the last visible row in the table (handles filtering correctly)
    var visibleRows = table.rows({search: 'applied'});
    var visibleCount = visibleRows.count();
    if (visibleCount > 0) {
      var lastVisibleRow = visibleRows.nodes()[visibleCount - 1];
      var rowIndex = table.row(lastVisibleRow).index();
      var lastRow = table.row(lastVisibleRow);
      
      // Remove from shotsData
      if (shotsData && shotsData.length > 0) {
        shotsData.splice(rowIndex, 1);
        sessionStorage.setItem("badmintonShotsData", JSON.stringify(shotsData));
      }
      
      // Remove from rawShots
      if (rawShots && rawShots.length > 0) {
        rawShots.splice(rowIndex, 1);
        sessionStorage.setItem("badmintonRawShots", JSON.stringify(rawShots));
      }
      
      // Remove the row from DataTable
      removeDot();
      lastRow.remove().draw();
    }
  }

  // Zoom shortcuts
  if (event.key === '+' || event.key === '=') {
    event.preventDefault();
    zoomIn();
  }
  if (event.key === '-' || event.key === '_') {
    event.preventDefault();
    zoomOut();
  }

});

//Timer Code
let timerInterval;
let elapsedTime = 0; // Time in milliseconds
let isRunning = false;

function startTimer() {
  if (!isRunning) {
    isRunning = true;
    const startTime = Date.now() - elapsedTime;

    timerInterval = setInterval(() => {
      elapsedTime = Date.now() - startTime;
      updateDisplay();
    }, 1000);
  }
}

function pauseTimer() {
  if (isRunning) {
    clearInterval(timerInterval);
    isRunning = false;
  }
}

function stopTimer() {
  clearInterval(timerInterval);
  isRunning = false;
  elapsedTime = 0;
  updateDisplay();
}

function updateDisplay() {
  const totalSeconds = Math.floor(elapsedTime / 1000);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(
    2,
    "0"
  );
  const seconds = String(totalSeconds % 60).padStart(2, "0");

  document.getElementById(
    "timerDisplay"
  ).textContent = `${hours}:${minutes}:${seconds}`;
}

//Event name customization
function ensureCurrentActionTypeIsValid() {
  if (!eventNames.includes(currentActionType)) {
    currentActionType = "";
  }
}

// Initialize default event names for badminton
let defaultEventNames = [
  "Serve-High", "Serve-Low",
  "Smash", "Drop Shot", "Clear-High", "Drive",
  "Net Shot", "Lift", "Kill", "Block"
];

// Load event names from sessionStorage if available
function initializeEventNames() {
  let storedEventNames = sessionStorage.getItem('badmintonEventNames');
  if (storedEventNames) {
    try {
      const parsed = JSON.parse(storedEventNames);
      if (Array.isArray(parsed) && parsed.length > 0) {
        eventNames = parsed;
      } else {
        eventNames = [...defaultEventNames];
      }
    } catch (error) {
      console.error("Failed to parse stored event names", error);
      eventNames = [...defaultEventNames];
    }
  } else {
    eventNames = [...defaultEventNames];
  }
  displayEventNames();
}

// Display event names on buttons
function displayEventNames() {
  const eventButtonsGrid = document.getElementById("eventButtonsGrid");
  if (!eventButtonsGrid) {
    return;
  }

  eventButtonsGrid.innerHTML = "";
  ensureCurrentActionTypeIsValid();

  const createdButtons = [];

  for (let i = 0; i < eventNames.length; i++) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn-outline-primary btn-small event-button";

    const shortcut = i < eventShortcutKeys.length ? ` (${eventShortcutKeys[i]})` : "";
    button.innerHTML = `${eventNames[i]}${shortcut}`;

    button.addEventListener("click", function () {
      setActionType.call(this, i);
    });

    if (currentActionType === eventNames[i]) {
      button.classList.add("active");
    }

    eventButtonsGrid.appendChild(button);
    createdButtons.push(button);
  }

  if (createdButtons.length % 2 === 1 && createdButtons.length > 0) {
    createdButtons[createdButtons.length - 1].classList.add("span-two");
  }
}

// Save event names from modal into sessionStorage
function saveEventNames() {
  const textarea = document.getElementById('eventNamesTextarea');
  let eventLines = textarea.value
    .split('\n')
    .map(name => name.trim())
    .filter(name => name.length > 0);

  if (eventLines.length === 0) {
    eventNames = [...defaultEventNames];
  } else {
    eventNames = eventLines;
  }

  sessionStorage.setItem('badmintonEventNames', JSON.stringify(eventNames));
  
  // Update buttons with new event names
  displayEventNames();
  
  // Close the modal
  $('#editEventNamesModal').modal('hide');
}

// Load saved event names into the textarea
function loadEventNamesToTextarea() {
  const textarea = document.getElementById('eventNamesTextarea');
  const namesToLoad = (eventNames.length > 0 ? eventNames : defaultEventNames);
  textarea.value = namesToLoad.join('\n');
}

// Call this function when the modal opens to populate the textarea
document.getElementById('editEventNamesModal').addEventListener('show.bs.modal', loadEventNamesToTextarea);
// Initialize event names on page load
initializeEventNames();

function initKeyboardShortcutToast() {
  const toastElement = document.getElementById("keyboardShortcutToast");
  if (!toastElement) {
    return;
  }

  if (localStorage.getItem(keyboardShortcutToastKey) === "true") {
    return;
  }

  const toast = bootstrap.Toast.getOrCreateInstance(toastElement, { autohide: false });
  toast.show();

  toastElement.addEventListener(
    "hidden.bs.toast",
    function () {
      localStorage.setItem(keyboardShortcutToastKey, "true");
    },
    { once: true }
  );
}

