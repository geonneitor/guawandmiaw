import os
from backend.app import create_app
from backend.extensions import db
from backend.models import User

app = create_app()

with app.app_context():
    # Remove existing db file if exists
    db_path = os.path.join(app.instance_path, 'guaw_miaw.db')
    if os.path.exists(db_path):
        os.remove(db_path)
        print(f"Eliminada BD antigua: {db_path}")

    # Create all tables
    db.create_all()
    print("Tablas creadas con los nuevos esquemas de auditoría.")

    # Create admin user
    if not User.query.filter_by(username='admin').first():
        admin = User(
            username='admin',
            role='admin',
            display_name='Administrador Sistema'
        )
        admin.set_password('admin123')
        db.session.add(admin)
        db.session.commit()
        print("Usuario admin creado exitosamente (password: admin123).")
