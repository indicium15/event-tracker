"""Reusable coordinate-transform builders for shared/pdf_engine.py.

Every SportConfig.pdf.coord_transform has the signature
    (shot: dict, extra: dict) -> (x, y, x2 | None, y2 | None)
`extra` is whatever PdfConfig.extract_shots returned alongside the shot list
(e.g. futsal's per-request pitch dimensions) — sports that don't need it
just ignore the argument.
"""


def _valid(value):
    return value is not None and value != "N/A"


def identity_transform(shot, extra=None):
    """No scaling/flipping — shot coordinates already match the drawer's space."""
    x = float(shot["x"])
    y = float(shot["y"])
    x2 = float(shot["x2"]) if _valid(shot.get("x2")) else None
    y2 = float(shot["y2"]) if _valid(shot.get("y2")) else None
    return x, y, x2, y2


def scale_transform(factor):
    """E.g. badminton's cm (JS) -> meters (matplotlib) conversion."""

    def transform(shot, extra=None):
        x, y, x2, y2 = identity_transform(shot, extra)
        x *= factor
        y *= factor
        if x2 is not None:
            x2 *= factor
            y2 *= factor
        return x, y, x2, y2

    return transform


def flip_y_transform(height=None, height_key=None):
    """Flip a top-left-origin y into the drawer's bottom-left-origin space.

    Pass a static `height` (football's fixed 68m pitch) or a `height_key` to
    read the height from `extra` at call time (futsal's per-request pitch width).
    """

    def transform(shot, extra=None):
        x, y, x2, y2 = identity_transform(shot, extra)
        h = height if height is not None else (extra or {}).get(height_key)
        y = h - y
        if y2 is not None:
            y2 = h - y2
        return x, y, x2, y2

    return transform
