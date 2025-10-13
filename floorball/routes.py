# floorball/routes.py
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
from matplotlib.patches import Rectangle, FancyBboxPatch
from reportlab.pdfbase.pdfmetrics import stringWidth

plt.switch_backend("Agg")

bp = Blueprint(
    "floorball",
    __name__,
    template_folder="templates",
    static_folder="static",
    static_url_path="/floorball/static",   # avoids clashes with other blueprints
    url_prefix="/floorball"                # mount under /football
)

shots = []

@bp.route("/")
def index():
    # You can pass a basePath so your JS knows what to call (e.g., /football)
    return render_template("floorball_index.html", basePath="/floorball")


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
        "action",
        "x",
        "y",
        "x2",
        "y2",
        # xG and xSave removed for floorball
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

def draw_floorball_pitch(ax, pitch_length=40, pitch_width=20, corner_radius=2):
    half_len = pitch_length / 2
    half_wid = pitch_width  / 2

    # 1) new origin centered at (0,0)
    ax.set_xlim(-half_len, half_len)
    ax.set_ylim(-half_wid, half_wid)
    ax.set_aspect("equal")

    # 2) rounded background from bottom‑left = (−half_len, −half_wid)
    background = FancyBboxPatch(
        (-half_len, -half_wid),
        pitch_length,
        pitch_width,
        boxstyle=f"round,pad=0,rounding_size={corner_radius}",
        facecolor="#1e3f66",
        edgecolor="none",
        zorder=0,
    )
    ax.add_patch(background)

    # 3) outer boundary
    outer = FancyBboxPatch(
        (-half_len, -half_wid),
        pitch_length,
        pitch_width,
        boxstyle=f"round,pad=0,rounding_size={corner_radius}",
        linewidth=2,
        edgecolor="white",
        facecolor="none",
        zorder=1,
    )
    ax.add_patch(outer)

    # 4) center line at x=0
    ax.plot([0, 0], [-half_wid, half_wid], color="white", lw=2, zorder=2)

    # 5) goal areas (still 5×4), centered vertically around y=0
    goal_w, goal_h = 5, 4
    goal_y = -goal_h/2
    left_goal = Rectangle(
        (-half_len + 3.5, goal_y), goal_w, goal_h,
        linewidth=2, edgecolor="white", facecolor="none", zorder=3
    )
    right_goal = Rectangle(
        ( half_len - 3.5 - goal_w, goal_y), goal_w, goal_h,
        linewidth=2, edgecolor="white", facecolor="none", zorder=3
    )
    ax.add_patch(left_goal)
    ax.add_patch(right_goal)

    # 6) inner goals
    inner_w, inner_h = goal_w * 0.6, goal_h * 0.6
    inner_y_off = (goal_h - inner_h) / 2
    left_inner = Rectangle(
        (-half_len + 3.5 + (goal_w-inner_w)/2, goal_y + inner_y_off),
        inner_w, inner_h,
        linewidth=1, edgecolor="white", facecolor="none", zorder=4
    )
    right_inner = Rectangle(
        ( half_len - 3.5 - goal_w + (goal_w-inner_w)/2, goal_y + inner_y_off),
        inner_w, inner_h,
        linewidth=1, edgecolor="white", facecolor="none", zorder=4
    )
    ax.add_patch(left_inner)
    ax.add_patch(right_inner)

    # 7) center spot at (0,0)
    ax.plot(0, 0, "o", markersize=4, color="white", zorder=5)

    # 8) plus‑markers at exactly your new coords
    #    margin_x = half_len - 3.5 = 20 - 3.5 = 16.5
    #    margin_y = half_wid - 1.5 = 10 - 1.5 = 8.5
    mx, my = half_len - 3.5, half_wid - 1.5
    plus_coords = [
        (-mx,  my),  # top‑left
        (   0,  my),  # top‑centre
        ( mx,  my),  # top‑right
        (-mx, -my),  # bottom‑left
        (   0, -my),  # bottom‑centre
        ( mx, -my),  # bottom‑right
    ]
    for x, y in plus_coords:
        ax.text(x, y, "+", fontsize=12, fontweight="bold",
                ha="center", va="center", color="white", zorder=6)

    # 9) clean up
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
            if image_count == 7:
                image_count = 1
                ori_height = 6.5
                text_height = 0
                pdf.showPage()
                pdf.setFont("Vera", 18)

            # Create a figure and axis for the pitch using matplotlib
            fig, ax = plt.subplots(figsize=(4, 3))
            # Draw the floorball pitch using our custom function
            ax = draw_floorball_pitch(ax, pitch_length=40, pitch_width=20)

            for shot in action_list:
                x = float(shot["x"])
                y = float(shot["y"])  # Flip Y for top-left origin

                # Check if it's a pass/dragged shot with a destination point
                if shot["x2"] != "N/A" and shot["y2"] != "N/A":
                    x2 = float(shot["x2"])
                    y2 = float(shot["y2"])

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
            pdf.drawImage(image, x=x_pos, y=y_pos, width=250, height=200)
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
