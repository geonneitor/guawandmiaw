from flask import Blueprint, request
from backend.store_settings import load_settings, save_settings
from backend.utils import success_response, error_response
from backend.auth_middleware import require_auth

settings_bp = Blueprint('settings', __name__)

@settings_bp.route('/settings/store', methods=['GET'])
@require_auth('admin', 'encargado', 'cajero', 'vendedor-caja')
def get_store_settings():
    return success_response(load_settings())

@settings_bp.route('/settings/store', methods=['PUT'])
@require_auth('admin', 'encargado')
def update_store_settings():
    data = request.json
    if not data:
        return error_response("Datos requeridos", 400)
    updated = save_settings(data)
    return success_response(updated, "Configuración guardada correctamente")
