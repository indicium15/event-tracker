var currentActionType = "Shot";
var currentPlayer = "N/A";
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
    table = $('#event-table').DataTable({
        paging: false,
        info: false,
    });
    console.log("table");
    console.log(table);
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
});



console.log("table");
console.log(table);

function setActionType(actionType) {
    if (currentActionType == actionType) {
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
    currentActionType = actionType;

    // Get all action buttons
    var buttons = document.querySelectorAll(".event-button");

    // Remove the active class from all buttons
    buttons.forEach(function (button) {
        button.classList.remove("active");
    });
    // This assumes that this function is called with 'this' bound to the clicked button
    this.classList.add("active");
}

function setPlayer(player) {
    // Set the current player type
    if (currentPlayer == player) {
        //If player already pressed toggle the button
        currentPlayer = "";
        var buttons = document.querySelectorAll(".player-button");
        // Remove the active class from all buttons
        buttons.forEach(function (button) {
            button.classList.remove("active");
        });
        return;
    }
    currentPlayer = player;

    // Get all team buttons
    var buttons = document.querySelectorAll(".player-button");

    // Remove the active class from all buttons
    buttons.forEach(function (button) {
        button.classList.remove("active");
    });

    // Add the active class to the clicked button
    this.classList.add("active");
}

pitch.addEventListener("mousedown", function (event) {
    if (startX === null || startY === null) {
        isDragging = true;
        let rect = pitch.getBoundingClientRect();
        startX = ((event.clientX - rect.left) / pitch.offsetWidth) * 105;
        startY = ((event.clientY - rect.top) / pitch.offsetHeight) * 68;
        startX = Math.round(startX);
        startY = Math.round(startY);
    }
});

pitch.addEventListener("mousemove", function (event) {
    if (isDragging) {
        let rect = pitch.getBoundingClientRect();
        endX = ((event.clientX - rect.left) / pitch.offsetWidth) * 105;
        endY = ((event.clientY - rect.top) / pitch.offsetHeight) * 68;
        endX = Math.round(endX);
        endY = Math.round(endY);
    }
});

pitch.addEventListener("mouseup", function (event) {
    if (isDragging) {
        isDragging = false;
        var currentTime = getCurrentDateTime();
        addShot(event, startX, startY, endX, endY, currentTime, currentPlayer); // Pass start and end coordinates to addShot
        rawShots.push({
            event: event,
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
        startX = ((event.clientX - rect.left) / pitch.offsetWidth) * 105;
        startY = ((event.clientY - rect.top) / pitch.offsetHeight) * 68;
        startX = Math.round(startX);
        startY = Math.round(startY);
    }
});

pitch.addEventListener("touchmove", function (event) {
    if (isDragging) {
        let rect = pitch.getBoundingClientRect();
        endX = ((event.clientX - rect.left) / pitch.offsetWidth) * 105;
        endY = ((event.clientY - rect.top) / pitch.offsetHeight) * 68;
        endX = Math.round(endX);
        endY = Math.round(endY);
    }
});

pitch.addEventListener("touchend", function (event) {
    if (isDragging) {
        isDragging = false;
        var currentTime = getCurrentDateTime();
        addShot(event, startX, startY, endX, endY, currentTime, currentPlayer); // Pass start and end coordinates to addShot
        rawShots.push({
            event: event,
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

function addShot(event, startX, startY, endX, endY, time, player) {
    let wasDragged =
        startX !== null &&
        startY !== null &&
        endX !== null &&
        endY !== null &&
        (startX !== endX || startY !== endY);
    var actionType = currentActionType;
    var xG =
        actionType === "Shot" ||
            actionType === "Shot-Goal" ||
            actionType === "Shot-Save"
            ? distanceAnglexG(startX, startY) // Use startX and startY for xG calculation
            : "N/A";
    var xSave = actionType === "Shot-Save" ? +(1.0 - xG).toFixed(2) : "N/A";

    var newRowData = [
        time,
        player,
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
    updateCumulative(xG, xSave, actionType, "add");
    shotsData.push({
        time: time,
        player: player,
        action: actionType,
        x: startX,
        y: startY,
        x2: wasDragged ? endX : "N/A",
        y2: wasDragged ? endY : "N/A",
        xG: xG,
        xSave: xSave,
    });
    localStorage.setItem("shotsData", JSON.stringify(shotsData));
    // populateDropdown();
}

function updateCumulative(xG, xSave, action, operation) {
    if (xG != "N/A") {
        var updatedXg = cumulativeData["xG"];
        if (operation == "add") {
            updatedXg += parseFloat(xG);
        } else {
            updatedXg -= parseFloat(xG);
        }
        cumulativeData["xG"] = parseFloat(updatedXg.toFixed(2));
    }
    if (xSave != "N/A") {
        var updatedXsave = cumulativeData["xSave"];
        if (operation == "add") {
            updatedXsave += parseFloat(xSave);
        } else {
            updatedXsave -= parseFloat(xSave);
        }
        cumulativeData["xSave"] = parseFloat(updatedXsave.toFixed(2));
    }
    if (action.includes("Shot")) {
        if (operation == "add") {
            cumulativeData["shots"] += 1;
        } else {
            cumulativeData["shots"] -= 1;
        }
    }
    if (action == "Pass") {
        if (operation == "add") {
            cumulativeData["passes"] += 1;
        } else {
            cumulativeData["passes"] -= 1;
        }
    }
    if (action == "Free Kick") {
        if (operation == "add") {
            cumulativeData["freeKicks"] += 1;
        } else {
            cumulativeData["freeKicks"] -= 1;
        }
    }
    if (action == "Corner") {
        if (operation == "add") {
            cumulativeData["corners"] += 1;
        } else {
            cumulativeData["corners"] -= 1;
        }
    }
    if (action == "Tackle") {
        if (operation == "add") {
            cumulativeData["tackles"] += 1;
        } else {
            cumulativeData["tackles"] -= 1;
        }
    }
    //console.log(cumulativeData);
    var table = document.querySelector("#cumulative-table tbody");
    var firstRow = table.querySelectorAll("tr")[0].cells;
    firstRow[0].textContent = cumulativeData["xG"];
    firstRow[1].textContent = cumulativeData["xSave"];
    firstRow[2].textContent = cumulativeData["shots"];
    firstRow[3].textContent = cumulativeData["passes"];
    firstRow[4].textContent = cumulativeData["corners"];
    firstRow[5].textContent = cumulativeData["freeKicks"];
    firstRow[6].textContent = cumulativeData["tackles"];
}

function removeShot(deleteButton) {
    // Retrieve the DataTables row for the delete button
    var row = $(deleteButton).closest("tr");
    var rowIndex = table.row(row).index();

    // Remove the shot from the shotsData array if storing shot data separately
    if (shotsData && rowIndex !== undefined) {
        shotsData.splice(rowIndex, 1);
        localStorage.setItem("shotsData", JSON.stringify(shotsData));
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
    updateCumulative(xGContent, xSaveContent, eventContent, "subtract");
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
    // TODO: check if we output percentage or decimal
    // p = p*100;
    p = p.toFixed(2);
    // console.log(p);
    return p;
}

function downloadCSV() {
    console.log(shotsData);
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
            let url = window.URL.createObjectURL(blob);
            let a = document.createElement("a");
            a.href = url;
            a.download = "shots_data.csv";
            document.body.appendChild(a);
            a.click();
            a.remove();
        })
        .catch((error) => console.error("Error:", error));
}

// document.addEventListener('DOMContentLoaded', function() {
//     populateDropdown();
// });

// function populateDropdown() {
//     const events = new Set();
//     const rows = document.querySelectorAll('#event-table tbody tr');
//     rows.forEach(row => {
//         const event = row.cells[2].textContent; // Assuming "Event" is in the 3rd column
//         events.add(event);
//     });
//     console.log("Events ");
//     console.log(events);
//     const dropdown = document.getElementById('event-filter');
//     dropdown.innerHTML = '<option value="">All Events</option>';
//     events.forEach(event => {
//         const option = document.createElement('option');
//         option.value = option.textContent = event;
//         dropdown.appendChild(option);
//     });
// }

// function filterTable() {
//     const filterValue = document.getElementById('event-filter').value;
//     const rows = document.querySelectorAll('#event-table tbody tr');
//     rows.forEach(row => {
//         const event = row.cells[2].textContent; // Assuming "Event" is in the 3rd column
//         if(filterValue === "" || event === filterValue) {
//             row.style.display = ""; // Show row
//         } else {
//             row.style.display = "none"; // Hide row
//         }
//     });
// }
