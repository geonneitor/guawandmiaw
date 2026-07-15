from backend.extensions import db
from datetime import datetime, timezone

class AuditLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    action = db.Column(db.String(50), nullable=False) # e.g., 'AJUSTE_MANUAL_STOCK', 'CANCELACION_VENTA'
    description = db.Column(db.String(255), nullable=False)
    
    # FK Relationships
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    user = db.relationship('User')

    def __init__(self, **kwargs):
        super(AuditLog, self).__init__(**kwargs)

    def to_dict(self):
        return {
            'id': self.id,
            'date': self.date.isoformat() if self.date else None,
            'action': self.action,
            'description': self.description,
            'user_id': self.user_id,
            'user_name': self.user.display_name if self.user else 'Desconocido'
        }
