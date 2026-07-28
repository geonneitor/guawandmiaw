from flask import Blueprint, request
from backend.extensions import db
from backend.models import Sale, SaleItem, Product, CashRegister, AuditLog
from backend.utils import success_response, error_response
from backend.auth_middleware import require_auth
from backend.utils.timezone import get_local_now, get_local_date
from datetime import datetime, date, timezone

cleanup_bp = Blueprint('cleanup', __name__)


# ── GET: Resumen del día (para mostrar en el modal antes de borrar) ────────────
@cleanup_bp.route('/day-cleanup/summary', methods=['GET'])
@require_auth('admin')
def get_day_summary():
    """Devuelve cuántas ventas hay hoy antes de limpiar."""
    print("[GET] /day-cleanup/summary")
    try:
        today = get_local_date()
        start_of_today = datetime.combine(today, datetime.min.time())
        sales_today = Sale.query.filter(
            Sale.date >= start_of_today,
            Sale.status == 'completed'
        ).all()
        total = sum(s.total for s in sales_today)
        return success_response({
            'date': today.isoformat(),
            'sale_count': len(sales_today),
            'total': round(total, 2)
        })
    except Exception as e:
        return error_response(str(e), 500)


# ── DELETE: Borrar todas las ventas del día y restaurar inventario ─────────────
@cleanup_bp.route('/day-cleanup', methods=['DELETE'])
@require_auth('admin')
def day_cleanup():
    """
    Borra todas las ventas completadas del día actual,
    restaura el stock de cada producto involucrado,
    y genera un AuditLog de la operación.
    Solo disponible para 'admin'.
    """
    print("[DELETE] /day-cleanup - Admin wiping today's sales")
    try:
        today = get_local_date()
        start_of_today = datetime.combine(today, datetime.min.time())

        sales_today = Sale.query.filter(
            Sale.date >= start_of_today,
            Sale.status == 'completed'
        ).all()

        if not sales_today:
            return error_response("No hay ventas del día para borrar.", 400)

        restored_products = []
        total_wiped = 0.0

        for sale in sales_today:
            for item in sale.items:
                product = db.session.get(Product, item.product_id)
                if product:
                    product.stock = round(float(product.stock) + float(item.quantity), 3)
                    if product.name not in restored_products:
                        restored_products.append(product.name)
            total_wiped += sale.total
            sale.status = 'cancelled'
            sale.cancellation_reason = 'Limpieza del día por administrador'
            sale.cancelled_at = get_local_now()

        # Registrar en AuditLog
        audit = AuditLog(
            action="LIMPIEZA_DIA",
            description=(
                f"Limpieza del día {today.isoformat()} realizada por admin. "
                f"{len(sales_today)} ventas canceladas. "
                f"Total revertido: ${round(total_wiped, 2)}. "
                f"Stock restaurado: {', '.join(restored_products[:10])}"
            ),
        )
        db.session.add(audit)
        db.session.commit()

        return success_response({
            'sales_cancelled': len(sales_today),
            'total_reversed': round(total_wiped, 2),
            'products_restored': len(restored_products)
        }, f"Limpieza completada. {len(sales_today)} ventas canceladas e inventario restaurado.")

    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] /day-cleanup: {str(e)}")
        return error_response(str(e), 500)


# ── POST: Registrar turno extemporáneo (fecha pasada) ─────────────────────────
@cleanup_bp.route('/register/open-past', methods=['POST'])
@require_auth('admin')
def open_past_register():
    """
    Crea un CashRegister con fecha pasada (ya cerrado).
    Útil para registrar un día que no pudo subirse a tiempo.
    Los reportes semanales/mensuales lo incluyen porque usan
    la columna `date` del CashRegister.
    Solo disponible para 'admin'.
    """
    data = request.json or {}
    print(f"[POST] /register/open-past - Registering past shift for date: {data.get('date')}")

    date_str = data.get('date')
    if not date_str:
        return error_response("Se requiere la fecha del turno (date).", 400)

    try:
        shift_date = date.fromisoformat(date_str)
    except ValueError:
        return error_response("Formato de fecha inválido. Usa YYYY-MM-DD.", 400)

    # No permitir fechas futuras
    if shift_date > get_local_date():
        return error_response("No se puede registrar un turno para una fecha futura.", 400)

    open_amount = float(data.get('amount', 0))
    close_amount = float(data.get('close_amount', 0))

    try:
        from backend.models import User
        user_obj = User.query.filter_by(username=data.get('user', '')).first()

        # Crear el turno como ya cerrado
        opened_at = datetime.combine(shift_date, datetime.min.time().replace(hour=8))
        closed_at = datetime.combine(shift_date, datetime.min.time().replace(hour=20))

        past_register = CashRegister(
            date=shift_date,
            opened_at=opened_at,
            closed_at=closed_at,
            opening_amount=open_amount,
            expected_amount_left=close_amount,
            actual_amount_left=close_amount,
            status='closed',
            opened_by_id=user_obj.id if user_obj else None,
            closed_by_id=user_obj.id if user_obj else None,
            discrepancy_reason='Turno extemporáneo registrado por admin'
        )
        db.session.add(past_register)

        # AuditLog
        audit = AuditLog(
            action="TURNO_EXTEMPORANEO",
            description=(
                f"Turno extemporáneo registrado para fecha {date_str}. "
                f"Fondo inicial: ${open_amount}. Cierre: ${close_amount}."
            ),
        )
        db.session.add(audit)
        db.session.commit()

        return success_response(
            {'register_id': past_register.id, 'date': date_str},
            f"Turno del {date_str} registrado correctamente.",
            201
        )
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] /register/open-past: {str(e)}")
        return error_response(str(e), 500)
