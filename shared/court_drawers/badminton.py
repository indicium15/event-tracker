from matplotlib.patches import Rectangle

COURT_LEN_M = 13.40
COURT_WID_DOUBLES_M = 6.10
COURT_WID_SINGLES_M = 5.18
RUNOFF_LEN_M = 2.0
RUNOFF_WID_M = 1.5


def draw_badminton_court(
    ax,
    length=COURT_LEN_M,
    width=COURT_WID_DOUBLES_M,
    runoff_len=RUNOFF_LEN_M,
    runoff_wid=RUNOFF_WID_M,
):
    """
    Draw full play surface (court + run-off) with the court rendered inside.
    Coordinates are centered at (0,0), x along length (baseline-to-baseline),
    y along width (sideline-to-sideline) - same as the JS. Always uses
    doubles court dimensions.

    Court dimensions:
    - Length (baseline to baseline): 13.40m
    - Width (sideline to sideline): 6.1m
    - Short service line: 1.98m from net (center at x=0)
    - Long service line: 5.78m from net (1.98m + 3.8m)
    - Singles sidelines: 0.42m from doubles sideline
    """
    half_len = length / 2.0
    half_wid = width / 2.0
    surf_half_len = half_len + runoff_len
    surf_half_wid = half_wid + runoff_wid

    short_service_line = 1.98
    long_service_line = 5.78
    singles_sideline_pos = half_wid - 0.42

    ax.set_xlim(-surf_half_len, surf_half_len)
    ax.set_ylim(-surf_half_wid, surf_half_wid)
    ax.set_aspect("equal")

    # 1) Out-of-court background (dark green)
    surface = Rectangle(
        (-surf_half_len, -surf_half_wid),
        2 * surf_half_len,
        2 * surf_half_wid,
        facecolor="#0b5d2a",
        edgecolor="none",
        zorder=0,
    )
    ax.add_patch(surface)

    # 2) Court rectangle (lighter green) + white border (doubles lines/baselines)
    court = Rectangle(
        (-half_len, -half_wid),
        2 * half_len,
        2 * half_wid,
        facecolor="#008000",
        edgecolor="white",
        linewidth=2,
        zorder=1,
    )
    ax.add_patch(court)

    # 3) Net (vertical line at x=0, center of court)
    ax.plot([0, 0], [-half_wid, half_wid], color="white", lw=2, linestyle='--', zorder=2)

    # 4) Singles sidelines
    ax.plot([-half_len, half_len], [singles_sideline_pos, singles_sideline_pos], color="white", lw=2, zorder=2)
    ax.plot([-half_len, half_len], [-singles_sideline_pos, -singles_sideline_pos], color="white", lw=2, zorder=2)

    # 5) Baselines
    ax.plot([-half_len, -half_len], [-half_wid, half_wid], color="white", lw=2, zorder=2)
    ax.plot([half_len, half_len], [-half_wid, half_wid], color="white", lw=2, zorder=2)

    # 6) Short service lines
    ax.plot([short_service_line, short_service_line], [-half_wid, half_wid], color="white", lw=2, zorder=2)
    ax.plot([-short_service_line, -short_service_line], [-half_wid, half_wid], color="white", lw=2, zorder=2)

    # 7) Long service lines
    ax.plot([long_service_line, long_service_line], [-half_wid, half_wid], color="white", lw=2, zorder=2)
    ax.plot([-long_service_line, -long_service_line], [-half_wid, half_wid], color="white", lw=2, zorder=2)

    # 8) Center line (horizontal line dividing service courts, at y=0)
    ax.plot([-long_service_line, -short_service_line], [0, 0], color="white", lw=2, zorder=2)
    ax.plot([short_service_line, long_service_line], [0, 0], color="white", lw=2, zorder=2)

    ax.set_xticks([])
    ax.set_yticks([])
    for spine in ax.spines.values():
        spine.set_visible(False)

    return ax
