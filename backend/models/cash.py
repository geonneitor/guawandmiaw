from backend.extensions import db
from datetime import datetime, timezone

class CashRegister(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), nullable=False, default='open')
    opened_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    closed_at = db.Column(db.DateTime, nullable=True)
    opening_amount = db.Column(db.Float, nullable=False, default=0.0)
    expected_amount_left = db.Column(db.Float, nullable=True)
    actual_amount_left = db.Column(db.Float, nullable=True)
    discrepancy_reason = db.Column(db.String(255), nullable=True)
    
    # Foreign Keys
    opened_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    closed_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)

    opened_by = db.relationship('User', foreign_keys=[opened_by_id])
    closed_by = db.relationship('User', foreign_keys=[closed_by_id])

    def __init__(self, **kwargs):
        super(CashRegister, self).__init__(**kwargs)

    def to_dict(self):
        return {
            'id': self.id,
            'date': self.date.isoformat() if self.date else None,
            'status': self.status,
            'opened_at': self.opened_at.isoformat() if self.opened_at else None,
            'closed_at': self.closed_at.isoformat() if self.closed_at else None,
            'opening_amount': self.opening_amount,
            'expected_amount_left': self.expected_amount_left,
            'actual_amount_left': self.actual_amount_left,
            'discrepancy_reason': self.discrepancy_reason,
            'opened_by_id': self.opened_by_id,
            'opened_by_name': self.opened_by.display_name if self.opened_by else None,
            'closed_by_id': self.closed_by_id,
            'closed_by_name': self.closed_by.display_name if self.closed_by else None
        }

class CashMovement(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(10), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    description = db.Column(db.String(200))
    date = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    user = db.relationship('User')

    def __init__(self, **kwargs):
        super(CashMovement, self).__init__(**kwargs)

    def to_dict(self):
        return {
            'id': self.id,
            'type': self.type,
            'amount': self.amount,
            'description': self.description,
            'date': self.date.isoformat() if self.date else None,
            'user_id': self.user_id,
            'user_name': self.user.display_name if self.user else 'Desconocido'
        }

class Expense(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    description = db.Column(db.String(200), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    date = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    user = db.relationship('User')

    def __init__(self, **kwargs):
        super(Expense, self).__init__(**kwargs)

    def to_dict(self):
        return {
            'id': self.id,
            'description': self.description,
            'amount': self.amount,
            'date': self.date.isoformat() if self.date else None,
            'user_id': self.user_id,
            'user_name': self.user.display_name if self.user else 'Desconocido'
        }
