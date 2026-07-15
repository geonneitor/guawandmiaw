from backend.extensions import db

class Supplier(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    # Campos normalizados
    phone = db.Column(db.String(30), nullable=True)
    email = db.Column(db.String(150), nullable=True)
    # contact_info se mantiene sólo para compatibilidad con datos históricos.
    contact_info = db.Column(db.String(200), nullable=True)
    notes = db.Column(db.Text, nullable=True)

    def __init__(self, **kwargs):
        super(Supplier, self).__init__(**kwargs)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'phone': self.phone,
            'email': self.email,
            'contact_info': self.contact_info,
            'notes': self.notes
        }
