// Court configuration object with dimensions for each court type
const courtConfig = {
  nba: { width: 28.6512, height: 15.24, name: "NBA" },
  wnba: { width: 28.6512, height: 15.24, name: "WNBA" },
  ncaa: { width: 28.6512, height: 15.24, name: "NCAA" },
  fiba: { width: 28.0, height: 15.0, name: "FIBA" }
};

// Current court type (default to NBA)
let currentCourtType = 'nba';

// Get current court dimensions
function getCurrentCourtDimensions() {
  return courtConfig[currentCourtType];
}

// Function to change court type
function changeCourtType() {
  const select = document.getElementById('courtTypeSelect');
  const newCourtType = select.value;
  
  if (newCourtType !== currentCourtType) {
    currentCourtType = newCourtType;
    
    // Update court image
    const courtImage = document.getElementById('courtImage');
    courtImage.src = `/basketball/static/court-${currentCourtType}.png`;
    
    // Save court type to sessionStorage
    sessionStorage.setItem('basketballCourtType', currentCourtType);
    
    console.log(`Court type changed to: ${courtConfig[currentCourtType].name}`);
  }
}

// Load court type from sessionStorage on page load
function loadCourtType() {
  const savedCourtType = sessionStorage.getItem('basketballCourtType');
  if (savedCourtType && courtConfig[savedCourtType]) {
    currentCourtType = savedCourtType;
    const select = document.getElementById('courtTypeSelect');
    if (select) {
      select.value = currentCourtType;
    }
    // Update the court image to match the saved court type
    const courtImage = document.getElementById('courtImage');
    if (courtImage) {
      courtImage.src = `/basketball/static/court-${currentCourtType}.png`;
    }
  }
}
// Create an object to store jersey numbers and player names
// Create objects to store jersey numbers and player names for both teams
let homePlayerMap = {};
let awayPlayerMap = {};

// Map of keyboard shortcuts based on player index
let homeShortcutMap = {
  1: "(1)",
  2: "(2)",
  3: "(3)",
  4: "(4)",
  5: "(5)",
  6: "(6)",
  7: "(7)",
  8: "(8)",
  9: "(9)",
  10: "(0)",
  11: "(-)",
  12: "(=)",
  13: "(Q)",
  14: "(W)",
};

let awayShortcutMap = {
  1: "(E)",
  2: "(R)",
  3: "(T)",
  4: "(Y)",
  5: "(U)",
  6: "(I)",
  7: "(O)",
  8: "(P)",
  9: "(A)",
  10: "(S)",
  11: "(D)",
  12: "(F)",
  13: "(G)",
  14: "(H)",
};

// Initialize playerMap with default values for 14 players for both teams
function initializePlayerMaps() {
  // Check if player maps are already in sessionStorage
  const storedHomePlayerMap = sessionStorage.getItem('basketballHomePlayerMap');
  const storedAwayPlayerMap = sessionStorage.getItem('basketballAwayPlayerMap');

  // Load from sessionStorage if available, else initialize with default values
  if (storedHomePlayerMap) {
    homePlayerMap = JSON.parse(storedHomePlayerMap);
    console.log("stored home map:");
    console.log(homePlayerMap);
  } else {
    homePlayerMap = {};
  }

  for (let i = 1; i <= 14; i++) {
    if (!homePlayerMap[i]) {
      homePlayerMap[i] = {
        jersey: `A${i.toString().padStart(2, "0")}`,
        name: `HomePlayer${i}`,
      };
    }
    let button = document.getElementById(`homePlayerButton${i}`);
    if (button) {
      let jerseyNumber = homePlayerMap[i].jersey;
      let shortcut = homeShortcutMap[i]; // Get the shortcut based on the player's index
      button.innerHTML = `${jerseyNumber} ${shortcut || ""}`;
    }
  }
  sessionStorage.setItem('basketballHomePlayerMap', JSON.stringify(homePlayerMap));

  if (storedAwayPlayerMap) {
    awayPlayerMap = JSON.parse(storedAwayPlayerMap);
    console.log("stored away map:");
    console.log(awayPlayerMap);
  } else {
    awayPlayerMap = {};
  }

  for (let i = 1; i <= 14; i++) {
    if (!awayPlayerMap[i]) {
      awayPlayerMap[i] = {
        jersey: `B${i.toString().padStart(2, "0")}`,
        name: `AwayPlayer${i}`,
      };
    }
    let button = document.getElementById(`awayPlayerButton${i}`);
    if (button) {
      let jerseyNumber = awayPlayerMap[i].jersey;
      let shortcut = awayShortcutMap[i]; // Get the shortcut based on the player's index
      button.innerHTML = `${jerseyNumber} ${shortcut || ""}`;
    }
  }
  sessionStorage.setItem('basketballAwayPlayerMap', JSON.stringify(awayPlayerMap));
}

