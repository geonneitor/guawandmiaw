from flask import Blueprint, request
from backend.extensions import db
from backend.models import Sale, SaleItem, Product, CashRegister, CashMovement, Expense, User, Client, AuditLog
from backend.utils import success_response, error_response
from backend.auth_middleware import require_auth
from sqlalchemy.orm import joinedload
from datetime import datetime, timezone, timedelta

sales_bp = Blueprint('sales', __name__)

@sales_bp.route('/sales', methods=['GET'])
@require_auth('admin', 'encargado', 'cajero', 'vendedor-caja')
def get_sales():
    print("[GET] /sales - Listing recent sales")
    try:
        sales = Sale.query.options(
            joinedload(Sale.items),
            joinedload(Sale.user),
            joinedload(Sale.client)
        ).order_by(Sale.date.desc()).limit(100).all()
        result = []
        for s in sales:
            items = [{'product_name': i.product_name, 'quantity': i.quantity, 'price': i.price_at_sale, 'subtotal': i.subtotal} for i in s.items]
            result.append({
                'id': s.id,
                'folio': f"GM-{1000 + s.id}",
                'date': s.date.isoformat(),
                'total': s.total,
                'seller': s.user.display_name if s.user else 'Desconocido',
                'client_name': s.client.name if s.client else 'Público General',
                'payment_method': s.payment_method,
                'status': s.status,
                'items': items
            })
        return success_response(result)
    except Exception as e:
        print(f"[ERROR] /sales: {str(e)}")
        return error_response(str(e), 500)

@sales_bp.route('/sales', methods=['POST'])
@require_auth('admin', 'encargado', 'cajero', 'vendedor-caja')
def create_sale():
    data = request.json
    print(f"[POST] /sales - Processing new sale")
    cart_items = data.get('items', [])
    payment_method = data.get('payment_method', 'cash')
    seller_name = data.get('seller', '')
    client_id = data.get('client_id')
    
    if not cart_items:
        return error_response("El carrito está vacío", 400)
    
    # Verificar si hay un turno abierto
    open_register = CashRegister.query.filter_by(status='open').first()
    if not open_register:
        return error_response("No se pueden realizar ventas si la caja está cerrada. Por favor, abre un turno.", 403)

    user_obj = User.query.filter_by(username=seller_name).first()
    total_sale = 0
    new_sale = Sale(total=0, payment_method=payment_method, user_id=user_obj.id if user_obj else 1, client_id=client_id, cash_register_id=open_register.id)
    
    override_date_str = data.get('date')
    if override_date_str:
        try:
            new_sale.date = datetime.fromisoformat(override_date_str)
        except Exception:
            pass
            
    db.session.add(new_sale)
    db.session.flush()
    
    try:
        for item in cart_items:
            product = db.session.get(Product, item['product_id'])
            if not product:
                raise Exception(f"Producto {item['product_id']} no encontrado")
            
            raw_qty = float(item['quantity'])
            required_qty = round(raw_qty, 5) if product.is_bulk else round(raw_qty, 3)
            required_qty_stock = round(raw_qty, 3)
            current_stock = round(float(product.stock), 3)

            # La apertura automática de bultos fue removida. Debe abrirse explícitamente desde el inventario o POS.

            if current_stock < required_qty_stock:
                print(f"[ERROR] Stock insuficiente para {product.name}: {current_stock} < {required_qty_stock}")
                if product.is_bulk:
                    raise Exception(f"Stock suelto insuficiente para {product.name} (Disponible: {current_stock}). Ve a Inventario y abre un bulto físico.")
                else:
                    raise Exception(f"Stock insuficiente para {product.name} (Disponible: {current_stock})")
            
            product.stock = round(current_stock - required_qty_stock, 3)
            
            unit_price = product.price
            # Subtotal: con centavos
            subtotal = round(product.price * required_qty, 2)
            
            # Simple promo logic (if applicable)
            if hasattr(product, 'promo_active') and product.promo_active:
                if product.promo_min_quantity is not None and required_qty >= product.promo_min_quantity:
                    groups = required_qty // product.promo_min_quantity
                    remainder = required_qty % product.promo_min_quantity
                    
                    unit_discount = 0
                    if product.promo_type == 'fixed':
                        unit_discount = product.promo_discount or 0
                    elif product.promo_type == 'percent':
                        unit_discount = product.price * ((product.promo_discount or 0) / 100)
                    
                    discounted_unit_price = product.price - unit_discount
                    subtotal = round(
                        (groups * product.promo_min_quantity * discounted_unit_price) + (remainder * product.price), 2
                    )
                    unit_price = round(subtotal / required_qty, 2) if required_qty else product.price

            sale_item = SaleItem(
                sale_id=new_sale.id,
                product_id=product.id,
                product_name=product.name,
                quantity=required_qty,
                price_at_sale=unit_price,
                subtotal=subtotal
            )
            db.session.add(sale_item)
            total_sale += subtotal
        
        new_sale.total = round(total_sale, 2)  # Total con decimales
        db.session.commit()
        
        return success_response({
            "sale_id": new_sale.id,
            "folio": f"GM-{1000 + new_sale.id}",
            "total": round(new_sale.total, 2)
        }, "Venta registrada con éxito", 201)
        
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] Transaction Rollback: {str(e)}")
        return error_response(str(e), 400)

