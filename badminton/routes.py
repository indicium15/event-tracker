from flask import Blueprint, render_template, request, jsonify, Response
import csv
import io
import matplotlib.pyplot as plt
from reportlab.pdfgen import canvas
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.lib.utils import ImageReader
from reportlab.lib.pagesizes import A4
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle
from reportlab.pdfbase.pdfmetrics import stringWidth
plt.switch_backend("Agg")

# Dimensions in METERS (match your JS: COURT 13.40m x 6.10m for doubles, 5.18m for singles)
COURT_LEN_M = 13.40
COURT_WID_DOUBLES_M = 6.10
COURT_WID_SINGLES_M = 5.18

# Run-off each side (meters) – baseline direction (length) and sideline direction (width)
RUNOFF_LEN_M = 2.0  # behind each baseline
RUNOFF_WID_M = 1.5  # beyond each sideline

bp = Blueprint(
    "badminton",
    __name__,
    template_folder="templates",
    static_folder="static",
    static_url_path="/badminton/static",   # avoids clashes with other blueprints
    url_prefix="/badminton"                # mount under /badminton
)

# In-memory state per process (replace with DB/Redis for multi-worker production)
shots = []

@bp.route("/")
def index():
    # Render the main page with the shots data
    return render_template("badminton_index.html", basePath="/badminton")


@bp.route("/add_shot", methods=["POST"])
def add_shot():
    # Get data from the request
    data = request.json
    # Add the new shot to our shots list
    shots.append(data)
    # print(shots)
    return jsonify({"message": "Shot added succesfully"})


@bp.route("/remove_shot", methods=["POST"])
def remove_shot():
    data = request.json
    # Find the shot in the list of shots and remove it
    global shots
    shots = [
        shot
        for shot in shots
        if not (
            shot["x"] == data["x"]
            and shot["y"] == data["y"]
            and shot["action"] == data["action"]
            and shot["player"] == data["player"]
        )
    ]
    print(shots)
    return jsonify({"success": True, "message": "Shot removed successfully"})


@bp.route("/download_csv", methods=["POST"])
def download_csv():
    # Retrieve shot data from the request's JSON payload
    shots = request.json

    # Create a buffer to hold the CSV data
    proxy = io.StringIO()

    # Create a CSV writer object using the buffer as the file
    fieldnames = [
        "time",
        "player",
        "playerName",
        "grip",
        "action",
        "outcome",
        "x",
        "y",
        "x2",
        "y2",
    ]
    writer = csv.DictWriter(proxy, fieldnames=fieldnames)

    # Write the header and data to the CSV writer
    writer.writeheader()
    for shot in shots:
        writer.writerow(shot)

    # Seek to the start so `proxy` contains the entire content
    proxy.seek(0)
    output = proxy.getvalue()
    proxy.close()

    # Create a Flask response
    return Response(
        output,
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment;filename=shots_data.csv"},
    )


@bp.route("/download_pdf", methods=["POST"])
def download_pdf():
    shots = request.json
    # Create the PDF file in-memory
    pdf_buffer = create_pdf_report(shots)
    pdf_buffer.seek(0)
    return Response(
        pdf_buffer,
        mimetype="application/pdf",
        headers={"Content-Disposition": "attachment; filename=report.pdf"},
    )

