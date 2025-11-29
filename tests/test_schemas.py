"""Tests for shared schemas."""

import pytest
from decimal import Decimal

from sdk.server.schemas.schemas import (
    UniversalPaymentRequest,
    PaymentMethod,
    Currency,
    Customer,
    PaymentToken,
    BankAccountDetails,
    Address
)
from pydantic import ValidationError


class TestUniversalPaymentRequest:
    """Tests for UniversalPaymentRequest schema."""
    
    def test_valid_card_payment(self):
        """Test valid card payment request with payment token."""
        request = UniversalPaymentRequest(
            amount=Decimal("100.00"),
            currency=Currency.USD,
            payment_method=PaymentMethod.CARD,
            customer=Customer(email="test@example.com", name="Test User"),
            payment_token=PaymentToken(
                token="tok_visa_4242",
                token_type="card",
                last4="4242",
                brand="visa",
                exp_month=12,
                exp_year=2025
            )
        )
        
        assert request.amount == Decimal("100.00")
        assert request.currency == Currency.USD
        assert request.payment_method == PaymentMethod.CARD
        assert request.payment_token.token == "tok_visa_4242"
    
    def test_card_payment_without_payment_token(self):
        """Test that card payment requires payment token."""
        with pytest.raises(ValidationError):
            UniversalPaymentRequest(
                amount=Decimal("100.00"),
                currency=Currency.USD,
                payment_method=PaymentMethod.CARD,
                customer=Customer(email="test@example.com", name="Test User"),
                payment_token=None
            )
    
    def test_bank_account_payment(self):
        """Test valid bank account payment request."""
        request = UniversalPaymentRequest(
            amount=Decimal("100.00"),
            currency=Currency.USD,
            payment_method=PaymentMethod.BANK_ACCOUNT,
            customer=Customer(email="test@example.com", name="Test User"),
            bank_account_details=BankAccountDetails(
                account_number="123456789",
                routing_number="987654321",
                account_holder_name="Test User"
            )
        )
        
        assert request.payment_method == PaymentMethod.BANK_ACCOUNT
        assert request.bank_account_details is not None
    
    def test_invalid_amount(self):
        """Test that amount must be positive."""
        with pytest.raises(ValidationError):
            UniversalPaymentRequest(
                amount=Decimal("-10.00"),
                currency=Currency.USD,
                payment_method=PaymentMethod.CARD,
                customer=Customer(email="test@example.com", name="Test User"),
                payment_token=PaymentToken(
                    token="tok_visa_4242",
                    token_type="card"
                )
            )


class TestPaymentToken:
    """Tests for PaymentToken schema."""
    
    def test_valid_payment_token(self):
        """Test valid payment token."""
        token = PaymentToken(
            token="tok_visa_4242",
            token_type="card",
            last4="4242",
            brand="visa",
            exp_month=12,
            exp_year=2025
        )
        
        assert token.token == "tok_visa_4242"
        assert token.last4 == "4242"
        assert token.brand == "visa"
    
    def test_minimal_payment_token(self):
        """Test payment token with minimal required fields."""
        token = PaymentToken(
            token="tok_test_12345"
        )
        
        assert token.token == "tok_test_12345"
        assert token.token_type == "card"  # Default value


class TestCardDetails:
    """Tests for backward compatibility - CardDetails removed."""
    
    def test_card_details_not_available(self):
        """Test that CardDetails is no longer available."""
        with pytest.raises(ImportError):
            from sdk.server.schemas.schemas import CardDetails


class TestAddress:
    """Tests for Address schema."""
    
    def test_valid_address(self):
        """Test valid address."""
        address = Address(
            line1="123 Main St",
            city="New York",
            postal_code="10001",
            country="US"
        )
        
        assert address.line1 == "123 Main St"
        assert address.city == "New York"
    
    def test_address_with_optional_fields(self):
        """Test address with optional fields."""
        address = Address(
            line1="123 Main St",
            line2="Apt 4",
            city="New York",
            state="NY",
            postal_code="10001",
            country="US"
        )
        
        assert address.line2 == "Apt 4"
        assert address.state == "NY"
