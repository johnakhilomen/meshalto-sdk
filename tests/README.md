# Test Suite

Comprehensive tests for Meshalto Payment SDK.

## 🧪 Running Tests

```bash
# Install test dependencies
pip install -r tests/requirements.txt

# Run all tests
pytest

# Run with coverage
pytest --cov=sdk/server --cov-report=html

# Run specific test file
pytest tests/test_converters.py

# Run specific test
pytest tests/test_converters.py::test_stripe_converter
```

## 📁 Test Structure

```
tests/
├── conftest.py           # Pytest fixtures and configuration
├── test_converters.py    # Universal schema converter tests
├── test_schemas.py       # Payment schema validation tests
└── requirements.txt      # Test dependencies
```

## 🎯 What's Tested

### Converters (`test_converters.py`)
- ✅ Stripe format conversion
- ✅ Square format conversion  
- ✅ PayPal format conversion
- ✅ Universal schema validation
- ✅ Error handling

### Schemas (`test_schemas.py`)
- ✅ Payment request validation
- ✅ Currency support
- ✅ Payment method types
- ✅ Customer information
- ✅ Gateway enum values

## 📊 Coverage

Aim for 80%+ test coverage:

```bash
pytest --cov=sdk/server --cov-report=term-missing
```

## 🔧 Adding New Tests

1. Create test file: `test_feature.py`
2. Import what you need:
   ```python
   from sdk.server.converters import StripeConverter
   from sdk.server.schemas import UniversalPaymentRequest
   ```
3. Write tests:
   ```python
   def test_my_feature():
       # Arrange
       converter = StripeConverter()
       
       # Act
       result = converter.convert(request)
       
       # Assert
       assert result.gateway == "stripe"
   ```

## 🐛 Debugging Tests

```bash
# Run with verbose output
pytest -v

# Run with print statements
pytest -s

# Stop on first failure
pytest -x

# Run last failed tests
pytest --lf
```

## ⚡ CI/CD

Tests run automatically on:
- Every pull request
- Every commit to main
- Before deployment

See `.github/workflows/test.yml` for CI configuration.
