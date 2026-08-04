export const CREATE_CART = `
  mutation createCartAnonymous($createCartDraft: CartDraft!) {
    createCart(draft: $createCartDraft) {
      id
    }
  }
`;

export const MONEY_FIELDS = `
  centAmount
  fractionDigits
  currencyCode
`;

export const ADDRESS_FIELDS = `
  city
  country
  phone
  postalCode
  state
  streetName
`;

export const CART_FIELDS = `
  id
  version
  cartState
  customerId
  customerEmail
  custom {
    customFieldsRaw {
      name
      value
    }
  }
  bundles
  totalLineItemQuantity
  customerGroup {
    name
  }
  shippingAddress {
    ${ADDRESS_FIELDS}
  }
  nonMemberPrice
  inventories
  discountCodes
  discountOnTotalPrice {
    includedDiscounts {
      discountedAmount {
        ${MONEY_FIELDS}
      }
      discount {
        name
      }
    }
  }
  totalPrice {
    ${MONEY_FIELDS}
  }
  taxedPrice {
    totalNet {
      ${MONEY_FIELDS}
    }
    totalGross {
      ${MONEY_FIELDS}
    }
    totalTax {
      ${MONEY_FIELDS}
    }
  }
  lineItems {
    id
    productId
    productKey
    productType {
      id
      name
    }
    name
    quantity
    variant {
      id
      sku
      attributesRaw
    }
    taxedPrice {
      totalTax {
        ${MONEY_FIELDS}
      }
    }
    totalPrice {
      ${MONEY_FIELDS}
    }
    custom {
      customFieldsRaw {
        name
        value
      }
    }
    discountedPricePerQuantity {
      discountedPrice {
        value {
          ${MONEY_FIELDS}
        }
        includedDiscounts
      }
    }
    price {
      discounted {
        value {
          ${MONEY_FIELDS}
        }
        discount {
          name
        }
      }
      value {
        ${MONEY_FIELDS}
      }
    }
  }
`;

export const GET_ACTIVE_CART = `
  query isc2GetCart($cartInfo: ISC2_inputCartOperations) {
    isc2GetCart(cartInfo: $cartInfo) {
      ${CART_FIELDS}
    }
  }
`;

export const UPDATE_CART = `
  mutation isc2CartUpdate ($cartId: String!, $country: String, $actions: [ISC2_CartUpdateAction!]!) {
    isc2CartUpdate (cartID: $cartId, country: $country, actions: $actions) {
      ${CART_FIELDS}
    }
  }
`;

export const UPDATE_CART_TAX = `
  mutation isc2CartTaxUpdate ($cartId: String!, $paymentIntentId: String) {
    isc2CartTaxUpdate (cartID: $cartId, paymentIntentId: $paymentIntentId) {
      ${CART_FIELDS}
    }
  }
`;
