let zoomLevel = 1;

function zoomIn() {
  zoomLevel += 0.1;
  const pitch = document.getElementById("pitch");
  pitch.style.transformOrigin = "0 0";
  pitch.style.transform = `scale(${zoomLevel})`;
}

function zoomOut() {
  if (zoomLevel > 0.5) {
    // Prevents excessive zoom out
    zoomLevel -= 0.1;
    const pitch = document.getElementById("pitch");
    pitch.style.transformOrigin = "0 0";
    pitch.style.transform = `scale(${zoomLevel})`;
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
  11: "(Q)",
  12: "(W)",
  13: "(E)",
  14: "(R)",
  15: "(T)",
  16: "(Y)",
};

let awayShortcutMap = {
  1: "(U)",
  2: "(I)",
  3: "(O)",
  4: "(P)",
  5: "([)",
  6: "(])",
  7: "(A)",
  8: "(S)",
  9: "(D)",
  10: "(F)",
  11: "(G)",
  12: "(H)",
  13: "(J)",
  14: "(K)",
  15: "(L)",
  16: "(;)",
};

// Initialize playerMap with default values for 16 players for both teams
function initializePlayerMaps() {
  // Check if player maps are already in sessionStorage
  const storedHomePlayerMap = sessionStorage.getItem('homePlayerMap');
  const storedAwayPlayerMap = sessionStorage.getItem('awayPlayerMap');

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
    sessionStorage.setItem('homePlayerMap', JSON.stringify(homePlayerMap));
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
    sessionStorage.setItem('awayPlayerMap', JSON.stringify(awayPlayerMap));
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
    sessionStorage.setItem("homePlayerMap", JSON.stringify(homePlayerMap));
  } else {
    sessionStorage.setItem("awayPlayerMap", JSON.stringify(awayPlayerMap));
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
  xG: 0,
  xSave: 0,
  shots: 0,
  passes: 0,
  corners: 0,
  freeKicks: 0,
  tackles: 0,
};
if (sessionStorage.getItem("rawShots")) {
  var rawShots = JSON.parse(sessionStorage.getItem("rawShots"));
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
  console.log("rawShots");
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
});

function updateCumulativeValues() {
  var filteredData = table.rows({ search: "applied" }).data();
  console.log("filteredData");
  console.log(filteredData[0]);
  // Initialize your cumulative values
  var totalXG = 0;
  var totalGoals = 0;
  var totalXSave = 0;
  var totalSaves = 0;
  var totalShots = 0;
  var totalFreeKicks = 0;
  var totalPasses = 0;
  var totalCorners = 0;
  var totalTackles = 0;

  // Calculate cumulative values
  filteredData.each(function (value, index) {
    totalXG += parseFloat(value[7]) || 0;
    totalXSave += parseFloat(value[8]) || 0;
    // Update the counts based on your data structure and what constitutes a shot, free kick, etc.
    if (value[2].includes("Shot")) {
      totalShots++;
      if (value[2] == "Shot - Goal") {
        totalGoals++;
      } else if (value[2] == "Shot - Save") {
        totalSaves++;
      }
    } else if (value[2] == "Free Kick") {
      totalFreeKicks++;
    } else if (value[2] == "Pass") {
      totalPasses++;
    } else if (value[2] == "Corner") {
      totalCorners++;
    } else if (value[2] == "Tackle") {
      totalTackles++;
    }
  });

  // Update the cumulative table
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

console.log("table");
console.log(table);

function setActionType(index) {
  if (currentActionType == eventNames[index]) {
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
  currentActionType = eventNames[index];

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
    // startX = ((event.clientX - rect.left) / pitch.offsetWidth) * 105;
    // startY = ((event.clientY - rect.top) / pitch.offsetHeight) * 68;
    startX =
      (((event.clientX - rect.left) / pitch.offsetWidth) * 105) / zoomLevel;
    startY =
      (((event.clientY - rect.top) / pitch.offsetHeight) * 68) / zoomLevel;
    startX = Math.round(startX);
    startY = Math.round(startY);
  }
});

