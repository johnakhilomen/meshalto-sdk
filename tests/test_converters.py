"""Tests for payment gateway converters."""

import pytest
from decimal import Decimal

from sdk.server.schemas.schemas import (
    UniversalPaymentRequest,
    PaymentMethod,
    Currency,
    Customer,
    PaymentToken,
    Address,
    PaymentGateway
)
from sdk.server.schemas.exceptions import ValidationException, ConversionException
from sdk.server.converters.base import (
    StripeConverter,
    PayPalConverter,
    SquareConverter,
    get_converter
)


@pytest.fixture
def sample_payment_request():
    """Sample payment request for testing with payment token."""
    return UniversalPaymentRequest(
        amount=Decimal("100.50"),
        currency=Currency.USD,
        payment_method=PaymentMethod.CARD,
        customer=Customer(
            email="test@example.com",
            name="John Doe",
            phone="+1234567890",
            address=Address(
                line1="123 Main St",
                line2="Apt 4",
                city="New York",
                state="NY",
                postal_code="10001",
                country="US"
            )
        ),
        payment_token=PaymentToken(
            token="tok_visa_4242",
            token_type="card",
            last4="4242",
            brand="visa",
            exp_month=12,
            exp_year=2025
        ),
        description="Test payment",
        metadata={"order_id": "12345"}
    )


class TestStripeConverter:
    """Tests for Stripe converter."""
    
    def test_convert_card_payment(self, sample_payment_request):
        """Test converting card payment to Stripe format with token."""
        converter = StripeConverter()
        result = converter.convert(sample_payment_request)
        
        assert result.gateway == PaymentGateway.STRIPE
        assert result.endpoint == "/v1/charges"
        assert result.payload["amount"] == 10050  # Amount in cents
        assert result.payload["currency"] == "usd"
        assert result.payload["receipt_email"] == "test@example.com"
        assert result.payload["source"] == "tok_visa_4242"  # Token, not card details
    
    def test_convert_with_idempotency_key(self, sample_payment_request):
        """Test conversion with idempotency key."""
        sample_payment_request.idempotency_key = "test-key-123"
        converter = StripeConverter()
        result = converter.convert(sample_payment_request)
        
        assert result.headers is not None
        assert result.headers["Idempotency-Key"] == "test-key-123"
    
    def test_validation_error_no_payment_token(self):
        """Test validation error when payment token is missing."""
        # Pydantic will raise ValidationError before we even create the object
        from pydantic import ValidationError as PydanticValidationError
        
        with pytest.raises(PydanticValidationError):
            request = UniversalPaymentRequest(
                amount=Decimal("100.00"),
                currency=Currency.USD,
                payment_method=PaymentMethod.CARD,
                customer=Customer(email="test@example.com", name="Test User"),
                payment_token=None
            )


class TestPayPalConverter:
    """Tests for PayPal converter."""
    
    def test_convert_card_payment(self, sample_payment_request):
        """Test converting card payment to PayPal format."""
        converter = PayPalConverter()
        result = converter.convert(sample_payment_request)
        
        assert result.gateway == PaymentGateway.PAYPAL
        assert result.endpoint == "/v2/checkout/orders"
        assert result.payload["intent"] == "CAPTURE"
        assert len(result.payload["purchase_units"]) == 1
        assert result.payload["purchase_units"][0]["amount"]["value"] == "100.50"
        assert result.payload["purchase_units"][0]["amount"]["currency_code"] == "USD"
    
    def test_payer_information(self, sample_payment_request):
        """Test payer information in PayPal format."""
        converter = PayPalConverter()
        result = converter.convert(sample_payment_request)
        
        assert "payer" in result.payload
        assert result.payload["payer"]["email_address"] == "test@example.com"
        assert result.payload["payer"]["name"]["given_name"] == "John"
        assert result.payload["payer"]["name"]["surname"] == "Doe"
        # Check for payment token in payment_source
        assert "payment_source" in result.payload
        assert result.payload["payment_source"]["token"]["id"] == "tok_visa_4242"


class TestSquareConverter:
    """Tests for Square converter."""
    
    def test_convert_card_payment(self, sample_payment_request):
        """Test converting card payment to Square format with token."""
        converter = SquareConverter()
        result = converter.convert(sample_payment_request)
        
        assert result.gateway == PaymentGateway.SQUARE
        assert result.endpoint == "/v2/payments"
        assert result.payload["amount_money"]["amount"] == 10050  # Amount in cents
        assert result.payload["amount_money"]["currency"] == "USD"
        assert result.payload["source_id"] == "tok_visa_4242"  # Token from payment_token
        assert "idempotency_key" in result.payload
    
    def test_auto_generate_idempotency_key(self, sample_payment_request):
        """Test automatic idempotency key generation."""
        converter = SquareConverter()
        result = converter.convert(sample_payment_request)
        
        assert "idempotency_key" in result.payload
        assert len(result.payload["idempotency_key"]) > 0


class TestConverterFactory:
    """Tests for converter factory function."""
    
    def test_get_stripe_converter(self):
        """Test getting Stripe converter."""
        converter = get_converter(PaymentGateway.STRIPE)
        assert isinstance(converter, StripeConverter)
    
    def test_get_paypal_converter(self):
        """Test getting PayPal converter."""
        converter = get_converter(PaymentGateway.PAYPAL)
        assert isinstance(converter, PayPalConverter)
    
    def test_get_square_converter(self):
        """Test getting Square converter."""
        converter = get_converter(PaymentGateway.SQUARE)
        assert isinstance(converter, SquareConverter)
