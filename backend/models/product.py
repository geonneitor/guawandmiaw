from backend.extensions import db
from datetime import datetime, timezone

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    price = db.Column(db.Float, nullable=False)
    cost = db.Column(db.Float, nullable=True, default=0.0)
    stock = db.Column(db.Float, default=0.0)
    min_stock = db.Column(db.Float, default=0.0)
    is_bulk = db.Column(db.Boolean, default=False)
    # 'weight' = se vende por peso (kg/g), precio es por kg
    # 'price'  = se vende por precio fijo (unidad, paquete, etc.)
    sell_by = db.Column(db.String(10), default='price')
    unit = db.Column(db.String(10), default='ud')
    bulto_stock = db.Column(db.Integer, default=0)
    bulto_weight = db.Column(db.Float, default=0.0)
    barcode = db.Column(db.String(50), unique=True, nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    # Foreign Keys
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=True)
    brand_id = db.Column(db.Integer, db.ForeignKey('brand.id'), nullable=True)
    supplier_id = db.Column(db.Integer, db.ForeignKey('supplier.id'), nullable=True)

    # Promotions
    promo_active = db.Column(db.Boolean, default=False)
    promo_type = db.Column(db.String(10), default='fixed')
    promo_min_quantity = db.Column(db.Integer, nullable=True)
    promo_discount = db.Column(db.Float, nullable=True)
    promo_start_date = db.Column(db.Date, nullable=True)
    expiry_date = db.Column(db.Date, nullable=True)

    # Audit
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    category = db.relationship('Category', backref='products')
    brand = db.relationship('Brand', backref='products')
    supplier = db.relationship('Supplier', backref='products')

    def __init__(self, **kwargs):
        super(Product, self).__init__(**kwargs)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            # Los precios/costos ahora mantienen los decimales exactos
            'price': round(float(self.price), 2) if self.price is not None else 0.0,
            'cost': round(float(self.cost), 2) if self.cost is not None else 0.0,
            'stock': round(float(self.stock), 3),   # stock sí permite decimales (kg)
            'min_stock': round(float(self.min_stock), 3),
            'is_bulk': self.is_bulk,
            'sell_by': self.sell_by or 'price',     # 'weight' | 'price'
            'unit': self.unit,
            'bulto_stock': self.bulto_stock,
            'bulto_weight': round(float(self.bulto_weight), 3) if self.bulto_weight else 0,
            'barcode': self.barcode,
            'is_active': self.is_active,
            'category_id': self.category_id,
            'category': self.category.name if self.category else 'General',
            'brand_id': self.brand_id,
            'brand': self.brand.name if self.brand else None,
            'supplier_id': self.supplier_id,
            'supplier_name': self.supplier.name if self.supplier else None,
            'promo_active': self.promo_active,
            'promo_type': self.promo_type,
            'promo_min_quantity': self.promo_min_quantity,
            'promo_discount': round(float(self.promo_discount), 2) if self.promo_discount is not None else None,
            'promo_start_date': self.promo_start_date.isoformat() if self.promo_start_date else None,
            'expiry_date': self.expiry_date.isoformat() if self.expiry_date else None
        }
