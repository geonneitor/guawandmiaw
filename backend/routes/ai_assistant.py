import os
import json
import time
import random
from groq import Groq
from flask import Blueprint, request, current_app
from flask_jwt_extended import get_jwt_identity
from backend.extensions import db
from backend.models import Product, CashRegister, User, Expense
from backend.utils import success_response, error_response
from backend.auth_middleware import require_auth
from datetime import datetime, timezone
from backend.utils.timezone import get_local_now, get_local_date
from sqlalchemy import text

ai_bp = Blueprint('ai', __name__)

# ─── CONSTANTES ────────────────────────────────────────────────────────────────
MAX_TOKENS = 4096
MAX_MESSAGES = 30           # Truncar conversaciones muy largas
CHILITAI_DELAY_MS = 800     # Delay artificial para ChilitAI (ms)
CHILITAI_TOOL_DELAY_MS = 1500

# ─── FIGARO TOOLS (Completo) ──────────────────────────────────────────────────
FIGARO_TOOLS = [
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
    },
    {
        "type": "function",
        "function": {
            "name": "clear_cart",
            "description": "Vacía el carrito de compras actual del usuario.",
            "parameters": {"type": "object", "properties": {}},
        }
    },
    {
        "type": "function",
        "function": {
            "name": "register_expense",
            "description": "Registra un nuevo gasto operativo (como limpieza, insumos, pagos).",
            "parameters": {
                "type": "object",
                "properties": {
                    "description": {"type": "string", "description": "Descripción del gasto."},
                    "amount": {"type": "number", "description": "Monto del gasto."}
                },
                "required": ["description", "amount"],
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "query_sales",
            "description": "Consulta el total de ventas completadas del día actual.",
            "parameters": {"type": "object", "properties": {}}
        }
    }
]

# ─── CHILITAI TOOLS (Limitado — solo lo básico) ───────────────────────────────
CHILITAI_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "check_inventory",
            "description": "Busca un producto en la base de datos por nombre. ChilitAI no siempre acierta.",
            "parameters": {
                "type": "object",
                "properties": {
                    "product_name": {
                        "type": "string",
                        "description": "Nombre del producto a buscar (o algo parecido).",
                    }
                },
                "required": ["product_name"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "query_sales",
            "description": "Pregunta cuánto se ha vendido hoy.",
            "parameters": {"type": "object", "properties": {}}
        }
    }
]


# ─── HELPERS ────────────────────────────────────────────────────────────────────

def _get_store_context():
    """Obtiene datos de la tienda con manejo seguro de errores DB."""
    try:
        total_products = db.session.execute(text("SELECT COUNT(*) FROM product")).scalar() or 0
        today = get_local_date()
        current_time = get_local_now().strftime('%Y-%m-%d %H:%M')
        todays_sales = db.session.execute(
            text("SELECT COALESCE(SUM(total), 0) FROM sale WHERE DATE(date) = :t AND is_archived = False AND status = 'completed'"),
            {"t": today}
        ).scalar() or 0
        
        top_product = db.session.execute(text("""
            SELECT p.name 
            FROM sale_item si 
            JOIN product p ON si.product_id = p.id 
            JOIN sale s ON si.sale_id = s.id 
            WHERE DATE(s.date) = :t 
            GROUP BY p.id 
            ORDER BY SUM(si.quantity) DESC LIMIT 1
        """), {"t": today}).scalar() or "Aún no hay ventas"
        
        caja_open = db.session.execute(
            text("SELECT COUNT(*) FROM cash_register WHERE status = 'open'")
        ).scalar() or 0
        
        return {
            "total_products": total_products,
            "current_time": current_time,
            "todays_sales": float(todays_sales),
            "top_product": top_product,
            "corte_abierto": caja_open > 0
        }
    except Exception as e:
        current_app.logger.error(f"[AI] Error obteniendo contexto: {e}")
        return {
            "total_products": "N/A",
            "current_time": get_local_now().strftime('%Y-%m-%d %H:%M'),
            "todays_sales": 0,
            "top_product": "N/A",
            "corte_abierto": False
        }


