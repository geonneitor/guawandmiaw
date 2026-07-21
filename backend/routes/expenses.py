from flask import Blueprint, request
from backend.extensions import db
from backend.models import Expense
from backend.utils import success_response, error_response
from backend.auth_middleware import require_auth
from sqlalchemy.orm import joinedload
from datetime import datetime, timezone

expenses_bp = Blueprint('expenses', __name__)

@expenses_bp.route('/expenses', methods=['GET'])
@require_auth('admin', 'encargado', 'cajero', 'vendedor-caja')
def get_expenses():
    print("[GET] /expenses - Listing all expenses")
    try:
        expenses = Expense.query.options(joinedload(Expense.user)).order_by(Expense.date.desc()).all()
        return success_response([e.to_dict() for e in expenses])
    except Exception as e:
        return error_response(str(e), 500)

@expenses_bp.route('/expenses', methods=['POST'])
@require_auth('admin', 'encargado', 'cajero')
def add_expense():
    data = request.json
    print(f"[POST] /expenses - Adding expense: {data.get('description')}")
    from backend.models import CashRegister
    open_register = CashRegister.query.filter_by(status='open').first()
    if not open_register:
        return error_response("No se pueden registrar gastos si la caja está cerrada.", 403)
        
    try:
        new_expense = Expense(
            description=data['description'],
            amount=float(data['amount']),
            date=datetime.fromisoformat(data['date']) if data.get('date') else datetime.now(timezone.utc),
            cash_register_id=open_register.id
        )
        db.session.add(new_expense)
        db.session.commit()
        return success_response(new_expense.to_dict(), "Gasto registrado", 201)
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 400)

@expenses_bp.route('/expenses/<int:id>', methods=['DELETE'])
@require_auth('admin', 'encargado')
def delete_expense(id):
    print(f"[DELETE] /expenses/{id} - Deleting expense")
    try:
        expense = db.get_or_404(Expense, id)
        db.session.delete(expense)
        db.session.commit()
        return success_response(None, "Gasto eliminado")
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)

@expenses_bp.route('/expenses', methods=['DELETE'])
@require_auth('admin')
def clear_expenses():
    print("[DELETE] /expenses - Clearing all expenses")
    try:
        num_deleted = db.session.query(Expense).delete()
        db.session.commit()
        return success_response({"deleted_count": num_deleted}, "Historial de gastos vaciado")
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 400)
