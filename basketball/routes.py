# basketball/routes.py
from flask import Blueprint, render_template, request, jsonify, Response, current_app
import csv, io
from reportlab.pdfgen import canvas
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.lib.utils import ImageReader
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase.pdfmetrics import stringWidth
from mplsoccer import Pitch
from mplbasketball import Court
import numpy as np
import matplotlib.pyplot as plt
plt.switch_backend('Agg')  # Use a non-interactive backend for matplotlib

bp = Blueprint(
    "basketball",
    __name__,
    template_folder="templates",
    static_folder="static",
    static_url_path="static",   # serves static files at /basketball/static
    url_prefix="/basketball"    # mount under /basketball
)

# In-memory state per process (replace with DB/Redis for multi-worker production)
shots = []

@bp.route("/")
def index():
    # You can pass a basePath so your JS knows what to call (e.g., /basketball)
    return render_template("basketball_index.html", basePath="/basketball")

@bp.route("/add_shot", methods=["POST"])
def add_shot():
    data = request.json
    shots.append(data)
    return jsonify({"message": "Shot added successfully"})

@bp.route("/remove_shot", methods=["POST"])
def remove_shot():
    data = request.json
    global shots
    shots = [
        s for s in shots
        if not (s["x"] == data["x"] and s["y"] == data["y"]
                and s["action"] == data["action"] and s["player"] == data["player"])
    ]
    return jsonify({"success": True, "message": "Shot removed successfully"})

@bp.route("/download_csv", methods=["POST"])
def download_csv():
    payload = request.json
    proxy = io.StringIO()
    fieldnames = ["time","player","playerName","action","x","y","x2","y2","courtType"]
    writer = csv.DictWriter(proxy, fieldnames=fieldnames)
    writer.writeheader()
    for row in payload:
        writer.writerow(row)
    proxy.seek(0)
    output = proxy.getvalue()
    proxy.close()

    return Response(
        output,
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment;filename=shots_data.csv"}
    )

@bp.route("/download_pdf", methods=["POST"])
def download_pdf():
    payload = request.json
    pdf_buffer = create_pdf_report(payload)
    pdf_buffer.seek(0)
    return Response(
        pdf_buffer,
        mimetype="application/pdf",
        headers={"Content-Disposition": "attachment; filename=report.pdf"}
    )


def create_pdf_report(shots):
    # Register the custom font
    pdfmetrics.registerFont(TTFont('Vera', 'Vera.ttf'))

    # Initialize reportlab canvas
    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    pdf.setTitle("Report")
    PAGE_WIDTH, PAGE_HEIGHT = A4

    # Group shots by player, action type, and court type
    # This ensures each plot uses the correct court background
    player_actions = {}
    for shot in shots:
        print(shot)
        player_name = shot["playerName"]
        action_type = shot["action"]
        court_type = shot.get("courtType", "nba")  # Get court type from shot
        
        if player_name not in player_actions:
            player_actions[player_name] = {}
        
        # Create a key that includes both action and court type
        action_court_key = f"{action_type}_{court_type}"
        
        if action_court_key not in player_actions[player_name]:
            player_actions[player_name][action_court_key] = {
                "action": action_type,
                "court_type": court_type,
                "shots": []
            }
        player_actions[player_name][action_court_key]["shots"].append(shot)

    # Iterate over each player's actions to create pages in the PDF
    for player, actions in player_actions.items():
        # Add a new page to the PDF for each player
        pdf.setFont("Vera", 18)
        y = PAGE_HEIGHT - 50
        player_name_text = f"{player}'s Statistics"
        text_width = stringWidth(player_name_text, "Vera", 18)
        pdf.drawString((PAGE_WIDTH - text_width) / 2.0, y, player_name_text)

        image_count = 1
        ori_height = 6.5
        text_height = 0

        # Iterate over action types for the current player
        for action_court_key, action_data in actions.items():
            action_type = action_data["action"]
            court_type = action_data["court_type"]
            action_list = action_data["shots"]
            
            # Add a new page if necessary
            if image_count == 7:
                image_count = 1
                ori_height = 6.5
                text_height = 0
                pdf.showPage()
                pdf.setFont("Vera", 18)

            # Create a court instance using mplbasketball with the correct court type
            court = Court(court_type=court_type, origin="bottom-left", units="m")
            fig, ax = court.draw()

            # Get court dimensions for coordinate adjustment
            # The HTML court image and mplbasketball court have different orientations,
            # so we need to flip both X and Y coordinates to match
            court_widths = {"nba": 28.6512, "wnba": 28.6512, "ncaa": 28.6512, "fiba": 28.0}
            court_heights = {"nba": 15.24, "wnba": 15.24, "ncaa": 15.24, "fiba": 15.0}
            court_width = court_widths.get(court_type, 28.6512)
            court_height = court_heights.get(court_type, 15.24)

            for shot in action_list:
                x, y = float(shot["x"]), float(shot["y"])  # Adjust y-coordinate based on court type

                # Check if x2 and y2 exist and are not 'N/A'
                if shot["x2"] != "N/A" and shot["y2"] != "N/A":
                    x2, y2 = float(shot["x2"]), float(shot["y2"])  # Adjust y2-coordinate based on court type

                    # Calculate the direction and adjust the length of the arrow
                    dx = x2 - x
                    dy = y2 - y
                    distance = np.hypot(dx, dy)

                    # Shorten the arrow length slightly for better visualization
                    arrow_length_factor = 0.95  # Scale the arrow length
                    x2_adj = x + arrow_length_factor * dx
                    y2_adj = y + arrow_length_factor * dy

                    # Draw an arrow from (x, y) to (x2_adj, y2_adj)
                    ax.annotate('', xy=(x2_adj, y2_adj), xytext=(x, y),
                               arrowprops=dict(arrowstyle='->', color='black', lw=2))

                    # Draw the start and end points
                    ax.scatter(x, y, s=100, color="yellow", edgecolors="black")  # Start point
                    ax.scatter(x2, y2, s=100, color="yellow", edgecolors="black")  # End point
                else:
                    # Draw a single point if x2 or y2 is 'N/A'
                    ax.scatter(x, y, s=100, color="yellow", edgecolors="black")

            # Save the plot to a buffer
            img_buffer = io.BytesIO()
            fig.savefig(img_buffer, format="png", bbox_inches='tight')
            plt.close(fig)
            img_buffer.seek(0)

            # Determine the placement of the image
            if image_count % 2 != 0:  # Left side of the page
                x_pos = (PAGE_WIDTH / 4.0) - 125
                text_x_pos = x_pos + 125 - (pdf.stringWidth(action_type, "Vera", 15) / 2)
            else:  # Right side of the page
                x_pos = ((PAGE_WIDTH / 4.0) * 3) - 125
                text_x_pos = x_pos + 125 - (pdf.stringWidth(action_type, "Vera", 15) / 2)

            y_pos = (PAGE_HEIGHT / 10) * ori_height
            text_y_pos = (PAGE_HEIGHT / 10.5) * (ori_height - text_height)
            image = ImageReader(img_buffer)
            # Insert the plot and text
            pdf.drawImage(image, x=x_pos, y=y_pos, width=250, height=200)
            pdf.setFont("Vera", 15)
            pdf.setFillColor("black")
            pdf.drawString(text_x_pos, text_y_pos, action_type)

            # Update counters for placement
            image_count += 1
            if image_count % 2 != 0 and image_count != 1:
                ori_height -= 3
                text_height += 0.12

            img_buffer.close()

        # Add a new page for each player
        pdf.showPage()

    # Save the PDF to the buffer
    pdf.save()
    buffer.seek(0)
    return buffer
