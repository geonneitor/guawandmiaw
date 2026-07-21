import os
import json
from groq import Groq
from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity
from backend.extensions import db
from backend.models import Product, CashRegister, User
from backend.utils import success_response, error_response
from backend.auth_middleware import require_auth
from datetime import datetime, timezone
from sqlalchemy import text

ai_bp = Blueprint('ai', __name__)

tools = [
    {
        "type": "function",
        "function": {
            "name": "check_inventory",
            "description": "Busca un producto en la base de datos por nombre para confirmar existencias, precio y disponibilidad.",
            "parameters": {
                "type": "object",
                "properties": {
                    "product_name": {
                        "type": "string",
                        "description": "Nombre o parte del nombre del producto a buscar.",
                    }
                },
                "required": ["product_name"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "add_to_cart",
            "description": "Agrega un producto al carrito de compras del usuario. Usa esto SOLO después de confirmar qué producto quiere y su cantidad usando su ID exacto.",
            "parameters": {
                "type": "object",
                "properties": {
                    "product_id": {
                        "type": "integer",
                        "description": "El ID exacto del producto (obtenido previamente con check_inventory).",
                    },
                    "quantity": {
                        "type": "number",
                        "description": "Cantidad a agregar al carrito.",
                    }
                },
                "required": ["product_id", "quantity"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "open_cash_register",
            "description": "Abre la caja registradora con un monto inicial. Usa esto SOLO si el usuario indicó el monto exacto en efectivo con el que se abre la caja.",
            "parameters": {
                "type": "object",
                "properties": {
                    "amount": {
                        "type": "number",
                        "description": "El monto en efectivo para iniciar el turno.",
                    }
                },
                "required": ["amount"],
            },
        },
    }
]

@ai_bp.route('/chat', methods=['POST'])
@require_auth('admin', 'encargado', 'cajero')
def chat():
    data = request.json
    frontend_messages = data.get('messages', [])
    prompt = data.get('prompt')
    
    if not frontend_messages and prompt:
        frontend_messages = [{"role": "user", "content": prompt}]
    elif not frontend_messages:
        return error_response("Mensaje requerido", 400)

    api_key = os.environ.get('GROQ_API_KEY')
    if not api_key:
        return error_response("GROQ_API_KEY no configurada", 500)

    try:
        total_products = db.session.execute(text("SELECT COUNT(*) FROM product")).scalar() or 0
        today = datetime.today().date()
        current_time = datetime.now().strftime('%Y-%m-%d %H:%M')
        todays_sales = db.session.execute(text("SELECT COALESCE(SUM(total), 0) FROM sale WHERE DATE(date) = :t"), {"t": today}).scalar() or 0
        
        top_product = db.session.execute(text("""
            SELECT p.name 
            FROM sale_item si 
            JOIN product p ON si.product_id = p.id 
            JOIN sale s ON si.sale_id = s.id 
            WHERE DATE(s.date) = :t 
            GROUP BY p.id 
            ORDER BY SUM(si.quantity) DESC LIMIT 1
        """), {"t": today}).scalar() or "Aún no hay ventas"
        
        caja_open = db.session.execute(text("SELECT COUNT(*) FROM cash_register WHERE status = 'open'")).scalar() or 0
        corte_abierto = caja_open > 0
    except Exception:
        total_products = "N/A"
        today = datetime.today().date()
        current_time = "Desconocida"
        todays_sales = 0
        top_product = "N/A"
        corte_abierto = False

    system_prompt = f"""Eres 'Fígaro', el asistente inteligente integrado de 'Guaw & Miaw', una boutique premium de mascotas.
Eres un gato negro con blanco. Tienes personalidad felina pero profesional.

REGLAS FLEXIBLES (Puedes ayudar en más cosas):
1. Eres el asistente de 'Guaw & Miaw', pero AHORA TIENES PERMISO para contestar preguntas de ayuda general como: el clima, la hora actual, resolver cálculos matemáticos, revisar calendarios, etc.
2. Si te preguntan operaciones matemáticas (calculadora), resuélvelas directamente. 
3. Si te piden agregar algo al carrito, PRIMERO usa 'check_inventory' para buscar el producto y su ID. Luego usa 'add_to_cart' indicando el ID y cantidad.
4. Si te piden abrir caja, PREGUNTA PRIMERO con cuánto efectivo exactamente, y luego usa 'open_cash_register'.

Contexto actual de la tienda ({current_time}):
- Productos en inventario: {total_products}
- Ventas totales hoy: ${float(todays_sales):,.2f}
- Producto más vendido hoy: {top_product}
- ¿Caja Abierta?: {"Sí" if corte_abierto else "No"}"""

    messages = [{"role": "system", "content": system_prompt}] + frontend_messages
    
    try:
        client = Groq(api_key=api_key)
        
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            tools=tools,
            tool_choice="auto",
            max_tokens=1024,
            temperature=0.1,
        )
        
        response_message = completion.choices[0].message
        tool_calls = response_message.tool_calls
        
        actions_for_frontend = []
        
        if tool_calls:
            messages.append(response_message.model_dump(exclude_unset=True))
            
            for tool_call in tool_calls:
                function_name = tool_call.function.name
                function_args = json.loads(tool_call.function.arguments)
                
                if function_name == "check_inventory":
                    p_name = function_args.get("product_name", "")
                    products = Product.query.filter(Product.name.ilike(f"%{p_name}%")).limit(5).all()
                    if products:
                        res = [f"ID: {p.id}, Nombre: {p.name}, Precio: ${p.price}, Stock: {p.stock}" for p in products]
                        tool_result = "Encontrados:\n" + "\n".join(res)
                    else:
                        tool_result = f"No se encontraron productos coincidiendo con '{p_name}'."
                        
                    messages.append({"role": "tool", "tool_call_id": tool_call.id, "name": function_name, "content": tool_result})
                    
                elif function_name == "open_cash_register":
                    amount = function_args.get("amount", 0)
                    if CashRegister.query.filter_by(status='open').first():
                        tool_result = "Error: La caja ya está abierta."
                    else:
                        current_user_id = get_jwt_identity()
                        user_obj = None
                        try:
                            user_obj = User.query.filter_by(id=int(current_user_id)).first()
                        except:
                            user_obj = User.query.filter_by(username=current_user_id).first()
                            
                        new_reg = CashRegister(
                            date=datetime.now(timezone.utc).date(),
                            opened_at=datetime.now(timezone.utc),
                            opening_amount=float(amount),
                            status='open',
                            opened_by_id=user_obj.id if user_obj else None
                        )
                        db.session.add(new_reg)
                        db.session.commit()
                        tool_result = f"Éxito: Caja abierta con ${amount}."
                    
                    messages.append({"role": "tool", "tool_call_id": tool_call.id, "name": function_name, "content": tool_result})
                
                elif function_name == "add_to_cart":
                    pid = function_args.get("product_id")
                    qty = function_args.get("quantity", 1)
                    p = Product.query.get(pid)
                    if p:
                        if p.stock < qty:
                            tool_result = f"Error: Solo hay {p.stock} en stock."
                        else:
                            actions_for_frontend.append({
                                "type": "ADD_TO_CART",
                                "product": p.to_dict(),
                                "quantity": qty
                            })
                            tool_result = f"Éxito: {qty} x '{p.name}' mandado al carrito del frontend. Dile al usuario que revise su carrito."
                    else:
                        tool_result = "Error: Producto no existe."
                        
                    messages.append({"role": "tool", "tool_call_id": tool_call.id, "name": function_name, "content": tool_result})
                    
            second_response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                max_tokens=1024,
                temperature=0.1,
            )
            final_reply = second_response.choices[0].message.content
        else:
            final_reply = response_message.content
            
        return success_response({
            "reply": final_reply,
            "actions": actions_for_frontend
        })
        
    except Exception as e:
        print(f"[ERROR] AI Route: {str(e)}")
        return error_response(f"Error procesando IA: {str(e)}", 500)
