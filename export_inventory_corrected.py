"""
Script para re-exportar el inventario local (SQLite) a SQL compatible con Supabase (PostgreSQL).
Corrige el bug de sell_by: productos con is_bulk=True ahora tienen sell_by='weight'.
Genera UPSERT statements (INSERT ... ON CONFLICT DO UPDATE).

Uso: python export_inventory_corrected.py
Output: inventario_exportado_corregido.sql
"""
import sys
import os

sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from backend.app import create_app
from backend.extensions import db
from backend.models import Product, Category, Supplier, Brand

app = create_app()

def escape_sql(val):
    if val is None:
        return 'NULL'
    if isinstance(val, bool):
        return 'TRUE' if val else 'FALSE'
    if isinstance(val, (int, float)):
        return str(val)
    # Escape single quotes
    return "'" + str(val).replace("'", "''") + "'"

def date_to_sql(val):
    if val is None:
        return 'NULL'
    return "'" + val.isoformat() + "'"

def datetime_to_sql(val):
    if val is None:
        return 'NULL'
    return "'" + str(val) + "'"

with app.app_context():
    output_lines = []
    output_lines.append("-- ═══════════════════════════════════════════════════════════════")
    output_lines.append("-- Exportación CORREGIDA de Inventario para Supabase (PostgreSQL)")
    output_lines.append("-- Generado automáticamente. Incluye fix de sell_by.")
    output_lines.append("-- ═══════════════════════════════════════════════════════════════")
    output_lines.append("")
    
    # TRUNCATE en orden correcto
    output_lines.append("-- Limpiamos las tablas (en el orden correcto para no romper llaves foráneas)")
    output_lines.append('TRUNCATE TABLE sale_item, inventory_transaction, "product", "supplier", "brand", "category" RESTART IDENTITY CASCADE;')
    output_lines.append("")
    
    # ─── CATEGORIES ───
    output_lines.append("")
    output_lines.append("-- Tabla: category")
    categories = Category.query.all()
    for cat in categories:
        output_lines.append(
            f'INSERT INTO "category" ("id", "name", "description", "is_active") '
            f'VALUES ({cat.id}, {escape_sql(cat.name)}, {escape_sql(cat.description)}, {escape_sql(cat.is_active)}) '
            f'ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name", "description" = EXCLUDED."description", "is_active" = EXCLUDED."is_active";'
        )
    
    # ─── BRANDS ───
    output_lines.append("")
    output_lines.append("-- Tabla: brand")
    brands = Brand.query.all()
    for brand in brands:
        output_lines.append(
            f'INSERT INTO "brand" ("id", "name") '
            f'VALUES ({brand.id}, {escape_sql(brand.name)}) '
            f'ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name";'
        )
    if not brands:
        output_lines.append("-- (Sin marcas registradas)")
    
    # ─── SUPPLIERS ───
    output_lines.append("")
    output_lines.append("-- Tabla: supplier")
    suppliers = Supplier.query.all()
    for sup in suppliers:
        output_lines.append(
            f'INSERT INTO "supplier" ("id", "name", "phone", "email", "contact_info", "notes") '
            f'VALUES ({sup.id}, {escape_sql(sup.name)}, {escape_sql(sup.phone)}, {escape_sql(sup.email)}, {escape_sql(sup.contact_info)}, {escape_sql(sup.notes)}) '
            f'ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name", "phone" = EXCLUDED."phone", "email" = EXCLUDED."email", "contact_info" = EXCLUDED."contact_info", "notes" = EXCLUDED."notes";'
        )
    if not suppliers:
        output_lines.append("-- (Sin proveedores registrados)")
    
    # ─── PRODUCTS (with sell_by FIX) ───
    output_lines.append("")
    output_lines.append("-- Tabla: product (con corrección de sell_by)")
    products = Product.query.filter_by(is_active=True).all()
    
    fixed_count = 0
    for p in products:
        # ══ FIX: Corregir sell_by basado en is_bulk ══
        corrected_sell_by = 'weight' if p.is_bulk else 'price'
        if p.sell_by != corrected_sell_by:
            fixed_count += 1
        
        corrected_unit = p.unit
        if p.is_bulk and p.unit == 'ud':
            corrected_unit = 'kg'
        
        cols = '"id", "name", "price", "cost", "stock", "min_stock", "is_bulk", "sell_by", "unit", "bulto_stock", "bulto_weight", "barcode", "is_active", "category_id", "brand_id", "supplier_id", "promo_active", "promo_type", "promo_min_quantity", "promo_discount", "promo_start_date", "expiry_date", "created_at", "updated_at", "ignore_stock_alerts"'
        
        vals = f"{p.id}, {escape_sql(p.name)}, {p.price}, {p.cost}, {p.stock}, {p.min_stock}, {escape_sql(p.is_bulk)}, {escape_sql(corrected_sell_by)}, {escape_sql(corrected_unit)}, {p.bulto_stock}, {p.bulto_weight}, {escape_sql(p.barcode)}, {escape_sql(p.is_active)}, {escape_sql(p.category_id)}, {escape_sql(p.brand_id)}, {escape_sql(p.supplier_id)}, {escape_sql(p.promo_active)}, {escape_sql(p.promo_type)}, {escape_sql(p.promo_min_quantity)}, {escape_sql(p.promo_discount)}, {date_to_sql(p.promo_start_date)}, {date_to_sql(p.expiry_date)}, {datetime_to_sql(p.created_at)}, {datetime_to_sql(p.updated_at)}, {escape_sql(p.ignore_stock_alerts)}"
        
        update_clause = '"name" = EXCLUDED."name", "price" = EXCLUDED."price", "cost" = EXCLUDED."cost", "stock" = EXCLUDED."stock", "min_stock" = EXCLUDED."min_stock", "is_bulk" = EXCLUDED."is_bulk", "sell_by" = EXCLUDED."sell_by", "unit" = EXCLUDED."unit", "bulto_stock" = EXCLUDED."bulto_stock", "bulto_weight" = EXCLUDED."bulto_weight", "barcode" = EXCLUDED."barcode", "is_active" = EXCLUDED."is_active", "category_id" = EXCLUDED."category_id", "brand_id" = EXCLUDED."brand_id", "supplier_id" = EXCLUDED."supplier_id", "promo_active" = EXCLUDED."promo_active", "promo_type" = EXCLUDED."promo_type", "promo_min_quantity" = EXCLUDED."promo_min_quantity", "promo_discount" = EXCLUDED."promo_discount", "promo_start_date" = EXCLUDED."promo_start_date", "expiry_date" = EXCLUDED."expiry_date", "created_at" = EXCLUDED."created_at", "updated_at" = EXCLUDED."updated_at", "ignore_stock_alerts" = EXCLUDED."ignore_stock_alerts"'
        
        output_lines.append(
            f'INSERT INTO "product" ({cols}) VALUES ({vals}) ON CONFLICT ("id") DO UPDATE SET {update_clause};'
        )
    
    # ─── SEQUENCE RESET ───
    output_lines.append("")
    output_lines.append("-- Resetear secuencias para evitar colisiones de ID")
    output_lines.append("SELECT setval('category_id_seq', (SELECT COALESCE(MAX(id), 0) FROM category) + 1, false);")
    output_lines.append("SELECT setval('brand_id_seq', (SELECT COALESCE(MAX(id), 0) FROM brand) + 1, false);")
    output_lines.append("SELECT setval('supplier_id_seq', (SELECT COALESCE(MAX(id), 0) FROM supplier) + 1, false);")
    output_lines.append("SELECT setval('product_id_seq', (SELECT COALESCE(MAX(id), 0) FROM product) + 1, false);")
    output_lines.append("")
    
    # Write to file
    output_path = os.path.join(os.path.dirname(__file__), 'inventario_exportado_corregido.sql')
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(output_lines))
    
    print(f"[OK] Exportacion completada: {output_path}")
    print(f"   -> {len(categories)} categorias")
    print(f"   -> {len(brands)} marcas")
    print(f"   -> {len(suppliers)} proveedores")
    print(f"   -> {len(products)} productos activos")
    print(f"   -> {fixed_count} productos con sell_by corregido (is_bulk=True -> sell_by='weight')")
