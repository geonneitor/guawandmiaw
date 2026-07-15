from backend.extensions import db

class Brand(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    
    def __init__(self, **kwargs):
        super(Brand, self).__init__(**kwargs)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name
        }
