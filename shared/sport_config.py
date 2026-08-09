"""Registry of sports used by app.py, home.html, and blueprint_factory."""

from dataclasses import dataclass, field
from typing import Any, Callable, Optional

from shared import coord_transforms
from shared.court_drawers import floorball as floorball_court
from shared.court_drawers import football as football_court
from shared.court_drawers import futsal as futsal_court
from shared.court_drawers import basketball as basketball_court
from shared.court_drawers import tennis as tennis_court
from shared.court_drawers import badminton as badminton_court
from shared.court_drawers import netball as netball_court
from shared.court_plot_helpers import ax_plot_arrow, ax_plot_point, make_ax_figure


def _default_group_key(shot):
    return shot["action"]


def _default_group_label(group_key, shots):
    return group_key


def _default_group_kwargs(group_key, shots):
    return {}


def _default_extract_shots(payload):
    return payload, {}


def _futsal_extract_shots(payload):
    shots = payload.get("shots", [])
    extra = {
        "pitch_length": payload.get("pitchLength", 40),
        "pitch_width": payload.get("pitchWidth", 20),
    }
    return shots, extra


@dataclass
class PdfConfig:
    make_figure: Callable[[dict], tuple]
    plot_point: Callable[[Any, float, float], None]
    plot_arrow: Callable[[Any, float, float, float, float], None]
    court_kwargs: dict = field(default_factory=dict)
    coord_transform: Callable[[dict, dict], tuple] = coord_transforms.identity_transform
    group_key: Callable[[dict], str] = _default_group_key
    group_label: Callable[[str, list], str] = _default_group_label
    group_kwargs: Callable[[str, list], dict] = _default_group_kwargs
    extract_shots: Callable[[Any], tuple] = _default_extract_shots


@dataclass
class SportConfig:
    slug: str
    display_name: str
    preview_image: Optional[str] = None

    template_name: Optional[str] = None

    csv_fieldnames: Optional[list] = None
    csv_filename: str = "shots_data.csv"
    csv_extrasaction: str = "raise"
    pdf_filename: str = "report.pdf"

    pdf: Optional[PdfConfig] = None

    storage_prefix: Optional[str] = None
    storage_extra_keys: list = field(default_factory=list)
    roster_size: Optional[int] = None
    default_event_names: Optional[list] = None
    cumulative_stats: Optional[dict] = None
    grip_outcome: bool = False

    dimensions: Optional[dict] = None

    has_favicon: bool = True