@sales_bp.route('/stats', methods=['GET'])
@require_auth('admin', 'encargado', 'cajero', 'vendedor-caja')
def get_stats():
    print("[GET] /stats - Calculating dashboard metrics")
    try:
        today = datetime.now(timezone.utc).date()
        start_of_today = datetime.combine(today, datetime.min.time())
        # Solo incluir ventas completadas
        sales_today = Sale.query.options(
            joinedload(Sale.user)
        ).filter(Sale.date >= start_of_today, Sale.status == 'completed').order_by(Sale.date.desc()).all()

        total_sales = sum(s.total for s in sales_today)
        transaction_count = len(sales_today)
        # Ticket promedio: con centavos
        avg_ticket = round(total_sales / transaction_count, 2) if transaction_count > 0 else 0

        recent_sales = []
        for s in sales_today[:5]:
            recent_sales.append({
                'id': s.id,
                'folio': f"GM-{1000 + s.id}",
                'total': s.total,
                'payment_method': s.payment_method,
                'seller': s.user.display_name if s.user else 'Desconocido',
                'time': s.date.strftime('%H:%M')
            })

        product_today = {}
        for s in sales_today:
            for item in s.items:
                pid = item.product_id
                if pid not in product_today:
                    product_today[pid] = {'name': item.product_name, 'total': 0.0, 'units': 0}
                product_today[pid]['total'] += item.subtotal
                product_today[pid]['units'] += item.quantity
        
        top_product_today = None
        if product_today:
            top = max(product_today.values(), key=lambda x: x['total'])
            top_product_today = top

        last_week = datetime.now(timezone.utc) - timedelta(days=7)
        low_stock_products = []
        try:
            low = Product.query.filter(Product.stock <= Product.min_stock).order_by(Product.stock.asc()).limit(10).all()
            for p in low:
                low_stock_products.append({
                    'name': p.name, 
                    'stock': p.stock, 
                    'min_stock': p.min_stock,
                    'is_bulk': p.is_bulk
                })
        except Exception as e:
            print(f"Warning in stock prediction: {e}")

        chart_data = {}
        for s in reversed(sales_today):
            hour_key = s.date.strftime('%H:00')
            chart_data[hour_key] = chart_data.get(hour_key, 0) + s.total

        return success_response({
            "daily_total": total_sales,
            "transaction_count": transaction_count,
            "avg_ticket": avg_ticket,
            "recent_sales": recent_sales,
            "top_product_today": top_product_today,
            "low_stock_products": low_stock_products,
            "chart_data": chart_data
        })
    except Exception as e:
        print(f"[ERROR] /stats: {str(e)}")
        return error_response(str(e), 500)

@sales_bp.route('/sales/<int:sale_id>', methods=['DELETE'])
@require_auth('admin', 'encargado')
def delete_sale(sale_id):
    print(f"[DELETE] /sales/{sale_id} - Cancelling sale")
    try:
        sale = db.session.get(Sale, sale_id)
        if not sale:
            return error_response("Venta no encontrada", 404)
        
        if sale.status == 'cancelled':
            return error_response("La venta ya estaba cancelada", 400)
            
        # Restaurar inventario
        for item in sale.items:
            product = db.session.get(Product, item.product_id)
            if product:
                product.stock += item.quantity
        
        # Marcar como cancelada
        sale.status = 'cancelled'
        sale.cancelled_at = datetime.now(timezone.utc)
        
        data = request.json or {}
        reason = data.get('reason', 'Cancelación por el administrador')
        sale.cancellation_reason = reason
        
        # Generar movimiento de salida si es efectivo y hay caja abierta
        if sale.payment_method in ['cash', 'efectivo']:
            open_register = CashRegister.query.filter_by(status='open').first()
            if open_register:
                movement = CashMovement(
                    type='out',
                    amount=sale.total,
                    description=f"Reembolso por Cancelación de Venta GM-{1000 + sale.id}: {reason}"
                )
                db.session.add(movement)
        
        # Generar AuditLog
        audit = AuditLog(
            action="CANCELACION_VENTA",
            description=f"Venta GM-{1000 + sale.id} cancelada. Motivo: {reason}. Stock devuelto.",
        )
        db.session.add(audit)
        
        db.session.commit()
        return success_response(None, f"Venta GM-{1000 + sale_id} cancelada correctamente. El inventario ha sido restaurado.")
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)
