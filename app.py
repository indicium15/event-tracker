from flask import Flask, redirect, url_for, render_template, Response, request
from datetime import datetime
from football.routes import bp as football_bp
from floorball.routes import bp as floorball_bp
from tennis.routes import bp as tennis_bp
from basketball.routes import bp as basketball_bp
from badminton.routes import bp as badminton_bp
from futsal.routes import bp as futsal_bp
from shared.sport_config import SPORTS
from shared.blueprint import shared_bp

BLUEPRINTS = {
    "football": football_bp,
    "floorball": floorball_bp,
    "tennis": tennis_bp,
    "basketball": basketball_bp,
    "badminton": badminton_bp,
    "futsal": futsal_bp,
}

def create_app():
    app = Flask(__name__)

    # Routeless blueprint exposing shared/templates and shared/static
    # (tracker_base.html, tracker-common.css, tracker-core.js) to every sport.
    app.register_blueprint(shared_bp)

    # Register one blueprint per entry in the SPORTS registry.
    for slug in SPORTS:
        app.register_blueprint(BLUEPRINTS[slug])

    # Legacy /<sport> -> /<sport>/ redirects, one per registry entry.
    for slug in SPORTS:
        app.add_url_rule(
            f"/{slug}",
            endpoint=f"redirect_{slug}",
            view_func=lambda slug=slug: redirect(url_for(f"{slug}.index")),
        )

    @app.route("/")
    def home():
        return render_template("home.html", sports=SPORTS.values())

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
        routes = [{'loc': base_url, 'priority': '1.0', 'changefreq': 'daily'}] + [
            {'loc': f'{base_url}/{slug}', 'priority': '0.8', 'changefreq': 'weekly'}
            for slug in SPORTS
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
    app.run(debug=True, port=5001)
