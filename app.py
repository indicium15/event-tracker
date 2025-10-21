from flask import Flask, redirect, url_for, render_template
from football.routes import bp as football_bp
from floorball.routes import bp as floorball_bp
from tennis.routes import bp as tennis_bp
from basketball.routes import bp as basketball_bp
# from badminton.routes import bp as badminton_bp

def create_app():
    app = Flask(__name__)

    # Register blueprints
    app.register_blueprint(football_bp)
    app.register_blueprint(floorball_bp)
    app.register_blueprint(tennis_bp)
    app.register_blueprint(basketball_bp)
    # app.register_blueprint(badminton_bp)

    @app.route("/football")
    def football():
        return redirect(url_for("football.index"))

    @app.route("/floorball")
    def floorball():
        return redirect(url_for("floorball.index"))

    @app.route("/tennis")
    def tennis():
        return redirect(url_for("tennis.index"))
    
    @app.route("/basketball")
    def basketball():
        return redirect(url_for("basketball.index"))
    
    @app.route("/")
    def home():
        return render_template("home.html")

    return app


# --- WSGI entrypoint ---
app = create_app()

if __name__ == "__main__":
    app.run(debug=True)
