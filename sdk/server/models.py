"""Database models for Payment Processing API."""

from sqlalchemy import Column, Integer, String, DateTime, Numeric, JSON
from datetime import datetime
from sdk.server.schemas.database import Base


class Transaction(Base):
    """Model for storing payment transactions."""
    
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String, unique=True, nullable=False, index=True)
    gateway = Column(String, nullable=False, index=True)
    gateway_transaction_id = Column(String, nullable=True)
    status = Column(String, nullable=False, index=True)
    amount = Column(Numeric(precision=10, scale=2), nullable=False)
    currency = Column(String, nullable=False)
    customer_email = Column(String, nullable=True)
    payment_request = Column(JSON, nullable=False)
    gateway_response = Column(JSON, nullable=True)
    error_message = Column(String, nullable=True)
    error_code = Column(String, nullable=True)
    retry_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<Transaction(id={self.transaction_id}, gateway={self.gateway}, status={self.status})>"
