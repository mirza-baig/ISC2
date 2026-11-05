import { CART_FIELDS, MONEY_FIELDS } from './cart';

export const GET_ORDER = `
query Order($orderNumber: String, $locale: Locale, $externalId: String!, $email: String!) {
    order(orderNumber: $orderNumber, externalId: $externalId, email: $email) {
      cartISC2 {
        ${CART_FIELDS}
      }
      orderNumber
      createdAt
      customerEmail
      custom {
        customFieldsRaw {
          name
          value
        }
      }
      orderState
      paymentInfo {
        payments {
          paymentMethodInfo {
            method
            name(locale: $locale)
          }
        }
      }
      paymentState
      shippingAddress {
        firstName
        lastName
        streetName
        streetNumber
        postalCode
        city
        state
        country
        company
        department
        building
        apartment
        pOBox
      }
      totalPrice {
        ${MONEY_FIELDS}
      }
    }
  }
`;

type GetAllOrdersQueryParams = {
  includeB2BFields: boolean;
};

const B2B_ORDER_FIELDS = `
      organization
      buyer
      poNumber
      customerOrderReference`;

export const GET_ALL_ORDERS = ({ includeB2BFields }: GetAllOrdersQueryParams) => `
  query SalesforceGetOrders($externalId: String!, $email: String!) {
    salesforceGetOrders(externalId: $externalId, email: $email) {
      orderId
      orderNumber
      orderDate
      orderStatus
      paymentType
      orderReferenceNumber${includeB2BFields ? B2B_ORDER_FIELDS : ''}
      orderTotal {
        centAmount
        currencyCode
        fractionDigits
      }
      origin
      products {
        productItemName
        productItemPrice {
          centAmount
          currencyCode
          fractionDigits
        }
        productQuantity
      }
      tax {
        centAmount
        currencyCode
        fractionDigits
      }
      subTotal {
        centAmount
        currencyCode
        fractionDigits
      }
      mailingAddress {
        street
        city
        state
        stateCode
        postalCode
        country
        countryCode
      }
      billingAddress {
        street
        city
        state
        stateCode
        postalCode
        country
        countryCode
      }
      isSameAddress
    }
  }
`;
