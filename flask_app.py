from flask import Flask, render_template, request, jsonify, Response, send_file
import csv
import io
import matplotlib.pyplot as plt
from mplsoccer import Pitch
from reportlab.pdfgen import canvas
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.lib.utils import ImageReader
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase.pdfmetrics import stringWidth

app = Flask(__name__)
plt.switch_backend('Agg') 

@app.route("/")
def index():
    # Render the main page with the shots data
    return render_template("index.html")


@app.route("/add_shot", methods=["POST"])
def add_shot():
    # Get data from the request
    data = request.json
    # Add the new shot to our shots list
    shots.append(data)
    # print(shots)
    return jsonify({"message": "Shot added succesfully"})


@app.route("/remove_shot", methods=["POST"])
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


@app.route("/download_csv", methods=["POST"])
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
        "xG",
        "xSave",
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


@app.route("/download_pdf", methods=["POST"])
def download_pdf():
    shots = request.json

    # Create the PDF file in-memory
    pdf_buffer = create_pdf_report(shots)

    return send_file(
        pdf_buffer,
        mimetype="application/pdf",
        as_attachment=True,
        download_name="report.pdf",
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

            for shot in action_list:
                x, y = float(shot["x"]), 68 - float(shot["y"])  # Adjust y-coordinate

                # Check if x2 and y2 exist and are not 'N/A'
                if shot["x2"] != "N/A" and shot["y2"] != "N/A":
                    x2, y2 = float(shot["x2"]), 68 - float(shot["y2"])  # Adjust y2-coordinate
                    # Draw an arrow from (x, y) to (x2, y2)
                    pitch.arrows(x, y, x2, y2, width=2, headwidth=5, color="yellow", ax=ax)
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


if __name__ == "__main__":
    app.run(debug=True)
