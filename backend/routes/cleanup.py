from flask import Blueprint, request
from backend.extensions import db
from backend.models import Sale, SaleItem, Product, CashRegister, AuditLog, CashMovement, Expense, PurchaseOrder, PurchaseOrderItem, InventoryTransaction
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
    sales_data = data.get('sales', [])

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
            expected_amount_left=open_amount, # Se calculará con las ventas en efectivo
            actual_amount_left=close_amount,
            status='closed',
            opened_by_id=user_obj.id if user_obj else None,
            closed_by_id=user_obj.id if user_obj else None,
            discrepancy_reason='Turno extemporáneo registrado por admin'
        )
        db.session.add(past_register)
        db.session.flush()

        total_cash_sales = 0.0
        sales_by_pm = {}
        for item in sales_data:
            pm = (item.get('payment_method') or 'cash').lower()
            if pm not in sales_by_pm:
                sales_by_pm[pm] = []
            sales_by_pm[pm].append(item)

        for pm, items in sales_by_pm.items():
            new_sale = Sale(
                total=0.0,
                payment_method=pm,
                user_id=user_obj.id if user_obj else 1,
                cash_register_id=past_register.id,
                date=opened_at,
                status='completed'
            )
            db.session.add(new_sale)
            db.session.flush()

            sale_total = 0.0
            for item in items:
                prod_id = item.get('product_id')
                qty = float(item.get('quantity', 0))
                price_override = item.get('price')

                product = db.session.get(Product, prod_id)
                if not product:
                    raise Exception(f"Producto con ID {prod_id} no encontrado.")

                # Descontar stock
                product.stock = round(float(product.stock) - qty, 3)

                price_at_sale = float(price_override) if price_override is not None else float(product.price)
                subtotal = round(price_at_sale * qty, 2)

                sale_item = SaleItem(
                    sale_id=new_sale.id,
                    product_id=product.id,
                    product_name=product.name,
                    quantity=qty,
                    price_at_sale=price_at_sale,
                    subtotal=subtotal
                )
                db.session.add(sale_item)
                sale_total += subtotal

            new_sale.total = round(sale_total, 2)
            if pm in ['cash', 'efectivo']:
                total_cash_sales += sale_total

        # El esperado en caja es el fondo inicial más las ventas en efectivo
        expected_close = round(open_amount + total_cash_sales, 2)
        past_register.expected_amount_left = expected_close

        # AuditLog
        audit = AuditLog(
            action="TURNO_EXTEMPORANEO",
            description=(
                f"Turno extemporáneo registrado para fecha {date_str}. "
                f"Fondo inicial: ${open_amount}. Cierre: ${close_amount}. "
                f"Ventas totales cargadas: {len(sales_data)} productos."
            ),
        )
        db.session.add(audit)
        db.session.commit()

        return success_response(
            {
                'register_id': past_register.id, 
                'date': date_str,
                'expected_cash': expected_close,
                'actual_cash': close_amount
            },
            f"Turno del {date_str} registrado correctamente con {len(sales_data)} productos vendidos.",
            201
        )
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] /register/open-past: {str(e)}")
        return error_response(str(e), 500)


# ── DELETE: Restablecer todos los datos de operación (Ventas, Gastos, Turnos) ──
@cleanup_bp.route('/operations/reset', methods=['DELETE'])
@require_auth('admin')
def reset_operations():
    """
    Borra todos los registros de ventas, gastos, turnos/cortes, 
    movimientos y transacciones de inventario en la base de datos.
    Deja la base de datos limpia para comenzar la operación.
    Conserva los usuarios.
    """
    print("[DELETE] /operations/reset - ADMIN RESETTING ALL OPERATIONS DATA")
    try:
        # Eliminar registros de transacciones
        db.session.query(SaleItem).delete()
        db.session.query(Sale).delete()
        db.session.query(CashMovement).delete()
        db.session.query(Expense).delete()
        db.session.query(PurchaseOrderItem).delete()
        db.session.query(PurchaseOrder).delete()
        db.session.query(InventoryTransaction).delete()
        db.session.query(AuditLog).delete()
        db.session.query(CashRegister).delete()

        # Audit log de la operación de reset
        audit = AuditLog(
            action="RESET_OPERACIONES",
            description="Restablecimiento total de datos de operacion realizado por admin (ventas, gastos, turnos en ceros)."
        )
        db.session.add(audit)
        db.session.commit()

        return success_response(None, "Todos los datos de operacion han sido eliminados correctamente.")
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] /operations/reset: {str(e)}")
        return error_response(str(e), 500)

