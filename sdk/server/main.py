"""Main FastAPI application for Payment Processing API."""

from fastapi import FastAPI, HTTPException, Depends, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from contextlib import asynccontextmanager
import logging
from typing import Optional, List
from decimal import Decimal

from sdk.server.schemas.schemas import (
    UniversalPaymentRequest,
    UniversalPaymentResponse,
    PaymentGateway,
    RefundRequest,
    RefundResponse,
    CaptureRequest,
    CaptureResponse,
    RecurringPaymentRequest,
    RecurringPaymentResponse,
    WebhookEvent
)
from sdk.server.schemas.database import get_db
from sdk.server.schemas.database import engine as init_db
from sdk.server.schemas.exceptions import (
    PaymentAdapterException,
    ValidationException,
    GatewayException,
    AuthenticationException
)
from sdk.server.models import Transaction
from sdk.server.payment_processor import PaymentProcessor
from sdk.server.auth import verify_api_key
from sdk.server.fee_optimizer import (
    GatewayFeeCalculator,
    CardBrand,
    detect_card_brand
)
from decimal import Decimal

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    # Startup
    logger.info("Startup: database engine ready")
    # Automatically create tables if they don't exist
    from sdk.server.schemas.database import Base, engine
    logger.info("Creating database tables if not present...")
    Base.metadata.create_all(engine)
    logger.info("Database tables ensured.")
    yield
    # Shutdown (if needed)
    logger.info("Shutting down...")


# Create FastAPI app
app = FastAPI(
    title="Payment Processing API",
    description="Handles payment processing with authentication, retry logic, and response normalization",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "payment-processing-api"}


