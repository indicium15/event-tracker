from flask import Flask, redirect, url_for, render_template, Response, request
from datetime import datetime
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

    @app.route("/robots.txt")
    def robots_txt():
        """Serve robots.txt file"""
        robots_content = """
            User-agent: *
            Allow: /
            Disallow: /static/
        """
        return Response(robots_content, mimetype='text/plain')

    @app.route("/sitemap.xml")
    def sitemap_xml():
        """Generate sitemap.xml with all routes"""
        base_url = request.url_root.rstrip('/')
        
        # Get current date in W3C format
        current_date = datetime.now().strftime('%Y-%m-%d')
        
        # Define all routes with their priorities and change frequencies
        routes = [
            {'loc': base_url, 'priority': '1.0', 'changefreq': 'daily'},
            {'loc': f'{base_url}/football', 'priority': '0.8', 'changefreq': 'weekly'},
            {'loc': f'{base_url}/floorball', 'priority': '0.8', 'changefreq': 'weekly'},
            {'loc': f'{base_url}/tennis', 'priority': '0.8', 'changefreq': 'weekly'},
            {'loc': f'{base_url}/basketball', 'priority': '0.8', 'changefreq': 'weekly'},
        ]
        
        # Generate XML sitemap
        sitemap_xml_content = '<?xml version="1.0" encoding="UTF-8"?>\n'
        sitemap_xml_content += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        
        for route in routes:
            sitemap_xml_content += '  <url>\n'
            sitemap_xml_content += f'    <loc>{route["loc"]}</loc>\n'
            sitemap_xml_content += f'    <lastmod>{current_date}</lastmod>\n'
            sitemap_xml_content += f'    <changefreq>{route["changefreq"]}</changefreq>\n'
            sitemap_xml_content += f'    <priority>{route["priority"]}</priority>\n'
            sitemap_xml_content += '  </url>\n'
        
        sitemap_xml_content += '</urlset>'
        return Response(sitemap_xml_content, mimetype='application/xml')

    return app


# --- WSGI entrypoint ---
app = create_app()

if __name__ == "__main__":
    app.run(debug=True)
