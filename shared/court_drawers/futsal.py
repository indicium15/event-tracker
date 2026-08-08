"""Moved verbatim from futsal/routes.py's draw_futsal_pitch_mpl — no math
changed, just relocated so the shared PDF engine can call it via
SportConfig.pdf.make_figure (wrapped through court_plot_helpers.make_ax_figure).

Futsal is the only sport with runtime-adjustable pitch dimensions (chosen by
the user in the UI, carried through the /download_pdf POST body) — see
extract_shots on this sport's SportConfig entry.
"""

import matplotlib.patches as mpatches


def draw_futsal_pitch_mpl(ax, pitch_length, pitch_width):
    L, W = pitch_length, pitch_width
    gH, gW, penR, penMarkX, ccR, crR = 3, 2, 6, 6, 3, 0.25

    goal_top_y = W / 2 + gH / 2
    goal_bot_y = W / 2 - gH / 2
    c = 'black'
    lw = 1.5

    ax.set_facecolor('#4a7c59')
    ax.set_xlim(-gW, L + gW)
    ax.set_ylim(-1, W + 1)
    ax.set_aspect('equal')
    ax.axis('off')

    ax.add_patch(mpatches.Rectangle((0, 0), L, W, fill=False, edgecolor=c, linewidth=lw))
    ax.plot([L/2, L/2], [0, W], color=c, linewidth=lw)
    ax.add_patch(mpatches.Circle((L/2, W/2), ccR, fill=False, edgecolor=c, linewidth=lw))
    ax.add_patch(mpatches.Circle((L/2, W/2), 0.15, color=c))
    ax.add_patch(mpatches.Circle((penMarkX/2, W/2), 0.15, color=c))
    ax.add_patch(mpatches.Circle((L - penMarkX/2, W/2), 0.15, color=c))

    # Left D-shape (two quarter arcs + vertical line)
    ax.add_patch(mpatches.Arc((0, goal_top_y), 2*penR, 2*penR, theta1=0, theta2=90, color=c, linewidth=lw))
    ax.add_patch(mpatches.Arc((0, goal_bot_y), 2*penR, 2*penR, theta1=-90, theta2=0, color=c, linewidth=lw))
    ax.plot([penMarkX, penMarkX], [goal_bot_y, goal_top_y], color=c, linewidth=lw)

    # Right D-shape
    ax.add_patch(mpatches.Arc((L, goal_top_y), 2*penR, 2*penR, theta1=90, theta2=180, color=c, linewidth=lw))
    ax.add_patch(mpatches.Arc((L, goal_bot_y), 2*penR, 2*penR, theta1=180, theta2=270, color=c, linewidth=lw))
    ax.plot([L-penMarkX, L-penMarkX], [goal_bot_y, goal_top_y], color=c, linewidth=lw)

    # Corner arcs
    ax.add_patch(mpatches.Arc((0, 0), 2*crR, 2*crR, theta1=0, theta2=90, color=c, linewidth=lw))
    ax.add_patch(mpatches.Arc((L, 0), 2*crR, 2*crR, theta1=90, theta2=180, color=c, linewidth=lw))
    ax.add_patch(mpatches.Arc((0, W), 2*crR, 2*crR, theta1=-90, theta2=0, color=c, linewidth=lw))
    ax.add_patch(mpatches.Arc((L, W), 2*crR, 2*crR, theta1=180, theta2=270, color=c, linewidth=lw))

    # Goals
    ax.add_patch(mpatches.Rectangle((-gW, goal_bot_y), gW, gH, fill=False, edgecolor=c, linewidth=lw))
    ax.add_patch(mpatches.Rectangle((L, goal_bot_y), gW, gH, fill=False, edgecolor=c, linewidth=lw))
