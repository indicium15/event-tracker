from datetime import date, timedelta
from flask import Flask, render_template

app = Flask(__name__)

OLD_URL = "https://splxgoal-jkomar.pythonanywhere.com/"
NEW_URL = "https://event-tracking-jkomar.pythonanywhere.com/"
FOOTBALL_URL = "https://event-tracking-jkomar.pythonanywhere.com/football/"
REDIRECT_DELAY_SECONDS = 10  # redirect after page fully loads (handled via JS)

@app.route("/")
def index():
    # Plain-language promise for regular users; show a concrete "until" date (30 days from today)
    display_until = "15th November 2025"
    return render_template(
        "index.html",
        old_url=OLD_URL,
        new_url=NEW_URL,
        football_url=FOOTBALL_URL,
        delay=REDIRECT_DELAY_SECONDS,
        display_until=display_until,
    )

if __name__ == "__main__":
    app.run(debug=True)
