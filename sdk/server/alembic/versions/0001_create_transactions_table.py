"""
Initial migration: create transactions table
"""

revision = '0001'
down_revision = None
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa

def upgrade():
    op.create_table(
        'transactions',
        sa.Column('id', sa.Integer, primary_key=True, index=True),
        sa.Column('transaction_id', sa.String, unique=True, nullable=False, index=True),
        sa.Column('gateway', sa.String, nullable=False, index=True),
        sa.Column('gateway_transaction_id', sa.String, nullable=True),
        sa.Column('status', sa.String, nullable=False, index=True),
        sa.Column('amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('currency', sa.String, nullable=False),
        sa.Column('customer_email', sa.String, nullable=True),
        sa.Column('payment_request', sa.JSON, nullable=False),
        sa.Column('gateway_response', sa.JSON, nullable=True),
        sa.Column('error_message', sa.String, nullable=True),
        sa.Column('error_code', sa.String, nullable=True),
        sa.Column('retry_count', sa.Integer, default=0, nullable=False),
        sa.Column('created_at', sa.DateTime, nullable=False),
        sa.Column('updated_at', sa.DateTime, nullable=True),
    )

def downgrade():
    op.drop_table('transactions')
