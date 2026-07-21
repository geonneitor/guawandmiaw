from flask import Blueprint, request
from backend.extensions import db
from backend.models import Sale, SaleItem, Product, Expense
from backend.utils import success_response, error_response
from backend.auth_middleware import require_auth
from sqlalchemy.orm import joinedload
from datetime import datetime, timezone, timedelta

reports_bp = Blueprint('reports', __name__)

@reports_bp.route('/reports/advanced', methods=['GET'])
@require_auth('admin', 'encargado')
def get_advanced_reports():
    print("[GET] /reports/advanced - Calculating advanced metrics")
    period = request.args.get('period', 'month')
    now = datetime.now(timezone.utc)
    
    if period == 'week':
        start_date = now - timedelta(days=now.weekday())
        start_date = datetime.combine(start_date.date(), datetime.min.time())
        prev_start_date = start_date - timedelta(days=7)
        prev_end_date = start_date
    elif period == 'fortnight':
        if now.day <= 15:
            start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            prev_end_date = start_date
            prev_month_date = prev_end_date - timedelta(days=1)
            prev_start_date = prev_month_date.replace(day=16, hour=0, minute=0, second=0, microsecond=0)
        else:
            start_date = now.replace(day=16, hour=0, minute=0, second=0, microsecond=0)
            prev_end_date = start_date
            prev_start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    else: # month
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        prev_month = start_date - timedelta(days=1)
        prev_start_date = prev_month.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        prev_end_date = start_date

    try:
        sales_current = Sale.query.options(joinedload(Sale.items)).filter(Sale.date >= start_date).all()
        sales_prev = Sale.query.filter(Sale.date >= prev_start_date, Sale.date < prev_end_date).all()
        
        expenses_current = Expense.query.filter(Expense.date >= start_date).all()
        expenses_prev = Expense.query.filter(Expense.date >= prev_start_date, Expense.date < prev_end_date).all()
        
        current_total = sum(s.total for s in sales_current)
        prev_total = sum(s.total for s in sales_prev)
        
        current_expenses = sum(e.amount for e in expenses_current)
        prev_expenses = sum(e.amount for e in expenses_prev)
        
        pct_change = 0
        if prev_total > 0:
            pct_change = round(((current_total - prev_total) / prev_total) * 100, 2)
        elif current_total > 0:
            pct_change = 100
            
        units_sold = 0
        product_totals = {}
        payment_breakdown = {'cash': {'total': 0}, 'card': {'total': 0}, 'transfer': {'total': 0}}
        
        for s in sales_current:
            pay_method = s.payment_method
            if pay_method in payment_breakdown:
                payment_breakdown[pay_method]['total'] += s.total
            else:
                payment_breakdown[pay_method] = {'total': s.total}
                
            for item in s.items:
                units_sold += item.quantity
                pid = item.product_id
                if pid not in product_totals:
                    product_totals[pid] = {'name': item.product_name, 'total': 0, 'units': 0}
                product_totals[pid]['total'] += item.subtotal
                product_totals[pid]['units'] += item.quantity
                
        sorted_products = sorted(product_totals.values(), key=lambda x: x['total'], reverse=True)
        top_products = sorted_products[:5]
        
        total_revenue = sum(p['total'] for p in sorted_products)
        running_total = 0
        abc = {'A': [], 'B': [], 'C': []}
        
        for p in sorted_products:
            running_total += p['total']
            pct = (running_total / total_revenue) * 100 if total_revenue > 0 else 0
            if pct <= 80:
                abc['A'].append(p)
            elif pct <= 95:
                abc['B'].append(p)
            else:
                abc['C'].append(p)
                
        expense_pct_change = 0
        if prev_expenses > 0:
            expense_pct_change = round(((current_expenses - prev_expenses) / prev_expenses) * 100, 2)
        elif current_expenses > 0:
            expense_pct_change = 100

        balance_current = current_total - current_expenses
        balance_prev = prev_total - prev_expenses
        
        balance_pct_change = 0
        if balance_prev != 0:
            balance_pct_change = round(((balance_current - balance_prev) / abs(balance_prev)) * 100, 2)
        elif balance_current > 0:
            balance_pct_change = 100
        elif balance_current < 0:
            balance_pct_change = -100

        return success_response({
            "income": {
                "current": current_total,
                "previous": prev_total,
                "pct_change": pct_change
            },
            "expenses": {
                "current": current_expenses,
                "previous": prev_expenses,
                "pct_change": expense_pct_change
            },
            "balance": {
                "current": balance_current,
                "previous": balance_prev,
                "pct_change": balance_pct_change
            },
            "top_products": top_products,
            "payment_breakdown": payment_breakdown,
            "abc": abc
        })
    except Exception as e:
        print(f"[ERROR] /reports/advanced: {str(e)}")
        return error_response(str(e), 500)
