"""Shared PDF report builder parameterized by SportConfig.pdf."""

import io

import matplotlib.pyplot as plt
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

plt.switch_backend("Agg")

_font_registered = False


def _ensure_font_registered():
    global _font_registered
    if not _font_registered:
        pdfmetrics.registerFont(TTFont("Vera", "Vera.ttf"))
        _font_registered = True


def _has_valid_coord(value):
    return value is not None and value != "N/A"


def build_pdf_report(payload, config):
    """Build a PDF from POST /<sport>/download_pdf JSON. Returns a seeked BytesIO."""
    pdf_cfg = config.pdf
    _ensure_font_registered()

    shots, extra_kwargs = pdf_cfg.extract_shots(payload)
    court_kwargs = {**pdf_cfg.court_kwargs, **extra_kwargs}

    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    pdf.setTitle(f"{config.display_name} Report")
    PAGE_WIDTH, PAGE_HEIGHT = A4

    player_groups = {}
    for shot in shots:
        player_name = shot["playerName"]
        key = pdf_cfg.group_key(shot)
        player_groups.setdefault(player_name, {}).setdefault(key, []).append(shot)

    for player, groups in player_groups.items():
        pdf.setFont("Vera", 18)
        title_y = PAGE_HEIGHT - 50
        player_name_text = f"{player}'s Statistics"
        text_width = stringWidth(player_name_text, "Vera", 18)
        pdf.drawString((PAGE_WIDTH - text_width) / 2.0, title_y, player_name_text)

        image_count = 1
        ori_height = 6.5
        text_height = 0

        for group_key, shot_list in groups.items():
            valid_shots = [
                s for s in shot_list
                if _has_valid_coord(s.get("x")) and _has_valid_coord(s.get("y"))
            ]
            if not valid_shots:
                continue

            if image_count == 7:
                image_count = 1
                ori_height = 6.5
                text_height = 0
                pdf.showPage()
                pdf.setFont("Vera", 18)

            label = pdf_cfg.group_label(group_key, valid_shots)
            figure_kwargs = {**court_kwargs, **pdf_cfg.group_kwargs(group_key, valid_shots)}
            fig, plot_ctx = pdf_cfg.make_figure(figure_kwargs)

            for shot in valid_shots:
                x, y, x2, y2 = pdf_cfg.coord_transform(shot, extra_kwargs)
                if x2 is not None and y2 is not None:
                    pdf_cfg.plot_arrow(plot_ctx, x, y, x2, y2)
                else:
                    pdf_cfg.plot_point(plot_ctx, x, y)

            img_buffer = io.BytesIO()
            fig.savefig(img_buffer, format="png", bbox_inches="tight")
            plt.close(fig)
            img_buffer.seek(0)

            if image_count % 2 != 0:
                x_pos = (PAGE_WIDTH / 4.0) - 125
            else:
                x_pos = ((PAGE_WIDTH / 4.0) * 3) - 125
            text_x_pos = x_pos + 125 - (pdf.stringWidth(label, "Vera", 15) / 2)

            y_pos = (PAGE_HEIGHT / 10) * ori_height
            text_y_pos = (PAGE_HEIGHT / 10.5) * (ori_height - text_height)
            image = ImageReader(img_buffer)

            max_w, max_h = 250.0, 200.0
            img_w, img_h = image.getSize()
            scale = min(max_w / img_w, max_h / img_h)
            draw_w, draw_h = img_w * scale, img_h * scale
            x_center = x_pos + (max_w - draw_w) / 2.0
            y_center = y_pos + (max_h - draw_h) / 2.0

            pdf.drawImage(image, x=x_center, y=y_center, width=draw_w, height=draw_h)
            pdf.setFont("Vera", 15)
            pdf.setFillColor("black")
            pdf.drawString(text_x_pos, text_y_pos, label)

            image_count += 1
            if image_count % 2 != 0 and image_count != 1:
                ori_height -= 3
                text_height += 0.12

            img_buffer.close()

        pdf.showPage()

    pdf.save()
    buffer.seek(0)
    return buffer