def draw_badminton_court(
    ax,
    length=COURT_LEN_M,
    width=COURT_WID_DOUBLES_M,
    runoff_len=RUNOFF_LEN_M,
    runoff_wid=RUNOFF_WID_M,
):
    """
    Draw full play surface (court + run-off) with the court rendered inside.
    Coordinates are centered at (0,0), x along length (baseline-to-baseline),
    y along width (sideline-to-sideline) – same as your JS.
    Always uses doubles court dimensions.
    
    Court dimensions:
    - Length (baseline to baseline): 13.40m
    - Width (sideline to sideline): 6.1m
    - Short service line: 1.98m from net (center at x=0)
    - Long service line: 5.78m from net (1.98m + 3.8m)
    - Singles sidelines: 0.42m from doubles sideline
    """
    # Half sizes
    half_len = length / 2.0         # court half-length = 6.70m
    half_wid = width / 2.0          # court half-width (doubles) = 3.05m
    surf_half_len = half_len + runoff_len   # surface half-length
    surf_half_wid = half_wid + runoff_wid   # surface half-width

    # Service line positions from center (net at x=0)
    short_service_line = 1.98  # 1.98m from net
    long_service_line = 5.78   # 5.78m from net (1.98 + 3.8)
    
    # Singles sideline position: 0.42m from doubles sideline
    # Doubles sideline is at ±half_wid = ±3.05m
    # Singles sideline is at ±(3.05 - 0.42) = ±2.63m
    singles_sideline_pos = half_wid - 0.42  # 2.63m from center

    # Axes span the **full surface**
    ax.set_xlim(-surf_half_len, surf_half_len)
    ax.set_ylim(-surf_half_wid, surf_half_wid)
    ax.set_aspect("equal")

    # 1) Out-of-court background (dark green)
    surface = Rectangle(
        (-surf_half_len, -surf_half_wid),
        2*surf_half_len,
        2*surf_half_wid,
        facecolor="#0b5d2a",
        edgecolor="none",
        zorder=0,
    )
    ax.add_patch(surface)

    # 2) Court rectangle (lighter green) + white border (doubles lines/baselines)
    court = Rectangle(
        (-half_len, -half_wid),
        2*half_len,
        2*half_wid,
        facecolor="#008000",
        edgecolor="white",
        linewidth=2,
        zorder=1,
    )
    ax.add_patch(court)

    # 3) Net (vertical line at x=0, center of court)
    ax.plot([0, 0], [-half_wid, half_wid], color="white", lw=2, linestyle='--', zorder=2)

    # 4) Singles sidelines (horizontal lines at ±singles_sideline_pos)
    ax.plot([-half_len, half_len], [singles_sideline_pos,  singles_sideline_pos],  color="white", lw=2, zorder=2)
    ax.plot([-half_len, half_len], [-singles_sideline_pos, -singles_sideline_pos], color="white", lw=2, zorder=2)

    # 5) Baselines (vertical lines at ±half_len)
    ax.plot([-half_len, -half_len], [-half_wid, half_wid], color="white", lw=2, zorder=2)
    ax.plot([ half_len,  half_len], [-half_wid, half_wid], color="white", lw=2, zorder=2)

    # 6) Short service lines (vertical lines at ±short_service_line from net)
    ax.plot([short_service_line, short_service_line], [-half_wid, half_wid], color="white", lw=2, zorder=2)
    ax.plot([-short_service_line, -short_service_line], [-half_wid, half_wid], color="white", lw=2, zorder=2)

    # 7) Long service lines (vertical lines at ±long_service_line from net)
    ax.plot([long_service_line, long_service_line], [-half_wid, half_wid], color="white", lw=2, zorder=2)
    ax.plot([-long_service_line, -long_service_line], [-half_wid, half_wid], color="white", lw=2, zorder=2)

    # 8) Center line (horizontal line dividing service courts, at y=0)
    # This runs from short service line to long service line on both sides
    ax.plot([-long_service_line, -short_service_line], [0, 0], color="white", lw=2, zorder=2)
    ax.plot([short_service_line, long_service_line], [0, 0], color="white", lw=2, zorder=2)

    # Clean axis
    ax.set_xticks([]); ax.set_yticks([])
    for spine in ax.spines.values():
        spine.set_visible(False)

    return ax


