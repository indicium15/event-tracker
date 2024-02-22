from flask import Flask, render_template, request, jsonify, send_from_directory, abort
import csv
import os

app = Flask(__name__)

# This will store our shots data
shots = []

@app.route('/')
def index():
    # Render the main page with the shots data
    return render_template('index.html', shots=shots)

@app.route('/add_shot', methods=['POST'])
def add_shot():
    # Get data from the request
    data = request.json
    # Add the new shot to our shots list
    shots.append(data)
    print(shots)
    # You might want to add some validation and error handling here
    return jsonify({"message":"Shot added succesfully"})

@app.route('/remove_shot', methods=['POST'])
def remove_shot():
    data = request.json
    # Find the shot in the list of shots and remove it
    global shots
    shots = [shot for shot in shots if not (shot['x'] == data['x'] and shot['y'] == data['y'] and shot['action'] == data['action'] and shot['player'] == data['player'])]
    print(shots)
    return jsonify({"success": True, "message": "Shot removed successfully"})

@app.route('/export_csv', methods=['GET'])
def export_csv():
    # Logic to export the shots data as a CSV file
    # Send the CSV file to the browser
    csv_filename = 'shots_data.csv'
    # Create CSV file
    with open(csv_filename, 'w', newline='') as csvfile:
        fieldnames = ['x', 'y', 'action', 'player']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

        writer.writeheader()
        for shot in shots:
            writer.writerow(shot)

    # Send the CSV file to the browser
    try:
        return send_from_directory(directory=os.getcwd(),
                               path="shots_data.csv",
                               as_attachment=True)
    except FileNotFoundError:
        abort(404)

if __name__ == '__main__':
    app.run(debug=True)