@app.post("/process/{gateway}", response_model=UniversalPaymentResponse)
async def process_payment(
    gateway: PaymentGateway,
    payment_request: UniversalPaymentRequest,
    x_api_key: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Process a payment through specified gateway.
    
    Args:
        gateway: Payment gateway to use (stripe, paypal, square)
        payment_request: Universal payment request
        x_api_key: API key for authentication
        db: Database session
        
    Returns:
        Normalized payment response
    """
    try:
        # Verify API key
        verify_api_key(x_api_key)
        
        # Create payment processor
        processor = PaymentProcessor(gateway, db)
        
        # Process payment
        response = await processor.process_payment(payment_request)
        
        logger.info(f"Payment processed successfully: {response.transaction_id}")
        
        return response
        
    except AuthenticationException as e:
        logger.error(f"Authentication failed: {e.message}")
        raise HTTPException(status_code=401, detail=e.message)
        
    except ValidationException as e:
        logger.error(f"Validation error: {e.message}")
        raise HTTPException(status_code=400, detail=e.message)
        
    except GatewayException as e:
        logger.error(f"Gateway error ({e.gateway}): {e.message}")
        raise HTTPException(status_code=502, detail=e.message)
        
    except PaymentAdapterException as e:
        logger.error(f"Payment adapter error: {e.message}")
        raise HTTPException(status_code=500, detail=e.message)
        
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/transactions/{transaction_id}")
async def get_transaction(
    transaction_id: str,
    x_api_key: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Get transaction details by ID.
    
    Args:
        transaction_id: Transaction ID
        x_api_key: API key for authentication
        db: Database session
        
    Returns:
        Transaction details
    """
    try:
        verify_api_key(x_api_key)
        
        transaction = db.query(Transaction).filter(
            Transaction.transaction_id == transaction_id
        ).first()
        
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        return {
            "transaction_id": transaction.transaction_id,
            "gateway": transaction.gateway,
            "status": transaction.status,
            "amount": float(transaction.amount),
            "currency": transaction.currency,
            "gateway_transaction_id": transaction.gateway_transaction_id,
            "created_at": transaction.created_at,
            "updated_at": transaction.updated_at,
            "error_message": transaction.error_message,
            "retry_count": transaction.retry_count
        }
        
    except AuthenticationException as e:
        raise HTTPException(status_code=401, detail=e.message)
        
    except Exception as e:
        logger.error(f"Error fetching transaction: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/transactions")
async def list_transactions(
    limit: int = 100,
    gateway: PaymentGateway = None,
    status: str = None,
    x_api_key: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    List transactions with optional filters.
    
    Args:
        limit: Maximum number of records to return
        gateway: Filter by gateway
        status: Filter by status
        x_api_key: API key for authentication
        db: Database session
        
    Returns:
        List of transactions
    """
    try:
        verify_api_key(x_api_key)
        
        query = db.query(Transaction)
        
        if gateway:
            query = query.filter(Transaction.gateway == gateway.value)
        
        if status:
            query = query.filter(Transaction.status == status)
        
        transactions = query.order_by(Transaction.created_at.desc()).limit(limit).all()
        
        return {
            "total": len(transactions),
            "transactions": [
                {
                    "transaction_id": t.transaction_id,
                    "gateway": t.gateway,
                    "status": t.status,
                    "amount": float(t.amount),
                    "currency": t.currency,
                    "created_at": t.created_at
                }
                for t in transactions
            ]
        }
        
    except AuthenticationException as e:
        raise HTTPException(status_code=401, detail=e.message)
        
    except Exception as e:
        logger.error(f"Error listing transactions: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")




@app.post("/refund/{gateway}", response_model=RefundResponse)
async def refund_payment(
    gateway: PaymentGateway,
    refund_request: RefundRequest,
    x_api_key: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Refund a completed payment (full or partial).
    
    Args:
        gateway: Payment gateway used for original payment
        refund_request: Refund request details
        x_api_key: API key for authentication
        db: Database session
        
    Returns:
        Refund response
    """
    try:
        verify_api_key(x_api_key)
        
        processor = PaymentProcessor(gateway, db)
        response = await processor.refund_payment(refund_request)
        
        logger.info(f"Refund processed successfully: {response.refund_id}")
        return response
        
    except AuthenticationException as e:
        raise HTTPException(status_code=401, detail=e.message)
    except ValidationException as e:
        raise HTTPException(status_code=400, detail=e.message)
    except GatewayException as e:
        raise HTTPException(status_code=502, detail=e.message)
    except Exception as e:
        logger.error(f"Refund error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/void/{gateway}/{transaction_id}")
async def void_payment(
    gateway: PaymentGateway,
    transaction_id: str,
    x_api_key: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Void/cancel an authorized payment (before capture).
    
    Args:
        gateway: Payment gateway used for original payment
        transaction_id: Original transaction ID to void
        x_api_key: API key for authentication
        db: Database session
        
    Returns:
        Void confirmation
    """
    try:
        verify_api_key(x_api_key)
        
        processor = PaymentProcessor(gateway, db)
        response = await processor.void_payment(transaction_id)
        
        logger.info(f"Payment voided successfully: {transaction_id}")
        return response
        
    except AuthenticationException as e:
        raise HTTPException(status_code=401, detail=e.message)
    except ValidationException as e:
        raise HTTPException(status_code=400, detail=e.message)
    except GatewayException as e:
        raise HTTPException(status_code=502, detail=e.message)
    except Exception as e:
        logger.error(f"Void error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/capture/{gateway}", response_model=CaptureResponse)
async def capture_payment(
    gateway: PaymentGateway,
    capture_request: CaptureRequest,
    x_api_key: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Capture an authorized payment (delayed capture).
    
    Args:
        gateway: Payment gateway used for authorization
        capture_request: Capture request details
        x_api_key: API key for authentication
        db: Database session
        
    Returns:
        Capture response
    """
    try:
        verify_api_key(x_api_key)
        
        processor = PaymentProcessor(gateway, db)
        response = await processor.capture_payment(capture_request)
        
        logger.info(f"Payment captured successfully: {response.capture_id}")
        return response
        
    except AuthenticationException as e:
        raise HTTPException(status_code=401, detail=e.message)
    except ValidationException as e:
        raise HTTPException(status_code=400, detail=e.message)
    except GatewayException as e:
        raise HTTPException(status_code=502, detail=e.message)
    except Exception as e:
        logger.error(f"Capture error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/recurring/{gateway}", response_model=RecurringPaymentResponse)
async def setup_recurring_payment(
    gateway: PaymentGateway,
    recurring_request: RecurringPaymentRequest,
    x_api_key: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Set up recurring/subscription payments.
    
    Args:
        gateway: Payment gateway to use
        recurring_request: Recurring payment configuration
        x_api_key: API key for authentication
        db: Database session
        
    Returns:
        Recurring payment response
    """
    try:
        verify_api_key(x_api_key)
        
        processor = PaymentProcessor(gateway, db)
        response = await processor.setup_recurring_payment(recurring_request)
        
        logger.info(f"Recurring payment setup: {response.subscription_id}")
        return response
        
    except AuthenticationException as e:
        raise HTTPException(status_code=401, detail=e.message)
    except ValidationException as e:
        raise HTTPException(status_code=400, detail=e.message)
    except GatewayException as e:
        raise HTTPException(status_code=502, detail=e.message)
    except Exception as e:
        logger.error(f"Recurring payment setup error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/webhook/{gateway}")
async def handle_webhook(
    gateway: PaymentGateway,
    request: dict,
    x_signature: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Handle webhook events from payment gateway.
    
    Args:
        gateway: Payment gateway sending the webhook
        request: Webhook payload
        x_signature: Webhook signature for verification
        db: Database session
        
    Returns:
        Acknowledgment
    """
    try:
        processor = PaymentProcessor(gateway, db)
        result = await processor.handle_webhook(request, x_signature)
        
        logger.info(f"Webhook processed: {gateway.value}")
        return {"status": "success", "event_id": result.get("event_id")}
        
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        raise HTTPException(status_code=500, detail="Webhook processing failed")


@app.get("/fee-comparison")
async def get_fee_comparison(
    amount: float,
    card_brand: Optional[str] = None,
    is_international: bool = False,
    x_api_key: Optional[str] = Header(None)
):
    """
    Compare transaction fees across all payment gateways.
    
    Args:
        amount: Transaction amount
        card_brand: Card brand (visa, mastercard, amex, discover)
        is_international: Whether card is international
        x_api_key: API key for authentication
        
    Returns:
        Fee comparison with recommendations
    """
    try:
        verify_api_key(x_api_key)
        
        # Convert card brand string to enum
        brand = None
        if card_brand:
            try:
                brand = CardBrand(card_brand.lower())
            except ValueError:
                brand = CardBrand.UNKNOWN
        
        comparison = GatewayFeeCalculator.get_fee_comparison(
            amount=Decimal(str(amount)),
            card_brand=brand,
            is_international=is_international
        )
        
        return comparison
        
    except AuthenticationException as e:
        raise HTTPException(status_code=401, detail=e.message)
    except Exception as e:
        logger.error(f"Fee comparison error: {str(e)}")
        raise HTTPException(status_code=500, detail="Fee comparison failed")


@app.post("/process-optimized", response_model=UniversalPaymentResponse)
async def process_payment_optimized(
    payment_request: UniversalPaymentRequest,
    x_api_key: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Process payment using the gateway with the lowest transaction fee.
    
    This endpoint automatically selects the most cost-effective gateway
    based on the transaction amount, card brand, and other factors.
    
    Args:
        payment_request: Universal payment request
        x_api_key: API key for authentication
        db: Database session
        
    Returns:
        Payment response with selected gateway information
    """
    try:
        verify_api_key(x_api_key)
        
        # Detect card brand if available
        card_brand = CardBrand.UNKNOWN
        if payment_request.payment_token and payment_request.payment_token.brand:
            card_brand = detect_card_brand(
                token=payment_request.payment_token.token,
                brand_hint=payment_request.payment_token.brand
            )
        
        # Select cheapest gateway
        selected_gateway, fee, all_fees = GatewayFeeCalculator.select_cheapest_gateway(
            amount=payment_request.amount,
            card_brand=card_brand,
            is_international=False,  # Could be enhanced with card BIN lookup
            available_gateways=None  # Use all available gateways
        )
        
        logger.info(
            f"Fee optimization: Selected {selected_gateway.value} "
            f"(${fee:.2f} vs alternatives: {', '.join([f'{g.value}: ${f:.2f}' for g, f in all_fees.items()])})"
        )
        
        # Add fee info to metadata (flatten for gateway compatibility)
        if not payment_request.metadata:
            payment_request.metadata = {}
        
        payment_request.metadata.update({
            "gateway_selection": "fee_optimized",
            "selected_gateway": selected_gateway.value,
            "gateway_fee": str(fee),
            "alternative_fees_summary": ', '.join([f'{g.value}: ${f:.2f}' for g, f in all_fees.items()])
        })
        
        # Process payment with selected gateway
        processor = PaymentProcessor(selected_gateway, db)
        response = await processor.process_payment(payment_request)
        
        # Calculate savings (difference between selected and most expensive gateway)
        max_fee = max(all_fees.values())
        savings = max_fee - fee if max_fee > fee else Decimal('0')
        
        # Update response with optimization info and savings
        response.fee = fee
        response.savings = savings if savings > 0 else None
        response.metadata = response.metadata or {}
        response.metadata.update({
            "fee_optimization": {
                "selected_gateway": selected_gateway.value,
                "gateway_fee": float(fee),
                "savings": float(savings) if savings > 0 else 0,
                "fees_compared": {g.value: float(f) for g, f in all_fees.items()}
            }
        })
        
        return response
        
    except AuthenticationException as e:
        raise HTTPException(status_code=401, detail=e.message)
    except ValidationException as e:
        raise HTTPException(status_code=400, detail=e.message)
    except GatewayException as e:
        raise HTTPException(status_code=502, detail=e.message)
    except Exception as e:
        logger.error(f"Optimized payment error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/widget", response_class=HTMLResponse)
async def widget_demo():
    """
    Serve widget demo page for testing integrations.
    """
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Universal Payment Widget Demo</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body>
        <div id="payment-widget"></div>
        <script src="/static/payment-widget.js"></script>
        <script>
            const payment = UniversalPayment.create({
                apiKey: 'pk_test_demo',
                amount: 99.99,
                currency: 'USD',
                onSuccess: (result) => alert('Success: ' + result.transaction_id),
                onError: (error) => alert('Error: ' + error.message)
            });
            payment.mount('#payment-widget');
        </script>
    </body>
    </html>
    """


@app.post("/process-stripe", response_model=UniversalPaymentResponse)
async def process_stripe_payment(
    payment_request: UniversalPaymentRequest,
    x_api_key: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Process payment through Stripe gateway only.
    
    This endpoint processes payments exclusively through Stripe, regardless of fees.
    Use this when you want to force Stripe processing (e.g., for branding or compliance).
    
    Args:
        payment_request: Universal payment request with Stripe payment token
        x_api_key: API key for authentication
        db: Database session
        
    Returns:
        Normalized payment response with fee information
        
    Raises:
        HTTPException: If payment token is invalid or gateway is not configured
    """
    verify_api_key(x_api_key)
    
    # Validate payment token format for Stripe
    if payment_request.payment_token and not payment_request.payment_token.token.startswith(('pm_', 'tok_', 'src_')):
        raise HTTPException(
            status_code=400,
            detail="Invalid Stripe payment token format. Expected token starting with pm_, tok_, or src_"
        )
    
    logger.info(f"Processing Stripe payment: ${payment_request.amount} {payment_request.currency}")
    
    try:
        # Calculate Stripe fee for transparency
        card_brand = CardBrand.VISA  # Default
        if payment_request.payment_token and payment_request.payment_token.brand:
            try:
                card_brand = CardBrand(payment_request.payment_token.brand.lower())
            except ValueError:
                pass
        
        fee_structure = GatewayFeeCalculator.FEE_STRUCTURES.get(PaymentGateway.STRIPE)
        fee = fee_structure.calculate_fee(
            amount=payment_request.amount,
            card_brand=card_brand,
            is_international=False
        )
        
        # Add metadata
        if not payment_request.metadata:
            payment_request.metadata = {}
        payment_request.metadata.update({
            "gateway_selection": "manual_stripe",
            "gateway_fee": str(fee)
        })
        
        # Process through Stripe
        processor = PaymentProcessor(PaymentGateway.STRIPE, db)
        response = await processor.process_payment(payment_request)
        
        # Add fee information to response
        response.fee = fee
        response.metadata = response.metadata or {}
        response.metadata["gateway_fee"] = float(fee)
        
        logger.info(f"Stripe payment successful: {response.transaction_id} (fee: ${fee:.2f})")
        return response
        
    except Exception as e:
        logger.error(f"Stripe payment failed: {str(e)}")
        raise HTTPException(status_code=502, detail=f"Stripe error: {str(e)}")


@app.post("/process-square", response_model=UniversalPaymentResponse)
async def process_square_payment(
    payment_request: UniversalPaymentRequest,
    x_api_key: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Process payment through Square gateway only.
    
    This endpoint processes payments exclusively through Square, regardless of fees.
    Use this when you want to force Square processing (e.g., for branding or compliance).
    
    Args:
        payment_request: Universal payment request with Square payment token
        x_api_key: API key for authentication
        db: Database session
        
    Returns:
        Normalized payment response with fee information
        
    Raises:
        HTTPException: If payment token is invalid or gateway is not configured
    """
    verify_api_key(x_api_key)
    
    # Validate payment token format for Square
    if payment_request.payment_token and not payment_request.payment_token.token.startswith(('cnon:', 'ccof:')):
        raise HTTPException(
            status_code=400,
            detail="Invalid Square payment token format. Expected token starting with cnon: or ccof:"
        )
    
    logger.info(f"Processing Square payment: ${payment_request.amount} {payment_request.currency}")
    
    try:
        # Calculate Square fee for transparency
        card_brand = CardBrand.VISA  # Default
        if payment_request.payment_token and payment_request.payment_token.brand:
            try:
                card_brand = CardBrand(payment_request.payment_token.brand.lower())
            except ValueError:
                pass
        
        fee_structure = GatewayFeeCalculator.FEE_STRUCTURES.get(PaymentGateway.SQUARE)
        fee = fee_structure.calculate_fee(
            amount=payment_request.amount,
            card_brand=card_brand,
            is_international=False
        )
        
        # Add metadata
        if not payment_request.metadata:
            payment_request.metadata = {}
        payment_request.metadata.update({
            "gateway_selection": "manual_square",
            "gateway_fee": str(fee)
        })
        
        # Process through Square
        processor = PaymentProcessor(PaymentGateway.SQUARE, db)
        response = await processor.process_payment(payment_request)
        
        # Add fee information to response
        response.fee = fee
        response.metadata = response.metadata or {}
        response.metadata["gateway_fee"] = float(fee)
        
        logger.info(f"Square payment successful: {response.transaction_id} (fee: ${fee:.2f})")
        return response
        
    except Exception as e:
        logger.error(f"Square payment failed: {str(e)}")
        raise HTTPException(status_code=502, detail=f"Square error: {str(e)}")


@app.post("/process-paypal", response_model=UniversalPaymentResponse)
async def process_paypal_payment(
    payment_request: UniversalPaymentRequest,
    x_api_key: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Process payment through PayPal gateway only.
    
    This endpoint processes payments exclusively through PayPal, regardless of fees.
    Use this when you want to force PayPal processing (e.g., for branding or compliance).
    
    Args:
        payment_request: Universal payment request with PayPal payment token
        x_api_key: API key for authentication
        db: Database session
        
    Returns:
        Normalized payment response with fee information
        
    Raises:
        HTTPException: If payment token is invalid or gateway is not configured
    """
    verify_api_key(x_api_key)
    
    logger.info(f"Processing PayPal payment: ${payment_request.amount} {payment_request.currency}")
    
    try:
        # Calculate PayPal fee for transparency
        card_brand = CardBrand.VISA  # Default
        if payment_request.payment_token and payment_request.payment_token.brand:
            try:
                card_brand = CardBrand(payment_request.payment_token.brand.lower())
            except ValueError:
                pass
        
        fee_structure = GatewayFeeCalculator.FEE_STRUCTURES.get(PaymentGateway.PAYPAL)
        fee = fee_structure.calculate_fee(
            amount=payment_request.amount,
            card_brand=card_brand,
            is_international=False
        )
        
        # Add metadata
        if not payment_request.metadata:
            payment_request.metadata = {}
        payment_request.metadata.update({
            "gateway_selection": "manual_paypal",
            "gateway_fee": str(fee)
        })
        
        # Process through PayPal
        processor = PaymentProcessor(PaymentGateway.PAYPAL, db)
        response = await processor.process_payment(payment_request)
        
        # Add fee information to response
        response.fee = fee
        response.metadata = response.metadata or {}
        response.metadata["gateway_fee"] = float(fee)
        
        logger.info(f"PayPal payment successful: {response.transaction_id} (fee: ${fee:.2f})")
        return response
        
    except Exception as e:
        logger.error(f"PayPal payment failed: {str(e)}")
        raise HTTPException(status_code=502, detail=f"PayPal error: {str(e)}")


@app.get("/")
async def root():
    """
    Root endpoint with API information and integration links.
    """
    return {
        "name": "Universal Payment Adapter API",
        "version": "1.0.0",
        "description": "Multi-gateway payment processing with intelligent routing",
        "features": [
            "Multiple payment gateways (Stripe, Square, PayPal)",
            "Automatic gateway selection based on fees",
            "Gateway-specific endpoints for forced processing",
            "Country and currency-based routing",
            "Card brand detection",
            "PCI-compliant processing",
            "Webhook support"
        ],
        "integrations": {
            "javascript_widget": "/widget",
            "documentation": "/docs",
            "api_reference": "/redoc"
        },
        "endpoints": {
            "health": "/health",
            "process_stripe": "/process-stripe",
            "process_square": "/process-square",
            "process_paypal": "/process-paypal",
            "process_specific": "/process/{gateway}",
            "process_optimized": "/process-optimized",
            "fee_comparison": "/fee-comparison",
            "refund": "/refund",
            "capture": "/capture",
            "recurring": "/recurring",
            "transactions": "/transactions",
            "webhook": "/webhook/{gateway}"
        },
        "support": {
            "documentation": "https://docs.universalpayment.com",
            "email": "support@universalpayment.com",
            "github": "https://github.com/yourusername/universal-payment-adapter"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
