#!/usr/bin/env python3
"""Lee el parte HTML público de Grandvalira. Nunca inventa estados ni fechas."""
import json
import re
import urllib.request
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path

URL = "https://www.grandvalira.com/es/estacion/estado-pistas"
OUTPUT = Path("datos/estado-pistas.json")

class VisibleText(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []
        self.hidden = 0
    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style"):
            self.hidden += 1
    def handle_endtag(self, tag):
        if tag in ("script", "style") and self.hidden:
            self.hidden -= 1
    def handle_data(self, data):
        if not self.hidden:
            self.parts.append(data)

def match_pair(text, label):
    m = re.search(label + r"\s*(\d+)\s*/\s*(\d+)", text, re.I)
    return {"open": int(m.group(1)), "total": int(m.group(2))} if m else None

def main():
    req = urllib.request.Request(URL, headers={"User-Agent": "MiRefugioIncles/1.0 (+public ski report; contact via website)", "Accept-Language": "es"})
    with urllib.request.urlopen(req, timeout=25) as response:
        page = response.read().decode("utf-8", "replace")
    parser = VisibleText()
    parser.feed(page)
    text = re.sub(r"\s+", " ", " ".join(parser.parts))
    # Solo aceptamos un parte con fecha explícita y magnitudes reconocibles.
    stamp = re.search(r"Última actualización:\s*(?:Lun|Mar|Mié|Mie|Jue|Vie|Sáb|Sab|Dom),?\s*(\d{2}/\d{2}/\d{4})\s*-\s*(\d{2}:\d{2})", text, re.I)
    runs = match_pair(text, r"Pistas")
    lifts = match_pair(text, r"Instalaciones")
    km = match_pair(text, r"Kilómetros esquiables")
    if not stamp or not runs or not lifts or not km:
        raise ValueError("Formato del parte desconocido: se conserva el archivo anterior y NO se publica información inventada")
    from zoneinfo import ZoneInfo
    dt = datetime.strptime(" ".join(stamp.groups()), "%d/%m/%Y %H:%M").replace(tzinfo=ZoneInfo("Europe/Andorra"))
    depth_match = re.search(r"Espesores de nieve\s*\(cm\)\s*(\d+)\s*-\s*(\d+)", text, re.I)
    links = match_pair(text, r"Enlaces")
    sectors = []
    # Los bloques de sectores aparecen después de «Enlaces entre sectores».
    # Solo extraemos estados expresamente indicados por Grandvalira.
    sector_block = text.split("Enlaces entre sectores", 1)[-1].split("Versión descargable", 1)[0]
    for name in ("Encamp", "Canillo", "El Tarter", "Soldeu", "Peretol", "Grau Roig", "Pas de la Casa"):
        match = re.search(r"(?<![\\w-])" + re.escape(name) + r"\\s+(Parcialmente abierto|Previsión de apertura|En mantenimiento|Abierto|Cerrado)\\b", sector_block, re.I)
        states = {"abierto": "open", "cerrado": "closed", "parcialmente abierto": "partial", "previsión de apertura": "forecast", "en mantenimiento": "maintenance"}
        status = states.get(match.group(1).lower(), "unknown") if match else "unknown"
        sectors.append({"name": name, "status": status})
    payload = {
        "source": URL,
        "source_last_updated": dt.isoformat(),
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
        "live": True,
        "station": "Grandvalira",
        "summary": {
            "runs": runs, "lifts": lifts,
            "skiable_km": km,
            "snow_depth_cm": {"min": int(depth_match.group(1)), "max": int(depth_match.group(2))} if depth_match else None,
            "links": links,
        },
        "sectors": sectors,
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    # No reescribir el JSON si el parte no ha cambiado: evita commits cada 30 minutos.
    if OUTPUT.exists():
        try:
            previous = json.loads(OUTPUT.read_text(encoding="utf-8"))
            previous.pop("retrieved_at", None)
            comparison = dict(payload)
            comparison.pop("retrieved_at", None)
            if previous == comparison:
                print("Parte sin cambios; no se crea commit")
                return
        except (OSError, ValueError):
            pass
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Parte obtenido:", payload["source_last_updated"], "(la fuente puede estar desactualizada)")

if __name__ == "__main__":
    main()
