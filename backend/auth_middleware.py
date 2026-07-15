from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt
from backend.utils import error_response

def require_auth(*roles):
    """
    Decorador que verifica JWT y opcionalmente restringe por rol.
    Uso: @require_auth()                    → solo verifica que haya sesión
         @require_auth('admin')             → solo admins
         @require_auth('admin', 'encargado')→ admin o encargado
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            try:
                verify_jwt_in_request()
            except Exception:
                return error_response("No autorizado. Inicia sesión.", 401)

            if roles:
                claims = get_jwt()
                user_role = claims.get('role', '')
                if user_role not in roles:
                    return error_response(
                        f"Acceso denegado. Requiere rol: {', '.join(roles)}", 403
                    )
            return fn(*args, **kwargs)
        return wrapper
    return decorator