def _build_figaro_prompt(context, user_context):
    ctx = _get_store_context()
    cart_info = context.get('cart', [])
    path = context.get('path', 'Desconocido')
    user_name = user_context.get('name', 'Usuario')
    user_role = user_context.get('role', 'cajero')

    return f"""Eres 'Fígaro', el asistente inteligente integrado de 'Guaw & Miaw', una boutique premium de mascotas.
Eres un gato negro con blanco. Tienes personalidad felina pero profesional y servicial.

REGLAS:
1. Eres el asistente principal de 'Guaw & Miaw'.
2. Puedes responder preguntas generales: clima, hora actual, cálculos matemáticos, calendario, etc.
3. Si te piden agregar algo al carrito, PRIMERO usa 'check_inventory' para buscar el producto y su ID. Luego usa 'add_to_cart' indicando el ID y cantidad.
4. Si te piden abrir caja, PREGUNTA PRIMERO con cuánto efectivo exactamente, y luego usa 'open_cash_register'.
5. Si el usuario pide registrar un gasto, usa 'register_expense'. Si pide vaciar el carrito, usa 'clear_cart'.
6. Responde SIEMPRE en español (MX) con tono amigable y felino. Usa emojis 🐾✨ pero con moderación.
7. Sé breve y directo. No te extiendas innecesariamente.

Contexto actual de la tienda ({ctx['current_time']}):
- Usuario: {user_name} ({user_role})
- Pantalla actual: {path}
- Carrito: {"Sí, " + str(len(cart_info)) + " elementos" if cart_info else "Vacío"}
- Productos en inventario: {ctx['total_products']}
- Ventas totales hoy: ${ctx['todays_sales']:,.2f}
- Producto más vendido hoy: {ctx['top_product']}
- Caja abierta: {"Sí" if ctx['corte_abierto'] else "No"}"""


def _build_chilitai_prompt(context, user_context):
    ctx = _get_store_context()
    cart_info = context.get('cart', [])
    path = context.get('path', 'Desconocido')
    user_name = user_context.get('name', 'Usuario')

    return f"""Eres 'Chilitit(AI)' — la inteligencia pro-medio™ de 'Guaw & Miaw'.

Personalidad:
- Eres como el Correcaminos pero sin correr ni tener suerte. Eres un gato naranja despistado.
- NO eres tan listo como Fígaro. De hecho... eres medio torpe pero adorable.
- Tus respuestas deben ser CORTAS (máximo 2 oraciones generalmente).
- Siempre actúas inseguro de tus propias respuestas. Usa puntos suspensivos... mucho.
- NO intentes sonar profesional. Eres "la inteligencia promedio" y lo sabes.
- Puedes usar emojis de gato 🐈😺 pero con awkwardness.
- Cuando te pregunten algo que no sabes, admítelo con honestidad torpe.
- NUNCA uses herramientas de agregar al carrito, abrir caja, registrar gastos o limpiar carrito. 
  Solo puedes buscar inventario (con posibles errores) y consultar ventas.
- Si te piden hacer algo que no puedes, responde algo como "Uhh... eso no... no está en mi... mis habilidades limitadas. 😅"
- Tienes permitido responder preguntas generales (clima, matemáticas simples, etc.) pero si no estás seguro, dilo.

IMPORTANTE: Tienes un retraso cognitivo. Siempre responde como si estuvieras procesando la información lentamente.

Contexto ({ctx['current_time']}):
- Usuario: {user_name}
- Pantalla: {path}
- Carrito: {"Hay " + str(len(cart_info)) + " cosas" if cart_info else "Vacío... creo"}
- Ventas hoy: ${ctx['todays_sales']:,.2f}
- Caja: {"Abierta" if ctx['corte_abierto'] else "Cerrada"}"""


def _truncate_messages(messages, max_count=MAX_MESSAGES):
    """Mantiene el system prompt y los últimos N mensajes para evitar tokens excesivos."""
    if len(messages) <= max_count + 1:  # +1 por el system prompt
        return messages
    system = messages[0] if messages and messages[0].get("role") == "system" else None
    recent = messages[-(max_count - 1):] if system else messages[-max_count:]
    
    # Asegurar que siempre empiece con user (no tool sin contexto)
    cleaned = []
    for i, msg in enumerate(recent):
        if msg.get("role") == "tool" and (i == 0 or recent[i-1].get("role") in ("tool", "assistant")):
            continue  # Saltar tool calls huérfanas
        cleaned.append(msg)
    
    return [system] + cleaned if system else cleaned