def create_pdf_report(shots):
    # Register the custom font
    print(shots)
    pdfmetrics.registerFont(TTFont("Vera", "Vera.ttf"))

    # Initialize reportlab canvas
    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    pdf.setTitle("Report")
    PAGE_WIDTH, PAGE_HEIGHT = A4

    # Group shots by player and action type (unchanged)
    player_actions = {}
    for shot in shots:
        player_name = shot["playerName"]
        action_type = shot["action"]
        if player_name not in player_actions:
            player_actions[player_name] = {}
        if action_type not in player_actions[player_name]:
            player_actions[player_name][action_type] = []
        player_actions[player_name][action_type].append(shot)

    # Iterate over each player's actions to create pages in the PDF
    for player, actions in player_actions.items():
        pdf.setFont("Vera", 18)
        y = PAGE_HEIGHT - 50
        player_name_text = f"{player}'s Statistics"
        text_width = stringWidth(player_name_text, "Vera", 18)
        pdf.drawString((PAGE_WIDTH - text_width) / 2.0, y, player_name_text)

        image_count = 1
        ori_height = 6.5
        text_height = 0

        for action, action_list in actions.items():
            # Filter out shots with N/A coordinates
            valid_shots = [
                shot for shot in action_list
                if shot["x"] is not None and shot["y"] is not None 
                and shot["x"] != "N/A" and shot["y"] != "N/A"
            ]
            
            # Skip this action type if no valid shots remain
            if not valid_shots:
                continue
                
            if image_count == 7:
                image_count = 1
                ori_height = 6.5
                text_height = 0
                pdf.showPage()
                pdf.setFont("Vera", 18)

            # Create a figure and axis for the pitch using matplotlib
            fig, ax = plt.subplots(figsize=(4, 3))
            # Draw the badminton court using our custom function (always doubles)
            draw_badminton_court(ax)

            for shot in valid_shots:
                    # Convert from cm (JavaScript) to meters (Python plot)
                    # JavaScript stores coordinates in cm, centered at (0,0)
                    # Python plot uses meters with (0,0) at center
                x = float(shot["x"]) / 100.0  # Convert cm to meters
                y = float(shot["y"]) / 100.0  # Convert cm to meters

                # Check if it's a pass/dragged shot with a destination point
                if shot["x2"] != "N/A" and shot["y2"] != "N/A" and shot["x2"] is not None and shot["y2"] is not None:
                    x2 = float(shot["x2"]) / 100.0  # Convert cm to meters
                    y2 = float(shot["y2"]) / 100.0  # Convert cm to meters

                    dx = x2 - x
                    dy = y2 - y

                    # Draw the arrow
                    ax.arrow(
                        x,
                        y,
                        dx,
                        dy,
                        length_includes_head=True,
                        head_width=0.6,
                        head_length=1.2,
                        fc="black",
                        ec="black",
                        lw=1.5,
                        zorder=6,
                    )
                    # Draw start and end points
                    ax.plot(
                        x,
                        y,
                        "o",
                        markersize=8,
                        color="yellow",
                        markeredgecolor="black",
                        zorder=7,
                    )
                    ax.plot(
                        x2,
                        y2,
                        "o",
                        markersize=8,
                        color="yellow",
                        markeredgecolor="black",
                        zorder=7,
                    )
                else:
                    # Single shot/point only
                    ax.plot(
                        x,
                        y,
                        "o",
                        markersize=8,
                        color="yellow",
                        markeredgecolor="black",
                        zorder=7,
                    )

            # Save the figure to a buffer
            img_buffer = io.BytesIO()
            fig.savefig(img_buffer, format="png", bbox_inches="tight")
            plt.close(fig)
            img_buffer.seek(0)

            # Determine placement for the image on the PDF page
            if image_count % 2 != 0:
                x_pos = (PAGE_WIDTH / 4.0) - 125
                text_x_pos = x_pos + 125 - (pdf.stringWidth(action, "Vera", 15) / 2)
            else:
                x_pos = ((PAGE_WIDTH / 4.0) * 3) - 125
                text_x_pos = x_pos + 125 - (pdf.stringWidth(action, "Vera", 15) / 2)

            y_pos = (PAGE_HEIGHT / 10) * ori_height
            text_y_pos = (PAGE_HEIGHT / 10.5) * (ori_height - text_height)
            image = ImageReader(img_buffer)
            # Preserve the PNG's aspect ratio when embedding in the PDF.
            # ImageReader.getSize() returns (width, height) in pixels.
            try:
                img_w, img_h = image.getSize()
            except Exception:
                # Fallback: assume 4:3 if size can't be obtained
                img_w, img_h = (4.0, 3.0)

            max_w, max_h = 250.0, 200.0
            scale = min(max_w / img_w, max_h / img_h)
            draw_w = img_w * scale
            draw_h = img_h * scale

            # center the image inside the original (250x200) box
            x_center = x_pos + (max_w - draw_w) / 2.0
            y_center = y_pos + (max_h - draw_h) / 2.0

            pdf.drawImage(image, x=x_center, y=y_center, width=draw_w, height=draw_h)
            pdf.setFont("Vera", 15)
            pdf.setFillColor("black")
            pdf.drawString(text_x_pos, text_y_pos, action)

            image_count += 1
            if image_count % 2 != 0 and image_count != 1:
                ori_height -= 3
                text_height += 0.12

            img_buffer.close()

        pdf.showPage()

    pdf.save()
    buffer.seek(0)
    return buffer
