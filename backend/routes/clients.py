from flask import Blueprint, request
from backend.extensions import db
from backend.models.client import Client
from backend.utils import success_response, error_response
from backend.auth_middleware import require_auth

clients_bp = Blueprint('clients', __name__)

@clients_bp.route('/clients', methods=['GET'])
@require_auth('admin', 'encargado', 'cajero', 'vendedor-caja')
def get_clients():
    print("[GET] /clients - Listing all clients")
    try:
        clients = Client.query.all()
        return success_response([c.to_dict() for c in clients])
    except Exception as e:
        return error_response(str(e), 500)

@clients_bp.route('/clients', methods=['POST'])
@require_auth('admin', 'encargado', 'cajero', 'vendedor-caja')
def add_client():
    data = request.json
    print(f"[POST] /clients - Creating client: {data.get('name')}")
    try:
        if not data.get('name'):
            return error_response("El nombre es obligatorio.", 400)
            
        new_client = Client(
            name=data['name'],
            email=data.get('email'),
            phone=data.get('phone'),
            address=data.get('address'),
            loyalty_points=data.get('loyalty_points', data.get('points', 0))
        )
        db.session.add(new_client)
        db.session.commit()
        return success_response(new_client.to_dict(), "Cliente creado con éxito.", 201)
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 400)

@clients_bp.route('/clients/<int:id>', methods=['PUT'])
@require_auth('admin', 'encargado', 'cajero', 'vendedor-caja')
def update_client(id):
    print(f"[PUT] /clients/{id} - Updating client data")
    client = db.get_or_404(Client, id)
    data = request.json
    try:
        client.name = data.get('name', client.name)
        client.email = data.get('email', client.email)
        client.phone = data.get('phone', client.phone)
        client.address = data.get('address', client.address)
        client.loyalty_points = data.get('loyalty_points', data.get('points', client.loyalty_points))
        
        db.session.commit()
        return success_response(client.to_dict(), "Cliente actualizado.")
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 400)

@clients_bp.route('/clients/<int:id>', methods=['DELETE'])
@require_auth('admin', 'encargado')
def delete_client(id):
    print(f"[DELETE] /clients/{id} - Removing client")
    try:
        client = db.get_or_404(Client, id)
        db.session.delete(client)
        db.session.commit()
        return success_response(None, "Cliente eliminado.")
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)
