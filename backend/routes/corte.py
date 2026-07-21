from flask import Blueprint, request
from backend.extensions import db
from backend.models import Sale, Expense, CashMovement, CashRegister, User
from backend.utils import success_response, error_response
from backend.auth_middleware import require_auth
from sqlalchemy.orm import joinedload
from datetime import datetime, timezone

corte_bp = Blueprint('corte', __name__)

@corte_bp.route('/corte', methods=['GET'])
@require_auth('admin', 'encargado', 'cajero', 'vendedor-caja')
def get_corte_de_caja():
    print("[GET] /corte - Calculating current shift status")
    try:
        register_entry = CashRegister.query.filter_by(status='open').first()
        if not register_entry:
            return error_response("No hay un turno abierto actual", 400)

        opening_amount = register_entry.opening_amount
        opened_at = register_entry.opened_at
        now = datetime.now(timezone.utc)

        sales_shift = Sale.query.options(
            joinedload(Sale.items)
        ).filter_by(cash_register_id=register_entry.id).all()
        expenses_shift = Expense.query.filter_by(cash_register_id=register_entry.id).all()
        movements_shift = CashMovement.query.filter_by(cash_register_id=register_entry.id).all()
        
        total_cash_sales = sum(s.total for s in sales_shift if s.payment_method.lower() in ['cash', 'efectivo'])
        total_card_sales = sum(s.total for s in sales_shift if s.payment_method.lower() in ['card', 'tarjeta'])
        total_transfer_sales = sum(s.total for s in sales_shift if s.payment_method.lower() in ['transfer', 'transferencia'])
        
        total_expenses = sum(e.amount for e in expenses_shift)
        total_in = sum(m.amount for m in movements_shift if m.type == 'in')
        total_out = sum(m.amount for m in movements_shift if m.type == 'out')
        
        # Balance in drawer (only cash affects this)
        expected_cash = opening_amount + total_cash_sales + total_in - total_expenses - total_out
        
        sales_details = []
        for s in sales_shift:
            for item in s.items:
                sales_details.append({
                    'product': item.product_name,
                    'quantity': item.quantity,
                    'price': item.price_at_sale,
                    'subtotal': item.subtotal,
                    'time': s.date.strftime('%H:%M'),
                    'payment_method': s.payment_method
                })

        expenses_details = [{'description': e.description, 'amount': e.amount, 'time': e.date.strftime('%H:%M'), 'type': 'expense'} for e in expenses_shift]
        for m in movements_shift:
            expenses_details.append({
                'description': f"{'Entrada' if m.type == 'in' else 'Retiro'}: {m.description}",
                'amount': m.amount,
                'time': m.date.strftime('%H:%M'),
                'type': f'movement_{m.type}'
            })

        return success_response({
            "opened_at": opened_at.isoformat(),
            "opening_amount": opening_amount,
            "total_cash_sales": total_cash_sales,
            "total_card_sales": total_card_sales,
            "total_transfer_sales": total_transfer_sales,
            "total_sales_revenue": total_cash_sales + total_card_sales + total_transfer_sales,
            "total_expenses": total_expenses + total_out,
            "expected_cash_in_drawer": expected_cash,
            "transaction_count": len(sales_shift),
            "sales_details": sales_details,
            "expenses_details": expenses_details
        })
    except Exception as e:
        return error_response(str(e), 500)

@corte_bp.route('/register/status', methods=['GET'])
@require_auth('admin', 'encargado', 'cajero', 'vendedor-caja')
def get_register_status():
    print("[GET] /register/status - Checking if drawer is open")
    try:
        open_register = CashRegister.query.filter_by(status='open').first()
        last_closed = CashRegister.query.filter_by(status='closed').order_by(CashRegister.closed_at.desc()).first()
        last_expected = last_closed.expected_amount_left if last_closed else 0.0
        
        return success_response({
            "is_open": bool(open_register),
            "last_expected_amount": last_expected
        })
    except Exception as e:
        return error_response(str(e), 500)

@corte_bp.route('/register/open', methods=['POST'])
@require_auth('admin', 'encargado', 'cajero')
def open_register():
    data = request.json
    print(f"[POST] /register/open - Opening drawer with ${data.get('amount')}")
    if CashRegister.query.filter_by(status='open').first():
        return error_response("Ya hay un turno abierto actualmente", 400)
    try:
        user_obj = User.query.filter_by(username=data.get('user', '')).first()
        new_register = CashRegister(
            date=datetime.now(timezone.utc).date(),
            opened_at=datetime.now(timezone.utc),
            opening_amount=float(data.get('amount', 0)),
            status='open',
            opened_by_id=user_obj.id if user_obj else None
        )
        db.session.add(new_register)
        db.session.commit()
        return success_response(None, "Turno abierto exitosamente", 201)
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)

