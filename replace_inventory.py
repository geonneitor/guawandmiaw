import sys
import os
import pandas as pd
import time
import random

# Añadir el directorio actual al path para poder importar el backend
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from backend.app import create_app
from backend.extensions import db
from backend.models import Product, Category, Supplier

app = create_app()

excel_path = 'C:/Users/Rodrigo/OneDrive/Escritorio/ameprograma/GUAWYMIAW/INVENTACT.xlsx'

with app.app_context():
    print("Borrando todos los productos existentes...")
    Product.query.delete()
    db.session.commit()
    print("Productos borrados.")

    print(f"Leyendo Excel desde: {excel_path}")
    df = pd.read_excel(excel_path, sheet_name='Productos')
    
    success_count = 0
    errors = []

    suppliers_cache = {s.name.lower(): s for s in Supplier.query.all()}
    
    for index, row in df.iterrows():
        try:
            if pd.isna(row['Nombre']) or str(row['Nombre']).strip() == '':
                continue
            
            price = float(row['Precio']) if not pd.isna(row['Precio']) else 0.0
            cost = float(row['Costo']) if not pd.isna(row['Costo']) else 0.0
            stock = float(row['Stock']) if not pd.isna(row['Stock']) else 0.0
            category = str(row['Categoría']).strip() if not pd.isna(row['Categoría']) else 'General'
            
            barcode = str(row['Código Barras']).strip() if not pd.isna(row['Código Barras']) else None
            
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
            
            bulto_stock = int(row['Bultos (Stock)']) if ('Bultos (Stock)' in df.columns and not pd.isna(row['Bultos (Stock)'])) else 0
            bulto_weight = float(row['Bulto (Kg)']) if ('Bulto (Kg)' in df.columns and not pd.isna(row['Bulto (Kg)'])) else 0.0

            cat = Category.query.filter_by(name=category).first()
            if not cat:
                cat = Category(name=category)
                db.session.add(cat)
                db.session.flush()

            new_product = Product(
                name=str(row['Nombre']).strip(),
                price=price,
                cost=cost,
                stock=stock,
                category_id=cat.id,
                barcode=barcode,
                is_bulk=is_bulk,
                sell_by='weight' if is_bulk else 'price',
                unit='kg' if is_bulk else 'ud',
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
            success_count += 1
            
        except Exception as e:
            errors.append(f"Fila {index+2}: {str(e)}")

    db.session.commit()
    print(f"Completado. Se importaron {success_count} productos.")
    if errors:
        print(f"Errores encontrados ({len(errors)}):")
        for err in errors:
            print(err)
