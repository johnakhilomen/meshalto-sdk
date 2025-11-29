"""Custom exceptions for payment processing."""


class PaymentAdapterException(Exception):
    """Base exception for payment adapter."""
    def __init__(self, message: str, code: str = None):
        self.message = message
        self.code = code or "PAYMENT_ERROR"
        super().__init__(self.message)


class ValidationException(PaymentAdapterException):
    """Validation error exception."""
    def __init__(self, message: str):
        super().__init__(message, "VALIDATION_ERROR")


class GatewayException(PaymentAdapterException):
    """Gateway-specific exception."""
    def __init__(self, message: str, gateway: str, original_error: Exception = None):
        self.gateway = gateway
        self.original_error = original_error
        super().__init__(message, f"GATEWAY_ERROR_{gateway.upper()}")


class AuthenticationException(PaymentAdapterException):
    """Authentication error exception."""
    def __init__(self, message: str):
        super().__init__(message, "AUTHENTICATION_ERROR")


class ConversionException(PaymentAdapterException):
    """Schema conversion exception."""
    def __init__(self, message: str, gateway: str):
        self.gateway = gateway
        super().__init__(message, f"CONVERSION_ERROR_{gateway.upper()}")


class RetryableException(PaymentAdapterException):
    """Exception that should trigger a retry."""
    def __init__(self, message: str):
        super().__init__(message, "RETRYABLE_ERROR")
