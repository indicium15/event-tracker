from matplotlib.patches import Circle, Rectangle, Wedge

COURT_LEN_M = 30.5
COURT_WID_M = 15.25
GOAL_CIRCLE_R_M = 4.9
CENTER_CIRCLE_R_M = 0.9

def draw_netball_court(ax, court_length=COURT_LEN_M, court_width=COURT_WID_M):
    half_len = court_length / 2
    half_wid = court_width / 2

    ax.set_xlim(-half_len, half_len)
    ax.set_ylim(-half_wid, half_wid)
    ax.set_aspect("equal")

    court = Rectangle(
        (-half_len, -half_wid), court_length, court_width,
        facecolor="#2e7d32", edgecolor="white", linewidth=2, zorder=0,
    )
    ax.add_patch(court)

    third_x = half_len - (court_length / 3)
    for x in (-third_x, third_x):
        ax.plot([x, x], [-half_wid, half_wid], color="white", lw=1.5, zorder=1)

    ax.add_patch(Circle((0, 0), CENTER_CIRCLE_R_M, facecolor="none", edgecolor="white", lw=1.5, zorder=1))

    ax.add_patch(Wedge((-half_len, 0), GOAL_CIRCLE_R_M, -90, 90, facecolor="none", edgecolor="white", lw=1.5, zorder=1))
    ax.add_patch(Wedge((half_len, 0), GOAL_CIRCLE_R_M, 90, 270, facecolor="none", edgecolor="white", lw=1.5, zorder=1))

    ax.set_xticks([])
    ax.set_yticks([])
    for spine in ax.spines.values():
        spine.set_visible(False)

    return ax
