from flask import Flask, render_template, request, jsonify, Response
import csv
import io

app = Flask(__name__)

@app.route('/')
def index():
    # Render the main page with the shots data
    return render_template('index.html')

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

@app.route('/download_csv', methods=['POST'])
def download_csv():
    # Retrieve shot data from the request's JSON payload
    shots = request.json

    # Create a buffer to hold the CSV data
    proxy = io.StringIO()

    # Create a CSV writer object using the buffer as the file
    fieldnames = ['time', 'player', 'action', 'x', 'y', 'x2', 'y2', 'xG', 'xSave']
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
        mimetype='text/csv',
        headers={"Content-Disposition": "attachment;filename=shots_data.csv"}
    )


if __name__ == '__main__':
    app.run(debug=True)
