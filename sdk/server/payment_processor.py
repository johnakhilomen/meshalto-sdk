"""Payment processor with retry logic and error handling."""

import logging
import uuid
from datetime import datetime
from decimal import Decimal
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type
)

from sdk.server.schemas.schemas import (
    UniversalPaymentRequest,
    UniversalPaymentResponse,
    PaymentGateway,
    PaymentStatus,
    GatewayNativeRequest,
    RefundRequest,
    RefundResponse,
    CaptureRequest,
    CaptureResponse,
    RecurringPaymentRequest,
    RecurringPaymentResponse,
    WebhookEvent
)
from sdk.server.schemas.exceptions import (
    RetryableException,
    GatewayException,
    ValidationException
)
from sdk.server.models import Transaction
from sdk.server.gateway_clients import get_gateway_client
from sdk.server.converters.base import get_converter

logger = logging.getLogger(__name__)


class PaymentProcessor:
    """Payment processor with retry logic and response normalization."""
    
    def __init__(self, gateway: PaymentGateway, db: Session):
        self.gateway = gateway
        self.db = db
        self.gateway_client = get_gateway_client(gateway)
        self.converter = get_converter(gateway)
    
    async def process_payment(
        self,
        payment_request: UniversalPaymentRequest
    ) -> UniversalPaymentResponse:
        """
        Process payment with retry logic.
        
        Args:
            payment_request: Universal payment request
            
        Returns:
            Normalized payment response
        """
        # Generate transaction ID
        transaction_id = str(uuid.uuid4())
        
        # Get custom API key for this gateway if provided
        custom_api_key = None
        if payment_request.gateway_keys:
            gateway_name = self.gateway.value.lower()
            custom_api_key = payment_request.gateway_keys.get(gateway_name)
            
            # For PayPal, extract the client_id if it's a dict
            if gateway_name == 'paypal' and isinstance(custom_api_key, dict):
                custom_api_key = custom_api_key.get('clientId')
        
        # Create gateway client with custom key if provided
        gateway_client = get_gateway_client(self.gateway, custom_api_key) if custom_api_key else self.gateway_client
        
        # Create transaction record
        transaction = Transaction(
            transaction_id=transaction_id,
            gateway=self.gateway.value,
            status=PaymentStatus.PENDING.value,
            amount=payment_request.amount,
            currency=payment_request.currency.value,
            customer_email=payment_request.customer.email if payment_request.customer else None,
            payment_request=payment_request.model_dump(mode='json')
        )
        self.db.add(transaction)
        self.db.commit()
        
        try:
            # Step 1: Convert to gateway-native format using Universal Schema API
            logger.info(f"Converting payment request to {self.gateway.value} format")
            gateway_request = await self._convert_to_gateway_format(payment_request)
            
            # Step 2: Process payment with retry logic
            logger.info(f"Processing payment through {self.gateway.value}")
            gateway_response = await self._process_with_retry(
                gateway_request,
                transaction,
                gateway_client
            )
            
            # Step 3: Normalize response
            logger.info("Normalizing gateway response")
            normalized_response = self._normalize_response(
                gateway_response,
                transaction_id,
                payment_request
            )
            
            # Step 4: Update transaction
            transaction.status = normalized_response.status.value
            transaction.gateway_transaction_id = normalized_response.gateway_transaction_id
            transaction.gateway_response = gateway_response
            transaction.updated_at = datetime.utcnow()
            self.db.commit()
            
            return normalized_response
            
        except Exception as e:
            # Update transaction with error
            transaction.status = PaymentStatus.FAILED.value
            transaction.error_message = str(e)
            transaction.updated_at = datetime.utcnow()
            self.db.commit()
            
            logger.error(f"Payment processing failed: {str(e)}")
            raise
    
    async def _convert_to_gateway_format(
        self,
        payment_request: UniversalPaymentRequest
    ) -> GatewayNativeRequest:
        """
        Convert payment request to gateway-native format.
        
        Args:
            payment_request: Universal payment request
            
        Returns:
            Gateway-native request
        """
        try:
            # Use local converter instead of external API call
            return self.converter.convert(payment_request)
                
        except Exception as e:
            raise ValidationException(
                f"Failed to convert to gateway format: {str(e)}"
            )
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type(RetryableException),
        reraise=True
    )
    async def _process_with_retry(
        self,
        gateway_request: GatewayNativeRequest,
        transaction: Transaction,
        gateway_client: Any
    ):
        """
        Process payment with automatic retry logic.
        
        Args:
            gateway_request: Gateway-native request
            transaction: Transaction record
            gateway_client: Gateway client to use
            
        Returns:
            Gateway response
        """
        try:
            # Increment retry count
            transaction.retry_count += 1
            self.db.commit()
            
            logger.info(f"Payment attempt {transaction.retry_count}")
            
            # Process payment through gateway client
            response = await gateway_client.process_payment(gateway_request)
            
            return response
            
        except Exception as e:
            logger.warning(f"Payment attempt {transaction.retry_count} failed: {str(e)}")
            
            # Determine if error is retryable
            if self._is_retryable_error(e):
                raise RetryableException(str(e))
            else:
                raise GatewayException(
                    str(e),
                    self.gateway.value,
                    original_error=e
                )
    
    def _is_retryable_error(self, error: Exception) -> bool:
        """
        Determine if an error is retryable.
        
        Args:
            error: Exception that occurred
            
        Returns:
            True if error is retryable
        """
        error_message = str(error).lower()
        
        # Network errors are retryable
        retryable_keywords = [
            "timeout",
            "connection",
            "network",
            "temporary",
            "rate limit",
            "503",
            "502",
            "504"
        ]
        
        return any(keyword in error_message for keyword in retryable_keywords)
    
    def _normalize_response(
        self,
        gateway_response: dict,
        transaction_id: str,
        payment_request: UniversalPaymentRequest
    ) -> UniversalPaymentResponse:
        """
        Normalize gateway response to universal format.
        
        Args:
            gateway_response: Raw gateway response
            transaction_id: Transaction ID
            payment_request: Original payment request
            
        Returns:
            Normalized payment response
        """
        # Use gateway client to normalize response
        normalized = self.gateway_client.normalize_response(gateway_response)
        
        # Calculate fee (typically 2.9% + $0.30 for Stripe)
        fee = None
        if self.gateway == PaymentGateway.STRIPE:
            fee = (payment_request.amount * Decimal('0.029')) + Decimal('0.30')
        elif self.gateway == PaymentGateway.SQUARE:
            fee = (payment_request.amount * Decimal('0.026')) + Decimal('0.10')
        elif self.gateway == PaymentGateway.PAYPAL:
            fee = (payment_request.amount * Decimal('0.0349')) + Decimal('0.49')
        
        # Add transaction ID and other metadata
        return UniversalPaymentResponse(
            transaction_id=transaction_id,
            gateway=self.gateway,
            status=normalized.get("status", PaymentStatus.COMPLETED),
            amount=payment_request.amount,
            currency=payment_request.currency,
            gateway_transaction_id=normalized.get("gateway_transaction_id"),
            fee=fee,
            savings=None,  # Can be calculated if comparing gateway fees
            created_at=datetime.utcnow(),
            metadata=payment_request.metadata
        )
    
    async def refund_payment(
        self,
        refund_request: RefundRequest
    ) -> RefundResponse:
        """
        Refund a completed payment (full or partial).
        
        Args:
            refund_request: Refund request details
            
        Returns:
            Refund response
        """
        # Get original transaction
        transaction = self.db.query(Transaction).filter(
            Transaction.transaction_id == refund_request.transaction_id
        ).first()
        
        if not transaction:
            raise ValidationException(f"Transaction not found: {refund_request.transaction_id}")
        
        if transaction.status not in [PaymentStatus.COMPLETED.value, PaymentStatus.PARTIALLY_REFUNDED.value]:
            raise ValidationException(f"Transaction cannot be refunded. Status: {transaction.status}")
        
        # Generate refund ID
        refund_id = str(uuid.uuid4())
        
        try:
            # Call gateway client to process refund
            gateway_response = await self.gateway_client.refund_payment(
                transaction.gateway_transaction_id,
                refund_request.amount,
                refund_request.reason,
                refund_request.idempotency_key
            )
            
            # Determine if full or partial refund
            original_amount = transaction.amount
            refund_amount = refund_request.amount or original_amount
            
            if refund_amount >= original_amount:
                new_status = PaymentStatus.REFUNDED.value
            else:
                new_status = PaymentStatus.PARTIALLY_REFUNDED.value
            
            # Update transaction status
            transaction.status = new_status
            transaction.updated_at = datetime.utcnow()
            self.db.commit()
            
            # Create refund response
            return RefundResponse(
                refund_id=refund_id,
                transaction_id=refund_request.transaction_id,
                gateway=self.gateway,
                status=PaymentStatus[new_status.upper()],
                amount=refund_amount,
                currency=transaction.currency,
                gateway_refund_id=gateway_response.get("refund_id"),
                created_at=datetime.utcnow(),
                reason=refund_request.reason
            )
            
        except Exception as e:
            logger.error(f"Refund failed: {str(e)}")
            raise GatewayException(
                f"Refund failed: {str(e)}",
                self.gateway.value,
                original_error=e
            )
    
    async def void_payment(
        self,
        transaction_id: str
    ) -> dict:
        """
        Void/cancel an authorized payment (before capture).
        
        Args:
            transaction_id: Transaction ID to void
            
        Returns:
            Void confirmation
        """
        # Get transaction
        transaction = self.db.query(Transaction).filter(
            Transaction.transaction_id == transaction_id
        ).first()
        
        if not transaction:
            raise ValidationException(f"Transaction not found: {transaction_id}")
        
        if transaction.status != PaymentStatus.AUTHORIZED.value:
            raise ValidationException(f"Only authorized payments can be voided. Status: {transaction.status}")
        
        try:
            # Call gateway client to void payment
            gateway_response = await self.gateway_client.void_payment(
                transaction.gateway_transaction_id
            )
            
            # Update transaction status
            transaction.status = PaymentStatus.CANCELLED.value
            transaction.updated_at = datetime.utcnow()
            self.db.commit()
            
            return {
                "transaction_id": transaction_id,
                "status": "cancelled",
                "gateway_response": gateway_response
            }
            
        except Exception as e:
            logger.error(f"Void failed: {str(e)}")
            raise GatewayException(
                f"Void failed: {str(e)}",
                self.gateway.value,
                original_error=e
            )
    
    async def capture_payment(
        self,
        capture_request: CaptureRequest
    ) -> CaptureResponse:
        """
        Capture an authorized payment (delayed capture).
        
        Args:
            capture_request: Capture request details
            
        Returns:
            Capture response
        """
        # Get original transaction
        transaction = self.db.query(Transaction).filter(
            Transaction.transaction_id == capture_request.transaction_id
        ).first()
        
        if not transaction:
            raise ValidationException(f"Transaction not found: {capture_request.transaction_id}")
        
        if transaction.status != PaymentStatus.AUTHORIZED.value:
            raise ValidationException(f"Only authorized payments can be captured. Status: {transaction.status}")
        
        # Generate capture ID
        capture_id = str(uuid.uuid4())
        
        try:
            # Call gateway client to capture payment
            gateway_response = await self.gateway_client.capture_payment(
                transaction.gateway_transaction_id,
                capture_request.amount
            )
            
            # Update transaction status
            transaction.status = PaymentStatus.COMPLETED.value
            transaction.updated_at = datetime.utcnow()
            self.db.commit()
            
            capture_amount = capture_request.amount or transaction.amount
            
            return CaptureResponse(
                capture_id=capture_id,
                transaction_id=capture_request.transaction_id,
                gateway=self.gateway,
                status=PaymentStatus.COMPLETED,
                amount=capture_amount,
                currency=transaction.currency,
                gateway_capture_id=gateway_response.get("capture_id"),
                created_at=datetime.utcnow()
            )
            
        except Exception as e:
            logger.error(f"Capture failed: {str(e)}")
            raise GatewayException(
                f"Capture failed: {str(e)}",
                self.gateway.value,
                original_error=e
            )
    
    async def setup_recurring_payment(
        self,
        recurring_request: RecurringPaymentRequest
    ) -> RecurringPaymentResponse:
        """
        Set up recurring/subscription payments.
        
        Args:
            recurring_request: Recurring payment configuration
            
        Returns:
            Recurring payment response
        """
        subscription_id = str(uuid.uuid4())
        
        try:
            # Call gateway client to set up recurring payment
            gateway_response = await self.gateway_client.setup_recurring_payment(
                recurring_request
            )
            
            return RecurringPaymentResponse(
                subscription_id=subscription_id,
                gateway=self.gateway,
                status=gateway_response.get("status", "active"),
                schedule=recurring_request.schedule,
                next_payment_date=recurring_request.schedule.start_date,
                created_at=datetime.utcnow()
            )
            
        except Exception as e:
            logger.error(f"Recurring payment setup failed: {str(e)}")
            raise GatewayException(
                f"Recurring payment setup failed: {str(e)}",
                self.gateway.value,
                original_error=e
            )
    
    async def handle_webhook(
        self,
        payload: dict,
        signature: Optional[str] = None
    ) -> dict:
        """
        Handle webhook events from payment gateway.
        
        Args:
            payload: Webhook payload
            signature: Webhook signature for verification
            
        Returns:
            Processing result
        """
        try:
            # Verify webhook signature
            is_valid = await self.gateway_client.verify_webhook(payload, signature)
            
            if not is_valid:
                raise ValidationException("Invalid webhook signature")
            
            # Process webhook event
            event_type = payload.get("type") or payload.get("event_type")
            transaction_id = payload.get("transaction_id")
            
            logger.info(f"Processing webhook: {event_type}")
            
            # Update transaction status based on webhook
            if transaction_id:
                transaction = self.db.query(Transaction).filter(
                    Transaction.gateway_transaction_id == transaction_id
                ).first()
                
                if transaction:
                    # Update based on event type
                    if "completed" in event_type.lower():
                        transaction.status = PaymentStatus.COMPLETED.value
                    elif "failed" in event_type.lower():
                        transaction.status = PaymentStatus.FAILED.value
                    elif "refund" in event_type.lower():
                        transaction.status = PaymentStatus.REFUNDED.value
                    
                    transaction.updated_at = datetime.utcnow()
                    self.db.commit()
            
            return {
                "event_id": str(uuid.uuid4()),
                "status": "processed",
                "event_type": event_type
            }
            
        except Exception as e:
            logger.error(f"Webhook processing failed: {str(e)}")
            raise

