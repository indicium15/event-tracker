"""Builds a sport's Flask Blueprint from a SportConfig.

Recorded events live only in the browser (see static/js/tracker-storage.js —
createTrackerStore's localStorage/sessionStorage-backed store is the
canonical, single source of truth for a session's events). The server is
stateless per request: /download_csv and /download_pdf both receive the
event list straight from the client in the POST body and never persist it.
There used to be an in-memory `shots = []` list plus /add_shot and
/remove_shot routes mirroring that client state into the server process —
no sport's JS ever called them (confirmed by grepping every index.js for
`add_shot`/`remove_shot`/`fetch(`/`.ajax(`), so they were dead code and are
not part of this factory.
"""

from flask import Blueprint, Response, render_template, request

from .csv_builder import build_csv_response
from .pdf_engine import build_pdf_report


def make_sport_blueprint(config, import_name):
    """import_name: pass the caller's __name__ (e.g. "floorball.routes") so
    Flask resolves template_folder/static_folder against that sport's own
    directory rather than shared/'s."""
    bp = Blueprint(
        config.slug,
        import_name,
        template_folder="templates",
        static_folder="static",
        # A *relative* static_url_path (no leading slash) is required here:
        # in Flask 3.1, an absolute one (e.g. "/floorball/static") gets
        # url_prefix prepended again on top of itself, doubling the path to
        # "/floorball/floorball/static/...". That doubled form is what the
        # five sports' original hand-written Blueprint(...) calls all used
        # (self-consistent since every reference went through url_for), but
        # basketball's JS hardcodes the *undoubled* "/basketball/static/..."
        # literally — so it only worked because its original code happened
        # to use this same relative form. Using it everywhere is the fix.
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
