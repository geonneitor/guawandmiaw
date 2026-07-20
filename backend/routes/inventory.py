from flask import Blueprint, request
from backend.extensions import db
from backend.models import Product, Supplier, PurchaseOrder, PurchaseOrderItem, InventoryTransaction, AuditLog
from backend.utils import success_response, error_response
from backend.auth_middleware import require_auth
from datetime import datetime, timezone

inventory_bp = Blueprint('inventory', __name__)

@inventory_bp.route('/inventory/restock', methods=['POST'])
@require_auth('admin', 'encargado')
def create_restock():
    data = request.json
    supplier_id = data.get('supplier_id')
    items = data.get('items', [])
    notes = data.get('notes', '')
    user_id = getattr(request, 'user_id', None) # Asumiendo que el middleware lo inyecta o se puede obtener

    if not supplier_id or not items:
        return error_response("Falta proveedor o items", 400)

    try:
        supplier = db.get_or_404(Supplier, supplier_id)
        
        # Create Purchase Order
        po = PurchaseOrder(
            supplier_id=supplier.id,
            notes=notes,
            status='COMPLETED'
        )
        db.session.add(po)
        db.session.flush() # get ID

        total_po_cost = 0.0

        for item_data in items:
            product_id = item_data.get('product_id')
            qty = float(item_data.get('quantity', 0))
            unit_cost = float(item_data.get('unit_cost', 0))

            if qty <= 0:
                continue

            product = db.get_or_404(Product, product_id)
            
            # Create PO Item
            po_item = PurchaseOrderItem(
                purchase_order_id=po.id,
                product_id=product.id,
                quantity=qty,
                unit_cost=unit_cost
            )
            db.session.add(po_item)

            total_po_cost += (qty * unit_cost)

            # Update Product Stock and Cost (Average or latest)
            product.stock += qty
            product.cost = int(round(unit_cost)) # Actualizamos al último costo

            # Log Transaction in Ledger
            transaction = InventoryTransaction(
                product_id=product.id,
                transaction_type='RESTOCK',
                quantity=qty,
                balance_after=product.stock,
                user_id=user_id,
                reference_note=f"Orden de compra #{po.id} de proveedor {supplier.name}"
            )
            db.session.add(transaction)

        po.total_cost = total_po_cost
        
        # General audit
        audit = AuditLog(action="RESURTIDO", description=f"Orden de compra #{po.id} completada. Total: ${total_po_cost}")
        if user_id:
            audit.user_id = user_id
        db.session.add(audit)

        db.session.commit()
        return success_response(po.to_dict(), "Inventario resurtido correctamente", 201)

    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] /inventory/restock: {str(e)}")
        return error_response(str(e), 500)

@inventory_bp.route('/inventory/transactions', methods=['GET'])
@require_auth('admin', 'encargado')
def get_transactions():
    transactions = InventoryTransaction.query.order_by(InventoryTransaction.date.desc()).limit(200).all()
    return success_response([t.to_dict() for t in transactions])

@inventory_bp.route('/inventory/purchase_orders', methods=['GET'])
@require_auth('admin', 'encargado')
def get_purchase_orders():
    orders = PurchaseOrder.query.order_by(PurchaseOrder.date.desc()).limit(100).all()
    return success_response([o.to_dict() for o in orders])