// Call initializePlayerMap when the script loads
initializePlayerMaps();

// Function to update player names and jersey numbers from the input fields in the modal
function updatePlayerNames(team) {
  const playerMap = team === "home" ? homePlayerMap : awayPlayerMap;
  const shortcutMap = team === "home" ? homeShortcutMap : awayShortcutMap;
  const prefix = team === "home" ? "home" : "away"; // No prefix for home, "away" for away team

  for (let i = 1; i <= 14; i++) {
    let jerseyInput = document.getElementById(`${prefix}Jersey${i}`); // Use "awayJersey1" for away team
    let playerInput = document.getElementById(`${prefix}Player${i}`); // Use "awayPlayer1" for away team
    if (jerseyInput && playerInput) {
      playerMap[i] = {
        jersey: jerseyInput.value || `P${i.toString().padStart(2, "0")}`, // Default to 'P01', 'P02', etc.
        name: playerInput.value || `Player${i}`, // Default to 'PlayerX'
      };
    }
  }

  for (let i = 1; i <= 14; i++) {
    let button = document.getElementById(`${prefix}PlayerButton${i}`);
    if (button) {
      let jerseyNumber = playerMap[i].jersey;
      let shortcut = shortcutMap[i]; // Get the shortcut based on the player's index
      button.innerHTML = `${jerseyNumber} ${shortcut || ""}`;
    }
  }
  // Persist changes to sessionStorage
  if (team === "home") {
    sessionStorage.setItem('basketballHomePlayerMap', JSON.stringify(homePlayerMap));
  } else {
    sessionStorage.setItem('basketballAwayPlayerMap', JSON.stringify(awayPlayerMap));
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
var cumulativeData = {
  fieldGoals: 0,
  assists: 0,
  rebounds: 0,
  steals: 0,
  blocks: 0,
};
if (sessionStorage.getItem("basketballRawShots")) {
  var rawShots = JSON.parse(sessionStorage.getItem("basketballRawShots"));
  var shotsData = [];
} else {
  var shotsData = [];
  var rawShots = [];
  const court = document.getElementById("court");
}
let isDragging = false;
let startX = null;
let startY = null;
let endX = null;
let endY = null;

var table;
const keyboardShortcutToastKey = "basketballKeyboardShortcutToastDismissed";

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
  console.log("basketballRawShots");
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
  table.on("draw", function () {
    updateCumulativeValues();
  });
  updateCumulativeValues();
  initKeyboardShortcutToast();
});

