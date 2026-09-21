"""CRM real por negocio (2026-09-21, pedido explícito de la usuaria) -- todo
Customer nace de una llamada real, nunca se inventa uno a mano. Mismo patrón
de upsert por teléfono ya confirmado seguro en el CRM real de G54 (ver
CLAUDE.md, ítem 323: keyed por company_id+telefono, sin duplicar tratos)."""
from sqlalchemy.orm import Session

from . import models


def upsert_customer_from_call(db: Session, call: models.Call) -> models.Customer | None:
    """Nunca inventa un teléfono -- si la llamada no trajo `caller_number`
    real (el proveedor SIP no siempre lo manda, ver el comentario de
    `Call.caller_number`), no hay ninguna clave real con la que identificar
    un cliente, así que no se crea ni se toca nada."""
    if not call.caller_number:
        return None

    customer = (
        db.query(models.Customer)
        .filter(models.Customer.business_id == call.business_id, models.Customer.phone == call.caller_number)
        .first()
    )
    if customer is None:
        customer = models.Customer(business_id=call.business_id, phone=call.caller_number)
        db.add(customer)

    customer.calls_count = (customer.calls_count or 0) + 1
    customer.last_call_at = call.started_at
    db.flush()
    return customer
