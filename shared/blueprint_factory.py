"""Build a sport Flask Blueprint from a SportConfig.

Events live in the browser (tracker-storage.js). CSV/PDF routes take the shot
list from the POST body and do not persist server-side state.
"""

from flask import Blueprint, Response, render_template, request

from .csv_builder import build_csv_response
from .pdf_engine import build_pdf_report


def make_sport_blueprint(config, import_name):
    """import_name should be the caller's __name__ (e.g. "floorball.routes")."""
    bp = Blueprint(
        config.slug,
        import_name,
        template_folder="templates",
        static_folder="static",
        # Relative path required: Flask 3.1 prepends url_prefix to absolute
        # static_url_path, doubling it (e.g. /floorball/floorball/static/...).
        static_url_path="static",
        url_prefix=f"/{config.slug}",
    )

    @bp.route("/")
    def index():
        return render_template(config.template_name, sport=config)

    @bp.route("/download_csv", methods=["POST"])
    def download_csv():
        return build_csv_response(request.json, config)

    @bp.route("/download_pdf", methods=["POST"])
    def download_pdf():
        pdf_buffer = build_pdf_report(request.json, config)
        return Response(
            pdf_buffer,
            mimetype="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={config.pdf_filename}"},
        )

    return bp
