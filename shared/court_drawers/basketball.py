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