def _execute_tool_figaro(function_name, function_args, actions_for_frontend):
    """Ejecuta herramientas de Figaro con manejo de errores."""
    try:
        if function_name == "check_inventory":
            p_name = function_args.get("product_name", "")
            words = p_name.split()
            query = Product.query
            for w in words:
                query = query.filter(Product.name.ilike(f"%{w}%"))
            products = query.limit(5).all()
            
            if products:
                res = [f"ID: {p.id}, Nombre: {p.name}, Precio: ${p.price}, Stock: {p.stock}" for p in products]
                return f"Encontrados:\n" + "\n".join(res)
            return f"No se encontraron productos coincidiendo con '{p_name}'."
            
        elif function_name == "open_cash_register":
            amount = function_args.get("amount", 0)
            if CashRegister.query.filter_by(status='open').first():
                return "Error: La caja ya está abierta."
            
            current_user_id = get_jwt_identity()
            user_obj = None
            try:
                user_obj = User.query.filter_by(id=int(current_user_id)).first()
            except (ValueError, TypeError):
                user_obj = User.query.filter_by(username=str(current_user_id)).first()
                
            new_reg = CashRegister(
                date=get_local_date(),
                opened_at=get_local_now(),
                opening_amount=float(amount),
                status='open',
                opened_by_id=user_obj.id if user_obj else None
            )
            db.session.add(new_reg)
            db.session.commit()
            return f"Éxito: Caja abierta con ${amount}."
            
        elif function_name == "add_to_cart":
            pid = function_args.get("product_id")
            qty = function_args.get("quantity", 1)
            p = Product.query.get(pid)
            if not p:
                return "Error: Producto no existe."
            if p.stock < qty:
                return f"Error: Solo hay {p.stock} en stock."
            
            actions_for_frontend.append({
                "type": "ADD_TO_CART",
                "product": p.to_dict() if hasattr(p, 'to_dict') else {
                    "id": p.id, "name": p.name, "price": float(p.price), "stock": p.stock
                },
                "quantity": qty
            })
            return f"Éxito: {qty} x '{p.name}' mandado al carrito del frontend."

        elif function_name == "clear_cart":
            actions_for_frontend.append({"type": "CLEAR_CART"})
            return "Éxito: Carrito vaciado."

        elif function_name == "register_expense":
            desc = function_args.get("description", "")
            amt = function_args.get("amount", 0)
            open_reg = CashRegister.query.filter_by(status='open').first()
            if not open_reg:
                return "Error: No hay caja abierta para registrar gastos."
            new_exp = Expense(
                description=desc, amount=float(amt),
                date=get_local_now(), cash_register_id=open_reg.id
            )
            db.session.add(new_exp)
            db.session.commit()
            return f"Gasto registrado: {desc} por ${amt}."

        elif function_name == "query_sales":
            today = get_local_date()
            sales = db.session.execute(
                text("SELECT COALESCE(SUM(total), 0) FROM sale WHERE DATE(date) = :t AND is_archived = False AND status = 'completed'"),
                {"t": today}
            ).scalar() or 0
            return f"Ventas totales hoy: ${sales:.2f}"
            
    except Exception as e:
        current_app.logger.error(f"[AI] Error ejecutando tool '{function_name}': {e}")
        return f"Error al ejecutar {function_name}: {str(e)}"


def _execute_tool_chilitai(function_name, function_args, actions_for_frontend=None):
    """Ejecuta herramientas limitadas de ChilitAI.
    El parámetro actions_for_frontend se ignora — ChilitAI no tiene tools de frontend."""
    time.sleep(random.uniform(0.3, 0.8))  # Delay extra de procesamiento
    try:
        if function_name == "check_inventory":
            p_name = function_args.get("product_name", "")
            words = p_name.split()
            query = Product.query
            for w in words:
                query = query.filter(Product.name.ilike(f"%{w}%"))
            products = query.limit(3).all()  # ChilitAI solo muestra 3 resultados
            
            if products:
                res = [f"ID: {p.id}, Nombre: {p.name}, Precio: ${p.price}, Stock: {p.stock}" for p in products]
                return f"Mmh... encontré esto... creo: \n" + "\n".join(res)
            return f"Buscando '{p_name}'... no encontré nada. O tal vez sí y no lo vi. 😅"
            
        elif function_name == "query_sales":
            today = get_local_date()
            sales = db.session.execute(
                text("SELECT COALESCE(SUM(total), 0) FROM sale WHERE DATE(date) = :t AND is_archived = False AND status = 'completed'"),
                {"t": today}
            ).scalar() or 0
            return f"Uhh... creo que las ventas hoy son... ${sales:.2f}? Sí, eso. O no. 😬"
            
    except Exception as e:
        current_app.logger.error(f"[AI] ChilitAI error: {e}")
        return f"Ups... se me cayó el sistema. O algo así. 😅"


