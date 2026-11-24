"""Guardado en SQLite: sitios inscriptos, avisos ya mandados, scripts conocidos e historial de informes."""
from __future__ import annotations

import datetime as dt
import json
import sqlite3
import threading

ESQUEMA = """
CREATE TABLE IF NOT EXISTS sitios (
  url TEXT PRIMARY KEY, nombre TEXT DEFAULT '', idioma TEXT DEFAULT 'es',
  email TEXT DEFAULT '', telegram TEXT DEFAULT '', webhook TEXT DEFAULT '', inscripto TEXT
);
CREATE TABLE IF NOT EXISTS avisados (
  host TEXT, clave TEXT, ts REAL, nivel TEXT, detalle TEXT, portada INTEGER DEFAULT 0, PRIMARY KEY (host, clave)
);
CREATE TABLE IF NOT EXISTS scripts (host TEXT, dominio TEXT, PRIMARY KEY (host, dominio));
CREATE TABLE IF NOT EXISTS informes (
  id INTEGER PRIMARY KEY AUTOINCREMENT, url TEXT, modo TEXT, nivel TEXT, fecha TEXT, json TEXT
);
CREATE INDEX IF NOT EXISTS informes_url ON informes (url, id);
"""


class Store:
    def __init__(self, ruta: str):
        self.db = sqlite3.connect(ruta, check_same_thread=False)
        self.db.row_factory = sqlite3.Row
        self.lock = threading.Lock()
        with self.lock:
            self.db.executescript(ESQUEMA)

    def _q(self, sql: str, args: tuple = ()) -> list[sqlite3.Row]:
        with self.lock:
            cur = self.db.execute(sql, args)
            filas = cur.fetchall()
            self.db.commit()
            return filas

    # sitios
    def inscribir(self, url: str, nombre: str = "", idioma: str = "es", email: str = "", telegram: str = "", webhook: str = "") -> None:
        self._q("INSERT OR REPLACE INTO sitios (url, nombre, idioma, email, telegram, webhook, inscripto) VALUES (?,?,?,?,?,?,?)",
                (url, nombre, idioma, email, telegram, webhook, dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")))

    def quitar(self, url: str) -> bool:
        antes = len(self.sitios())
        self._q("DELETE FROM sitios WHERE url = ?", (url,))
        return len(self.sitios()) < antes

    def sitios(self) -> list[dict]:
        return [dict(f) for f in self._q("SELECT * FROM sitios ORDER BY url")]

    def sitio(self, url: str) -> dict | None:
        f = self._q("SELECT * FROM sitios WHERE url = ?", (url,))
        return dict(f[0]) if f else None

    # scripts conocidos (None = primera revisión de ese host: no se avisa, solo se anota la base)
    def scripts(self, url: str, host: str) -> list[str] | None:
        if not self._q("SELECT 1 FROM informes WHERE url = ? LIMIT 1", (url,)):
            return None
        return [x["dominio"] for x in self._q("SELECT dominio FROM scripts WHERE host = ?", (host,))]

    def anotar_scripts(self, host: str, dominios: list[str]) -> None:
        for d in dominios:
            self._q("INSERT OR IGNORE INTO scripts (host, dominio) VALUES (?, ?)", (host, d))

    # avisos
    def avisados(self, host: str) -> dict:
        return {f["clave"]: dict(f) for f in self._q("SELECT * FROM avisados WHERE host = ?", (host,))}

    def guardar_avisados(self, host: str, filas: dict) -> None:
        with self.lock:
            self.db.execute("DELETE FROM avisados WHERE host = ?", (host,))
            self.db.executemany("INSERT INTO avisados (host, clave, ts, nivel, detalle, portada) VALUES (?,?,?,?,?,?)",
                                [(host, k, v["ts"], v["nivel"], v["detalle"], int(bool(v.get("portada")))) for k, v in filas.items()])
            self.db.commit()

    # informes
    def guardar_informe(self, inf: dict) -> None:
        self._q("INSERT INTO informes (url, modo, nivel, fecha, json) VALUES (?,?,?,?,?)",
                (inf["url"], inf["modo"], inf["nivel"], inf["revisado_en"], json.dumps(inf, ensure_ascii=False)))
        # se guardan los últimos 200 por sitio
        self._q("DELETE FROM informes WHERE url = ? AND id NOT IN (SELECT id FROM informes WHERE url = ? ORDER BY id DESC LIMIT 200)", (inf["url"], inf["url"]))

    def informes(self, url: str, n: int = 10) -> list[dict]:
        return [json.loads(f["json"]) for f in self._q("SELECT json FROM informes WHERE url = ? ORDER BY id DESC LIMIT ?", (url, n))]