SPORTS: dict = {
    "tennis": SportConfig(
        slug="tennis",
        display_name="Tennis",
        preview_image="tennis-preview.png",
        template_name="tennis_index.html",
        csv_fieldnames=["time", "player", "playerName", "grip", "action", "outcome", "x", "y", "x2", "y2"],
        csv_filename="shots_data.csv",
        pdf_filename="report.pdf",
        grip_outcome=True,
        dimensions={
            "length": tennis_court.COURT_LEN_M, "width": tennis_court.COURT_WID_M,
            "runoff_len": tennis_court.RUNOFF_LEN_M, "runoff_wid": tennis_court.RUNOFF_WID_M,
        },
        pdf=PdfConfig(
            make_figure=make_ax_figure(tennis_court.draw_tennis_court),
            plot_point=ax_plot_point,
            plot_arrow=ax_plot_arrow,
            coord_transform=coord_transforms.identity_transform,
        ),
    ),
    "badminton": SportConfig(
        slug="badminton",
        display_name="Badminton",
        preview_image="badminton-preview.png",
        template_name="badminton_index.html",
        csv_fieldnames=["time", "player", "playerName", "grip", "action", "outcome", "x", "y", "x2", "y2"],
        csv_filename="shots_data.csv",
        pdf_filename="report.pdf",
        grip_outcome=True,
        dimensions={
            "length": badminton_court.COURT_LEN_M, "width": badminton_court.COURT_WID_DOUBLES_M,
            "runoff_len": badminton_court.RUNOFF_LEN_M, "runoff_wid": badminton_court.RUNOFF_WID_M,
        },
        pdf=PdfConfig(
            make_figure=make_ax_figure(badminton_court.draw_badminton_court),
            plot_point=ax_plot_point,
            plot_arrow=ax_plot_arrow,
            coord_transform=coord_transforms.scale_transform(1.0 / 100.0),  # JS uses cm
        ),
    ),
    "football": SportConfig(
        slug="football",
        display_name="Football",
        preview_image="football-preview.png",
        template_name="football_index.html",
        csv_fieldnames=["time", "player", "playerName", "action", "x", "y", "x2", "y2", "xG", "xSave"],
        csv_filename="shots_data.csv",
        pdf_filename="report.pdf",
        dimensions={"length": 105, "width": 68},
        pdf=PdfConfig(
            make_figure=football_court.make_figure,
            plot_point=football_court.plot_point,
            plot_arrow=football_court.plot_arrow,
            court_kwargs={"pitch_length": 105, "pitch_width": 68},
            coord_transform=coord_transforms.flip_y_transform(height=68),
        ),
    ),
    "futsal": SportConfig(
        slug="futsal",
        display_name="Futsal",
        preview_image="futsal-preview.png",
        template_name="futsal_index.html",
        csv_fieldnames=["time", "player", "playerName", "action", "x", "y", "x2", "y2"],
        csv_filename="futsal_events.csv",
        csv_extrasaction="ignore",
        pdf_filename="futsal_report.pdf",
        has_favicon=False,
        dimensions={"length": 40, "width": 20},
        pdf=PdfConfig(
            make_figure=make_ax_figure(futsal_court.draw_futsal_pitch_mpl),
            plot_point=ax_plot_point,
            plot_arrow=ax_plot_arrow,
            court_kwargs={"pitch_length": 40, "pitch_width": 20},
            coord_transform=coord_transforms.flip_y_transform(height_key="pitch_width"),
            extract_shots=_futsal_extract_shots,
        ),
    ),
    "floorball": SportConfig(
        slug="floorball",
        display_name="Floorball",
        preview_image="floorball-preview.png",
        template_name="floorball_index.html",
        csv_fieldnames=["time", "player", "playerName", "action", "x", "y", "x2", "y2"],
        csv_filename="shots_data.csv",
        pdf_filename="report.pdf",
        dimensions={"length": 40, "width": 20},
        pdf=PdfConfig(
            make_figure=make_ax_figure(floorball_court.draw_floorball_pitch),
            plot_point=ax_plot_point,
            plot_arrow=ax_plot_arrow,
            court_kwargs={"pitch_length": 40, "pitch_width": 20},
            coord_transform=coord_transforms.identity_transform,
        ),
    ),
    "basketball": SportConfig(
        slug="basketball",
        display_name="Basketball",
        preview_image="basketball-preview.png",
        template_name="basketball_index.html",
        csv_fieldnames=["time", "player", "playerName", "action", "x", "y", "x2", "y2", "courtType"],
        csv_filename="shots_data.csv",
        pdf_filename="report.pdf",
        storage_extra_keys=["basketballCourtType"],
        dimensions={
            "nba": {"length": 28.6512, "width": 15.24},
            "wnba": {"length": 28.6512, "width": 15.24},
            "ncaa": {"length": 28.6512, "width": 15.24},
            "fiba": {"length": 28.0, "width": 15.0},
        },
        pdf=PdfConfig(
            make_figure=basketball_court.make_figure,
            plot_point=basketball_court.plot_point,
            plot_arrow=basketball_court.plot_arrow,
            coord_transform=coord_transforms.identity_transform,
            group_key=basketball_court.group_key,
            group_label=basketball_court.group_label,
            group_kwargs=basketball_court.group_kwargs,
        ),
    ),
    "netball": SportConfig(
        slug="netball",
        display_name="Netball",
        template_name="netball_index.html",
        csv_fieldnames=["time", "player", "playerName", "action", "x", "y", "x2", "y2"],
        csv_filename="shots_data.csv",
        pdf_filename="report.pdf",
        has_favicon=False,
        dimensions={"length": 30.5, "width": 15.25},
        pdf=PdfConfig(
            make_figure=make_ax_figure(netball_court.draw_netball_court),
            plot_point=ax_plot_point,
            plot_arrow=ax_plot_arrow,
            court_kwargs={"court_length": 30.5, "court_width": 15.25},
            coord_transform=coord_transforms.identity_transform,
        ),
    ),
}
