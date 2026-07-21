from flask import Blueprint, request, jsonify, send_file
from backend.extensions import db
from backend.models import Product, Supplier, Category, AuditLog, InventoryTransaction
from backend.utils import success_response, error_response
from backend.auth_middleware import require_auth
from sqlalchemy.orm import joinedload
import time
import random
from datetime import date, datetime

products_bp = Blueprint('products', __name__)

@products_bp.route('/products', methods=['GET'])
@require_auth('admin', 'encargado', 'cajero', 'vendedor-caja')
def get_products():
    print(f"[GET] /products - Listing all active products")
    products = Product.query.options(
        joinedload(Product.category),
        joinedload(Product.brand),
        joinedload(Product.supplier)
    ).filter_by(is_active=True).all()
    return success_response([p.to_dict() for p in products])

@products_bp.route('/products', methods=['POST'])
@require_auth('admin', 'encargado')
def add_product():
    data = request.json
    print(f"[POST] /products - Creating product: {data.get('name')}")
    try:
        cat_name = data.get('category', 'General')
        cat = Category.query.filter_by(name=cat_name).first()
        if not cat:
            cat = Category(name=cat_name)
            db.session.add(cat)
            db.session.flush()

        barcode = data.get('barcode')
        if not barcode:
            barcode = f"AUTO-{int(time.time()*1000)}-{random.randint(100,999)}"

        new_product = Product(
            name=data.get('name'),
            price=int(round(float(data.get('price')))),        # Sin decimales
            cost=int(round(float(data.get('cost', 0)))),       # Sin decimales
            stock=float(data.get('stock', 0)),
            is_bulk=data.get('is_bulk', False),
            sell_by=data.get('sell_by', 'price'),              # 'weight' | 'price'
            unit=data.get('unit', 'ud'),
            bulto_stock=int(data.get('bulto_stock', 0)),
            bulto_weight=float(data.get('bulto_weight', 0)),
            category_id=cat.id,
            barcode=barcode,
            supplier_id=data.get('supplier_id'),
            promo_active=data.get('promo_active', False),
            promo_type=data.get('promo_type', 'fixed'),
            promo_min_quantity=data.get('promo_min_quantity') if data.get('promo_min_quantity') else None,
            promo_discount=int(round(float(data['promo_discount']))) if data.get('promo_discount') else None,
            promo_start_date=datetime.strptime(data.get('promo_start_date'), '%Y-%m-%d').date() if data.get('promo_start_date') else None,
            expiry_date=datetime.strptime(data.get('expiry_date'), '%Y-%m-%d').date() if data.get('expiry_date') else None,
            min_stock=float(data.get('min_stock', 0))
        )
        db.session.add(new_product)
        db.session.commit()
        return success_response(new_product.to_dict(), status=201)
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] /products: {str(e)}")
        return error_response(str(e), 400)

