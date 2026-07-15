from flask import Blueprint, request
from backend.extensions import db
from backend.models import Supplier
from backend.utils import success_response, error_response
from backend.auth_middleware import require_auth

suppliers_bp = Blueprint('suppliers', __name__)

@suppliers_bp.route('/suppliers', methods=['GET'])
@require_auth('admin', 'encargado', 'cajero', 'vendedor-caja')
def get_suppliers():
    print("[GET] /suppliers - Listing all suppliers")
    try:
        suppliers = Supplier.query.all()
        return success_response([s.to_dict() for s in suppliers])
    except Exception as e:
        return error_response(str(e), 500)

@suppliers_bp.route('/suppliers', methods=['POST'])
@require_auth('admin', 'encargado')
def add_supplier():
    data = request.json
    print(f"[POST] /suppliers - Adding supplier: {data.get('name')}")
    try:
        new_supplier = Supplier(
            name=data['name'],
            contact_info=data.get('contact_info', ''),
            notes=data.get('notes', '')
        )
        db.session.add(new_supplier)
        db.session.commit()
        return success_response(new_supplier.to_dict(), status=201)
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 400)

@suppliers_bp.route('/suppliers/<int:id>', methods=['PUT'])
@require_auth('admin', 'encargado')
def update_supplier(id):
    print(f"[PUT] /suppliers/{id} - Updating supplier")
    supplier = db.get_or_404(Supplier, id)
    data = request.json
    try:
        supplier.name = data.get('name', supplier.name)
        supplier.contact_info = data.get('contact_info', supplier.contact_info)
        supplier.notes = data.get('notes', supplier.notes)
        db.session.commit()
        return success_response(supplier.to_dict())
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 400)

@suppliers_bp.route('/suppliers/<int:id>', methods=['DELETE'])
@require_auth('admin', 'encargado')
def delete_supplier(id):
    print(f"[DELETE] /suppliers/{id} - Deleting supplier")
    try:
        supplier = db.get_or_404(Supplier, id)
        db.session.delete(supplier)
        db.session.commit()
        return success_response(None, "Proveedor eliminado")
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)
