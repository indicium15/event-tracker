# football/routes.py
from flask import Blueprint, render_template, request, jsonify, Response, current_app
import csv, io
from reportlab.pdfgen import canvas
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.lib.utils import ImageReader
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase.pdfmetrics import stringWidth
from mplsoccer import Pitch
import numpy as np
import matplotlib.pyplot as plt
plt.switch_backend('Agg')  # Use a non-interactive backend for matplotlib

bp = Blueprint(
    "football",
    __name__,
    template_folder="templates",
    static_folder="static",
    static_url_path="/football/static",
    url_prefix="/football"
)

# In-memory state per process (replace with DB/Redis for multi-worker production)
shots = []

@bp.route("/")
def index():
    # You can pass a basePath so your JS knows what to call (e.g., /football)
    return render_template("football_index.html", basePath="/football")

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
    fieldnames = ["time","player","playerName","action","x","y","x2","y2","xG","xSave"]
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

    # Group shots by player and action type
    player_actions = {}
    for shot in shots:
        print(shot)
        player_name = shot["playerName"]
        action_type = shot["action"]
        if player_name not in player_actions:
            player_actions[player_name] = {}
        if action_type not in player_actions[player_name]:
            player_actions[player_name][action_type] = []
        player_actions[player_name][action_type].append(shot)

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
                
            # Add a new page if necessary
            if image_count == 7:
                image_count = 1
                ori_height = 6.5
                text_height = 0
                pdf.showPage()
                pdf.setFont("Vera", 18)

            # Create a pitch instance using mplsoccer
            pitch = Pitch(pitch_type="custom", pitch_length=105, pitch_width=68)
            fig, ax = pitch.draw(figsize=(4, 3))

            for shot in valid_shots:
                    
                x, y = float(shot["x"]), 68 - float(shot["y"])  # Adjust y-coordinate

                # Check if x2 and y2 exist and are not 'N/A'
                if shot["x2"] != "N/A" and shot["y2"] != "N/A" and shot["x2"] is not None and shot["y2"] is not None:
                    x2, y2 = float(shot["x2"]), 68 - float(shot["y2"])  # Adjust y2-coordinate

                    # Calculate the direction and adjust the length of the arrow
                    dx = x2 - x
                    dy = y2 - y
                    distance = np.hypot(dx, dy)

                    # Shorten the arrow length slightly for better visualization
                    arrow_length_factor = 0.95  # Scale the arrow length
                    x2_adj = x + arrow_length_factor * dx
                    y2_adj = y + arrow_length_factor * dy

                    # Draw an arrow from (x, y) to (x2_adj, y2_adj)
                    pitch.arrows(x, y, x2_adj, y2_adj, width=2, headwidth=5, color="black", ax=ax)

                    # Draw the start and end points
                    pitch.scatter(x, y, s=100, color="yellow", edgecolors="black", ax=ax)  # Start point
                    pitch.scatter(x2, y2, s=100, color="yellow", edgecolors="black", ax=ax)  # End point
                else:
                    # Draw a single point if x2 or y2 is 'N/A'
                    pitch.scatter(x, y, s=100, color="yellow", edgecolors="black", ax=ax)

            # Save the plot to a buffer
            img_buffer = io.BytesIO()
            fig.savefig(img_buffer, format="png", bbox_inches='tight')
            plt.close(fig)
            img_buffer.seek(0)

            # Determine the placement of the image
            if image_count % 2 != 0:  # Left side of the page
                x_pos = (PAGE_WIDTH / 4.0) - 125
                text_x_pos = x_pos + 125 - (pdf.stringWidth(action, "Vera", 15) / 2)
            else:  # Right side of the page
                x_pos = ((PAGE_WIDTH / 4.0) * 3) - 125
                text_x_pos = x_pos + 125 - (pdf.stringWidth(action, "Vera", 15) / 2)

            y_pos = (PAGE_HEIGHT / 10) * ori_height
            text_y_pos = (PAGE_HEIGHT / 10.5) * (ori_height - text_height)
            image = ImageReader(img_buffer)
            # Insert the plot and text
            pdf.drawImage(image, x=x_pos, y=y_pos, width=250, height=200)
            pdf.setFont("Vera", 15)
            pdf.setFillColor("black")
            pdf.drawString(text_x_pos, text_y_pos, action)

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
