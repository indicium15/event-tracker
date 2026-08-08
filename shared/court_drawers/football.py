"""mplsoccer wrapper for football's PDF pitch — moved from football/routes.py.

Unlike the hand-drawn court sports, mplsoccer.Pitch owns figure creation and
exposes its own scatter()/arrows() plotting methods bound to the pitch's
coordinate system, so this supplies make_figure/plot_point/plot_arrow
directly rather than going through shared/court_plot_helpers.py's
plain-Axes helpers.
"""

from mplsoccer import Pitch


def make_figure(kwargs):
    pitch = Pitch(
        pitch_type="custom",
        pitch_length=kwargs.get("pitch_length", 105),
        pitch_width=kwargs.get("pitch_width", 68),
    )
    fig, ax = pitch.draw(figsize=(4, 3))
    return fig, (pitch, ax)


def plot_point(ctx, x, y):
    pitch, ax = ctx
    pitch.scatter(x, y, s=100, color="yellow", edgecolors="black", ax=ax)


def plot_arrow(ctx, x, y, x2, y2):
    pitch, ax = ctx
    # Shorten the arrow slightly so the head doesn't sit exactly on the end point.
    arrow_length_factor = 0.95
    x2_adj = x + arrow_length_factor * (x2 - x)
    y2_adj = y + arrow_length_factor * (y2 - y)
    pitch.arrows(x, y, x2_adj, y2_adj, width=2, headwidth=5, color="black", ax=ax)
    pitch.scatter(x, y, s=100, color="yellow", edgecolors="black", ax=ax)
    pitch.scatter(x2, y2, s=100, color="yellow", edgecolors="black", ax=ax)
