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

@settings_bp.route('/settings/archive', methods=['POST'])
@require_auth('admin')
def archive_old_data():
    from backend.extensions import db
    from backend.models import Sale, Expense, CashMovement
    try:
        sales = Sale.query.filter_by(is_archived=False).all()
        for s in sales:
            s.is_archived = True
            
        expenses = Expense.query.filter_by(is_archived=False).all()
        for e in expenses:
            e.is_archived = True
            
        moves = CashMovement.query.filter_by(is_archived=False).all()
        for m in moves:
            m.is_archived = True
            
        db.session.commit()
        return success_response(
            {"archived_sales": len(sales), "archived_expenses": len(expenses)}, 
            "Registros archivados correctamente para limpiar la interfaz"
        )
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)