@products_bp.route('/products/<int:id>', methods=['PUT'])
@require_auth('admin', 'encargado')
def update_product(id):
    print(f"[PUT] /products/{id} - Updating product")
    product = db.get_or_404(Product, id)
    data = request.json
    try:
        cat_name = data.get('category')
        if cat_name:
            cat = Category.query.filter_by(name=cat_name).first()
            if not cat:
                cat = Category(name=cat_name)
                db.session.add(cat)
                db.session.flush()
            product.category_id = cat.id

        product.name = data.get('name', product.name)
        product.price = int(round(float(data.get('price', product.price))))  # Sin decimales
        
        new_stock = float(data.get('stock', product.stock))
        if new_stock != product.stock:
            audit = AuditLog(
                action="AJUSTE_MANUAL_STOCK",
                description=f"Stock de {product.name} editado manualmente de {product.stock} a {new_stock}."
            )
            db.session.add(audit)
            product.stock = new_stock
            
        product.cost = int(round(float(data.get('cost', product.cost))))     # Sin decimales
        product.is_bulk = data.get('is_bulk', product.is_bulk)
        product.sell_by = data.get('sell_by', product.sell_by or 'price')    # 'weight' | 'price'
        product.unit = data.get('unit', product.unit)
        product.bulto_stock = int(data.get('bulto_stock', product.bulto_stock))
        product.bulto_weight = float(data.get('bulto_weight', product.bulto_weight))
        
        new_barcode = data.get('barcode')
        if new_barcode:
            product.barcode = new_barcode
            
        product.supplier_id = data.get('supplier_id', product.supplier_id)
        product.promo_active = data.get('promo_active', product.promo_active)
        product.promo_type = data.get('promo_type', product.promo_type)
        product.promo_min_quantity = data.get('promo_min_quantity') if data.get('promo_min_quantity') else None
        product.promo_discount = int(round(float(data['promo_discount']))) if data.get('promo_discount') else None
        
        if 'promo_start_date' in data:
            product.promo_start_date = datetime.strptime(data['promo_start_date'], '%Y-%m-%d').date() if data['promo_start_date'] else None
        
        if 'expiry_date' in data:
            product.expiry_date = datetime.strptime(data['expiry_date'], '%Y-%m-%d').date() if data['expiry_date'] else None
        
        if 'min_stock' in data:
            product.min_stock = float(data['min_stock'])
        
        db.session.commit()
        return success_response(product.to_dict())
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] /products/{id}: {str(e)}")
        return error_response(str(e), 400)

@products_bp.route('/products/<int:id>', methods=['DELETE'])
@require_auth('admin', 'encargado')
def delete_product(id):
    print(f"[DELETE] /products/{id} - Soft deleting product")
    product = db.get_or_404(Product, id)
    try:
        product.is_active = False
        audit = AuditLog(action="BORRADO_PRODUCTO", description=f"Producto archivado: {product.name}")
        db.session.add(audit)
        db.session.commit()
        return success_response(None, "Producto archivado correctamente")
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)

@products_bp.route('/products/<int:id>/open-bulto', methods=['POST'])
@require_auth('admin', 'encargado', 'cajero')
def open_bulto(id):
    print(f"[POST] /products/{id}/open-bulto - Opening a sack")
    product = db.get_or_404(Product, id)
    if product.bulto_stock <= 0:
        return error_response("No hay bultos disponibles para abrir", 400)
    
    try:
        product.bulto_stock -= 1
        product.stock += product.bulto_weight
        
        audit = AuditLog(
            action="APERTURA_BULTO",
            description=f"Bulto abierto de {product.name}. Se sumaron {product.bulto_weight}kg al stock suelto."
        )
        db.session.add(audit)
        
        db.session.commit()
        return success_response(product.to_dict(), f"Bulto abierto. Se agregaron {product.bulto_weight}kg al stock.")
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)

@products_bp.route('/products/template', methods=['GET'])
@require_auth('admin', 'encargado')
def get_product_template():
    print("[GET] /products/template")
    import pandas as pd
    from io import BytesIO
    columns = [
        'Nombre', 'Precio', 'Costo', 'Stock', 'Categoría',
        'Código Barras', 'Es Granel (Si/No)', 'Proveedor (Nombre)',
        'Promo Activa (Si/No)', 'Promo Min Cantidad', 'Promo Descuento ($)',
        'Bultos (Stock)', 'Bulto (Kg)'
    ]
    df = pd.DataFrame(columns=columns)
    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='Productos', index=False)
        instructions = pd.DataFrame({
            'Campo': columns,
            'Instrucción': [
                'Obligatorio. Nombre del producto.',
                'Obligatorio. Precio de venta (número).',
                'Opcional. Costo de adquisición (número).',
                'Opcional. Cantidad inicial (número).',
                'Opcional. Categoría del producto.',
                'Opcional. Si se deja vacío, se genera automático. Debe ser único.',
                'Si / No. Si es "Si", permite decimales en cantidad.',
                'Opcional. Nombre del proveedor. Se crea si no existe.',
                'Si / No. Activar promoción.',
                'Número. Cantidad mínima para aplicar promo (1 = rebaja directa).',
                'Número. Monto fijo a descontar ($).',
                'Número. Cantidad de costales/bultos cerrados enteros en bodega.',
                'Número. Peso en Kg que contiene CADA bulto cerrado.'
            ],
            'Tipo': [
                'Texto', 'Número', 'Número', 'Número', 'Texto', 'Texto/Número', 'Texto', 'Texto', 'Texto', 'Número', 'Número', 'Número', 'Número'
            ]
        })
        instructions.to_excel(writer, sheet_name='Instrucciones', index=False)
    output.seek(0)
    return send_file(
        output,
        download_name='plantilla_productos_guaw_miaw.xlsx',
        as_attachment=True,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )

