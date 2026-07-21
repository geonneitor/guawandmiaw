import os
import google.generativeai as genai
from flask import Blueprint, request
from backend.extensions import db
from backend.utils import success_response, error_response
from backend.auth_middleware import require_auth
from backend.models import Product, Sale, CashRegister
from datetime import datetime
from sqlalchemy import func

ai_bp = Blueprint('ai', __name__)

@ai_bp.route('/chat', methods=['POST'])
@require_auth('admin', 'encargado', 'cajero')
def chat():
    data = request.json
    prompt = data.get('prompt')
    if not prompt:
        return error_response("Prompt is required", 400)
    
    api_key = os.environ.get('GEMINI_API_KEY')
    if not api_key:
        return error_response("GEMINI_API_KEY no está configurada en el servidor (.env)", 500)
    
    try:
        # 1. Recolectar Contexto Local de la DB
        total_products = Product.query.count()
        low_stock_products = Product.query.filter(Product.stock <= Product.min_stock).all()
        low_stock_names = [f"{p.name} ({p.stock})" for p in low_stock_products[:15]]
        
        today = datetime.today().date()
        todays_sales = db.session.query(func.sum(Sale.total)).filter(func.date(Sale.date) == today).scalar() or 0
        
        corte_abierto = CashRegister.query.filter_by(status='OPEN').first()
        
        context_string = f"""
        Eres 'Fígaro', el asistente inteligente integrado de 'Guaw & Miaw', una boutique premium de mascotas.
        Eres un gato negro con blanco. Tienes personalidad felina pero muy profesional y servicial.
        Responde siempre en formato Markdown, de forma amable, profesional, concisa y directa.
        Aquí tienes el contexto actual de la base de datos (tiempo real) de la tienda para responder:
        - Fecha de hoy: {today}
        - Total de productos en inventario: {total_products}
        - Ventas totales del día de hoy: ${todays_sales:,.2f}
        - ¿Caja Registradora Abierta en este momento?: {"Sí" if corte_abierto else "No"}
        - Alertas de Stock Bajo (Primeros 15): {', '.join(low_stock_names) if low_stock_names else 'Todo bien, no hay stock bajo.'}
        
        Pregunta del usuario a continuación.
        """

        # 2. Llamar a Gemini
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        response = model.generate_content([
            {"role": "user", "parts": [context_string + "\n\nUsuario: " + prompt]}
        ])
        
        return success_response({"reply": response.text})
    except Exception as e:
        print(f"[ERROR] AI Chat: {str(e)}")
        return error_response(f"Error procesando IA: {str(e)}", 500)
