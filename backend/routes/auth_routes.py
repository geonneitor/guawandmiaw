from flask import Blueprint, request
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity, get_jwt
)
from backend.extensions import db
from backend.models.user import User
from backend.models.token_blocklist import TokenBlocklist
from backend.utils import success_response, error_response
from backend.auth_middleware import require_auth
from datetime import datetime, timezone

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/auth/users-list', methods=['GET'])
def get_users_list():
    try:
        users = User.query.filter_by(is_active=True).all()
        return success_response([{'id': u.id, 'username': u.username, 'display_name': u.display_name or u.username, 'role': u.role} for u in users])
    except Exception as e:
        return error_response(str(e), 500)

@auth_bp.route('/auth/debug-db', methods=['GET'])
def debug_db():
    from backend.extensions import db
    users = User.query.filter_by(is_active=True).all()
    return {"db": str(db.engine.url), "users": len(users)}

@auth_bp.route('/auth/login', methods=['POST'])
def login():
    data = request.json
    print(f"DEBUG LOGIN DATA: {data}")
    if not data:
        return error_response("Cuerpo de la petición requerido", 400)

    username = data.get('username', '').strip().lower()
    password = data.get('password', '')

    if not username or not password:
        return error_response("Usuario y contraseña son requeridos", 400)

    print(f"DEBUG: login intento - username: '{username}', password: '{password}'")

    user = User.query.filter_by(username=username).first()

    if not user or not user.check_password(password):
        return error_response("Credenciales incorrectas", 401)

    if not user.is_active:
        return error_response("Esta cuenta está desactivada. Contacta al administrador.", 403)

    user.last_login = datetime.now(timezone.utc)
    db.session.commit()

    access_token = create_access_token(identity=str(user.id), additional_claims={
        'role': user.role,
        'username': user.username,
        'display_name': user.display_name or user.username
    })
    refresh_token = create_refresh_token(identity=str(user.id))

    return success_response({
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': user.to_dict()
    }, "Login exitoso")


@auth_bp.route('/auth/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))
    if not user or not user.is_active:
        return error_response("Token inválido", 401)

    new_token = create_access_token(identity=str(user.id), additional_claims={
        'role': user.role,
        'username': user.username,
        'display_name': user.display_name or user.username
    })
    return success_response({'access_token': new_token})


@auth_bp.route('/auth/me', methods=['GET'])
@jwt_required()
def get_me():
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))
    if not user:
        return error_response("Usuario no encontrado", 404)
    return success_response(user.to_dict())

@auth_bp.route('/auth/preferences', methods=['PUT'])
@jwt_required()
def update_preferences():
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))
    if not user:
        return error_response("Usuario no encontrado", 404)
        
    data = request.json
    if 'theme' in data:
        user.theme = data['theme']
    if 'dark_mode' in data:
        user.dark_mode = data['dark_mode']
        
    try:
        db.session.commit()
        return success_response(user.to_dict(), "Preferencias actualizadas con éxito")
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)

@auth_bp.route('/auth/users', methods=['GET'])
@require_auth('admin')
def get_users():
    print("[GET] /auth/users - Listing all users")
    try:
        users = User.query.all()
        return success_response([u.to_dict() for u in users])
    except Exception as e:
        return error_response(str(e), 500)

@auth_bp.route('/auth/users', methods=['POST'])
@require_auth('admin')
def create_user():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    role = data.get('role', 'cajero')
    display_name = data.get('display_name', '')
    
    if not username or not password:
        return error_response("Usuario y contraseña son requeridos", 400)
        
    if User.query.filter_by(username=username).first():
        return error_response("El usuario ya existe", 400)
        
    new_user = User(username=username, display_name=display_name, role=role, is_active=True)
    new_user.set_password(password)
    
    try:
        db.session.add(new_user)
        db.session.commit()
        return success_response(new_user.to_dict(), "Usuario creado con éxito", 201)
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)

@auth_bp.route('/auth/users/<int:user_id>', methods=['PUT'])
@require_auth('admin')
def update_user(user_id):
    data = request.json
    user = db.session.get(User, user_id)
    if not user:
        return error_response("Usuario no encontrado", 404)
        
    if 'display_name' in data:
        user.display_name = data['display_name']
    if 'role' in data:
        user.role = data['role']
    if 'is_active' in data:
        user.is_active = data['is_active']
    if 'password' in data and data['password']:
        user.set_password(data['password'])
        
    try:
        db.session.commit()
        return success_response(user.to_dict(), "Usuario actualizado con éxito")
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)

@auth_bp.route('/auth/users/<int:user_id>', methods=['DELETE'])
@require_auth('admin')
def delete_user(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return error_response("Usuario no encontrado", 404)
        
    if user.id == 1 or user.role == 'admin':
        # Simple safeguard, wait let's just protect user.id == 1
        if user.id == 1:
            return error_response("No se puede eliminar al administrador principal", 403)
        
    try:
        db.session.delete(user)
        db.session.commit()
        return success_response(None, "Usuario eliminado")
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)

@auth_bp.route('/auth/logout', methods=['DELETE'])
@jwt_required()
def logout():
    jti = get_jwt().get('jti')
    db.session.add(TokenBlocklist(jti=jti))
    db.session.commit()
    return success_response(None, "Sesión cerrada correctamente")

@auth_bp.route('/auth/change-password', methods=['PUT'])
@jwt_required()
def change_password():
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))
    if not user:
        return error_response("Usuario no encontrado", 404)
        
    data = request.json
    current_password = data.get('current_password')
    new_password = data.get('new_password')
    
    if not current_password or not new_password:
        return error_response("La contraseña actual y la nueva son requeridas", 400)
        
    if not user.check_password(current_password):
        return error_response("La contraseña actual es incorrecta", 401)
        
    user.set_password(new_password)
    try:
        db.session.commit()
        return success_response(None, "Contraseña actualizada con éxito")
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)

