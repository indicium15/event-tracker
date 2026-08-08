"""mplbasketball wrapper for basketball's PDF court — moved from
basketball/routes.py. Court.draw() returns a plain Axes (no bound
scatter()/arrows() methods like mplsoccer), so plotting happens directly on
the Axes, but the arrow styling (ax.annotate with arrowstyle='->') differs
from the other hand-drawn sports' ax.arrow() so it's kept sport-specific here
rather than reused from court_plot_helpers.

Basketball also needs its own grouping: each shot carries its own courtType
(nba/wnba/ncaa/fiba), so shots are grouped by action+courtType (one Court
instance per group) while the image label displayed is just the action.
The dead court_widths/court_heights lookup dicts and unused `from mplsoccer
import Pitch` import from the original routes.py were dropped — they were
computed but never read.
"""

from mplbasketball import Court


def make_figure(kwargs):
    court_type = kwargs.get("court_type", "nba")
    court = Court(court_type=court_type, origin="bottom-left", units="m")
    fig, ax = court.draw()
    return fig, ax


def plot_point(ax, x, y):
    ax.scatter(x, y, s=100, color="yellow", edgecolors="black")


def plot_arrow(ax, x, y, x2, y2):
    # Shorten the arrow slightly so the head doesn't sit exactly on the end point.
    arrow_length_factor = 0.95
    x2_adj = x + arrow_length_factor * (x2 - x)
    y2_adj = y + arrow_length_factor * (y2 - y)
    ax.annotate("", xy=(x2_adj, y2_adj), xytext=(x, y),
                arrowprops=dict(arrowstyle="->", color="black", lw=2))
    plot_point(ax, x, y)
    plot_point(ax, x2, y2)


def group_key(shot):
    return f'{shot["action"]}_{shot.get("courtType", "nba")}'


def group_label(key, shots):
    return shots[0]["action"]


def group_kwargs(key, shots):
    return {"court_type": shots[0].get("courtType", "nba")}
