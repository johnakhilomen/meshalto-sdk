# Meshalto Payment Server

FastAPI-based payment processing server with multi-gateway support.

## 🚀 Quick Start

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your gateway API keys
nano .env

# Start with Docker
docker-compose up
```

API runs on `http://localhost:8002`

## 📁 Structure

```
sdk/server/
├── main.py                 # FastAPI application entry
├── payment_processor.py    # Core payment processing logic
├── gateway_clients.py      # Gateway API clients (Stripe, Square, PayPal)
├── fee_optimizer.py        # Automatic gateway selection
├── auth.py                 # API authentication
├── models.py               # Database models
├── converters/             # Universal schema converters
│   ├── __init__.py
│   └── base.py            # Gateway format converters
├── schemas/                # Shared schemas & exceptions
│   ├── __init__.py
│   ├── schemas.py         # Pydantic models
│   └── exceptions.py      # Custom exceptions
└── docker-compose.yml      # Local development setup
```

## 🔌 API Endpoints

### Process Payment
```bash
POST /api/v1/payments
Content-Type: application/json
X-API-Key: your_api_key

{
  "amount": 99.99,
  "currency": "USD",
  "gateway": "auto",  # or "stripe", "square", "paypal"
  "payment_method": {
    "type": "card",
    "card": {
      "number": "4242424242424242",
      "exp_month": "12",
      "exp_year": "2025",
      "cvv": "123"
    }
  }
}
```

### Get Transaction
```bash
GET /api/v1/transactions/{transaction_id}
X-API-Key: your_api_key
```

## 🎯 Features

- **Multi-Gateway Support**: Stripe, Square, PayPal
- **Auto Gateway Selection**: Picks cheapest fees automatically
- **Universal Schema**: Single API format converts to any gateway
- **PCI Compliant**: Secure payment handling
- **Transaction History**: PostgreSQL database
- **Docker Ready**: One command deployment

## 🔧 Configuration

Required environment variables:

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Payment Gateways
STRIPE_API_KEY=sk_test_...
SQUARE_ACCESS_TOKEN=...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...

# API Security
API_KEY=your_random_key_here
```

## 📚 Documentation

- [Architecture](../../docs/architecture.md)
- [Deployment](../../docs/deployment.md)
- [API Reference](../../docs/api-reference.md)

## 🧪 Testing

```bash
# Run tests
pytest

# Run with coverage
pytest --cov=.
```

## 🚀 Deployment

See [Deployment Guide](../../docs/deployment.md) for:
- Railway (recommended)
- Docker Compose
- AWS ECS
- Kubernetes
