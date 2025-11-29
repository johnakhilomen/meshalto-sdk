"""Gateway fee calculator and optimizer for cost-based routing."""

import logging
from decimal import Decimal
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

from sdk.server.schemas.schemas import PaymentGateway, Currency

logger = logging.getLogger(__name__)


class CardBrand(str, Enum):
    """Card brand types."""
    VISA = "visa"
    MASTERCARD = "mastercard"
    AMEX = "amex"
    DISCOVER = "discover"
    UNKNOWN = "unknown"


@dataclass
class GatewayFeeStructure:
    """Fee structure for a payment gateway."""
    gateway: PaymentGateway
    percentage_fee: Decimal  # e.g., 2.9% = 0.029
    fixed_fee: Decimal  # e.g., $0.30
    amex_surcharge: Decimal = Decimal("0.0")  # Additional % for Amex
    international_fee: Decimal = Decimal("0.0")  # Additional % for non-US cards
    currency: Currency = Currency.USD
    
    def calculate_fee(
        self,
        amount: Decimal,
        card_brand: Optional[CardBrand] = None,
        is_international: bool = False
    ) -> Decimal:
        """Calculate total fee for a transaction."""
        # Base percentage fee
        percentage = self.percentage_fee
        
        # Add Amex surcharge if applicable
        if card_brand == CardBrand.AMEX:
            percentage += self.amex_surcharge
        
        # Add international fee if applicable
        if is_international:
            percentage += self.international_fee
        
        # Calculate total fee: (amount * percentage) + fixed_fee
        fee = (amount * percentage) + self.fixed_fee
        
        return fee.quantize(Decimal("0.01"))


