from matplotlib.patches import FancyBboxPatch, Rectangle


def draw_floorball_pitch(ax, pitch_length=40, pitch_width=20, corner_radius=2):
    half_len = pitch_length / 2
    half_wid = pitch_width / 2

    # 1) new origin centered at (0,0)
    ax.set_xlim(-half_len, half_len)
    ax.set_ylim(-half_wid, half_wid)
    ax.set_aspect("equal")

    # 2) rounded background from bottom‑left = (−half_len, −half_wid)
    background = FancyBboxPatch(
        (-half_len, -half_wid),
        pitch_length,
        pitch_width,
        boxstyle=f"round,pad=0,rounding_size={corner_radius}",
        facecolor="#1e3f66",
        edgecolor="none",
        zorder=0,
    )
    ax.add_patch(background)

    # 3) outer boundary
    outer = FancyBboxPatch(
        (-half_len, -half_wid),
        pitch_length,
        pitch_width,
        boxstyle=f"round,pad=0,rounding_size={corner_radius}",
        linewidth=2,
        edgecolor="white",
        facecolor="none",
        zorder=1,
    )
    ax.add_patch(outer)

    # 4) center line at x=0
    ax.plot([0, 0], [-half_wid, half_wid], color="white", lw=2, zorder=2)

    # 5) goal areas (still 5×4), centered vertically around y=0
    goal_w, goal_h = 5, 4
    goal_y = -goal_h / 2
    left_goal = Rectangle(
        (-half_len + 3.5, goal_y), goal_w, goal_h,
        linewidth=2, edgecolor="white", facecolor="none", zorder=3
    )
    right_goal = Rectangle(
        (half_len - 3.5 - goal_w, goal_y), goal_w, goal_h,
        linewidth=2, edgecolor="white", facecolor="none", zorder=3
    )
    ax.add_patch(left_goal)
    ax.add_patch(right_goal)

    # 6) inner goals
    inner_w, inner_h = goal_w * 0.6, goal_h * 0.6
    inner_y_off = (goal_h - inner_h) / 2
    left_inner = Rectangle(
        (-half_len + 3.5 + (goal_w - inner_w) / 2, goal_y + inner_y_off),
        inner_w, inner_h,
        linewidth=1, edgecolor="white", facecolor="none", zorder=4
    )
    right_inner = Rectangle(
        (half_len - 3.5 - goal_w + (goal_w - inner_w) / 2, goal_y + inner_y_off),
        inner_w, inner_h,
        linewidth=1, edgecolor="white", facecolor="none", zorder=4
    )
    ax.add_patch(left_inner)
    ax.add_patch(right_inner)

    # 7) center spot at (0,0)
    ax.plot(0, 0, "o", markersize=4, color="white", zorder=5)

    # 8) plus‑markers at exactly your new coords
    #    margin_x = half_len - 3.5 = 20 - 3.5 = 16.5
    #    margin_y = half_wid - 1.5 = 10 - 1.5 = 8.5
    mx, my = half_len - 3.5, half_wid - 1.5
    plus_coords = [
        (-mx, my),  # top‑left
        (0, my),  # top‑centre
        (mx, my),  # top‑right
        (-mx, -my),  # bottom‑left
        (0, -my),  # bottom‑centre
        (mx, -my),  # bottom‑right
    ]
    for x, y in plus_coords:
        ax.text(x, y, "+", fontsize=12, fontweight="bold",
                ha="center", va="center", color="white", zorder=6)

    # 9) clean up
    ax.set_xticks([])
    ax.set_yticks([])
    for spine in ax.spines.values():
        spine.set_visible(False)

    return ax