pitch.addEventListener("mousemove", function (event) {
  if (isDragging) {
    let rect = pitch.getBoundingClientRect();
    // endX = ((event.clientX - rect.left) / pitch.offsetWidth) * 105;
    // endY = ((event.clientY - rect.top) / pitch.offsetHeight) * 68;
    endX =
      (((event.clientX - rect.left) / pitch.offsetWidth) * 105) / zoomLevel;
    endY = (((event.clientY - rect.top) / pitch.offsetHeight) * 68) / zoomLevel;
    endX = Math.round(endX);
    endY = Math.round(endY);
  }
});

pitch.addEventListener("mouseup", function (event) {
  if (isDragging) {
    isDragging = false;
    var currentTime = getCurrentTime();
    addShot(currentActionType, startX, startY, endX, endY, currentTime, currentPlayer); // Pass start and end coordinates to addShot
    rawShots.push({
      event: currentActionType,
      startX: startX,
      startY: startY,
      endX: endX,
      endY: endY,
      time: currentTime,
      player: currentPlayer,
    });
    sessionStorage.setItem("rawShots", JSON.stringify(rawShots));
    startX = null;
    startY = null;
    endX = null;
    endY = null;
  }
});

pitch.addEventListener("touchstart", function (event) {
  if (startX === null || startY === null) {
    isDragging = true;
    let rect = pitch.getBoundingClientRect();
    // startX = ((event.clientX - rect.left) / pitch.offsetWidth) * 105;
    // startY = ((event.clientY - rect.top) / pitch.offsetHeight) * 68;
    startX =
      (((event.touches[0].clientX - rect.left) / pitch.offsetWidth) * 105) /
      zoomLevel;
    startY =
      (((event.touches[0].clientY - rect.top) / pitch.offsetHeight) * 68) /
      zoomLevel;
    startX = Math.round(startX);
    startY = Math.round(startY);
  }
});

pitch.addEventListener("touchmove", function (event) {
  if (isDragging) {
    let rect = pitch.getBoundingClientRect();
    // endX = ((event.clientX - rect.left) / pitch.offsetWidth) * 105;
    // endY = ((event.clientY - rect.top) / pitch.offsetHeight) * 68;
    endX =
      (((event.touches[0].clientX - rect.left) / pitch.offsetWidth) * 105) /
      zoomLevel;
    endY =
      (((event.touches[0].clientY - rect.top) / pitch.offsetHeight) * 68) /
      zoomLevel;
    endX = Math.round(endX);
    endY = Math.round(endY);
  }
});

