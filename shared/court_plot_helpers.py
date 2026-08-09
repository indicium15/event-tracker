"""Axes helpers for sports that draw with plain matplotlib (not mplsoccer/mplbasketball)."""

import matplotlib.pyplot as plt


def make_ax_figure(drawer):
    def make_figure(kwargs):
        fig, ax = plt.subplots(figsize=(4, 3))
        drawer(ax, **kwargs)
        return fig, ax

    return make_figure


def ax_plot_point(ax, x, y):
    ax.plot(x, y, "o", markersize=8, color="yellow", markeredgecolor="black", zorder=7)


def ax_plot_arrow(ax, x, y, x2, y2):
    ax.arrow(
        x, y, x2 - x, y2 - y,
        length_includes_head=True, head_width=0.6, head_length=1.2,
        fc="black", ec="black", lw=1.5, zorder=6,
    )
    ax_plot_point(ax, x, y)
    ax_plot_point(ax, x2, y2)
