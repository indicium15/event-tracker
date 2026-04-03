# futsal/routes.py
from flask import Blueprint, render_template, request, jsonify, Response
import csv, io
from reportlab.pdfgen import canvas
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.lib.utils import ImageReader
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase.pdfmetrics import stringWidth
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
plt.switch_backend('Agg')

bp = Blueprint(
    "futsal",
    __name__,
    template_folder="templates",
    static_folder="static",
    static_url_path="/futsal/static",
    url_prefix="/futsal"
)

# In-memory state per process (replace with DB/Redis for multi-worker production)
shots = []

@bp.route("/")
def index():
    return render_template("futsal_index.html", basePath="/futsal")

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
    fieldnames = ["time", "player", "playerName", "action", "x", "y", "x2", "y2"]
    writer = csv.DictWriter(proxy, fieldnames=fieldnames, extrasaction='ignore')
    writer.writeheader()
    for row in payload:
        writer.writerow(row)
    proxy.seek(0)
    output = proxy.getvalue()
    proxy.close()
    return Response(
        output,
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment;filename=futsal_events.csv"}
    )

@bp.route("/download_pdf", methods=["POST"])
def download_pdf():
    payload = request.json
    shots_list = payload.get("shots", [])
    pitch_length = payload.get("pitchLength", 40)
    pitch_width = payload.get("pitchWidth", 20)
    pdf_buffer = create_pdf_report(shots_list, pitch_length, pitch_width)
    pdf_buffer.seek(0)
    return Response(
        pdf_buffer,
        mimetype="application/pdf",
        headers={"Content-Disposition": "attachment; filename=futsal_report.pdf"}
    )

def draw_futsal_pitch_mpl(ax, pitch_length, pitch_width):
    L, W = pitch_length, pitch_width
    gH, gW, penR, penMarkX, ccR, crR = 3, 2, 6, 6, 3, 0.25

    goal_top_y = W / 2 + gH / 2
    goal_bot_y = W / 2 - gH / 2
    c = 'black'
    lw = 1.5

    ax.set_facecolor('#4a7c59')
    ax.set_xlim(-gW, L + gW)
    ax.set_ylim(-1, W + 1)
    ax.set_aspect('equal')
    ax.axis('off')

    ax.add_patch(mpatches.Rectangle((0, 0), L, W, fill=False, edgecolor=c, linewidth=lw))
    ax.plot([L/2, L/2], [0, W], color=c, linewidth=lw)
    ax.add_patch(mpatches.Circle((L/2, W/2), ccR, fill=False, edgecolor=c, linewidth=lw))
    ax.add_patch(mpatches.Circle((L/2, W/2), 0.15, color=c))
    ax.add_patch(mpatches.Circle((penMarkX/2, W/2), 0.15, color=c))
    ax.add_patch(mpatches.Circle((L - penMarkX/2, W/2), 0.15, color=c))

    # Left D-shape (two quarter arcs + vertical line)
    ax.add_patch(mpatches.Arc((0, goal_top_y), 2*penR, 2*penR, theta1=0, theta2=90, color=c, linewidth=lw))
    ax.add_patch(mpatches.Arc((0, goal_bot_y), 2*penR, 2*penR, theta1=-90, theta2=0, color=c, linewidth=lw))
    ax.plot([penMarkX, penMarkX], [goal_bot_y, goal_top_y], color=c, linewidth=lw)

    # Right D-shape
    ax.add_patch(mpatches.Arc((L, goal_top_y), 2*penR, 2*penR, theta1=90, theta2=180, color=c, linewidth=lw))
    ax.add_patch(mpatches.Arc((L, goal_bot_y), 2*penR, 2*penR, theta1=180, theta2=270, color=c, linewidth=lw))
    ax.plot([L-penMarkX, L-penMarkX], [goal_bot_y, goal_top_y], color=c, linewidth=lw)

    # Corner arcs
    ax.add_patch(mpatches.Arc((0, 0), 2*crR, 2*crR, theta1=0, theta2=90, color=c, linewidth=lw))
    ax.add_patch(mpatches.Arc((L, 0), 2*crR, 2*crR, theta1=90, theta2=180, color=c, linewidth=lw))
    ax.add_patch(mpatches.Arc((0, W), 2*crR, 2*crR, theta1=-90, theta2=0, color=c, linewidth=lw))
    ax.add_patch(mpatches.Arc((L, W), 2*crR, 2*crR, theta1=180, theta2=270, color=c, linewidth=lw))

    # Goals
    ax.add_patch(mpatches.Rectangle((-gW, goal_bot_y), gW, gH, fill=False, edgecolor=c, linewidth=lw))
    ax.add_patch(mpatches.Rectangle((L, goal_bot_y), gW, gH, fill=False, edgecolor=c, linewidth=lw))


def create_pdf_report(shots, pitch_length=40, pitch_width=20):
    pdfmetrics.registerFont(TTFont('Vera', 'Vera.ttf'))

    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    pdf.setTitle("Futsal Report")
    PAGE_WIDTH, PAGE_HEIGHT = A4

    # Group shots by player and action type
    player_actions = {}
    for shot in shots:
        player_name = shot["playerName"]
        action_type = shot["action"]
        if player_name not in player_actions:
            player_actions[player_name] = {}
        if action_type not in player_actions[player_name]:
            player_actions[player_name][action_type] = []
        player_actions[player_name][action_type].append(shot)

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
            valid_shots = [
                shot for shot in action_list
                if shot["x"] is not None and shot["y"] is not None
                and shot["x"] != "N/A" and shot["y"] != "N/A"
            ]
            if not valid_shots:
                continue

            if image_count == 7:
                image_count = 1
                ori_height = 6.5
                text_height = 0
                pdf.showPage()
                pdf.setFont("Vera", 18)

            fig, ax = plt.subplots(figsize=(4, 3))
            draw_futsal_pitch_mpl(ax, pitch_length, pitch_width)

            for shot in valid_shots:
                x = float(shot["x"])
                y_coord = pitch_width - float(shot["y"])

                x2_val = shot.get("x2")
                y2_val = shot.get("y2")
                if x2_val not in ("N/A", None) and y2_val not in ("N/A", None):
                    x2 = float(x2_val)
                    y2_coord = pitch_width - float(y2_val)
                    dx = x2 - x
                    dy = y2_coord - y_coord
                    arrow_length_factor = 0.95
                    x2_adj = x + arrow_length_factor * dx
                    y2_adj = y_coord + arrow_length_factor * dy
                    ax.annotate("", xy=(x2_adj, y2_adj), xytext=(x, y_coord),
                                arrowprops=dict(arrowstyle="-|>", color="black", lw=1.5))
                    ax.scatter([x], [y_coord], s=100, color="yellow", edgecolors="black", zorder=5)
                    ax.scatter([x2], [y2_coord], s=100, color="yellow", edgecolors="black", zorder=5)
                else:
                    ax.scatter([x], [y_coord], s=100, color="yellow", edgecolors="black", zorder=5)

            img_buffer = io.BytesIO()
            fig.savefig(img_buffer, format="png", bbox_inches='tight')
            plt.close(fig)
            img_buffer.seek(0)

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
