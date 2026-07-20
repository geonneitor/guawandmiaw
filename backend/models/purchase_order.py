from backend.extensions import db
from datetime import datetime, timezone

class PurchaseOrder(db.Model):
    __tablename__ = 'purchase_order'
    
    id = db.Column(db.Integer, primary_key=True)
    supplier_id = db.Column(db.Integer, db.ForeignKey('supplier.id'), nullable=False)
    date = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    status = db.Column(db.String(20), default='COMPLETED') # PENDING, COMPLETED
    total_cost = db.Column(db.Float, default=0.0)
    notes = db.Column(db.Text, nullable=True)

    supplier = db.relationship('Supplier', backref='purchase_orders')
    items = db.relationship('PurchaseOrderItem', backref='purchase_order', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'supplier_id': self.supplier_id,
            'supplier_name': self.supplier.name if self.supplier else 'Unknown',
            'date': self.date.isoformat() if self.date else None,
            'status': self.status,
            'total_cost': self.total_cost,
            'notes': self.notes,
            'items': [item.to_dict() for item in self.items]
        }

class PurchaseOrderItem(db.Model):
    __tablename__ = 'purchase_order_item'
    
    id = db.Column(db.Integer, primary_key=True)
    purchase_order_id = db.Column(db.Integer, db.ForeignKey('purchase_order.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    unit_cost = db.Column(db.Float, nullable=False)

    product = db.relationship('Product')

    def to_dict(self):
        return {
            'id': self.id,
            'purchase_order_id': self.purchase_order_id,
            'product_id': self.product_id,
            'product_name': self.product.name if self.product else 'Unknown',
            'quantity': self.quantity,
            'unit_cost': self.unit_cost,
            'total': self.quantity * self.unit_cost
        }
