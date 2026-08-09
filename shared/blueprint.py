"""Routeless blueprint that exposes shared/templates and shared/static."""

from flask import Blueprint

shared_bp = Blueprint(
    "shared",
    __name__,
    template_folder="templates",
    static_folder="static",
    static_url_path="static",
    url_prefix="/shared",
)