function updateCumulativeValues() {
  var filteredData = table.rows({ search: "applied" }).data();
  console.log("filteredData");
  console.log(filteredData[0]);
  // Initialize your cumulative values
  var totalGoals = 0;
  var totalSaves = 0;
  var totalFieldGoals = 0;
  var totalAssists = 0;
  var totalRebounds = 0;
  var totalSteals = 0;
  var totalBlocks = 0;

  // Calculate cumulative values
  filteredData.each(function (value, index) {
    // Update the counts based on your data structure and what constitutes a field goal, assist, etc.
    if (value[2].includes("Field Goal")) {
      totalFieldGoals++;
      if (value[2] == "Field Goal") {
        totalGoals++;
      } else if (value[2] == "Field Goal - Miss") {
        totalSaves++;
      }
    } else if (value[2] == "Assist") {
      totalAssists++;
    } else if (value[2] == "Rebound") {
      totalRebounds++;
    } else if (value[2] == "Steal") {
      totalSteals++;
    } else if (value[2] == "Block") {
      totalBlocks++;
    }
  });

  // Update the cumulative table
  $("#cumulative-goals").text(totalGoals);
  $("#cumulative-saves").text(totalSaves);
  $("#cumulative-field-goals").text(totalFieldGoals);
  $("#cumulative-assists").text(totalAssists);
  $("#cumulative-rebounds").text(totalRebounds);
  $("#cumulative-steals").text(totalSteals);
  $("#cumulative-blocks").text(totalBlocks);
}

console.log("table");
console.log(table);

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

  for (let i = 1; i <= 14; i++) {
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

court.addEventListener("mousedown", function (event) {
  if (startX === null || startY === null) {
    isDragging = true;
    let rect = court.getBoundingClientRect();
    const dimensions = getCurrentCourtDimensions();
    
    // Calculate coordinates based on the rendered court dimensions
    const adjustedX = event.clientX - rect.left;
    const adjustedY = event.clientY - rect.top;
    
    // RHCS: Calculate coordinates from bottom-left origin
    startX = (adjustedX / court.offsetWidth) * dimensions.width;
    startY = ((court.offsetHeight - adjustedY) / court.offsetHeight) * dimensions.height;
    startX = Math.round(startX);
    startY = Math.round(startY);
  }
});

court.addEventListener("mousemove", function (event) {
  if (isDragging) {
    let rect = court.getBoundingClientRect();
    const dimensions = getCurrentCourtDimensions();
    
    // Calculate coordinates based on the rendered court dimensions
    const adjustedX = event.clientX - rect.left;
    const adjustedY = event.clientY - rect.top;
    
    // RHCS: Calculate coordinates from bottom-left origin
    endX = (adjustedX / court.offsetWidth) * dimensions.width;
    endY = ((court.offsetHeight - adjustedY) / court.offsetHeight) * dimensions.height;
    endX = Math.round(endX);
    endY = Math.round(endY);
  }
});

// Remove existing mouse and touch event listeners

// Add pointer event listeners
court.addEventListener("pointerdown", function (event) {
  event.preventDefault(); // Prevent default touch behavior
  
  if (startX === null || startY === null) {
    isDragging = true;
    let rect = court.getBoundingClientRect();
    const dimensions = getCurrentCourtDimensions();
    
    // Calculate coordinates based on the rendered court dimensions
    const adjustedX = event.clientX - rect.left;
    const adjustedY = event.clientY - rect.top;
    
    // RHCS: Calculate coordinates from bottom-left origin
    startX = (adjustedX / court.offsetWidth) * dimensions.width;
    startY = ((court.offsetHeight - adjustedY) / court.offsetHeight) * dimensions.height;
    startX = Math.round(startX);
    startY = Math.round(startY);
  }
});

court.addEventListener("pointermove", function (event) {
  event.preventDefault(); // Prevent default touch behavior
  
  if (isDragging) {
    let rect = court.getBoundingClientRect();
    const dimensions = getCurrentCourtDimensions();
    
    // Calculate coordinates based on the rendered court dimensions
    const adjustedX = event.clientX - rect.left;
    const adjustedY = event.clientY - rect.top;
    
    // RHCS: Calculate coordinates from bottom-left origin
    endX = (adjustedX / court.offsetWidth) * dimensions.width;
    endY = ((court.offsetHeight - adjustedY) / court.offsetHeight) * dimensions.height;
    endX = Math.round(endX);
    endY = Math.round(endY);
  }
});

court.addEventListener("pointerup", function (event) {
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
    sessionStorage.setItem("basketballRawShots", JSON.stringify(rawShots));
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
  
  if (currentPlayer == "") {
    var playerJerseyNumber = "";
  } else {
    var playerJerseyNumber = currentPlayer;
  }

  var newRowData = [
    time,
    playerJerseyNumber,
    actionType,
    startX,
    startY,
    wasDragged ? endX : "N/A",
    wasDragged ? endY : "N/A",
    "<button class='btn btn-outline-danger remove-button' onclick='removeShot(this)'>X</button>",
  ];

  // Add new row data with DataTables API
  var rowIndex = table.row.add(newRowData).draw().index();

  // Store additional data using row().data() for easy access
  const dimensions = getCurrentCourtDimensions();
  table.row(rowIndex).data().dotx = (startX * 1.0) / dimensions.width;
  table.row(rowIndex).data().doty = (startY * 1.0) / dimensions.height;
  if (wasDragged) {
    table.row(rowIndex).data().dotx2 = (endX * 1.0) / dimensions.width;
    table.row(rowIndex).data().doty2 = (endY * 1.0) / dimensions.height;
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
    action: actionType,
    x: startX,
    y: startY,
    x2: wasDragged ? endX : "N/A",
    y2: wasDragged ? endY : "N/A",
    courtType: currentCourtType
  });
  sessionStorage.setItem("basketballShotsData", JSON.stringify(shotsData));
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
    sessionStorage.setItem("basketballShotsData", JSON.stringify(shotsData));
    console.log(shotsData);
  }

  if (rawShots && rowIndex !== undefined) {
    rawShots.splice(rowIndex, 1);
    sessionStorage.setItem("basketballRawShots", JSON.stringify(rawShots));
    console.log("Updated rawShots: ", rawShots);
  }
  // Remove the row from the DataTable
  removeDot();
  // Assuming the table structure is consistent with the addShot function
  // If shotsData is not used to track each shot, you might need to retrieve values directly from the row before it's removed
  var rowData = table.row(row).data();
  var eventContent = rowData[2]; // Assuming the 3rd column is the event type
  console.log("eventcontent ", eventContent);
  table.row(row).remove().draw();
}

