from backend.app import create_app
from backend.extensions import db
from backend.models import User

app = create_app()

with app.app_context():
    admin = User.query.filter_by(username='admin').first()
    if admin:
        admin.set_password('123456')
        db.session.commit()
        print("PIN actualizado a 123456 con exito!")
    else:
        print("Usuario admin no encontrado.")
