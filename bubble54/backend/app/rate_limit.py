"""Freno real contra fuerza bruta en los logins -- encontrado en la
auditoría del 2026-09-21: ni /auth/agency/login ni /auth/business/login
tenían ningún límite, así que probar contraseñas en loop contra una cuenta
real no costaba nada. En memoria del propio proceso, sin Redis -- alcanza
para el tamaño real de hoy (un solo proceso); si algún día corre más de un
worker de uvicorn a la vez, esto deja de ser un límite global y hay que
migrarlo a algo compartido (Redis u otro store externo).

Clave por email, no por IP: lo que hay que frenar es "cuántas veces se
probó ESTA cuenta", no "cuántos requests vienen de esta IP" -- un atacante
real prueba una sola cuenta desde varias IPs distintas igual de fácil."""
import time

MAX_ATTEMPTS = 5
WINDOW_SECONDS = 300  # 5 minutos

_failures: dict[str, list[float]] = {}


def _prune(key: str, now: float) -> list[float]:
    recent = [t for t in _failures.get(key, []) if now - t < WINDOW_SECONDS]
    _failures[key] = recent
    return recent


def seconds_until_unlocked(key: str) -> int:
    """0 si no está bloqueado -- caso contrario, cuántos segundos reales
    faltan para el próximo intento permitido."""
    now = time.time()
    recent = _prune(key, now)
    if len(recent) < MAX_ATTEMPTS:
        return 0
    oldest = min(recent)
    remaining = WINDOW_SECONDS - (now - oldest)
    return max(1, int(remaining))


def record_failure(key: str) -> None:
    now = time.time()
    _prune(key, now)
    _failures.setdefault(key, []).append(now)


def record_success(key: str) -> None:
    _failures.pop(key, None)
