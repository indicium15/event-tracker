"""Coordinate transforms for SportConfig.pdf.coord_transform.

Signature: (shot: dict, extra: dict) -> (x, y, x2 | None, y2 | None)
"""


def _valid(value):
    return value is not None and value != "N/A"


def identity_transform(shot, extra=None):
    x = float(shot["x"])
    y = float(shot["y"])
    x2 = float(shot["x2"]) if _valid(shot.get("x2")) else None
    y2 = float(shot["y2"]) if _valid(shot.get("y2")) else None
    return x, y, x2, y2


def scale_transform(factor):
    """e.g. badminton cm (JS) -> meters (matplotlib)."""

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
    """Flip top-left-origin y into bottom-left-origin drawer space."""

    def transform(shot, extra=None):
        x, y, x2, y2 = identity_transform(shot, extra)
        h = height if height is not None else (extra or {}).get(height_key)
        y = h - y
        if y2 is not None:
            y2 = h - y2
        return x, y, x2, y2

    return transform