function showDot(rowNode) {
  removeDot();

  // Access row data using DataTables API
  var rowData = table.row(rowNode).data();

  var xPercent = parseFloat(rowData.dotx);
  var yPercent = parseFloat(rowData.doty);

  // Calculate positions relative to the rendered court
  var x1 = xPercent * court.offsetWidth;
  var y1 = (1 - yPercent) * court.offsetHeight;

  console.log("showdot x1 ", x1);
  console.log("showdot y1 ", y1);
  createDot(x1, y1, "hover-dot-1");

  if (rowData.dotx2 && rowData.doty2) {
    var x2Percent = parseFloat(rowData.dotx2);
    var y2Percent = parseFloat(rowData.doty2);
    var x2 = x2Percent * court.offsetWidth;
    var y2 = (1 - y2Percent) * court.offsetHeight;
    createDot(x2, y2, "hover-dot-2");
    createArrow(x1, y1, x2, y2, "hover-arrow");
  }
}

function createDot(x, y, id) {
  var court = document.getElementById("court");
  var dot = document.createElement("div");
  dot.id = id;
  dot.className = "dot";
  dot.style.left = `${x}px`;
  dot.style.top = `${y}px`;
  court.appendChild(dot);
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
  // Position the SVG absolutely within the court
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
  // Append the SVG to the court
  court.appendChild(svg);
}

// xG-related functions removed as xG is not supported for basketball

