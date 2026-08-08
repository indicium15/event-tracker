"""A routeless Blueprint whose only job is to put shared/templates/ and
shared/static/ on Flask's Jinja/static search paths, so every sport's
template can `{% extends "tracker_base.html" %}` and link
`{{ url_for('shared.static', filename='tracker-common.css') }}`.
"""

from flask import Blueprint

shared_bp = Blueprint(
    "shared",
    __name__,
    template_folder="templates",
    static_folder="static",
    static_url_path="static",  # relative, not "/shared/static" — see blueprint_factory.py's note on doubling
    url_prefix="/shared",
)
