type GetUserAccountQueryParams = {
  includeProduct?: boolean;
};

//prettier-ignore
export const GET_USER_ACCOUNT = ({ includeProduct }: GetUserAccountQueryParams) => `
  query SalesforceGetAccountData($externalId: String!, $email: String!, $syncAccountData: Boolean!${
    includeProduct ? `, $input: SalesforcePriceInput!` : ''
  }) {
    salesforceGetAccountData(externalId: $externalId, email: $email, syncAccountData: $syncAccountData) {
      firstName
      lastName
      phoneNumber
      email
      utmId
      utmCampaignId
      customerId
      prefix
      suffix
      nickname
      pronouns
      subscription {
        startDate
        renewalDate
      }
      isMember
      isCandidate
      isAssociate
      badges {
        id
        name
        awardedDate
        expiredDate
        status
        isActive
        badgeType {
          id
          name
          description
          icon
          image
          code
        }
      }
      cpes {
        badgeTypeName
        certName
        creditsApplied
        creditsNeeded
        endDate
        image
        percentComplete
        startDate
      }
      mailingAddress {
        street
        city
        stateCode
        postalCode
        country
        countryCode
      }
      billingAddress {
        street
        city
        stateCode
        postalCode
        country
        countryCode
      }
      isSameAddress
      employer
      jobTitle
      workPhone
      workEmail
      isGovernmentEmployee
      isGovernmentContractor
      certifications {
        id
        name
        status
        completionDate
        activeCertificationTerm {
          id
          startDate
          endDate
          gracePeriodEndDate
        }
        badgeType {
          id
          name
          description
          icon
          image
          code
        }
      }
      ${
        includeProduct
          ? `
        product {
          sku
          name
          variantName
          ctCustomerGroup
          prices(input: $input) {
            centAmount
            currencyCode
            fractionDigits
          }
        }
      `
          : ''
      }
    }
  }
`;
