from backend.extensions import db
from datetime import datetime, timezone

class Sale(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    total = db.Column(db.Float, nullable=False)
    payment_method = db.Column(db.String(20), default='cash') # cash, card, transfer
    status = db.Column(db.String(20), default='completed') # completed, cancelled
    cancelled_at = db.Column(db.DateTime, nullable=True)
    cancelled_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    cancellation_reason = db.Column(db.String(255), nullable=True)
    
    # FK Relationships
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    client_id = db.Column(db.Integer, db.ForeignKey('client.id'), nullable=True)

    user = db.relationship('User', foreign_keys=[user_id], backref='sales')
    cancelled_by = db.relationship('User', foreign_keys=[cancelled_by_id])
    client = db.relationship('Client', backref='sales')
    items = db.relationship('SaleItem', backref='sale', lazy=True, cascade="all, delete-orphan")

    def __init__(self, **kwargs):
        super(Sale, self).__init__(**kwargs)

    def to_dict(self):
        return {
            'id': self.id,
            'folio': f"GM-{1000 + self.id}",
            'date': self.date.isoformat(),
            'total': self.total,
            'payment_method': self.payment_method,
            'user_id': self.user_id,
            'seller_name': self.user.display_name if self.user else 'Desconocido',
            'client_id': self.client_id,
            'client_name': self.client.name if self.client else 'Público General',
            'status': self.status,
            'cancelled_at': self.cancelled_at.isoformat() if self.cancelled_at else None,
            'cancelled_by_id': self.cancelled_by_id,
            'cancellation_reason': self.cancellation_reason
        }

class SaleItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sale_id = db.Column(db.Integer, db.ForeignKey('sale.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=True)
    product_name = db.Column(db.String(100)) # Store name historic
    quantity = db.Column(db.Float, nullable=False)
    price_at_sale = db.Column(db.Float, nullable=False)
    subtotal = db.Column(db.Float, nullable=False)
    
    product = db.relationship('Product')

    def __init__(self, **kwargs):
        super(SaleItem, self).__init__(**kwargs)

    def to_dict(self):
        return {
            'id': self.id,
            'sale_id': self.sale_id,
            'product_id': self.product_id,
            'product_name': self.product_name,
            'quantity': self.quantity,
            'price_at_sale': self.price_at_sale,
            'subtotal': self.subtotal
        }
