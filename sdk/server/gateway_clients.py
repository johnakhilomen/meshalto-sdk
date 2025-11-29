"""Gateway client implementations for different payment gateways.

IMPORTANT: This implementation uses mock responses for demonstration.
In production, replace with actual SDK integration:

Stripe: pip install stripe
    import stripe
    stripe.api_key = self.api_key
    charge = stripe.Charge.create(**payload)

PayPal: pip install paypalrestsdk
    import paypalrestsdk
    paypalrestsdk.configure(...)
    payment = paypalrestsdk.Payment.create(...)

Square: pip install squareup
    from square.client import Client
    client = Client(access_token=self.api_key)
    result = client.payments.create_payment(...)

These SDKs handle PCI compliance by working with payment tokens
generated on the client side, not raw card data.
"""

import os
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import httpx

from sdk.server.schemas.schemas import (
    PaymentGateway,
    PaymentStatus,
    GatewayNativeRequest,
    RecurringPaymentRequest
)
from sdk.server.schemas.exceptions import GatewayException

logger = logging.getLogger(__name__)


class BaseGatewayClient(ABC):
    """Base class for gateway clients."""
    
    def __init__(self, gateway: PaymentGateway, custom_api_key: Optional[str] = None):
        self.gateway = gateway
        self.base_url = self._get_base_url()
        self.api_key = custom_api_key or self._get_api_key()
    
    @abstractmethod
    def _get_base_url(self) -> str:
        """Get gateway base URL."""
        pass
    
    @abstractmethod
    def _get_api_key(self) -> str:
        """Get gateway API key from environment."""
        pass
    
    @abstractmethod
    async def process_payment(self, request: GatewayNativeRequest) -> Dict[str, Any]:
        """Process payment through gateway."""
        pass
    
    @abstractmethod
    def normalize_response(self, response: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize gateway response to standard format."""
        pass
    
    async def refund_payment(
        self,
        gateway_transaction_id: str,
        amount: Optional[Any] = None,
        reason: Optional[str] = None,
        idempotency_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Refund a payment (full or partial).
        
        Args:
            gateway_transaction_id: Gateway's transaction ID
            amount: Amount to refund (None for full refund)
            reason: Reason for refund
            idempotency_key: Idempotency key
            
        Returns:
            Refund response
        """
        raise NotImplementedError("Refund not implemented for this gateway")
    
    async def void_payment(self, gateway_transaction_id: str) -> Dict[str, Any]:
        """
        Void/cancel an authorized payment.
        
        Args:
            gateway_transaction_id: Gateway's transaction ID
            
        Returns:
            Void response
        """
        raise NotImplementedError("Void not implemented for this gateway")
    
    async def capture_payment(
        self,
        gateway_transaction_id: str,
        amount: Optional[Any] = None
    ) -> Dict[str, Any]:
        """
        Capture an authorized payment.
        
        Args:
            gateway_transaction_id: Gateway's transaction ID
            amount: Amount to capture (None for full amount)
            
        Returns:
            Capture response
        """
        raise NotImplementedError("Capture not implemented for this gateway")
    
    async def setup_recurring_payment(
        self,
        recurring_request: RecurringPaymentRequest
    ) -> Dict[str, Any]:
        """
        Set up recurring/subscription payments.
        
        Args:
            recurring_request: Recurring payment configuration
            
        Returns:
            Subscription response
        """
        raise NotImplementedError("Recurring payments not implemented for this gateway")
    
    async def verify_webhook(
        self,
        payload: dict,
        signature: Optional[str] = None
    ) -> bool:
        """
        Verify webhook signature.
        
        Args:
            payload: Webhook payload
            signature: Webhook signature
            
        Returns:
            True if valid
        """
        # Default implementation - override for production
        return True


class StripeClient(BaseGatewayClient):
    """Stripe payment gateway client."""
    
    def __init__(self, custom_api_key: Optional[str] = None):
        super().__init__(PaymentGateway.STRIPE, custom_api_key)
        # Initialize Stripe SDK
        try:
            import stripe
            stripe.api_key = self.api_key
            self.stripe = stripe
            self.use_real_api = True
            logger.info(f"Stripe SDK initialized with key: {self.api_key[:20]}...")
        except ImportError:
            logger.warning("Stripe SDK not installed. Using mock mode.")
            self.stripe = None
            self.use_real_api = False
    
    def _get_base_url(self) -> str:
        return os.getenv("STRIPE_API_URL", "https://api.stripe.com")
    
    def _get_api_key(self) -> str:
        return os.getenv("STRIPE_API_KEY", "sk_test_demo_key")
    
    async def process_payment(self, request: GatewayNativeRequest) -> Dict[str, Any]:
        """
        Process payment through Stripe using real SDK.
        Supports both legacy tokens (tok_*) and PaymentMethods (pm_*).
        """
        try:
            if self.use_real_api and self.stripe:
                # REAL STRIPE API CALL
                source_or_pm = request.payload.get('source', 'N/A')
                logger.info(f"Processing REAL Stripe payment with source/pm: {source_or_pm}")
                
                # Check if we have a PaymentMethod (pm_*) or legacy token (tok_*)
                if source_or_pm.startswith('pm_'):
                    # Use Payment Intents API for PaymentMethods
                    logger.info("Using Payment Intents API for PaymentMethod")
                    
                    payment_intent = self.stripe.PaymentIntent.create(
                        amount=request.payload['amount'],
                        currency=request.payload['currency'],
                        payment_method=source_or_pm,
                        confirm=True,  # Immediately confirm the payment
                        description=request.payload.get('description'),
                        metadata=request.payload.get('metadata', {}),
                        automatic_payment_methods={
                            'enabled': True,
                            'allow_redirects': 'never'
                        }
                    )
                    
                    # Convert PaymentIntent to charge-like response
                    response = {
                        'id': payment_intent.id,
                        'object': 'payment_intent',
                        'amount': payment_intent.amount,
                        'currency': payment_intent.currency,
                        'status': payment_intent.status,
                        'paid': payment_intent.status == 'succeeded',
                        'payment_method': payment_intent.payment_method,
                        'created': payment_intent.created
                    }
                    logger.info(f"Stripe PaymentIntent created successfully: {response.get('id')}")
                    return response
                    
                else:
                    # Use legacy Charges API for tokens
                    logger.info("Using Charges API for token")
                    
                    charge = self.stripe.Charge.create(
                        amount=request.payload['amount'],
                        currency=request.payload['currency'],
                        source=source_or_pm,
                        description=request.payload.get('description'),
                        metadata=request.payload.get('metadata', {}),
                        idempotency_key=request.payload.get('idempotency_key')
                    )
                    
                    # Convert Stripe object to dict
                    response = charge.to_dict() if hasattr(charge, 'to_dict') else dict(charge)
                    logger.info(f"Stripe charge created successfully: {response.get('id')}")
                    return response
                
            else:
                # MOCK MODE (fallback if SDK not available)
                logger.warning("Using MOCK mode for Stripe payment")
                logger.info(f"Processing Stripe payment with token: {request.payload.get('source', 'N/A')}")
                
                mock_response = {
                    "id": "ch_mock_stripe_12345",
                    "object": "charge",
                    "amount": request.payload.get("amount"),
                    "currency": request.payload.get("currency"),
                    "status": "succeeded",
                    "paid": True,
                    "source": {
                        "id": request.payload.get("source"),
                        "object": "card",
                        "last4": "4242"
                    },
                    "created": 1234567890
                }
                return mock_response
            
        except Exception as e:
            # Check if it's a Stripe error
            if self.use_real_api and self.stripe and hasattr(self.stripe, 'error'):
                if isinstance(e, self.stripe.error.StripeError):
                    logger.error(f"Stripe API error: {str(e)}")
                    raise GatewayException(
                        f"Stripe error: {str(e)}",
                        self.gateway.value,
                        original_error=e
                    )
            
            logger.error(f"Stripe payment failed: {str(e)}")
            raise GatewayException(
                f"Stripe payment failed: {str(e)}",
                self.gateway.value,
                original_error=e
            )
    
    def normalize_response(self, response: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize Stripe response."""
        status_mapping = {
            "succeeded": PaymentStatus.COMPLETED,
            "pending": PaymentStatus.PENDING,
            "failed": PaymentStatus.FAILED
        }
        
        status = status_mapping.get(
            response.get("status"),
            PaymentStatus.FAILED
        )
        
        return {
            "status": status,
            "gateway_transaction_id": response.get("id"),
            "raw_response": response
        }


class PayPalClient(BaseGatewayClient):
    """PayPal payment gateway client."""
    
    def __init__(self, custom_api_key: Optional[str] = None):
        super().__init__(PaymentGateway.PAYPAL, custom_api_key)
    
    def _get_base_url(self) -> str:
        return os.getenv("PAYPAL_API_URL", "https://api-m.paypal.com")
    
    def _get_api_key(self) -> str:
        return os.getenv("PAYPAL_CLIENT_ID", "demo_client_id")
    
    def _get_client_secret(self) -> str:
        return os.getenv("PAYPAL_CLIENT_SECRET", "demo_client_secret")
    
    async def process_payment(self, request: GatewayNativeRequest) -> Dict[str, Any]:
        """
        Process payment through PayPal.
        
        PRODUCTION NOTE: Replace with actual PayPal SDK:
        
        import paypalrestsdk
        paypalrestsdk.configure({
            "mode": "live",  # or "sandbox"
            "client_id": self.api_key,
            "client_secret": self._get_client_secret()
        })
        
        payment = paypalrestsdk.Payment({
            "intent": request.payload['intent'],
            "payer": request.payload.get('payer'),
            "transactions": request.payload['purchase_units']
        })
        
        if payment.create():
            return payment.to_dict()
        else:
            raise GatewayException(payment.error, self.gateway.value)
        """
        try:
            # DEMO: Mock response (replace with actual SDK call)
            logger.info(f"Processing PayPal payment with token: {request.payload.get('payment_source', {}).get('token', {}).get('id', 'N/A')}")
            
            # Mock successful response
            mock_response = {
                "id": "PAYID-MOCK-12345",
                "status": "COMPLETED",
                "purchase_units": [
                    {
                        "payments": {
                            "captures": [
                                {
                                    "id": "CAP-MOCK-67890",
                                    "status": "COMPLETED",
                                    "amount": request.payload.get("purchase_units", [{}])[0].get("amount")
                                }
                            ]
                        }
                    }
                ],
                "create_time": "2024-01-01T12:00:00Z"
            }
            
            return mock_response
            
        except Exception as e:
            raise GatewayException(
                f"PayPal payment failed: {str(e)}",
                self.gateway.value,
                original_error=e
            )
    
    def normalize_response(self, response: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize PayPal response."""
        status_mapping = {
            "COMPLETED": PaymentStatus.COMPLETED,
            "PENDING": PaymentStatus.PENDING,
            "FAILED": PaymentStatus.FAILED
        }
        
        status = status_mapping.get(
            response.get("status"),
            PaymentStatus.FAILED
        )
        
        return {
            "status": status,
            "gateway_transaction_id": response.get("id"),
            "raw_response": response
        }


class SquareClient(BaseGatewayClient):
    """Square payment gateway client."""
    
    def __init__(self, custom_api_key: Optional[str] = None):
        super().__init__(PaymentGateway.SQUARE, custom_api_key)
        # Initialize Square SDK
        try:
            from square.client import Client
            
            environment = os.getenv("SQUARE_ENVIRONMENT", "sandbox")
            self.location_id = os.getenv("SQUARE_LOCATION_ID")
            
            self.client = Client(
                access_token=self.api_key,
                environment=environment
            )
            self.use_real_api = True
            logger.info(f"Square SDK initialized with environment: {environment}")
            logger.info(f"Location ID: {self.location_id}")
        except ImportError:
            logger.warning("Square SDK not installed. Using mock mode.")
            self.client = None
            self.use_real_api = False
            self.location_id = None
    
    def _get_base_url(self) -> str:
        return os.getenv("SQUARE_API_URL", "https://connect.squareup.com")
    
    def _get_api_key(self) -> str:
        return os.getenv("SQUARE_ACCESS_TOKEN", "demo_access_token")
    
    async def process_payment(self, request: GatewayNativeRequest) -> Dict[str, Any]:
        """Process payment through Square using real SDK."""
        try:
            if self.use_real_api and self.client:
                # REAL SQUARE API CALL
                logger.info(f"Processing REAL Square payment with source_id: {request.payload.get('source_id', 'N/A')}")
                
                # Prepare payment body
                body = {
                    "source_id": request.payload['source_id'],
                    "amount_money": request.payload['amount_money'],
                    "idempotency_key": request.payload['idempotency_key']
                }
                
                # Add location_id if available
                if self.location_id:
                    body['location_id'] = self.location_id
                
                # Add optional fields
                optional_fields = [
                    'customer_id', 'reference_id', 'note', 'billing_address',
                    'shipping_address', 'verification_token', 'tip_money',
                    'app_fee_money', 'autocomplete', 'statement_description_identifier'
                ]
                
                for field in optional_fields:
                    if field in request.payload:
                        body[field] = request.payload[field]
                
                # Create payment using Square SDK
                result = self.client.payments.create_payment(body=body)
                
                if result.is_success():
                    logger.info(f"Square payment created successfully: {result.body.get('payment', {}).get('id')}")
                    return result.body
                elif result.is_error():
                    error_msg = result.errors[0] if result.errors else "Unknown error"
                    logger.error(f"Square API error: {error_msg}")
                    raise GatewayException(
                        f"Square error: {error_msg}",
                        self.gateway.value
                    )
            
            # FALLBACK: Mock mode
            logger.info(f"Processing MOCK Square payment with source_id: {request.payload.get('source_id', 'N/A')}")
            
            # Extract card brand from token (for demo purposes)
            source_id = request.payload.get('source_id', '')
            card_brand = 'VISA'
            if 'mastercard' in source_id.lower():
                card_brand = 'MASTERCARD'
            elif 'amex' in source_id.lower():
                card_brand = 'AMERICAN_EXPRESS'
            elif 'discover' in source_id.lower():
                card_brand = 'DISCOVER'
            
            # Determine status based on autocomplete
            autocomplete = request.payload.get('autocomplete', True)
            payment_status = "COMPLETED" if autocomplete else "APPROVED"
            
            # Mock successful response
            import datetime
            mock_response = {
                "payment": {
                    "id": "PAYMENT-MOCK-12345",
                    "status": payment_status,
                    "source_type": "CARD",
                    "card_details": {
                        "status": "CAPTURED",
                        "card": {
                            "card_brand": card_brand,
                            "last_4": "4242",
                            "exp_month": 12,
                            "exp_year": 2025,
                            "fingerprint": "sq-1-mock-fingerprint",
                            "card_type": "CREDIT",
                            "prepaid_type": "NOT_PREPAID",
                            "bin": "424242"
                        },
                        "entry_method": "KEYED",
                        "cvv_status": "CVV_ACCEPTED",
                        "avs_status": "AVS_ACCEPTED",
                        "statement_description": request.payload.get('statement_description_identifier', 'PAYMENT')
                    },
                    "amount_money": request.payload.get("amount_money"),
                    "total_money": request.payload.get("amount_money"),
                    "approved_money": request.payload.get("amount_money"),
                    "receipt_number": "MOCK-RECEIPT-123",
                    "receipt_url": "https://squareup.com/receipt/mock",
                    "created_at": datetime.datetime.utcnow().isoformat() + "Z",
                    "updated_at": datetime.datetime.utcnow().isoformat() + "Z",
                    "location_id": self.location_id or "MOCK-LOCATION-123"
                }
            }
            
            # Add optional fields if present
            if request.payload.get('customer_id'):
                mock_response['payment']['customer_id'] = request.payload['customer_id']
            
            if request.payload.get('reference_id'):
                mock_response['payment']['reference_id'] = request.payload['reference_id']
            
            if request.payload.get('note'):
                mock_response['payment']['note'] = request.payload['note']
            
            if request.payload.get('tip_money'):
                mock_response['payment']['tip_money'] = request.payload['tip_money']
            
            if request.payload.get('app_fee_money'):
                mock_response['payment']['app_fee_money'] = request.payload['app_fee_money']
            
            return mock_response
            
        except GatewayException:
            raise
        except Exception as e:
            logger.error(f"Square payment error: {str(e)}")
            raise GatewayException(
                f"Square payment failed: {str(e)}",
                self.gateway.value,
                original_error=e
            )
    
    def normalize_response(self, response: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize Square response with detailed card information."""
        payment = response.get("payment", {})
        
        status_mapping = {
            "COMPLETED": PaymentStatus.COMPLETED,
            "APPROVED": PaymentStatus.AUTHORIZED,  # Authorized but not captured
            "PENDING": PaymentStatus.PENDING,
            "FAILED": PaymentStatus.FAILED,
            "CANCELED": PaymentStatus.CANCELLED,
            "CANCELLED": PaymentStatus.CANCELLED
        }
        
        status = status_mapping.get(
            payment.get("status"),
            PaymentStatus.FAILED
        )
        
        normalized = {
            "status": status,
            "gateway_transaction_id": payment.get("id"),
            "raw_response": response
        }
        
        # Add card details if available
        card_details = payment.get("card_details", {})
        if card_details:
            card = card_details.get("card", {})
            normalized["card_info"] = {
                "brand": card.get("card_brand"),
                "last_4": card.get("last_4"),
                "card_type": card.get("card_type"),
                "exp_month": card.get("exp_month"),
                "exp_year": card.get("exp_year"),
                "entry_method": card_details.get("entry_method"),
                "cvv_status": card_details.get("cvv_status"),
                "avs_status": card_details.get("avs_status")
            }
            
            # Add receipt information
            if payment.get("receipt_number"):
                normalized["receipt_number"] = payment["receipt_number"]
            if payment.get("receipt_url"):
                normalized["receipt_url"] = payment["receipt_url"]
        
        # Add reference_id if present
        if payment.get("reference_id"):
            normalized["reference_id"] = payment["reference_id"]
        
        return normalized
    
    async def refund_payment(
        self,
        gateway_transaction_id: str,
        amount: Optional[Any] = None,
        reason: Optional[str] = None,
        idempotency_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Refund a Square payment.
        
        PRODUCTION NOTE: Replace with actual Square SDK:
        
        from square.client import Client
        client = Client(access_token=self.api_key, environment='production')
        
        result = client.refunds.refund_payment(
            body={
                "idempotency_key": idempotency_key or str(uuid.uuid4()),
                "amount_money": {
                    "amount": int(amount * 100),  # Convert to cents
                    "currency": "USD"
                },
                "payment_id": gateway_transaction_id,
                "reason": reason
            }
        )
        
        if result.is_success():
            return result.body
        else:
            raise GatewayException(result.errors, self.gateway.value)
        """
        import datetime
        import uuid
        
        logger.info(f"Processing Square refund for payment: {gateway_transaction_id}")
        
        # Mock successful refund response
        mock_response = {
            "refund": {
                "id": f"REFUND-MOCK-{uuid.uuid4().hex[:8]}",
                "status": "COMPLETED",
                "amount_money": {
                    "amount": int(amount * 100) if amount else None,
                    "currency": "USD"
                },
                "payment_id": gateway_transaction_id,
                "created_at": datetime.datetime.utcnow().isoformat() + "Z",
                "updated_at": datetime.datetime.utcnow().isoformat() + "Z",
                "reason": reason or "Customer requested refund"
            }
        }
        
        return {"refund_id": mock_response["refund"]["id"], "status": "completed"}
    
    async def void_payment(self, gateway_transaction_id: str) -> Dict[str, Any]:
        """
        Void a Square payment authorization.
        
        PRODUCTION NOTE: Replace with actual Square SDK:
        
        from square.client import Client
        client = Client(access_token=self.api_key, environment='production')
        
        result = client.payments.cancel_payment(payment_id=gateway_transaction_id)
        
        if result.is_success():
            return result.body
        else:
            raise GatewayException(result.errors, self.gateway.value)
        """
        import datetime
        
        logger.info(f"Voiding Square payment: {gateway_transaction_id}")
        
        # Mock successful void response
        mock_response = {
            "payment": {
                "id": gateway_transaction_id,
                "status": "CANCELED",
                "updated_at": datetime.datetime.utcnow().isoformat() + "Z"
            }
        }
        
        return {"status": "cancelled"}
    
    async def capture_payment(
        self,
        gateway_transaction_id: str,
        amount: Optional[Any] = None
    ) -> Dict[str, Any]:
        """
        Capture a Square payment authorization.
        
        PRODUCTION NOTE: Replace with actual Square SDK:
        
        from square.client import Client
        client = Client(access_token=self.api_key, environment='production')
        
        result = client.payments.complete_payment(payment_id=gateway_transaction_id)
        
        if result.is_success():
            return result.body
        else:
            raise GatewayException(result.errors, self.gateway.value)
        """
        import datetime
        
        logger.info(f"Capturing Square payment: {gateway_transaction_id}")
        
        # Mock successful capture response
        mock_response = {
            "payment": {
                "id": gateway_transaction_id,
                "status": "COMPLETED",
                "updated_at": datetime.datetime.utcnow().isoformat() + "Z",
                "amount_money": {
                    "amount": int(amount * 100) if amount else None,
                    "currency": "USD"
                }
            }
        }
        
        return {"capture_id": gateway_transaction_id, "status": "completed"}
    
    async def setup_recurring_payment(
        self,
        recurring_request: RecurringPaymentRequest
    ) -> Dict[str, Any]:
        """
        Set up Square recurring payment (subscription).
        
        PRODUCTION NOTE: Replace with actual Square SDK:
        
        from square.client import Client
        client = Client(access_token=self.api_key, environment='production')
        
        # First, create a subscription plan
        plan_result = client.catalog.upsert_catalog_object(
            body={
                "idempotency_key": str(uuid.uuid4()),
                "object": {
                    "type": "SUBSCRIPTION_PLAN",
                    "subscription_plan_data": {
                        "name": recurring_request.subscription_name,
                        "phases": [{
                            "cadence": recurring_request.schedule.frequency.upper(),
                            "recurring_price_money": {
                                "amount": int(recurring_request.payment_request.amount * 100),
                                "currency": recurring_request.payment_request.currency.value
                            }
                        }]
                    }
                }
            }
        )
        
        # Then, create the subscription
        result = client.subscriptions.create_subscription(
            body={
                "location_id": "LOCATION_ID",
                "customer_id": recurring_request.payment_request.customer.id,
                "plan_id": plan_result.body["catalog_object"]["id"],
                "start_date": recurring_request.schedule.start_date.isoformat()
            }
        )
        
        if result.is_success():
            return result.body
        else:
            raise GatewayException(result.errors, self.gateway.value)
        """
        import datetime
        import uuid
        
        logger.info(f"Setting up Square recurring payment: {recurring_request.subscription_name}")
        
        # Mock successful subscription response
        mock_response = {
            "subscription": {
                "id": f"SUBSCRIPTION-MOCK-{uuid.uuid4().hex[:8]}",
                "status": "ACTIVE",
                "customer_id": recurring_request.payment_request.customer.id,
                "plan_variation_id": f"PLAN-MOCK-{uuid.uuid4().hex[:8]}",
                "start_date": recurring_request.schedule.start_date.isoformat()[:10],
                "charged_through_date": recurring_request.schedule.start_date.isoformat()[:10],
                "created_at": datetime.datetime.utcnow().isoformat() + "Z"
            }
        }
        
        return {"status": "active", "subscription_id": mock_response["subscription"]["id"]}
    
    async def verify_webhook(
        self,
        payload: dict,
        signature: Optional[str] = None
    ) -> bool:
        """
        Verify Square webhook signature.
        
        PRODUCTION NOTE: Replace with actual verification:
        
        import hmac
        import hashlib
        
        webhook_signature_key = os.getenv("SQUARE_WEBHOOK_SIGNATURE_KEY")
        
        # Compute HMAC-SHA256 signature
        computed_signature = hmac.new(
            webhook_signature_key.encode('utf-8'),
            payload.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(computed_signature, signature)
        """
        logger.info("Verifying Square webhook signature (DEMO MODE)")
        # In demo mode, accept all webhooks
        return True



def get_gateway_client(gateway: PaymentGateway, custom_api_key: Optional[str] = None) -> BaseGatewayClient:
    """Factory function to get appropriate gateway client."""
    clients = {
        PaymentGateway.STRIPE: StripeClient,
        PaymentGateway.PAYPAL: PayPalClient,
        PaymentGateway.SQUARE: SquareClient
    }
    
    client_class = clients.get(gateway)
    if not client_class:
        raise GatewayException(
            f"Unsupported gateway: {gateway.value}",
            gateway.value
        )
    
    return client_class(custom_api_key=custom_api_key)
