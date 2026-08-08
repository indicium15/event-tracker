"""Moved verbatim from tennis/routes.py's draw_tennis_court — no math changed.

Court dimensions (meters): 23.77 x 10.97, run-off 6.40m/3.66m. Unlike
badminton, tennis's JS already sends coordinates in meters (no cm->m
conversion needed), so this sport uses the identity coord_transform.
"""

from matplotlib.patches import Rectangle

COURT_LEN_M = 23.77
COURT_WID_M = 10.97
RUNOFF_LEN_M = 6.40
RUNOFF_WID_M = 3.66


def draw_tennis_court(
    ax,
    length=COURT_LEN_M,
    width=COURT_WID_M,
    runoff_len=RUNOFF_LEN_M,
    runoff_wid=RUNOFF_WID_M,
    singles_margin=1.37,
    service_box_len=6.40,
    service_box_height=4.11,
):
    """
    Draw full play surface (court + run-off) with the court rendered inside.
    Coordinates are centered at (0,0), x along length (baseline-to-baseline),
    y along width (sideline-to-sideline) - same as the JS.
    """
    half_len = length / 2.0
    half_wid = width / 2.0
    surf_half_len = half_len + runoff_len
    surf_half_wid = half_wid + runoff_wid

    singles_half_wid = (width - 2.0 * singles_margin) / 2.0

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

    # 3) Net (vertical line at x=0)
    ax.plot([0, 0], [-half_wid, half_wid], color="white", lw=2, zorder=2)

    # 4) Singles sidelines (horizontal lines at ±singles_half_wid)
    ax.plot([-half_len, half_len], [singles_half_wid, singles_half_wid], color="white", lw=2, zorder=2)
    ax.plot([-half_len, half_len], [-singles_half_wid, -singles_half_wid], color="white", lw=2, zorder=2)

    # 5) Baselines (vertical lines at ±half_len)
    ax.plot([-half_len, -half_len], [-half_wid, half_wid], color="white", lw=2, zorder=2)
    ax.plot([half_len, half_len], [-half_wid, half_wid], color="white", lw=2, zorder=2)

    # 6) Center service line (vertical) drawn only across service-box height
    ax.plot([0, 0], [-service_box_height / 2.0, service_box_height / 2.0], color="white", lw=2, zorder=2)

    # 7) Service boxes (net -> service line on each half, bounded by singles lines)
    for y0 in (0, -singles_half_wid):
        h = singles_half_wid
        ax.add_patch(Rectangle(
            (-service_box_len, y0),
            service_box_len, h,
            linewidth=2, edgecolor="white", facecolor="none", zorder=2
        ))
        ax.add_patch(Rectangle(
            (0, y0),
            service_box_len, h,
            linewidth=2, edgecolor="white", facecolor="none", zorder=2
        ))

    ax.set_xticks([])
    ax.set_yticks([])
    for spine in ax.spines.values():
        spine.set_visible(False)

    return ax
