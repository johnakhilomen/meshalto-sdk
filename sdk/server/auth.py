"""Authentication and authorization utilities."""

import os
from sdk.server.schemas.exceptions import AuthenticationException


# Default API key for demo purposes - should be stored securely in production
DEFAULT_API_KEY = os.getenv("API_KEY", "demo-api-key-12345")


def verify_api_key(api_key: str = None):
    """
    Verify API key for authentication.
    
    Args:
        api_key: API key to verify
        
    Raises:
        AuthenticationException: If API key is invalid or missing
    """
    if not api_key:
        raise AuthenticationException("API key is required. Provide X-API-Key header.")
    
    if api_key != DEFAULT_API_KEY:
        raise AuthenticationException("Invalid API key")
    
    return True