class GatewayFeeCalculator:
    """
    Calculator for comparing gateway fees and selecting optimal gateway.
    
    Fee structures are based on standard published rates (as of 2024-2025).
    Update these based on your negotiated rates.
    """
    
    # Default fee structures for each gateway
    # NOTE: These are standard rates - update with your actual negotiated rates
    FEE_STRUCTURES = {
        PaymentGateway.STRIPE: GatewayFeeStructure(
            gateway=PaymentGateway.STRIPE,
            percentage_fee=Decimal("0.029"),  # 2.9%
            fixed_fee=Decimal("0.30"),
            amex_surcharge=Decimal("0.005"),  # +0.5% for Amex
            international_fee=Decimal("0.015"),  # +1.5% for international
        ),
        PaymentGateway.SQUARE: GatewayFeeStructure(
            gateway=PaymentGateway.SQUARE,
            percentage_fee=Decimal("0.026"),  # 2.6%
            fixed_fee=Decimal("0.10"),
            amex_surcharge=Decimal("0.0"),  # No Amex surcharge
            international_fee=Decimal("0.01"),  # +1.0% for international
        ),
        PaymentGateway.PAYPAL: GatewayFeeStructure(
            gateway=PaymentGateway.PAYPAL,
            percentage_fee=Decimal("0.0349"),  # 3.49%
            fixed_fee=Decimal("0.49"),
            amex_surcharge=Decimal("0.0"),  # No Amex surcharge
            international_fee=Decimal("0.0149"),  # +1.49% for international
        ),
    }
    
    @classmethod
    def calculate_fees_for_all_gateways(
        cls,
        amount: Decimal,
        card_brand: Optional[CardBrand] = None,
        is_international: bool = False,
        available_gateways: Optional[List[PaymentGateway]] = None
    ) -> Dict[PaymentGateway, Decimal]:
        """
        Calculate fees for all available gateways.
        
        Args:
            amount: Transaction amount
            card_brand: Card brand (VISA, MASTERCARD, AMEX, etc.)
            is_international: Whether card is international
            available_gateways: List of available gateways (None = all)
            
        Returns:
            Dictionary mapping gateway to calculated fee
        """
        if available_gateways is None:
            available_gateways = list(cls.FEE_STRUCTURES.keys())
        
        fees = {}
        for gateway in available_gateways:
            if gateway in cls.FEE_STRUCTURES:
                fee_structure = cls.FEE_STRUCTURES[gateway]
                fee = fee_structure.calculate_fee(
                    amount=amount,
                    card_brand=card_brand,
                    is_international=is_international
                )
                fees[gateway] = fee
                
                logger.info(
                    f"{gateway.value}: Fee ${fee:.2f} for ${amount:.2f} "
                    f"(brand: {card_brand}, international: {is_international})"
                )
        
        return fees
    
    @classmethod
    def select_cheapest_gateway(
        cls,
        amount: Decimal,
        card_brand: Optional[CardBrand] = None,
        is_international: bool = False,
        available_gateways: Optional[List[PaymentGateway]] = None,
        preference_weight: Optional[Dict[PaymentGateway, Decimal]] = None
    ) -> Tuple[PaymentGateway, Decimal, Dict[PaymentGateway, Decimal]]:
        """
        Select the gateway with the lowest transaction fee.
        
        Args:
            amount: Transaction amount
            card_brand: Card brand (VISA, MASTERCARD, AMEX, etc.)
            is_international: Whether card is international
            available_gateways: List of available gateways (None = all)
            preference_weight: Optional weights to add to fees (for gateway preferences)
            
        Returns:
            Tuple of (selected_gateway, fee, all_fees)
        """
        fees = cls.calculate_fees_for_all_gateways(
            amount=amount,
            card_brand=card_brand,
            is_international=is_international,
            available_gateways=available_gateways
        )
        
        if not fees:
            raise ValueError("No available gateways for fee calculation")
        
        # Apply preference weights if provided
        adjusted_fees = fees.copy()
        if preference_weight:
            for gateway, weight in preference_weight.items():
                if gateway in adjusted_fees:
                    adjusted_fees[gateway] += weight
        
        # Find gateway with minimum fee
        cheapest_gateway = min(adjusted_fees, key=adjusted_fees.get)
        cheapest_fee = fees[cheapest_gateway]  # Use original fee, not adjusted
        
        logger.info(
            f"Selected gateway: {cheapest_gateway.value} with fee ${cheapest_fee:.2f}"
        )
        
        return cheapest_gateway, cheapest_fee, fees
    
    @classmethod
    def get_fee_comparison(
        cls,
        amount: Decimal,
        card_brand: Optional[CardBrand] = None,
        is_international: bool = False
    ) -> Dict[str, any]:
        """
        Get detailed fee comparison across all gateways.
        
        Returns:
            Dictionary with comparison details and recommendations
        """
        fees = cls.calculate_fees_for_all_gateways(
            amount=amount,
            card_brand=card_brand,
            is_international=is_international
        )
        
        if not fees:
            return {"error": "No gateways available"}
        
        # Calculate effective rate for each gateway
        effective_rates = {}
        for gateway, fee in fees.items():
            effective_rate = (fee / amount * 100) if amount > 0 else Decimal("0")
            effective_rates[gateway] = effective_rate
        
        # Find cheapest and most expensive
        cheapest = min(fees, key=fees.get)
        most_expensive = max(fees, key=fees.get)
        
        savings = fees[most_expensive] - fees[cheapest]
        savings_percentage = (savings / fees[most_expensive] * 100) if fees[most_expensive] > 0 else Decimal("0")
        
        return {
            "amount": float(amount),
            "card_brand": card_brand.value if card_brand else "unknown",
            "is_international": is_international,
            "fees": {
                gateway.value: {
                    "fee": float(fee),
                    "effective_rate": float(effective_rates[gateway]),
                    "net_amount": float(amount - fee)
                }
                for gateway, fee in fees.items()
            },
            "recommendation": {
                "gateway": cheapest.value,
                "fee": float(fees[cheapest]),
                "effective_rate": float(effective_rates[cheapest])
            },
            "savings": {
                "amount": float(savings),
                "percentage": float(savings_percentage),
                "vs_gateway": most_expensive.value
            }
        }
    
    @classmethod
    def update_fee_structure(
        cls,
        gateway: PaymentGateway,
        percentage_fee: Optional[Decimal] = None,
        fixed_fee: Optional[Decimal] = None,
        amex_surcharge: Optional[Decimal] = None,
        international_fee: Optional[Decimal] = None
    ):
        """
        Update fee structure for a gateway (e.g., after negotiating better rates).
        
        Args:
            gateway: Gateway to update
            percentage_fee: New percentage fee (e.g., 0.029 for 2.9%)
            fixed_fee: New fixed fee
            amex_surcharge: New Amex surcharge
            international_fee: New international fee
        """
        if gateway not in cls.FEE_STRUCTURES:
            logger.warning(f"Gateway {gateway.value} not found in fee structures")
            return
        
        current = cls.FEE_STRUCTURES[gateway]
        
        cls.FEE_STRUCTURES[gateway] = GatewayFeeStructure(
            gateway=gateway,
            percentage_fee=percentage_fee if percentage_fee is not None else current.percentage_fee,
            fixed_fee=fixed_fee if fixed_fee is not None else current.fixed_fee,
            amex_surcharge=amex_surcharge if amex_surcharge is not None else current.amex_surcharge,
            international_fee=international_fee if international_fee is not None else current.international_fee,
            currency=current.currency
        )
        
        logger.info(f"Updated fee structure for {gateway.value}")


# Helper function to detect card brand from token
def detect_card_brand(token: str, brand_hint: Optional[str] = None) -> CardBrand:
    """
    Detect card brand from token or brand hint.
    
    Args:
        token: Payment token
        brand_hint: Optional brand from payment_token.brand
        
    Returns:
        CardBrand enum
    """
    if brand_hint:
        brand_lower = brand_hint.lower()
        if "visa" in brand_lower:
            return CardBrand.VISA
        elif "master" in brand_lower:
            return CardBrand.MASTERCARD
        elif "amex" in brand_lower or "american" in brand_lower:
            return CardBrand.AMEX
        elif "discover" in brand_lower:
            return CardBrand.DISCOVER
    
    # Try to detect from token
    token_lower = token.lower()
    if "visa" in token_lower:
        return CardBrand.VISA
    elif "mastercard" in token_lower or "mc" in token_lower:
        return CardBrand.MASTERCARD
    elif "amex" in token_lower:
        return CardBrand.AMEX
    elif "discover" in token_lower:
        return CardBrand.DISCOVER
    
    return CardBrand.UNKNOWN