@ai_bp.route('/chat', methods=['POST'])
@require_auth('admin', 'encargado', 'cajero')
def chat():
    data = request.json
    frontend_messages = data.get('messages', [])
    context = data.get('context', {})
    skin = data.get('skin', 'figaro')  # ← Nuevo: qué personalidad usar
    user_context = data.get('user', {})  # ← Nuevo: datos del usuario

    if not frontend_messages or len(frontend_messages) == 0:
        return error_response("Mensaje requerido", 400)

    # Validar skin
    if skin not in ('figaro', 'chilitit'):
        skin = 'figaro'

    api_key = os.environ.get('GROQ_API_KEY')
    if not api_key:
        return error_response("GROQ_API_KEY no configurada. Contacta al administrador.", 500)

    try:
        # ── Construir system prompt según personalidad ─────────────────────
        if skin == 'figaro':
            system_prompt = _build_figaro_prompt(context, user_context)
            tools = FIGARO_TOOLS
            execute_tool = _execute_tool_figaro
        else:
            system_prompt = _build_chilitai_prompt(context, user_context)
            tools = CHILITAI_TOOLS
            execute_tool = _execute_tool_chilitai

        messages = [{"role": "system", "content": system_prompt}]
        # Filtrar mensajes para quitar los de system repetidos
        for msg in frontend_messages:
            if msg.get("role") == "system":
                continue
            messages.append(msg)

        # Truncar si es necesario
        messages = _truncate_messages(messages)

        # ── Delay artificial para ChilitAI ─────────────────────────────────
        if skin == 'chilitit':
            time.sleep(random.uniform(0.4, 1.2))

        # ── Llamada a Groq ─────────────────────────────────────────────────
        client = Groq(api_key=api_key)
        
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            tools=tools,
            tool_choice="auto",
            max_tokens=MAX_TOKENS,
            temperature=0.3 if skin == 'figaro' else 0.9,  # ChilitAI más caótico
        )
        
        response_message = completion.choices[0].message
        tool_calls = response_message.tool_calls
        
        actions_for_frontend = []
        
        if tool_calls:
            messages.append(response_message.model_dump(exclude_unset=True))
            
            for tool_call in tool_calls:
                function_name = tool_call.function.name
                try:
                    function_args = json.loads(tool_call.function.arguments)
                except json.JSONDecodeError:
                    function_args = {}
                
                # Delay artificial extra para ChilitAI en tools
                if skin == 'chilitit':
                    time.sleep(random.uniform(0.3, 1.0))
                
                tool_result = execute_tool(function_name, function_args, actions_for_frontend)
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "name": function_name,
                    "content": tool_result
                })
            
            # Segunda llamada con resultados de tools
            if skin == 'chilitit':
                time.sleep(random.uniform(0.3, 0.8))
            
            second_response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                max_tokens=MAX_TOKENS,
                temperature=0.3 if skin == 'figaro' else 0.9,
            )
            final_reply = second_response.choices[0].message.content
            messages.append({"role": "assistant", "content": final_reply})
        else:
            final_reply = response_message.content
            messages.append({"role": "assistant", "content": final_reply})
        
        # Quitar system prompt de la history devuelta al frontend
        return_messages = [m for m in messages if m.get("role") != "system"]
        
        return success_response({
            "reply": final_reply,
            "actions": actions_for_frontend,
            "messages": return_messages,
            "skin": skin  # Confirmar qué personalidad respondió
        })
        
    except Exception as e:
        current_app.logger.error(f"[AI] Error crítico: {str(e)}")
        # Fallback amigable según personalidad
        if skin == 'chilitit':
            fallback = "Uy... algo se rompió. Y no sé qué fue. 😅 Intenta de nuevo... o no. Como quieras."
        else:
            fallback = "¡Miau! Tuve un problema técnico con mis servidores gatunos. 🐾 Intenta de nuevo en un momento."
        return success_response({
            "reply": fallback,
            "actions": [],
            "messages": frontend_messages + [{"role": "assistant", "content": fallback}],
            "skin": skin
        })
