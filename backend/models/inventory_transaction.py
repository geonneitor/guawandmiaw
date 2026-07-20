from backend.extensions import db
from datetime import datetime, timezone

class InventoryTransaction(db.Model):
    __tablename__ = 'inventory_transaction'
    
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    # Types: IN, OUT, ADJUST, RESTOCK
    transaction_type = db.Column(db.String(20), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    balance_after = db.Column(db.Float, nullable=False)
    date = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    reference_note = db.Column(db.String(255), nullable=True)

    product = db.relationship('Product', backref='transactions')
    user = db.relationship('User')

    def __init__(self, **kwargs):
        super(InventoryTransaction, self).__init__(**kwargs)

    def to_dict(self):
        return {
            'id': self.id,
            'product_id': self.product_id,
            'product_name': self.product.name if self.product else 'Unknown',
            'transaction_type': self.transaction_type,
            'quantity': self.quantity,
            'balance_after': self.balance_after,
            'date': self.date.isoformat() if self.date else None,
            'user_id': self.user_id,
            'user_name': self.user.display_name if self.user else 'System',
            'reference_note': self.reference_note
        }
