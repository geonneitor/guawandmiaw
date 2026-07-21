import os
import google.generativeai as genai
from flask import Blueprint, request
from backend.extensions import db
from backend.utils import success_response, error_response
from backend.auth_middleware import require_auth
from backend.models import Product, Sale, CashRegister
from datetime import datetime
from sqlalchemy import func, text

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
        return error_response("GEMINI_API_KEY no está configurada en el servidor", 500)
    
    # ── Paso 1: Contexto de DB (con fallbacks para no romper si falta una columna) ──
    try:
        total_products = db.session.execute(text("SELECT COUNT(*) FROM product")).scalar() or 0
    except Exception:
        total_products = "N/A"

    try:
        today = datetime.today().date()
        todays_sales = db.session.execute(
            text("SELECT COALESCE(SUM(total), 0) FROM sale WHERE DATE(date) = :today"),
            {"today": today}
        ).scalar() or 0
    except Exception:
        today = datetime.today().date()
        todays_sales = 0

    try:
        low_stock_result = db.session.execute(
            text("SELECT name, stock FROM product WHERE stock <= COALESCE(min_stock, 0) LIMIT 15")
        ).fetchall()
        low_stock_names = [f"{row[0]} ({row[1]})" for row in low_stock_result]
    except Exception:
        low_stock_names = []

    try:
        caja_open = db.session.execute(
            text("SELECT COUNT(*) FROM cash_register WHERE status = 'OPEN'")
        ).scalar() or 0
        corte_abierto = caja_open > 0
    except Exception:
        corte_abierto = False

    context_string = f"""
    Eres 'Fígaro', el asistente inteligente integrado de 'Guaw & Miaw', una boutique premium de mascotas.
    Eres un gato negro con blanco. Tienes personalidad felina pero muy profesional y servicial.
    Responde siempre en formato Markdown, de forma amable, profesional, concisa y directa.
    Aquí tienes el contexto actual de la base de datos (tiempo real) de la tienda:
    - Fecha de hoy: {today}
    - Total de productos en inventario: {total_products}
    - Ventas totales del día de hoy: ${float(todays_sales):,.2f}
    - ¿Caja Registradora Abierta?: {"Sí" if corte_abierto else "No"}
    - Alertas de Stock Bajo (Primeros 15): {', '.join(low_stock_names) if low_stock_names else 'Todo bien, no hay stock bajo.'}
    
    Pregunta del usuario a continuación.
    """

    # ── Paso 2: Llamar a Gemini ──────────────────────────────────────────────
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.0-flash-lite')
        response = model.generate_content(
            context_string + "\n\nUsuario: " + prompt
        )
        return success_response({"reply": response.text})
    except Exception as e:
        print(f"[ERROR] Gemini API: {str(e)}")
        return error_response(f"Error procesando IA: {str(e)}", 500)
