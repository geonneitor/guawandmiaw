from datetime import datetime
from zoneinfo import ZoneInfo

def get_local_now():
    """
    Devuelve la fecha y hora actual en el huso horario de la Ciudad de México
    (America/Mexico_City).
    Esto asegura que los cortes de caja, ventas y días cambien de acuerdo
    al horario de la tienda, y no al UTC (Universal).
    """
    return datetime.now(ZoneInfo("America/Mexico_City"))

def get_local_date():
    """
    Devuelve solo la fecha (date) de hoy en el huso horario de CDMX.
    """
    return get_local_now().date()
