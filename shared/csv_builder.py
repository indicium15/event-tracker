"""Shared CSV export — identical skeleton across every sport, parameterized
by SportConfig's fieldnames/filename/extrasaction.
"""

import csv
import io

from flask import Response


def build_csv_response(payload, config):
    proxy = io.StringIO()
    writer = csv.DictWriter(proxy, fieldnames=config.csv_fieldnames, extrasaction=config.csv_extrasaction)
    writer.writeheader()
    for row in payload:
        writer.writerow(row)
    proxy.seek(0)
    output = proxy.getvalue()
    proxy.close()
    return Response(
        output,
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment;filename={config.csv_filename}"},
    )