@products_bp.route('/products/import', methods=['POST'])
@require_auth('admin', 'encargado')
def import_products():
    print("[POST] /products/import - Bulk upload")
    import pandas as pd
    from io import BytesIO
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    try:
        df = pd.read_excel(file, sheet_name='Productos')
        col_map = {
            'Nombre': 'name', 'Precio': 'price', 'Costo': 'cost', 'Stock': 'stock',
            'Categoría': 'category', 'Código Barras': 'barcode', 'Es Granel (Si/No)': 'is_bulk',
            'Proveedor (Nombre)': 'supplier_name', 'Promo Activa (Si/No)': 'promo_active',
            'Promo Min Cantidad': 'promo_min_quantity', 'Promo Descuento ($)': 'promo_discount',
            'Bultos (Stock)': 'bulto_stock', 'Bulto (Kg)': 'bulto_weight'
        }
        missing_cols = [col for col in col_map.keys() if col not in df.columns]
        if missing_cols:
            return jsonify({"error": f"Faltan columnas requeridas: {', '.join(missing_cols)}"}), 400
            
        success_count = 0
        update_count = 0
        errors = []
        existing_products_by_barcode = {p.barcode: p for p in Product.query.filter(Product.barcode.isnot(None)).all() if p.barcode}
        existing_products_by_name = {p.name.lower(): p for p in Product.query.all()}
        suppliers_cache = {s.name.lower(): s for s in Supplier.query.all()}
        
        for index, row in df.iterrows():
            row_num = index + 2
            try:
                if pd.isna(row['Nombre']) or str(row['Nombre']).strip() == '':
                    errors.append(f"Fila {row_num}: El nombre es obligatorio.")
                    continue
                if pd.isna(row['Precio']):
                    errors.append(f"Fila {row_num}: El precio es obligatorio.")
                    continue
                try:
                    price = float(row['Precio'])
                    if price < 0: raise ValueError
                except:
                    errors.append(f"Fila {row_num}: Precio inválido.")
                    continue

                barcode = str(row['Código Barras']).strip() if not pd.isna(row['Código Barras']) else None
                existing_product = None
                if barcode and barcode in existing_products_by_barcode:
                    existing_product = existing_products_by_barcode[barcode]
                else:
                    name_key = str(row['Nombre']).strip().lower()
                    if name_key in existing_products_by_name:
                        existing_product = existing_products_by_name[name_key]
                
                supplier_id = None
                supplier_name = str(row['Proveedor (Nombre)']).strip() if not pd.isna(row['Proveedor (Nombre)']) else None
                if supplier_name:
                    supplier_key = supplier_name.lower()
                    if supplier_key in suppliers_cache:
                        supplier_id = suppliers_cache[supplier_key].id
                    else:
                        new_supplier = Supplier(name=supplier_name)
                        db.session.add(new_supplier)
                        db.session.flush()
                        suppliers_cache[supplier_key] = new_supplier
                        supplier_id = new_supplier.id
                
                def parse_bool(val):
                    if pd.isna(val): return False
                    return str(val).strip().lower() in ['si', 'sí', 'yes', 'true', '1']
                
                is_bulk = parse_bool(row['Es Granel (Si/No)'])
                promo_active = parse_bool(row['Promo Activa (Si/No)'])
                promo_min_quantity = int(row['Promo Min Cantidad']) if not pd.isna(row['Promo Min Cantidad']) else None
                promo_discount = float(row['Promo Descuento ($)']) if not pd.isna(row['Promo Descuento ($)']) else None
                cost = float(row['Costo']) if not pd.isna(row['Costo']) else 0.0
                stock = float(row['Stock']) if not pd.isna(row['Stock']) else 0.0
                category = str(row['Categoría']).strip() if not pd.isna(row['Categoría']) else 'General'
                
                bulto_stock = int(row['Bultos (Stock)']) if ('Bultos (Stock)' in df.columns and not pd.isna(row['Bultos (Stock)'])) else 0
                bulto_weight = float(row['Bulto (Kg)']) if ('Bulto (Kg)' in df.columns and not pd.isna(row['Bulto (Kg)'])) else 0.0

                cat = Category.query.filter_by(name=category).first()
                if not cat:
                    cat = Category(name=category)
                    db.session.add(cat)
                    db.session.flush()

                if existing_product:
                    existing_product.name = str(row['Nombre']).strip()
                    existing_product.price = price
                    existing_product.cost = cost
                    existing_product.stock += stock
                    existing_product.category_id = cat.id
                    if barcode: existing_product.barcode = barcode
                    existing_product.is_bulk = is_bulk
                    existing_product.supplier_id = supplier_id
                    existing_product.promo_active = promo_active
                    existing_product.promo_min_quantity = promo_min_quantity
                    existing_product.promo_discount = promo_discount
                    if 'Bultos (Stock)' in df.columns:
                        existing_product.bulto_stock = bulto_stock
                    if 'Bulto (Kg)' in df.columns:
                        existing_product.bulto_weight = bulto_weight
                    update_count += 1
                else:
                    new_product = Product(
                        name=str(row['Nombre']).strip(),
                        price=price,
                        cost=cost,
                        stock=stock,
                        category_id=cat.id,
                        barcode=barcode,
                        is_bulk=is_bulk,
                        supplier_id=supplier_id,
                        promo_active=promo_active,
                        promo_min_quantity=promo_min_quantity,
                        promo_discount=promo_discount,
                        bulto_stock=bulto_stock,
                        bulto_weight=bulto_weight
                    )
                    if not new_product.barcode:
                        new_product.barcode = f"AUTO-{int(time.time()*1000)}-{random.randint(100,999)}"
                    db.session.add(new_product)
                    if new_product.barcode: existing_products_by_barcode[new_product.barcode] = new_product
                    existing_products_by_name[new_product.name.lower()] = new_product
                    success_count += 1
            except Exception as e:
                errors.append(f"Fila {row_num}: Error inesperado - {str(e)}")
        
        db.session.commit()
        message = f"Se importaron {success_count} nuevos y se actualizaron {update_count} productos."
        if errors:
            message += f" Hubo {len(errors)} errores."
        return success_response({"success_count": success_count, "errors": errors}, message)
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] /products/import: {str(e)}")
        return error_response(f"Error al procesar archivo: {str(e)}", 500)

@products_bp.route('/products/export', methods=['GET'])
@require_auth('admin', 'encargado')
def export_products():
    print("[GET] /products/export - Downloading inventory")
    import pandas as pd
    from io import BytesIO
    try:
        products = Product.query.all()
        data = []
        for p in products:
            data.append({
                'Nombre': p.name,
                'Precio': p.price,
                'Costo': p.cost,
                'Stock': p.stock,
                'Categoría': p.category.name if p.category else 'General',
                'Código Barras': p.barcode,
                'Es Granel (Si/No)': 'Si' if p.is_bulk else 'No',
                'Proveedor (Nombre)': p.supplier.name if p.supplier else '',
                'Promo Activa (Si/No)': 'Si' if p.promo_active else 'No',
                'Promo Min Cantidad': p.promo_min_quantity,
                'Promo Descuento ($)': p.promo_discount,
                'Bultos (Stock)': p.bulto_stock,
                'Bulto (Kg)': p.bulto_weight
            })
        df = pd.DataFrame(data)
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Productos', index=False)
        output.seek(0)
        filename = f"inventario_guaw_miaw_{date.today()}.xlsx"
        return send_file(
            output,
            download_name=filename,
            as_attachment=True,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)

