export const CREATE_PAYMENT_INTENT = `
  mutation CreatePaymentIntent($cartId: String!, $cartVersion: Int) {
    isc2CreatePaymentIntent(cartID: $cartId, cartVersion: $cartVersion) {
      intentPaymentId
      branintreePaypalClientId
      braintreeClientSecret
      stripeClientSecret
      stripePublishableKey
    }
  }
`;

export const PLACE_ORDER = `
  mutation PlaceOrder($input: ISC2_PlaceOrderInput!) {
    isc2PlaceOrder(input: $input) {
      order {
        orderNumber
        cart {
          id
        }
      }
    }
  }
`;
