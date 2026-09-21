"""Exportar el historial real de llamadas -- a pedido explícito de la
usuaria (2026-09-21), después de decidir explícitamente CSV con descarga
autenticada en vez de un link público (mismo criterio de privacidad ya
aplicado una vez en G54 para sus reportes, ver CLAUDE.md ítem 210: las
transcripciones y números reales de un cliente no deberían quedar
accesibles a cualquiera que tenga un link)."""
import csv
import io

from . import models


def calls_to_csv(calls: list[models.Call], include_business_name: bool = False) -> str:
    output = io.StringIO()
    writer = csv.writer(output)

    header = ["fecha_inicio", "fecha_fin", "duracion_segundos", "numero", "resultado", "transcripcion"]
    if include_business_name:
        header.insert(0, "negocio")
    writer.writerow(header)

    for call in calls:
        row = [
            call.started_at.isoformat(),
            call.ended_at.isoformat(),
            call.duration_seconds,
            call.caller_number or "",
            call.outcome,
            call.transcript or "",
        ]
        if include_business_name:
            row.insert(0, call.business.name)
        writer.writerow(row)

    return output.getvalue()