@corte_bp.route('/register/close', methods=['POST'])
@require_auth('admin', 'encargado', 'cajero')
def close_register():
    data = request.json
    print(f"[POST] /register/close - Closing drawer")
    open_register = CashRegister.query.filter_by(status='open').first()
    if not open_register:
        return error_response("No hay ningún turno abierto para cerrar", 400)
    try:
        open_register.status = 'closed'
        open_register.closed_at = datetime.now(timezone.utc)
        expected = float(data.get('expected_amount', 0))
        actual = float(data.get('actual_amount', 0))
        open_register.expected_amount_left = expected
        open_register.actual_amount_left = actual
        
        reason = data.get('discrepancy_reason', '')
        open_register.discrepancy_reason = reason
        
        user_obj = User.query.filter_by(username=data.get('user', '')).first()
        open_register.closed_by_id = user_obj.id if user_obj else None
        
        difference = actual - expected
        if abs(difference) > 0.01:
            movement_desc = f"Ajuste al Cierre de Caja: {reason}" if reason else "Ajuste al Cierre de Caja (Sin motivo especificado)"
            movement = CashMovement(
                type='in' if difference > 0 else 'out',
                amount=abs(difference),
                description=movement_desc,
                user_id=user_obj.id if user_obj else None,
                cash_register_id=open_register.id
            )
            db.session.add(movement)
        db.session.commit()
        return success_response({
            "id": open_register.id,
            "opened_at": open_register.opened_at.isoformat(),
            "closed_at": open_register.closed_at.isoformat(),
            "opened_by": open_register.opened_by.display_name if open_register.opened_by else '—',
            "closed_by": open_register.closed_by.display_name if open_register.closed_by else '—',
            "opening_amount": open_register.opening_amount,
            "expected_amount": expected,
            "actual_amount": actual,
            "difference": round(difference, 2),
            "discrepancy_reason": reason
        }, "Turno cerrado exitosamente")
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)

@corte_bp.route('/movements', methods=['POST'])
@require_auth('admin', 'encargado', 'cajero')
def add_movement():
    data = request.json
    print(f"[POST] /movements - Adding {data.get('type')} movement")
    
    # Check if register is open before adding movement
    open_register = CashRegister.query.filter_by(status='open').first()
    if not open_register:
        return error_response("No se pueden registrar movimientos si la caja está cerrada.", 403)
        
    try:
        user_obj = User.query.filter_by(username=data.get('user', '')).first()
        new_movement = CashMovement(
            type=data['type'],
            amount=float(data['amount']),
            description=data.get('description', ''),
            user_id=user_obj.id if user_obj else None,
            cash_register_id=open_register.id
        )
        db.session.add(new_movement)
        db.session.commit()
        return success_response(None, "Movimiento registrado", 201)
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 400)

@corte_bp.route('/movements', methods=['GET'])
@require_auth('admin', 'encargado', 'cajero', 'vendedor-caja')
def get_movements():
    print("[GET] /movements - Current shift movements")
    try:
        register_entry = CashRegister.query.filter_by(status='open').first()
        if not register_entry:
            return success_response([])
        movements = CashMovement.query.filter_by(cash_register_id=register_entry.id).order_by(CashMovement.date.desc()).all()
        return success_response([m.to_dict() for m in movements])
    except Exception as e:
        return error_response(str(e), 500)

@corte_bp.route('/register/history', methods=['GET'])
@require_auth('admin', 'encargado', 'cajero', 'vendedor-caja')
def get_register_history():
    print("[GET] /register/history - Listing last 50 shifts")
    try:
        shifts = CashRegister.query.options(
            joinedload(CashRegister.opened_by),
            joinedload(CashRegister.closed_by)
        ).order_by(CashRegister.id.desc()).limit(50).all()
        result = []
        for r in shifts:
            diff = 0.0
            if r.status == 'closed':
                diff = (r.actual_amount_left or 0.0) - (r.expected_amount_left or 0.0)
            
            result.append({
                'id': r.id,
                'status': r.status,
                'opened_at': r.opened_at.isoformat() if r.opened_at else None,
                'closed_at': r.closed_at.isoformat() if r.closed_at else None,
                'opening_amount': r.opening_amount,
                'expected_amount': r.expected_amount_left or 0.0,
                'actual_amount': r.actual_amount_left or 0.0,
                'difference': round(diff, 2),
                'opened_by': r.opened_by.display_name if r.opened_by else '—',
                'closed_by': r.closed_by.display_name if r.closed_by else '—',
                'discrepancy_reason': r.discrepancy_reason or ''
            })
        return success_response(result)
    except Exception as e:
        return error_response(str(e), 500)

