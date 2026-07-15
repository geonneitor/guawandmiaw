"""Add sell_by field to product table

Revision ID: add_sell_by_field
Revises: 
Create Date: 2026-07-05

Descripción:
- Agrega columna 'sell_by' al modelo Product
- Valores: 'weight' (se vende por peso/kg) | 'price' (precio fijo por unidad)
- Los productos existentes se migran a 'price' por defecto
- Los que tenían is_bulk=True se migran a 'weight' automáticamente
"""
from alembic import op
import sqlalchemy as sa


def upgrade():
    # Agregar columna sell_by con default 'price'
    op.add_column('product',
        sa.Column('sell_by', sa.String(10), nullable=True, server_default='price')
    )
    
    # Migrar productos existentes con is_bulk=True a sell_by='weight'
    op.execute("""
        UPDATE product 
        SET sell_by = 'weight' 
        WHERE is_bulk = 1
    """)
    
    # Asegurar que el resto tenga 'price'
    op.execute("""
        UPDATE product 
        SET sell_by = 'price' 
        WHERE sell_by IS NULL OR sell_by = ''
    """)


def downgrade():
    op.drop_column('product', 'sell_by')