function downloadCSV() {
  fetch("/basketball/download_csv", {
    method: "POST",
    body: JSON.stringify(shotsData),
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.blob())
    .then((blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "shots_data.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    })
    .catch((error) => console.error("Error downloading CSV:", error));
}

function downloadPDF() {
  fetch("/basketball/download_pdf", {
    method: "POST",
    body: JSON.stringify(shotsData),
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.blob())
    .then((blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "report.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
    '3': 2,
    '4': 3,
    '5': 4,
    '6': 5,
    '7': 6,
    '8': 7,
    '9': 8,
    '0': 9,
    '-': 10,
    '=': 11,
    'Q': 12,
    'W': 13,
  }

  const awayPlayerKeyMap = {
    'E': 0,
    'R': 1,
    'T': 2,
    'Y': 3,
    'U': 4,
    'I': 5,
    'O': 6,
    'P': 7,
    'A': 8,
    'S': 9,
    'D': 10,
    'F': 11,
    'G': 12,
    'H': 13,
  }

  // Check if the pressed key is in our map
  if (homePlayerKeyMap.hasOwnProperty(event.key.toUpperCase())) {
    // Get the index from the map (0-based) and convert to 1-based button id
    let index = homePlayerKeyMap[event.key.toUpperCase().toString()];
    let button = document.getElementById(`homePlayerButton${index + 1}`);
    if (button) button.click();
  }
  if (awayPlayerKeyMap.hasOwnProperty(event.key.toUpperCase())) {
    // Get the index from the map (0-based) and convert to 1-based button id
    let index = awayPlayerKeyMap[event.key.toUpperCase()];
    let button = document.getElementById(`awayPlayerButton${index + 1}`);
    if (button) button.click();
  }

  const normalizedKey = event.key.toUpperCase();
  if (eventKeyMap.hasOwnProperty(normalizedKey)) {
    const index = eventKeyMap[normalizedKey];
    if (index < eventButtons.length) {
      eventButtons[index].click();
    }
  }

  // Enter key to add event without coordinates
  if (event.key === 'Enter') {
    if (currentActionType !== "" && currentPlayer !== "") {
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
      sessionStorage.setItem("basketballRawShots", JSON.stringify(rawShots));
      
      // Clear selections
      currentActionType = "";
      currentPlayer = "";
      currentPlayerName = "";
      document.querySelectorAll(".event-button").forEach(btn => btn.classList.remove("active"));
      document.querySelectorAll(".player-button").forEach(btn => btn.classList.remove("active"));
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
        sessionStorage.setItem("basketballShotsData", JSON.stringify(shotsData));
      }
      
      // Remove from rawShots
      if (rawShots && rawShots.length > 0) {
        rawShots.splice(rowIndex, 1);
        sessionStorage.setItem("basketballRawShots", JSON.stringify(rawShots));
      }
      
      // Remove the row from DataTable
      removeDot();
      lastRow.remove().draw();
    }
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
const eventShortcutKeys = ['Z', 'X', 'C', 'V', 'B', '<', 'N', 'M', ',', '.', '?', '>'];
const eventKeyMap = eventShortcutKeys.reduce((map, key, index) => {
  map[key.toUpperCase()] = index;
  return map;
}, {});

let defaultEventNames = [
  "Field Goal", "Field Goal - Miss", "Three Pointer", "Assist",
  "Dribble", "Rebound", "Pass", "Steal",
  "Block", "Foul", "Free Throw", "Turnover"
];

let eventNames = [];

function ensureCurrentActionTypeIsValid() {
  if (!eventNames.includes(currentActionType)) {
    currentActionType = "";
  }
}

// Load event names from sessionStorage if available
function initializeEventNames() {
  let storedEventNames = sessionStorage.getItem('basketballEventNames');
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

  if (createdButtons.length % 2 === 1) {
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

  sessionStorage.setItem('basketballEventNames', JSON.stringify(eventNames));
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

// Load court type on page load
loadCourtType();

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