pitch.addEventListener("touchend", function (event) {
  if (isDragging) {
    isDragging = false;
    var currentTime = getCurrentTime();
    addShot(currentActionType, startX, startY, endX, endY, currentTime, currentPlayer); // Pass start and end coordinates to addShot
    rawShots.push({
      event: currentActionType,
      startX: startX,
      startY: startY,
      endX: endX,
      endY: endY,
      time: currentTime,
      player: currentPlayer,
    });
    sessionStorage.setItem("rawShots", JSON.stringify(rawShots));
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
      ? distanceAnglexG(startX, startY) // Use startX and startY for xG calculation
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
    actionType,
    startX,
    startY,
    wasDragged ? endX : "N/A",
    wasDragged ? endY : "N/A",
    xG,
    xSave,
    "<button class='btn btn-outline-danger remove-button' onclick='removeShot(this)'>X</button>",
  ];

  // Add new row data with DataTables API
  var rowIndex = table.row.add(newRowData).draw().index();

  // Store additional data using row().data() for easy access
  table.row(rowIndex).data().dotx = (startX * 1.0) / 105;
  table.row(rowIndex).data().doty = (startY * 1.0) / 68;
  if (wasDragged) {
    table.row(rowIndex).data().dotx2 = (endX * 1.0) / 105;
    table.row(rowIndex).data().doty2 = (endY * 1.0) / 68;
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
  //updateCumulative(xG, xSave, actionType, "add");
  shotsData.push({
    time: time,
    player: playerJerseyNumber,
    playerName: currentPlayerName,
    action: actionType,
    x: startX,
    y: startY,
    x2: wasDragged ? endX : "N/A",
    y2: wasDragged ? endY : "N/A",
    xG: xG,
    xSave: xSave,
  });
  sessionStorage.setItem("shotsData", JSON.stringify(shotsData));
  // populateDropdown();
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
    sessionStorage.setItem("shotsData", JSON.stringify(shotsData));
    console.log(shotsData);
  }

  if (rawShots && rowIndex !== undefined) {
    rawShots.splice(rowIndex, 1);
    sessionStorage.setItem("rawShots", JSON.stringify(rawShots));
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
  //updateCumulative(xGContent, xSaveContent, eventContent, "subtract");
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
  pitch.appendChild(svg);
}

function calculateDistance(pos_x, pos_y) {
  const midGoalX = 0.0;
  const midGoalY = 34.0;
  const goalCoordinates = [midGoalX, midGoalY];
  const shotCoordinates = [pos_x, pos_y];
  const distance = Math.hypot(
    shotCoordinates[0] - goalCoordinates[0],
    shotCoordinates[1] - goalCoordinates[1]
  );
  return distance;
}

function calculateAngle(pos_x, pos_y) {
  const deltaY = Math.pow(pos_y - 34.0, 2);
  const deltaX = Math.pow(pos_x - 0.0, 2);
  const radian = Math.atan2(deltaY, deltaX);
  const degrees = radian * (180 / Math.PI);
  return degrees;
}

function distanceAnglexG(pos_x, pos_y) {
  if (pos_x >= 52) {
    pos_x = 105 - pos_x;
    pos_y = 68 - pos_y;
  }
  let distance = calculateDistance(pos_x, pos_y);
  let angle = calculateAngle(pos_x, pos_y);
  // console.log("DISTANCE AND ANGLE");
  // console.log(distance, angle);
  let p =
    1 /
    (1 +
      Math.exp(
        -(
          0.2204 -
          0.0281 * pos_x -
          0.0062 * pos_y -
          0.0998 * distance -
          0.0081 * angle
        )
      ));
  // console.log("RAW VALUE");
  // console.log(p);
  // p = p*100;
  p = p.toFixed(2);
  // console.log(p);
  return p;
}

function downloadCSVandPDF() {
  console.log(shotsData);

  // Fetch the CSV file
  fetch("/download_csv", {
    method: "POST",
    body: JSON.stringify(shotsData),
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.blob())
    .then((blob) => {
      // Create a link element, use it to download the CSV file
      let csvUrl = window.URL.createObjectURL(blob);
      let csvLink = document.createElement("a");
      csvLink.href = csvUrl;
      csvLink.download = "shots_data.csv";
      document.body.appendChild(csvLink);
      csvLink.click();
      csvLink.remove();
    })
    .catch((error) => console.error("Error downloading CSV:", error));

  // Fetch the PDF file
  fetch("/download_pdf", {
    method: "POST",
    body: JSON.stringify(shotsData),
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.blob())
    .then((blob) => {
      // Create a link element, use it to download the PDF file
      let pdfUrl = window.URL.createObjectURL(blob);
      let pdfLink = document.createElement("a");
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
    '3': 2,
    '4': 3,
    '5': 4,
    '6': 5,
    '7': 6,
    '8': 7,
    '9': 8,
    '0': 9,
    'Q': 10,
    'W': 11,
    'E': 12,
    'R': 13,
    'T': 14,
    'Y': 15,
  }

  const awayPlayerKeyMap = {
    'U': 0,
    'I': 1,
    'O': 2,
    'P': 3,
    '[': 4,
    ']': 5,
    'A': 6,
    'S': 7,
    'D': 8,
    'F': 9,
    'G': 10,
    'H': 11,
    'J': 12,
    'K': 13,
    'L': 14,
    ';': 15,
  }

  // Check if the pressed key is in our map
  if (homePlayerKeyMap.hasOwnProperty(event.key.toUpperCase())) {
    // Get the index from the map
    let index = homePlayerKeyMap[event.key.toUpperCase().toString()];
    let button = document.getElementById(`homePlayerButton${index}`);
    button.click();
  }
  if (awayPlayerKeyMap.hasOwnProperty(event.key.toUpperCase())) {
    // Get the index from the map
    let index = awayPlayerKeyMap[event.key.toUpperCase()];
    let button = document.getElementById(`awayPlayerButton${index}`);
    button.click();
  }

  const eventKeyMap = {
    Z: 0, // Index of Shot
    X: 1, // Index of Shot(Save)
    C: 2, // Index of Shot(Goal)
    V: 3, // Index of Shot Assist
    B: 4, // Index of Dribble
    "<": 5, // Index of Dribble
    N: 6, // Index of Cross
    M: 7, // Index of Pass
    ",": 8, // Index of Tackle
    ".": 9, // Index of Free Kick
    "?": 10, // Index of Corner
    ">": 11, // Index of Corner
  };

  if (eventKeyMap.hasOwnProperty(event.key.toUpperCase())) {
    // Get the index from the map
    const index = eventKeyMap[event.key.toUpperCase()];
    if (index < eventButtons.length) {
      // If the calculated button exists, simulate a click on it
      eventButtons[index].click();
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
// Initialize default event names
let defaultEventNames = [
  "Shot", "Shot - Save", "Shot - Goal", "Shot Assist", 
  "Dribble", "Location", "Cross", "Pass", 
  "Tackle", "Foul", "Free Kick", "Corner"
];

// Load event names from sessionStorage if available
function initializeEventNames() {
  let storedEventNames = sessionStorage.getItem('eventNames');
  if (storedEventNames) {
    eventNames = JSON.parse(storedEventNames);
  } else {
    eventNames = [...defaultEventNames];
  }
  displayEventNames();
}

// Display event names on buttons
function displayEventNames() {
  const eventShortcuts = ['Z', 'X', 'C', 'V', 'B', '<', 'N', 'M', ',', '.', '?', '>'];
  const eventButtons = document.querySelectorAll(".event-button");
  for (let i = 0; i < eventNames.length; i++) {
    let button = eventButtons[i];
    if (button) {
      button.innerHTML = `${eventNames[i]} (${eventShortcuts[i]})`;
    }
  }
}

// Save event names from modal into sessionStorage
function saveEventNames() {
  const textarea = document.getElementById('eventNamesTextarea');
  let eventLines = textarea.value.split('\n').slice(0, 12).map(name => name.trim()).filter(name => name.length > 0);

  // If less than 12 names are provided, fill in the remaining with default names
  for (let i = eventLines.length; i < 12; i++) {
    eventLines.push(defaultEventNames[i]);
  }

  sessionStorage.setItem('eventNames', JSON.stringify(eventLines));
  eventNames = eventLines;
  
  // Update buttons with new event names
  displayEventNames();
  
  // Close the modal
  $('#editEventNamesModal').modal('hide');
}

// Load saved event names into the textarea
function loadEventNamesToTextarea() {
  let storedEventNames = sessionStorage.getItem('eventNames');
  const textarea = document.getElementById('eventNamesTextarea');
  
  if (storedEventNames) {
    textarea.value = JSON.parse(storedEventNames).join('\n');
  } else {
    textarea.value = defaultEventNames.join('\n');
  }
}

// Call this function when the modal opens to populate the textarea
document.getElementById('editEventNamesModal').addEventListener('show.bs.modal', loadEventNamesToTextarea);

// Initialize event names on page load
initializeEventNames();
